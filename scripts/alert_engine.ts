/**
 * alert_engine.ts
 * 
 * 조건 기반 알림 시스템
 * - Alert Conditions 정의
 * - State Change 감지 기반 알림
 * - 중복 알림 방지 (24시간 윈도우)
 */

import { AnalysisRecord } from './batch_analysis';
import { createLogger } from '../lib/logger';
import { supabaseAdmin } from '../lib/supabaseAdmin';

export interface Alert {
    id: string;
    name: string;
    symbol: string;
    type: 'state_change' | 'metric_threshold' | 'comparison';
    condition: (current: any, previous?: any) => boolean;
    message: (current: any, previous?: any) => string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface AlertResult {
    symbol: string;
    alertId: string;
    triggered: boolean;
    message?: string;
    priority?: string;
}

export interface AlertProcessResult {
    sent: number;
    failed: number;
    skipped: number;
    results: Array<{
        symbol: string;
        alertId: string;
        status: 'sent' | 'failed' | 'skipped';
        message?: string;
        reason?: string;
    }>;
}

// ===========================
// Alert Conditions Definition
// ===========================

const alertConditions: Alert[] = [
    {
        id: 'probability_spike',
        name: '확률 급변',
        symbol: '*',
        type: 'state_change',
        condition: (current, previous) => {
            if (!previous) return false;
            const probChange = Math.abs(
                current.probability?.probability - previous.probability?.probability
            );
            return probChange > 30;  // > 30% change
        },
        message: (current, previous) => {
            const from = previous.probability?.probability || '?';
            const to = current.probability?.probability || '?';
            return `📊 확률 급변: ${from}% → ${to}%`;
        },
        priority: 'HIGH'
    },

    {
        id: 'confidence_upgrade',
        name: '신뢰도 상향',
        symbol: '*',
        type: 'state_change',
        condition: (current, previous) => {
            if (!previous) return false;
            const gradeMap = { F: 0, D: 1, C: 2, B: 3, A: 4, AA: 5 };
            const prevGrade = gradeMap[previous.confidence?.grade as keyof typeof gradeMap] ?? 0;
            const currGrade = gradeMap[current.confidence?.grade as keyof typeof gradeMap] ?? 0;
            // 2단계 이상 상향
            return currGrade >= prevGrade + 2;
        },
        message: (current, previous) => {
            return `⬆️ 신뢰도 상향: ${previous.confidence?.grade} → ${current.confidence?.grade}`;
        },
        priority: 'CRITICAL'
    },

    {
        id: 'confidence_downgrade',
        name: '신뢰도 하향',
        symbol: '*',
        type: 'state_change',
        condition: (current, previous) => {
            if (!previous) return false;
            const gradeMap = { F: 0, D: 1, C: 2, B: 3, A: 4, AA: 5 };
            const prevGrade = gradeMap[previous.confidence?.grade as keyof typeof gradeMap] ?? 0;
            const currGrade = gradeMap[current.confidence?.grade as keyof typeof gradeMap] ?? 0;
            // 1단계 이상 하향
            return currGrade < prevGrade && prevGrade >= 3;  // Only if was A or higher
        },
        message: (current, previous) => {
            return `⬇️ 신뢰도 하향: ${previous.confidence?.grade} → ${current.confidence?.grade}`;
        },
        priority: 'HIGH'
    },

    {
        id: 'signal_spike',
        name: '신호 급증',
        symbol: '*',
        type: 'metric_threshold',
        condition: (current, previous) => {
            if (!previous) return false;
            const prevSignals = previous.signals?.length || 0;
            const currSignals = current.signals?.length || 0;
            // 신호 2배 이상 증가 && 최소 3개 이상
            return currSignals >= prevSignals * 2 && currSignals >= 3;
        },
        message: (current, previous) => {
            return `📈 신호 급증: ${previous.signals?.length || 0} → ${current.signals?.length || 0}개`;
        },
        priority: 'HIGH'
    },

    {
        id: 'signal_disappear',
        name: '신호 소실',
        symbol: '*',
        type: 'metric_threshold',
        condition: (current, previous) => {
            if (!previous) return false;
            const prevSignals = previous.signals?.length || 0;
            const currSignals = current.signals?.length || 0;
            // 신호가 여러 개 있었는데 갑자기 0
            return prevSignals >= 2 && currSignals === 0;
        },
        message: (current, previous) => {
            return `⚠️ 신호 소실: ${previous.signals?.length || 0}개 → 0개`;
        },
        priority: 'MEDIUM'
    },

    {
        id: 'trend_reversal',
        name: '추세 반전',
        symbol: '*',
        type: 'comparison',
        condition: (current, previous) => {
            if (!previous) return false;
            // Simple trend detection based on probability
            const prevTrend = previous.probability?.probability > 50 ? 'up' : 'down';
            const currTrend = current.probability?.probability > 50 ? 'up' : 'down';
            return prevTrend !== currTrend;
        },
        message: (current, previous) => {
            const from = previous.probability?.probability > 50 ? '상승' : '하락';
            const to = current.probability?.probability > 50 ? '상승' : '하락';
            return `🔄 추세 반전: ${from} → ${to}`;
        },
        priority: 'HIGH'
    }
];

// ===========================
// Alert Engine Class
// ===========================

export class AlertEngine {
    private logger = createLogger('alert_engine.log');

