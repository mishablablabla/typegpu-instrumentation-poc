/**
 * Decides how a real-device run may be described. Kept separate from the driver so it can be unit-tested:
 * a wrong answer here would let a mocked, software or unverified run pass as real-GPU validation.
 */
export type PageClassification =
  | 'unavailable'
  | 'software'
  | 'non-fallback'
  | 'fallback-status-unreported';

export type ExecutionMode = 'unavailable' | 'software' | 'unverified-adapter' | 'hardware-adapter';

const SOFTWARE = /swiftshader|llvmpipe|lavapipe|software|microsoft basic render/i;

export function classifyExecution(input: {
  /** What the page concluded from `adapter.info` (and, for old browsers, `adapter`). */
  pageClassification: PageClassification;
  /** Vendor/device strings of the GPUs the browser's GPU process reports; independent of the page. */
  gpuProcessText: string;
  gpuProcessDeviceCount: number;
}): ExecutionMode {
  if (input.pageClassification === 'unavailable') {
    return 'unavailable';
  }
  if (input.pageClassification === 'software' || SOFTWARE.test(input.gpuProcessText)) {
    return 'software';
  }
  // "Hardware" needs both sources: the adapter says it is not a fallback AND the GPU process lists a device.
  if (input.pageClassification === 'non-fallback' && input.gpuProcessDeviceCount > 0) {
    return 'hardware-adapter';
  }
  return 'unverified-adapter';
}
