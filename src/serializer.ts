/**
 * Safe JSON serialization with circular reference handling.
 */

export function safeStringify(
  value: unknown,
  indent?: number
): string {
  const seen = new Set<unknown>();

  return JSON.stringify(
    value,
    (_key, val) => {
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) {
          return '[Circular]';
        }
        seen.add(val);
      }
      // Handle BigInt
      if (typeof val === 'bigint') {
        return val.toString() + 'n';
      }
      // Handle undefined inside objects
      if (typeof val === 'undefined') {
        return '[undefined]';
      }
      return val as unknown;
    },
    indent
  );
}

/**
 * Format an Error object for structured logging.
 */
export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
  cause?: SerializedError | unknown;
  [key: string]: unknown;
}

export function serializeError(err: unknown): SerializedError {
  if (!(err instanceof Error)) {
    return {
      name: 'UnknownError',
      message: String(err),
    };
  }

  const serialized: SerializedError = {
    name: err.name,
    message: err.message,
  };

  if (err.stack) {
    serialized['stack'] = err.stack;
  }

  if ('cause' in err && err.cause !== undefined) {
    serialized['cause'] = err.cause instanceof Error
      ? serializeError(err.cause)
      : err.cause;
  }

  // Copy any extra enumerable properties
  for (const key of Object.keys(err)) {
    if (!(key in serialized)) {
      serialized[key] = (err as unknown as Record<string, unknown>)[key];
    }
  }

  return serialized;
}

/**
 * Format a timestamp as ISO 8601.
 */
export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}

/**
 * Format a timestamp as a short human-readable string.
 */
export function formatTimestampShort(date: Date = new Date()): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  const s = date.getSeconds().toString().padStart(2, '0');
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}
