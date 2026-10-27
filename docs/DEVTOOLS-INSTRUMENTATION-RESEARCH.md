# Framework-agnostic instrumentation layer для TypeGPU DevTools — research

Дата: 2026-10-26 · Ветка: `fix/normalized-vertex-format-io` · Коммит: `bec5d554` · Тип: research, исходники не менялись.

**Легенда уверенности** (используется везде):

- **[F]** — факт: прочитан в коде (файл:строка на `bec5d554`) или в первичном источнике (ссылка в §11).
- **[S]** — вывод из исходников: следует из прочитанного кода, но сам я это не запускал.
- **[H]** — гипотеза: нужна проверка; в §10 указано, каким PoC-шагом.

Ничего из оценок overhead **не измерено**. Все цифры в §6 — архитектурные оценки.

Ссылки вида `packages/typegpu/src/…:N` — относительно корня репозитория.

---

## 1. Executive summary

**Вердикт: делать стоит, но только тонкий слой, и ровно там, где TypeGPU знает то, чего не знает браузер.**

- **[F]** В ядре сегодня нет ни одного обработчика `uncapturederror`, `device.lost`, `pushErrorScope`/`popErrorScope`, `getCompilationInfo` (grep по `packages/typegpu/src`, без тестов — 0 совпадений). Ошибки WebGPU уходят только в консоль браузера.
- **[F]** Сгенерированный WGSL после `device.createShaderModule` нигде не сохраняется: `Memo` пайплайна (`core/pipeline/computePipeline.ts:221`, `core/pipeline/renderPipeline.ts:442`) хранит `GPUPipeline`, layouts и `logResources`, но не `code`.
- **[F]** В `root` нет реестра ресурсов, а `root.destroy()` (`core/root/init.ts:470`) не уничтожает буферы/текстуры — только чистит кэш утилит и (для собственного device) делает `device.destroy()`.
- **[F]** Браузерные инструменты (webgpu_inspector, webgpu-dev-extension) уже умеют: список объектов, capture кадра, replay, подсветку ошибок, оценку памяти. Но они видят **сырой WebGPU**: не знают TypeGPU-имён, слоя bind group layout/slot, того, что один `core` пайплайна стоит за множеством `with(...)`-хэндлов, и что WGSL получен из TS-функций.
- **[S]** Поэтому полезный MVP — это не профайлер и не «запись всего», а 8 типов данных (§9): lifecycle ресурсов, компиляция пайплайнов + WGSL, диагностика шейдеров, device-ошибки, счётчики выполнения, граф биндингов, объём записей в буферы, опциональный GPU-тайминг.
- **[S]** Архитектура: гибрид — малая шина **событий** для редких вещей (lifecycle, compile, errors) + **snapshot** текущего состояния из слабого реестра + **счётчики** вместо событий на hot path. Per-root, opt-in при создании root, типизированный JSON-сериализуемый формат, без DOM/UI-зависимостей. Публичная поверхность — под `~unstable`.
- **[H]** При выключенном instrumentation стоимость — один чтение поля + сравнение с `undefined` на hot path; на фоне уже выполняемых 6 вызовов WebGPU на один `dispatchWorkgroups` (см. §6) это должно быть неразличимо. **Не измерено** — это первый критерий PoC.

---

## 2. Основные сценарии разработчиков и критически важные данные

Сценарии выведены из того, как ломаются WebGPU-приложения, и из того, что TypeGPU уже решил диагностировать (warning-типы в `packages/typegpu/src/tgpuLogger.ts`: `webgpu-limits-exceeded`, `uniform-schema-misaligned`, `suspicious` …). Это **[H]** относительно частоты реальных запросов — у меня нет данных об issue tracker/support-запросах. Проверка: разметить ~30 последних issue/Discord-вопросов по сценариям S1–S6 (§10, шаг 0).

| # | Сценарий | Кто страдает | Что нужно увидеть |
|---|---|---|---|
| S1 | «Ничего не рисуется / чёрный экран» | все | validation-ошибки с привязкой к TypeGPU-ресурсу; какие pipeline/pass реально выполнились; не уничтожен ли ресурс; что реально привязано |
| S2 | «Шейдер не компилируется / ведёт себя странно» | все, особенно `'use gpu'` | сгенерированный WGSL; compilation messages; TS-trace резолва (`ResolutionError.trace`, `errors.ts:49`) |
| S3 | «Фризы / лаги» | app-разработчики | синхронная компиляция пайплайна внутри кадра; пересоздание ресурсов каждый кадр; число submit/dispatch/draw; байты `writeBuffer` за кадр; GPU-время проходов |
| S4 | «Утечка памяти» | особенно React/Angular/Vue адаптеры (mount/unmount) | живые ресурсы по label и размеру; ресурсы, не уничтоженные после `root.destroy()` |
| S5 | «Compute даёт неверный результат» | compute-разработчики | значения буферов (readback) |
| S6 | «Что куда привязано» | все | граф: pipeline → layout → bind group → ресурсы |
| S7 | Bug report для мейнтейнеров | команда TypeGPU | один JSON-snapshot, который можно приложить к issue **[H]** |

