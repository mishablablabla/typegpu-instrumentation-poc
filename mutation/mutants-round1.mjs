const HUB = 'src/core/instrumentation/hub.ts';
const DEV = 'src/core/instrumentation/deviceEvents.ts';
const TR = 'tests/instrumentation/consumers/textReport.ts';
const JL = 'tests/instrumentation/consumers/jsonlExport.ts';
const DI = 'tests/instrumentation/consumers/diagnosticsIndex.ts';
const BUF = 'src/core/buffer/buffer.ts';
const TEX = 'src/core/texture/texture.ts';
const CE = 'src/core/commandEncoder/commandEncoder.ts';
const CP = 'src/core/commandEncoder/computePass.ts';
const RP = 'src/core/commandEncoder/renderPass.ts';
const CPL = 'src/core/pipeline/computePipeline.ts';
const RPL = 'src/core/pipeline/renderPipeline.ts';
const DS = 'src/core/pipeline/drawState.ts';
const INIT = 'src/core/root/init.ts';

export const mutants = [
  // ---- hub: ring buffer / emit ----
  { id: 'M01', file: HUB, find: 'this.#ringSize < capacity', repl: 'this.#ringSize <= capacity', desc: 'ring capacity off-by-one (<=)' },
  { id: 'M02', file: HUB, find: `if (capacity === 0) {
      this.#droppedEvents++;`, repl: `if (capacity === 0) {`, desc: 'no drop count when historySize 0' },
  { id: 'M03', file: HUB, find: `this.#ringStart = (this.#ringStart + 1) % capacity;
      this.#droppedEvents++;`, repl: `this.#ringStart = (this.#ringStart + 1) % capacity;`, desc: 'no drop count on overwrite' },
  { id: 'M04', file: HUB, find: 'this.#ringStart = (this.#ringStart + 1) % capacity;', repl: '', desc: 'ring start never advances' },
  { id: 'M05', file: HUB, find: 'this.#ring[(this.#ringStart + i) % this.#ring.length]', repl: 'this.#ring[(this.#ringStart + this.#ringSize - 1 - i) % this.#ring.length]', desc: 'history newest first' },
  { id: 'M06', file: HUB, find: 'seq: ++this.#seq', repl: 'seq: this.#seq++', desc: 'seq starts at 0 (post-increment)' },
  { id: 'M07', file: HUB, find: 'DEFAULT_HISTORY_SIZE = 256', repl: 'DEFAULT_HISTORY_SIZE = 255', desc: 'default history size 255' },
  { id: 'M08', file: HUB, find: `    const capacity = this.#ring.length;
    if (capacity === 0) {
      this.#droppedEvents++;
    } else if (this.#ringSize < capacity) {
      this.#ring[(this.#ringStart + this.#ringSize) % capacity] = event;
      this.#ringSize++;
    } else {
      this.#ring[this.#ringStart] = event;
      this.#ringStart = (this.#ringStart + 1) % capacity;
      this.#droppedEvents++;
    }

    for (const listener of this.#listeners) {
      try {
        listener(event);
      } catch {
        this.#listenerErrors++;
      }
    }`, repl: `    for (const listener of this.#listeners) {
      try {
        listener(event);
      } catch {
        this.#listenerErrors++;
      }
    }
    const capacity = this.#ring.length;
    if (capacity === 0) {
      this.#droppedEvents++;
    } else if (this.#ringSize < capacity) {
      this.#ring[(this.#ringStart + this.#ringSize) % capacity] = event;
      this.#ringSize++;
    } else {
      this.#ring[this.#ringStart] = event;
      this.#ringStart = (this.#ringStart + 1) % capacity;
      this.#droppedEvents++;
    }`, desc: 'deliver to listeners before the event enters the ring' },
  { id: 'M09', file: HUB, find: 'this.#listeners = [...this.#listeners, listener];', repl: '(this.#listeners as any).push(listener);', desc: 'subscribe mutates array in place (no copy-on-write)' },
  { id: 'M10', file: HUB, find: 'this.#listeners = this.#listeners.filter((l) => l !== listener);', repl: 'const i = this.#listeners.indexOf(listener); if (i >= 0) (this.#listeners as any).splice(i, 1);', desc: 'unsubscribe splices in place' },
  { id: 'M11', file: HUB, find: 'this.#listeners = this.#listeners.filter((l) => l !== listener);', repl: 'this.#listeners = [];', desc: 'unsubscribe removes everyone' },
  { id: 'M12', file: HUB, find: `if (this.#disposed) {
      return () => {};
    }`, repl: '', desc: 'subscribe after dispose allowed' },
  { id: 'M13', file: HUB, find: `    this.#active = true;
    this.#holder.instrumentation = this;`, repl: `    this.#active = true;`, desc: 'enable() does not republish hub in holder' },
  { id: 'M14', file: HUB, find: `if (this.#disposed) {
      return;
    }
    this.#active = true;`, repl: `this.#active = true;`, desc: 'enable() works after dispose' },
  { id: 'M15', file: HUB, find: `    this.#active = false;
    this.#holder.instrumentation = undefined;
  }

  subscribe`, repl: `    this.#active = false;
  }

  subscribe`, desc: 'disable() leaves holder set' },
  { id: 'M16', file: HUB, find: `    this.#active = false;
    this.#holder.instrumentation = undefined;
  }

  subscribe`, repl: `    this.#holder.instrumentation = undefined;
  }

  subscribe`, desc: 'disable() does not clear #active' },
  { id: 'M17', file: HUB, find: `    this.#disposed = true;
    this.#holder.instrumentation = undefined;`, repl: `    this.#disposed = true;`, desc: 'dispose() leaves holder set' },
  { id: 'M18', file: HUB, find: `    this.#listeners = [];
    this.#watch.stopAll();`, repl: `    this.#watch.stopAll();`, desc: 'dispose() keeps listeners' },
  { id: 'M19', file: HUB, find: `    this.#listeners = [];
    this.#watch.stopAll();`, repl: `    this.#listeners = [];`, desc: 'dispose() does not stop device watch' },
  { id: 'M20', file: HUB, find: `  dispose(): void {
    this.#active = false;`, repl: `  dispose(): void {`, desc: 'dispose() does not clear #active' },
  { id: 'M21', file: HUB, find: `  handleDeviceError(event: Event): void {
    if (!this.#active) {
      return;
    }`, repl: `  handleDeviceError(event: Event): void {`, desc: 'device error delivered while disabled' },
  { id: 'M22', file: HUB, find: `    if (this.#active) {
      this.#emit({ type: 'device-lost'`, repl: `    if (true) {
      this.#emit({ type: 'device-lost'`, desc: 'device-lost delivered while disabled' },
  { id: 'M23', file: HUB, find: `error?.constructor?.name ?? 'unknown'`, repl: `error?.constructor?.name ?? ''`, desc: 'errorType fallback changed' },
  { id: 'M24', file: HUB, find: `message: String(error?.message ?? ''),`, repl: `message: String(error?.message),`, desc: 'error without message -> "undefined"' },
  // ---- hub: resource records ----
  { id: 'M25', file: HUB, find: `      writes: 0,
      bytesWritten: 0,`, repl: `      writes: 0,
      bytesWritten: 4,`, desc: 'bytesWritten starts at 4' },
  { id: 'M26', file: HUB, find: 'rec.bytesWritten = (rec.bytesWritten ?? 0) + bytes;', repl: 'rec.bytesWritten = (rec.bytesWritten ?? 0) + bytes * 2;', desc: 'bytesWritten counts double' },
  { id: 'M27', file: HUB, find: 'rec.writes = (rec.writes ?? 0) + 1;', repl: 'rec.writes = (rec.writes ?? 0) + 2;', desc: 'writes counted twice' },
  { id: 'M28', file: HUB, find: `    this.#live.delete(rec.id);
    this.#byObject.delete(resource);
    this.#emit({
      type: 'resource-destroyed',`, repl: `    this.#byObject.delete(resource);
    this.#emit({
      type: 'resource-destroyed',`, desc: 'destroyed resource stays in #live' },
  { id: 'M29', file: HUB, find: `    this.#live.delete(rec.id);
    this.#byObject.delete(resource);
    this.#emit({
      type: 'resource-destroyed',`, repl: `    this.#live.delete(rec.id);
    this.#emit({
      type: 'resource-destroyed',`, desc: 'destroyed resource stays in #byObject' },
  { id: 'M30', file: HUB, find: `dimension: descriptor.dimension ?? '2d',`, repl: `dimension: descriptor.dimension ?? '3d',`, desc: 'texture dimension default 3d' },
  { id: 'M31', file: HUB, find: `sampleCount: descriptor.sampleCount ?? 1,`, repl: `sampleCount: 1,`, desc: 'texture sampleCount ignored' },
  { id: 'M32', file: HUB, find: `      format: descriptor.format,
      size: Array.isArray(size)`, repl: `      format: 'rgba8unorm',
      size: Array.isArray(size)`, desc: 'texture format hardcoded' },
  { id: 'M33', file: HUB, find: `      mipLevelCount: descriptor.mipLevelCount ?? 1,
      sampleCount: descriptor.sampleCount ?? 1,
      dimension: descriptor.dimension ?? '2d',
      usage: descriptor.usage,`, repl: `      mipLevelCount: descriptor.mipLevelCount ?? 1,
      sampleCount: descriptor.sampleCount ?? 1,
      dimension: descriptor.dimension ?? '2d',
      usage: 0,`, desc: 'texture usage lost' },
  { id: 'M34', file: HUB, find: `    this.#register(buffer, rec);
    this.#emit({`, repl: `    this.#emit({`, desc: 'buffer not registered' },
  // ---- hub: bind groups ----
  { id: 'M35', file: HUB, find: `if ('uniform' in layoutEntry || 'storage' in layoutEntry)`, repl: `if ('storage' in layoutEntry)`, desc: 'uniform entries not classified as buffer' },
  { id: 'M36', file: HUB, find: `        'texture' in layoutEntry ||
        'storageTexture' in layoutEntry ||
        'externalTexture' in layoutEntry`, repl: `        'texture' in layoutEntry`, desc: 'storage/external texture entries not classified as texture' },
  { id: 'M37', file: HUB, find: `} else if ('sampler' in layoutEntry) {
        kind = 'sampler';
      }`, repl: `}`, desc: 'sampler entries classified as other' },
  { id: 'M38', file: HUB, find: `target = (value as { [$soul]?: { texture?: unknown } } | undefined)?.[$soul]?.texture;`, repl: `target = undefined;`, desc: 'texture entries never resolved to resource id' },
  { id: 'M39', file: HUB, find: `if (layoutEntry === null) {
        continue;
      }`, repl: ``, desc: 'null layout entries not skipped' },
  { id: 'M40', file: HUB, find: `      label: getName(bindGroup.layout) ?? null,
      layoutId,`, repl: `      label: null,
      layoutId,`, desc: 'bind-group event loses label' },
  { id: 'M41', file: HUB, find: `    const layoutId = this.#identityId(bindGroup.layout);`, repl: `    const layoutId = this.#nextId++;`, desc: 'layout identity not stable (new id per bind group)' },
  { id: 'M42', file: HUB, find: `    if (rec === undefined) {
      rec = { kind: 'identity', id: this.#nextId++ };
      this.#byObject.set(layout, rec);
    }
    return rec.id;`, repl: `    if (rec === undefined) {
      rec = { kind: 'identity', id: this.#nextId++ };
    }
    return rec.id;`, desc: 'identity ids not memoized' },
  { id: 'M43', file: HUB, find: `    const inner = (value as { buffer?: unknown }).buffer;`, repl: `    const inner = undefined as any;`, desc: 'bufferOf does not unwrap bindings wrapping a buffer' },
  { id: 'M44', file: HUB, find: `    return this.#byObject.get(object)?.id ?? null;`, repl: `    return this.#byObject.get(object)?.id ?? 0;`, desc: 'untracked resource id 0 instead of null' },
  // ---- hub: pipelines ----
  { id: 'M45', file: HUB, find: `  pipelineCompiled(core: object, info: PipelineCompiledInfo): void {
    // The async path can report after \`disable()\`.
    if (!this.#active) {
      return;
    }`, repl: `  pipelineCompiled(core: object, info: PipelineCompiledInfo): void {`, desc: 'pipelineCompiled records after disable()' },
  { id: 'M46', file: HUB, find: `      layoutLabels: info.layouts.map((layout) => getName(layout) ?? null),
    });

    this.#requestDiagnostics(rec.id, info.module);`, repl: `      layoutLabels: [],
    });

    this.#requestDiagnostics(rec.id, info.module);`, desc: 'pipeline-compiled layoutLabels empty' },
  { id: 'M47', file: HUB, find: `      resolveMs: info.resolveMs,
      createMs: info.createMs,
      wgsl: info.wgsl,
      layoutIds,
      layoutLabels: info.layouts`, repl: `      resolveMs: info.createMs,
      createMs: info.resolveMs,
      wgsl: info.wgsl,
      layoutIds,
      layoutLabels: info.layouts`, desc: 'pipeline-compiled resolveMs/createMs swapped in event' },
  { id: 'M48', file: HUB, find: `      createMs: info.createMs,
      wgsl: info.wgsl,
      layoutIds,
      dispatches: 0,`, repl: `      createMs: info.resolveMs,
      wgsl: info.wgsl,
      layoutIds,
      dispatches: 0,`, desc: 'snapshot pipeline createMs = resolveMs' },
  { id: 'M49', file: HUB, find: `    this.#requestDiagnostics(rec.id, info.module);`, repl: ``, desc: 'no diagnostics request after compile' },
  { id: 'M50', file: HUB, find: `    this.#requestDiagnostics(id, info.module);`, repl: ``, desc: 'no diagnostics request after failure' },
  { id: 'M51', file: HUB, find: `    const id = this.#identityId(core);`, repl: `    const id = this.#nextId++;`, desc: 'failed-pipeline id not stable across failures' },
  { id: 'M52', file: HUB, find: `message: String((error as Error | undefined)?.message ?? error),`, repl: `message: String((error as Error | undefined)?.message ?? ''),`, desc: 'non-Error rejection loses its message' },
  { id: 'M53', file: HUB, find: `      layoutIds: info.layouts.map((layout) => this.#identityId(layout)),
      layoutLabels: info.layouts.map((layout) => getName(layout) ?? null),
      errorType`, repl: `      layoutIds: [],
      layoutLabels: [],
      errorType`, desc: 'failed event drops layout ids/labels' },
  { id: 'M54', file: HUB, find: `        if (!this.#active) {
          return;
        }
        this.#emit({
          type: 'shader-diagnostics',`, repl: `        this.#emit({
          type: 'shader-diagnostics',`, desc: 'late diagnostics emitted after dispose/disable' },
  { id: 'M55', file: HUB, find: `            lineNum: m.lineNum,
            linePos: m.linePos,`, repl: `            lineNum: m.linePos,
            linePos: m.lineNum,`, desc: 'diagnostics lineNum/linePos swapped' },
  { id: 'M56', file: HUB, find: `    if (typeof module?.getCompilationInfo !== 'function') {
      return;
    }`, repl: ``, desc: 'module without getCompilationInfo crashes' },
  { id: 'M57', file: HUB, find: `  dispatched(core: object): void {
    // A pass keeps the hub it saw when it was created, so it can outlive \`disable()\`.
    if (!this.#active) {
      return;
    }`, repl: `  dispatched(core: object): void {`, desc: 'dispatch counted after disable()' },
  { id: 'M58', file: HUB, find: `  drew(core: object): void {
    if (!this.#active) {
      return;
    }`, repl: `  drew(core: object): void {`, desc: 'draw counted after disable()' },
  { id: 'M59', file: HUB, find: `rec.draws++;`, repl: `rec.dispatches++;`, desc: 'draw counts as dispatch' },
  { id: 'M60', file: HUB, find: `this.#submits++;`, repl: `this.#submits += 2;`, desc: 'submits double' },
  // ---- hub: rootDestroyed ----
  { id: 'M61', file: HUB, find: `      } else if (rec.kind === 'texture') {
        liveTextures++;
      }`, repl: `      } else if (rec.kind === 'texture') {
        liveBuffers++;
      }`, desc: 'live textures counted as buffers' },
  { id: 'M62', file: HUB, find: `    if (this.#active) {
      this.#emit({ type: 'root-destroyed'`, repl: `    if (true) {
      this.#emit({ type: 'root-destroyed'`, desc: 'root-destroyed emitted while disabled' },
  { id: 'M63', file: HUB, find: `      if (rec.ref.deref() === undefined) {
        continue;
      }
      if (rec.kind === 'buffer') {`, repl: `      if (rec.kind === 'buffer') {`, desc: 'rootDestroyed counts collected resources as live' },
  { id: 'M64', file: HUB, find: `    if (ownDevice) {
      this.#watch.stopErrors();
    } else {
      this.dispose();
    }`, repl: `    this.dispose();`, desc: 'own device: dispose instead of keeping lost watch' },
  { id: 'M65', file: HUB, find: `    if (ownDevice) {
      this.#watch.stopErrors();
    } else {
      this.dispose();
    }`, repl: `    if (ownDevice) {
      this.#watch.stopErrors();
    }`, desc: 'borrowed device: never disposed on root.destroy' },
  { id: 'M66', file: HUB, find: `    if (ownDevice) {
      this.#watch.stopErrors();`, repl: `    if (ownDevice) {
      this.#watch.stopAll();`, desc: 'own device: stopAll instead of stopErrors' },
  { id: 'M67', file: HUB, find: `    this.#live.delete(id);
    if (rec.kind === 'buffer' || rec.kind === 'texture') {`, repl: `    if (rec.kind === 'buffer' || rec.kind === 'texture') {`, desc: 'finalizer does not remove record from #live' },
  { id: 'M68', file: HUB, find: `if (rec.kind === 'buffer' || rec.kind === 'texture') {
      this.#collectedWithoutDestroy++;`, repl: `{
      this.#collectedWithoutDestroy++;`, desc: 'collectedWithoutDestroy counts bind groups/pipelines too' },
  { id: 'M69', file: HUB, find: `    this.#finalizer.register(object, rec.id);`, repl: ``, desc: 'finalizer never registered' },
  { id: 'M70', file: HUB, find: `      } catch {
        this.#listenerErrors++;
      }`, repl: `      } catch {
        this.#listenerErrors++;
        break;
      }`, desc: 'throwing listener aborts delivery to later listeners' },
  { id: 'M71', file: HUB, find: `      enabled: this.#active,`, repl: `      enabled: true,`, desc: 'snapshot.enabled constant true' },
  { id: 'M72', file: HUB, find: `        bindGroups.push({
          id: rec.id,
          label,
          layoutId: rec.layoutId,
          origin: rec.origin,
          entries: rec.entries,
        });`, repl: `        bindGroups.push({
          id: rec.id,
          label,
          layoutId: rec.layoutId,
          origin: 'created',
          entries: rec.entries,
        });`, desc: 'snapshot bind group origin always created' },
  { id: 'M73', file: HUB, find: `const label = getName(object) ?? null;`, repl: `const label = null as string | null;`, desc: 'snapshot labels always null' },
  // ---- deviceEvents ----
  { id: 'M74', file: DEV, find: `  if (entry.listener !== undefined && entry.errorSinks.size === 0) {
    entry.device.removeEventListener('uncapturederror', entry.listener);
    entry.listener = undefined;
  }`, repl: `  if (entry.listener !== undefined && entry.errorSinks.size === 0) {
    entry.device.removeEventListener('uncapturederror', entry.listener);
  }`, desc: 'listener ref not reset after removal (cannot re-add)' },
  { id: 'M75', file: DEV, find: `entry.listener !== undefined && entry.errorSinks.size === 0`, repl: `entry.listener !== undefined && entry.errorSinks.size <= 1`, desc: 'listener removed while one sink remains' },
  { id: 'M76', file: DEV, find: `entry.device.removeEventListener('uncapturederror', entry.listener);`, repl: ``, desc: 'device listener never removed' },
  { id: 'M77', file: DEV, find: `    for (const ref of entry.lostSinks) {
      ref.deref()?.handleDeviceLost(info);
    }`, repl: `    for (const ref of entry.lostSinks) {
      ref.deref()?.handleDeviceLost(info);
      break;
    }`, desc: 'lost delivered to first sink only' },
  { id: 'M78', file: DEV, find: `    void device.lost?.then(makeLostHandler(entry));
  }
  return entry;`, repl: `  }
  void device.lost?.then(makeLostHandler(entry));
  return entry;`, desc: 'one lost handler per watcher instead of per device' },
  { id: 'M79', file: DEV, find: `if (entry.listener === undefined && typeof device.addEventListener === 'function') {`, repl: `if (entry.listener === undefined) {`, desc: 'no guard for devices without addEventListener' },
  { id: 'M80', file: DEV, find: `    entry.errorSinks.delete(ref);
    entry.lostSinks.delete(ref);
    releaseListener(entry);
  },
);`, repl: `    entry.errorSinks.delete(ref);
    entry.lostSinks.delete(ref);
  },
);`, desc: 'FinalizationRegistry cleanup does not release device listener' },
  { id: 'M81', file: DEV, find: `  cleanup.register(sink, { entry, ref });`, repl: ``, desc: 'cleanup registry never registered' },
  { id: 'M82', file: DEV, find: `    stopAll() {
      entry.errorSinks.delete(ref);
      entry.lostSinks.delete(ref);
      releaseListener(entry);`, repl: `    stopAll() {
      entry.errorSinks.delete(ref);
      releaseListener(entry);`, desc: 'stopAll keeps lost sink' },
  { id: 'M83', file: DEV, find: `    stopErrors() {
      entry.errorSinks.delete(ref);
      releaseListener(entry);`, repl: `    stopErrors() {
      entry.lostSinks.delete(ref);
      releaseListener(entry);`, desc: 'stopErrors removes lost sink instead of error sink' },
  { id: 'M84', file: DEV, find: `    entry.lostSinks.clear();
  };`, repl: `  };`, desc: 'lost handler does not clear lostSinks' },
  { id: 'M85', file: DEV, find: `      if (sink === undefined) {
        entry.errorSinks.delete(ref);
      } else {`, repl: `      if (sink === undefined) {
      } else {`, desc: 'dead error sinks never pruned' },
  // ---- consumers ----
  { id: 'M86', file: TR, find: `padStart(3, '0')`, repl: `padStart(2, '0')`, desc: 'textReport seq padding' },
  { id: 'M87', file: TR, find: `e.size.join('x')`, repl: `e.size.join(',')`, desc: 'textReport texture size separator' },
  { id: 'M88', file: TR, find: `destroyed\`;
    case 'bind-group-created'`, repl: `freed\`;
    case 'bind-group-created'`, desc: 'textReport destroyed wording' },
  { id: 'M89', file: TR, find: `DEVICE LOST (`, repl: `DEVICE LOSS (`, desc: 'textReport DEVICE LOST wording' },
  { id: 'M90', file: TR, find: "return `${head} DEVICE ERROR ${e.errorType}: ${e.message.split('\\n')[0]}`;", repl: "return `${head} DEVICE ERROR ${e.errorType}: ${e.message}`;", desc: 'textReport device error not truncated to first line' },
  { id: 'M91', file: TR, find: `(r.writes === null ? '' : \`: \${r.writes} writes, \${r.bytesWritten} B written\`)`, repl: `(r.writes === null ? '' : \`: \${r.writes} writes, \${r.writes} B written\`)`, desc: 'formatSnapshot bytes = writes' },
  { id: 'M92', file: TR, find: `const lines = source.history().map(formatEvent);`, repl: `const lines: string[] = [];`, desc: 'textReport ignores history' },
  { id: 'M93', file: TR, find: `\${p.dispatches} dispatches, \${p.draws} draws`, repl: `\${p.draws} dispatches, \${p.dispatches} draws`, desc: 'formatSnapshot dispatch/draw swapped' },
  { id: 'M94', file: JL, find: `dispose: unsubscribe,`, repl: `dispose: () => {},`, desc: 'jsonl dispose does not unsubscribe' },
  { id: 'M95', file: JL, find: `lastSeq = event.seq;`, repl: `lastSeq = lastSeq + 1;`, desc: 'jsonl afterSeq counts lines not seq' },
  { id: 'M96', file: JL, find: `  for (const event of source.history()) {
    addEvent(event);
  }`, repl: ``, desc: 'jsonl ignores history' },
  { id: 'M97', file: JL, find: `lines: () => [...lines],`, repl: `lines: () => lines,`, desc: 'jsonl lines() leaks internal array' },
  { id: 'M98', file: DI, find: `cpuMs: e.resolveMs + e.createMs`, repl: `cpuMs: e.resolveMs`, desc: 'index cpuMs omits createMs' },
  { id: 'M99', file: DI, find: `      if (e.messages.length === 0) {
        break;
      }`, repl: ``, desc: 'index lists empty diagnostics as problems' },
  { id: 'M100', file: DI, find: `lines?.[m.lineNum - 1]`, repl: `lines?.[m.lineNum]`, desc: 'index wgslLine off by one' },
  { id: 'M101', file: DI, find: `state.lost = { reason: e.reason, message: e.message };`, repl: `state.lost = null;`, desc: 'index drops device loss' },
  { id: 'M102', file: DI, find: `      state.live.delete(e.id);`, repl: ``, desc: 'index never removes destroyed resources' },
  { id: 'M103', file: DI, find: `if (e.trigger === 'lazy') {`, repl: `if (e.trigger !== 'initAsync') {`, desc: 'index counts initSync as lazy' },
  // ---- patch sites ----
  { id: 'M104', file: BUF, find: `    root[$internal].instrumentation?.bufferMaterialized(this, descriptor);`, repl: ``, desc: 'hook missing: buffer materialize' },
  { id: 'M105', file: BUF, find: `this[$internal].root[$internal].instrumentation?.bufferWritten(this, size);`, repl: ``, desc: 'hook missing: bufferWritten in write()' },
  { id: 'M106', file: BUF, find: `this[$internal].root[$internal].instrumentation?.bufferWritten(this, uploadSize);`, repl: ``, desc: 'hook missing: bufferWritten in patch()' },
  { id: 'M107', file: BUF, find: `this[$internal].root[$internal].instrumentation?.bufferWritten(this, uploadSize);`, repl: `this[$internal].root[$internal].instrumentation?.bufferWritten(this, 0);`, desc: 'patch() reports 0 bytes' },
  { id: 'M108', file: BUF, find: `this[$internal].root[$internal].instrumentation?.resourceDestroyed(this);`, repl: ``, desc: 'hook missing: buffer destroy' },
  { id: 'M110', file: BUF, find: `this[$internal].root[$internal].instrumentation?.bufferWritten(this, size);`, repl: `this[$internal].root[$internal].instrumentation?.bufferWritten(this, size);
    this[$internal].root[$internal].instrumentation?.bufferWritten(this, size);`, desc: 'hook duplicated: bufferWritten in write()' },
  { id: 'M111', file: TEX, find: `    root[$internal].instrumentation?.textureMaterialized(this, descriptor);`, repl: ``, desc: 'hook missing: texture materialize' },
  { id: 'M112', file: TEX, find: `this[$internal].root[$internal].instrumentation?.resourceDestroyed(this);`, repl: ``, desc: 'hook missing: texture destroy' },
  { id: 'M113', file: CE, find: `    root[$internal].instrumentation?.submitted();`, repl: ``, desc: 'hook missing: submit counter' },
  { id: 'M114', file: CE, find: `    root[$internal].instrumentation?.submitted();`, repl: `    root[$internal].instrumentation?.submitted();
    root[$internal].instrumentation?.submitted();`, desc: 'hook duplicated: submit counter' },
  { id: 'M115', file: CP, find: `      instrumentation: root[$internal].instrumentation,`, repl: `      instrumentation: undefined,`, desc: 'compute pass never sees hub' },
  { id: 'M116', file: RP, find: `      instrumentation: root[$internal].instrumentation,`, repl: `      instrumentation: undefined,`, desc: 'render pass never sees hub' },
  { id: 'M117', file: DS, find: `  const memo = core.unwrap();
  passInternals.instrumentation?.drew(core);`, repl: `  passInternals.instrumentation?.drew(core);
  const memo = core.unwrap();`, desc: 'draw hook before lazy compile (record missing on first draw)' },
  { id: 'M118', file: DS, find: `  const memo = core.unwrap();
  passInternals.instrumentation?.dispatched(core);`, repl: `  passInternals.instrumentation?.dispatched(core);
  const memo = core.unwrap();`, desc: 'dispatch hook before lazy compile' },
  { id: 'M119', file: DS, find: `passInternals.instrumentation?.dispatched(core);`, repl: `passInternals.instrumentation?.dispatched(core);
  passInternals.instrumentation?.dispatched(core);`, desc: 'hook duplicated: dispatch' },
  { id: 'M120', file: DS, find: `passInternals.instrumentation?.drew(core);`, repl: ``, desc: 'hook missing: draw' },
  { id: 'M121', file: DS, find: `passInternals.instrumentation?.drew(core);`, repl: `passInternals.instrumentation?.dispatched(core);`, desc: 'wrong hook: draw reports dispatch' },
  { id: 'M122', file: CPL, find: `this.initSync('lazy');`, repl: `this.initSync();`, desc: 'compute: lazy trigger lost' },
  { id: 'M123', file: CPL, find: `trigger: 'initAsync',`, repl: `trigger: 'initSync',`, nth: 1, desc: 'compute: initAsync success reports initSync' },
  { id: 'M124', file: CPL, find: `    instrumentation?.pipelineCompiled(this, {
      pipeline: 'compute',
      trigger,`, repl: `    instrumentation?.pipelineCompiled(this, {
      pipeline: 'render',
      trigger,`, desc: 'compute: sync event says render' },
  { id: 'M125', file: CPL, find: `            throw error;`, repl: ``, desc: 'compute initAsync: swallows rejection' },
  { id: 'M126', file: CPL, find: `            instrumentation?.pipelineFailed(`, repl: `            void (`, desc: 'compute initAsync: failure hook missing' },
  { id: 'M127', file: CPL, find: `            instrumentation?.pipelineCompiled(this, {
              pipeline: 'compute',
              trigger: 'initAsync',`, repl: `            void ({
              pipeline: 'compute',
              trigger: 'initAsync',`, desc: 'compute initAsync: success hook missing' },
  { id: 'M128', file: CPL, find: `      wgsl: resolutionResult.code,
      layouts: usedBindGroupLayouts,
      module,
    });
    this.#performanceTracker.measureCompile(device);
  }

  public unwrap`, repl: `      wgsl: resolutionResult.code,
      layouts: [],
      module,
    });
    this.#performanceTracker.measureCompile(device);
  }

  public unwrap`, desc: 'compute initSync: layouts dropped' },
  { id: 'M129', file: CPL, find: `    const createStart = instrumentation?.now() ?? 0;

    this.#memo = {`, repl: `    const createStart = 0;

    this.#memo = {`, desc: 'compute initSync: createStart = 0 (createMs = absolute time)' },
  { id: 'M130', file: CPL, find: `    const resolveMs = instrumentation ? instrumentation.now() - resolveStart : 0;`, repl: `    const resolveMs = 0;`, desc: 'compute: resolveMs always 0' },
  { id: 'M131', file: CPL, find: `    instrumentation?.pipelineCompiled(this, {
      pipeline: 'compute',
      trigger,
      resolveMs,
      createMs: instrumentation.now() - createStart,
      wgsl: resolutionResult.code,`, repl: `    instrumentation?.pipelineCompiled(this, {
      pipeline: 'compute',
      trigger,
      resolveMs,
      createMs: instrumentation.now() - createStart,
      wgsl: '',`, desc: 'compute initSync: wgsl empty' },
  { id: 'M132', file: CPL, find: `    instrumentation?.pipelineCompiled(this, {
      pipeline: 'compute',
      trigger,`, repl: `    if (trigger !== 'lazy') instrumentation?.pipelineCompiled(this, {
      pipeline: 'compute',
      trigger,`, desc: 'compute: hook skipped on lazy' },
  { id: 'M133', file: RPL, find: `this.initSync('lazy');`, repl: `this.initSync();`, desc: 'render: lazy trigger lost' },
  { id: 'M134', file: RPL, find: `              pipeline: 'render',
              trigger: 'initAsync',
              resolveMs,
              createMs: instrumentation.now() - createStart,
              wgsl: resolutionResult.code,
              layouts: usedBindGroupLayouts,
              module,
            });
            this.#performanceTracker.measureCompile(device);`, repl: `              pipeline: 'render',
              trigger: 'initSync',
              resolveMs,
              createMs: instrumentation.now() - createStart,
              wgsl: resolutionResult.code,
              layouts: usedBindGroupLayouts,
              module,
            });
            this.#performanceTracker.measureCompile(device);`, desc: 'render initAsync success reports initSync' },
  { id: 'M135', file: RPL, find: `            instrumentation?.pipelineCompiled(this, {
              pipeline: 'render',`, repl: `            void ({
              pipeline: 'render',`, desc: 'render initAsync: success hook missing' },
  { id: 'M136', file: RPL, find: `    instrumentation?.pipelineCompiled(this, {
      pipeline: 'render',
      trigger,`, repl: `    void ({
      pipeline: 'render',
      trigger,`, desc: 'render initSync/lazy: hook missing' },
  { id: 'M137', file: RPL, find: `initSync(trigger: TgpuPipelineTrigger = 'initSync') {`, repl: `initSync(trigger: TgpuPipelineTrigger = 'lazy') {`, desc: 'render: explicit initSync reports lazy' },
  { id: 'M138', file: RPL, find: `            instrumentation?.pipelineFailed(`, repl: `            void (`, desc: 'render initAsync: failure hook missing' },
  { id: 'M139', file: RPL, find: `                layouts: usedBindGroupLayouts,
                module,
              },
              error,`, repl: `                layouts: [],
                module,
              },
              error,`, desc: 'render failure: layouts dropped' },
  { id: 'M140', file: RPL, find: `                pipeline: 'render',
                trigger: 'initAsync',
                resolveMs,
                createMs: instrumentation.now() - createStart,
                wgsl: resolutionResult.code,`, repl: `                pipeline: 'render',
                trigger: 'initAsync',
                resolveMs,
                createMs: instrumentation.now() - createStart,
                wgsl: '',`, desc: 'render failure: wgsl dropped' },
  { id: 'M141', file: RPL, find: `            throw error;`, repl: ``, desc: 'render initAsync: swallows rejection' },
  { id: 'M142', file: RPL, find: `    const createStart = instrumentation?.now() ?? 0;

    this.#memo = {`, repl: `    const createStart = 0;

    this.#memo = {`, desc: 'render initSync: createStart = 0' },
  { id: 'M143', file: INIT, find: `    this[$internal].instrumentation?.bindGroupCreated(key, origin);
    return raw;`, repl: `    return raw;`, desc: 'hook missing: bind group created' },
  { id: 'M144', file: INIT, find: `    const raw = key.unwrap(this);
    this[$internal].instrumentation?.bindGroupCreated(key, origin);`, repl: `    this[$internal].instrumentation?.bindGroupCreated(key, origin);
    const raw = key.unwrap(this);`, desc: 'bind group hook before unwrap (before buffers materialize)' },
  { id: 'M145', file: INIT, find: `const origin = key[$soul].raw !== undefined ? 'adopted' : 'created';`, repl: `const origin = 'created';`, desc: 'bind group origin always created' },
  { id: 'M146', file: INIT, find: `const origin = key[$soul].raw !== undefined ? 'adopted' : 'created';`, repl: `const origin = key[$soul].raw !== undefined ? 'created' : 'adopted';`, desc: 'bind group origin inverted' },
  { id: 'M147', file: INIT, find: `    this.#instrumentationHub?.rootDestroyed(this.#ownDevice);`, repl: ``, desc: 'hook missing: root destroy' },
  { id: 'M148', file: INIT, find: `rootDestroyed(this.#ownDevice)`, repl: `rootDestroyed(!this.#ownDevice)`, desc: 'root destroy: ownDevice inverted' },
  { id: 'M149', file: INIT, find: `instrumentation === true ? {} : instrumentation,`, repl: `{},`, desc: 'root ignores historySize option' },
];
