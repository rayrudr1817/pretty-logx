/**
 * Log levels for pretty-logx.
 * Lower numbers = more verbose.
 */

export const LogLevel = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
  silent: Infinity,
} as const;

export type LogLevelName = keyof typeof LogLevel;
export type LogLevelValue = (typeof LogLevel)[LogLevelName];

export const LOG_LEVEL_NAMES = Object.keys(LogLevel) as LogLevelName[];

export function isLogLevelName(value: unknown): value is LogLevelName {
  return typeof value === 'string' && value in LogLevel;
}

export function getLevelValue(level: LogLevelName): number {
  return LogLevel[level];
}

export function getLevelName(value: number): LogLevelName | undefined {
  for (const [name, num] of Object.entries(LogLevel)) {
    if (num === value) return name as LogLevelName;
  }
  return undefined;
}
