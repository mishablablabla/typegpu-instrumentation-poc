/**
 * Device-level diagnostics tap (prototype). No TypeGPU code is involved: it monkeypatches the INSTANCE
 * methods of a GPUDevice / its GPUQueue / the objects it creates, so it works with anything that uses
 * that device (TypeGPU via `tgpu.initFromDevice({ device })`, raw WebGPU, other libraries).
 *
 * Properties of the design (all checked by alt/page/*.ts, see alt/RESULTS.md):
 *  - every wrapper calls the native method with the original `this` and returns the native result
 *    unchanged (object identity is preserved); async pipeline creation returns a derived promise;
 *  - everything is installed as an own, non-enumerable property and removed again by `restore()`;
 *  - state holds GPU objects only through WeakRef/WeakMap, events contain primitives only;
 *  - two taps can stack on one device and be restored in any order (inert-wrapper skipping).
 */

export type TapOptions = {
  /** Events kept for late subscribers. @default 256 */
  historySize?: number;
  /** Wrap command encoders / pass encoders (dispatch+draw counters per pipeline, finish events). Costs per-encoder own properties. @default true */
  passes?: boolean;
  /** Call `module.getCompilationInfo()` after each createShaderModule and emit `shader-diagnostics`. @default true */
  diagnostics?: boolean;
  /** Emit an event for every queue.writeBuffer / writeTexture (otherwise counters only). @default false */
  traceWrites?: boolean;
  /** Remove per-encoder/per-pass own properties as soon as the pass ends / the encoder finishes (restores a clean object, costs ~1 us per encoder). Without it they stay, inert after restore(), until the object is collected. @default true */
  stripTransient?: boolean;
  /** Pair TypeGPU's own `performance.measure('typegpu:resolution')` entries (only emitted by DEV builds with `globalThis.__TYPEGPU_MEASURE_PERF__ = true`) with the next createShaderModule to recover `resolveMs`. @default false */
  userTiming?: boolean;
};

export type TapEvent = {
  readonly v: 1;
  readonly seq: number;
  readonly t: number;
  readonly type: string;
  readonly [field: string]: unknown;
};

type Rec = {
  readonly id: number;
  readonly kind: string;
  readonly ref: WeakRef<object>;
  readonly created: string | null;
  readonly meta: Record<string, unknown>;
  writes: number;
  bytesWritten: number;
  dispatches: number;
  draws: number;
  destroyed: boolean;
};
type EncState = { id: number; passes: number; dispatches: number; draws: number };
type State = { active: boolean };

/** Identity of every wrapper we install, so a later tap can skip inert (restored) wrappers when it unwinds. */
const wrapperInfo = new WeakMap<Function, { state: State; previous: PropertyDescriptor | undefined; spent: boolean }>();

const COMPUTE_PASS_KEYS = ['setPipeline', 'dispatchWorkgroups', 'dispatchWorkgroupsIndirect', 'end'];
const RENDER_PASS_KEYS = ['setPipeline', 'draw', 'drawIndexed', 'drawIndirect', 'drawIndexedIndirect', 'end'];
const ENCODER_KEYS = ['beginComputePass', 'beginRenderPass', 'finish'];

export interface DeviceTap {
  readonly active: boolean;
  subscribe(listener: (e: TapEvent) => void): () => void;
  history(): readonly TapEvent[];
  snapshot(): Record<string, unknown>;
  /** Removes every installed property (device, queue, tracked objects) and clears history. Idempotent. */
  restore(): void;
  readonly __state: object;
}

/** Own small scope on purpose: V8 shares one context between closures of a scope, a closure created in tapDevice() would retain all of it. */
function watchLost(device: GPUDevice, ref: WeakRef<{ state: State; emit: (t: string, f: Record<string, unknown>) => void }>): void {
  void device.lost.then((info) => {
    const h = ref.deref();
    if (h?.state.active) h.emit('device-lost', { reason: info.reason, message: info.message });
  });
}

