/** What the page can tell about the adapter it got. The driver cross-checks it against the browser's GPU process. */
export async function provenance() {
  const gpu = navigator.gpu;
  if (!gpu) {
    return { pageClassification: 'unavailable' as const, reason: 'navigator.gpu is undefined' };
  }
  const adapter = await gpu.requestAdapter();
  if (!adapter) {
    return { pageClassification: 'unavailable' as const, reason: 'requestAdapter() returned null' };
  }
  const info = adapter.info as GPUAdapterInfo & { isFallbackAdapter?: boolean };
  // Older browsers exposed this on the adapter; current ones on `adapter.info`. `undefined` means "not reported".
  const isFallbackAdapter: boolean | undefined =
    info.isFallbackAdapter ?? (adapter as { isFallbackAdapter?: boolean }).isFallbackAdapter;
  const identity = `${info.vendor} ${info.architecture} ${info.device} ${info.description}`;
  return {
    // What the PAGE can tell. The driver combines it with the browser's GPU-process information.
    pageClassification:
      (isFallbackAdapter ?? false) ||
      /swiftshader|llvmpipe|lavapipe|software|warp|mesa/i.test(identity)
        ? ('software' as const)
        : typeof isFallbackAdapter === 'boolean'
          ? ('non-fallback' as const)
          : ('fallback-status-unreported' as const),
    userAgent: navigator.userAgent,
    vendor: info.vendor,
    architecture: info.architecture,
    device: info.device,
    description: info.description,
    isFallbackAdapter: isFallbackAdapter ?? null,
    features: [...adapter.features].toSorted(),
  };
}
