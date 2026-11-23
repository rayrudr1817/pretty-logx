import { LogLevel, type LogLevelName, type LogLevelValue } from './levels.js';
import { setColorsEnabled } from './colors.js';
import {
  buildPrettyLine,
  formatObject,
  formatStack,
  type FormatOptions,
} from './formatter.js';
import { safeStringify, serializeError, formatTimestamp } from './serializer.js';

/**
 * Configuration for creating a logger.
 */
export interface LoggerConfig {
  /** Minimum level to log. Defaults to 'info'. */
  level?: LogLevelName;
  /** Enable JSON mode (structured logging for production). */
  json?: boolean;
  /** Namespace/name prefix for this logger. */
  namespace?: string | undefined;
  /** Whether to include timestamps. Defaults to true. */
  timestamp?: boolean;
  /** Timestamp format. Defaults to 'short'. */
  timestampFormat?: 'iso' | 'short' | 'none';
  /** Enable/disable colors. Auto-detected by default. */
  colors?: boolean;
  /** Custom write function. Defaults to process.stdout/stderr. */
  write?: (output: string, level: LogLevelName) => void;
}


/**
 * Structured log record for JSON mode.
 */
export interface LogRecord {
  level: LogLevelName;
  levelValue: LogLevelValue;
  time: string;
  msg: string;
  namespace?: string;
  err?: unknown;
  [key: string]: unknown;
}

/**
 * Arguments to a log method: message + optional bindings.
 */
export type LogArgs =
  | [message: string]
  | [message: string, ...meta: unknown[]]
  | [bindings: object, message: string];

function isBindingsFirst(args: unknown[]): args is [object, string] {
  return (
    args.length >= 2 &&
    typeof args[0] === 'object' &&
    args[0] !== null &&
    !(args[0] instanceof Error) &&
    typeof args[1] === 'string'
  );
}

/**
 * Core Logger class.
 */
export class Logger {
  private _level: LogLevelName;
  private _levelValue: number;
  private _json: boolean;
  private _namespace: string | undefined;
  private _timestamp: boolean;
  private _timestampFormat: 'iso' | 'short' | 'none';
  private _write: (output: string, level: LogLevelName) => void;
  private _bindings: Record<string, unknown>;

  constructor(config: LoggerConfig = {}, parentBindings: Record<string, unknown> = {}) {
    this._level = config.level ?? 'info';
    this._levelValue = LogLevel[this._level];
    this._json = config.json ?? false;
    this._namespace = config.namespace;
    this._timestamp = config.timestamp ?? true;
    this._timestampFormat = config.timestampFormat ?? 'short';
    this._bindings = { ...parentBindings };

    if (config.colors !== undefined) {
      setColorsEnabled(config.colors);
    }

    this._write = config.write ?? defaultWriter;
  }

  // ---- Level getters/setters ----

  get level(): LogLevelName {
    return this._level;
  }

  set level(level: LogLevelName) {
    this._level = level;
    this._levelValue = LogLevel[level];
  }

  get levelValue(): number {
    return this._levelValue;
  }

  get namespace(): string | undefined {
    return this._namespace;
  }

  get isJsonMode(): boolean {
    return this._json;
  }

  // ---- Level predicates ----

  get isTraceEnabled(): boolean { return this._levelValue <= LogLevel.trace; }
  get isDebugEnabled(): boolean { return this._levelValue <= LogLevel.debug; }
  get isInfoEnabled(): boolean { return this._levelValue <= LogLevel.info; }
  get isWarnEnabled(): boolean { return this._levelValue <= LogLevel.warn; }
  get isErrorEnabled(): boolean { return this._levelValue <= LogLevel.error; }
  get isFatalEnabled(): boolean { return this._levelValue <= LogLevel.fatal; }

  // ---- Internal log method ----

  private _log(levelName: LogLevelName, args: unknown[]): void {
    const levelValue = LogLevel[levelName];
    if (levelValue < this._levelValue) return;

    const now = new Date();
    let message: string;
    let bindings: Record<string, unknown> = { ...this._bindings };
    let extraMeta: unknown[] = [];

    if (isBindingsFirst(args)) {
      const [obj, msg] = args;
      message = msg;
      bindings = { ...bindings, ...(obj as Record<string, unknown>) };
    } else {
      message = typeof args[0] === 'string' ? (args[0] as string) : String(args[0]);
      extraMeta = args.slice(1);
    }

    if (this._json) {
      this._writeJson(levelName, levelValue as LogLevelValue, message, bindings, extraMeta, now);
    } else {
      this._writePretty(levelName, message, bindings, extraMeta, now);
    }
  }

