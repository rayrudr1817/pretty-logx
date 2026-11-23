import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, createLogger, logger } from '../src/logger.js';
import { LogLevel } from '../src/levels.js';
import { setColorsEnabled } from '../src/colors.js';

// Disable colors for deterministic test output
setColorsEnabled(false);

describe('Logger — creation', () => {
  it('creates a logger with default config', () => {
    const log = createLogger();
    expect(log.level).toBe('info');
    expect(log.isJsonMode).toBe(false);
    expect(log.namespace).toBeUndefined();
  });

  it('creates a logger with custom level', () => {
    const log = createLogger({ level: 'debug' });
    expect(log.level).toBe('debug');
    expect(log.levelValue).toBe(LogLevel.debug);
  });

  it('creates a logger with namespace', () => {
    const log = createLogger({ namespace: 'myapp' });
    expect(log.namespace).toBe('myapp');
  });

  it('creates a logger in JSON mode', () => {
    const log = createLogger({ json: true });
    expect(log.isJsonMode).toBe(true);
  });

  it('exports a default logger instance', () => {
    expect(logger).toBeInstanceOf(Logger);
  });
});

describe('Logger — level filtering', () => {
  let output: string[];
  let log: Logger;

  beforeEach(() => {
    output = [];
    log = createLogger({
      level: 'warn',
      write: (msg) => output.push(msg),
    });
  });

  it('suppresses messages below configured level', () => {
    log.trace('trace msg');
    log.debug('debug msg');
    log.info('info msg');
    expect(output).toHaveLength(0);
  });

  it('logs messages at and above configured level', () => {
    log.warn('warn msg');
    log.error('error msg');
    log.fatal('fatal msg');
    expect(output).toHaveLength(3);
  });

  it('allows dynamically changing the level', () => {
    log.info('before change');
    expect(output).toHaveLength(0);

    log.level = 'info';
    log.info('after change');
    expect(output).toHaveLength(1);
  });

  it('silent level suppresses everything', () => {
    log.level = 'silent';
    log.trace('t'); log.debug('d'); log.info('i');
    log.warn('w'); log.error('e'); log.fatal('f');
    expect(output).toHaveLength(0);
  });
});

describe('Logger — level predicates', () => {
  it('reports correct enabled state', () => {
    const log = createLogger({ level: 'warn' });
    expect(log.isTraceEnabled).toBe(false);
    expect(log.isDebugEnabled).toBe(false);
    expect(log.isInfoEnabled).toBe(false);
    expect(log.isWarnEnabled).toBe(true);
    expect(log.isErrorEnabled).toBe(true);
    expect(log.isFatalEnabled).toBe(true);
  });

  it('all enabled at trace level', () => {
    const log = createLogger({ level: 'trace' });
    expect(log.isTraceEnabled).toBe(true);
    expect(log.isDebugEnabled).toBe(true);
    expect(log.isInfoEnabled).toBe(true);
  });
});

describe('Logger — pretty output', () => {
  let output: string[];
  let log: Logger;

  beforeEach(() => {
    output = [];
    setColorsEnabled(false);
    log = createLogger({
      level: 'trace',
      timestampFormat: 'none',
      write: (msg) => output.push(msg),
    });
  });

  it('outputs the message', () => {
    log.info('Hello world');
    expect(output[0]).toContain('Hello world');
  });

  it('outputs the level label', () => {
    log.info('msg');
    expect(output[0]).toContain('INFO');
  });

  it('outputs the namespace when set', () => {
    const nsLog = createLogger({
      level: 'trace',
      namespace: 'api',
      timestampFormat: 'none',
      write: (msg) => output.push(msg),
    });
    nsLog.info('request received');
    expect(output[0]).toContain('[api]');
  });

  it('pretty-prints extra object meta', () => {
    log.info('request', { method: 'GET', path: '/health' });
    // The object should appear in output
    const all = output.join('\n');
    expect(all).toContain('method');
    expect(all).toContain('GET');
  });

  it('formats errors with stack traces', () => {
    const err = new Error('test error');
    log.error('something failed', err);
    const all = output.join('\n');
    expect(all).toContain('test error');
  });

  it('handles bindings-first calling convention', () => {
    log.info({ requestId: 'abc-123' }, 'request complete');
    const all = output.join('\n');
    expect(all).toContain('request complete');
    expect(all).toContain('requestId');
  });
});

