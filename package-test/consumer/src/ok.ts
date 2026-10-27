// Correct usage, type-checked against the SHIPPED .d.ts (node_modules/typegpu from the packed tarball).
import { createInstrumentation, estimateEventBytes } from 'typegpu/unstable-instrumentation';
import type {
  TgpuInstrumentation,
  TgpuInstrumentationEvent,
  TgpuInstrumentationOptions,
  TgpuInstrumentationSnapshot,
} from 'typegpu/unstable-instrumentation';
import tgpu, { d } from 'typegpu';

const options: TgpuInstrumentationOptions = { historySize: 64, captureSource: false };

export async function main() {
  const root = await tgpu.init({ unstable_instrumentation: createInstrumentation({ historySize: 64 }) });
  const seen: TgpuInstrumentationEvent[] = [];
  const unsubscribe = root['~unstable'].instrumentation?.subscribe((event) => {
    seen.push(event);
    if (event.type === 'pipeline-created') {
      const wgsl: string | null = event.wgsl;
      void wgsl;
    }
    if (event.type === 'device-error') {
      void event.message;
    }
  });
  unsubscribe?.();

  const inst: TgpuInstrumentation | undefined = root['~unstable'].instrumentation;
  const snapshot: TgpuInstrumentationSnapshot | undefined = inst?.getSnapshot();
  void snapshot;
  void inst?.history().map((e) => estimateEventBytes(e));
  inst?.disable();
  inst?.enable();
  inst?.dispose();

  const fromDevice = tgpu.initFromDevice({
    device: undefined as unknown as GPUDevice,
    unstable_instrumentation: createInstrumentation(options),
  });
  void fromDevice;
  void d.f32;
}
