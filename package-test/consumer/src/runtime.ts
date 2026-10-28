// K1(d): the BUILT package (tarball extracted in node_modules) running an instrumented app against a hand-written fake device.
// Run with: node src/runtime.ts   (Node's built-in type stripping; no GPU involved)
import assert from 'node:assert/strict';
import tgpu, { d } from 'typegpu';
import { createInstrumentation } from 'typegpu/unstable-instrumentation';
import type { TgpuInstrumentationEvent } from 'typegpu/unstable-instrumentation';
import { installWebGPUGlobals, makeFakeDevice } from './fakeDevice.ts';

installWebGPUGlobals();
const results: Record<string, unknown> = {};
const flush = () => new Promise<void>((r) => setTimeout(r, 0));

async function runApp(opt: boolean) {
  const fake = makeFakeDevice();
  const root = tgpu.initFromDevice({
    device: fake.device,
    ...(opt ? { unstable_instrumentation: createInstrumentation({ historySize: 64 }) } : {}),
  });
  const events: TgpuInstrumentationEvent[] = [];
  const unsub = root['~unstable'].instrumentation?.subscribe((e) => events.push(e));
  const data = root.createMutable(d.arrayOf(d.f32, 8), [1, 2, 3, 4, 5, 6, 7, 8]);
  const compute = tgpu.computeFn({ workgroupSize: [8], in: { gid: d.builtin.globalInvocationId } })('{ data[gid.x] = data[gid.x] * 2f; }').$uses({ data });
  const pipeline = root.createComputePipeline({ compute });
  pipeline.dispatchWorkgroups(1);
  await flush();
  fake.fireError('simulated validation error');
  fake.lose('unknown');
  await flush();
  const snapshot = root['~unstable'].instrumentation?.getSnapshot();
  const history = root['~unstable'].instrumentation?.history().map((e) => e.type);
  root.destroy();
  unsub?.();
  return { fake, root, events, snapshot, history };
}

// 1. not opted in: nothing attached
{
  const { fake, root, events } = await runApp(false);
  assert.equal(root['~unstable'].instrumentation, undefined);
  assert.equal(events.length, 0);
  assert.ok(!fake.calls.includes('addEventListener:uncapturederror'), 'no device listener when not opted in');
  results.notOptedIn = { instrumentation: 'undefined', deviceListeners: 0, calls: fake.calls.length };
}

// 2. opted in
{
  const { fake, events, history, snapshot } = await runApp(true);
  const types = events.map((e) => e.type);
  assert.ok(types.includes('resource-materialized'), `got ${types}`);
  assert.ok(types.includes('pipeline-created'));
  assert.ok(types.includes('device-error'));
  assert.ok(types.includes('device-lost'));
  assert.ok(types.includes('root-destroyed'));
  assert.ok(fake.calls.includes('addEventListener:uncapturederror'));
  assert.ok(fake.calls.includes('removeEventListener:uncapturederror'), 'listener removed on destroy');
  assert.equal(fake.listenerCount('uncapturederror'), 0);
  const created = events.find((e) => e.type === 'pipeline-created');
  assert.ok(created && created.type === 'pipeline-created' && typeof created.wgsl === 'string' && created.wgsl.includes('@compute'));
  assert.ok(Array.isArray(history) && history.length > 0);
  assert.ok(snapshot && typeof snapshot === 'object');
  structuredClone(snapshot); // plain data
  results.optedIn = { eventTypes: types, historyLength: history?.length, wgslBytes: (created as { wgsl: string }).wgsl.length, listenerRemovedOnDestroy: true };
}

// 3. runtime misuse gives a useful message, not a TypeError from deep inside
for (const [name, bad] of [['true', true], ['forgot-call', createInstrumentation]] as const) {
  const fake = makeFakeDevice();
  assert.throws(
    () => tgpu.initFromDevice({ device: fake.device, unstable_instrumentation: bad as never }),
    (e: Error) => /createInstrumentation\(\)/.test(e.message),
  );
}
results.misuseThrows = 'both `true` and un-called createInstrumentation throw an Error naming createInstrumentation()';

// 4. tgpu.init() path (requestAdapter/requestDevice) with a fake navigator.gpu
{
  const fake = makeFakeDevice();
  const adapter = { features: new Set<string>(), limits: {}, requestDevice: async () => fake.device };
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { gpu: { requestAdapter: async () => adapter, getPreferredCanvasFormat: () => 'bgra8unorm', wgslLanguageFeatures: new Set() } },
  });
  const root = await tgpu.init({ unstable_instrumentation: createInstrumentation({ historySize: 8 }) });
  assert.ok(root['~unstable'].instrumentation);
  root.destroy();
  results.initPath = 'tgpu.init({unstable_instrumentation}) ok';
}

console.log(JSON.stringify({ k1d: 'PASS', ...results }, null, 2));
