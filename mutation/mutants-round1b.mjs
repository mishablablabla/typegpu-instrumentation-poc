import { mutants as base } from './mutants.mjs';
const HUB = 'src/core/instrumentation/hub.ts';
const DEV = 'src/core/instrumentation/deviceEvents.ts';
const CPL = 'src/core/pipeline/computePipeline.ts';
const RPL = 'src/core/pipeline/renderPipeline.ts';
const INIT = 'src/core/root/init.ts';
export const raw = [
  { id: 'M43', file: HUB, find: `  const inner = (value as { buffer?: unknown }).buffer;`, repl: `  const inner = undefined as any;`, desc: 'bufferOf does not unwrap bindings wrapping a buffer' },
  { id: 'M126', file: CPL, find: `            instrumentation?.pipelineFailed(`, repl: `            if (false as boolean) instrumentation?.pipelineFailed(`, desc: 'compute initAsync: failure hook missing' },
  { id: 'M138', file: RPL, find: `            instrumentation?.pipelineFailed(`, repl: `            if (false as boolean) instrumentation?.pipelineFailed(`, desc: 'render initAsync: failure hook missing' },
  { id: 'M150', file: HUB, find: `    this.#watch = watchDevice(device, this);`, repl: `    device.addEventListener?.('uncapturederror', (e) => this.handleDeviceError(e));
    void device.lost?.then((i) => this.handleDeviceLost(i));
    this.#watch = { stopErrors() {}, stopAll() {} };`, desc: 'REINTRO: per-hub device listener + lost reaction (hub kept alive by device)' },
  { id: 'M151', file: INIT, find: `    const internals = { logOptions, instrumentation: undefined as InstrumentationHub | undefined };`, repl: `    const internals = { logOptions, instrumentation: undefined as InstrumentationHub | undefined, root: this as unknown };`, desc: 'REINTRO: holder leads back to the root' },
  { id: 'M152', file: HUB, find: `      ref: new WeakRef(buffer),`, repl: `      ref: { deref: () => buffer } as unknown as WeakRef<object>,`, desc: 'REINTRO: hub holds tracked buffer strongly' },
  { id: 'M153', file: HUB, find: `  readonly #byObject = new WeakMap<object, Rec>();`, repl: `  readonly #byObject = new Map<object, Rec>() as unknown as WeakMap<object, Rec>;`, desc: 'REINTRO: #byObject is a strong Map' },
  { id: 'M154', file: HUB, find: `      ref: new WeakRef(core),`, repl: `      ref: { deref: () => core } as unknown as WeakRef<object>,`, desc: 'hub holds pipeline core strongly' },
  { id: 'M155', file: DEV, find: `  const ref = new WeakRef(sink);`, repl: `  const ref = { deref: () => sink } as unknown as WeakRef<DeviceEventSink>;`, desc: 'device listener holds sinks strongly' },
  { id: 'M156', file: DEV, find: `cleanup.register(sink, { entry, ref });`, repl: `cleanup.register(sink, { entry, ref, sink } as never);`, desc: 'FinalizationRegistry held value references sink' },
  { id: 'M157', file: INIT, find: `    this[$internal] = internals;

    if (instrumentation) {`, repl: `    this[$internal] = internals;

    if (instrumentation !== undefined) {`, desc: 'unstable_instrumentation:false enables instrumentation' },
  { id: 'M158', file: INIT, find: `    false,
    logOptions ?? {},
    shaderGeneratorClass,
    instrumentation,`, repl: `    false,
    logOptions ?? {},
    shaderGeneratorClass,`, desc: 'initFromDevice ignores the option' },
  { id: 'M159', file: INIT, find: `    true,
    logOptions ?? {},
    shaderGeneratorClass,
    instrumentation,`, repl: `    true,
    logOptions ?? {},
    shaderGeneratorClass,`, desc: 'init() (own device) ignores the option' },
  { id: 'M160', file: INIT, find: `    const origin = key[$soul].raw !== undefined ? 'adopted' : 'created';
    const raw = key.unwrap(this);`, repl: `    const raw = key.unwrap(this);
    const origin = key[$soul].raw !== undefined ? 'adopted' : 'created';`, desc: 'bind group origin read after unwrap' },
  { id: 'M161', file: CPL, find: `    if (this.#memo === undefined) {
      this.initSync('lazy');
    }`, repl: `    this.initSync('lazy');`, desc: 'compute unwrap: always calls initSync (equivalent: early-returns)' },
  { id: 'M162', file: CPL, find: `            this.#memo = { pipeline, usedBindGroupLayouts, catchall, logResources, usedImmediate };
            instrumentation?.pipelineCompiled(this, {`, repl: `            instrumentation?.pipelineCompiled(this, {`, extra: 'moves memo after (needs 2nd edit)', desc: 'placeholder' },
];
// M162 is dropped (needs two-part edit); keep list explicit
export const mutants = raw.filter((m) => m.id !== 'M162');
export { base };
