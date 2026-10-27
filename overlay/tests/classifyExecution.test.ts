import { describe, expect, it } from 'vitest';
import { classifyExecution } from './classify.ts';

const apple = 'Google Inc. (Apple) ANGLE (Apple, ANGLE Metal Renderer: Apple M3 Pro)';

describe('real-device run classification', () => {
  it('accepts a non-fallback adapter backed by a listed hardware GPU', () => {
    expect(
      classifyExecution({
        pageClassification: 'non-fallback',
        gpuProcessText: apple,
        gpuProcessDeviceCount: 1,
      }),
    ).toBe('hardware-adapter');
  });

  // Regression: Chrome 156 no longer has `adapter.isFallbackAdapter`; the first harness read `undefined` as
  // "not a fallback" and called the run hardware before anything verified it.
  it('does not accept an adapter that does not report its fallback status', () => {
    expect(
      classifyExecution({
        pageClassification: 'fallback-status-unreported',
        gpuProcessText: apple,
        gpuProcessDeviceCount: 1,
      }),
    ).toBe('unverified-adapter');
  });

  it('does not accept a non-fallback adapter when the browser lists no GPU', () => {
    expect(
      classifyExecution({
        pageClassification: 'non-fallback',
        gpuProcessText: '',
        gpuProcessDeviceCount: 0,
      }),
    ).toBe('unverified-adapter');
  });

  it.each([
    'Google SwiftShader',
    'llvmpipe (LLVM 17)',
    'Mesa lavapipe',
    'Microsoft Basic Render Driver',
  ])('calls %s software even if the page says non-fallback', (name) => {
    expect(
      classifyExecution({
        pageClassification: 'non-fallback',
        gpuProcessText: name,
        gpuProcessDeviceCount: 1,
      }),
    ).toBe('software');
  });

  it('keeps unavailable and software page classifications', () => {
    expect(
      classifyExecution({
        pageClassification: 'unavailable',
        gpuProcessText: apple,
        gpuProcessDeviceCount: 1,
      }),
    ).toBe('unavailable');
    expect(
      classifyExecution({
        pageClassification: 'software',
        gpuProcessText: apple,
        gpuProcessDeviceCount: 1,
      }),
    ).toBe('software');
  });
});
