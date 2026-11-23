# pretty-logx

A lightweight, beautiful, TypeScript-first logging library for Node.js.

[![npm version](https://img.shields.io/npm/v/pretty-logx.svg)](https://www.npmjs.com/package/pretty-logx)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js >= 18](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

## Features

- 🎨 **Colored terminal output** with timestamps
- 📊 **6 log levels**: `trace`, `debug`, `info`, `warn`, `error`, `fatal`
- 🏭 **JSON mode** for structured production logging
- 🔖 **Namespaces** for tagging log sources
- 👶 **Child loggers** with inherited bindings
- 🐛 **Pretty error stack traces**
- 📦 **Structured logging** with object bindings
- 🎛️ **Configurable levels and colors**
- 🚫 **NO_COLOR** and **FORCE_COLOR** support
- 🔄 **Safe circular reference handling**
- 📝 **TypeScript-first** with full type inference
- 📦 **ESM + CommonJS** dual package
- ⚡ **Zero runtime dependencies**
- 🟢 **Node.js 18+**

## Installation

```bash
npm install pretty-logx
```

## Quick Start

```ts
import { createLogger } from 'pretty-logx';

const log = createLogger({ level: 'debug', namespace: 'app' });

log.info('Server started', { port: 3000 });
log.debug({ query: 'SELECT * FROM users', duration: '12ms' }, 'DB query');
log.error({ err: new Error('Connection failed') }, 'Database error');
```

## API

### `createLogger(config?)`

Creates a new logger instance.

```ts
const log = createLogger({
  level: 'info',          // Minimum log level (default: 'info')
  json: false,            // JSON mode for production (default: false)
  namespace: 'myapp',     // Optional namespace prefix
  timestamp: true,        // Include timestamps (default: true)
  timestampFormat: 'short', // 'iso' | 'short' | 'none' (default: 'short')
  colors: true,           // Override color auto-detection
  write: (msg, level) => process.stdout.write(msg + '\n'), // Custom writer
});
```

### Log Methods

All log methods accept two calling conventions:

```ts
// Message only
log.info('Hello world');

// Message + extra data
log.info('Request complete', { status: 200 });

// Bindings object first (recommended for structured logging)
log.info({ requestId: 'abc', userId: 42 }, 'User logged in');

// Error logging
log.error({ err: new Error('oops') }, 'Something failed');
log.error('Request failed', new Error('Timeout'));
```

Available methods: `trace`, `debug`, `info`, `warn`, `error`, `fatal`

### Level Predicates

```ts
if (log.isDebugEnabled) {
  log.debug('Expensive debug info', computeDebugInfo());
}
```

Predicates: `isTraceEnabled`, `isDebugEnabled`, `isInfoEnabled`, `isWarnEnabled`, `isErrorEnabled`, `isFatalEnabled`

### Child Loggers

```ts
const reqLog = log.child({ requestId: 'req-123' });
reqLog.info('Processing'); // Includes requestId automatically

// Override config in child
const quietChild = log.child({}, { level: 'warn' });
```

### JSON Mode (Production)

```ts
const log = createLogger({ json: true, level: 'info' });
log.info({ userId: 42 }, 'Login');
// Output: {"level":"info","levelValue":30,"time":"2024-01-15T12:00:00.000Z","msg":"Login","userId":42}
```

### Runtime Configuration

```ts
log.level = 'debug';    // Change level
log.configure({ json: true, level: 'warn' }); // Multiple options at once
```

### Color Control

```ts
import { setColorsEnabled } from 'pretty-logx';
setColorsEnabled(false); // Disable colors globally

// Or via environment:
// NO_COLOR=1  → disables colors
// FORCE_COLOR=1 → enables colors even in non-TTY
```

## Log Levels

| Level   | Value | Use Case                        |
|---------|-------|---------------------------------|
| `trace` | 10    | Extremely detailed debugging    |
| `debug` | 20    | Debug information               |
| `info`  | 30    | Normal operational messages     |
| `warn`  | 40    | Warnings, recoverable issues    |
| `error` | 50    | Errors, failures                |
| `fatal` | 60    | Critical failures               |
| `silent`| ∞     | Suppress all output             |

## TypeScript

Full TypeScript support with strict types:

```ts
import type { LoggerConfig, LogLevelName, LogRecord } from 'pretty-logx';
```

## CommonJS Support

```js
const { createLogger } = require('pretty-logx');
```

## License

[MIT](LICENSE) © 2024
