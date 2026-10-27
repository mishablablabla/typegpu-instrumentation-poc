/**
 * Viability-style workload against UNMODIFIED TypeGPU, observed only through the device tap.
 * Mirrors real-gpu/page/viability.ts (resources, compute-bindgroups, render, explicit-init, sync-failures,
 * async-failures) and adds what the hook layer cannot see (wrapped/raw/helper/encoder paths), reversibility,
 * stacking, risk probes and retention.
 */
import { d, tgpu } from 'typegpu';
import { type DeviceTap, type TapEvent, type TapOptions, tapDevice } from '../src/deviceTap.ts';
import { provenance } from '../../real-gpu/page/provenance.ts';

type Finding = { scenario: string; check: string; pass: boolean; detail?: unknown };
const findings: Finding[] = [];
let current = '';
const check = (name: string, pass: boolean, detail?: unknown) =>
  findings.push({ scenario: current, check: name, pass, detail });
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const ofType = (events: readonly TapEvent[], type: string) => events.filter((e) => e.type === type);
const types = (events: readonly TapEvent[]) => events.map((e) => e.type);
const strip = (e: TapEvent) => ({ ...e, wgsl: typeof e.wgsl === 'string' ? `<${e.wgsl.length} chars>` : e.wgsl });

// ---- the same programs as viability.ts ----
const layout = tgpu.bindGroupLayout({
  data: { storage: d.arrayOf(d.f32, 8), access: 'mutable' },
  factor: { uniform: d.f32 },
});
const scale = tgpu.computeFn({ workgroupSize: [8], in: { gid: d.builtin.globalInvocationId } })(({ gid }) => {
  'use gpu';
  layout.$.data[gid.x] = (layout.$.data[gid.x] as number) * layout.$.factor;
});
const noop = tgpu.computeFn({ workgroupSize: [1] })`{}`;
const vertexFull = tgpu.vertexFn({ in: { idx: d.builtin.vertexIndex }, out: { pos: d.builtin.position } })(({ idx }) => {
  'use gpu';
  return { pos: d.vec4f(d.f32(idx & 1) * 4 - 1, d.f32(idx >> 1) * 4 - 1, 0, 1) };
});
const fragmentRed = tgpu.fragmentFn({ out: d.vec4f })(() => {
  'use gpu';
  return d.vec4f(1, 0, 0, 1);
});
const brokenCompute = tgpu.computeFn({ workgroupSize: [1] })`{ let x = definitelyUndeclared(1.0); }`;
const brokenFragment = tgpu.fragmentFn({ out: d.vec4f })`{ return definitelyUndeclared; }`;

// ---- session helper ----
type Session = {
  device: GPUDevice;
  tap: DeviceTap;
  root: ReturnType<typeof tgpu.initFromDevice>;
  events: TapEvent[];
  raw: object[]; // raw GPU objects whose own properties are checked after restore
};
const newDevice = async () => (await navigator.gpu.requestAdapter())!.requestDevice(); // an adapter is single-use
async function open(opts?: TapOptions): Promise<Session> {
  const device = await newDevice();
  const tap = tapDevice(device, { historySize: 4096, ...opts });
  const events: TapEvent[] = [];
  tap.subscribe((e) => events.push(e));
  return { device, tap, root: tgpu.initFromDevice({ device }), events, raw: [] };
}
const ownProps = (o: object) => Object.getOwnPropertyNames(o);
async function close(s: Session, name: string) {
  await s.device.queue.onSubmittedWorkDone();
  await sleep(200); // diagnostics settle
  const snapshot = s.tap.snapshot();
  s.root.destroy();
  s.device.destroy();
  for (let i = 0; i < 40 && !s.events.some((e) => e.type === 'device-lost'); i++) await sleep(25);
  const beforeRestore = { device: ownProps(s.device), queue: ownProps(s.device.queue), raw: s.raw.map(ownProps) };
  s.tap.restore();
  const after = { device: ownProps(s.device), queue: ownProps(s.device.queue), raw: s.raw.map(ownProps) };
  check('restore(): no own properties left on device, queue or tracked objects',
    after.device.length === 0 && after.queue.length === 0 && after.raw.every((p) => p.length === 0), { beforeRestore, after });
  check('restore(): methods are the native prototype methods again',
    s.device.createBuffer === GPUDevice.prototype.createBuffer && s.device.queue.submit === GPUQueue.prototype.submit);
  evidence[name] = { eventTypes: types(s.events), events: s.events.slice(0, 120).map(strip), snapshot: { ...snapshot, pipelines: (snapshot.pipelines as any[]).map((p) => ({ ...p, wgsl: p.wgsl ? `<${p.wgsl.length} chars>` : null })) } };
  return snapshot as any;
}
const evidence: Record<string, unknown> = {};

