/**
 * Reader for the JSON Lines produced by `jsonlExport.ts`, with the compatibility policy of
 * docs/EVENT-CONTRACT.md: a file or event whose version this reader does not know is rejected, not guessed at;
 * unknown record kinds and unknown fields are kept untouched.
 */
import { JSONL_FORMAT, JSONL_VERSION } from './jsonlExport.ts';

export const SUPPORTED_EVENT_SCHEMAS: readonly number[] = [2];

export type JsonlRecord = { record: string; [key: string]: unknown };

export class JsonlFormatError extends Error {}

export function parseJsonl(text: string): { records: JsonlRecord[]; events: unknown[] } {
  const lines = text.split('\n').filter((line) => line.trim() !== '');
  const records: JsonlRecord[] = lines.map((line, index) => {
    try {
      const parsed = JSON.parse(line) as unknown;
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        typeof (parsed as JsonlRecord).record !== 'string'
      ) {
        throw new Error('not a record object');
      }
      return parsed as JsonlRecord;
    } catch (error) {
      throw new JsonlFormatError(`line ${index + 1}: ${(error as Error).message}`);
    }
  });

  const header = records[0];
  if (header?.record !== 'header' || header.format !== JSONL_FORMAT) {
    throw new JsonlFormatError('the first line is not a typegpu-instrumentation-jsonl header');
  }
  if (header.version !== JSONL_VERSION) {
    throw new JsonlFormatError(`unsupported file format version ${String(header.version)}`);
  }
  if (!SUPPORTED_EVENT_SCHEMAS.includes(header.eventSchema as number)) {
    throw new JsonlFormatError(`unsupported event schema ${String(header.eventSchema)}`);
  }

  const events = records
    .filter((r) => r.record === 'event')
    .map((r) => {
      const event = r.event as { v?: unknown } | undefined;
      if (!SUPPORTED_EVENT_SCHEMAS.includes(event?.v as number)) {
        throw new JsonlFormatError(`event with unsupported schema version ${String(event?.v)}`);
      }
      return event;
    });
  return { records, events };
}
