| bundler | case | raw | min | min+gzip-9 | min+brotli |
|---|---|---:|---:|---:|---:|
| vite | pristine/A | 517717 | 325141 | 81935 | 67677 |
| vite | patched/A | 522610 | 328088 | 82760 | 68289 |
| vite | patched/B | 548370 | 343854 | 86929 | 71969 |
| vite | pristine/C | 517393 | 324851 | 81809 | 67543 |
| vite | patched/C | 522286 | 327798 | 82632 | 68356 |
| vite | patched/Cb | 547946 | 343470 | 86777 | 71724 |
| vite | patched/D | 522286 | 327798 | 82632 | 68237 |
| vite | pristine/Ak | 535998 | 336802 | 84287 | 69517 |
| vite | patched/Ak | 540887 | 339749 | 85081 | 70079 |
| vite | patched/Bk | 566647 | 355515 | 89270 | 73689 |
| esbuild | pristine/A | 601563 | 300843 | 85955 | 72137 |
| esbuild | patched/A | 607144 | 303276 | 86681 | 72585 |
| esbuild | patched/B | 633589 | 314980 | 90424 | 75853 |
| esbuild | pristine/C | 585744 | 293069 | 83575 | 70210 |
| esbuild | patched/C | 591318 | 295502 | 84269 | 70755 |
| esbuild | patched/Cb | 617645 | 307119 | 88020 | 74053 |
| esbuild | patched/D | 591318 | 295502 | 84269 | 70755 |
| webpack | pristine/A | 866271 | 299895 | 83554 | 69397 |
| webpack | patched/A | 873278 | 302370 | 84260 | 70075 |
| webpack | patched/B | 909960 | 314373 | 88092 | 73325 |
| webpack | pristine/C | 729305 | 278663 | 77476 | 64607 |
| webpack | patched/C | 736144 | 281082 | 78192 | 65063 |
| webpack | patched/Cb | 793481 | 299250 | 83415 | 69509 |
| webpack | patched/D | 736228 | 281082 | 78192 | 65058 |
| rollup | pristine/A | 640181 | 259605 | 72951 | 61821 |
| rollup | patched/A | 646792 | 262024 | 73702 | 62343 |
| rollup | patched/B | 682406 | 273964 | 77449 | 65608 |
| rollup | pristine/C | 639666 | 259321 | 72837 | 61725 |
| rollup | patched/C | 646277 | 261740 | 73589 | 62244 |
| rollup | patched/Cb | 681962 | 273591 | 77318 | 65512 |
| rollup | patched/D | 646360 | 261740 | 73589 | 62244 |

B1 residual for non-users = patched/A - pristine/A (and patched/C - pristine/C); B2 cost for users = patched/B - patched/A (and Cb - C)

| bundler | metric | B1 residual A | B1 residual C | B2 user cost B-A | B2 hub fixed cost Cb-C | unused import D-patched/C |
|---|---|---:|---:|---:|---:|---:|
| vite | raw | +4893 | +4893 | +25760 | +25660 | +0 |
| vite | min | +2947 | +2947 | +15766 | +15672 | +0 |
| vite | gzip | +825 | +823 | +4169 | +4145 | +0 |
| vite | brotli | +612 | +813 | +3680 | +3368 | -119 |
| esbuild | raw | +5581 | +5574 | +26445 | +26327 | +0 |
| esbuild | min | +2433 | +2433 | +11704 | +11617 | +0 |
| esbuild | gzip | +726 | +694 | +3743 | +3751 | +0 |
| esbuild | brotli | +448 | +545 | +3268 | +3298 | +0 |
| webpack | raw | +7007 | +6839 | +36682 | +57337 | +84 |
| webpack | min | +2475 | +2419 | +12003 | +18168 | +0 |
| webpack | gzip | +706 | +716 | +3832 | +5223 | +0 |
| webpack | brotli | +678 | +456 | +3250 | +4446 | -5 |
| rollup | raw | +6611 | +6611 | +35614 | +35685 | +83 |
| rollup | min | +2419 | +2419 | +11940 | +11851 | +0 |
| rollup | gzip | +751 | +752 | +3747 | +3729 | +0 |
| rollup | brotli | +522 | +519 | +3265 | +3268 | +0 |

Vite + unplugin ('use gpu' kernels, compute+render app): residual raw: +4889, min.bytes: +2947, min.gzip: +794, min.brotli: +562; user cost raw: +25760, min.bytes: +15766, min.gzip: +4189, min.brotli: +3610