// ---- scenarios ----
async function resources() {
  current = 'resources';
  const s = await open();
  const buf = s.root.createBuffer(d.arrayOf(d.u32, 4)).$usage('storage').$name('buf');
  buf.write([1, 2, 3, 4]);
  const tex = s.root.createTexture({ size: [8, 8], format: 'rgba8unorm' }).$usage('sampled', 'render').$name('tex');
  const rawTex = s.root.unwrap(tex);
  const keep = s.root.createBuffer(d.f32).$usage('uniform').$name('keep');
  s.root.unwrap(keep);
  const rawBuf = s.root.unwrap(buf) as GPUBuffer;
  s.raw.push(rawBuf, rawTex);
  buf.destroy();
  buf.destroy();
  tex.destroy();
  let threw = false;
  try { buf.write([9, 9, 9, 9]); } catch { threw = true; }
  const snap = await close(s, current);
  const ev = s.events;
  check('event sequence: buffer, texture, buffer, destroy x2, device-destroy-called, device-lost (no extra kinds)',
    same(types(ev).filter((t) => t !== 'shader-diagnostics'),
      ['buffer-created', 'texture-created', 'buffer-created', 'resource-destroyed', 'resource-destroyed', 'device-destroy-called', 'device-lost']), types(ev));
  const [b0, t0] = [ofType(ev, 'buffer-created')[0]!, ofType(ev, 'texture-created')[0]!];
  check('buffer payload: label, size, usage flags', b0.label === 'buf' && b0.sizeBytes === 16 && b0.usage === (GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC), strip(b0));
  check('texture payload: label, format, size, mips, samples, dimension, usage', t0.label === 'tex' && t0.format === 'rgba8unorm' && same(t0.size, [8, 8]) && t0.mipLevelCount === 1 && t0.sampleCount === 1 && t0.dimension === '2d'
    && t0.usage === (GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC), strip(t0));
  check('destroy events name the right resources, once each (second buf.destroy() silent)', same(ofType(ev, 'resource-destroyed').map((e) => e.id), [b0.id, t0.id]));
  check('device-destroy-called reports the survivor (1 buffer, 0 textures)', ofType(ev, 'device-destroy-called')[0]?.liveBuffers === 1 && ofType(ev, 'device-destroy-called')[0]?.liveTextures === 0, ofType(ev, 'device-destroy-called'));
  check('snapshot before teardown lists only the survivor', (snap.resources as any[]).length === 1 && (snap.resources as any[])[0].label === 'keep', snap.resources);
  check('writes counted through queue.writeBuffer: buf had 1 write of 16 bytes (counter visible even after destroy via event/log? live record only)', (snap.counters as any).writeBufferCalls === 1 && (snap.counters as any).writeBufferBytes === 16, snap.counters);
  check('write after destroy throws (TypeGPU) and emits nothing', threw && ofType(ev, 'buffer-created').length === 2);
  check('stable device-lost reason', ofType(ev, 'device-lost')[0]?.reason === 'destroyed', ofType(ev, 'device-lost'));
}