describe('Logger — JSON mode', () => {
  let jsonLines: unknown[];
  let log: Logger;

  function parseOutput(raw: string): unknown {
    return JSON.parse(raw);
  }

  beforeEach(() => {
    jsonLines = [];
    log = createLogger({
      level: 'trace',
      json: true,
      write: (msg) => jsonLines.push(parseOutput(msg)),
    });
  });

  it('produces valid JSON output', () => {
    log.info('hello json');
    expect(jsonLines).toHaveLength(1);
    const record = jsonLines[0] as Record<string, unknown>;
    expect(record['level']).toBe('info');
    expect(record['msg']).toBe('hello json');
    expect(typeof record['time']).toBe('string');
  });

  it('includes level value', () => {
    log.warn('warning');
    const record = jsonLines[0] as Record<string, unknown>;
    expect(record['levelValue']).toBe(LogLevel.warn);
  });

  it('includes bindings in JSON output', () => {
    log.info({ userId: 42, role: 'admin' }, 'login');
    const record = jsonLines[0] as Record<string, unknown>;
    expect(record['userId']).toBe(42);
    expect(record['role']).toBe('admin');
    expect(record['msg']).toBe('login');
  });

  it('serializes errors in JSON output', () => {
    const err = new Error('db connection failed');
    log.error({ err }, 'database error');
    const record = jsonLines[0] as Record<string, unknown>;
    const serializedErr = record['err'] as Record<string, unknown>;
    expect(serializedErr['message']).toBe('db connection failed');
    expect(serializedErr['name']).toBe('Error');
    expect(typeof serializedErr['stack']).toBe('string');
  });

  it('serializes error passed as extra arg', () => {
    const err = new Error('oops');
    log.error('request failed', err);
    const record = jsonLines[0] as Record<string, unknown>;
    const errData = record['err'] as Record<string, unknown>;
    expect(errData['message']).toBe('oops');
  });

  it('includes namespace in JSON output', () => {
    const nsLog = createLogger({
      level: 'trace',
      json: true,
      namespace: 'db',
      write: (msg) => jsonLines.push(parseOutput(msg)),
    });
    nsLog.info('query executed');
    const record = jsonLines[0] as Record<string, unknown>;
    expect(record['namespace']).toBe('db');
  });

  it('produces ISO timestamp', () => {
    log.info('test');
    const record = jsonLines[0] as Record<string, unknown>;
    const time = record['time'] as string;
    expect(() => new Date(time)).not.toThrow();
    expect(new Date(time).toISOString()).toBe(time);
  });
});

describe('Logger — circular reference handling', () => {
  let output: string[];
  let log: Logger;

  beforeEach(() => {
    output = [];
    log = createLogger({
      level: 'trace',
      json: true,
      write: (msg) => output.push(msg),
    });
  });

  it('handles circular objects in JSON mode', () => {
    const circular: Record<string, unknown> = { name: 'test' };
    circular['self'] = circular;

    expect(() => log.info({ data: circular }, 'circular test')).not.toThrow();
    expect(output).toHaveLength(1);
    const record = JSON.parse(output[0]!) as Record<string, unknown>;
    const data = record['data'] as Record<string, unknown>;
    expect(data['self']).toBe('[Circular]');
  });

  it('handles deeply nested circular refs', () => {
    const a: Record<string, unknown> = { x: 1 };
    const b: Record<string, unknown> = { y: 2, a };
    a['b'] = b;

    expect(() => log.info({ payload: a }, 'deep circular')).not.toThrow();
    expect(output).toHaveLength(1);
  });
});

