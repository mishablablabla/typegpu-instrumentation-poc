7 fresh Chrome processes; Chrome/156.0.8078.48; Google Inc. (Apple) ANGLE (Apple, ANGLE Metal Renderer: Apple M3 Pro, Version 26.3 (Build 25D125)); 30 samples/op/config/process
| operation | config | median ns/op | p95 ns/op | median vs plain | (range of per-process medians) |
|---|---|---|---|---|---|
| raw createBuffer | plain | 350 | 400 | - | 350-400 |
| raw createBuffer | tap-lite | 1150 | 1600 | 3.29x (+800 ns) | 1000-1200 |
| raw createBuffer | tap-full | 1150 | 1700 | 3.29x (+800 ns) | 1000-1200 |
| raw createBuffer | tap-full-nostrip | 1150 | 1600 | 3.29x (+800 ns) | 1050-1200 |
| raw buffer.destroy | plain | 50 | 63 | - | 50-50 |
| raw buffer.destroy | tap-lite | 400 | 438 | 8.00x (+350 ns) | 362-412 |
| raw buffer.destroy | tap-full | 400 | 438 | 8.00x (+350 ns) | 375-413 |
| raw buffer.destroy | tap-full-nostrip | 400 | 438 | 8.00x (+350 ns) | 362-412 |
| raw dispatch in open pass | plain | 16 | 18 | - | 14-16 |
| raw dispatch in open pass | tap-lite | 16 | 18 | 1.00x (+0 ns) | 14-16 |
| raw dispatch in open pass | tap-full | 24 | 26 | 1.50x (+8 ns) | 22-24 |
| raw dispatch in open pass | tap-full-nostrip | 24 | 26 | 1.50x (+8 ns) | 22-24 |
| raw encoder+pass+dispatch+end+finish+submit | plain | 1800 | 2200 | - | 1800-2100 |
| raw encoder+pass+dispatch+end+finish+submit | tap-lite | 2100 | 2650 | 1.17x (+300 ns) | 2100-2500 |
| raw encoder+pass+dispatch+end+finish+submit | tap-full | 5950 | 7900 | 3.31x (+4150 ns) | 5750-6250 |
| raw encoder+pass+dispatch+end+finish+submit | tap-full-nostrip | 5150 | 7750 | 2.86x (+3350 ns) | 5000-5950 |
| raw queue.writeBuffer (16 B) | plain | 68 | 70 | - | 68-70 |
| raw queue.writeBuffer (16 B) | tap-lite | 86 | 88 | 1.26x (+18 ns) | 82-88 |
| raw queue.writeBuffer (16 B) | tap-full | 84 | 88 | 1.24x (+16 ns) | 82-88 |
| raw queue.writeBuffer (16 B) | tap-full-nostrip | 86 | 88 | 1.26x (+18 ns) | 82-88 |
| raw queue.submit (prebuilt cb) | plain | 900 | 1000 | - | 800-900 |
| raw queue.submit (prebuilt cb) | tap-lite | 1100 | 1200 | 1.22x (+200 ns) | 1100-1200 |
| raw queue.submit (prebuilt cb) | tap-full | 1300 | 1400 | 1.44x (+400 ns) | 1200-1400 |
| raw queue.submit (prebuilt cb) | tap-full-nostrip | 1300 | 1400 | 1.44x (+400 ns) | 1200-1400 |
| tgpu dispatch (own encoder) | plain | 2450 | 2750 | - | 2300-2550 |
| tgpu dispatch (own encoder) | tap-lite | 2750 | 3100 | 1.12x (+300 ns) | 2700-2850 |
| tgpu dispatch (own encoder) | tap-full | 6450 | 7300 | 2.63x (+4000 ns) | 6250-6800 |
| tgpu dispatch (own encoder) | tap-full-nostrip | 5800 | 8050 | 2.37x (+3350 ns) | 5650-5900 |
| tgpu dispatch (open pass) | plain | 30 | 32 | - | 28-30 |
| tgpu dispatch (open pass) | tap-lite | 30 | 32 | 1.00x (+0 ns) | 28-30 |
| tgpu dispatch (open pass) | tap-full | 38 | 40 | 1.27x (+8 ns) | 36-40 |
| tgpu dispatch (open pass) | tap-full-nostrip | 38 | 40 | 1.27x (+8 ns) | 36-38 |
| tgpu buffer.write | plain | 200 | 210 | - | 196-212 |
| tgpu buffer.write | tap-lite | 226 | 236 | 1.13x (+26 ns) | 222-236 |
| tgpu buffer.write | tap-full | 224 | 234 | 1.12x (+24 ns) | 218-238 |
| tgpu buffer.write | tap-full-nostrip | 230 | 234 | 1.15x (+30 ns) | 220-238 |