async function computeBindGroups() {
  current = 'compute-bindgroups';
  const s = await open();
  const data1 = s.root.createBuffer(d.arrayOf(d.f32, 8), [1, 2, 3, 4, 5, 6, 7, 8]).$usage('storage').$name('data1');
  const data2 = s.root.createBuffer(d.arrayOf(d.f32, 8), [1, 2, 3, 4, 5, 6, 7, 8]).$usage('storage').$name('data2');
  const factor = s.root.createBuffer(d.f32, 2).$usage('uniform').$name('factor');
  const bg1 = s.root.createBindGroup(layout, { data: data1, factor });
  const bg2 = s.root.createBindGroup(layout, { data: data2, factor });
  const pipeline = s.root.createComputePipeline({ compute: scale }).$name('scale');
  for (let i = 0; i < 3; i++) pipeline.with(bg1).dispatchWorkgroups(1);
  for (let i = 0; i < 2; i++) pipeline.with(bg2).dispatchWorkgroups(1);
  const r1 = await data1.read();
  const r2 = await data2.read();
  s.raw.push(s.root.unwrap(data1), s.root.unwrap(factor));
  const snap = await close(s, current);
  const ev = s.events;
  check('GPU really ran every dispatch', same(r1, [8, 16, 24, 32, 40, 48, 56, 64]) && same(r2, [4, 8, 12, 16, 20, 24, 28, 32]), { r1, r2 });
  const created = ofType(ev, 'pipeline-created');
  check('one pipeline created for five dispatches over two handles; label is the TypeGPU name; mode sync', created.length === 1 && created[0]!.label === 'scale' && created[0]!.mode === 'sync' && created[0]!.pipeline === 'compute', created.map(strip));
  check('pipeline event carries the WGSL (via its shader module) and entry stage', typeof created[0]?.wgsl === 'string' && /@compute/.test(created[0]!.wgsl as string));
  const mats = ofType(ev, 'buffer-created');
  const [g1, g2] = ofType(ev, 'bind-group-created');
  const e1 = g1!.entries as any[];
  const e2 = g2!.entries as any[];
  const idOf = (label: string) => mats.find((m) => m.label === label)?.id;
  check('bind group 1: binding0->data1, binding1->factor (by BINDING INDEX, names lost)', e1[0].resourceId === idOf('data1') && e1[1].resourceId === idOf('factor'), g1);
  check('bind group 2: binding0->data2 and the SAME factor id', e2[0].resourceId === idOf('data2') && e2[1].resourceId === idOf('factor'), g2);
  check('both groups share one layout id, and it appears in the pipeline layout', g1!.layoutId === g2!.layoutId && g1!.layoutId !== null && same(created[0]!.bindGroupLayoutIds, [g1!.layoutId]), { g1: g1!.layoutId, pl: created[0]!.bindGroupLayoutIds });
  const p = (snap.pipelines as any[]).find((x) => x.label === 'scale');
  check('per-pipeline counters: 5 dispatches', p?.dispatches === 5 && p.draws === 0, p && { ...p, wgsl: undefined });
  check('submits: 5 dispatch + 2 read() helper submits = 7 (PoC counts 5)', (snap.counters as any).submits === 7, snap.counters);
  check('diagnostics: one shader-diagnostics, empty', ofType(ev, 'shader-diagnostics').length === 1 && (ofType(ev, 'shader-diagnostics')[0]!.messages as any[]).length === 0);
  check('buffer writes: factor never written; data buffers were mappedAtCreation (initial data): invisible to writeBuffer counters', (snap.counters as any).writeBufferCalls === 0 && mats.filter((m) => m.mappedAtCreation).length === 3);
}

