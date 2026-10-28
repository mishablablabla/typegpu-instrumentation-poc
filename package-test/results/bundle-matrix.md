| bundler | case | raw | min | min+gzip-9 | min+brotli |
|---|---|---:|---:|---:|---:|
| vite | pristine/A | 517717 | 325141 | 81935 | 67677 |
| vite | patched/A | 522610 | 328088 | 82760 | 68289 |
| vite | patched/B | 548920 | 344161 | 86972 | 72030 |
| vite | pristine/C | 517393 | 324851 | 81809 | 67543 |
| vite | patched/C | 522286 | 327798 | 82632 | 68356 |
| vite | patched/Cb | 548496 | 343777 | 86820 | 71795 |
| vite | patched/D | 522286 | 327798 | 82632 | 68237 |
| vite | pristine/Ak | 535998 | 336802 | 84287 | 69517 |
| vite | patched/Ak | 540887 | 339749 | 85081 | 70079 |
| vite | patched/Bk | 567197 | 355822 | 89318 | 73732 |
| esbuild | pristine/A | 601563 | 300843 | 85955 | 72137 |
| esbuild | patched/A | 607144 | 303276 | 86681 | 72585 |
| esbuild | patched/B | 634145 | 315187 | 90442 | 76035 |
| esbuild | pristine/C | 585744 | 293069 | 83575 | 70210 |
| esbuild | patched/C | 591318 | 295502 | 84269 | 70755 |
| esbuild | patched/Cb | 618201 | 307326 | 88061 | 74120 |
| esbuild | patched/D | 591318 | 295502 | 84269 | 70755 |
| webpack | pristine/A | 866271 | 299895 | 83554 | 69397 |
| webpack | patched/A | 873278 | 302370 | 84260 | 70075 |
| webpack | patched/B | 910923 | 314590 | 88143 | 73384 |
| webpack | pristine/C | 729305 | 278663 | 77476 | 64607 |
| webpack | patched/C | 736144 | 281082 | 78192 | 65063 |
| webpack | patched/Cb | 794444 | 299467 | 83463 | 69553 |
| webpack | patched/D | 736228 | 281082 | 78192 | 65058 |
| rollup | pristine/A | 640181 | 259605 | 72951 | 61821 |
| rollup | patched/A | 646792 | 262024 | 73702 | 62343 |
| rollup | patched/B | 683369 | 274182 | 77493 | 65672 |
| rollup | pristine/C | 639666 | 259321 | 72837 | 61725 |
| rollup | patched/C | 646277 | 261740 | 73589 | 62244 |
| rollup | patched/Cb | 682925 | 273809 | 77361 | 65503 |
| rollup | patched/D | 646360 | 261740 | 73589 | 62244 |

B1 residual for non-users = patched/A - pristine/A (and patched/C - pristine/C); B2 cost for users = patched/B - patched/A (and Cb - C)

| bundler | metric | B1 residual A | B1 residual C | B2 user cost B-A | B2 hub fixed cost Cb-C | unused import D-patched/C |
|---|---|---:|---:|---:|---:|---:|
| vite | raw | +4893 | +4893 | +26310 | +26210 | +0 |
| vite | min | +2947 | +2947 | +16073 | +15979 | +0 |
| vite | gzip | +825 | +823 | +4212 | +4188 | +0 |
| vite | brotli | +612 | +813 | +3741 | +3439 | -119 |
| esbuild | raw | +5581 | +5574 | +27001 | +26883 | +0 |
| esbuild | min | +2433 | +2433 | +11911 | +11824 | +0 |
| esbuild | gzip | +726 | +694 | +3761 | +3792 | +0 |
| esbuild | brotli | +448 | +545 | +3450 | +3365 | +0 |
| webpack | raw | +7007 | +6839 | +37645 | +58300 | +84 |
| webpack | min | +2475 | +2419 | +12220 | +18385 | +0 |
| webpack | gzip | +706 | +716 | +3883 | +5271 | +0 |
| webpack | brotli | +678 | +456 | +3309 | +4490 | -5 |
| rollup | raw | +6611 | +6611 | +36577 | +36648 | +83 |
| rollup | min | +2419 | +2419 | +12158 | +12069 | +0 |
| rollup | gzip | +751 | +752 | +3791 | +3772 | +0 |
| rollup | brotli | +522 | +519 | +3329 | +3259 | +0 |

Vite + unplugin ('use gpu' kernels, compute+render app): residual raw: +4889, min.bytes: +2947, min.gzip: +794, min.brotli: +562; user cost raw: +26310, min.bytes: +16073, min.gzip: +4237, min.brotli: +3653
