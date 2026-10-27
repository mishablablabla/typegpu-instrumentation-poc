| bundler | case | raw | min | min+gzip-9 | min+brotli |
|---|---|---:|---:|---:|---:|
| vite | pristine/A | 517717 | 325141 | 81935 | 67677 |
| vite | patched/A | 522610 | 328088 | 82760 | 68289 |
| vite | patched/B | 546893 | 342923 | 86710 | 71686 |
| vite | pristine/C | 517393 | 324851 | 81809 | 67543 |
| vite | patched/C | 522286 | 327798 | 82632 | 68356 |
| vite | patched/Cb | 546469 | 342539 | 86557 | 71563 |
| vite | patched/D | 522286 | 327798 | 82632 | 68237 |
| vite | pristine/Ak | 535998 | 336802 | 84287 | 69517 |
| vite | patched/Ak | 540887 | 339749 | 85081 | 70079 |
| vite | patched/Bk | 565170 | 354584 | 89048 | 73530 |
| esbuild | pristine/A | 601563 | 300843 | 85955 | 72137 |
| esbuild | patched/A | 607144 | 303276 | 86681 | 72585 |
| esbuild | patched/B | 632281 | 314250 | 90199 | 75775 |
| esbuild | pristine/C | 585744 | 293069 | 83575 | 70210 |
| esbuild | patched/C | 591318 | 295502 | 84269 | 70755 |
| esbuild | patched/Cb | 616337 | 306389 | 87829 | 73836 |
| esbuild | patched/D | 591318 | 295502 | 84269 | 70755 |
| webpack | pristine/A | 866271 | 299895 | 83554 | 69397 |
| webpack | patched/A | 873278 | 302370 | 84260 | 70075 |
| webpack | patched/B | 907653 | 313642 | 87900 | 73186 |
| webpack | pristine/C | 729305 | 278663 | 77476 | 64607 |
| webpack | patched/C | 736144 | 281082 | 78192 | 65063 |
| webpack | patched/Cb | 791174 | 298519 | 83219 | 69314 |
| webpack | patched/D | 736228 | 281082 | 78192 | 65058 |
| rollup | pristine/A | 640181 | 259605 | 72951 | 61821 |
| rollup | patched/A | 646792 | 262024 | 73702 | 62343 |
| rollup | patched/B | 680099 | 273225 | 77256 | 65364 |
| rollup | pristine/C | 639666 | 259321 | 72837 | 61725 |
| rollup | patched/C | 646277 | 261740 | 73589 | 62244 |
| rollup | patched/Cb | 679655 | 272852 | 77121 | 65283 |
| rollup | patched/D | 646360 | 261740 | 73589 | 62244 |

B1 residual for non-users = patched/A - pristine/A (and patched/C - pristine/C); B2 cost for users = patched/B - patched/A (and Cb - C)

| bundler | metric | B1 residual A | B1 residual C | B2 user cost B-A | B2 hub fixed cost Cb-C | unused import D-patched/C |
|---|---|---:|---:|---:|---:|---:|
| vite | raw | +4893 | +4893 | +24283 | +24183 | +0 |
| vite | min | +2947 | +2947 | +14835 | +14741 | +0 |
| vite | gzip | +825 | +823 | +3950 | +3925 | +0 |
| vite | brotli | +612 | +813 | +3397 | +3207 | -119 |
| esbuild | raw | +5581 | +5574 | +25137 | +25019 | +0 |
| esbuild | min | +2433 | +2433 | +10974 | +10887 | +0 |
| esbuild | gzip | +726 | +694 | +3518 | +3560 | +0 |
| esbuild | brotli | +448 | +545 | +3190 | +3081 | +0 |
| webpack | raw | +7007 | +6839 | +34375 | +55030 | +84 |
| webpack | min | +2475 | +2419 | +11272 | +17437 | +0 |
| webpack | gzip | +706 | +716 | +3640 | +5027 | +0 |
| webpack | brotli | +678 | +456 | +3111 | +4251 | -5 |
| rollup | raw | +6611 | +6611 | +33307 | +33378 | +83 |
| rollup | min | +2419 | +2419 | +11201 | +11112 | +0 |
| rollup | gzip | +751 | +752 | +3554 | +3532 | +0 |
| rollup | brotli | +522 | +519 | +3021 | +3039 | +0 |

Vite + unplugin ('use gpu' kernels, compute+render app): residual raw: +4889, min.bytes: +2947, min.gzip: +794, min.brotli: +562; user cost raw: +24283, min.bytes: +14835, min.gzip: +3967, min.brotli: +3451
