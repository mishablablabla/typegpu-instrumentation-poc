/**
 * Estimated retained payload size of an event, in bytes: UTF-16 string length × 2, 8 per number, 4 per boolean
 * or null, plus a fixed cost per object, array and field. It exists to bound the history deterministically;
 * it is **not** a heap measurement (engine object headers, string sharing and hidden classes are not modelled).
 * Strings dominate real events (generated WGSL, compiler messages), and those are counted exactly.
 */
const OBJECT_COST = 32;
const FIELD_COST = 8;

export function estimateEventBytes(value: unknown): number {
  switch (typeof value) {
    case 'string':
      return 16 + value.length * 2;
    case 'number':
      return 8;
    case 'boolean':
      return 4;
    case 'object': {
      if (value === null) {
        return 4;
      }
      let bytes = OBJECT_COST;
      for (const key in value) {
        bytes += FIELD_COST + estimateEventBytes((value as Record<string, unknown>)[key]);
      }
      return bytes;
    }
    default:
      return 4;
  }
}
