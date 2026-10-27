## 20261027-153029

```
node v24.21.0, darwin-arm64, 40 samples x 20000 calls per process, 7 processes per configuration

| operation | config | median of process medians (ns/op) | process-median range (ns/op) | vs pristine | minor GCs / 200k ops (median) |
|---|---|---|---|---|---|
| dispatch (own encoder) | pristine | 326.8 | 312.9 - 353.1 | - | 24 |
| dispatch (own encoder) | disabled | 343.9 | 326.8 - 358.7 | 5.2 % | 24 |
| dispatch (own encoder) | enabled | 339.8 | 325.1 - 412.8 | 4.0 % | 24 |
| dispatch (own encoder) | (pristine run-to-run spread) | | | 12.3 % | |
| dispatch (open pass) | pristine | 36.4 | 35.2 - 38.2 | - | 1 |
| dispatch (open pass) | disabled | 42.5 | 42.2 - 55.4 | 16.8 % | 1 |
| dispatch (open pass) | enabled | 46.7 | 45.1 - 67.4 | 28.2 % | 1 |
| dispatch (open pass) | (pristine run-to-run spread) | | | 8.3 % | |
| draw (own encoder) | pristine | 424.4 | 406.6 - 434.6 | - | 35 |
| draw (own encoder) | disabled | 451.3 | 428.6 - 472.5 | 6.3 % | 35 |
| draw (own encoder) | enabled | 456.9 | 434.3 - 476.1 | 7.7 % | 35 |
| draw (own encoder) | (pristine run-to-run spread) | | | 6.6 % | |
| buffer.write | pristine | 320.4 | 313.7 - 337.6 | - | 2 |
| buffer.write | disabled | 336.5 | 323.7 - 373.9 | 5.0 % | 2 |
| buffer.write | enabled | 350.3 | 338.2 - 398.8 | 9.3 % | 2 |
| buffer.write | (pristine run-to-run spread) | | | 7.5 % | |

Events during the whole enabled run (all hot-path work included): {"historyLength":6,"eventsEmitted":6,"droppedEvents":0,"dispatchesCounted":2010000,"drawsCounted":1005000}
```

## 20261027-153204

```
node v24.21.0, darwin-arm64, 40 samples x 20000 calls per process, 9 processes per configuration

| operation | config | median of process medians (ns/op) | process-median range (ns/op) | vs pristine | minor GCs / 200k ops (median) |
|---|---|---|---|---|---|
| dispatch (own encoder) | pristine | 331.1 | 317.4 - 352.1 | - | 24 |
| dispatch (own encoder) | pristine-b | 323.3 | 315.2 - 344.9 | -2.4 % | 24 |
| dispatch (own encoder) | disabled | 343.2 | 327.0 - 543.6 | 3.7 % | 24 |
| dispatch (own encoder) | enabled | 338.3 | 332.2 - 364.6 | 2.2 % | 24 |
| dispatch (own encoder) | (pristine run-to-run spread) | | | 10.5 % | |
| dispatch (open pass) | pristine | 37.8 | 34.7 - 38.7 | - | 1 |
| dispatch (open pass) | pristine-b | 36.3 | 35.0 - 38.7 | -3.8 % | 1 |
| dispatch (open pass) | disabled | 44.0 | 39.9 - 48.1 | 16.5 % | 1 |
| dispatch (open pass) | enabled | 47.1 | 45.3 - 50.9 | 24.8 % | 1 |
| dispatch (open pass) | (pristine run-to-run spread) | | | 10.6 % | |
| draw (own encoder) | pristine | 431.4 | 405.7 - 480.6 | - | 35 |
| draw (own encoder) | pristine-b | 418.0 | 410.2 - 446.9 | -3.1 % | 35 |
| draw (own encoder) | disabled | 434.0 | 418.6 - 512.8 | 0.6 % | 35 |
| draw (own encoder) | enabled | 431.9 | 423.7 - 466.2 | 0.1 % | 35 |
| draw (own encoder) | (pristine run-to-run spread) | | | 17.4 % | |
| buffer.write | pristine | 328.6 | 320.6 - 404.6 | - | 2 |
| buffer.write | pristine-b | 329.1 | 322.6 - 348.3 | 0.1 % | 2 |
| buffer.write | disabled | 346.7 | 330.4 - 376.6 | 5.5 % | 2 |
| buffer.write | enabled | 344.5 | 331.0 - 372.3 | 4.8 % | 2 |
| buffer.write | (pristine run-to-run spread) | | | 25.6 % | |

Events during the whole enabled run (all hot-path work included): {"historyLength":6,"eventsEmitted":6,"droppedEvents":0,"dispatchesCounted":2010000,"drawsCounted":1005000}
```

## 20261027-153423

