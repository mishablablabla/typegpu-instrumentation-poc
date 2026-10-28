import { tapDevice } from '../src/deviceTap.ts';
import './app.ts';
const device = await (await navigator.gpu.requestAdapter())!.requestDevice();
const tap = tapDevice(device);
tap.subscribe(console.log);
console.log(tap.snapshot());
