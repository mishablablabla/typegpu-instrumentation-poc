// Round 3: mutants of the code added or moved by the 2026-10-28 audit fixes (validateOptions, safeString,
// device-lost retention, once-only root-destroyed, the `lost` guard), plus the two round-2 mutants (N05, N08) whose
// target code moved into validateOptions. Written against the source of that day's tree; `find` strings that no
// longer match report BAD-FIND.
const HUB = 'src/core/instrumentation/hub.ts';
const IDX = 'src/core/instrumentation/index.ts';
const DEV = 'src/core/instrumentation/deviceEvents.ts';
const m = (id, file, find, repl, desc, extra = {}) => ({ id, file, find, repl, desc, ...extra });

export const mutants = [
  m('R01', HUB, "captureSource: captureSource ?? true,", "captureSource: captureSource ?? false,", 'captureSource defaults to false (moved from N05)'),
  m('R02', HUB, "      'historyMaxBytes',\n      historyMaxBytes,\n      DEFAULT_HISTORY_MAX_BYTES,", "      'historyMaxBytes',\n      historyMaxBytes,\n      DEFAULT_HISTORY_MAX_BYTES * 2,", 'default byte bound doubled (moved from N08)'),
  m('R03', HUB, "typeof captureSource !== 'boolean'", "typeof captureSource === 'boolean'", 'captureSource type check inverted'),
  m('R04', HUB, "typeof options !== 'object' || options === null", "typeof options !== 'object'", 'null options accepted'),
  m('R05', IDX, "  validateOptions(options);\n", "", 'createInstrumentation no longer validates eagerly'),
  m('R06', HUB, "  return safeString(error);\n}", "  return String(error);\n}", 'describeError falls back to the throwing String()'),
  m('R07', HUB, "return Object.prototype.toString.call(value);", "throw new Error('x');", 'safeString has no second fallback'),
  m('R08', HUB, "      message: safeString((error as Error | undefined)?.message ?? error),\n    };\n  } catch {", "      message: String((error as Error | undefined)?.message ?? error),\n    };\n  } catch {", 'describeThrown message uses the throwing String()'),
  m('R09', HUB, "f !== event && f.type !== 'device-lost');", "f !== event);", 'device-lost evictable by byte pressure again'),
  m('R10', HUB, "      if (oldest < 0) {\n        break;\n      }\n", "", 'no guard when only the device-lost event is left to evict'),
  m('R11', HUB, "    if (this.#rootDestroyedSeen) {\n      return;\n    }\n", "", 'root-destroyed hook not once-only'),
  m('R12', HUB, "    this.#rootDestroyedSeen = true;\n", "", 'root-destroyed flag never set'),
  m('R13', DEV, "typeof (lost as PromiseLike<GPUDeviceLostInfo> | undefined)?.then === 'function'", "true", 'non-thenable device.lost not guarded'),
  m('R14', HUB, "return `${error.name}: ${safeString(error.message)}`;", "return `${safeString(error.message)}`;", 'error text without its type name (moved from N40)'),
];
