# TypeGPU Instrumentation: documentation page

An Angular 22 application with one documentation route, `/instrumentation`. It explains the instrumentation layer to TypeGPU developers: the debugging problem, a recorded-trace explorer, a live event feed, the architecture, the quick start, the event contract, the evidence, the limits and the roadmap. It is a **proof-of-concept page**, not an official TypeGPU page, and it contains no TypeGPU logos or fonts.

## Run

```bash
package-test/run.sh        # from the repository root, once: builds and packs the patched typegpu bundled by the live feed
cd site
npm install                # no lockfile is kept: it would pin the hash of the locally packed typegpu tarball
npm run check              # regenerates the data and verifies it (below); no browser needed
npm start                  # http://localhost:4200/instrumentation
npx ng build --configuration production
```

Requires Node >= 24. The page itself needs no GPU; the **live feed** needs `navigator.gpu` and degrades to a note without it.

## Where the content comes from

Nothing the page shows about the implementation is retyped. `tools/build-data.mjs` (run by `prebuild`, `prestart` and `npm run check`) generates `src/app/data/generated.ts` and `src/app/live/generated/*` from repository files:

| On the page | Source |
|---|---|
| recorded traces, event JSON, counters | `real-gpu/results/scenarios/*.jsonl` and `.txt` |
| "without instrumentation" captures | `real-gpu/results/control/*.json` |
| scenario programs | `examples/*.ts` |
| quick start | the `#region quickstart` of `package-test/consumer/src/quickstart.ts`, which `package-test/run.sh` type-checks against the packed package under three module resolutions |
| documented event types | the table of `docs/EVENT-CONTRACT.md` |
| live feed: text formatting and JSONL | `consumers/textReport.ts`, `consumers/jsonlExport.ts` copied unchanged except the type import path |

Syntax highlighting is done at build time with shiki (a dev dependency; the app ships no highlighter) using the Night Owl themes the official docs use. The Angular sanitiser would strip the colour variables, so `CodeBlock` marks that build-time HTML as trusted: it never contains user input.

`tools/check-site.mjs` fails when the page drifts: every event fixture and recorded event must conform to the TypeScript types in `overlay/src/types.ts` (checked with the compiler API), `seq` must be contiguous, the documented event types must equal the schema's, the quick start must equal the verified region, nav ids must have sections, every linked repository file must exist, and the numbers quoted from the reports (`tools/facts-check.json`) must still appear in them. The hand-written tables (verdicts, measurements, integrations, limitations, roadmap) are in `src/app/data/facts.ts`, each with the file that backs it.

## Design

Visual language of the official TypeGPU documentation (Astro Starlight + Tailwind), measured from its built output and reproduced as plain CSS custom properties in `src/styles.css`: palette, 80 px header, 300 px sidebar, 720-class content column, sharp corners, Night Owl code frames, asides, plain tables, `data-theme` dark/light with the same defaults (stored choice, else system, light only if the system is light). The docs' body typeface (Aeonik) has no licence in the repository and is not used; a system font stack stands in. JetBrains Mono (OFL) is bundled through `@fontsource-variable`.

Accessibility: skip link, landmarks, one `h1` and no skipped heading level, keyboard-operable tabs (arrow keys, Home, End), visible focus ring, `aria-current` in the sidebar, scrollable regions are focusable and labelled, reduced-motion respected, all text at WCAG AA contrast in both themes (checked by script on 2026-10-28, excluding syntax-highlight token colours). Layout works from 360 px; the sidebar becomes a drawer below 800 px.
