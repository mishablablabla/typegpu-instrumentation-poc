// Build-time variant for the pristine (unpatched) checkouts: there is no instrumentation to ask for.
export type Subscriber = 'none' | 'noop' | 'console-stub' | 'console-real' | 'jsonl';

export const available = false;
export const makeProvider = (_options: {
  historySize?: number | undefined;
  captureSource?: boolean | undefined;
}) => undefined;
export const attachSubscriber = (_kind: Subscriber, _source: unknown) => ({ count: () => 0 });
