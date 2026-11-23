import { ANSI, colorize, bold, dim } from './colors.js';
import type { LogLevelName } from './levels.js';

/**
 * Color configuration per log level.
 */
export interface LevelStyle {
  label: string;
  color: string;
  badge: string;
}

export const LEVEL_STYLES: Record<LogLevelName, LevelStyle> = {
  trace: {
    label: 'TRACE',
    color: ANSI.gray,
    badge: '◦',
  },
  debug: {
    label: 'DEBUG',
    color: ANSI.cyan,
    badge: '●',
  },
  info: {
    label: 'INFO ',
    color: ANSI.brightGreen,
    badge: '✓',
  },
  warn: {
    label: 'WARN ',
    color: ANSI.brightYellow,
    badge: '⚠',
  },
  error: {
    label: 'ERROR',
    color: ANSI.brightRed,
    badge: '✗',
  },
  fatal: {
    label: 'FATAL',
    color: `${ANSI.bgRed}${ANSI.brightWhite}`,
    badge: '✖',
  },
  silent: {
    label: 'SILENT',
    color: ANSI.gray,
    badge: ' ',
  },
};

export interface FormatOptions {
  timestamp: boolean;
  timestampFormat: 'iso' | 'short' | 'none';
  namespace?: string | undefined;
}

/**
 * Format the level badge+label for pretty output.
 */
export function formatLevelTag(level: LogLevelName): string {
  const style = LEVEL_STYLES[level];
  return colorize(style.color, `${style.badge} ${style.label}`);
}

/**
 * Format namespace for pretty output.
 */
export function formatNamespace(namespace: string): string {
  return colorize(ANSI.magenta, `[${namespace}]`);
}

/**
 * Format the timestamp portion.
 */
export function formatTime(format: 'iso' | 'short' | 'none', date: Date): string {
  if (format === 'none') return '';
  const now = date;
  if (format === 'iso') {
    return dim(now.toISOString());
  }
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const s = now.getSeconds().toString().padStart(2, '0');
  const ms = now.getMilliseconds().toString().padStart(3, '0');
  return dim(`${h}:${m}:${s}.${ms}`);
}

/**
 * Format a pretty stack trace for errors.
 */
export function formatStack(stack: string): string {
  const lines = stack.split('\n');
  const header = lines[0] ?? '';
  const frames = lines.slice(1);

  const formattedHeader = colorize(ANSI.brightRed, header);
  const formattedFrames = frames
    .map((frame) => {
      // Highlight file paths
      const withPath = frame.replace(
        /(at\s+)(.+?)(\s+\()?(\/[^)]+)(:\d+:\d+)(\)?)/g,
        (_m, at, fn, paren, file, loc, close) =>
          `${colorize(ANSI.gray, at)}${colorize(ANSI.yellow, fn)}${paren ?? ''}${colorize(ANSI.cyan, file)}${colorize(ANSI.gray, loc)}${close ?? ''}`
      );
      return withPath === frame
        ? colorize(ANSI.gray, frame)
        : withPath;
    })
    .join('\n');

  return `${formattedHeader}\n${formattedFrames}`;
}

/**
 * Pretty-print an object with indentation.
 */
export function formatObject(obj: unknown): string {
  if (typeof obj !== 'object' || obj === null) return String(obj);
  try {
    const json = JSON.stringify(obj, null, 2);
    // Colorize JSON keys
    return json.replace(/"([^"]+)":/g, (_, key) =>
      `${colorize(ANSI.cyan, `"${key}"`)}: `
    );
  } catch {
    return String(obj);
  }
}

/**
 * Build a complete pretty log line.
 */
export function buildPrettyLine(
  level: LogLevelName,
  message: string,
  opts: FormatOptions,
  date: Date
): string {
  const parts: string[] = [];

  const time = formatTime(opts.timestampFormat, date);
  if (time) parts.push(time);

  parts.push(formatLevelTag(level));

  if (opts.namespace) {
    parts.push(formatNamespace(opts.namespace));
  }

  parts.push(bold(message));

  return parts.join(' ');
}
