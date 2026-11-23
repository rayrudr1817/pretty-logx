import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isColorsEnabled, setColorsEnabled, detectColorSupport, colorize, bold, dim, ANSI } from '../src/colors.js';

describe('color detection', () => {
  let originalNoColor: string | undefined;
  let originalForceColor: string | undefined;
  let originalCI: string | undefined;

  beforeEach(() => {
    originalNoColor = process.env['NO_COLOR'];
    originalForceColor = process.env['FORCE_COLOR'];
    originalCI = process.env['CI'];
    // Reset color cache between tests
    setColorsEnabled(false);
  });

  afterEach(() => {
    if (originalNoColor === undefined) {
      delete process.env['NO_COLOR'];
    } else {
      process.env['NO_COLOR'] = originalNoColor;
    }
    if (originalForceColor === undefined) {
      delete process.env['FORCE_COLOR'];
    } else {
      process.env['FORCE_COLOR'] = originalForceColor;
    }
    if (originalCI === undefined) {
      delete process.env['CI'];
    } else {
      process.env['CI'] = originalCI;
    }
  });

  it('NO_COLOR disables colors', () => {
    process.env['NO_COLOR'] = '';
    expect(detectColorSupport()).toBe(false);
  });

  it('FORCE_COLOR=1 enables colors', () => {
    delete process.env['NO_COLOR'];
    process.env['FORCE_COLOR'] = '1';
    expect(detectColorSupport()).toBe(true);
  });

  it('FORCE_COLOR=0 disables colors', () => {
    delete process.env['NO_COLOR'];
    process.env['FORCE_COLOR'] = '0';
    expect(detectColorSupport()).toBe(false);
  });

  it('CI environment enables colors', () => {
    delete process.env['NO_COLOR'];
    delete process.env['FORCE_COLOR'];
    process.env['CI'] = 'true';
    expect(detectColorSupport()).toBe(true);
  });
});

describe('colorize', () => {
  beforeEach(() => setColorsEnabled(true));
  afterEach(() => setColorsEnabled(false));

  it('wraps text with ANSI codes when enabled', () => {
    const result = colorize(ANSI.red, 'hello');
    expect(result).toBe(`${ANSI.red}hello${ANSI.reset}`);
  });

  it('returns plain text when colors disabled', () => {
    setColorsEnabled(false);
    expect(colorize(ANSI.red, 'hello')).toBe('hello');
  });
});

describe('bold and dim', () => {
  beforeEach(() => setColorsEnabled(true));
  afterEach(() => setColorsEnabled(false));

  it('bold wraps with bold ANSI', () => {
    expect(bold('text')).toBe(`${ANSI.bold}text${ANSI.reset}`);
  });

  it('dim wraps with dim ANSI', () => {
    expect(dim('text')).toBe(`${ANSI.dim}text${ANSI.reset}`);
  });

  it('bold returns plain text when colors off', () => {
    setColorsEnabled(false);
    expect(bold('text')).toBe('text');
  });
});

describe('setColorsEnabled / isColorsEnabled', () => {
  it('can be toggled', () => {
    setColorsEnabled(true);
    expect(isColorsEnabled()).toBe(true);
    setColorsEnabled(false);
    expect(isColorsEnabled()).toBe(false);
  });
});