async function render() {
  current = 'render';
  const s = await open();
  const target = s.root.createTexture({ size: [8, 8], format: 'rgba8unorm' }).$usage('render').$name('target');
  const pipeline = s.root.createRenderPipeline({ vertex: vertexFull, fragment: fragmentRed, targets: { format: 'rgba8unorm' } }).$name('triangle');
  const a = pipeline.withColorAttachment({ view: target, loadOp: 'clear', storeOp: 'store' });
  const b = pipeline.withColorAttachment({ view: target, loadOp: 'load', storeOp: 'store' });
  a.draw(3); a.draw(3); b.draw(3);
  // raw readback: NEW coverage (PoC cannot see any of this)
  const readback = s.device.createBuffer({ label: 'readback', size: 256 * 8, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
  const enc = s.device.createCommandEncoder({ label: 'readbackEncoder' });
  enc.copyTextureToBuffer({ texture: s.root.unwrap(target) }, { buffer: readback, bytesPerRow: 256 }, [8, 8, 1]);
  s.device.queue.submit([enc.finish()]);
  await readback.mapAsync(GPUMapMode.READ);
  const pixel = [...new Uint8Array(readback.getMappedRange(0, 4))];
  readback.destroy();
  const snap = await close(s, current);
  const ev = s.events;
  check('red pixel read back', same(pixel, [255, 0, 0, 255]), pixel);
  const created = ofType(ev, 'pipeline-created');
  check('render pipeline created once, lazily (mode sync), vertex+fragment WGSL', created.length === 1 && created[0]!.pipeline === 'render' && /@vertex/.test(created[0]!.wgsl as string) && /@fragment/.test(created[0]!.wgsl as string) && created[0]!.label === 'triangle', created.map(strip));
  const p = (snap.pipelines as any[]).find((x) => x.label === 'triangle');
  check('per-pipeline counters: 3 draws', p?.draws === 3 && p.dispatches === 0);
  check('submits: 3 TypeGPU draws + 1 raw readback submit = 4; PoC cannot count the raw one', (snap.counters as any).submits === 4, snap.counters);
  check('the RAW readback buffer was seen (label readback) and its destroy', ofType(ev, 'buffer-created').some((e) => e.label === 'readback') && ofType(ev, 'resource-destroyed').some((e) => e.label === 'readback'));
  check('raw encoder finish observed', ofType(ev, 'encoder-finished').some((e) => e.label === 'readbackEncoder'));
}

async function explicitInit() {
  current = 'explicit-init';
  const s = await open();
  const c = s.root.createComputePipeline({ compute: noop }).$name('explicitSync');
  c.initSync();
  const target = s.root.createTexture({ size: [4, 4], format: 'rgba8unorm' }).$usage('render').$name('t');
  const r = s.root.createRenderPipeline({ vertex: vertexFull, fragment: fragmentRed, targets: { format: 'rgba8unorm' } }).$name('explicitAsync');
  await r.initAsync();
  c.dispatchWorkgroups(1);
  r.withColorAttachment({ view: target, loadOp: 'clear', storeOp: 'store' }).draw(3);
  const lazy = s.root.createComputePipeline({ compute: noop }).$name('lazyOne');
  lazy.dispatchWorkgroups(1);
  await close(s, current);
  const created = ofType(s.events, 'pipeline-created');
  check('three pipelines created; modes: sync (initSync), async (initAsync), sync (lazy)', same(created.map((e) => [e.label, e.mode]), [['explicitSync', 'sync'], ['explicitAsync', 'async'], ['lazyOne', 'sync']]), created.map(strip));
  const f = (e: TapEvent) => ({ ...strip(e), id: 0, t: 0, seq: 0, label: 0, createMs: 0, moduleIds: 0, layout: 0, bindGroupLayoutIds: 0 });
  check('initSync and lazy are INDISTINGUISHABLE at device level (same event shape/payload)', same(f(created[0]!), f(created[2]!)));
  check('no recompile on dispatch/draw after explicit init', created.length === 3);
}

async function syncFailures() {
  current = 'sync-failures';
  const s = await open();
  const c = s.root.createComputePipeline({ compute: brokenCompute }).$name('brokenCompute');
  c.initSync();
  await s.device.queue.onSubmittedWorkDone();
  await sleep(100);
  const r = s.root.createRenderPipeline({ vertex: vertexFull, fragment: brokenFragment, targets: { format: 'rgba8unorm' } }).$name('brokenRender');
  r.initSync();
  await close(s, current);
  const ev = s.events;
  const created = ofType(ev, 'pipeline-created');
  check('both invalid sync pipelines reported as created (same limitation as PoC)', created.length === 2 && created.every((e) => e.mode === 'sync'));
  const diags = ofType(ev, 'shader-diagnostics');
  const modules = ofType(ev, 'shader-module-created');
  check('compiler ERROR with line pointing at the offending generated WGSL line, per shader module',
    modules.filter((m) => (m.wgsl as string).includes('definitelyUndeclared')).every((m) => diags.some((x) => x.moduleId === m.id && (x.messages as any[]).some((q) => q.type === 'error' && ((m.wgsl as string).split('\n')[q.lineNum - 1] ?? '').includes('definitelyUndeclared')))),
    diags.map((x) => x.messages));
  const errors = ofType(ev, 'device-error');
  check('device errors name the identifier', errors.length >= 2 && errors.some((e) => String(e.message).includes('definitelyUndeclared')), errors.map((e) => String(e.message).split('\n')[0]));
  check('no pipeline-failed on sync path', ofType(ev, 'pipeline-failed').length === 0);
}

async function asyncFailures() {
  current = 'async-failures';
  const s = await open();
  const rej: string[] = [];
  try { await s.root.createComputePipeline({ compute: brokenCompute }).$name('asyncCompute').initAsync(); } catch (e) { rej.push((e as Error).constructor.name); }
  try { await s.root.createRenderPipeline({ vertex: vertexFull, fragment: brokenFragment, targets: { format: 'rgba8unorm' } }).$name('asyncRender').initAsync(); } catch (e) { rej.push((e as Error).constructor.name); }
  const snap = await close(s, current);
  const ev = s.events;
  check('both creations rejected with GPUPipelineError (rejection preserved through our derived promise)', same(rej, ['GPUPipelineError', 'GPUPipelineError']), rej);
  const failed = ofType(ev, 'pipeline-failed');
  check('one pipeline-failed per failure, compute then render, GPUPipelineError, labels from TypeGPU names', failed.length === 2 && same(failed.map((f) => f.pipeline), ['compute', 'render']) && same(failed.map((f) => f.label), ['asyncCompute', 'asyncRender']) && failed.every((f) => f.errorType === 'GPUPipelineError'), failed.map(strip));
  check('no pipeline-created for failed async', ofType(ev, 'pipeline-created').length === 0);
  check('failed pipelines not listed as live', (snap.pipelines as any[]).length === 0);
  check('diagnostics per module with errors', ofType(ev, 'shader-diagnostics').filter((x) => (x.messages as any[]).some((m) => m.type === 'error')).length >= 2);
}

/** What the TypeGPU hook layer cannot see. */
async function newCoverage() {
  current = 'new-coverage';
  const s = await open();
  const { device, root } = s;
  // wrapped (adopted) raw buffer
  const rawStorage = device.createBuffer({ label: 'rawStorage', size: 32, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST });
  const wrapped = root.createBuffer(d.arrayOf(d.f32, 8), rawStorage).$usage('storage');
  const factor = root.createBuffer(d.f32, 3).$usage('uniform').$name('factor');
  const bg = root.createBindGroup(layout, { data: wrapped, factor });
  const pipeline = root.createComputePipeline({ compute: scale }).$name('scaleWrapped');
  pipeline.with(bg).dispatchWorkgroups(1);
  // helper submissions
  const other = root.createBuffer(d.arrayOf(d.f32, 8)).$usage('storage').$name('other');
  (other as any).clear();
  (wrapped as any).copyFrom(other);
  await wrapped.read();
  const tex = root.createTexture({ size: [8, 8], format: 'rgba8unorm', mipLevelCount: 3 }).$usage('sampled', 'render').$name('mipTex');
  (tex as any).clear();
  (tex as any).write(new Uint8Array(8 * 8 * 4));
  (tex as any).generateMipmaps();
  // TypeGPU encoder + finish() + raw submit
  const tenc = root['~unstable'].createCommandEncoder();
  const tpass = tenc.beginComputePass();
  pipeline.with(tpass).with(bg).dispatchWorkgroups(1);
  tpass.end();
  const cb = tenc.finish();
  device.queue.submit([cb]);
  // fully raw compute
  const code = `@group(0) @binding(0) var<storage, read_write> a: array<f32>;
@compute @workgroup_size(1) fn main(@builtin(global_invocation_id) id: vec3u) { a[id.x] = a[id.x] + 1.0; }`;
  const rp = device.createComputePipeline({ label: 'rawPipe', layout: 'auto', compute: { module: device.createShaderModule({ label: 'rawShader', code }), entryPoint: 'main' } });
  const rbuf = device.createBuffer({ label: 'rawBuf2', size: 16, usage: GPUBufferUsage.STORAGE });
  const rbg = device.createBindGroup({ label: 'rawBG', layout: rp.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: rbuf } }] });
  const enc = device.createCommandEncoder({ label: 'rawEnc' });
  const pass = enc.beginComputePass();
  s.raw.push(enc, pass, rbuf, rawStorage);
  pass.setPipeline(rp); pass.setBindGroup(0, rbg); pass.dispatchWorkgroups(4); pass.dispatchWorkgroups(2);
  const midPassOwn = ownProps(pass).length + ownProps(enc).length; // wrappers present while recording
  pass.end();
  const rcb = enc.finish();
  device.queue.submit([rcb]);
  device.queue.writeBuffer(rbuf, 0, new Float32Array([1, 2, 3, 4]));
  const rtex = device.createTexture({ label: 'rawTex', size: [4, 4], format: 'rgba8unorm', usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING });
  device.queue.writeTexture({ texture: rtex }, new Uint8Array(4 * 4 * 4), { bytesPerRow: 16 }, [4, 4]);
  const view = rtex.createView({ label: 'rawView' });
  const smp = device.createSampler({ label: 'rawSampler' });
  const bgl = device.createBindGroupLayout({ label: 'rawBGL', entries: [{ binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: {} }, { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {} }] });
  device.createBindGroup({ label: 'rawTexBG', layout: bgl, entries: [{ binding: 0, resource: view }, { binding: 1, resource: smp }] });
  const snap = await close(s, current);
  const ev = s.events;
  const bufLabels = ofType(ev, 'buffer-created').map((e) => e.label);
  check('wrapped raw buffer is visible (label rawStorage) and referenced by a bind group entry', bufLabels.includes('rawStorage') && ofType(ev, 'bind-group-created').some((g) => (g.entries as any[]).some((e) => e.resourceId === ofType(ev, 'buffer-created').find((b) => b.label === 'rawStorage')?.id)), bufLabels);
  const submits = ofType(ev, 'queue-submit');
  check('submissions visible: 1 dispatch + buf.clear + copyFrom + read() + generateMipmaps(1 submit, 2 render passes) + TypeGPU-encoder finish + raw compute = 7 (tex.clear/tex.write use queue.writeTexture, not submit)', (snap.counters as any).submits === 7, { submits: (snap.counters as any).submits });
  check('internal resources created by TypeGPU helpers are visible (mipmap pipeline / shaders with no TypeGPU label)', ofType(ev, 'pipeline-created').some((p) => p.pipeline === 'render' && (p.label === null || p.label === '<unnamed>' || p.label === undefined)) || ofType(ev, 'shader-module-created').length >= 2, ofType(ev, 'pipeline-created').map((p) => [p.pipeline, p.label]));
  check('encoder.finish() path (TypeGPU encoder + raw queue.submit) observed', ofType(ev, 'encoder-finished').length >= 3 && submits.some((q) => q.dispatches === 1 && (q.commandBuffers as number) === 1), submits.slice(-6));
  check('raw compute pass: dispatches counted on the raw pipeline (2 dispatches, label rawPipe)', (snap.pipelines as any[]).find((p) => p.label === 'rawPipe')?.dispatches === 2, (snap.pipelines as any[]).map((p) => [p.label, p.dispatches]));
  check('queue.writeTexture counted (TypeGPU tex.write + raw)', (snap.counters as any).writeTextureCalls === 5, snap.counters);
  check('raw bind group with texture view + sampler: view resolved to texture id, sampler kind', (() => { const g = ofType(ev, 'bind-group-created').find((x) => x.label === 'rawTexBG'); const e = (g?.entries as any[]) ?? []; return e[0]?.kind === 'texture-view' && e[0].resourceId === ofType(ev, 'texture-created').find((t) => t.label === 'rawTex')?.id && e[1]?.kind === 'sampler'; })(), ofType(ev, 'bind-group-created').find((x) => x.label === 'rawTexBG'));
  check('raw bind group over an AUTO layout has layoutId null (getBindGroupLayout is not a creation call)', ofType(ev, 'bind-group-created').find((x) => x.label === 'rawBG')?.layoutId === null);
  check('encoder/pass wrappers existed while recording and are gone after end()/finish()', midPassOwn > 0 && ownProps(pass).length === 0 && ownProps(enc).length === 0, { midPassOwn });
  evidence['new-coverage-labels'] = { buffers: bufLabels, pipelines: ofType(ev, 'pipeline-created').map((p) => [p.pipeline, p.label, p.mode]), submits: submits.length };
}

