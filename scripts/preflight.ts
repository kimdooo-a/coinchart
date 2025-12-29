/**
 * scripts/preflight.ts
 * 
 * Pre-deployment checklist
 * - Verify required environment variables
 * - Test database connectivity
 * - Validate configuration
 * 
 * Usage: npm run preflight
 * Exit code: 0 (success) or 1 (failure)
 */

import dotenv from 'dotenv';
import path from 'path';
import { createLogger } from '../lib/logger';
import { getFeatureGates } from '../lib/config/gates';

// Load environment variables from .env.local (if exists)
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const logger = createLogger('preflight.log');

// ===========================
// Required environment variables
// ===========================

const REQUIRED_VARS = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_URL',
];

const OPTIONAL_VARS = [
    'NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID',
    'GOOGLE_OAUTH_CLIENT_SECRET',
    'TWELVEDATA_API_KEY',
];

// ===========================
// Check Functions
// ===========================

/**
 * Check if all required environment variables are set
 */
async function checkEnvironmentVariables(): Promise<boolean> {
    logger.info('[CHECK 1/4] Environment Variables');

    const missing: string[] = [];
    const present: string[] = [];

    // Check required variables
    for (const variable of REQUIRED_VARS) {
        if (!process.env[variable]) {
            missing.push(variable);
        } else {
            present.push(variable);
        }
    }

    // Log present variables
    if (present.length > 0) {
        logger.info(`  ✅ Present: ${present.join(', ')}`);
    }

    // Log missing variables
    if (missing.length > 0) {
        logger.error(`  ❌ Missing (required): ${missing.join(', ')}`);
        return false;
    }

    // Check optional variables (warn if missing)
    const missingOptional = OPTIONAL_VARS.filter(v => !process.env[v]);
    if (missingOptional.length > 0) {
        logger.warn(`  ⚠️  Missing (optional): ${missingOptional.join(', ')}`);
    }

    logger.info(`  ✅ All required variables present`);
    return true;
}

/**
 * Check database connectivity
 */
async function checkDatabaseConnection(): Promise<boolean> {
    logger.info('[CHECK 2/4] Database Connection');

    try {
        const { createClient } = await import('@supabase/supabase-js');

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            logger.error(`  ❌ Missing database credentials`);
            return false;
        }

        const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: false },
        });

        // Try to read from batch_runs table (non-destructive)
        const { data, error } = await supabase
            .from('batch_runs')
            .select('id')
            .limit(1);

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = no rows, which is OK
            throw error;
        }

        logger.info(`  ✅ Database connection OK`);
        return true;
    } catch (error: any) {
        logger.error(`  ❌ Database error: ${error.message}`);
        return false;
    }
}

/**
 * Check feature gates configuration
 */
async function checkFeatureGates(): Promise<boolean> {
    logger.info('[CHECK 3/4] Feature Gates');

    try {
        const gates = getFeatureGates();

        logger.info(`  App Mode: ${gates.appMode}`);
        logger.info(`  Automation Disabled: ${gates.isDisabledAutomation}`);
        logger.info(`  Pro Gate Disabled: ${gates.isDisabledProGate}`);

        // Warn if Pro Gate is disabled in production
        if (gates.isProduction && gates.isDisabledProGate) {
            logger.warn(`  ⚠️  Pro gate is disabled in production`);
        }

        logger.info(`  ✅ Feature gates configured`);
        return true;
    } catch (error: any) {
        logger.error(`  ❌ Feature gates error: ${error.message}`);
        return false;
    }
}

/**
 * Check Node.js and npm versions
 */
async function checkNodeEnvironment(): Promise<boolean> {
    logger.info('[CHECK 4/4] Node Environment');

    try {
        const nodeVersion = process.version;
        const npmVersion = require('child_process').execSync('npm --version').toString().trim();

        logger.info(`  Node.js: ${nodeVersion}`);
        logger.info(`  npm: ${npmVersion}`);

        // Require Node 16+
        const major = parseInt(nodeVersion.slice(1).split('.')[0]);
        if (major < 16) {
            logger.error(`  ❌ Node.js 16+ required (you have ${nodeVersion})`);
            return false;
        }

        logger.info(`  ✅ Node environment OK`);
        return true;
    } catch (error: any) {
        logger.warn(`  ⚠️  Could not check Node environment: ${error.message}`);
        return true; // Non-critical
    }
}

/**
 * Run all preflight checks
 */
async function runPreflightChecks(): Promise<void> {
    try {
        logger.info('[START] Preflight Checks');
        logger.info(`Timestamp: ${new Date().toISOString()}`);
        logger.info('');

        const checks = [
            { name: 'Environment Variables', fn: checkEnvironmentVariables },
            { name: 'Database Connection', fn: checkDatabaseConnection },
            { name: 'Feature Gates', fn: checkFeatureGates },
            { name: 'Node Environment', fn: checkNodeEnvironment },
        ];

        const results: Array<{ name: string; passed: boolean }> = [];

        for (const check of checks) {
            const passed = await check.fn();
            results.push({ name: check.name, passed });
            logger.info('');
        }

        // Summary
        logger.info('[SUMMARY]');
        const allPassed = results.every(r => r.passed);

        for (const result of results) {
            const status = result.passed ? '✅' : '❌';
            logger.info(`  ${status} ${result.name}`);
        }

        logger.info('');

        if (allPassed) {
            logger.info('[PASSED] All preflight checks passed ✅');
            logger.info(`[END] Ready for deployment`);
            process.exit(0);
        } else {
            logger.error('[FAILED] Some preflight checks failed ❌');
            logger.error('[END] Fix the issues above before deploying');
            process.exit(1);
        }
    } catch (error: any) {
        logger.error('[FATAL] Unexpected error during preflight checks');
        logger.error(`Message: ${error.message}`);
        logger.error(`Stack: ${error.stack}`);
        process.exit(1);
    }
}

// Execute
runPreflightChecks();
