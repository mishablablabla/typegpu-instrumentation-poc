/**
 * One `uncapturederror` listener and one `lost` observer per device, shared by every instrumented root on it.
 *
 * Why not one listener per root: a device keeps its listeners (and the `lost` promise its reactions) for as
 * long as it lives. A listener that holds its root's instrumentation therefore keeps that instrumentation, with
 * its event history, alive after the root itself is garbage. Found on a real device: 30 roots dropped without
 * `destroy()` (what hot reloading does) left all 30 hubs behind. Here the device only ever holds closures that
 * reach the sinks through `WeakRef`s.
 *
 * Every closure is created in its own small function scope on purpose: V8 shares one scope object between
 * all closures of a scope, so a closure created next to one that uses `this` would retain it.
 */
export interface DeviceEventSink {
  handleDeviceError(event: Event): void;
  handleDeviceLost(info: GPUDeviceLostInfo): void;
}

type Entry = {
  readonly device: GPUDevice;
  readonly errorSinks: Set<WeakRef<DeviceEventSink>>;
  readonly lostSinks: Set<WeakRef<DeviceEventSink>>;
  listener: ((event: Event) => void) | undefined;
  /** Set once the device was lost; sinks that start watching afterwards are told immediately. */
  lostInfo: GPUDeviceLostInfo | undefined;
};

export type DeviceWatch = {
  /** Stops delivering `uncapturederror` to this sink; `lost` keeps coming (the device may still be destroyed). */
  stopErrors(): void;
  stopAll(): void;
};

const entries = new WeakMap<GPUDevice, Entry>();

const cleanup = new FinalizationRegistry<{ entry: Entry; ref: WeakRef<DeviceEventSink> }>(
  ({ entry, ref }) => {
    entry.errorSinks.delete(ref);
    entry.lostSinks.delete(ref);
    releaseListener(entry);
  },
);

function makeErrorListener(entry: Entry): (event: Event) => void {
  return (event) => {
    for (const ref of entry.errorSinks) {
      const sink = ref.deref();
      if (sink === undefined) {
        entry.errorSinks.delete(ref);
      } else {
        sink.handleDeviceError(event);
      }
    }
  };
}

function makeLostHandler(entry: Entry): (info: GPUDeviceLostInfo) => void {
  return (info) => {
    entry.lostInfo = info;
    for (const ref of entry.lostSinks) {
      ref.deref()?.handleDeviceLost(info);
    }
    entry.lostSinks.clear();
  };
}

function entryFor(device: GPUDevice): Entry {
  let entry = entries.get(device);
  if (entry === undefined) {
    entry = {
      device,
      errorSinks: new Set(),
      lostSinks: new Set(),
      listener: undefined,
      lostInfo: undefined,
    };
    entries.set(device, entry);
    // `lost` never rejects and its reactions cannot be removed: exactly one per device.
    void device.lost?.then(makeLostHandler(entry));
  }
  return entry;
}

function releaseListener(entry: Entry): void {
  if (entry.listener !== undefined && entry.errorSinks.size === 0) {
    entry.device.removeEventListener('uncapturederror', entry.listener);
    entry.listener = undefined;
  }
}

function notifyLate(ref: WeakRef<DeviceEventSink>, info: GPUDeviceLostInfo): void {
  // Asynchronous, like the original notification, and holding the sink only weakly until it runs.
  queueMicrotask(() => ref.deref()?.handleDeviceLost(info));
}

export function watchDevice(device: GPUDevice, sink: DeviceEventSink): DeviceWatch {
  const entry = entryFor(device);
  const ref = new WeakRef(sink);
  entry.errorSinks.add(ref);
  if (entry.lostInfo !== undefined) {
    // The one `lost` reaction already ran; this sink would otherwise never hear about it.
    notifyLate(ref, entry.lostInfo);
  } else {
    entry.lostSinks.add(ref);
  }
  if (entry.listener === undefined && typeof device.addEventListener === 'function') {
    entry.listener = makeErrorListener(entry);
    device.addEventListener('uncapturederror', entry.listener);
  }
  // The held value refers to the entry and the WeakRef, never to the sink.
  cleanup.register(sink, { entry, ref });

  return {
    stopErrors() {
      entry.errorSinks.delete(ref);
      releaseListener(entry);
    },
    stopAll() {
      entry.errorSinks.delete(ref);
      entry.lostSinks.delete(ref);
      releaseListener(entry);
    },
  };
}