describe('Logger — child loggers', () => {
  let parentOutput: string[];
  let log: Logger;

  beforeEach(() => {
    parentOutput = [];
    setColorsEnabled(false);
    log = createLogger({
      level: 'trace',
      json: true,
      write: (msg) => parentOutput.push(msg),
    });
  });

  it('child logger inherits parent config', () => {
    const child = log.child({ component: 'router' });
    child.info('route matched');
    expect(parentOutput).toHaveLength(1);
    const record = JSON.parse(parentOutput[0]!) as Record<string, unknown>;
    expect(record['component']).toBe('router');
    expect(record['msg']).toBe('route matched');
  });

  it('child logger inherits parent bindings', () => {
    const parent = createLogger({
      level: 'trace',
      json: true,
      write: (msg) => parentOutput.push(msg),
    });
    const child1 = parent.child({ requestId: 'req-1' });
    const child2 = child1.child({ userId: 99 });

    child2.info('page visited');
    const record = JSON.parse(parentOutput[0]!) as Record<string, unknown>;
    expect(record['requestId']).toBe('req-1');
    expect(record['userId']).toBe(99);
  });

  it('child logger can override level', () => {
    const child = log.child({}, { level: 'error' });
    child.info('should be suppressed');
    child.error('should appear');
    expect(parentOutput).toHaveLength(1);
    const record = JSON.parse(parentOutput[0]!) as Record<string, unknown>;
    expect(record['level']).toBe('error');
  });

  it('child logger does not affect parent', () => {
    const child = log.child({ role: 'admin' });
    child.info('admin action');
    // Parent should not have 'role' in its own logs
    parentOutput = [];
    log.info('parent log');
    const parentRecord = JSON.parse(parentOutput[0]!) as Record<string, unknown>;
    expect(parentRecord['role']).toBeUndefined();
  });

  it('grandchild accumulates all ancestor bindings', () => {
    const c1 = log.child({ a: 1 });
    const c2 = c1.child({ b: 2 });
    const c3 = c2.child({ c: 3 });
    c3.info('deep');
    const record = JSON.parse(parentOutput[0]!) as Record<string, unknown>;
    expect(record['a']).toBe(1);
    expect(record['b']).toBe(2);
    expect(record['c']).toBe(3);
  });
});

describe('Logger — configure', () => {
  it('can reconfigure level at runtime', () => {
    const output: string[] = [];
    const log = createLogger({ level: 'error', write: (m) => output.push(m) });
    log.info('before'); // suppressed
    log.configure({ level: 'info' });
    log.info('after');
    expect(output).toHaveLength(1);
    expect(output[0]).toContain('after');
  });

  it('can toggle JSON mode at runtime', () => {
    const output: string[] = [];
    const log = createLogger({ level: 'trace', json: false, write: (m) => output.push(m) });
    log.info('pretty');
    log.configure({ json: true });
    log.info('json now');
    expect(output).toHaveLength(2);
    // Second line should be valid JSON
    expect(() => JSON.parse(output[1]!)).not.toThrow();
  });
});