/** Wrapping must not break TypeGPU or change native semantics. */
async function risks() {
  current = 'risks';
  const s = await open();
  const { device } = s;
  check('device.queue identity is stable (we patch the queue instance)', device.queue === device.queue);
  const buf = s.root.createBuffer(d.f32).$usage('uniform').$name('r');
  const rawB = s.root.unwrap(buf) as GPUBuffer;
  check('instanceof GPUBuffer / GPUDevice / GPUQueue hold; object identity preserved (unwrap() returns the same GPUBuffer every time)', rawB instanceof GPUBuffer && device instanceof GPUDevice && device.queue instanceof GPUQueue && s.root.unwrap(buf) === rawB && buf.buffer === rawB);
  const tex = s.root.createTexture({ size: [2, 2], format: 'rgba8unorm' }).$usage('sampled');
  const v = (s.root.unwrap(tex) as GPUTexture).createView();
  check('texture.createView result still a GPUTextureView', v instanceof GPUTextureView);
  // this-binding and brand checks behave like native
  const detached = device.createBuffer;
  let nativeErr = '', ourErr = '';
  try { (GPUDevice.prototype.createBuffer as any)({ size: 4, usage: 1 }); } catch (e) { nativeErr = `${(e as Error).constructor.name}: ${(e as Error).message}`; }
  try { (detached as any)({ size: 4, usage: 1 }); } catch (e) { ourErr = `${(e as Error).constructor.name}: ${(e as Error).message}`; }
  check('detached call (wrong this) throws the same TypeError as native', nativeErr !== '' && nativeErr === ourErr, { nativeErr, ourErr });
  const fake = Object.create(GPUDevice.prototype);
  let e1 = '', e2 = '';
  try { (GPUDevice.prototype.createBuffer as any).call(fake, { size: 4, usage: 1 }); } catch (e) { e1 = (e as Error).message; }
  try { (detached as any).call(fake, { size: 4, usage: 1 }); } catch (e) { e2 = (e as Error).message; }
  check('brand check with a foreign this: same error as native', e1 !== '' && e1 === e2, { e1, e2 });
  let b1 = '', b2 = '';
  try { (GPUDevice.prototype.createBuffer as any).call(device, { usage: 1 }); } catch (e) { b1 = (e as Error).message; }
  try { (device as any).createBuffer({ usage: 1 }); } catch (e) { b2 = (e as Error).message; }
  check('invalid descriptor throws the same TypeError (message) through the wrapper', b1 !== '' && b1 === b2, { b1, b2 });
  const asString = Function.prototype.toString.call(device.createBuffer);
  evidence['risks-toString'] = { wrapped: asString.slice(0, 60), nameProp: device.createBuffer.name, length: device.createBuffer.length };
  check('FINDING: wrapper is detectable (Function.prototype.toString is not [native code])', !/\[native code\]/.test(asString), asString.slice(0, 50));
  // error scopes still work; scoped errors are NOT uncaptured, same as native
  device.pushErrorScope('validation');
  device.createRenderPipeline({ layout: 'auto', vertex: { module: device.createShaderModule({ code: 'nonsense' }) } });
  const scoped = await device.popErrorScope();
  await sleep(100);
  check('pushErrorScope/popErrorScope still catch errors; tap records no device-error for scoped errors', scoped !== null && ofType(s.events, 'device-error').length === 0, scoped?.message?.slice(0, 80));
  // a stacked second tap sees each call once; independent counting
  const events2: TapEvent[] = [];
  const tap2 = tapDevice(device, { historySize: 64 });
  tap2.subscribe((e) => events2.push(e));
  const c0 = s.events.length;
  device.createBuffer({ label: 'stacked', size: 16, usage: GPUBufferUsage.UNIFORM });
  check('two taps stacked: each sees the call exactly once', s.events.length - c0 === 1 && events2.filter((e) => e.type === 'buffer-created').length === 1);
  // restore out of order (A first, then B)
  s.tap.restore();
  const c1 = events2.length;
  device.createBuffer({ label: 'afterA', size: 16, usage: GPUBufferUsage.UNIFORM });
  check('after restoring the INNER tap first, the outer tap keeps working (inert wrapper left in chain)', events2.length - c1 === 1);
  tap2.restore();
  check('after restoring both (non-LIFO): device has no own props and native methods are back', ownProps(device).length === 0 && ownProps(device.queue).length === 0 && device.createBuffer === GPUDevice.prototype.createBuffer, { device: ownProps(device), queue: ownProps(device.queue) });
  // LIFO + double restore
  const tA = tapDevice(device); const tB = tapDevice(device);
  tB.restore(); tA.restore(); tA.restore();
  check('LIFO restore and double restore are clean', ownProps(device).length === 0 && ownProps(device.queue).length === 0);
  // a stacked tap created on a buffer that outlives restore of the first: destroy wrapper chain
  const tC = tapDevice(device); const tD = tapDevice(device);
  const longLived = device.createBuffer({ label: 'longLived', size: 16, usage: GPUBufferUsage.UNIFORM });
  tC.restore();
  longLived.destroy();
  tD.restore();
  check('resource created under two stacked taps: destroy() after restoring the inner one leaves no own props', ownProps(longLived).length === 0 && ownProps(device).length === 0, ownProps(longLived));
  device.destroy();
}