**Классификация данных:**

- **Критически важные (MVP):** lifecycle буферов/текстур; события компиляции пайплайна + WGSL; диагностика шейдеров (compilation messages + ResolutionError); uncaptured/lost device-ошибки; граф биндингов; счётчики выполнения.
- **Полезные позже:** последовательность encoder/pass/dispatch/draw (capture-режим); GPU pass-тайминг (уже есть как `withPerformanceCallback`); значения буферов по запросу; sampler/querySet; `console.log` шейдеров (уже реализован в `tgsl/consoleLog`).
- **Малополезные или недоступные:** память GPU/ISA/occupancy/регистры (WebGPU не отдаёт); сырые вызовы WebGPU вне TypeGPU (только monkey-patch, как у webgpu_inspector); TS-исходник функции и source map WGSL↔TS (не существуют, см. §3 строка 7); пошаговая отладка шейдера.

---

## 3. Таблица: данные → полезность → доступность → точка сбора → ограничения

«Доступность сегодня»: **core** = данные уже живут в объектах TypeGPU; **WebGPU** = только через API браузера; **нет** = нигде.

| # | Данные | Польза | Доступность сегодня | Точка сбора в TypeGPU | Ограничения |
|---|---|---|---|---|---|
| 1 | Lifecycle буфера: declared → materialized → destroyed; размер, usage, owned/wrapped | **Крит.** | core (`$soul`: `flags`, `usages`, `dataType`), реестра нет | materialize `core/buffer/buffer.ts:269` (`createBuffer` :276); `destroy` :569 | **[F]** Создание ленивое: объект TypeGPU ≠ `GPUBuffer`, `createBuffer` вызывается при первом `.buffer`/`unwrap`. Обёрнутый `GPUBuffer` (`#ownBuffer=false`, :256) lifecycle не принадлежит TypeGPU. Внутренний staging-буфер `read()` (:546) и буферы querySet (`querySet.ts:81,90`) — не объекты TypeGPU, не отслеживаются |
| 2 | Lifecycle текстуры/вью: формат, размер, mips, usage | **Крит.** | core | `core/texture/texture.ts:333` (`createTexture`), `destroy` :681, view :718 | Внутренние ресурсы mip-генерации (`textureUtils.ts:96,101,111,114,244`) живут в кэше по device, очищаемом `clearTextureUtilsCache` (`init.ts:471`) — вне модели ресурсов |
| 3 | Sampler / QuerySet | Позже | core | `sampler.ts:234`, `querySet.ts:104` | — |
| 4 | Bind group layouts, bind groups, entries | **Крит.** | core: `bindGroup.layout`, `.entries` (`tgpuBindGroupLayout.ts`, `TgpuBindGroupImpl` :486+) | `createBindGroupLayout` :408, `createBindGroup` :545; кэш `WeakMemo` в `init.ts:350-351` | **[F]** Создаются лениво при первом unwrap. Сырой `GPUBindGroup` (`pipeline.with(layout, rawGroup)`) непрозрачен |
| 5 | Создание пайплайна: kind, label, sync/async, время | **Крит.** | core | `ComputePipelineCore.initSync` `computePipeline.ts:534`, `initAsync` :501; render: `renderPipeline.ts:935`, :901 | **[F]** Компиляция ленивая: `unwrap()` → `initSync()` (`computePipeline.ts:566`) при первом dispatch — синхронный хитч в кадре, если не звали `initAsync`. **[F]** Identity: `with(...)` создаёт новый хэндл поверх общего `core` (`#withPriors` :277) → события привязывать к `core`, не к хэндлу |
| 6 | Сгенерированный WGSL | **Крит.** | **теряется** после `createShaderModule` | `resolveAndCreateShaderModule` `computePipeline.ts:571` (локальная `code` :590, `createShaderModule` :602); render: :967, :1001 | Хранить строку нужно явно, только для живых пайплайнов. Rootless `tgpu.resolve()` — отдельный путь (`core/resolve/tgpuResolve.ts`) |
| 7 | TS-исходник / AST функции | Малопол. | AST (tinyest) + name + externals от unplugin | `getFunctionMetadata` `shared/meta.ts:91`; `fnCore.ts:211`; тип `shared/normalizeMetadata.ts` | **[F]** Исходного текста нет — только AST. **[F]** grep по `sourcemap` в `src` — 0 совпадений: маппинга WGSL↔TS нет. `Function.prototype.toString` даёт транспилированный JS **[S]** |
| 8 | Диагностика шейдера | **Крит.** | **нет** (`getCompilationInfo` не вызывается); `ResolutionError.trace` (`errors.ts:49`) есть при ошибке резолва | после `createShaderModule` (:602) — `module.getCompilationInfo()` | Async; сообщения указывают строки **сгенерированного** WGSL → без пункта 6 бесполезны. Лишний промис на модуль — только в режиме instrumentation **[H]** |
| 9 | Validation / uncaptured errors | **Крит.** | **нет** (0 обработчиков в `src`) | `device.addEventListener('uncapturederror')` при создании root (`init.ts:358` конструктор / `init`:671, `initFromDevice`:727) | `pushErrorScope` асинхронны и стековые → вмешиваются в пользовательские scope **[S]**; предпочтителен listener. Атрибуция: TypeGPU уже ставит `label` на все объекты → сообщения браузера содержат имена **[H — проверить на реальном Chrome]**. Остаётся ли консольное предупреждение при наличии listener — **[H]** |
| 10 | Device lost | **Крит.** | **нет** | `device.lost.then(...)` там же | `root.destroy()` с собственным device (`init.ts:473`) даёт `reason: 'destroyed'` — отфильтровать как ожидаемое **[S]** |
| 11 | Последовательность encoder/pass/dispatch/draw | Позже (capture) | частично: единые воронки | `emitComputeDispatch` `drawState.ts:353`, `emitRenderDraw` :312, `finalizeOwnEncoder` :242, `TgpuCommandEncoderImpl.submit` `commandEncoder.ts:121`, `pass.end` `computePass.ts:202`/`renderPass.ts:549` | **[F]** Обходы: `root.unwrap(pass)` (`init.ts:555`, `rawAccessed`), `adopt*` (`computePass.ts:131`), `encoder.finish()` (:133), прямые `queue.submit` в `buffer.ts:511,528,554`, `texture.ts:670`, `querySet.ts:153,171`, `textureUtils.ts:198,226,316`, и любой сырой WebGPU пользователя |
| 12 | Счётчики dispatch/draw/submit, число workgroups | **Крит.** (дёшево) | нет | те же воронки | Только TypeGPU-посредованные вызовы. Границы «кадра» в TypeGPU нет (rAF у пользователя) → маркер кадра задаёт адаптер/пользователь **[H]** |
| 13 | Записи в буферы: число и байты | Полезно | нет | `buffer.ts:433` (`write`), :485/:490 (`patch`); текстуры `texture.ts:454,618` | Не видит `queue.writeBuffer` вне TypeGPU |
| 14 | CPU-тайминги: resolve, создание пайплайна | Полезно | частично: `PERF` (`shared/meta.ts:116`) | `PerformanceTrackerImpl` `performanceTracker.ts:9` | **[F]** Только DEV/TEST (`shared/env.ts:10`) и флаг `globalThis.__TYPEGPU_MEASURE_PERF__`; пишет в `__TYPEGPU_PERF_RECORDS__`. **[F]** «compile» = время до `queue.onSubmittedWorkDone` (:26) — это не время компиляции, а ожидание очереди **[S]** |
| 15 | GPU-время прохода | Позже, opt-in | core, но per-pipeline | `withPerformanceCallback`/`withTimestampWrites`, `timeable.ts:96,133`; query set на core `computePipeline.ts:488` | Нужна фича `timestamp-query`; async readback через resolve-буфер на каждый submit; Chrome квантует до 100 µs (флаг dev-features отключает) — [Chrome docs](https://developer.chrome.com/docs/web-platform/webgpu/developer-features) |
| 16 | Значения буферов | Позже, по запросу | readback `buffer.ts:531`; CPU-зеркало `#hostBuffer` (:225) только write-стороны | — | Readback = copy + `mapAsync`, возмущает приложение; автоматическим быть не должен |
| 17 | Память GPU, драйвер, ISA, occupancy | — | **недоступно** | — | Стандартный `GPUAdapterInfo` не содержит памяти; `memoryHeaps` и др. — только за Chrome-флагом, «dev/testing only». Перечисления живых объектов в API нет (не нашёл в спеке, см. §11 пробелы) |
| 18 | Сырой WebGPU вне TypeGPU | — | только monkey-patch | — | Путь webgpu_inspector; для нас вне scope |
| 19 | `console.log` из шейдеров | Низк. (есть) | есть | `tgsl/consoleLog/*`, `drawState.ts:230` (`queueLogDrain`) | DevTools может лишь показать готовое |

---

## 4. Предлагаемая минимальная архитектура

Всё ниже — **[S]/[H]**: это предложение, а не проверенный дизайн.

### 4.1 Принципы

1. **Per-root, opt-in при создании.** Ресурсы уже держат `root` (`buffer.ts:215`, `$internal.root`; у pipeline — `options.root`/`core.root`; у pass — `#root`). Хук-сайт читает `root[$internal].instrumentation` (одно поле). Per-root, а не глобальный синглтон, потому что: несколько roots/устройств; изоляция тестов; `shared/meta.ts:25` уже предупреждает о дублях версий TypeGPU, а глобальное состояние при дублях ломается.
2. **Включение только при создании root** (`init`/`initFromDevice` option в духе существующих `unstable_*`, `init.ts:611-651`). Иначе ресурсы, созданные раньше, не видны. Для расширений браузера — необязательный `globalThis.__TYPEGPU_DEVTOOLS_HOOK__`, который читается **один раз** в конструкторе root (паттерн React DevTools: хук должен существовать до загрузки библиотеки) **[H]**.
3. **Ядро не знает про UI.** Единственный контракт — `subscribe` + `getSnapshot`. Эта форма ложится на `useSyncExternalStore` (React), signals/RxJS (Angular), plain callbacks (vanilla) **[H — подтвердить прототипами адаптеров, но сами адаптеры не пишем]**.
4. **Выход — DTO, не объекты TypeGPU.** Внутренние `TgpuBufferImpl` и `$soul` (содержит `device`, `raw`, см. `shared/soul.ts`) наружу не отдаём. События и snapshot — plain-объекты, ссылки по числовому `id`, структурно клонируемые (чтобы слать `postMessage` в расширение/worker). Схемы данных описывать через уже существующий `serializeDataSchema` (`serial/schema.ts`, экспорт в `typegpu/~internal`).
5. **Хук-сайты — только на воронках** (§3 строки 11–12), а не размазанно. Добавление нового типа ресурса = 1 хук-сайт + 1 DTO + 1 тест.

### 4.2 Эскиз контракта (иллюстративный, не финальный)

```ts
// root['~unstable'].instrumentation — undefined, если не включено при init
interface TgpuInstrumentation {
  subscribe(listener: (e: TgpuInstrumentEvent) => void): () => void;
  getSnapshot(): TgpuInstrumentSnapshot;   // сводка живого состояния, иммутабельная между изменениями
  readonly dropped: number;                // сколько событий вытеснено из ring buffer
}

type TgpuInstrumentEvent = { v: 1; seq: number; t: number } & (
  | { kind: 'resource'; op: 'declare' | 'materialize' | 'destroy'; id: number; type: 'buffer' | 'texture' | 'sampler' | 'querySet'; label?: string; /* size, usage, format … */ }
  | { kind: 'pipeline'; op: 'compiled'; id: number; pipelineKind: 'compute' | 'render'; label?: string; sync: boolean; insideDispatch: boolean; resolveMs: number; createMs: number; wgsl: string }
  | { kind: 'diagnostic'; moduleOf: number; messages: { type: string; lineNum: number; message: string }[] }
  | { kind: 'error'; source: 'uncaptured' | 'lost' | 'resolve'; message: string; label?: string }
  | { kind: 'frame'; counters: Record<string, number> }   // агрегаты за интервал, не по событию на dispatch
);
```

### 4.3 Память

- События — фиксированный ring buffer (по умолчанию порядка сотен/тысяч — число подобрать в PoC); при переполнении растёт `dropped`.
- WGSL хранится **только** для живых пайплайнов (в записи реестра), не в истории событий повторно.
- Реестр ресурсов — `WeakRef` + `FinalizationRegistry`/периодическая чистка. **[F]** Это обязательно: `packages/typegpu/tests/garbageCollection.test.ts` проверяет, что root и все ресурсы собираются GC; сильные ссылки сломают этот гарантированный тест.
- События не держат ссылок на объекты (только `id`, примитивы, строки).

### 4.4 Отключение

- Выключено: `root[$internal].instrumentation === undefined` → на каждом хук-сайте `if (inst !== undefined)`; никакого аллоцирования, реестра, listener'ов, `getCompilationInfo`.
- Вариант жёсткого отключения: гейт по `DEV`/`TEST`, как у существующего `PERF` (`shared/meta.ts:116`: `((DEV||TEST) && {...}) || undefined`) — тогда в production-бандле код вымывается бандлером. Рекомендация для MVP: **начать с dev-only гейта** (нулевой риск для production-бандла и размера), runtime-gating для prod пересмотреть после замеров. Подтвердить на `apps/treeshake-test` **[H]**.

---

## 5. Event-based vs snapshot-based vs hybrid

| | Events | Snapshot | **Hybrid (рекомендуется)** |
|---|---|---|---|
| Что даёт | порядок, история, уничтоженные ресурсы, ошибки, «когда» | текущее состояние: что живо, что с чем связано | оба |
| Hot path | дорого, если событие на dispatch/draw/write | нулевая цена (читаем реестр по запросу) | события только на редком, на hot path — числовые счётчики |
| Теряет | при переполнении ring buffer | порядок, мёртвые ресурсы, транзиентные ошибки, всё между опросами | счётчики не дают порядка (для него — capture-режим, §9 «позже») |
| Реестр ресурсов | не нужен | нужен (слабый) | нужен (слабый) |
| Стоимость API | широкая поверхность (каждый kind) | узкая (одна форма DTO) | средняя |
| Подходит адаптерам | требует reducer на стороне UI | прямое `getSnapshot` | `subscribe` сообщает «что-то изменилось» + события, `getSnapshot` — состояние |

**Рекомендация (S):** гибрид. Редкое (lifecycle, compile, diagnostic, error) — события + отражение в snapshot. Частое (dispatch/draw/submit/write) — счётчики в предаллоцированной структуре; упорядоченная трасса только в явном времени-ограниченном capture («запиши следующие N submit»), по аналогии с capture-кадром webgpu_inspector.

**Вопрос стабильного публичного API.** Минимизировать площадь: наружу только (а) `subscribe`, (б) `getSnapshot`, (в) версионированные (`v: 1`) DTO ограниченного набора `kind`, всё под `~unstable` (пространство уже существует: `tgpu.ts:19`, `tgpuUnstable.ts`) и/или `unstable_*` опцией init. Не выдавать `TgpuBuffer`/`$soul`/`GPUBuffer` наружу. Это позволяет менять внутренности ядра без ломки DevTools **[H]**.

---

## 6. Производительность и ограничения WebGPU

### 6.1 Стоимость в TypeGPU (архитектурная оценка, не измерение)

- **[F]** Путь «один `pipeline.dispatchWorkgroups()` без своего encoder'а» (`computePipeline.ts:416` `#execute`): аллокация замыкания, `createCommandEncoder`, `beginComputePass`, dispatch, `end`, `finalizeOwnEncoder` → `encoder.submit()` → `finish` + `queue.submit` (`drawState.ts:242`, `commandEncoder.ts:121`). То есть ≥6 вызовов WebGPU и несколько Map-операций на **каждый** dispatch.
- **[S]** На этом фоне проверка `inst !== undefined` — единицы наносекунд; ожидаемо неразличима, но **[H]** до замера.
- **[S]** Включённый режим: событие-объект на каждый dispatch создаёт давление на GC → поэтому счётчики в предаллоцированном `Float64Array`/полях, без аллокаций (критерий PoC).
- **[S]** Холодные места (materialize, compile, destroy) допускают полноценные события: они не в hot path, частота — единицы на ресурс.
- **[F]** GPU-тайминг уже есть, но тяжёл: на каждый submit — resolve в буфер + `mapAsync` (`timeable.ts:133-199`); включать только по явному opt-in.
- **[S]** `getCompilationInfo` и uncaptured-listener стоят дёшево, но добавляют асинхронную работу — только в режиме instrumentation.

### 6.2 Потери и ограничения

- Ring buffer теряет старое → `dropped` обязателен. Исключения в listener'ах изолировать (try/catch), чтобы наблюдатель не ломал рендер **[S]**. Реэнтерабельность (listener вызывает TypeGPU) — не допускать синхронных вызовов из хука: доставка через microtask **[H]**.
- **CPU ≠ GPU.** CPU-замеры (resolve, create, encode) отражают постановку команд. Время исполнения на GPU даёт только `timestamp-query` (опциональная фича, async, квантование 100 µs в Chrome — [Chrome docs](https://developer.chrome.com/docs/web-platform/webgpu/developer-features)). `queue.onSubmittedWorkDone` — грубый fence всей очереди (так сегодня «измеряется» compile, `performanceTracker.ts:26`).
- **Что WebGPU не даёт обычному приложению** (по первичным источникам §11): перечисление живых объектов (не нашёл в спеке); использование памяти (стандартный `GPUAdapterInfo` без памяти; `memoryHeaps` — только за dev-флагом); информацию драйвера/ISA/occupancy; содержимое буферов без readback; перехват вызовов вне вашей библиотеки без monkey-patch.
- `label` определён как «implementation-defined»; в нативные отладчики Chrome пробрасывает его только с Dawn-тогглом `use_user_defined_labels_in_backend` ([Dawn debugging](https://dawn.googlesource.com/dawn/+/HEAD/docs/dawn/debugging.md)).

---

## 7. Сравнение с существующими инструментами

Данные ниже — из первичных источников (README/доки), **код инструментов я не запускал**.

| Инструмент | Что умеет (по доке) | Механизм | Ограничения (по доке) |
|---|---|---|---|
| [webgpu_inspector](https://github.com/brendan-duncan/webgpu_inspector) | живые GPU-объекты, CPU/GPU frame time, аллокации, текстуры; capture кадра (команды, буферы, passes); record/replay N кадров; live shader editing | расширение инжектит скрипт, оборачивающий WebGPU API до загрузки страницы | авто-инъекция может не работать в workers/iframes; DevTools-панель должна быть открыта до загрузки; Firefox — только Nightly; Safari WIP |
| [webgpu-dev-extension](https://github.com/greggman/webgpu-dev-extension) (greggman) | throw на ошибках encoder, call-site, shader dump, memory tracking ([webgpu-memory](https://github.com/greggman/webgpu-memory)), счёт избыточного state, auto-labels, API breakpoints | service worker патчит API | не работает в workers |
| Chrome DevTools | **панели WebGPU я не нашёл** (вывод из отсутствия упоминания в официальной доке — не прямое утверждение) | — | — |
| Chrome dev-features flag | немасштабированные timestamps, расширенный `GPUAdapterInfo` (в т.ч. `memoryHeaps`), `strictMath` | флаг `chrome://flags/#enable-webgpu-developer-features` | «только dev/testing» ([док](https://developer.chrome.com/docs/web-platform/webgpu/developer-features)) |
| Dawn trace / RenderDoc / Xcode / PIX | нативные кадровые отладчики | Dawn toggles; трейс только Metal; RenderDoc — Windows/D3D12 | вне браузерной среды разработчика ([Dawn doc](https://dawn.googlesource.com/dawn/+/HEAD/docs/dawn/debugging.md)) |
| Safari Web Inspector | Canvas-вкладка со списком WebGPU device/pipelines (запись 2019 г.) | встроен | актуальность не проверена |
| Spector.js | WebGL; в README про WebGPU ничего нет | — | не применимо |
| three.js `renderer.info` | calls/triangles + память по ресурсам, `resolveTimestampsAsync` | встроено в рендерер | свой уровень абстракции |
| TypeGPU Runtime Inspector MCP | (по [доке TypeGPU](https://docs.swmansion.com/TypeGPU/tooling/ai-tools/)) для AI-агентов: runtime-ошибки и сгенерированный WGSL | **механизм не описан; в этом репозитории кода нет** (только упоминания в `apps/typegpu-docs/src/content/docs/getting-started.mdx` и `.../tooling/ai-tools.mdx`) | пересечение с MVP по WGSL/ошибкам — **выяснить перед PoC**, чтобы не дублировать |

**Что TypeGPU может дать сверх браузерных инструментов [S]:**

1. TypeGPU-уровневые имена и связи: какой `core` пайплайна, какие `with(...)`-хэндлы, какие slot/accessor и layout, какой `'use gpu'`-функцией порождён код.
2. WGSL, привязанный к пайплайну, **без** monkey-patch и порядка загрузки скриптов — просто потому что библиотека сама вызывает `createShaderModule`.
3. `ResolutionError.trace` — ошибки на уровне TS до того, как WGSL вообще существует.
4. Ленивая компиляция: «этот пайплайн скомпилировался синхронно внутри кадра» — браузер этого связать с кодом не может.
5. Потенциальные утечки на уровне lifecycle (`root.destroy()` + `initFromDevice` не уничтожает ресурсы — `init.ts:470-476`).

**Риск дублирования:** capture кадра, replay, инспекция текстур/буферов, live-редактирование шейдеров, memory-оценка — уже сделаны (webgpu_inspector / webgpu-memory). Это в MVP **не входит** (§9). Есть и дополняющий путь: хорошие `label` (TypeGPU уже ставит их везде) делают сырые инструменты полезнее без нашего кода.

**Референсные паттерны «тонкого хука» из других экосистем** (как идея, не как требование): React DevTools — глобальный хук, существующий до загрузки React ([hook.js](https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/hook.js)); Redux DevTools — приложение само подключает enhancer ([docs](https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md)); Vue — plugin API с буфером до подключения devtools ([docs](https://devtools.vuejs.org/plugin/api-reference)); TanStack Query — `QueryCache.subscribe` + tree-shaken компонент ([docs](https://tanstack.com/query/latest/docs/reference/QueryCache)). Для TypeGPU ближе к «явный opt-in + необязательный глобальный хук для расширения».

---

## 8. Риски API и стоимость поддержки

| Риск | Оценка | Митигация |
|---|---|---|
| Публичный контракт замораживает внутренности | Высокий, если отдавать объекты | DTO + `v` + `~unstable`; ≤8 kind'ов в MVP |
| Каждая новая фича ядра должна «поддержать» instrumentation | Средний | Хук-сайты только на воронках; новый ресурс = 1 сайт + DTO + тест |
| Воронки обходятся (raw WebGPU, `unwrap`, `adopt*`, `finish()`, прямые `queue.submit`) | **Постоянный, неустранимый** — instrumentation видит только то, что прошло через TypeGPU | Документировать как «TypeGPU-observed»; счётчик `rawAccessed` как индикатор неполноты |
| Утечки через слабое/сильное владение | Высокий, т.к. есть GC-тест | `WeakRef`; GC-тест остаётся зелёным (критерий) |
| Дубли копий TypeGPU / несколько roots | Средний (`meta.ts:25` уже предупреждает) | per-root, нет глобального состояния, кроме одноразового чтения хука |
| Влияние на bundle/tree-shaking (`sideEffects: false` в `package.json`) | Неизвестен | dev-only гейт; замер `apps/treeshake-test` |
| Побочные эффекты наблюдателя (listener `uncapturederror`, `getCompilationInfo`, readback) | Средний | только в режиме instrumentation; readback — только по явному запросу |
| Приватность: WGSL/значения уходят в расширение | Низкий для dev, нужен для prod | dev-only по умолчанию |
| Дублирование с Runtime Inspector MCP / webgpu_inspector | Средний | см. §7; уточнить механизм MCP |
| Тестируемость: mock device не имеет `lost`/`addEventListener`/`getCompilationInfo` (`typegpu-testing-utility/src/extendedIt.ts` ~l.160-190) | Низкий | расширить mock в PoC; реальные ошибки — через `pnpm test:gpu` (Lavapipe, вручную) **[H]** |

**Стоимость поддержки (оценка [H]):** константа на тип ресурса (~1 хук + DTO + тест) плюс одноразовая инфраструктура (ring buffer, реестр, счётчики). Главный долгий расход — стабильность `v1`-формата, а не код сбора.

---

## 9. Рекомендуемый MVP

### Включить (8 типов данных)

1. **Lifecycle ресурсов** — buffer/texture (declare → materialize → destroy; label, размер, usage/format; owned vs wrapped).
2. **Компиляция пайплайнов** — kind, label, sync/async, **вызвана ли внутри dispatch/draw**, resolve- и create-время, **WGSL**.
3. **Диагностика шейдеров** — `getCompilationInfo` + `ResolutionError.trace`.
4. **Device-ошибки** — `uncapturederror`, `device.lost` (с отделением `destroyed`).
5. **Счётчики выполнения** на пайплайн: dispatch/draw/submit, суммарные workgroups; без событий на вызов.
6. **Граф биндингов** (snapshot): pipeline → layouts → bind group → ресурсы по `id`.
7. **Записи в буферы/текстуры** — число и байты на ресурс (churn).
8. **GPU-тайминг** — только как opt-in поверх существующего `withPerformanceCallback`, не отдельный механизм.

### Сознательно НЕ делать

Capture/replay кадров; инспекцию содержимого буферов и текстур (readback); автоматический readback; перехват сырого WebGPU; оценку памяти GPU; source map TS↔WGSL; live-редактирование шейдеров; UI, браузерное расширение, адаптеры; сохранение истории событий на диск; instrumentation в production по умолчанию; стабильный (не-`~unstable`) API в первом релизе. Упорядоченная трасса encoder/pass/dispatch — «позже», только в ограниченном capture-режиме.

---

## 10. Конкретный план proof of concept и критерии успеха

**Принцип:** PoC в отдельной ветке/форке, без UI; потребители — тестовый скрипт, не адаптеры.

**Шаг 0 (до кода, ~0.5 дня):** (а) разметить последние issue/вопросы по S1–S7; (б) выяснить, как работает Runtime Inspector MCP (npm `typegpu-runtime-inspector-mcp`) и что он уже собирает; (в) решить per-root vs глобальный хук окончательно.

**Шаг 1 (ядро, ~1–2 дня):**
- `instrumentation` модуль: интерфейс, ring buffer, счётчики, слабый реестр.
- Хуки: materialize/destroy буфера и текстуры; compile пайплайна (WGSL, sync/async, время) в `resolveAndCreateShaderModule` + `initSync/initAsync` обоих пайплайнов; `emitComputeDispatch`/`emitRenderDraw`/`submit` — счётчики; `write`/`patch` — байты.
- Listener'ы `uncapturederror`/`lost` и `getCompilationInfo` — при включении.
- Включение через `init`/`initFromDevice` (`unstable_*`).

**Шаг 2 (потребители, ~0.5 дня):** три «адаптера» без UI в тестах: (1) консольный дамп JSON; (2) `structuredClone`-round-trip (имитация `postMessage`); (3) обёртка в форме `useSyncExternalStore` (`subscribe`/`getSnapshot`) на чистом JS, подтверждающая, что контракт пригоден для React/Angular/vanilla.

**Шаг 3 (проверки):**
- Mock-тесты на `typegpu-testing-utility` (расширить mock: `addEventListener`, `lost`, `getCompilationInfo`).
- Реальный GPU: `pnpm test:gpu` (Lavapipe) для настоящей validation-ошибки и compilation info **[H]**.
- Микро-бенчмарк: N×`dispatchWorkgroups` на mock-device с выключенным/включённым instrumentation.

**Критерии успеха (пороги — предложения, согласовать):**

| # | Критерий | Как проверить |
|---|---|---|
| 1 | Выключено: разница времени hot path в пределах шума (напр. < 2 %) | микро-бенчмарк, несколько прогонов, дисперсия |
| 2 | Включено: 0 аллокаций на dispatch/draw (счётчики) | замер heap/`--expose-gc` в духе `garbageCollection.test.ts` |
| 3 | `garbageCollection.test.ts` по-прежнему зелёный при включённом instrumentation | прогон теста с флагом |
| 4 | Ядро не импортирует DOM/React/Angular | `pnpm test:circular-deps` + grep/линт-правило |
| 5 | События/snapshot проходят `structuredClone` без потерь | тест |
| 6 | Snapshot для сценария из `garbageCollection.test.ts` `useRoot()` содержит ожидаемые ресурсы, пайплайны и WGSL (= inline-snapshot тестов) | тест |
| 7 | Намеренно сломанный шейдер/биндинг даёт `diagnostic`/`error` событие с label ресурса | mock + реальный GPU |
| 8 | Те же данные доходят до всех 3 потребителей шага 2 | тест |
| 9 | Bundle без instrumentation не вырос (dev-only гейт вымывается) | `apps/treeshake-test` |
| 10 | Площадь API ≤ `subscribe`+`getSnapshot`+≤8 kind'ов | ревью |

**Стоп-условия:** если критерий 1 или 3 не выполняется без существенной переделки ядра — идею в такой форме не продолжать.

---

## 11. Ссылки на первичные источники

**Код TypeGPU (коммит `bec5d554`):** см. файлы:строки в §3. Ключевые: `packages/typegpu/src/core/root/init.ts`, `core/buffer/buffer.ts`, `core/texture/texture.ts`, `core/pipeline/{computePipeline,renderPipeline,drawState,timeable,performanceTracker}.ts`, `core/commandEncoder/*`, `tgpuBindGroupLayout.ts`, `shared/{meta,soul,env,normalizeMetadata}.ts`, `errors.ts`, `serial/registry.ts`, `tests/garbageCollection.test.ts`, `TESTING_MAP.md`.

**WebGPU / браузеры:**
- W3C WebGPU spec: https://www.w3.org/TR/webgpu/ (`GPUDevice.lost`, `uncapturederror`, error scopes, `label`, timestamp queries)
- MDN: [`GPUDevice.lost`](https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/lost), [`uncapturederror`](https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/uncapturederror_event), [`pushErrorScope`](https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/pushErrorScope), [`getCompilationInfo`](https://developer.mozilla.org/en-US/docs/Web/API/GPUShaderModule/getCompilationInfo), [`GPUAdapterInfo`](https://developer.mozilla.org/en-US/docs/Web/API/GPUAdapterInfo)
- Chrome dev features: https://developer.chrome.com/docs/web-platform/webgpu/developer-features ; https://developer.chrome.com/blog/new-in-webgpu-121
- Dawn debugging: https://dawn.googlesource.com/dawn/+/HEAD/docs/dawn/debugging.md

**Инструменты:**
- https://github.com/brendan-duncan/webgpu_inspector
- https://github.com/greggman/webgpu-dev-extension
- https://github.com/greggman/webgpu-memory
- https://github.com/BabylonJS/Spector.js
- https://webkit.org/blog/9624/webgpu-and-wsl-in-web-inspector/
- three.js: https://threejs.org/docs/pages/Info.html
- TypeGPU AI tools / Runtime Inspector MCP: https://docs.swmansion.com/TypeGPU/tooling/ai-tools/

**Референсные дизайны хуков:**
- https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/hook.js
- https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md
- https://devtools.vuejs.org/plugin/api-reference
- https://tanstack.com/query/latest/docs/reference/QueryCache

**Не проверено (что устранило бы пробел):**
- Нет ли в спеке API перечисления живых объектов — полный проход разделов Devices/Errors.
- Нет ли в Chrome DevTools панели WebGPU — явное заявление Chrome-команды/актуальная версия DevTools.
- Остаётся ли консольное сообщение Chrome при наличии `uncapturederror` listener; попадают ли TypeGPU-labels в тексты ошибок — запуск в реальном Chrome (PoC шаг 3).
- Актуальность Safari Web Inspector для WebGPU (источник 2019).
- Механизм и охват TypeGPU Runtime Inspector MCP — исходники npm-пакета.
- Заявленное «квантование 100 µs» — только по документации Chrome, не по спеке.
