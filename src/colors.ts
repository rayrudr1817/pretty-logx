/**
 * ANSI color codes for terminal output.
 * Respects NO_COLOR environment variable and TTY detection.
 */

export const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',

  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  // Bright foreground
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',

  // Background colors
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
} as const;

export type AnsiCode = (typeof ANSI)[keyof typeof ANSI];

/**
 * Detect whether colors should be enabled.
 * Checks: NO_COLOR env var, FORCE_COLOR env var, TTY availability.
 */
export function detectColorSupport(): boolean {
  // Respect NO_COLOR standard (https://no-color.org/)
  if (process.env['NO_COLOR'] !== undefined) return false;

  // FORCE_COLOR overrides everything
  if (process.env['FORCE_COLOR'] !== undefined) {
    const val = process.env['FORCE_COLOR'];
    if (val === '0') return false;
    return true;
  }

  // CI environments usually support color
  if (process.env['CI']) return true;

  // Check if stdout is a TTY
  return process.stdout.isTTY === true;
}

let _colorsEnabled: boolean | null = null;

export function isColorsEnabled(): boolean {
  if (_colorsEnabled === null) {
    _colorsEnabled = detectColorSupport();
  }
  return _colorsEnabled;
}

export function setColorsEnabled(enabled: boolean): void {
  _colorsEnabled = enabled;
}

export function colorize(code: string, text: string): string {
  if (!isColorsEnabled()) return text;
  return `${code}${text}${ANSI.reset}`;
}

export function bold(text: string): string {
  return colorize(ANSI.bold, text);
}

export function dim(text: string): string {
  return colorize(ANSI.dim, text);
}
