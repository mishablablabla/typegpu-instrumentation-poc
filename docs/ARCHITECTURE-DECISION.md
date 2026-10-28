# Architecture and lifecycle

## What is built

```
application ── tgpu.init({ unstable_instrumentation: createInstrumentation(opts) }) ──► root
                                                       │ attach(device, holder)  (once, root constructor)
 typegpu core (always shipped)                         ▼
   hook sites ─ root[$internal].instrumentation?.x() ─► InstrumentationHub  (shipped only if `typegpu/unstable-instrumentation` is imported)
   (type-only imports of the sink contract)             ├─ weak registry: WeakMap<object, record> + Map<id, record> (+ WeakRef); amortised deterministic sweep
                                                         ├─ history: count- and byte-bounded queue + pinned failures
                                                         ├─ delivery: FIFO queue, per-listener active flag, error isolation
                                                         └─ deviceEvents.ts: ONE `uncapturederror` listener and ONE `lost` reaction per device, sinks held by WeakRef
 consumer ◄── root['~unstable'].instrumentation  (frozen facade: enabled, enable, disable, subscribe, history, getSnapshot, dispose)
```

- **Core side** (`patches/0001-instrumentation-hooks.patch`, 12 files = 11 sources + `package.json`; 12 sink methods at 19 call sites): one property read + branch at each hook site; `InstrumentationSink`/`TgpuInstrumentationProvider` are *types* only, so no instrumentation code is reachable from `import 'typegpu'`. A new export `typegpu/unstable-instrumentation` (dev, `$built$` and publish maps).
- **Hub side** (`overlay/src/`): everything that costs bytes or memory.
- **Consumers** (`consumers/`): console reporter, JSONL export/reader, text report; they only build lines; they are examples of using the public interface, not part of the entry.

## Lifecycle model

