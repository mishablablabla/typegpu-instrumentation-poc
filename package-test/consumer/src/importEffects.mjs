// K1(b): import-time side effects of the built entry, measured in a clean Node process.
// Order: (1) import 'typegpu', snapshot; (2) import 'typegpu/unstable-instrumentation'; report the delta of (2).
const counts = {};
for (const name of ['FinalizationRegistry', 'WeakRef', 'WeakMap', 'WeakSet', 'Map', 'Set', 'Proxy', 'Promise', 'Symbol', 'Function']) {
  const Orig = globalThis[name];
  if (typeof Orig !== 'function') continue;
  counts[name] = 0;
  if (name === 'Symbol') continue; // not constructible; counted via Symbol() wrapper below is too intrusive
  globalThis[name] = new Proxy(Orig, { construct(t, args, nt) { counts[name]++; return Reflect.construct(t, args, nt); } });
}
const protos = () => Object.fromEntries(['Object', 'Array', 'Promise', 'Function', 'String', 'Map', 'Set', 'Error'].map((n) => [n, Object.getOwnPropertyNames(globalThis[n].prototype ?? {}).length]));
const snap = () => ({
  globals: Object.getOwnPropertyNames(globalThis).length + Object.getOwnPropertySymbols(globalThis).length,
  globalNames: new Set(Object.getOwnPropertyNames(globalThis)),
  processEvents: Object.fromEntries(process.eventNames().filter((e) => typeof e === 'string').map((e) => [e, process.listenerCount(e)])),
  activeResources: process.getActiveResourcesInfo().length,
  protos: protos(),
  counts: { ...counts },
  errorHooks: [typeof Error.prepareStackTrace, Error.stackTraceLimit],
});
const diff = (a, b) => ({
  newGlobals: [...b.globalNames].filter((n) => !a.globalNames.has(n)),
  processEventsChanged: JSON.stringify(a.processEvents) !== JSON.stringify(b.processEvents),
  activeResourcesDelta: b.activeResources - a.activeResources,
  prototypesChanged: JSON.stringify(a.protos) !== JSON.stringify(b.protos),
  constructed: Object.fromEntries(Object.entries(b.counts).map(([k, v]) => [k, v - a.counts[k]]).filter(([, v]) => v !== 0)),
  errorHooksChanged: JSON.stringify(a.errorHooks) !== JSON.stringify(b.errorHooks),
});
const s0 = snap();
await import('typegpu');
const s1 = snap();
// Control: a dynamic import of an unrelated builtin plus the same wait, to see what the harness itself constructs.
await import('node:os');
await new Promise((r) => setTimeout(r, 20));
const s1b = snap();
const mod = await import('typegpu/unstable-instrumentation');
await new Promise((r) => setTimeout(r, 20)); // let any async import-time work show up
const s2 = snap();
console.log(JSON.stringify({
  exports: Object.keys(mod),
  importTypegpu: diff(s0, s1),
  controlImportNodeOs: diff(s1, s1b),
  importEntryAfterTypegpu: diff(s1b, s2),
}, null, 2));