async function gcProbe() {
  current = 'retention';
  const gc = (globalThis as { gc?: () => void }).gc;
  if (!gc) return check('gc() available', false);
  const collect = async () => { for (let i = 0; i < 25; i++) { await sleep(20); gc(); } };
  const run = async (tapped: boolean) => {
    const device = await newDevice();
    const tap = tapped ? tapDevice(device, { historySize: 256 }) : null;
    const roots: WeakRef<object>[] = [];
    const rawBufs: WeakRef<object>[] = [];
    const pipelines: WeakRef<object>[] = [];
    (() => {
      for (let i = 0; i < 30; i++) {
        const root = tgpu.initFromDevice({ device });
        roots.push(new WeakRef(root));
        const b = root.createBuffer(d.arrayOf(d.f32, 8)).$usage('storage');
        rawBufs.push(new WeakRef(root.unwrap(b) as object));
        const p = root.createComputePipeline({ compute: noop });
        p.initSync();
        pipelines.push(new WeakRef(device.createBuffer({ size: 4, usage: GPUBufferUsage.UNIFORM })));
      }
    })();
    await collect();
    const alive = (xs: WeakRef<object>[]) => xs.filter((x) => x.deref() !== undefined).length;
    const out: Record<string, unknown> = { roots: alive(roots), rawBuffers: alive(rawBufs), rawBuffersCreatedDirectly: alive(pipelines) };
    if (tap) { out.snapshotAfterGc = { live: (tap.snapshot().resources as unknown[]).length, collectedWithoutDestroy: (tap.snapshot().counters as any).collectedWithoutDestroy, history: tap.history().length }; }
    return { device, tap, out };
  };
  const control = await run(false);
  const tapped = await run(true);
  evidence['retention-abandoned-roots'] = { control: control.out, tapped: tapped.out };
  check('tap does not retain abandoned TypeGPU roots (30 roots)', (tapped.out.roots as number) === 0, { control: control.out, tapped: tapped.out });
  check('tap does not retain GPUBuffers beyond control (no destroy())', (tapped.out.rawBuffers as number) <= (control.out.rawBuffers as number) && (tapped.out.rawBuffersCreatedDirectly as number) <= (control.out.rawBuffersCreatedDirectly as number), { control: control.out, tapped: tapped.out });
  check('collectedWithoutDestroy accounting is fed by GC', ((tapped.out.snapshotAfterGc as any)?.collectedWithoutDestroy ?? 0) > 0, tapped.out.snapshotAfterGc);

  // dropped tap, after restore(): is its state collectable while the device lives?
  const probe = async (restore: boolean) => {
    const device = await newDevice();
    let ref!: WeakRef<object>;
    (() => {
      const tap = tapDevice(device, { historySize: 256 });
      ref = new WeakRef((tap as any).__state);
      for (let i = 0; i < 20; i++) device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM }).destroy();
      if (restore) tap.restore();
    })();
    await collect();
    const alive = ref.deref() !== undefined;
    return { device, alive };
  };
  const r1 = await probe(true);
  const r2 = await probe(false);
  evidence['retention-dropped-tap'] = { restoredThenDropped_stateAlive: r1.alive, droppedWithoutRestore_stateAlive: r2.alive };
  check('restored + dropped tap is collectable while the device lives (no retention by restored device)', r1.alive === false, evidence['retention-dropped-tap']);
  check('FINDING: a tap dropped WITHOUT restore() stays alive as long as the device (device holds its wrappers) - same class as PoC defect D1', r2.alive === true, evidence['retention-dropped-tap']);
  // does a restored tap keep the DEVICE alive after both are dropped? compare with control
  const devProbe = async (tapped: boolean) => {
    let ref!: WeakRef<object>;
    await (async () => {
      const device = await newDevice();
      ref = new WeakRef(device);
      const tap = tapped ? tapDevice(device) : null;
      device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM });
      tap?.restore();
      device.destroy();
    })();
    await collect();
    return ref.deref() !== undefined;
  };
  const devControl = await devProbe(false);
  const devTapped = await devProbe(true);
  evidence['retention-device'] = { controlDeviceAlive: devControl, restoredTapDeviceAlive: devTapped };
  check('a restored tap does not keep a dropped device alive beyond the no-tap control', devTapped === devControl, evidence['retention-device']);
  control.device.destroy(); tapped.device.destroy(); r1.device.destroy(); r2.device.destroy();
}

