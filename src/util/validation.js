import { createLogger } from './logger';

const log = createLogger('validation');

/**
 * Validates data with a Zod schema. Returns parsed data or null (and logs a warning).
 */
export function safeParse(schema, data, context) {
    const result = schema.safeParse(data);
    if (result.success) return result.data;

    log.warn('Validation failed', {
        ...(context || {}),
        issues: result.error.issues,
    });
    return null;
}

/**
 * Parses JSON safely. Returns parsed value or null.
 */
export function safeJsonParse(text) {
    try {
        return JSON.parse(text);
    } catch (_) {
        return null;
    }
}
