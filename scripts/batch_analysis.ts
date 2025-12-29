/**
 * batch_analysis.ts
 * 
 * Idempotent 배치 분석 엔진
 * - Daily/Weekly 배치 실행
 * - 중복 실행 방지
 * - 에러 격리 (한 자산 실패 → 다른 자산 계속)
 * - 구조화된 로깅
 */

import { createLogger } from '../lib/logger';
import { performAnalysis } from '../lib/analysis/orchestrator';
import { analyzeStock } from '../lib/analysis/stock';
import { generateSignals } from '../lib/analysis/signals';
import { fetchCryptoMarketPrices } from '../lib/supabase/crypto';
import { fetchStockPrices } from '../lib/supabase/stock';
import { supabaseAdmin } from '../lib/supabaseAdmin';

export interface BatchOptions {
    type: 'daily' | 'weekly';
    symbols?: string[];  // null/undefined = 모든 자산 분석
    runDate?: Date;
    force?: boolean;  // true: 강제 재실행, false: skip if completed
}

export interface AnalysisRecord {
    symbol: string;
    assetType: 'crypto' | 'stock';
    status: 'ok' | 'error';
    result?: any;
    error?: string;
    duration: number;  // ms
    timestamp: Date;
}

export interface BatchResult {
    batchId: string;
    type: 'daily' | 'weekly';
    startedAt: Date;
    completedAt: Date;
    duration: number;
    status: 'completed' | 'failed' | 'skipped';
    symbolCount: number;
    succeededCount: number;
    failedCount: number;
    results: AnalysisRecord[];
    logs: string[];
}

// ===========================
// Logger Setup
// ===========================

function createBatchLogger(batchId: string) {
    return createLogger(`batch_${batchId}.log`);
}

// ===========================
// Batch ID Generation
// ===========================

function generateBatchId(): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:-]/g, '').split('.')[0];
    return `batch_${timestamp}`;
}

// ===========================
// Check if Already Completed
// ===========================

async function checkIfCompleted(
    type: 'daily' | 'weekly',
    runDate: Date
): Promise<{ completed: boolean; batchId?: string }> {
    try {
        const result = await supabaseAdmin
            .from('batch_runs')
            .select('id')
            .eq('type', type)
            .eq('run_date', runDate.toISOString().split('T')[0])
            .eq('status', 'completed')
            .single();

        if (result.data) {
            return { completed: true, batchId: result.data.id };
        }
        return { completed: false };
    } catch (error) {
        // 테이블 없으면 false 반환 (첫 실행)
        console.warn('batch_runs table not found or error:', error);
        return { completed: false };
    }
}

// ===========================
// Insert/Update Batch Run Record
// ===========================

async function recordBatchStart(
    batchId: string,
    type: 'daily' | 'weekly',
    runDate: Date,
    symbolCount: number
): Promise<void> {
    try {
        await supabaseAdmin.from('batch_runs').insert({
            id: batchId,
            type,
            run_date: runDate.toISOString().split('T')[0],
            started_at: new Date(),
            status: 'running',
            symbol_count: symbolCount,
            succeeded_count: 0,
            failed_count: 0,
            alerts_sent: 0
        });
    } catch (error) {
        console.warn('Failed to record batch start:', error);
    }
}

async function recordBatchComplete(
    batchId: string,
    succeeded: number,
    failed: number,
    alertsSent: number
): Promise<void> {
    try {
        await supabaseAdmin
            .from('batch_runs')
            .update({
                status: 'completed',
                completed_at: new Date(),
                succeeded_count: succeeded,
                failed_count: failed,
                alerts_sent: alertsSent
            })
            .eq('id', batchId);
    } catch (error) {
        console.warn('Failed to record batch complete:', error);
    }
}

async function recordBatchFailed(
    batchId: string,
    error: string
): Promise<void> {
    try {
        await supabaseAdmin
            .from('batch_runs')
            .update({
                status: 'failed',
                completed_at: new Date(),
                error_message: error
            })
            .eq('id', batchId);
    } catch (error) {
        console.warn('Failed to record batch failure:', error);
    }
}

// ===========================
// Analyze Single Symbol (Crypto)
// ===========================

