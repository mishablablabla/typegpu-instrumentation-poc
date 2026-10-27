// Minimal hand-written GPUDevice for Node (no GPU, no Chrome). Records what TypeGPU asks of it.
export function installWebGPUGlobals() {
  const g = globalThis as Record<string, unknown>;
  g.GPUBufferUsage = { MAP_READ: 1, MAP_WRITE: 2, COPY_SRC: 4, COPY_DST: 8, INDEX: 16, VERTEX: 32, UNIFORM: 64, STORAGE: 128, INDIRECT: 256, QUERY_RESOLVE: 512 };
  g.GPUMapMode = { READ: 1, WRITE: 2 };
  g.GPUTextureUsage = { COPY_SRC: 1, COPY_DST: 2, TEXTURE_BINDING: 4, STORAGE_BINDING: 8, RENDER_ATTACHMENT: 16 };
  g.GPUShaderStage = { VERTEX: 1, FRAGMENT: 2, COMPUTE: 4 };
}

export function makeFakeDevice() {
  const calls: string[] = [];
  const listeners = new Map<string, Set<(e: unknown) => void>>();
  let lose: (info: { reason: string; message: string }) => void = () => {};
  const lost = new Promise<{ reason: string; message: string }>((r) => (lose = r));
  const pass = {
    setPipeline: () => calls.push('pass.setPipeline'),
    setBindGroup: () => calls.push('pass.setBindGroup'),
    dispatchWorkgroups: () => calls.push('pass.dispatch'),
    end: () => calls.push('pass.end'),
  };
  const device = {
    features: new Set<string>(),
    limits: { maxUniformBuffersPerShaderStage: 12, maxStorageBuffersPerShaderStage: 8, maxComputeWorkgroupStorageSize: 16384 },
    lost,
    addEventListener(type: string, l: (e: unknown) => void) {
      calls.push(`addEventListener:${type}`);
      (listeners.get(type) ?? listeners.set(type, new Set()).get(type)!).add(l);
    },
    removeEventListener(type: string, l: (e: unknown) => void) {
      calls.push(`removeEventListener:${type}`);
      listeners.get(type)?.delete(l);
    },
    createBuffer: ({ size, usage, label, mappedAtCreation }: GPUBufferDescriptor) => {
      calls.push('createBuffer');
      return {
        size, usage, label: label ?? '', mapState: mappedAtCreation ? 'mapped' : 'unmapped',
        getMappedRange: () => new ArrayBuffer(size),
        unmap() {},
        mapAsync: async () => {},
        destroy: () => calls.push('buffer.destroy'),
      };
    },
    createBindGroupLayout: () => (calls.push('createBindGroupLayout'), {}),
    createBindGroup: ({ label }: GPUBindGroupDescriptor) => (calls.push('createBindGroup'), { label }),
    createPipelineLayout: () => (calls.push('createPipelineLayout'), {}),
    createShaderModule: ({ label, code }: { label?: string; code: string }) => (calls.push('createShaderModule'), { label, code, getCompilationInfo: async () => ({ messages: [] }) }),
    createComputePipeline: ({ label }: GPUComputePipelineDescriptor) => (calls.push('createComputePipeline'), { label, getBindGroupLayout: () => ({}) }),
    createComputePipelineAsync: async ({ label }: GPUComputePipelineDescriptor) => (calls.push('createComputePipelineAsync'), { label, getBindGroupLayout: () => ({}) }),
    createCommandEncoder: () => ({ beginComputePass: () => pass, copyBufferToBuffer() {}, finish: () => ({}) }),
    queue: { submit: () => calls.push('queue.submit'), writeBuffer: () => calls.push('queue.writeBuffer'), onSubmittedWorkDone: async () => {} },
    destroy: () => calls.push('device.destroy'),
  };
  return {
    device: device as unknown as GPUDevice,
    calls,
    listenerCount: (type: string) => listeners.get(type)?.size ?? 0,
    fireError: (message: string) => {
      for (const l of listeners.get('uncapturederror') ?? []) l({ error: Object.assign(new Error(message), { name: 'GPUValidationError' }) });
    },
    lose: (reason: string) => lose({ reason, message: '' }),
  };
}
