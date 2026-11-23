<div align="center">

# ✨ pretty-logx

**A lightweight, beautiful, TypeScript-first logging library for Node.js.**  
*Zero runtime dependencies. Blazing fast. Production-ready structured JSON & pretty dev terminal logs.*

[![npm version](https://img.shields.io/npm/v/pretty-logx?color=blue&style=flat-square)](https://www.npmjs.com/package/pretty-logx)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/pretty-logx?color=green&style=flat-square)](https://bundlephobia.com/package/pretty-logx)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![Node.js >= 18](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=flat-square)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)

</div>

---

## ⚡ Highlights

- 🎨 **Beautiful Dev Logs** — Colored output with level badges, timestamps & namespaces
- 🏭 **Production JSON Mode** — Machine-readable structured logs for Datadog, CloudWatch, Loki, etc.
- 🚀 **Zero Dependencies** — No bloated node_modules tree. Fast, lightweight, pure Node.js
- 🛡️ **Circular Safe** — Safely handles complex nested circular object references without crashing
- 👶 **Context & Child Loggers** — Attach persistent metadata (`requestId`, `userId`) across request lifecycles
- 💥 **Formatted Stack Traces** — Beautiful, human-readable error trace highlighting
- 🚫 **Standards Compliant** — Automatic TTY detection with full `NO_COLOR` & `FORCE_COLOR` support
- 📦 **Dual Module** — Native ESM and CommonJS (`.cjs`) support with complete `.d.ts` types

---

## 📸 Preview

```text
22:15:02  ◦ TRACE  [database] Connecting to pool...
22:15:03  ● DEBUG  [auth] Token verified for user: @rudr
22:15:04  ✓ INFO   [server] HTTP server listening on http://localhost:3000
22:15:05  ⚠ WARN   [cache] Memory cache nearing 85% capacity
22:15:06  ✗ ERROR  [payment] Failed processing checkout intent: card_declined
22:15:07  ✖ FATAL  [cluster] Worker node crashed with exit code 1
```

---

## 📦 Installation

```bash
# npm
npm install pretty-logx

# pnpm
pnpm add pretty-logx

# yarn
yarn add pretty-logx

# bun
bun add pretty-logx
```

---

## 🚀 Quick Start

### 1. Basic Logging

```typescript
import { logger } from 'pretty-logx';

logger.info('Hello from pretty-logx!');
logger.warn('Something looks suspicious');
logger.error('Failed to connect to database', new Error('ECONNREFUSED'));
```

### 2. Custom Logger Instance

```typescript
import { createLogger } from 'pretty-logx';

const log = createLogger({
  level: 'debug',
  namespace: 'api',
  timestampFormat: 'short', // 'short' | 'iso' | 'none'
});

log.debug('Debugging user authentication', { attempt: 1 });
log.info({ path: '/users', status: 200, latency: '12ms' }, 'Request finished');
```

---

## 💡 Key Features & Recipes

### 1. Child Loggers (Request Tracing)

Create scoped child loggers that inherit parent configurations and persist metadata like `requestId`, `tenantId`, or `serviceName`:

```typescript
import { createLogger } from 'pretty-logx';

const rootLogger = createLogger({ namespace: 'backend' });

// Express/Fastify middleware context
function handleRequest(req, res) {
  const reqLog = rootLogger.child({
    requestId: req.headers['x-request-id'] || 'req-9874',
    ip: req.ip,
  });

  reqLog.info('Incoming HTTP Request');
  // ... downstream
  reqLog.info('Request processed successfully');
}
```

### 2. Production JSON Logging

Switch to structured, machine-parsable JSON output in production environments:

```typescript
import { createLogger } from 'pretty-logx';

const log = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  json: process.env.NODE_ENV === 'production',
  namespace: 'payment-service',
});

log.info({ orderId: 'ord_12345', amount: 49.99, currency: 'USD' }, 'Payment captured');
```

**JSON Output:**
```json
{
  "level": "info",
  "levelValue": 30,
  "time": "2026-11-23T16:45:00.000Z",
  "msg": "Payment captured",
  "namespace": "payment-service",
  "orderId": "ord_12345",
  "amount": 49.99,
  "currency": "USD"
}
```

### 3. Safe Handling of Circular References

Circular objects are handled safely without throwing `TypeError: Converting circular structure to JSON`:

```typescript
const circularObj: Record<string, unknown> = { name: 'cyclic' };
circularObj.self = circularObj;

log.info({ details: circularObj }, 'Circular reference handled safely');
// => { "name": "cyclic", "self": "[Circular]" }
```

### 4. Level Checking for Expensive Operations

Avoid computing expensive log payloads if the log level is disabled:

```typescript
if (log.isDebugEnabled) {
  const heavyAnalytics = calculateHeavyProfilingMetrics();
  log.debug({ metrics: heavyAnalytics }, 'Profiling results');
}
```

---

## 🎛️ Configuration Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `level` | `LogLevelName` | `'info'` | Minimum log level (`trace`, `debug`, `info`, `warn`, `error`, `fatal`, `silent`) |
| `json` | `boolean` | `false` | When `true`, outputs ndjson formatted logs |
| `namespace` | `string` | `undefined` | Prefix tag for your logs (e.g. `[auth]`, `[worker]`) |
| `timestamp` | `boolean` | `true` | Whether to display timestamps |
| `timestampFormat` | `'short' \| 'iso' \| 'none'` | `'short'` | Format of the timestamp (`HH:MM:SS.mmm` or ISO 8601) |
| `colors` | `boolean` | `auto` | Force-enable or disable terminal colorization |
| `write` | `(output, level) => void` | `console/stream` | Custom writer function |

---

## 📊 Log Levels

| Level | Severity | Terminal Badge | Default Destination |
| :--- | :---: | :---: | :--- |
| `trace` | 10 | `◦ TRACE` | `stdout` |
| `debug` | 20 | `● DEBUG` | `stdout` |
| `info` | 30 | `✓ INFO ` | `stdout` |
| `warn` | 40 | `⚠ WARN ` | `stdout` |
| `error` | 50 | `✗ ERROR` | `stderr` |
| `fatal` | 60 | `✖ FATAL` | `stderr` |
| `silent`| ∞ | *(hidden)* | *(none)* |

---

## 🏷️ Standards & Environment Flags

- **`NO_COLOR`**: Set `NO_COLOR=1` to disable terminal ANSI color escapes ([no-color.org](https://no-color.org)).
- **`FORCE_COLOR`**: Set `FORCE_COLOR=1` to force color output in CI or non-TTY environments.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to open an issue or pull request.

---

## 📄 License

Distributed under the [MIT](LICENSE) License. © 2026 Rudransh & contributors.