async function analyzeCryptoSymbol(
    symbol: string,
    logger: ReturnType<typeof createBatchLogger>
): Promise<AnalysisRecord> {
    const startTime = Date.now();

    try {
        logger.debug(`Starting analysis for ${symbol}`);

        // 1. Fetch market prices from Supabase
        const prices = await fetchCryptoMarketPrices(symbol, 288);  // Last 24 hours (5min * 288)

        if (!prices || prices.length < 50) {
            logger.warn(`Insufficient data for ${symbol}: ${prices?.length || 0} candles`);
            return {
                symbol,
                assetType: 'crypto',
                status: 'error',
                error: 'Insufficient market data',
                duration: Date.now() - startTime,
                timestamp: new Date()
            };
        }

        // 2. Generate signals from prices
        const candles = prices.map(p => ({
            time: p.time,
            open: p.open,
            high: p.high,
            low: p.low,
            close: p.close,
            volume: p.volume
        }));
        const { signals, adxValue, bbWidth } = generateSignals(candles);

        // 3. Run analysis
        const result = performAnalysis({
            symbol,
            timeframe: '1d',
            signals,
            adxValue,
            bbWidth,
            userTier: 'pro',  // Batch always runs with full data
            dataSource: 'supabase',
            sampleSize: signals.length
        });

        logger.debug(`✓ ${symbol} analyzed successfully (${Date.now() - startTime}ms)`);

        return {
            symbol,
            assetType: 'crypto',
            status: 'ok',
            result,
            duration: Date.now() - startTime,
            timestamp: new Date()
        };
    } catch (error: any) {
        logger.warn(`✗ ${symbol} analysis failed: ${error.message}`);
        return {
            symbol,
            assetType: 'crypto',
            status: 'error',
            error: error.message,
            duration: Date.now() - startTime,
            timestamp: new Date()
        };
    }
}

// ===========================
// Analyze Single Symbol (Stock)
// ===========================

async function analyzeStockSymbol(
    symbol: string,
    logger: ReturnType<typeof createBatchLogger>
): Promise<AnalysisRecord> {
    const startTime = Date.now();

    try {
        logger.debug(`Starting stock analysis for ${symbol}`);

        // 1. Fetch stock prices from Supabase
        const prices = await fetchStockPrices(symbol, 288);

        if (!prices || prices.length < 50) {
            logger.warn(`Insufficient stock data for ${symbol}: ${prices?.length || 0} candles`);
            return {
                symbol,
                assetType: 'stock',
                status: 'error',
                error: 'Insufficient stock data',
                duration: Date.now() - startTime,
                timestamp: new Date()
            };
        }

        // 2. Generate signals from prices
        const candles = prices.map(p => ({
            time: p.time,
            open: p.open,
            high: p.high,
            low: p.low,
            close: p.close,
            volume: p.volume
        }));
        const { signals, adxValue, bbWidth } = generateSignals(candles);

        // 3. Run analysis
        const result = analyzeStock({
            symbol,
            period: '1d',
            signals,
            adxValue,
            bbWidth,
            userTier: 'pro',
            dataSource: 'supabase',
            sampleSize: signals.length
        });

        logger.debug(`✓ ${symbol} stock analyzed successfully (${Date.now() - startTime}ms)`);

        return {
            symbol,
            assetType: 'stock',
            status: 'ok',
            result,
            duration: Date.now() - startTime,
            timestamp: new Date()
        };
    } catch (error: any) {
        logger.warn(`✗ ${symbol} stock analysis failed: ${error.message}`);
        return {
            symbol,
            assetType: 'stock',
            status: 'error',
            error: error.message,
            duration: Date.now() - startTime,
            timestamp: new Date()
        };
    }
}

// ===========================
// Main Batch Analysis Function
// ===========================

