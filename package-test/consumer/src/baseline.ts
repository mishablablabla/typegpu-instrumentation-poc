// Uses only upstream API: used to attribute shipped-.d.ts diagnostics to upstream vs the instrumentation patch.
import tgpu, { d } from 'typegpu';
export const f = [tgpu.init, d.f32];
