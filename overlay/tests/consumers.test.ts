import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { d, tgpu } from 'typegpu';
import { it } from 'typegpu-testing-utility';
import { createDiagnosticsIndex } from './consumers/diagnosticsIndex.ts';
import { createTextReport, formatSnapshot } from './consumers/textReport.ts';
import { computeMain, flush, layout, makeObservableDevice } from './support.ts';

/** One run that touches every use case, observed by two unrelated consumers. */
async function scenario(device: GPUDevice) {
  const observable = makeObservableDevice(device);
  observable.setCompilationMessages([
    { type: 'warning', message: 'unreachable code', lineNum: 1, linePos: 1 },
  ]);
  const root = tgpu.initFromDevice({ device, unstable_instrumentation: true });
  const inst = root['~unstable'].instrumentation!;

  const report = createTextReport(inst);
  const index = createDiagnosticsIndex(inst);

  const kept = root.createBuffer(d.arrayOf(d.f32, 4)).$usage('storage').$name('kept');
  const scratch = root.createBuffer(d.f32).$usage('uniform').$name('scratch');
  root.unwrap(scratch);
  scratch.destroy();

  // U3: one binding is a raw GPUBuffer, so TypeGPU cannot say which resource it is.
  const raw = device.createBuffer({ size: 16, usage: GPUBufferUsage.STORAGE });
  root.unwrap(root.createBindGroup(layout, { values: raw as never }));

  // U2: no initSync/initAsync, so the first dispatch compiles synchronously.
  const pipeline = root.createComputePipeline({ compute: computeMain }).$name('compute');
  pipeline.with(root.createBindGroup(layout, { values: kept })).dispatchWorkgroups(1);
  await flush();

  observable.fireError('Binding size is smaller than the minimum binding size');
  root.destroy();

  return { inst, report, index };
}

describe('two independent consumers of one stream', () => {
  it('text report: WGSL size, diagnostics, errors and leftovers', async ({ device }) => {
    const { report } = await scenario(device);
    const text = report.lines().join('\n');

    expect(text).toContain('compute pipeline compute#');
    expect(text).toContain('[lazy]');
    expect(text).toContain('(CPU)');
    expect(text).toContain('warning at WGSL 1:1: unreachable code');
    expect(text).toContain('DEVICE ERROR GPUValidationError: Binding size');
    expect(text).toContain('bind group');
    expect(text).toContain('values=?');
    expect(text).toContain('still alive: 1 buffers, 0 textures');
  });

  it('diagnostics index: answers the use-case questions from the same events', async ({
    device,
  }) => {
    const { index } = await scenario(device);
    const result = index.index();

    expect(result.lazyCompiles).toEqual([
      expect.objectContaining({ label: 'compute', cpuMs: expect.any(Number) }),
    ]);
    expect(result.shaderProblems).toEqual([
      expect.objectContaining({
        label: 'compute',
        messages: [
          expect.objectContaining({
            type: 'warning',
            // line 1 of the generated WGSL, found via the line number in the diagnostic
            wgslLine: expect.stringContaining('var<storage, read_write> values'),
          }),
        ],
      }),
    ]);
    expect(result.deviceErrors).toEqual([
      expect.objectContaining({ errorType: 'GPUValidationError' }),
    ]);
    expect(result.bindGroupsWithUnknownResources).toEqual([
      expect.objectContaining({ entries: ['values'] }),
    ]);
    expect(result.liveResources.map((r) => r.label)).toEqual(['kept']);
    expect(result.leakedAtRootDestroy).toEqual({ buffers: 1, textures: 0 });
  });

  it('a consumer attached late reconstructs the same state from history', async ({ device }) => {
    const { inst, index } = await scenario(device);

    const late = createDiagnosticsIndex(inst);

    expect(late.index()).toEqual(index.index());
  });

  it('snapshot formatting needs nothing but the public snapshot', async ({ device }) => {
    const { inst } = await scenario(device);
    const lines = formatSnapshot(inst.getSnapshot());

    expect(lines[0]).toBe('1 live resources, 1 pipelines, 2 bind groups');
    expect(lines.at(-1)).toContain('gpuExecutionTime');
  });

  it('consumers depend on no UI framework, DOM, or TypeGPU runtime code', () => {
    const dir = join(import.meta.dirname, 'consumers');
    const files = readdirSync(dir).filter((f) => f.endsWith('.ts'));
    expect(files.length).toBeGreaterThanOrEqual(2);

    for (const file of files) {
      const source = readFileSync(join(dir, file), 'utf8');
      const specifiers = [...source.matchAll(/from '([^']+)'/g)].map((m) => m[1]);
      expect(specifiers, file).toEqual(['../../../src/core/instrumentation/types.ts']);
      expect(source, file).not.toMatch(/\b(document|window|HTMLElement|React)\b/);
    }
  });
});
