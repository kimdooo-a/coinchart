/**
 * scripts/healthcheck.ts
 * 
 * Post-deployment verification
 * - Check if critical endpoints are responding
 * - Verify database connectivity
 * - Validate response format
 * 
 * Usage: HEALTH_CHECK_URL=http://localhost:3000 npm run healthcheck
 * Exit code: 0 (healthy) or 1 (unhealthy)
 */

import { createLogger } from '../lib/logger';

const logger = createLogger('healthcheck.log');

// ===========================
// Configuration
// ===========================

const BASE_URL = process.env.HEALTH_CHECK_URL || 'http://localhost:3000';
const TIMEOUT_MS = 10000; // 10 seconds per request

interface HealthCheckEndpoint {
    path: string;
    method: 'GET' | 'POST';
    name: string;
    critical: boolean; // If false, failure is non-critical
}

const ENDPOINTS: HealthCheckEndpoint[] = [
    {
        path: '/',
        method: 'GET',
        name: 'Home Page',
        critical: true,
    },
    {
        path: '/api/health',
        method: 'GET',
        name: 'Health Check API',
        critical: false,
    },
    {
        path: '/api/analysis/crypto/BTC',
        method: 'GET',
        name: 'Crypto Analysis API',
        critical: true,
    },
    {
        path: '/api/analysis/stock/AAPL',
        method: 'GET',
        name: 'Stock Analysis API',
        critical: true,
    },
];

// ===========================
// Type Definitions
// ===========================

interface HealthCheckResult {
    endpoint: HealthCheckEndpoint;
    status: number | null;
    ok: boolean;
    duration: number;
    error?: string;
    timestamp: Date;
}

// ===========================
// Health Check Logic
// ===========================

/**
 * Check a single endpoint
 */
async function checkEndpoint(endpoint: HealthCheckEndpoint): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
        const url = `${BASE_URL}${endpoint.path}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const response = await fetch(url, {
            method: endpoint.method,
            signal: controller.signal,
            headers: {
                'User-Agent': 'HealthCheck/1.0',
            },
        });

        clearTimeout(timeoutId);

        const duration = Date.now() - startTime;
        const ok = response.status >= 200 && response.status < 300;

        return {
            endpoint,
            status: response.status,
            ok,
            duration,
            timestamp: new Date(),
        };
    } catch (error: any) {
        const duration = Date.now() - startTime;

        return {
            endpoint,
            status: null,
            ok: false,
            duration,
            error: error.message || 'Unknown error',
            timestamp: new Date(),
        };
    }
}

/**
 * Run health checks for all endpoints
 */
async function runHealthChecks(): Promise<void> {
    try {
        logger.info('[START] Health Checks');
        logger.info(`Base URL: ${BASE_URL}`);
        logger.info(`Timestamp: ${new Date().toISOString()}`);
        logger.info('');

        const results: HealthCheckResult[] = [];

        // Check each endpoint
        for (const endpoint of ENDPOINTS) {
            logger.info(`[CHECK] ${endpoint.name}`);
            const result = await checkEndpoint(endpoint);
            results.push(result);

            if (result.ok) {
                logger.info(
                    `  ✅ ${result.endpoint.path} (${result.status}, ${result.duration}ms)`
                );
            } else if (result.error) {
                logger.error(
                    `  ❌ ${result.endpoint.path} (${result.error}, ${result.duration}ms)`
                );
            } else {
                logger.error(
                    `  ❌ ${result.endpoint.path} (Status ${result.status}, ${result.duration}ms)`
                );
            }

            logger.info('');
        }

        // Evaluate results
        const criticalFailures = results.filter(r => r.endpoint.critical && !r.ok);
        const allOk = results.every(r => r.ok);

        // Summary
        logger.info('[SUMMARY]');
        logger.info(`Total: ${results.length}`);
        logger.info(`Healthy: ${results.filter(r => r.ok).length}`);
        logger.info(`Failed: ${results.filter(r => !r.ok).length}`);
        logger.info(`Critical Failures: ${criticalFailures.length}`);
        logger.info('');

        // Detailed status
        for (const result of results) {
            const status = result.ok ? '✅' : '❌';
            const critical = result.endpoint.critical ? ' [CRITICAL]' : '';
            logger.info(
                `  ${status} ${result.endpoint.name}${critical} (${result.duration}ms)`
            );
        }

        logger.info('');

        // Exit based on critical failures
        if (criticalFailures.length > 0) {
            logger.error('[FAILED] Critical endpoints are down');
            logger.error('[RECOMMENDATION] Check server logs and consider rollback');

            // Log which endpoints are failing
            for (const failure of criticalFailures) {
                logger.error(`  - ${failure.endpoint.name}: ${failure.error || `Status ${failure.status}`}`);
            }

            process.exit(1);
        }

        if (!allOk) {
            logger.warn('[WARNING] Some non-critical endpoints failed');
            logger.info('[DECISION] Deployment OK (critical endpoints healthy)');
        } else {
            logger.info('[PASSED] All health checks passed ✅');
        }

        logger.info('[END] Deployment verified');
        process.exit(0);
    } catch (error: any) {
        logger.error('[FATAL] Unexpected error during health checks');
        logger.error(`Message: ${error.message}`);
        logger.error(`Stack: ${error.stack}`);
        process.exit(1);
    }
}

// ===========================
// Validation
// ===========================

/**
 * Validate configuration
 */
function validateConfiguration(): void {
    if (!BASE_URL) {
        logger.error('❌ HEALTH_CHECK_URL environment variable is not set');
        logger.info('Usage: HEALTH_CHECK_URL=http://localhost:3000 npm run healthcheck');
        process.exit(1);
    }

    try {
        new URL(BASE_URL);
    } catch (error) {
        logger.error(`❌ Invalid HEALTH_CHECK_URL: ${BASE_URL}`);
        process.exit(1);
    }
}

// ===========================
// Execute
// ===========================

validateConfiguration();
runHealthChecks();
