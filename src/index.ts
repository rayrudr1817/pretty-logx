/**
 * pretty-logx - A lightweight, beautiful, TypeScript-first logging library for Node.js.
 *
 * @example
 * ```ts
 * import { createLogger } from 'pretty-logx';
 *
 * const log = createLogger({ level: 'debug', namespace: 'app' });
 * log.info('Server started', { port: 3000 });
 * log.error({ err: new Error('oops') }, 'Something failed');
 * ```
 */

export { Logger, createLogger, logger } from './logger.js';
export { isColorsEnabled, setColorsEnabled, detectColorSupport } from './colors.js';
export { LogLevel, isLogLevelName, getLevelValue, getLevelName } from './levels.js';
export { safeStringify, serializeError } from './serializer.js';

export type { LoggerConfig, LogRecord, LogArgs } from './logger.js';
export type { LogLevelName, LogLevelValue } from './levels.js';
export type { SerializedError } from './serializer.js';
export type { LevelStyle, FormatOptions } from './formatter.js';