export async function runBatchAnalysis(
    options: BatchOptions = { type: 'daily' }
): Promise<BatchResult> {
    const batchId = generateBatchId();
    const logger = createBatchLogger(batchId);
    const runDate = options.runDate || new Date();

    const startTime = Date.now();

    try {
        logger.info(`[START] Batch ${options.type || 'daily'} analysis started`);
        logger.info(`Batch ID: ${batchId}`);

        // ===== Step 1: Check if Already Completed (Idempotent) =====
        if (!options.force) {
            const { completed, batchId: existingId } = await checkIfCompleted(
                options.type || 'daily',
                runDate
            );

            if (completed) {
                logger.info(
                    `[SKIP] Batch already completed on ${runDate.toISOString()}. ` +
                    `Use force=true to re-run.`
                );
                return {
                    batchId: existingId!,
                    type: options.type || 'daily',
                    startedAt: runDate,
                    completedAt: runDate,
                    duration: 0,
                    status: 'skipped',
                    symbolCount: 0,
                    succeededCount: 0,
                    failedCount: 0,
                    results: [],
                    logs: []
                };
            }
        }

        // ===== Step 2: Get Symbols to Analyze =====
        let symbols = options.symbols || [
            // Default crypto symbols
            'BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'AVAX', 'DOGE', 'DOT'
        ];

        logger.info(`Symbols: ${symbols.join(', ')} (${symbols.length} total)`);

        // ===== Step 3: Record Batch Start =====
        await recordBatchStart(batchId, options.type || 'daily', runDate, symbols.length);

        // ===== Step 4: Analyze Each Symbol (Fault Isolation) =====
        const results: AnalysisRecord[] = [];

        for (const symbol of symbols) {
            try {
                // Try to analyze as crypto first
                const result = await analyzeCryptoSymbol(symbol, logger);
                results.push(result);

                // If crypto analysis fails and it's a known stock, try stock
                if (result.status === 'error' && ['AAPL', 'GOOGL', 'MSFT'].includes(symbol)) {
                    logger.info(`Retrying ${symbol} as stock`);
                    const stockResult = await analyzeStockSymbol(symbol, logger);
                    results[results.length - 1] = stockResult;
                }
            } catch (error) {
                logger.error(`Unexpected error analyzing ${symbol}: ${error}`);
                results.push({
                    symbol,
                    assetType: 'crypto',
                    status: 'error',
                    error: `Unexpected error: ${error}`,
                    duration: 0,
                    timestamp: new Date()
                });
            }
        }

        // ===== Step 5: Record Results =====
        const succeeded = results.filter(r => r.status === 'ok').length;
        const failed = results.filter(r => r.status === 'error').length;

        logger.info(`Analysis Summary: ${succeeded} succeeded, ${failed} failed`);

        // Save results to database
        for (const record of results) {
            if (record.status === 'ok') {
                try {
                    await supabaseAdmin.from('batch_analysis_results').insert({
                        batch_id: batchId,
                        symbol: record.symbol,
                        asset_type: record.assetType,
                        result: record.result,
                        analyzed_at: record.timestamp
                    });
                } catch (error) {
                    logger.warn(`Failed to save result for ${record.symbol}: ${error}`);
                }
            }
        }

        // ===== Step 6: Record Batch Complete =====
        await recordBatchComplete(batchId, succeeded, failed, 0);

        const duration = Date.now() - startTime;
        logger.info(`[COMPLETE] Batch analysis finished in ${duration}ms`);

        return {
            batchId,
            type: options.type || 'daily',
            startedAt: new Date(startTime),
            completedAt: new Date(),
            duration,
            status: 'completed',
            symbolCount: symbols.length,
            succeededCount: succeeded,
            failedCount: failed,
            results,
            logs: []  // In production, load from log file
        };
    } catch (error: any) {
        logger.error(`[FATAL] Unexpected error: ${error.message}`);
        logger.error(error.stack);

        await recordBatchFailed(batchId, error.message);

        const duration = Date.now() - startTime;
        return {
            batchId,
            type: options.type || 'daily',
            startedAt: new Date(startTime),
            completedAt: new Date(),
            duration,
            status: 'failed',
            symbolCount: 0,
            succeededCount: 0,
            failedCount: 0,
            results: [],
            logs: []
        };
    }
}

// ===========================
// Daily Batch Wrapper
// ===========================

export async function runDailyBatch(force: boolean = false): Promise<BatchResult> {
    return runBatchAnalysis({
        type: 'daily',
        force
    });
}

// ===========================
// Weekly Batch Wrapper
// ===========================

export async function runWeeklyBatch(force: boolean = false): Promise<BatchResult> {
    return runBatchAnalysis({
        type: 'weekly',
        force
    });
}
