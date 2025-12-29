/**
 * batch_orchestrator.ts
 * 
 * 배치 분석, 리포트, 알림을 통합하는 Orchestrator
 * - 완전한 배치 워크플로우 관리
 * - 에러 처리 및 로깅
 */

import { runDailyBatch, runWeeklyBatch, BatchResult } from './batch_analysis';
import { generateBatchReport } from './report_generator';
import { processAlertsForBatch, AlertProcessResult } from './alert_engine';
import { createLogger } from '../lib/logger';

export interface OrchestratorResult {
    batchResult: BatchResult;
    reportContent?: string;
    alertResult?: AlertProcessResult;
    totalDuration: number;
    status: 'completed' | 'failed';
}

const orchestratorLogger = createLogger('batch_orchestrator.log');

/**
 * Run complete daily batch workflow
 */
export async function runDailyBatchWorkflow(
    force: boolean = false
): Promise<OrchestratorResult> {
    const startTime = Date.now();
    orchestratorLogger.info('[START] Daily batch workflow initiated');

    try {
        // Step 1: Run analysis
        orchestratorLogger.info('[STEP 1] Running daily analysis...');
        const batchResult = await runDailyBatch(force);

        if (batchResult.status === 'skipped') {
            orchestratorLogger.info('[SKIP] Batch already completed today');
            return {
                batchResult,
                totalDuration: Date.now() - startTime,
                status: 'completed'
            };
        }

        if (batchResult.status === 'failed') {
            orchestratorLogger.error('[FAILED] Batch analysis failed');
            return {
                batchResult,
                totalDuration: Date.now() - startTime,
                status: 'failed'
            };
        }

        // Step 2: Generate report
        orchestratorLogger.info('[STEP 2] Generating report...');
        let reportContent: string | undefined;
        try {
            reportContent = await generateBatchReport({
                type: 'daily',
                batchId: batchResult.batchId,
                results: batchResult.results,
                startDate: batchResult.startedAt,
                endDate: batchResult.completedAt,
                format: 'markdown'
            });
            orchestratorLogger.info('[STEP 2] Report generated successfully');
        } catch (error: any) {
            orchestratorLogger.error(`[STEP 2] Report generation failed: ${error.message}`);
            // Continue anyway (non-blocking)
        }

        // Step 3: Process alerts
        orchestratorLogger.info('[STEP 3] Processing alerts...');
        let alertResult: AlertProcessResult | undefined;
        try {
            alertResult = await processAlertsForBatch(batchResult.batchId, batchResult.results);
            orchestratorLogger.info(
                `[STEP 3] Alerts processed: sent=${alertResult.sent}, skipped=${alertResult.skipped}, failed=${alertResult.failed}`
            );
        } catch (error: any) {
            orchestratorLogger.error(`[STEP 3] Alert processing failed: ${error.message}`);
            // Continue anyway (non-blocking)
        }

        orchestratorLogger.info('[COMPLETE] Daily batch workflow finished successfully');

        return {
            batchResult,
            reportContent,
            alertResult,
            totalDuration: Date.now() - startTime,
            status: 'completed'
        };
    } catch (error: any) {
        orchestratorLogger.error(`[FATAL] Workflow error: ${error.message}`);
        orchestratorLogger.error(error.stack);

        return {
            batchResult: {
                batchId: `batch_${Date.now()}`,
                type: 'daily',
                startedAt: new Date(),
                completedAt: new Date(),
                duration: Date.now() - startTime,
                status: 'failed',
                symbolCount: 0,
                succeededCount: 0,
                failedCount: 0,
                results: [],
                logs: []
            },
            totalDuration: Date.now() - startTime,
            status: 'failed'
        };
    }
}

/**
 * Run complete weekly batch workflow
 */
export async function runWeeklyBatchWorkflow(
    force: boolean = false
): Promise<OrchestratorResult> {
    const startTime = Date.now();
    orchestratorLogger.info('[START] Weekly batch workflow initiated');

    try {
        // Step 1: Run analysis
        orchestratorLogger.info('[STEP 1] Running weekly analysis...');
        const batchResult = await runWeeklyBatch(force);

        if (batchResult.status === 'failed') {
            orchestratorLogger.error('[FAILED] Batch analysis failed');
            return {
                batchResult,
                totalDuration: Date.now() - startTime,
                status: 'failed'
            };
        }

        // Step 2: Generate report
        orchestratorLogger.info('[STEP 2] Generating weekly report...');
        let reportContent: string | undefined;
        try {
            reportContent = await generateBatchReport({
                type: 'weekly',
                batchId: batchResult.batchId,
                results: batchResult.results,
                startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                endDate: new Date(),
                format: 'markdown'
            });
            orchestratorLogger.info('[STEP 2] Weekly report generated successfully');
        } catch (error: any) {
            orchestratorLogger.error(`[STEP 2] Report generation failed: ${error.message}`);
        }

        // Step 3: Process alerts
        orchestratorLogger.info('[STEP 3] Processing alerts...');
        let alertResult: AlertProcessResult | undefined;
        try {
            alertResult = await processAlertsForBatch(batchResult.batchId, batchResult.results);
            orchestratorLogger.info(
                `[STEP 3] Alerts processed: sent=${alertResult.sent}, skipped=${alertResult.skipped}`
            );
        } catch (error: any) {
            orchestratorLogger.error(`[STEP 3] Alert processing failed: ${error.message}`);
        }

        orchestratorLogger.info('[COMPLETE] Weekly batch workflow finished successfully');

        return {
            batchResult,
            reportContent,
            alertResult,
            totalDuration: Date.now() - startTime,
            status: 'completed'
        };
    } catch (error: any) {
        orchestratorLogger.error(`[FATAL] Workflow error: ${error.message}`);

        return {
            batchResult: {
                batchId: `batch_${Date.now()}`,
                type: 'weekly',
                startedAt: new Date(),
                completedAt: new Date(),
                duration: Date.now() - startTime,
                status: 'failed',
                symbolCount: 0,
                succeededCount: 0,
                failedCount: 0,
                results: [],
                logs: []
            },
            totalDuration: Date.now() - startTime,
            status: 'failed'
        };
    }
}