```
node v24.21.0, darwin-arm64, 40 samples x 20000 calls per process, 9 processes per configuration

| operation | config | median of process medians (ns/op) | process-median range (ns/op) | vs pristine | minor GCs / 200k ops (median) |
|---|---|---|---|---|---|
| dispatch (own encoder) | pristine | 347.0 | 331.4 - 406.1 | - | 24 |
| dispatch (own encoder) | pristine-b | 349.0 | 334.0 - 385.9 | 0.6 % | 24 |
| dispatch (own encoder) | disabled | 355.8 | 341.0 - 394.6 | 2.6 % | 24 |
| dispatch (own encoder) | enabled | 372.6 | 347.9 - 399.2 | 7.4 % | 24 |
| dispatch (own encoder) | (pristine run-to-run spread) | | | 21.5 % | |
| dispatch (open pass) | pristine | 38.0 | 35.8 - 45.2 | - | 1 |
| dispatch (open pass) | pristine-b | 38.3 | 36.0 - 40.0 | 0.7 % | 1 |
| dispatch (open pass) | disabled | 43.3 | 39.5 - 44.1 | 13.9 % | 1 |
| dispatch (open pass) | enabled | 48.0 | 45.5 - 53.2 | 26.1 % | 1 |
| dispatch (open pass) | (pristine run-to-run spread) | | | 24.8 % | |
| draw (own encoder) | pristine | 449.3 | 435.8 - 528.2 | - | 35 |
| draw (own encoder) | pristine-b | 459.8 | 426.5 - 467.0 | 2.3 % | 35 |
| draw (own encoder) | disabled | 462.2 | 427.2 - 537.7 | 2.9 % | 35 |
| draw (own encoder) | enabled | 462.9 | 450.4 - 590.4 | 3.0 % | 35 |
| draw (own encoder) | (pristine run-to-run spread) | | | 20.6 % | |
| buffer.write | pristine | 348.6 | 323.5 - 420.2 | - | 2 |
| buffer.write | pristine-b | 345.6 | 343.0 - 377.9 | -0.9 % | 2 |
| buffer.write | disabled | 363.8 | 339.4 - 377.3 | 4.3 % | 2 |
| buffer.write | enabled | 381.6 | 362.2 - 413.0 | 9.5 % | 2 |
| buffer.write | (pristine run-to-run spread) | | | 27.7 % | |

Events during the whole enabled run (all hot-path work included): {"historyLength":6,"eventsEmitted":6,"droppedEvents":0,"dispatchesCounted":2010000,"drawsCounted":1005000}
```

## 20261027-153641

```
node v24.21.0, darwin-arm64, 40 samples x 20000 calls per process, 7 processes per configuration

| operation | config | median of process medians (ns/op) | process-median range (ns/op) | vs pristine | minor GCs / 200k ops (median) |
|---|---|---|---|---|---|
| dispatch (own encoder) | pristine | 343.8 | 324.6 - 421.1 | - | 24 |
| dispatch (own encoder) | pristine-b | 338.0 | 330.9 - 353.8 | -1.7 % | 24 |
| dispatch (own encoder) | disabled | 348.6 | 324.9 - 355.9 | 1.4 % | 24 |
| dispatch (own encoder) | enabled | 340.4 | 332.8 - 373.6 | -1.0 % | 24 |
| dispatch (own encoder) | (pristine run-to-run spread) | | | 28.1 % | |
| dispatch (open pass) | pristine | 38.0 | 37.5 - 42.4 | - | 1 |
| dispatch (open pass) | pristine-b | 37.6 | 36.9 - 38.2 | -1.2 % | 1 |
| dispatch (open pass) | disabled | 35.4 | 34.1 - 44.0 | -6.9 % | 1 |
| dispatch (open pass) | enabled | 36.7 | 33.9 - 40.1 | -3.5 % | 1 |
| dispatch (open pass) | (pristine run-to-run spread) | | | 13.1 % | |
| draw (own encoder) | pristine | 456.3 | 428.6 - 483.9 | - | 35 |
| draw (own encoder) | pristine-b | 437.5 | 426.7 - 462.4 | -4.1 % | 35 |
| draw (own encoder) | disabled | 459.7 | 426.9 - 480.0 | 0.8 % | 35 |
| draw (own encoder) | enabled | 460.7 | 443.3 - 496.4 | 1.0 % | 35 |
| draw (own encoder) | (pristine run-to-run spread) | | | 12.1 % | |
| buffer.write | pristine | 345.8 | 329.9 - 349.4 | - | 2 |
| buffer.write | pristine-b | 337.7 | 333.5 - 350.4 | -2.3 % | 2 |
| buffer.write | disabled | 343.2 | 335.9 - 378.3 | -0.7 % | 2 |
| buffer.write | enabled | 360.3 | 350.0 - 380.0 | 4.2 % | 2 |
| buffer.write | (pristine run-to-run spread) | | | 5.6 % | |

Events during the whole enabled run (all hot-path work included): {"historyLength":6,"eventsEmitted":6,"droppedEvents":0,"dispatchesCounted":0,"drawsCounted":1005000}
```

## 20261027-153954

