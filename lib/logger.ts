// lib/logger.ts
// Simple logger utility

export function createLogger(name: string) {
    return {
        info: (...args: unknown[]) => console.log(`[${name}]`, ...args),
        error: (...args: unknown[]) => console.error(`[${name}]`, ...args),
        warn: (...args: unknown[]) => console.warn(`[${name}]`, ...args),
        debug: (...args: unknown[]) => console.debug(`[${name}]`, ...args),
    };
}