    /**
     * Check if alert should be sent (duplicate prevention)
     */
    private async shouldSendAlert(
        symbol: string,
        alertId: string
    ): Promise<{ should: boolean; reason?: string }> {
        try {
            // 최근 24시간 이내 발송된 동일 알림 확인
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const result = await supabaseAdmin
                .from('alert_history')
                .select('*')
                .eq('symbol', symbol)
                .eq('alert_id', alertId)
                .gte('triggered_at', twentyFourHoursAgo.toISOString())
                .in('status', ['sent', 'pending'])
                .single();

            if (result.data) {
                const minutesAgo = Math.floor(
                    (Date.now() - new Date(result.data.sent_at).getTime()) / (60 * 1000)
                );
                return {
                    should: false,
                    reason: `Already sent ${minutesAgo}min ago`
                };
            }

            return { should: true };
        } catch (error: any) {
            // If table doesn't exist, allow send
            if (error.code === 'PGRST116') {
                return { should: true };
            }
            this.logger.warn(`Error checking alert history: ${error.message}`);
            return { should: true };  // Fail-open: send if unsure
        }
    }

    /**
     * Record alert in database
     */
    private async recordAlert(
        batchId: string,
        symbol: string,
        alertId: string,
        priority: string,
        message: string,
        status: 'sent' | 'failed' | 'skipped',
        reason?: string
    ): Promise<void> {
        try {
            await supabaseAdmin.from('alert_history').insert({
                id: `alert_${Date.now()}_${Math.random()}`,
                batch_id: batchId,
                symbol,
                alert_id: alertId,
                priority,
                triggered_at: new Date(),
                message,
                sent_at: status === 'sent' ? new Date() : null,
                status,
                reason: reason || null
            });
        } catch (error: any) {
            this.logger.warn(`Failed to record alert: ${error.message}`);
        }
    }

    /**
     * Send alert to channels (stub - implement as needed)
     */
    private async sendAlert(
        symbol: string,
        priority: string,
        message: string
    ): Promise<void> {
        // TODO: Implement actual alert sending
        // - Discord webhook
        // - Email notification
        // - Internal notification
        console.log(`[ALERT] [${priority}] ${symbol}: ${message}`);
    }

    /**
     * Evaluate all conditions for a symbol
     */
    private evaluateConditions(
        current: any,
        previous: any,
        symbol: string
    ): AlertResult[] {
        const results: AlertResult[] = [];

        for (const condition of alertConditions) {
            // Check if this condition applies to this symbol
            if (condition.symbol !== '*' && condition.symbol !== symbol) {
                continue;
            }

            try {
                const triggered = condition.condition(current, previous);
                if (triggered) {
                    const message = condition.message(current, previous);
                    results.push({
                        symbol,
                        alertId: condition.id,
                        triggered: true,
                        message,
                        priority: condition.priority
                    });
                }
            } catch (error: any) {
                this.logger.warn(
                    `Error evaluating condition ${condition.id} for ${symbol}: ${error.message}`
                );
            }
        }

        return results;
    }

    /**
     * Process alerts for batch results
     */
    async processAlerts(
        batchId: string,
        results: AnalysisRecord[]
    ): Promise<AlertProcessResult> {
        this.logger.info(`[START] Processing alerts for batch ${batchId}`);

        const processResult: AlertProcessResult = {
            sent: 0,
            failed: 0,
            skipped: 0,
            results: []
        };

        // TODO: Load previous results for comparison
        // For now, only evaluate current state

        for (const record of results) {
            if (record.status !== 'ok' || !record.result) {
                continue;
            }

            // Evaluate conditions
            const alerts = this.evaluateConditions(record.result, null, record.symbol);

            // Process each triggered alert
            for (const alert of alerts) {
                try {
                    // Check if should send (duplicate prevention)
                    const { should, reason } = await this.shouldSendAlert(
                        record.symbol,
                        alert.alertId
                    );

                    if (!should) {
                        this.logger.debug(
                            `[SKIP] ${record.symbol} ${alert.alertId}: ${reason}`
                        );
                        processResult.skipped++;
                        await this.recordAlert(
                            batchId,
                            record.symbol,
                            alert.alertId,
                            alert.priority!,
                            alert.message!,
                            'skipped',
                            reason
                        );
                        continue;
                    }

                    // Send alert
                    await this.sendAlert(record.symbol, alert.priority!, alert.message!);
                    this.logger.info(
                        `[SENT] ${record.symbol} ${alert.alertId}: ${alert.message}`
                    );

                    processResult.sent++;
                    await this.recordAlert(
                        batchId,
                        record.symbol,
                        alert.alertId,
                        alert.priority!,
                        alert.message!,
                        'sent'
                    );

                    processResult.results.push({
                        symbol: record.symbol,
                        alertId: alert.alertId,
                        status: 'sent',
                        message: alert.message
                    });
                } catch (error: any) {
                    this.logger.error(
                        `[FAIL] ${record.symbol} ${alert.alertId}: ${error.message}`
                    );
                    processResult.failed++;
                    await this.recordAlert(
                        batchId,
                        record.symbol,
                        alert.alertId,
                        alert.priority!,
                        alert.message!,
                        'failed',
                        error.message
                    );

                    processResult.results.push({
                        symbol: record.symbol,
                        alertId: alert.alertId,
                        status: 'failed',
                        reason: error.message
                    });
                }
            }
        }

        this.logger.info(
            `[COMPLETE] Alerts processed: sent=${processResult.sent}, ` +
            `failed=${processResult.failed}, skipped=${processResult.skipped}`
        );

        return processResult;
    }
}

/**
 * Convenience function
 */
export async function processAlertsForBatch(
    batchId: string,
    results: AnalysisRecord[]
): Promise<AlertProcessResult> {
    const engine = new AlertEngine();
    return engine.processAlerts(batchId, results);
}
