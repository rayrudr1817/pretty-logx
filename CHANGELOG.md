# Changelog

All notable changes to `pretty-logx` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-01-15

### Added

- Initial release of `pretty-logx`
- Six log levels: `trace`, `debug`, `info`, `warn`, `error`, `fatal`
- Beautiful colored terminal output with ANSI colors
- Short (`HH:MM:SS.mmm`) and ISO 8601 timestamp formats
- JSON mode for structured production logging
- Namespace support for tagging log sources
- Child loggers with inherited bindings
- Pretty error stack trace formatting
- Structured logging with object bindings (bindings-first calling convention)
- Level predicates (`isDebugEnabled`, `isInfoEnabled`, etc.)
- Runtime configuration via `configure()` and `level` setter
- Safe circular reference detection and serialization
- BigInt serialization support
- `NO_COLOR` environment variable support (https://no-color.org/)
- `FORCE_COLOR` environment variable support
- Automatic TTY color detection
- Custom write function support
- Error routing: `error`/`fatal` → `stderr`, rest → `stdout`
- ESM and CommonJS dual package
- Full TypeScript types and autocomplete
- Zero runtime dependencies
- Node.js 18+ compatibility
