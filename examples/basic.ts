/**
 * Example: Basic usage of pretty-logx
 * Run: node --loader ts-node/esm basic.ts
 * Or after build: node ../dist/index.js (not applicable — this is an example)
 */

import { createLogger } from '../src/index.js';

// Create a basic logger
const log = createLogger({
  level: 'trace',
  namespace: 'example',
  timestampFormat: 'short',
});

log.trace('Tracing execution flow');
log.debug('Debug information', { variable: 'value', count: 42 });
log.info('Server started successfully', { port: 3000, env: 'development' });
log.warn('Deprecation warning', { feature: 'old-api', replacement: 'new-api' });
log.error('Request failed', new Error('Connection timeout'));
log.fatal({ err: new Error('Out of memory') }, 'Critical failure — shutting down');

// Child logger example
const dbLog = log.child({ component: 'database' });
dbLog.info('Connected to database', { host: 'localhost', database: 'myapp' });
dbLog.debug('Query executed', { query: 'SELECT * FROM users', duration: '12ms' });

// Grandchild logger
const queryLog = dbLog.child({ queryId: 'q-001' });
queryLog.info('Slow query detected', { duration: '2500ms' });
