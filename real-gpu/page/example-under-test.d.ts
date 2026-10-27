// `example-under-test` is aliased by build.mjs to the scenario file chosen with `--example`.
declare module 'example-under-test' {
  import type { TgpuRoot } from 'typegpu';
  const scenario: (root: TgpuRoot) => Promise<void> | void;
  export default scenario;
}
