import { vi } from 'vitest';
import { d, tgpu } from 'typegpu';
import type { TgpuInstrumentationEvent } from '../../src/core/instrumentation/types.ts';

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
