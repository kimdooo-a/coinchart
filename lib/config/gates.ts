/**
 * lib/config/gates.ts
 * 
 * Feature Gates & Runtime Configuration
 * - APP_MODE: dev | staging | prod
 * - DISABLE_AUTOMATION: kill switch for batch jobs
 * - DISABLE_PRO_GATE: kill switch for Pro tier gating
 */

export type AppMode = 'dev' | 'staging' | 'prod';

/**
 * Feature gates object
 */
export interface FeatureGates {
    /** Application mode: dev, staging, or prod */
    appMode: AppMode;

    /** If true, batch jobs (daily/weekly) are disabled */
    isDisabledAutomation: boolean;

    /** If true, Pro tier gating is disabled (all features visible) */
    isDisabledProGate: boolean;

    /** Convenience flags */
    isDevelopment: boolean;
    isStaging: boolean;
    isProduction: boolean;
}

/**
 * Get feature gates from environment variables
 * 
 * Environment Variables:
 * - NEXT_PUBLIC_APP_MODE: 'dev' (default) | 'staging' | 'prod'
 * - NEXT_PUBLIC_DISABLE_AUTOMATION: 'true' | 'false' (default)
 * - NEXT_PUBLIC_DISABLE_PRO_GATE: 'true' | 'false' (default)
 * 
 * Example:
 * const gates = getFeatureGates();
 * if (gates.isProduction) {
 *     // Production-only logic
 * }
 */
export function getFeatureGates(): FeatureGates {
    const appMode = (process.env.NEXT_PUBLIC_APP_MODE || 'dev') as AppMode;

    const isDisabledAutomation =
        process.env.NEXT_PUBLIC_DISABLE_AUTOMATION === 'true';

    const isDisabledProGate = process.env.NEXT_PUBLIC_DISABLE_PRO_GATE === 'true';

    return {
        appMode,
        isDisabledAutomation,
        isDisabledProGate,
        isDevelopment: appMode === 'dev',
        isStaging: appMode === 'staging',
        isProduction: appMode === 'prod',
    };
}

/**
 * Get feature gates (singleton)
 * Caches the result to avoid repeated lookups
 */
let cachedGates: FeatureGates | null = null;

export function getFeatureGatesCached(): FeatureGates {
    if (!cachedGates) {
        cachedGates = getFeatureGates();
    }
    return cachedGates;
}

/**
 * Reset cache (for testing)
 */
export function resetFeatureGatesCache(): void {
    cachedGates = null;
}
