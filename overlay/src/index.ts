/**
 * Public entry point of the instrumentation layer (`typegpu/unstable-instrumentation`).
 *
 * TypeGPU's core refers to instrumentation through type-only imports, so this module (the hub, the device
 * listener registry, the event size estimate) is bundled only into applications that import it.
 */
import { InstrumentationHub } from './hub.ts';
import type {
  InstrumentationHolder,
  InstrumentationSink,
  TgpuInstrumentationOptions,
  TgpuInstrumentationProvider,
} from './types.ts';

/**
 * Creates the value for the `unstable_instrumentation` option of `tgpu.init` / `tgpu.initFromDevice`:
 * `tgpu.init({ unstable_instrumentation: createInstrumentation() })`, then read the data from
 * `root['~unstable'].instrumentation`. The provider can be passed to several roots; each gets its own state.
 */
export function createInstrumentation(
  options: TgpuInstrumentationOptions = {},
): TgpuInstrumentationProvider {
  return {
    attach(device: GPUDevice, holder: InstrumentationHolder): InstrumentationSink {
      return new InstrumentationHub(device, options, holder);
    },
  };
}

export { estimateEventBytes } from './eventSize.ts';
export type * from './types.ts';
