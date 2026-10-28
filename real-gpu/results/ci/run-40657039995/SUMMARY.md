### Mock-device tests, type check, lint (Node)

| OS | Node | Result |
|---|---|---|
| macos-latest | v24.21.0 | success |
| ubuntu-latest | v24.21.0 | success |
| windows-latest | v24.22.1 | success |

### Real browsers (same built page everywhere)

| Cell | Browser | Adapter | Classification | Viability | Real-device suite | Status |
|---|---|---|---|---|---|---|
| chrome-linux-lavapipe | Chrome/155.0.8059.39 | google/swiftshader (fallback) | software | 133/133 | 20/20 | **pass** |
| chrome-linux-swiftshader | Chrome/155.0.8059.39 | google/swiftshader (fallback) | software | 133/133 | 20/20 | **pass** |
| chrome-macos-default | Chrome/156.0.8078.48 | apple | hardware-adapter | 133/133 | 20/20 | **pass** |
| chrome-macos-swiftshader | Chrome/155.0.8059.40 | google/swiftshader (fallback) | software | 133/133 | 20/20 | **pass** |
| chrome-windows-default | Chrome/156.0.8078.48 | microsoft/warp | software | 133/133 | 20/20 | **pass** |
| chrome-windows-swiftshader | Chrome/156.0.8078.48 | none | unavailable | 0/0 | 0/0 | **not-run** |
| edge-windows-default | Edg/155.0.4283.62 | microsoft/warp | software | 133/133 | 20/20 | **pass** |
| firefox-linux-fallback | Firefox/158.0 | info hidden (fallback) | page-only | 131/131 (+1 skipped) | not applicable | **pass** |
| firefox-macos-fallback | Firefox/157.0 | none | page-only | 0/0 | not applicable | **not-run** |
| firefox-windows-fallback | Firefox/158.0 | none | page-only | 0/0 | not applicable | **not-run** |
| safari-macos | Version/26.6.2 Safari/605.1.15 | none | page-only | 0/0 | not applicable | **not-run** |
| safari-macos-fallback | Version/26.6.2 Safari/605.1.15 | none | page-only | 0/0 | not applicable | **not-run** |

Page digest(s): `719a9a4e4790` (one page, byte-identical in every cell)

`not-run` means the browser had no WebGPU adapter on that runner; it is not a pass. `software`/`page-only` classifications are not real-GPU validation.