```
node v24.21.0, darwin-arm64, 40 samples x 20000 calls per process, 9 processes per configuration

| operation | config | median of process medians (ns/op) | process-median range (ns/op) | vs pristine | minor GCs / 200k ops (median) |
|---|---|---|---|---|---|
| dispatch (own encoder) | pristine | 336.2 | 327.6 - 348.4 | - | 24 |
| dispatch (own encoder) | pristine-b | 333.4 | 326.3 - 347.6 | -0.8 % | 24 |
| dispatch (own encoder) | disabled | 337.8 | 328.6 - 358.5 | 0.5 % | 24 |
| dispatch (own encoder) | enabled | 343.2 | 336.1 - 382.1 | 2.1 % | 24 |
| dispatch (own encoder) | (pristine run-to-run spread) | | | 6.2 % | |
| dispatch (open pass) | pristine | 37.8 | 36.1 - 38.7 | - | 1 |
| dispatch (open pass) | pristine-b | 37.6 | 35.8 - 45.0 | -0.6 % | 1 |
| dispatch (open pass) | disabled | 34.7 | 33.9 - 39.2 | -8.3 % | 1 |
| dispatch (open pass) | enabled | 40.3 | 38.6 - 62.2 | 6.6 % | 1 |
| dispatch (open pass) | (pristine run-to-run spread) | | | 6.9 % | |
| draw (own encoder) | pristine | 432.2 | 420.6 - 439.8 | - | 35 |
| draw (own encoder) | pristine-b | 430.7 | 419.3 - 459.0 | -0.4 % | 35 |
| draw (own encoder) | disabled | 432.5 | 425.4 - 473.7 | 0.1 % | 35 |
| draw (own encoder) | enabled | 438.3 | 432.5 - 446.6 | 1.4 % | 35 |
| draw (own encoder) | (pristine run-to-run spread) | | | 4.4 % | |
| buffer.write | pristine | 336.8 | 324.9 - 346.8 | - | 2 |
| buffer.write | pristine-b | 328.2 | 321.6 - 341.2 | -2.6 % | 2 |
| buffer.write | disabled | 349.4 | 337.5 - 457.0 | 3.7 % | 2 |
| buffer.write | enabled | 354.3 | 342.5 - 384.8 | 5.2 % | 2 |
| buffer.write | (pristine run-to-run spread) | | | 6.5 % | |

Events during the whole enabled run (all hot-path work included): {"historyLength":6,"eventsEmitted":6,"droppedEvents":0,"dispatchesCounted":2010000,"drawsCounted":1005000}
```

## 20261027-160102

```
node v24.21.0, darwin-arm64, 40 samples x 20000 calls per process, 9 processes per configuration

| operation | config | median of process medians (ns/op) | process-median range (ns/op) | vs pristine | minor GCs / 200k ops (median) |
|---|---|---|---|---|---|
| dispatch (own encoder) | pristine | 333.7 | 317.9 - 369.5 | - | 24 |
| dispatch (own encoder) | pristine-b | 335.9 | 318.6 - 342.9 | 0.7 % | 24 |
| dispatch (own encoder) | disabled | 338.8 | 322.6 - 384.1 | 1.5 % | 24 |
| dispatch (own encoder) | enabled | 342.0 | 322.4 - 356.4 | 2.5 % | 24 |
| dispatch (own encoder) | (pristine run-to-run spread) | | | 15.5 % | |
| dispatch (open pass) | pristine | 37.1 | 35.3 - 46.0 | - | 1 |
| dispatch (open pass) | pristine-b | 37.3 | 36.3 - 38.6 | 0.4 % | 1 |
| dispatch (open pass) | disabled | 34.7 | 34.0 - 37.6 | -6.6 % | 1 |
| dispatch (open pass) | enabled | 40.8 | 38.1 - 48.7 | 10.0 % | 1 |
| dispatch (open pass) | (pristine run-to-run spread) | | | 28.9 % | |
| draw (own encoder) | pristine | 438.8 | 414.3 - 490.5 | - | 35 |
| draw (own encoder) | pristine-b | 431.1 | 413.8 - 459.4 | -1.7 % | 35 |
| draw (own encoder) | disabled | 444.8 | 421.9 - 464.2 | 1.4 % | 35 |
| draw (own encoder) | enabled | 441.5 | 424.2 - 464.7 | 0.6 % | 35 |
| draw (own encoder) | (pristine run-to-run spread) | | | 17.4 % | |
| buffer.write | pristine | 340.3 | 324.1 - 349.6 | - | 2 |
| buffer.write | pristine-b | 324.4 | 320.4 - 349.6 | -4.7 % | 2 |
| buffer.write | disabled | 347.0 | 334.0 - 362.7 | 2.0 % | 2 |
| buffer.write | enabled | 362.9 | 338.7 - 390.5 | 6.6 % | 2 |
| buffer.write | (pristine run-to-run spread) | | | 7.5 % | |

Events during the whole enabled run (all hot-path work included): {"historyLength":6,"eventsEmitted":6,"droppedEvents":0,"dispatchesCounted":2010000,"drawsCounted":1005000}
```

