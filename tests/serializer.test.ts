import { describe, it, expect } from 'vitest';
import { safeStringify, serializeError, formatTimestamp, formatTimestampShort } from '../src/serializer.js';

describe('safeStringify', () => {
  it('stringifies a plain object', () => {
    const result = safeStringify({ a: 1, b: 'two' });
    expect(JSON.parse(result)).toEqual({ a: 1, b: 'two' });
  });

  it('handles circular references', () => {
    const obj: Record<string, unknown> = { name: 'test' };
    obj['self'] = obj;
    const result = safeStringify(obj);
    const parsed = JSON.parse(result) as Record<string, unknown>;
    expect(parsed['self']).toBe('[Circular]');
  });

  it('handles deeply nested circular references', () => {
    const a: Record<string, unknown> = {};
    const b: Record<string, unknown> = { a };
    a['b'] = b;
    expect(() => safeStringify({ a })).not.toThrow();
    const parsed = JSON.parse(safeStringify({ a })) as Record<string, unknown>;
    expect(parsed).toBeDefined();
  });

  it('handles BigInt values', () => {
    const result = safeStringify({ big: BigInt(42) });
    const parsed = JSON.parse(result) as Record<string, unknown>;
    expect(parsed['big']).toBe('42n');
  });

  it('handles null', () => {
    expect(safeStringify(null)).toBe('null');
  });

  it('handles arrays', () => {
    const result = safeStringify([1, 2, 3]);
    expect(JSON.parse(result)).toEqual([1, 2, 3]);
  });

  it('handles nested objects', () => {
    const obj = { a: { b: { c: 'deep' } } };
    const parsed = JSON.parse(safeStringify(obj)) as typeof obj;
    expect(parsed.a.b.c).toBe('deep');
  });

  it('applies indentation when specified', () => {
    const result = safeStringify({ x: 1 }, 2);
    expect(result).toContain('\n');
    expect(result).toContain('  ');
  });
});

describe('serializeError', () => {
  it('serializes a standard Error', () => {
    const err = new Error('something failed');
    const result = serializeError(err);
    expect(result.name).toBe('Error');
    expect(result.message).toBe('something failed');
    expect(typeof result.stack).toBe('string');
  });

  it('serializes custom error types', () => {
    class CustomError extends Error {
      code: number;
      constructor(message: string, code: number) {
        super(message);
        this.name = 'CustomError';
        this.code = code;
      }
    }
    const err = new CustomError('custom', 404);
    const result = serializeError(err);
    expect(result.name).toBe('CustomError');
    expect(result.message).toBe('custom');
  });

  it('handles errors with cause', () => {
    const cause = new Error('root cause');
    const err = new Error('top level', { cause });
    const result = serializeError(err);
    expect(result.cause).toBeDefined();
    const causeResult = result.cause as { message: string };
    expect(causeResult.message).toBe('root cause');
  });

  it('handles non-Error values', () => {
    const result = serializeError('just a string');
    expect(result.name).toBe('UnknownError');
    expect(result.message).toBe('just a string');
  });

  it('handles null', () => {
    const result = serializeError(null);
    expect(result.name).toBe('UnknownError');
    expect(result.message).toBe('null');
  });

  it('copies extra enumerable properties', () => {
    const err = Object.assign(new Error('test'), {
      statusCode: 500,
      requestId: 'abc',
    });
    const result = serializeError(err);
    expect(result['statusCode']).toBe(500);
    expect(result['requestId']).toBe('abc');
  });
});

describe('formatTimestamp', () => {
  it('returns ISO string', () => {
    const result = formatTimestamp();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('uses provided date', () => {
    const date = new Date('2024-01-15T12:00:00.000Z');
    expect(formatTimestamp(date)).toBe('2024-01-15T12:00:00.000Z');
  });
});

describe('formatTimestampShort', () => {
  it('returns HH:MM:SS.mmm format', () => {
    const result = formatTimestampShort();
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/);
  });
});
