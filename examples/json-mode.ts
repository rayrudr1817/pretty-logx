/**
 * Example: JSON / production mode logging
 */
import { createLogger } from '../src/index.js';

const log = createLogger({
  level: 'info',
  json: true,
  namespace: 'api',
});

log.info({ method: 'GET', path: '/users', statusCode: 200, duration: '45ms' }, 'Request complete');

const err = new Error('Database connection lost');
log.error({ err, retries: 3 }, 'Failed to connect');

// Child logger with request context
const reqLog = log.child({ requestId: 'req-abc-123', userId: 42 });
reqLog.info('Processing payment');
reqLog.warn({ amount: 9999.99, currency: 'USD' }, 'Large transaction flagged');
