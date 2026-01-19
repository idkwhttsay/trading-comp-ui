import { createLogger } from './logger';
import type { ZodTypeAny, infer as Infer } from 'zod';

const log = createLogger('validation');

/**
 * Validates data with a Zod schema. Returns parsed data or null (and logs a warning).
 */
export function safeParse<TSchema extends ZodTypeAny>(
    schema: TSchema,
    data: unknown,
    context?: Record<string, unknown>,
): Infer<TSchema> | null {
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
export function safeJsonParse(text: string): unknown | null {
    try {
        return JSON.parse(text);
    } catch (_) {
        return null;
    }
}
