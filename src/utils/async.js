import { createLogger } from './logger';

const log = createLogger('async');

/**
 * Wrap an async handler so errors are always caught+logged.
 */
export function withAsyncErrorLogging(name, fn) {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            log.error(name || 'Async handler failed', error);
            return undefined;
        }
    };
}
