import { createInstrumentation } from 'typegpu/unstable-instrumentation';
import { vi } from 'vitest';
import { d, tgpu } from 'typegpu';
import type {
  TgpuInstrumentationEvent,
  TgpuInstrumentationOptions,
} from '../../src/core/instrumentation/types.ts';

type CompilationMessage = { type: string; message: string; lineNum: number; linePos: number };

/**
 * The shared mock device has no event target, `lost` promise or shader-module diagnostics.
 * This adds exactly those, and lets a test fire them.
 */
export function makeObservableDevice(device: GPUDevice) {
  const mock = (device as unknown as { mock: Record<string, unknown> }).mock;
  const errorListeners = new Set<(event: unknown) => void>();
  let loseDevice: (info: { reason: string; message: string }) => void = () => {};
  let messages: CompilationMessage[] = [];

  const addEventListener = vi.fn((type: string, listener: (event: unknown) => void) => {
    if (type === 'uncapturederror') {
      errorListeners.add(listener);
    }
  });
  const removeEventListener = vi.fn((type: string, listener: (event: unknown) => void) => {
    if (type === 'uncapturederror') {
      errorListeners.delete(listener);
    }
  });
  const getCompilationInfo = vi.fn(async () => ({ messages }));

  mock.addEventListener = addEventListener;
  mock.removeEventListener = removeEventListener;
  mock.lost = new Promise((resolve) => {
    loseDevice = resolve;
  });
  (mock.createShaderModule as ReturnType<typeof vi.fn>).mockImplementation(
    ({ label }: { label?: string }) => ({ label, getCompilationInfo }),
  );

  class GPUValidationError extends Error {}

  return {
    addEventListener,
    removeEventListener,
    getCompilationInfo,
    get errorListenerCount() {
      return errorListeners.size;
    },
    setCompilationMessages(next: CompilationMessage[]) {
      messages = next;
    },
    fireError(message: string) {
      for (const listener of errorListeners) {
        listener({ error: new GPUValidationError(message) });
      }
    },
    lose(reason: string, message = '') {
      loseDevice({ reason, message });
    },
  };
}

export const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

export const typesOf = (events: readonly TgpuInstrumentationEvent[]) => events.map((e) => e.type);

export function ofType<T extends TgpuInstrumentationEvent['type']>(
  events: readonly TgpuInstrumentationEvent[],
  type: T,
): Extract<TgpuInstrumentationEvent, { type: T }>[] {
  return events.filter((e): e is Extract<TgpuInstrumentationEvent, { type: T }> => e.type === type);
}

// --- shared TypeGPU programs ---

export const layout = tgpu.bindGroupLayout({
  values: { storage: d.arrayOf(d.f32, 4), access: 'mutable' },
});

export const computeMain = tgpu.computeFn({ workgroupSize: [1] })(() => {
  'use gpu';
  layout.$.values[0] = 1;
});

export const vertexMain = tgpu.vertexFn({
  in: { idx: d.builtin.vertexIndex },
  out: { pos: d.builtin.position },
})(({ idx }) => {
  'use gpu';
  return { pos: d.vec4f(d.f32(idx), 0, 0, 1) };
});

export const fragmentMain = tgpu.fragmentFn({ out: d.vec4f })(() => {
  'use gpu';
  return d.vec4f(1, 0, 0, 1);
});

type Mock = ReturnType<typeof vi.fn>;
type DeviceMock = Record<
  | 'createBuffer'
  | 'createBindGroup'
  | 'createShaderModule'
  | 'createComputePipeline'
  | 'createComputePipelineAsync'
  | 'createRenderPipeline'
  | 'createRenderPipelineAsync'
  | 'createTexture',
  Mock
> & { queue: Record<'submit' | 'writeBuffer', Mock> };

export const mockOf = (device: GPUDevice) => (device as unknown as { mock: DeviceMock }).mock;

/** A root with instrumentation on and one recording subscriber. */
export function enabledRoot(device: GPUDevice, options: TgpuInstrumentationOptions = {}) {
  const root = tgpu.initFromDevice({
    device,
    unstable_instrumentation: createInstrumentation(options),
  });
  const inst = root['~unstable'].instrumentation;
  if (!inst) {
    throw new Error('instrumentation should be enabled');
  }
  const events: TgpuInstrumentationEvent[] = [];
  inst.subscribe((e) => events.push(e));
  return { root, inst, events };
}

const noop = () => {};

/**
 * A device made of plain functions: unlike the shared `vi.fn` mock it records nothing, so a long loop shows the
 * memory behaviour of the code under test and not of the test double (the `vi.fn` mock alone grows ~640 MiB
 * over 48 000 buffer creations).
 */
export function makePlainDevice(): GPUDevice {
  const pass = {
    setPipeline: noop,
    setBindGroup: noop,
    dispatchWorkgroups: noop,
    draw: noop,
    end: noop,
    setImmediates: noop,
  };
  const encoder = { beginComputePass: () => pass, beginRenderPass: () => pass, finish: () => ({}) };
  return {
    features: new Set<string>(),
    limits: {
      maxUniformBuffersPerShaderStage: 12,
      maxStorageBuffersPerShaderStage: 8,
      maxComputeWorkgroupStorageSize: 16384,
    },
    lost: new Promise(noop),
    addEventListener: noop,
    removeEventListener: noop,
    createBindGroup: () => ({}),
    createBindGroupLayout: () => ({}),
    createBuffer: ({ size, usage }: { size: number; usage: number }) => ({
      size,
      usage,
      mapState: 'unmapped',
      label: '',
      destroy: noop,
      getMappedRange: () => new ArrayBuffer(size),
      unmap: noop,
    }),
    createPipelineLayout: () => ({}),
    createShaderModule: () => ({}),
    createComputePipeline: () => ({}),
    createCommandEncoder: () => encoder,
    queue: { submit: noop, writeBuffer: noop, onSubmittedWorkDone: () => Promise.resolve() },
    destroy: noop,
  } as unknown as GPUDevice;
}