export async function runAlt() {
  const prov = await provenance();
  if (prov.pageClassification === 'unavailable') return { provenance: prov, ok: false, report: ['WebGPU unavailable'], findings: [] };
  const all: [string, () => Promise<void>][] = [
    ['resources', resources], ['compute-bindgroups', computeBindGroups], ['render', render], ['explicit-init', explicitInit],
    ['sync-failures', syncFailures], ['async-failures', asyncFailures], ['new-coverage', newCoverage], ['risks', risks], ['retention', gcProbe],
  ];
  for (const [name, fn] of all) {
    try { await fn(); } catch (e) { current = name; check('scenario ran to completion', false, String((e as Error)?.stack ?? e)); }
  }
  const report: string[] = [];
  for (const [name] of all) {
    const mine = findings.filter((f) => f.scenario === name);
    report.push(`\n== ${name}: ${mine.filter((f) => f.pass).length}/${mine.length}`);
    for (const f of mine) {
      report.push(`${f.pass ? 'PASS' : 'FAIL'}  ${f.check}`);
      if (!f.pass) report.push(`        detail: ${JSON.stringify(f.detail)?.slice(0, 700)}`);
    }
  }
  return { provenance: prov, ok: findings.every((f) => f.pass), report, findings, evidence };
}
(window as any).runAlt = runAlt;

/** DEV-build only: TypeGPU's existing user-timing marks give resolveMs to a device-level tap, with no TypeGPU patch. */
export async function runResolvePairing() {
  (globalThis as any).__TYPEGPU_MEASURE_PERF__ = true;
  const device = await newDevice();
  const tap = tapDevice(device, { userTiming: true, historySize: 64 });
  const root = tgpu.initFromDevice({ device });
  root.createComputePipeline({ compute: noop }).$name('timed').initSync();
  const r = root.createRenderPipeline({ vertex: vertexFull, fragment: fragmentRed, targets: { format: 'rgba8unorm' } }).$name('timedRender');
  await r.initAsync();
  const entries = performance.getEntriesByName('typegpu:resolution', 'measure').map((e) => e.duration);
  const created = tap.history().filter((e) => e.type === 'pipeline-created').map((e) => ({ label: e.label, mode: e.mode, resolveMs: e.resolveMs }));
  tap.restore();
  device.destroy();
  return { provenance: await provenance(), ok: true, entries, created, report: [`typegpu:resolution entries: ${JSON.stringify(entries)}`, `pipeline-created: ${JSON.stringify(created)}`] };
}
(window as any).runResolvePairing = runResolvePairing;