export function tapDevice(device: GPUDevice, options: TapOptions = {}): DeviceTap {
  const state: State = { active: true };
  const cap = Math.max(0, options.historySize ?? 256);
  const wantPasses = options.passes ?? true;
  const wantDiag = options.diagnostics ?? true;
  const traceWrites = options.traceWrites ?? false;
  const stripTransient = options.stripTransient ?? true;
  const userTiming = options.userTiming ?? false;
  let lastResolveStart = -1;

  let seq = 0;
  let nextId = 1;
  let ring: (TapEvent | undefined)[] = new Array(cap);
  let ringStart = 0;
  let ringLen = 0;
  let listeners: ((e: TapEvent) => void)[] = [];
  const counters = {
    submits: 0, commandBuffers: 0, encoders: 0, passes: 0, dispatches: 0, draws: 0,
    writeBufferCalls: 0, writeBufferBytes: 0, writeTextureCalls: 0, writeTextureBytes: 0,
    collectedWithoutDestroy: 0, droppedEvents: 0, listenerErrors: 0,
  };

  const recs = new WeakMap<object, Rec>(); // GPU object -> record
  const live = new Map<number, Rec>(); // not destroyed, not (yet) collected
  const viewToTexture = new WeakMap<object, object>();
  const cbStats = new WeakMap<object, EncState>();
  const openObjects = new Set<{ obj: object; keys: string[] }>(); // encoders/passes between begin and finish/end
  const finalizer = new FinalizationRegistry<number>((id) => {
    const rec = live.get(id);
    if (rec) {
      live.delete(id);
      if (!rec.destroyed && (rec.kind === 'buffer' || rec.kind === 'texture')) counters.collectedWithoutDestroy++;
    }
  });
  const undo: (() => void)[] = []; // device / queue level
  const now = () => performance.now();

  // ---- events ----
  function emit(type: string, fields: Record<string, unknown>): void {
    if (!state.active) return;
    const e = { v: 1, seq: ++seq, t: now(), type, ...fields } as TapEvent;
    if (cap > 0) {
      if (ringLen < cap) ring[(ringStart + ringLen++) % cap] = e;
      else {
        ring[ringStart] = e;
        ringStart = (ringStart + 1) % cap;
        counters.droppedEvents++;
      }
    }
    for (const l of listeners) {
      try { l(e); } catch { counters.listenerErrors++; }
    }
  }

  // ---- installing / removing own properties ----
  function install(target: object, key: string, make: (orig: Function) => Function): void {
    const previous = Object.getOwnPropertyDescriptor(target, key);
    const orig = (target as Record<string, Function>)[key] as Function;
    const wrapper = make(orig);
    wrapperInfo.set(wrapper, { state, previous, spent: false });
    Object.defineProperty(target, key, { value: wrapper, writable: true, configurable: true, enumerable: false });
    undo.push(() => uninstall(target, key, wrapper));
  }
  function uninstall(target: object, key: string, wrapper: Function): void {
    const info0 = wrapperInfo.get(wrapper);
    if (info0) info0.spent = true; // never resurrected by a tap that unwinds later
    const cur = Object.getOwnPropertyDescriptor(target, key);
    if (cur?.value !== wrapper) return; // someone wrapped over us: we stay in the chain, inert (state.active=false)
    let prev = wrapperInfo.get(wrapper)?.previous;
    // skip wrappers of taps that were restored out of order
    while (prev && typeof prev.value === 'function') {
      const info = wrapperInfo.get(prev.value as Function);
      if (!info || (info.state.active && !info.spent)) break;
      prev = info.previous;
    }
    if (prev) Object.defineProperty(target, key, prev);
    else delete (target as Record<string, unknown>)[key];
  }
  /** Per-object patches use the same mechanism but are removed eagerly (destroy / end / finish) or by key list on restore. */
  function stripKeys(obj: object, keys: string[]): void {
    for (const key of keys) {
      const d = Object.getOwnPropertyDescriptor(obj, key);
      const info = typeof d?.value === 'function' ? wrapperInfo.get(d.value as Function) : undefined;
      if (info?.state === state) uninstall(obj, key, d!.value as Function);
    }
  }
  function own(obj: object, key: string, fn: Function): void {
    const previous = Object.getOwnPropertyDescriptor(obj, key);
    wrapperInfo.set(fn, { state, previous, spent: false });
    Object.defineProperty(obj, key, { value: fn, writable: true, configurable: true, enumerable: false });
  }

  // ---- records ----
  function track(obj: object, kind: string, label: string | undefined, meta: Record<string, unknown>): Rec {
    const rec: Rec = {
      id: nextId++, kind, ref: new WeakRef(obj), created: label ?? null, meta,
      writes: 0, bytesWritten: 0, dispatches: 0, draws: 0, destroyed: false,
    };
    recs.set(obj, rec);
    live.set(rec.id, rec);
    finalizer.register(obj, rec.id);
    return rec;
  }
  const idOf = (o: unknown): number | null => (o && typeof o === 'object' ? (recs.get(o)?.id ?? null) : null);

  // Resource whose .destroy() we observe. `extraKeys` are patched too (textures: createView).
  function watchDestroy(obj: object, rec: Rec, extraKeys: string[] = []): void {
    const orig = (obj as { destroy: Function }).destroy;
    own(obj, 'destroy', function (this: object) {
      const first = !rec.destroyed;
      const r = orig.call(this);
      if (first && state.active) {
        rec.destroyed = true;
        live.delete(rec.id);
        emit('resource-destroyed', { resource: rec.kind, id: rec.id, label: (obj as { label?: string }).label ?? null });
      }
      stripKeys(obj, ['destroy', ...extraKeys]); // a destroyed object keeps no own properties
      return r;
    });
  }

  // ---- device methods ----
  const dev = device as unknown as Record<string, Function>;
  const queue = device.queue as unknown as Record<string, Function>;

  install(device, 'createBuffer', (orig) =>
    function (this: GPUDevice, desc: GPUBufferDescriptor) {
      const b = orig.call(this, desc) as GPUBuffer;
      if (!state.active) return b;
      const rec = track(b, 'buffer', desc?.label, { size: desc.size, usage: desc.usage });
      emit('buffer-created', { id: rec.id, label: desc?.label ?? null, sizeBytes: desc.size, usage: desc.usage, mappedAtCreation: !!desc.mappedAtCreation });
      watchDestroy(b, rec);
      return b;
    });

  install(device, 'createTexture', (orig) =>
    function (this: GPUDevice, desc: GPUTextureDescriptor) {
      const t = orig.call(this, desc) as GPUTexture;
      if (!state.active) return t;
      const size = Array.isArray(desc.size) ? [...desc.size] : desc.size && 'width' in desc.size ? [desc.size.width, desc.size.height ?? 1, desc.size.depthOrArrayLayers ?? 1] : desc.size;
      const rec = track(t, 'texture', desc.label, {});
      emit('texture-created', { id: rec.id, label: desc.label ?? null, format: desc.format, size, mipLevelCount: desc.mipLevelCount ?? 1, sampleCount: desc.sampleCount ?? 1, dimension: desc.dimension ?? '2d', usage: desc.usage });
      const origView = (t as unknown as { createView: Function }).createView;
      own(t, 'createView', function (this: GPUTexture, d?: GPUTextureViewDescriptor) {
        const v = origView.call(this, d) as object;
        if (state.active) viewToTexture.set(v, t);
        return v;
      });
      watchDestroy(t, rec, ['createView']);
      return t;
    });

  const identityOnly = (method: string, kind: string) =>
    install(device, method, (orig) =>
      function (this: GPUDevice, desc: Record<string, unknown>) {
        const o = orig.call(this, desc) as object;
        if (state.active) track(o, kind, desc?.label as string | undefined, {
          layouts: kind === 'pipeline-layout' ? ((desc?.bindGroupLayouts as unknown[]) ?? []).map(idOf) : undefined,
        });
        return o;
      });
  identityOnly('createBindGroupLayout', 'bind-group-layout');
  identityOnly('createPipelineLayout', 'pipeline-layout');
  identityOnly('createSampler', 'sampler');

  install(device, 'createQuerySet', (orig) =>
    function (this: GPUDevice, desc: GPUQuerySetDescriptor) {
      const q = orig.call(this, desc) as GPUQuerySet;
      if (state.active) {
        const rec = track(q, 'query-set', desc.label, {});
        emit('query-set-created', { id: rec.id, label: desc.label ?? null, queryType: desc.type, count: desc.count });
        watchDestroy(q, rec);
      }
      return q;
    });

  install(device, 'createShaderModule', (orig) =>
    function (this: GPUDevice, desc: GPUShaderModuleDescriptor) {
      const m = orig.call(this, desc) as GPUShaderModule;
      if (!state.active) return m;
      let resolveMs: number | null = null;
      if (userTiming) {
        const es = performance.getEntriesByName('typegpu:resolution', 'measure');
        const e = es[es.length - 1];
        if (e && e.startTime !== lastResolveStart && now() - (e.startTime + e.duration) < 100) { lastResolveStart = e.startTime; resolveMs = e.duration; }
      }
      const rec = track(m, 'shader-module', desc.label, { code: desc.code, resolveMs });
      emit('shader-module-created', { id: rec.id, label: desc.label ?? null, wgsl: desc.code, resolveMs });
      if (wantDiag) {
        m.getCompilationInfo().then(
          (info) => emit('shader-diagnostics', {
            moduleId: rec.id,
            messages: info.messages.map((x) => ({ type: x.type, message: x.message, lineNum: x.lineNum, linePos: x.linePos })),
          }),
          () => {},
        );
      }
      return m;
    });

  function pipelineFields(desc: Record<string, any>, kind: 'compute' | 'render') {
    const stages = kind === 'compute' ? [desc.compute] : [desc.vertex, desc.fragment];
    const moduleIds = stages.filter(Boolean).map((s: any) => idOf(s.module));
    const layout = desc.layout === 'auto' ? 'auto' : idOf(desc.layout);
    const wgsl = moduleIds.length ? (recs.get(stages[0].module)?.meta.code as string | undefined) ?? null : null;
    return { moduleIds, layout, bindGroupLayoutIds: layout === 'auto' ? null : ((recs.get(desc.layout)?.meta.layouts as unknown[]) ?? null), label: (desc.label as string | undefined) ?? null, wgsl, resolveMs: (recs.get(stages[0]?.module)?.meta.resolveMs as number | null | undefined) ?? null };
  }
  function registerPipeline(p: object, kind: 'compute' | 'render', desc: Record<string, any>, mode: 'sync' | 'async', createMs: number) {
    const f = pipelineFields(desc, kind);
    const rec = track(p, `${kind}-pipeline`, desc.label, { wgsl: f.wgsl, moduleIds: f.moduleIds, mode, createMs });
    emit('pipeline-created', { id: rec.id, pipeline: kind, mode, createMs, ...f });
  }
  for (const kind of ['compute', 'render'] as const) {
    const sync = kind === 'compute' ? 'createComputePipeline' : 'createRenderPipeline';
    install(device, sync, (orig) =>
      function (this: GPUDevice, desc: Record<string, any>) {
        const t0 = now();
        const p = orig.call(this, desc) as object;
        if (state.active) registerPipeline(p, kind, desc, 'sync', now() - t0);
        return p;
      });
    install(device, `${sync}Async`, (orig) =>
      function (this: GPUDevice, desc: Record<string, any>) {
        const t0 = now();
        // a derived promise: rejections stay unhandled-if-unhandled, errors are rethrown unchanged
        return (orig.call(this, desc) as Promise<object>).then(
          (p) => { if (state.active) registerPipeline(p, kind, desc, 'async', now() - t0); return p; },
          (e) => {
            if (state.active) emit('pipeline-failed', { pipeline: kind, mode: 'async', createMs: now() - t0, errorType: e?.constructor?.name, message: String(e?.message), ...pipelineFields(desc, kind) });
            throw e;
          },
        );
      });
  }

  install(device, 'createBindGroup', (orig) =>
    function (this: GPUDevice, desc: GPUBindGroupDescriptor) {
      const g = orig.call(this, desc) as GPUBindGroup;
      if (!state.active) return g;
      const entries = [...desc.entries].map((e) => {
        const r = e.resource as any;
        if (r && 'buffer' in r) return { binding: e.binding, kind: 'buffer', resourceId: idOf(r.buffer), offset: r.offset ?? 0, size: r.size ?? null };
        const tex = viewToTexture.get(r);
        if (tex) return { binding: e.binding, kind: 'texture-view', resourceId: idOf(tex) };
        return { binding: e.binding, kind: recs.get(r)?.kind ?? 'other', resourceId: idOf(r) };
      });
      const rec = track(g, 'bind-group', desc.label, {});
      emit('bind-group-created', { id: rec.id, label: desc.label ?? null, layoutId: idOf(desc.layout), layoutLabel: recs.get(desc.layout)?.created ?? null, entries });
      return g;
    });

  // ---- encoders and passes (optional) ----
  if (wantPasses) {
    install(device, 'createCommandEncoder', (orig) =>
      function (this: GPUDevice, d?: GPUCommandEncoderDescriptor) {
        const enc = orig.call(this, d) as GPUCommandEncoder;
        if (!state.active) return enc;
        const st: EncState = { id: nextId++, passes: 0, dispatches: 0, draws: 0 };
        counters.encoders++;
        const e = enc as unknown as Record<string, Function>;
        const open = { obj: enc as object, keys: ENCODER_KEYS };
        openObjects.add(open);
        const beginC = e.beginComputePass!;
        const beginR = e.beginRenderPass!;
        const fin = e.finish!;
        own(enc, 'beginComputePass', function (this: GPUCommandEncoder, pd?: unknown) {
          const pass = beginC.call(this, pd) as object;
          if (state.active) wrapPass(pass, st, 'compute');
          return pass;
        });
        own(enc, 'beginRenderPass', function (this: GPUCommandEncoder, pd: unknown) {
          const pass = beginR.call(this, pd) as object;
          if (state.active) wrapPass(pass, st, 'render');
          return pass;
        });
        own(enc, 'finish', function (this: GPUCommandEncoder, fd?: unknown) {
          const cb = fin.call(this, fd) as object;
          openObjects.delete(open);
          if (stripTransient) stripKeys(enc, ENCODER_KEYS);
          if (state.active) {
            cbStats.set(cb, st);
            emit('encoder-finished', { encoderId: st.id, passes: st.passes, dispatches: st.dispatches, draws: st.draws, label: (enc as { label?: string }).label ?? null });
          }
          return cb;
        });
        return enc;
      });
  }
  function wrapPass(pass: object, st: EncState, kind: 'compute' | 'render'): void {
    st.passes++;
    counters.passes++;
    const keys = kind === 'compute' ? COMPUTE_PASS_KEYS : RENDER_PASS_KEYS;
    const open = { obj: pass, keys };
    openObjects.add(open);
    const p = pass as unknown as Record<string, Function>;
    let cur: Rec | undefined;
    const setPipeline = p.setPipeline!;
    const end = p.end!;
    own(pass, 'setPipeline', function (this: object, pl: object) { cur = recs.get(pl); return setPipeline.call(this, pl); });
    if (kind === 'compute') {
      const dw = p.dispatchWorkgroups!;
      const dwi = p.dispatchWorkgroupsIndirect!;
      own(pass, 'dispatchWorkgroups', function (this: object, x: number, y: number, z: number) { if (cur) cur.dispatches++; st.dispatches++; counters.dispatches++; return dw.call(this, x, y, z); });
      own(pass, 'dispatchWorkgroupsIndirect', function (this: object, b: object, o: number) { if (cur) cur.dispatches++; st.dispatches++; counters.dispatches++; return dwi.call(this, b, o); });
    } else {
      for (const k of ['draw', 'drawIndexed', 'drawIndirect', 'drawIndexedIndirect']) {
        const f = p[k]!;
        own(pass, k, function (this: object, a: unknown, b: unknown, c: unknown, d: unknown, e: unknown) { if (cur) cur.draws++; st.draws++; counters.draws++; return f.call(this, a, b, c, d, e); });
      }
    }
    own(pass, 'end', function (this: object) {
      const r = end.call(this);
      openObjects.delete(open);
      if (stripTransient) stripKeys(pass, keys);
      return r;
    });
  }

  // ---- queue ----
  install(queue, 'submit', (orig) =>
    function (this: GPUQueue, cbs: Iterable<GPUCommandBuffer>) {
      if (state.active) {
        const list = [...cbs];
        let dispatches = 0, draws = 0;
        const encoderIds: number[] = [];
        for (const cb of list) {
          const s = cbStats.get(cb);
          if (s) { dispatches += s.dispatches; draws += s.draws; encoderIds.push(s.id); }
        }
        counters.submits++;
        counters.commandBuffers += list.length;
        emit('queue-submit', { commandBuffers: list.length, encoderIds, dispatches, draws });
        return orig.call(this, list);
      }
      return orig.call(this, cbs);
    });
  install(queue, 'writeBuffer', (orig) =>
    function (this: GPUQueue, buffer: GPUBuffer, offset: number, data: BufferSource, dataOffset?: number, size?: number) {
      if (state.active) {
        const per = (data as { BYTES_PER_ELEMENT?: number }).BYTES_PER_ELEMENT ?? 1;
        const bytes = size !== undefined ? size * per : data.byteLength - (dataOffset ?? 0) * per;
        const rec = recs.get(buffer);
        if (rec) { rec.writes++; rec.bytesWritten += bytes; }
        counters.writeBufferCalls++;
        counters.writeBufferBytes += bytes;
        if (traceWrites) emit('queue-writeBuffer', { bufferId: rec?.id ?? null, offset, bytes });
      }
      return orig.call(this, buffer, offset, data, dataOffset, size);
    });
  install(queue, 'writeTexture', (orig) =>
    function (this: GPUQueue, dest: GPUTexelCopyTextureInfo, data: BufferSource, layout: unknown, size: unknown) {
      if (state.active) {
        counters.writeTextureCalls++;
        counters.writeTextureBytes += data.byteLength;
        if (traceWrites) emit('queue-writeTexture', { textureId: idOf(dest.texture), bytes: data.byteLength, mipLevel: dest.mipLevel ?? 0 });
      }
      return orig.call(this, dest, data, layout, size);
    });

  // ---- device errors, destroy, loss ----
  const onError = (ev: Event) => {
    const e = (ev as GPUUncapturedErrorEvent).error;
    emit('device-error', { errorType: e?.constructor?.name, message: e?.message });
  };
  device.addEventListener('uncapturederror', onError);
  undo.push(() => device.removeEventListener('uncapturederror', onError));
  install(device, 'destroy', (orig) =>
    function (this: GPUDevice) {
      if (state.active) {
        const kinds = [...live.values()].filter((r) => r.ref.deref() !== undefined);
        emit('device-destroy-called', { liveBuffers: kinds.filter((r) => r.kind === 'buffer').length, liveTextures: kinds.filter((r) => r.kind === 'texture').length });
      }
      return orig.call(this);
    });
  // `lost` reactions cannot be removed: hold the tap state only weakly so a dropped tap is collectable.
  const holder = { state, emit };
  watchLost(device, new WeakRef(holder));

  return {
    get active() { return holder.state.active; },
    get __state() { return state; }, // test probe: lets the harness weakly observe the tap's lifetime
    subscribe(l) {
      listeners = [...listeners, l];
      return () => { listeners = listeners.filter((x) => x !== l); };
    },
    history() {
      return Array.from({ length: ringLen }, (_, i) => ring[(ringStart + i) % cap] as TapEvent);
    },
    snapshot() {
      const resources: unknown[] = [];
      const bindGroups: unknown[] = [];
      const pipelines: unknown[] = [];
      for (const rec of live.values()) {
        const obj = rec.ref.deref() as { label?: string } | undefined;
        if (!obj) continue;
        const base = { id: rec.id, label: obj.label ?? null, createdLabel: rec.created };
        if (rec.kind === 'buffer') resources.push({ ...base, resource: 'buffer', sizeBytes: rec.meta.size, usage: rec.meta.usage, writes: rec.writes, bytesWritten: rec.bytesWritten });
        else if (rec.kind === 'texture') resources.push({ ...base, resource: 'texture' });
        else if (rec.kind === 'bind-group') bindGroups.push(base);
        else if (rec.kind.endsWith('-pipeline') && rec.kind !== 'pipeline-layout') pipelines.push({ ...base, pipeline: rec.kind.split('-')[0], mode: rec.meta.mode, createMs: rec.meta.createMs, wgsl: rec.meta.wgsl, dispatches: rec.dispatches, draws: rec.draws });
      }
      return {
        v: 1, t: now(), active: state.active, resources, bindGroups, pipelines, counters: { ...counters },
        unavailable: ['gpuExecutionTime', 'gpuMemoryUsage', 'tgpuResolveTime', 'tgpuTrigger(lazy|initSync)', 'tgpuBindGroupEntryNames', 'tgpuHandleIdentity'],
      };
    },
    restore() {
      if (!state.active) return;
      for (const { obj, keys } of openObjects) stripKeys(obj, keys);
      openObjects.clear();
      for (const rec of live.values()) { // still-live resources keep destroy/createView wrappers until now
        const obj = rec.ref.deref();
        if (obj) stripKeys(obj, ['destroy', 'createView']);
      }
      state.active = false;
      for (const u of undo.reverse()) u();
      undo.length = 0;
      live.clear();
      ring = [];
      ringLen = 0;
      listeners = [];
      void dev; void queue;
    },
  };
}
