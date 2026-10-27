| bundler | case | raw | min | min+gzip-9 | min+brotli |
|---|---|---:|---:|---:|---:|
| vite | pristine/A | 517717 | 325141 | 81935 | 67677 |
| vite | patched/A | 521750 | 327836 | 82753 | 68306 |
| vite | patched/B | 540669 | 339696 | 86010 | 71106 |
| vite | pristine/C | 517393 | 324851 | 81809 | 67543 |
| vite | patched/C | 521426 | 327546 | 82626 | 68226 |
| vite | patched/Cb | 540245 | 339312 | 85856 | 70894 |
| vite | patched/D | 521426 | 327546 | 82626 | 68291 |
| vite | pristine/Ak | 535998 | 336802 | 84287 | 69517 |
| vite | patched/Ak | 540027 | 339497 | 85068 | 70140 |
| vite | patched/Bk | 558946 | 351357 | 88335 | 72918 |
| esbuild | pristine/A | 601563 | 300843 | 85955 | 72137 |
| esbuild | patched/A | 606147 | 303091 | 86638 | 72591 |
| esbuild | patched/B | 625496 | 311977 | 89551 | 75106 |
| esbuild | pristine/C | 585744 | 293069 | 83575 | 70210 |
| esbuild | patched/C | 590321 | 295317 | 84231 | 70774 |
| esbuild | patched/Cb | 609564 | 304116 | 87158 | 73213 |
| esbuild | patched/D | 590321 | 295317 | 84231 | 70774 |
| webpack | pristine/A | 866271 | 299895 | 83554 | 69397 |
| webpack | patched/A | 872209 | 302175 | 84213 | 69949 |
| webpack | patched/B | 898169 | 311328 | 87212 | 72564 |
| webpack | pristine/C | 729305 | 278663 | 77476 | 64607 |
| webpack | patched/C | 735075 | 280882 | 78161 | 65108 |
| webpack | patched/Cb | 781690 | 296208 | 82591 | 68743 |
| webpack | patched/D | 735159 | 280882 | 78161 | 64961 |
| rollup | pristine/A | 640181 | 259605 | 72951 | 61821 |
| rollup | patched/A | 645723 | 261824 | 73674 | 62290 |
| rollup | patched/B | 670632 | 270912 | 76625 | 64827 |
| rollup | pristine/C | 639666 | 259321 | 72837 | 61725 |
| rollup | patched/C | 645208 | 261540 | 73557 | 62240 |
| rollup | patched/Cb | 670188 | 270539 | 76492 | 64692 |
| rollup | patched/D | 645291 | 261540 | 73557 | 62240 |

B1 residual for non-users = patched/A - pristine/A (and patched/C - pristine/C); B2 cost for users = patched/B - patched/A (and Cb - C)

| bundler | metric | B1 residual A | B1 residual C | B2 user cost B-A | B2 hub fixed cost Cb-C | unused import D-patched/C |
|---|---|---:|---:|---:|---:|---:|
| vite | raw | +4033 | +4033 | +18919 | +18819 | +0 |
| vite | min | +2695 | +2695 | +11860 | +11766 | +0 |
| vite | gzip | +818 | +817 | +3257 | +3230 | +0 |
| vite | brotli | +629 | +683 | +2800 | +2668 | +65 |
| esbuild | raw | +4584 | +4577 | +19349 | +19243 | +0 |
| esbuild | min | +2248 | +2248 | +8886 | +8799 | +0 |
| esbuild | gzip | +683 | +656 | +2913 | +2927 | +0 |
| esbuild | brotli | +454 | +564 | +2515 | +2439 | +0 |
| webpack | raw | +5938 | +5770 | +25960 | +46615 | +84 |
| webpack | min | +2280 | +2219 | +9153 | +15326 | +0 |
| webpack | gzip | +659 | +685 | +2999 | +4430 | +0 |
| webpack | brotli | +552 | +501 | +2615 | +3635 | -147 |
| rollup | raw | +5542 | +5542 | +24909 | +24980 | +83 |
| rollup | min | +2219 | +2219 | +9088 | +8999 | +0 |
| rollup | gzip | +723 | +720 | +2951 | +2935 | +0 |
| rollup | brotli | +469 | +515 | +2537 | +2452 | +0 |

Vite + unplugin ('use gpu' kernels, compute+render app): residual raw: +4029, min.bytes: +2695, min.gzip: +781, min.brotli: +623; user cost raw: +18919, min.bytes: +11860, min.gzip: +3267, min.brotli: +2778
