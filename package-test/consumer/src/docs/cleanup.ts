// Snippet of the documentation page: pausing and teardown.
// #region cleanup
import type { TgpuRoot } from 'typegpu';
import type { TgpuInstrumentation } from 'typegpu/unstable-instrumentation';

export function shutdown(root: TgpuRoot, inst: TgpuInstrumentation, unsubscribe: () => void) {
  inst.disable(); // stop recording; resources created from now on are never tracked
  inst.enable(); // resume

  root.destroy(); // emits `root-destroyed` with `liveBuffers` and `liveTextures`
  unsubscribe(); // stop one listener
  inst.dispose(); // permanent: drops all listeners; history() and getSnapshot() stay readable
}
// #endregion cleanup