describe('Logger — timestamps', () => {
  it('includes timestamp by default (short format)', () => {
    const output: string[] = [];
    setColorsEnabled(false);
    const log = createLogger({
      level: 'trace',
      timestampFormat: 'short',
      write: (m) => output.push(m),
    });
    log.info('with time');
    // Short format: HH:MM:SS.mmm
    expect(output[0]).toMatch(/\d{2}:\d{2}:\d{2}\.\d{3}/);
  });

  it('includes ISO timestamp in iso mode', () => {
    const output: string[] = [];
    setColorsEnabled(false);
    const log = createLogger({
      level: 'trace',
      timestampFormat: 'iso',
      write: (m) => output.push(m),
    });
    log.info('with iso time');
    expect(output[0]).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it('omits timestamp when format is none', () => {
    const output: string[] = [];
    setColorsEnabled(false);
    const log = createLogger({
      level: 'trace',
      timestampFormat: 'none',
      write: (m) => output.push(m),
    });
    log.info('no time');
    expect(output[0]).not.toMatch(/\d{2}:\d{2}:\d{2}/);
  });
});

describe('Logger — all log levels', () => {
  it.each([
    ['trace', 'TRACE'],
    ['debug', 'DEBUG'],
    ['info', 'INFO'],
    ['warn', 'WARN'],
    ['error', 'ERROR'],
    ['fatal', 'FATAL'],
  ] as const)('logs %s level with %s label', (method, label) => {
    const output: string[] = [];
    setColorsEnabled(false);
    const log = createLogger({
      level: 'trace',
      timestampFormat: 'none',
      write: (m) => output.push(m),
    });
    log[method]('test message');
    expect(output[0]).toContain(label);
    expect(output[0]).toContain('test message');
  });
});

describe('Logger — write target', () => {
  it('routes error/fatal to stderr by default', () => {
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    const log = createLogger({ level: 'trace', timestampFormat: 'none' });
    setColorsEnabled(false);
    log.info('info');
    log.error('error');
    log.fatal('fatal');

    expect(stdoutSpy).toHaveBeenCalledOnce();
    expect(stderrSpy).toHaveBeenCalledTimes(2);

    stderrSpy.mockRestore();
    stdoutSpy.mockRestore();
  });
});

describe('Logger — edge cases', () => {
  let output: string[];
  let log: Logger;

  beforeEach(() => {
    output = [];
    setColorsEnabled(false);
    log = createLogger({
      level: 'trace',
      timestampFormat: 'none',
      write: (m) => output.push(m),
    });
  });

  it('handles empty string message', () => {
    expect(() => log.info('')).not.toThrow();
    expect(output).toHaveLength(1);
  });

  it('handles null-like values in extra args', () => {
    expect(() => log.info('test', null)).not.toThrow();
  });

  it('handles undefined extra args gracefully', () => {
    expect(() => log.info('test', undefined)).not.toThrow();
  });

  it('handles number as first arg', () => {
    expect(() => log.info(42 as unknown as string)).not.toThrow();
    expect(output[0]).toContain('42');
  });

  it('handles very long messages', () => {
    const longMsg = 'x'.repeat(10_000);
    expect(() => log.info(longMsg)).not.toThrow();
    expect(output[0]).toContain(longMsg);
  });

  it('handles special characters in message', () => {
    const special = 'emoji 🚀 unicode ✓ quotes "hello" \'world\'';
    expect(() => log.info(special)).not.toThrow();
    expect(output[0]).toContain(special);
  });

  it('handles Error with cause', () => {
    const cause = new Error('root cause');
    const err = new Error('top level', { cause });
    expect(() => log.error('with cause', err)).not.toThrow();
  });

  it('handles non-Error objects in err binding', () => {
    const jsonLog = createLogger({
      level: 'trace',
      json: true,
      write: (m) => output.push(m),
    });
    // err is a string, not an Error
    jsonLog.error({ err: 'string error' }, 'something happened');
    expect(output).toHaveLength(1);
    const record = JSON.parse(output[0]!) as Record<string, unknown>;
    expect(record['err']).toBe('string error');
  });

  it('handles BigInt in JSON mode', () => {
    const jsonLog = createLogger({
      level: 'trace',
      json: true,
      write: (m) => output.push(m),
    });
    expect(() => jsonLog.info({ bigNum: BigInt(9007199254740991) }, 'bigint test')).not.toThrow();
    expect(output).toHaveLength(1);
    const record = JSON.parse(output[0]!) as Record<string, unknown>;
    expect(record['bigNum']).toBe('9007199254740991n');
  });
});
