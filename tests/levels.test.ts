import { describe, it, expect } from 'vitest';
import {
  LogLevel,
  isLogLevelName,
  getLevelValue,
  getLevelName,
} from '../src/levels.js';

describe('LogLevel', () => {
  it('has correct numeric values in ascending order', () => {
    expect(LogLevel.trace).toBeLessThan(LogLevel.debug);
    expect(LogLevel.debug).toBeLessThan(LogLevel.info);
    expect(LogLevel.info).toBeLessThan(LogLevel.warn);
    expect(LogLevel.warn).toBeLessThan(LogLevel.error);
    expect(LogLevel.error).toBeLessThan(LogLevel.fatal);
    expect(LogLevel.fatal).toBeLessThan(LogLevel.silent);
  });

  it('silent is Infinity', () => {
    expect(LogLevel.silent).toBe(Infinity);
  });
});

describe('isLogLevelName', () => {
  it('returns true for valid level names', () => {
    expect(isLogLevelName('trace')).toBe(true);
    expect(isLogLevelName('debug')).toBe(true);
    expect(isLogLevelName('info')).toBe(true);
    expect(isLogLevelName('warn')).toBe(true);
    expect(isLogLevelName('error')).toBe(true);
    expect(isLogLevelName('fatal')).toBe(true);
    expect(isLogLevelName('silent')).toBe(true);
  });

  it('returns false for invalid names', () => {
    expect(isLogLevelName('verbose')).toBe(false);
    expect(isLogLevelName('')).toBe(false);
    expect(isLogLevelName(42)).toBe(false);
    expect(isLogLevelName(null)).toBe(false);
    expect(isLogLevelName(undefined)).toBe(false);
  });
});

describe('getLevelValue', () => {
  it('returns correct numeric value', () => {
    expect(getLevelValue('info')).toBe(30);
    expect(getLevelValue('error')).toBe(50);
    expect(getLevelValue('trace')).toBe(10);
  });
});

describe('getLevelName', () => {
  it('maps numeric values back to names', () => {
    expect(getLevelName(10)).toBe('trace');
    expect(getLevelName(20)).toBe('debug');
    expect(getLevelName(30)).toBe('info');
    expect(getLevelName(40)).toBe('warn');
    expect(getLevelName(50)).toBe('error');
    expect(getLevelName(60)).toBe('fatal');
  });

  it('returns undefined for unknown values', () => {
    expect(getLevelName(99)).toBeUndefined();
    expect(getLevelName(0)).toBeUndefined();
  });
});
