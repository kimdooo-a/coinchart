/**
 * weekly_cron.ts
 * 
 * Thin wrapper for weekly batch orchestration
 * - Loads environment variables
 * - Calls batch_orchestrator
 * - Handles exceptions and logging
 * 
 * All batch logic is in batch_orchestrator.ts (SSOT)
 */

import dotenv from 'dotenv';
import path from 'path';
import { runWeeklyBatchWorkflow } from './batch_orchestrator';
import { createLogger } from '../lib/logger';

// Load environment variables locally (for testing)
// In GitHub Actions, these will be injected via secrets
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const logger = createLogger('weekly_cron.log');

// Validate credentials
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    logger.error('❌ Missing Supabase Credentials');
    process.exit(1);
}

/**
 * Main entry point for weekly batch
 */
async function main() {
    try {
        logger.info('[START] Weekly batch workflow initiated via cron');

        // Call orchestrator (SSOT: all batch logic is here)
        const result = await runWeeklyBatchWorkflow();

        logger.info(`[COMPLETE] Weekly batch workflow finished`);
        logger.info(`Batch ID: ${result.batchResult.batchId}`);
        logger.info(`Status: ${result.batchResult.status}`);
        logger.info(
            `Analysis: ${result.batchResult.succeededCount}/${result.batchResult.symbolCount} succeeded`
        );

        if (result.reportContent) {
            logger.info(`Report generated: ${result.reportContent.length} characters`);
        }

        if (result.alertResult) {
            logger.info(
                `Alerts: sent=${result.alertResult.sent}, ` +
                `failed=${result.alertResult.failed}, ` +
                `skipped=${result.alertResult.skipped}`
            );
        }

        logger.info(`Total duration: ${Math.floor(result.totalDuration / 1000)}s`);

        // Exit with success
        process.exit(result.status === 'completed' ? 0 : 1);
    } catch (error: any) {
        logger.error(`[FAILED] Weekly batch workflow error`);
        logger.error(`Message: ${error.message}`);
        logger.error(`Stack: ${error.stack}`);

        // Exit with failure
        process.exit(1);
    }
}

// Execute
main();
