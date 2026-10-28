# Ecosystem research: does this need to exist?

Date: 2026-10-28. Question: does the instrumentation layer fill a gap, or duplicate tools that already exist? Method: primary sources (specifications, vendor docs, tool repositories and their source, the TypeGPU checkout read-only, GitHub issues and discussions) plus one control experiment of our own. Tools were **not** run unless a row says so: everything about an external tool is "documented, not verified by us" unless marked. Evidence labels: **[src]** read in code or in a recorded run; **[doc]** stated in the tool's documentation; **[control]** measured by us (below); **[inference]** follows from how a tool is built, not verified. Facts, observations, assumptions and recommendations are kept apart. Absence from documentation is reported as "not found / not established", never as "does not exist".

## Executive summary

- **The gap is narrow but real.** What no outside tool can observe are TypeGPU's own facts: *when* a pipeline was created (lazy, `initSync`, `initAsync`), failures that happen while TypeGPU generates WGSL and never reach WebGPU, the identity of a pipeline across `with()` handles, typed bind-group entries, per-pipeline dispatch counts. Tools that wrap the WebGPU API (WebGPU Inspector, the dev extension, the Runtime Inspector MCP's recorder, our own device-tap prototype) are structurally blind to them [inference].
- **At the level of *information*, nothing in our three scenarios is unambiguously unique.** Chrome already prints the compiler message with position and label (control run), the thrown `ResolutionError` already names the missing slot, and object-count growth is visible in webgpu-memory and WebGPU Inspector [doc]. The increment is *attribution, correlation and a structured stream that works outside DevTools* (CI, tests, other runtimes, tools).
- **Runtime Inspector MCP is not a duplicate.** It is an offline, one-shot validator that runs a module in its own headless Chromium with frame loops, submits and pipeline initialisation stubbed [src]. It does not observe a live application. It reads TypeGPU private symbols; a supported event stream is a plausible but unproven better source for it.
- **WebGPU Inspector is the real competitor for raw WebGPU** (frame capture, object list, memory, GPU time, validation errors, a "mid-frame pipeline creation" rule) [doc]. The layer must not claim any of it.
- **Weak points:** no demand signal found upstream (zero relevant issues, one maintainer comment preferring external tools), an open upstream item that may make `shader-diagnostics`/`device-error` redundant (source maps and a device-error RFC item), events carry no call-site stack, and "foundation for a browser extension" is undemonstrated because activation without editing the app is not built.
- **Recommendation:** keep it as a small standalone experimental foundation, positioned as *TypeGPU-semantic events for tests, CI and tools*, not as a general WebGPU debugger. Validate demand before building anything more (see [Recommendation](#recommendation)).

## Problem statement

A TypeGPU program fails in two different layers. Some failures are TypeGPU's own: a slot without a value, a bind group missing at dispatch, an invalid TGSL function. Others are WebGPU's: the generated WGSL is rejected, a pipeline is invalid, the device is lost. The first kind never reaches the browser; the second arrives as browser text about *generated* code the developer did not write. TypeGPU's resources and pipelines are also created lazily, so "why is nothing running?" and "why does frame time creep up?" often have no error at all. Native WebGPU offers error scopes, `uncapturederror`, `device.lost` and `getCompilationInfo()`, but TypeGPU itself handles none of them [src: grep of `packages/typegpu/src`, 0 hits], and wiring them by hand loses the TypeGPU context (which pipeline, which trigger, which handle).

## Existing tools and what they offer

### Native WebGPU and browsers

| Mechanism | What it gives | Source |
|---|---|---|
| Error scopes, `uncapturederror` | validation / out-of-memory / internal errors; scopes cannot follow work across `await`; message text is implementation-defined and differs between browsers; errors cannot be tied to a JS line | MDN [pushErrorScope](https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/pushErrorScope), [uncapturederror](https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/uncapturederror_event); Toji [error handling](https://toji.dev/webgpu-best-practices/error-handling) [doc] |
| `device.lost` | a promise with `reason` (`destroyed` when the app destroyed it) and an implementation-defined `message` | MDN [lost](https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/lost); W3C [WebGPU §3.5.2](https://www.w3.org/TR/webgpu/#devices) [doc] |
| `getCompilationInfo()` | messages with `lineNum`/`linePos`; contents and order implementation-defined; the spec says user agents *should not* put detailed compiler text in the module-creation error and should instead show it to developers, for example as a console warning | W3C [§9.1](https://www.w3.org/TR/webgpu/#shader-module-compilation-information) [doc] |
| `GPUPipelineError` | rejection value of `create*PipelineAsync`, `reason` `validation` or `internal` | MDN [GPUPipelineError](https://developer.mozilla.org/en-US/docs/Web/API/GPUPipelineError) [doc] |
| Labels | recommended on every object; implementations should use them in messages and devtools | W3C [§3.1.2](https://www.w3.org/TR/webgpu/#gpuobjectbase) [doc] |
| Chrome | `chrome://flags/#enable-webgpu-developer-features` (timestamps, extended adapter info; nothing about devtools); Dawn toggles such as `dump_shaders` and `use_user_defined_labels_in_backend`; Metal capture via `MTL_CAPTURE_ENABLED` for Xcode | developer.chrome.com [developer-features](https://developer.chrome.com/docs/web-platform/webgpu/developer-features); Dawn [debugging.md](https://dawn.googlesource.com/dawn/+/HEAD/docs/dawn/debugging.md) [doc] |
| Chrome DevTools panel for WebGPU | **not established**: no primary source found (the DevTools "What's new" page, last updated 2024-02-29, has no WebGPU entry; individual later posts were not checked) | [whats-new](https://developer.chrome.com/docs/devtools/whats-new) |
| Safari Web Inspector | a 2019 WebKit post describes WebGPU devices and pipelines in the Canvas tab; whether this applies to the WebGPU shipped in Safari 26 is **not established** | [webkit.org/blog/9624](https://webkit.org/blog/9624/webgpu-and-wsl-in-web-inspector/) |
| Firefox | Mozilla's intent to ship (2025-10-08) says there is no devtools support for WebGPU and no concrete plans; dated, may have changed | [dev-platform](https://groups.google.com/a/mozilla.org/g/dev-platform/c/4m_SnGAGkEU/m/PdrQftcCBAAJ) [doc] |

### Tools and libraries

| Tool | Mechanism and capabilities | Source |
|---|---|---|
| **WebGPU Inspector** (Brendan Duncan, MIT) | DevTools panel; an injected script wraps the WebGPU API before page code runs; live list of GPU objects, CPU/GPU frame times, allocation plot, frame capture and replay, shader editing, validation errors; DevTools must be open at page load; a Claude Code plugin exposes tools such as `get_validation_errors` and `get_frame_issues` (includes "mid-frame pipeline creation") | [repo](https://github.com/brendan-duncan/webgpu_inspector), [plugin README](https://raw.githubusercontent.com/brendan-duncan/webgpu_inspector/main/claude-plugin/README.md) [doc] |
| **webgpu-dev-extension** (Greggman) | toggles for showing errors in the console even when the app captures them, printing shader source on failure, auto-labelling, memory tracking, call counts, API breakpoints | [repo](https://github.com/greggman/webgpu-dev-extension) [doc] |
| **webgpu-memory** (Greggman) | bytes for buffers/textures and *counts* per object type (pipelines, bind groups, ...); estimates; counts lag behind GC | [repo](https://github.com/greggman/webgpu-memory) [doc] |
| **webgpu-debug-helper** (Greggman) | wraps the API so encoder errors throw at the offending call with a stack | [repo](https://github.com/greggman/webgpu-debug-helper) [doc] |
| **takahirox/webgpu-devtools** | alpha; tracks objects, captures commands, shows WGSL, call stacks | [repo](https://github.com/takahirox/webgpu-devtools) [doc] |
| **Spector.js** | WebGL only ("WebGPU" does not appear in its README) | [repo](https://github.com/BabylonJS/Spector.js) [doc] |
| **three.js** (framework precedent) | PR #33418 added `renderer.onError`, `getCompilationInfo()` on failed pipelines with line, column and excerpt, and stopped swallowing async pipeline rejections; its "before" was the opaque `[Invalid ShaderModule "fragment"] is invalid` | [PR](https://github.com/mrdoob/three.js/pull/33418) [src] |
| **WESL** | `WeslDevice` maps compilation info back to WESL sources | [docs](https://js.wesl-lang.dev/interfaces/WeslDevice) (search snippet only) |
| Babylon.js inspector, wgpu tracing | **not investigated** beyond a forum search | – |

### What TypeGPU already exposes (checkout read-only, branch `fix/normalized-vertex-format-io`, `packages/typegpu` 0.12.8)

- `tgpu.resolve` returns generated WGSL; `root.device` is public; `tgpu.initFromDevice` accepts an existing device [src: `packages/typegpu/src/core/resolve/tgpuResolve.ts`, `core/root/rootTypes.ts:508-510`].
- **No** `pushErrorScope`, `popErrorScope`, `getCompilationInfo`, `uncapturederror` or `.lost` anywhere in `packages/typegpu/src` [src: grep, 0 hits].
- `$name()` becomes the GPU label of pipelines and shader modules (`"<name> - Shader"`) [src: `core/pipeline/computePipeline.ts`].
- Error classes carry context: `ResolutionError` embeds the ancestor trace (`computePipelineCore > computeFn:kernel: Missing value for 'slot:multiplier'`) [src: `errors.ts`]. Shader `console.log` and `withPerformanceCallback` (GPU time, needs `timestamp-query`) exist already, so GPU timing is a TypeGPU feature this layer deliberately does not duplicate [src].
- None of the `unstable_` init options is an inspection hook [src: `core/root/init.ts`]. Searching `packages/` and `apps/` for `inspector`, `devtools`, `debugger`, `mcp` finds only `apps/typegpu-docs/src/content/docs/tooling/ai-tools.mdx` and a link in `getting-started.mdx` [src].

### Runtime Inspector MCP, specifically

- The only TypeGPU-side mention is two sentences in the docs ("experimental TypeGPU Runtime Inspector MCP ... exposes runtime inspection data to agent tools ... catch runtime errors and inspect generated WGSL"), linking to npm [src: `ai-tools.mdx:25-30`].
- npm `typegpu-runtime-inspector-mcp` 0.10.0 (first published 2026-04-27, last 2026-09-08): "MCP server that validates TypeGPU code in a headless Chromium with WebGPU". Its repository is `github.com/reczkok/typegpu-inspector`, a personal account, not `software-mansion/TypeGPU`; the maintainer's npm contact is a Software Mansion address [src: registry JSON and `gh api`; npmjs.com itself returned HTTP 403].
- Architecture, read in its source: stdio MCP server; Vite serves the user's module; Playwright Chromium opens a fresh page per request. `gpuRecorder.ts` wraps the `GPUDevice` in a `Proxy`, records calls and reads `getCompilationInfo()`. `quiescentSetup.ts` (default on) stubs `requestAnimationFrame`, `queue.submit` and the `dispatchWorkgroups`/`initSync`/`initAsync`/`draw*` methods **before the module is imported**. `typegpuIntrospection.ts` reads TypeGPU private symbols (`$resolve`, `$soul`, `$internal`) with a comment that they are not public API. Its README says the adapter is usually a software implementation and results "say nothing about GPU performance or driver behavior" [src: `gh api repos/reczkok/typegpu-inspector/contents/...`].
- **Observation:** it is a pre-flight validator, not an observer of a running application. The docs phrase "runtime inspection data" is easy to read as live-app observation. It pins `typegpu 0.12.3` while the checkout is 0.12.8, which illustrates the cost of reading private symbols.
- **Hypothesis H2 (unverified):** it could consume a supported event stream instead of private symbols. Its one-shot, stubbed design may not benefit. Its maintainer is reachable, so asking is cheap.

### Could parts of the Runtime Inspector MCP be built into this solution?

Asked by the team on 2026-10-28. Assessment from its public source (MIT licence; repository `reczkok/typegpu-inspector`, read through `gh api`, not run):

| Piece | What it is | Fit | Recommendation |
|---|---|---|---|
| **Statement map** (`inspector/src/browser/statementMap.ts`) | Subclasses `WgslGenerator` (from `typegpu/~internal`) and plugs it in through the `unstable_shaderGeneratorClass` init option to record which TypeScript statement produced which generated code; it keeps the last 32 recorders and supports only functions written in TypeGPU's `'use gpu'` syntax, not raw WGSL strings | **Good, as a consumer-side enrichment.** It closes the layer's largest "cannot determine" item (compiler positions point into generated WGSL). It needs no new hook in core because the generator option already exists; it would join our `pipeline-created.wgsl` and `shader-diagnostics` (line, column) with its recorded statements. **Caveat read in the code:** the recorder yields, per generated function, statement *paths* in TypeGPU's tinyest AST (for example `[2, 'body', 0]`) with line spans inside the generated WGSL; turning a path into a TypeScript source position is a further step done by its editor extensions, so the join gives "function and statement path" directly and "TypeScript line" only with that extra step | Do it **together with its author** (a Software Mansion colleague) and check it against upstream issue #2935 (source maps) first, to avoid three implementations of one idea. Keep it outside the core. Not done yet; a time-boxed spike is the way to learn whether the join is exact |
| Device `Proxy` recorder (`gpuRecorder.ts`) | Wraps `GPUDevice` and records creation and submit calls | Same family as our device-tap prototype (`experiments/device-tap`) | Nothing to add; if raw coverage is wanted, one shared tap would serve both |
| Quiescent mode and one-shot validation | Stubs frame loops, `queue.submit` and pipeline init before importing the module, in a headless Chromium | A different product (pre-flight validation for an agent loop) | Keep separate; it is the reason it cannot observe a live app |
| Reading `$internal` / `$soul` for introspection | Private symbols, pinned to one TypeGPU version | The thing a supported event stream could replace | Offer the stream as its source (hypothesis H2); needs its maintainers' view |

Conclusion: reuse its *idea* (statement-level source mapping) as an optional consumer of our events, not its code or its mechanism in the core. The reverse integration (the MCP consuming our events) is the more valuable one and is also unbuilt.

## Feature comparison matrix

States: **Supported**, **Partially supported**, **Browser-specific**, **Not established**, **Not supported** (only where absence was verified by reading code or a recorded run). Suffixes as above. Columns: *Native* = WebGPU API plus the browser console; *wgpu-mem* = webgpu-memory; *Dev-ext* = webgpu-dev-extension; *WG-Insp* = WebGPU Inspector; *TypeGPU* = TypeGPU built-ins; *MCP* = Runtime Inspector MCP; *Layer* = this PoC.

| Capability | Native | wgpu-mem | Dev-ext | WG-Insp | TypeGPU | MCP | Layer |
|---|---|---|---|---|---|---|---|
| Live list of GPU objects | Not established | Partially supported (counts) [doc] | Partially supported [doc] | Supported [doc] | Not supported [src] | Partially supported (its own run) [doc] | Partially supported: TypeGPU-created buffers, textures, bind groups, pipelines; blind spots listed in `snapshot.unavailable` [src] |
| Resource create/destroy as events | Not supported (no event API) | Partially supported [doc] | Partially supported [doc] | Supported [doc] | Not supported [src] | Partially supported [src] | Supported for TypeGPU-created buffers/textures [src] |
| Compiler messages with line/column | Supported (`getCompilationInfo`) | Not established | Partially supported [doc] | Not established | Not supported [src] | Supported [src] | Supported [src] |
| Position mapped to TypeScript source | Not supported by the API | Not established | Not established | Not established | Partially supported (upstream #2935 open) | Partially supported (editor extension) [doc] | **Not supported** (positions are in generated WGSL) [src] |
| Async pipeline failure reason | Supported | Not established | Not established | Not established | Not supported [src] | Not established | Supported [src] |
| Uncaptured errors | Supported | Not established | Supported [doc] | Supported [doc] | Not supported [src] | Supported [doc] | Supported [src] |
| Device loss | Supported | Not supported [doc] | Not established | Not established | Not supported [src] | Partially supported [doc] | Supported (only `destroyed` captured on hardware; no real device reset) [src] |
| `lazy` / `initSync` / `initAsync` trigger | Not supported | Not supported | Not supported | Not supported [inference] | Not supported [src] | Not supported (stubs them) [src] | Supported [src] |
| Resolve-phase failure as an observable | Not supported (no WebGPU call) | Not supported | Not supported | Not supported [inference] | Partially supported (the thrown error) [src] | Supported in a pre-flight run [doc] | Supported as an event [src] |
| Generated WGSL text | Not supported | Not supported | Partially supported [doc] | Supported [doc] | Supported (`tgpu.resolve`) [src] | Supported [doc] | Supported (`captureSource`) [src] |
| Frame capture, replay | Not supported | Not supported | Partially supported [doc] | Supported [doc] | Not supported | Not supported [src] | Not supported by design |
| GPU execution time | Partially supported (timestamp queries) | Not supported | Not established | Supported [doc] | Supported (`withPerformanceCallback`) [src] | Not supported [src] | Not supported [src] |
| Call-site stack of the API call | Not supported | Not supported | Supported [doc] | Not established | Not supported | Not established | **Not supported** (no `stack` field) [src] |
| Observes the developer's own live app | Supported | Supported | Supported | Supported | Supported | **Not supported** (own headless run) [src] | Supported [src] |
| Works without DevTools or an extension (CI, Node, React Native) | Supported | Supported (script) | Not supported (extension) [doc] | Partially supported (CDP bridge, browsers only) [doc] | Supported | Not supported (needs Playwright Chromium) [doc] | Supported as code; Node / React Native **not established** |
| Zero setup in the app | Supported | Partially supported | Supported | Supported | Supported | Partially supported | **Not supported** (opt-in option, patched TypeGPU; global hook not built) [src] |

## Three concrete scenarios

Captured output is in `real-gpu/results/scenarios/` (layer on) and `real-gpu/results/control/` (the same programs on a plain root, layer off, Chrome 156.0.8078.49, Apple M3 Pro, hardware adapter, headless). The control run answers what the developer sees *without* the layer; the page shows both.

| | **broken-shader** (`initAsync` rejects) | **resolve-error** (missing slot, lazy dispatch) | **per-frame-churn** (pipeline and buffer per frame) |
|---|---|---|---|
| Without the layer **[control]** | the promise rejects with `[Invalid ShaderModule "broken - Shader"] is invalid due to a previous error.` (no compiler detail, as the spec's "should not" predicts); **Chrome separately logs a warning with the compiler message, the WGSL line, a caret and the label** | `dispatchWorkgroups` throws `ResolutionError`; the browser prints nothing, it never saw a shader | nothing: no error, no warning; the symptom is frame-time creep and memory growth |
| Native tooling | the console warning above; `uncapturederror` / `getCompilationInfo()` if the app wires them (it needs the shader module TypeGPU creates internally); Dawn `dump_shaders`; WebGPU Inspector lists validation errors [doc] | the thrown error and its stack; WebGPU tools see nothing because no WebGPU call happens [inference] | webgpu-memory shows growing pipeline and buffer *counts* [doc]; WebGPU Inspector has an object list and a "mid-frame pipeline creation" rule [doc]; whether TypeGPU labels (`perFrame`, `scratch`) appear there is untested |
| What the layer adds **[src]** | `pipeline-creation-failed` (`initAsync`, `create`) with the pipeline label and the exact generated WGSL, `shader-diagnostics` (1:51) correlated by `pipelineId`, retained in `retainedFailures`; one normalised record where Safari gave no `device-error` for an invalid render pipeline | `pipeline-creation-failed` (`lazy`, `resolve`, label `needsSlot`, `wgsl: null`); makes "WebGPU was never involved" explicit | "5 live pipelines named `perFrame`", "5 live resources named `scratch`", per-pipeline dispatch counts, 6 buffers alive at teardown, CPU `resolveMs` per creation. **The notes are produced by the example reporter (`consumers/textReport.ts`), not by the core** |
| Classification | **More convenient** (the message is already in Chrome's console); the increment is attribution and normalisation | **Already available** (the thrown error is the whole diagnostic); only convenient if the exception is swallowed, for example inside a render loop | **More convenient** for TypeGPU-semantic grouping and CPU resolve cost; *detecting growth* is already available elsewhere [doc]. The recorded `createMs` is ≈ 0.00 ms for repeated identical WGSL, so "each creation costs CPU" is only partly supported (`resolveMs` 0.13–0.56 ms is real; whether browser-side caching explains the rest was not investigated) |
| What it cannot determine | which TypeScript statement produced the bad WGSL (positions are in generated code); whether a browser reports the error at all | anything beyond the exception | whether retained buffers are a leak or intended (the note is a name heuristic); where the per-frame creation happens (no stack); GPU cost; leaks in samplers, views or helper submissions (blind spots) |
| What a future UI could show | a failure card per pipeline: label, trigger, phase, WGSL with the compiler position, related device errors | the same card without WGSL, labelled "never reached WebGPU" | a live table grouped by label with creation counts and age, and a teardown diff |

Caveat on "unique": the information a person needs exists somewhere in each scenario. What is unique is **who can know it from where**: TypeGPU-level facts exist only inside TypeGPU.

## Differentiation and overlap

**Narrow gap that holds** (each is [src] unless marked):

1. TypeGPU-semantic facts no outside tool observes: trigger, resolve-phase failures, CPU resolve time, handle-to-core identity, typed bind-group entries, per-pipeline dispatch counts. Proxy-based tools cannot see them by construction [inference].
2. A structured stream from a *live* application that does not depend on DevTools, an extension or CDP: the MCP is one-shot and headless; WebGPU Inspector needs a browser. Whether the layer runs under react-native-webgpu or Node is **not established**.
3. Retention and normalisation in one place: creation failure, compiler diagnostics, device error and loss, ordered by `seq`, with failures pinned outside the history ring.

**Only more convenient:** compile errors in Chrome (control run), observing uncaptured errors and loss (about five lines on `root.device`, which is public), counting objects and spotting growth (webgpu-memory, WebGPU Inspector), anything about GPU time or frames.

**Overlap and positioning:**

- *Runtime Inspector MCP*: complement or unrelated on the evidence read, not a duplicate (different mode, different consumer). Both answer "why did my shader fail", and its repository ships source-mapped editor diagnostics, the direction upstream #2935 is taking.
- *WebGPU Inspector*: competitor for raw WebGPU; our layer must not claim capture, memory, GPU time or shader editing. Complement for TypeGPU facts: GPU labels are the join key (`ARCHITECTURE-DECISION.md`, alternative 5).
- *webgpu-memory / dev-extension*: overlap on resource counts and error surfacing; no TypeGPU semantics.
- *Upstream TypeGPU*: issue [#2935](https://github.com/software-mansion/TypeGPU/issues/2935) ("Source maps", open) lists including the source of errors in WGSL errors and an RFC item to handle device errors (start by catching and re-throwing). If it lands, `shader-diagnostics` and `device-error` become partly redundant; a hook in core has to be argued as *complementary* (events for tools) rather than a second error path.

**Who would use it, for what** (grounded, not measured): TypeGPU users debugging lazy-pipeline problems (but scenario 2 is already covered by the thrown error); **test and CI assertions** ("no `pipeline-creation-failed`, no `device-error`, nothing alive at teardown" as data), which is the strongest convenience because native code would need hand-wired scopes and access to internal shader modules; a future UI. Not a fit: profiling, visual debugging, shader stepping.

**Is the framework-independent core a useful boundary?** Yes, in the narrow sense that the same contract drives four consumers in this repository without a change below it (console reporter, JSONL export and reader, text report, this documentation page's trace explorer). The caveat is that every consumer was written by the same author in the same repository, so independence is shown, not proven by an outside user.

## Limitations and unanswered questions

| # | Question | Evidence that would settle it |
|---|---|---|
| Q1 | Do WebGPU Inspector and the dev extension show TypeGPU labels and detect scenarios 1 and 3 usefully? | run each on `examples/*.ts` in Chrome, save screenshots |
| Q2 | Is the Chrome console output for scenario 1 the same with the layer off? | **Answered by the control run**: yes (`real-gpu/results/control/broken-shader.json`) |
| Q3 | Can the MCP observe a live app or consume events? | run `inspect_typegpu` with quiescence off; read its session code; ask its maintainer |
| Q4 | Is there demand for a runtime event stream or UI? | 3–5 short interviews with TypeGPU users on which of the debugging questions they hit; search Discord and support threads; usage data of the MCP/skills if available. **No demand signal was found**: zero issues, PRs or discussions on devtools or instrumentation; discussion [#1982](https://github.com/software-mansion/TypeGPU/discussions/1982) (2026-01-21) has the maintainer favouring `chrome-devtools-mcp` over a custom MCP because of maintenance cost |
| Q5 | Do react-native-webgpu and Node implement `uncapturederror`, `lost`, `getCompilationInfo`? Does the layer run there? | run the viability suite on those runtimes |
| Q6 | Is there a public way to reach the shader module TypeGPU creates? | read the public pipeline types fully; try from user code |
| Q7 | Will #2935 make `shader-diagnostics` and `device-error` redundant? | ask the maintainers; track #2935 and #3282 |
| Q8 | Is there a native Chrome DevTools WebGPU panel today? | read each DevTools release post of 2025–2026; run current Chrome |
| Q9 | Current Safari Web Inspector and Firefox devtools WebGPU status | Safari Technology Preview notes; Mozilla follow-ups; manual check |
| Q10 | Does browser-side caching explain `createMs ≈ 0` for repeated WGSL? | microbenchmark of distinct versus identical pipelines |

Not accessed or only partly: npmjs.com (403), W3C §22 verbatim (only the table of contents was returned; MDN used instead), Babylon.js inspector docs, wgpu tracing, individual Chrome DevTools release posts, any non-public TypeGPU or Software Mansion communication. Spec and README statements marked [doc] were read through a summarising fetch tool: re-read the cited page before quoting it.

## Recommendation

1. **Keep it as a standalone experimental foundation: yes, narrowly.** Position it as *TypeGPU-semantic runtime events for tests, CI and tools*, not as a general WebGPU debugger. The problem that justifies it today is observability of TypeGPU's own lifecycle: lazy creation, resolve-phase failures that never reach WebGPU, per-pipeline attribution, and teardown leftovers. None of these is demonstrated to be *wanted*; they are demonstrated to be *not observable from outside*.
2. **Stays outside the core:** every reporter and heuristic (`consumers/`), any UI, the MCP, an extension, call-site stack capture, and raw WebGPU coverage (the device-tap prototype is a complement, not a replacement).
3. **Next, in this order** (cheap before expensive; the first three take days, not weeks, and the asker is on the TypeGPU team):
   1. Put the three scenarios in front of 3–5 TypeGPU users and the maintainers and ask which they have hit (Q4).
   2. Run WebGPU Inspector on the same scenarios to confirm or refute the differentiation (Q1).
   3. Ask the MCP maintainer whether a supported event stream would replace private-symbol reads (Q3, H2).
   4. Only if 1 is positive: prototype the global-hook activation so that a tool can enable the layer without changing application code (this is what an extension would need).
4. **Evidence that would justify leaving `unstable`:** at least two consumers written by people other than the author in real use; validation on at least Windows and Linux with discrete GPUs and on Firefox; the drift CI green over several weeks against upstream `main`; no open correctness items in the contract's deviation list; the maintainers' decision on the core hook cost (0.7–0.8 KB gzip for non-users) recorded; the overlap with #2935 resolved.
5. **Evidence that would justify stopping or redesigning:** interviews show nobody hits the three questions; upstream #2935 delivers source-mapped device errors and the maintainers prefer external tools (#1982); WebGPU Inspector, once run, shows TypeGPU labels and covers the churn scenario well enough; two upstream refactors silently break hook placement (the drift job would not catch them, see `PRODUCTION-READINESS.md`).

## Sources

All accessed 2026-10-28 unless stated. Statements marked [doc] come from the pages below through a summarising fetch tool.

- W3C WebGPU: <https://www.w3.org/TR/webgpu/> (§3.1.2, §3.5.2, §9.1, §10). MDN: [WebGPU API](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API), [pushErrorScope](https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/pushErrorScope), [uncapturederror](https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/uncapturederror_event), [getCompilationInfo](https://developer.mozilla.org/en-US/docs/Web/API/GPUShaderModule/getCompilationInfo), [GPUPipelineError](https://developer.mozilla.org/en-US/docs/Web/API/GPUPipelineError), [lost](https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/lost).
- Toji, [WebGPU error handling](https://toji.dev/webgpu-best-practices/error-handling).
- Chrome: [developer features](https://developer.chrome.com/docs/web-platform/webgpu/developer-features), [troubleshooting](https://developer.chrome.com/docs/web-platform/webgpu/troubleshooting-tips), [DevTools what's new](https://developer.chrome.com/docs/devtools/whats-new). Dawn: [debugging.md](https://dawn.googlesource.com/dawn/+/HEAD/docs/dawn/debugging.md). gpuweb: [implementation status](https://github.com/gpuweb/gpuweb/wiki/implementation-status). WebKit: [Web Inspector WebGPU post](https://webkit.org/blog/9624/webgpu-and-wsl-in-web-inspector/). Mozilla: [intent to ship thread](https://groups.google.com/a/mozilla.org/g/dev-platform/c/4m_SnGAGkEU/m/PdrQftcCBAAJ).
- Tools: [WebGPU Inspector](https://github.com/brendan-duncan/webgpu_inspector), [webgpu-dev-extension](https://github.com/greggman/webgpu-dev-extension), [webgpu-memory](https://github.com/greggman/webgpu-memory), [webgpu-debug-helper](https://github.com/greggman/webgpu-debug-helper), [takahirox/webgpu-devtools](https://github.com/takahirox/webgpu-devtools), [Spector.js](https://github.com/BabylonJS/Spector.js), [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp), [three.js PR 33418](https://github.com/mrdoob/three.js/pull/33418), [WESL WeslDevice](https://js.wesl-lang.dev/interfaces/WeslDevice).
- TypeGPU: [AI tools page](https://docs.swmansion.com/TypeGPU/tooling/ai-tools/); issues [#2935](https://github.com/software-mansion/TypeGPU/issues/2935), [#991](https://github.com/software-mansion/TypeGPU/issues/991), [#122](https://github.com/software-mansion/TypeGPU/issues/122), [#738](https://github.com/software-mansion/TypeGPU/issues/738); discussions [#1982](https://github.com/software-mansion/TypeGPU/discussions/1982), [#2971](https://github.com/software-mansion/TypeGPU/discussions/2971); local checkout files cited inline (read-only).
- Runtime Inspector MCP: [npm registry JSON](https://registry.npmjs.org/typegpu-runtime-inspector-mcp), [repository](https://github.com/reczkok/typegpu-inspector) (README, `INSPECTOR_ARCHITECTURE.md`, `inspector/src/browser/gpuRecorder.ts`, `inspector/src/inspect/quiescentSetup.ts`, `inspector/src/browser/typegpuIntrospection.ts`).
- Our own evidence: `real-gpu/results/scenarios/` (layer on), `real-gpu/results/control/` (layer off), `examples/`.