| Object | Created | Held by | Released when |
|---|---|---|---|
| Hub | root constructor (`provider.attach`) | the root (private field), the holder object, passes opened while it was enabled, consumers who kept it | root unreachable and no pass/consumer holds it |
| Holder (`root[$internal]`) | root constructor | the root | with the root; the hub publishes/clears itself in it |
| Device listener + `lost` reaction | first hub on a device | the device (they hold hubs only through `WeakRef`) | last hub detaches (`dispose()`, borrowed `root.destroy()`, after the loss notification) or is collected (a `FinalizationRegistry` in `deviceEvents.ts` removes the listener of a collected hub; the hub's own registry no longer uses one); the one `lost` reaction lives as long as the device and is a few bytes |
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
| 4 | **Separate entry point / package boundary** (`typegpu/unstable-instrumentation`; core refers to it by types only) | Measured in Vite 8.0.5 (rolldown), esbuild 0.27.5, webpack 5.104.1, rollup 4.60.1: hub strings absent from every non-opt-in bundle; opting in but not referencing it adds +0 bytes gzip; the entry costs +3.7 to +4.2 KB gzip when used (B − A; webpack's alternative estimate Cb − C is +5.2 KB) ([package-test/results/bundle-matrix.md](../package-test/results/bundle-matrix.md)) | **Adopted** (the old design shipped the hub to everyone, +3.1 KB gzip) |
| 5 | **Device-level interception, no TypeGPU patch** (patch the instance methods of device/queue/encoders/passes) | Prototype run on the real GPU against unmodified TypeGPU ([experiments/device-tap](../experiments/device-tap)): 79 checks; covers wrapped resources, helper submissions, raw calls, `encoder.finish()`, `writeTexture` that the hooks cannot see; **cannot** reproduce lazy/`initSync`, TypeGPU resolve time in production builds, typed bind-group entry names, handle identity, `root.destroy()`. Cost: +8 ns per counted dispatch, but **+~4 µs per encoder** (pass/encoder own properties), i.e. dispatch with its own encoder 2.45 → 6.45 µs; 4.2 KB gzip for users; a tap dropped without `restore()` is retained by the device (the D1 class); detectable via `Function.prototype.toString`, stacks with other tools | **Not adopted as a replacement. Recommended as a complement**: a raw-coverage layer that joins the TypeGPU events by label; the TypeGPU hooks stay the semantic source |
| 6 | **Activation without touching application code** (a `globalThis` hook that DevTools sets before the app runs, like the React hook) | Not built. It needs a few bytes in core and a policy for who owns the instance; it is the natural next step once the entry point exists | **Future work** |

## Why the hooks stay in core

The semantic events (trigger `lazy`/`initSync`/`initAsync`, resolve failures, handle→core identity, typed bind-group entries, per-pipeline dispatch counters at a cost of a few ns) exist only inside TypeGPU. Their cost for applications that never opt in is measured at about 0.7–0.8 KB gzip (12 sink methods at 19 call sites, mostly the payload code at four pipeline sites) ([bundle matrix](../package-test/results/bundle-matrix.md)); that is above the provisional 0.5 KB target of the acceptance matrix, and is reported as such, not argued away.

## The core patch: what it touches, what could shrink, what would break

Audited 2026-10-28 (read-only, from the patch and the upstream files it touches). 12 files, 12 sink methods at 19 call sites.

| File | Change | Necessary? | Could shrink or move | Upstream internals relied on |
|---|---|---|---|---|
| `package.json` | 3 export-map entries (dev, `$built$`, `publishConfig`) | yes (entry point) | none | the three-place export scheme and the `$built$` convention |
| `core/buffer/buffer.ts`, `core/texture/texture.ts` | materialise and destroy hooks (buffers also `bufferWritten` at 2 write sites) | materialise/destroy yes; `bufferWritten` is counters only | `bufferWritten` could go (drops `writes`/`bytesWritten`) | the lazy `soul.raw` creation site, the `#destroyed` guard, `this[$internal].root` |
| `core/commandEncoder/commandEncoder.ts` | `submitted()` after `queue.submit` | counters only | optional | `submit()` as the single TypeGPU submit funnel |
| `computePass.ts`, `renderPass.ts` | an `instrumentation` field in the pass internals, read once at pass creation | **no**: `emitRenderDraw`/`emitComputeDispatch` already receive `root`, so reading `root[$internal].instrumentation` there would avoid touching these two files (at the cost of one property read per call and the semantics that a pass opened while enabled follows a later `disable()`) | 2 files could be dropped | the internals interfaces and every site that constructs them (TypeScript flags a new one) |
| `core/pipeline/drawState.ts` | `drew`/`dispatched` after the raw call | counters only | optional | `emitRenderDraw`/`emitComputeDispatch` as the only draw/dispatch funnel: a new path that bypasses them is silently uncounted |
| `computePipeline.ts`, `renderPipeline.ts` | trigger plumbing (`initSync`/`unwrap` → `lazy`), `#resolveObserved`, `resolveMs`, payload construction at 4 create and 2 async-failure sites, 2 resolve-failure sites | the core of the feature | build the payloads in the hub (estimated −100 to −150 B gzip); the compute and render copies are near-duplicates | the `initSync`/`initAsync`/`unwrap` split, `#memo`, `resolveAndCreateShaderModule`'s return shape and that `createShaderModule` happens inside it (hence the wide `phase: 'resolve'`) |
| `core/root/init.ts` | provider option, `attach()` in the constructor, the `instrumentation` getter, `rootDestroyed` first in `destroy()`, the `WeakMemo` `onMade` hook for bind groups | yes | the `WeakMemo` change could live in `init.ts` (a subclass or wrapper), removing one touched file | `[$internal]` on the root, `WeakMemo`, `#unwrappedBindGroups` as *the* place bind groups are created per root, `key[$soul].raw === raw` meaning "adopted", the constructor argument order, `init` creating the device before the constructor |
| `core/root/rootTypes.ts`, `memo.ts` | typing; `WeakMemo` second constructor argument | yes (typing) | none | the `'~unstable': Pick<...>` list |

The overlay (not part of the patch) also depends on `shared/meta.ts getName`, `shared/symbols.ts $soul`, the bind-group object shape and `resourceType === 'buffer'` on bindings. A change to any of them yields a self-disabled layer (`internalErrors` > 0, visible) or a silent `resourceId: null`.

**Refactors that break silently** (the patch still applies, behaviour is wrong): a new dispatch or draw path that does not use the two funnel functions; a new place that creates buffers, textures, bind groups or pipelines (the blind-spot list grows; `blindspots.test.ts` pins only the known ones); bind groups moved out of the `WeakMemo` cache; moving `createShaderModule` or the connect functions relative to `resolveAndCreateShaderModule` (changes what `phase: 'resolve'` covers); allowing `initSync` while `initAsync` is pending. **Refactors that break loudly** (patch rejected or `tsc` fails): export-map restructuring, a `WeakMemo` rewrite, a changed `TgpuRootImpl` constructor, a new construction site of the pass internals.

**What the drift job verifies.** `scripts/check-drift.sh` clones upstream `main` and runs `git apply --check` (context must still match). `scripts/check-drift-full.sh`, the `upstream-drift` CI job, additionally applies the patch, installs, copies the overlay and its tests in, and runs the instrumentation tests on a mock device plus `tsc`. It does **not** run upstream's own test suite with the patch (the 3 174-test figure is a manual run at the pinned commit), lint or format on the new tip, packaging or the bundle matrix on the new tip (the `packaging` job uses the pinned commit), any real WebGPU, or any check that a hook still sits at the semantically right place. A green drift job therefore means "still applies and the layer's own tests pass", not that upstream has accepted or will maintain the patch. As a scheduled workflow it is also disabled by GitHub after 60 days without repository activity.

**Fitness for an experimental opt-in API: adequate; for a long-lived patch: no.** A clean extension point would remove the patch: a small, stable upstream facility (events at creation, failure, dispatch and destruction, or a documented `unstable_` instrumentation provider like this one) maintained with TypeGPU. Two of the twelve files could be dropped today (the pass files) and one more by moving the `WeakMemo` hook; the five remaining behaviour files are the feature. That reduction and the upstream question are decisions for the maintainers; nothing here attempts a large refactor.

## Where consumers attach

The layers (application → hooks in core → hub → contract → consumers) and the integration paths with their status are drawn and tabulated on the documentation page ([site/](../site/), data in `site/src/app/data/facts.ts`). In one line: console, JSONL and text-report consumers exist and are tested; the Angular page has a recorded-trace explorer and a live feed; React, React Native, a browser extension and an MCP transport are proposals with no code, and none of them may enter the core.