  private _writeJson(
    level: LogLevelName,
    levelValue: LogLevelValue,
    message: string,
    bindings: Record<string, unknown>,
    extraMeta: unknown[],
    date: Date
  ): void {
    const record: LogRecord = {
      level,
      levelValue,
      time: formatTimestamp(date),
      msg: message,
      ...bindings,
    };

    if (this._namespace) {
      record['namespace'] = this._namespace;
    }

    // Handle extra meta args
    if (extraMeta.length > 0) {
      if (extraMeta.length === 1 && extraMeta[0] instanceof Error) {
        record['err'] = serializeError(extraMeta[0]);
      } else if (extraMeta.length === 1) {
        record['data'] = extraMeta[0];
      } else {
        record['data'] = extraMeta;
      }
    }

    // Handle err in bindings
    if ('err' in record && record['err'] instanceof Error) {
      record['err'] = serializeError(record['err'] as Error);
    }

    const output = safeStringify(record);
    this._write(output, level);
  }

  private _writePretty(
    level: LogLevelName,
    message: string,
    bindings: Record<string, unknown>,
    extraMeta: unknown[],
    date: Date
  ): void {
    const formatOpts: FormatOptions = {
      timestamp: this._timestamp,
      timestampFormat: this._timestampFormat,
      ...(this._namespace !== undefined ? { namespace: this._namespace } : {}),
    };

    const line = buildPrettyLine(level, message, formatOpts, date);
    const lines: string[] = [line];

    // Print extra bindings (excluding err)
    const { err, ...rest } = bindings as { err?: unknown; [key: string]: unknown };
    const restKeys = Object.keys(rest);
    if (restKeys.length > 0) {
      lines.push(formatObject(rest));
    }

    // Print error
    const errObj = err ?? (extraMeta.length === 1 && extraMeta[0] instanceof Error ? extraMeta[0] : null);
    if (errObj instanceof Error) {
      if (errObj.stack) {
        lines.push(formatStack(errObj.stack));
      } else {
        lines.push(`${errObj.name}: ${errObj.message}`);
      }
    } else if (extraMeta.length > 0) {
      for (const item of extraMeta) {
        if (typeof item === 'object' && item !== null) {
          lines.push(formatObject(item));
        } else {
          lines.push(String(item));
        }
      }
    }

    this._write(lines.join('\n'), level);
  }

  // ---- Public log methods ----

  trace(...args: unknown[]): void {
    this._log('trace', args);
  }

  debug(...args: unknown[]): void {
    this._log('debug', args);
  }

  info(...args: unknown[]): void {
    this._log('info', args);
  }

  warn(...args: unknown[]): void {
    this._log('warn', args);
  }

  error(...args: unknown[]): void {
    this._log('error', args);
  }

  fatal(...args: unknown[]): void {
    this._log('fatal', args);
  }

  /**
   * Create a child logger with additional bindings and optional config overrides.
   */
  child(bindingsOrConfig: Record<string, unknown>, config?: Omit<LoggerConfig, 'namespace'>): Logger {
    const childConfig: LoggerConfig = {
      level: config?.level ?? this._level,
      json: config?.json ?? this._json,
      timestamp: config?.timestamp ?? this._timestamp,
      timestampFormat: config?.timestampFormat ?? this._timestampFormat,
      write: config?.write ?? this._write,
      ...(this._namespace !== undefined ? { namespace: this._namespace } : {}),
    };

    // Extract namespace from bindings if present
    if ('namespace' in bindingsOrConfig && typeof bindingsOrConfig['namespace'] === 'string') {
      childConfig.namespace = bindingsOrConfig['namespace'];
    }

    const child = new Logger(childConfig, { ...this._bindings, ...bindingsOrConfig });
    return child;
  }

  /**
   * Create a namespaced child logger.
   */
  ns(namespace: string): Logger {
    return this.child({ namespace });
  }



  /**
   * Configure this logger instance.
   */
  configure(config: Partial<LoggerConfig>): void {
    if (config.level !== undefined) {
      this._level = config.level;
      this._levelValue = LogLevel[config.level];
    }
    if (config.json !== undefined) this._json = config.json;
    if (config.namespace !== undefined) this._namespace = config.namespace;
    if (config.timestamp !== undefined) this._timestamp = config.timestamp;
    if (config.timestampFormat !== undefined) this._timestampFormat = config.timestampFormat;
    if (config.colors !== undefined) setColorsEnabled(config.colors);
    if (config.write !== undefined) this._write = config.write;
  }
}

/**
 * Default writer: errors/fatal → stderr, rest → stdout.
 */
function defaultWriter(output: string, level: LogLevelName): void {
  if (level === 'error' || level === 'fatal') {
    process.stderr.write(output + '\n');
  } else {
    process.stdout.write(output + '\n');
  }
}

// ---- Factory ----

/**
 * Create a new logger instance.
 */
export function createLogger(config: LoggerConfig = {}): Logger {
  return new Logger(config);
}

/**
 * Default logger instance.
 */
export const logger = createLogger({ level: 'info' });

/**
 * Re-export color utilities for convenience.
 */
export { isColorsEnabled, setColorsEnabled } from './colors.js';
