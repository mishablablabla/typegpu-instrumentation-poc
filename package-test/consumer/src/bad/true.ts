import tgpu from 'typegpu';
// passing a boolean: the option takes the value of createInstrumentation()
await tgpu.init({ unstable_instrumentation: true });
