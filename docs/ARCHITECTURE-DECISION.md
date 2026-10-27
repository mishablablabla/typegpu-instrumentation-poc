# Architecture and lifecycle

## What is built

```
application ── tgpu.init({ unstable_instrumentation: createInstrumentation(opts) }) ──► root
                                                       │ attach(device, holder)  (once, root constructor)
 typegpu core (always shipped)                         ▼
   hook sites ─ root[$internal].instrumentation?.x() ─► InstrumentationHub  (shipped only if `typegpu/unstable-instrumentation` is imported)
   (type-only imports of the sink contract)             ├─ weak registry: WeakMap<object, record> + Map<id, record> + FinalizationRegistry
                                                         ├─ history: count- and byte-bounded queue + pinned failures
                                                         ├─ delivery: FIFO queue, per-listener active flag, error isolation
                                                         └─ deviceEvents.ts: ONE `uncapturederror` listener and ONE `lost` reaction per device, sinks held by WeakRef
 consumer ◄── root['~unstable'].instrumentation  (frozen facade: enabled, enable, disable, subscribe, history, getSnapshot, dispose)
```

- **Core side** (`patches/0001-instrumentation-hooks.patch`, 12 files): one property read + branch at each hook site; `InstrumentationSink`/`TgpuInstrumentationProvider` are *types* only, so no instrumentation code is reachable from `import 'typegpu'`. A new export `typegpu/unstable-instrumentation` (dev, `$built$` and publish maps).
- **Hub side** (`overlay/src/`): everything that costs bytes or memory.
- **Consumers** (`consumers/`): console reporter, JSONL export/reader, text report; they only build lines; they are examples of using the public interface, not part of the entry.

## Lifecycle model

| Object | Created | Held by | Released when |
|---|---|---|---|
| Hub | root constructor (`provider.attach`) | the root (private field), the holder object, passes opened while it was enabled, consumers who kept it | root unreachable and no pass/consumer holds it |
| Holder (`root[$internal]`) | root constructor | the root | with the root; the hub publishes/clears itself in it |
| Device listener + `lost` reaction | first hub on a device | the device (they hold hubs only through `WeakRef`) | last hub detaches (`dispose()`, borrowed `root.destroy()`, after the loss notification) or is collected (`FinalizationRegistry`); the one `lost` reaction lives as long as the device and is a few bytes |
| Records (`WeakMap`/`Map`, `WeakRef` to tracked objects) | when a resource/bind group/pipeline is first seen | the hub; tracked objects are held only weakly | `destroy()`; collection of the tracked object (finalizer) |
| History ring, pinned failures | on every event | the hub | evicted by count (`historySize`), bytes (`historyMaxBytes`) or `captureSource: false` |
| Subscriptions | `subscribe()` | the hub | `unsubscribe`, `dispose()` |
| In-flight `getCompilationInfo()` / async creation | pipeline creation | the browser until the promise settles | settles; the hub is retained until then (characterised, bounded by the browser's own settle time) |

Deterministic cleanup (tested without GC): `root.destroy()` on a borrowed device and `instrumentation.dispose()` remove the device listener and clear subscribers (`contract/defects/instrumentation tests`); `root.destroy()` on an owned device ends the stream at `device-lost`. Cleanup that depends on **garbage collection** (abandoned roots, hot reload) is a fallback, tested separately and never the only proof (`instrumentation.test.ts` GC tests with several rounds; `viability` `abandoned-roots` on a real device; the audit ran the GC tests 6× × up to 30 rounds without a flaky result).

## Alternatives evaluated

| # | Alternative | Evidence | Verdict |
|---|---|---|---|
| 1 | **Root-scoped hub + weak, shared device listener** (the original prototype) | Correct events on a real device; found D1 (30 abandoned roots kept 30 hubs through per-hub device listeners); fixed by sharing one weak listener per device | **Kept**, hardened (see the defect table in [PRODUCTION-READINESS.md](PRODUCTION-READINESS.md)) |
| 2 | **Device-scoped registry with explicit lifecycle** (one state object per device, roots register into it) | Resource ids, buffers and bind groups belong to a *root* (TypeGPU's ownership unit; `destroy()` is per root); one registry per device would merge unrelated roots' resources and make `root.destroy()` leftovers ambiguous. What *is* device-scoped (the browser's error and loss notifications) already is: `deviceEvents.ts` | **Partly adopted**: device-scoped listener registry, root-scoped state |
| 3 | **Load the hub lazily with a dynamic `import()`** | `tgpu.initFromDevice` is synchronous and events from the first calls would be lost while the module loads; the application would also need an `await` it did not have | **Rejected** |
| 4 | **Separate entry point / package boundary** (`typegpu/unstable-instrumentation`; core refers to it by types only) | Measured in Vite 8 (rolldown), esbuild 0.27, webpack 5, rollup 4: hub strings absent from every non-opt-in bundle; opting in but not referencing it adds +0 bytes; the entry costs +2.9 to +3.3 KB gzip when used ([package-test/results/bundle-matrix.md](../package-test/results/bundle-matrix.md)) | **Adopted** (the old design shipped the hub to everyone, +3.1 KB gzip) |
| 5 | **Device-level interception, no TypeGPU patch** (patch the instance methods of device/queue/encoders/passes) | Prototype run on the real GPU against unmodified TypeGPU ([experiments/device-tap](../experiments/device-tap)): 79 checks; covers wrapped resources, helper submissions, raw calls, `encoder.finish()`, `writeTexture` that the hooks cannot see; **cannot** reproduce lazy/`initSync`, TypeGPU resolve time in production builds, typed bind-group entry names, handle identity, `root.destroy()`. Cost: +8 ns per counted dispatch, but **+~4 µs per encoder** (pass/encoder own properties), i.e. dispatch with its own encoder 2.45 → 6.45 µs; 4.2 KB gzip for users; a tap dropped without `restore()` is retained by the device (the D1 class); detectable via `Function.prototype.toString`, stacks with other tools | **Not adopted as a replacement. Recommended as a complement**: a raw-coverage layer that joins the TypeGPU events by label; the TypeGPU hooks stay the semantic source |
| 6 | **Activation without touching application code** (a `globalThis` hook that DevTools sets before the app runs, like the React hook) | Not built. It needs a few bytes in core and a policy for who owns the instance; it is the natural next step once the entry point exists | **Future work** |

## Why the hooks stay in core

The semantic events (trigger `lazy`/`initSync`/`initAsync`, resolve failures, handle→core identity, typed bind-group entries, per-pipeline dispatch counters at a cost of a few ns) exist only inside TypeGPU. Their cost for applications that never opt in is measured at about 0.7–0.8 KB gzip (11 hook sites, mostly the payload code at four pipeline sites) ([bundle matrix](../package-test/results/bundle-matrix.md)); that is above the provisional 0.5 KB target of the acceptance matrix, and is reported as such, not argued away.
