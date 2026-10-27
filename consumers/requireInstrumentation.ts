import type { TgpuInstrumentation } from '../../../src/core/instrumentation/types.ts';

type RootLike = { '~unstable': { instrumentation: TgpuInstrumentation | undefined } };

/**
 * Returns the root's instrumentation, or explains why there is none. A TypeGPU build without the hook patch
 * accepts `unstable_instrumentation` and silently ignores it; asking for the data then must not look like
 * "nothing happened".
 */
export function requireInstrumentation(root: RootLike): TgpuInstrumentation {
  const instrumentation = root['~unstable'].instrumentation;
  if (instrumentation === undefined) {
    throw new Error(
      "root['~unstable'].instrumentation is undefined. Either the root was created without " +
        '`unstable_instrumentation`, or this TypeGPU build has no instrumentation hooks ' +
        '(the patch in patches/ is not applied; run scripts/setup.sh).',
    );
  }
  return instrumentation;
}
