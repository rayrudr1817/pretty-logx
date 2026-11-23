# pretty-logx

A clean, lightweight logger for Node.js with colored dev output, structured JSON for production, and zero dependencies.

```bash
npm install pretty-logx
```

## Why

Most loggers are either too heavy (Pino, Winston) or too barebones (Console). `pretty-logx` gives you formatted terminal output in development, fast structured JSON in production, child loggers with context, and safe circular JSON handling — all in under 5KB with zero runtime dependencies.

## Usage

### Basic

```ts
import { createLogger } from 'pretty-logx';

const log = createLogger();

log.info('Server started on port 3000');
log.warn('Disk space low', { remaining: '1.2GB' });
log.error('Database connection failed', new Error('ECONNREFUSED'));
```

### Context & Child Loggers

Pass request metadata or create scoped child loggers:

```ts
// Bindings first (structured)
log.info({ userId: 'u_123', action: 'checkout' }, 'Order placed');

// Scoped child logger
const authLog = log.child({ scope: 'auth' });
authLog.debug('Verifying JWT');
authLog.info({ userId: 'u_123' }, 'Session created');
```

### Production JSON Mode

```ts
const log = createLogger({
  level: 'info',
  json: process.env.NODE_ENV === 'production',
  namespace: 'api',
});

log.info({ path: '/api/v1/users', status: 200 }, 'Request completed');
```

Output:
```json
{"level":"info","levelValue":30,"time":"2026-11-23T17:15:00.000Z","msg":"Request completed","namespace":"api","path":"/api/v1/users","status":200}
```

### Error Handling

Pass standard errors and get formatted stack traces in dev, or serialized error objects in JSON mode:

```ts
try {
  throw new Error('Something broke');
} catch (err) {
  log.error('Operation failed', err);
}
```

### Circular Objects

Circular references are caught and serialized as `[Circular]` instead of crashing your app:

```ts
const obj: any = { name: 'app' };
obj.self = obj;

log.info({ config: obj }, 'Loaded configuration');
```

## Options

`createLogger(options)` accepts:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `level` | `string` | `'info'` | `'trace'`, `'debug'`, `'info'`, `'warn'`, `'error'`, `'fatal'`, `'silent'` |
| `json` | `boolean` | `false` | Enable structured JSON output |
| `namespace` | `string` | `undefined` | Optional prefix tag (e.g. `api`, `worker`) |
| `timestamp` | `boolean` | `true` | Show timestamp in dev logs |
| `timestampFormat` | `string` | `'short'` | `'short'` (`HH:MM:SS.mmm`), `'iso'`, or `'none'` |
| `colors` | `boolean` | `auto` | Auto-detected. Supports `NO_COLOR` and `FORCE_COLOR` |
| `write` | `function` | `stdout/stderr` | Custom write handler `(output, level) => void` |

## Log Levels

- `trace` (10)
- `debug` (20)
- `info` (30)
- `warn` (40)
- `error` (50) — writes to `stderr`
- `fatal` (60) — writes to `stderr`
- `silent` (Infinity)

Check active levels before running expensive operations:

```ts
if (log.isDebugEnabled) {
  log.debug('Debug payload', getExpensiveMetrics());
}
```

## Environment Flags

- `NO_COLOR=1` — disables ANSI colors ([no-color.org](https://no-color.org))
- `FORCE_COLOR=1` — forces ANSI colors even in non-TTY environments

## License

MIT © [Rudransh](https://github.com/rayrudr1817)
