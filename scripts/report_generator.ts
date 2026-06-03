/**
 * report_generator.ts
 * 
 * 배치 분석 결과를 기반으로 Daily/Weekly 리포트 생성
 * - State Change 감지 (상태 변화)
 * - 주요 지표 추출
 * - Markdown 포맷 생성
 */

import { AnalysisRecord } from './batch_analysis';
import { createLogger } from '../lib/logger';

export interface ReportOptions {
    type: 'daily' | 'weekly';
    batchId: string;
    results: AnalysisRecord[];
    startDate: Date;
    endDate: Date;
    format?: 'markdown' | 'json';
}

export interface StateChange {
    symbol: string;
    metric: string;
    // 지표 값(레짐 문자열 또는 수치)이므로 문자열·숫자 공용 타입
    from: string | number;
    to: string | number;
    percentage: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ReportMetrics {
    totalSymbols: number;
    analyzedSuccessfully: number;
    failedAnalysis: number;
    averageProbability: number;
    signalSummary: {
        buySignals: number;
        sellSignals: number;
        neutralSignals: number;
    };
    gradeDistribution: Record<string, number>;
    stateChanges: StateChange[];
}

export class ReportGenerator {
    private logger = createLogger('report_generator.log');

    /**
     * Generate report from batch analysis results
     */
    async generateReport(options: ReportOptions): Promise<string> {
        this.logger.info(`[START] Generating ${options.type} report (Batch: ${options.batchId})`);

        try {
            // 1. Calculate metrics
            const metrics = this.calculateMetrics(options.results);

            // 2. Format output
            if (options.format === 'json') {
                return JSON.stringify({
                    batchId: options.batchId,
                    type: options.type,
                    generatedAt: new Date(),
                    period: {
                        start: options.startDate,
                        end: options.endDate
                    },
                    metrics,
                    results: options.results
                }, null, 2);
            }

            // Default: Markdown
            return this.formatMarkdown(options, metrics);
        } catch (error: unknown) {
            this.logger.error(`Failed to generate report: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Calculate metrics from analysis results
     */
    private calculateMetrics(results: AnalysisRecord[]): ReportMetrics {
        const successful = results.filter(r => r.status === 'ok');
        const failed = results.filter(r => r.status === 'error');

        const probabilities: number[] = [];
        let buySignals = 0;
        let sellSignals = 0;
        const gradeDistribution: Record<string, number> = {};
        const stateChanges: StateChange[] = [];

        // Process each result
        for (const record of successful) {
            const result = record.result;

            if (!result) continue;

            // Collect probability
            if (result.probability?.probability) {
                probabilities.push(result.probability.probability);
            }

            // Count signals
            // signals는 result 최상위가 아니라 ProbabilityResult 내부(result.probability.signals)에 위치.
            // IndicatorSignal.signal 필드는 'BUY' | 'SELL' | 'NEUTRAL'(대문자) 열거값이다.
            if (result.probability?.signals) {
                for (const signal of result.probability.signals) {
                    if (signal.signal === 'BUY') buySignals++;
                    else if (signal.signal === 'SELL') sellSignals++;
                }
            }

            // Grade distribution
            if (result.confidence?.grade) {
                const grade = result.confidence.grade;
                gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
            }
        }

        const averageProbability =
            probabilities.length > 0
                ? probabilities.reduce((a, b) => a + b, 0) / probabilities.length
                : 0;

        return {
            totalSymbols: results.length,
            analyzedSuccessfully: successful.length,
            failedAnalysis: failed.length,
            averageProbability: Math.round(averageProbability * 10) / 10,
            signalSummary: {
                buySignals,
                sellSignals,
                neutralSignals: successful.length - (buySignals + sellSignals)
            },
            gradeDistribution,
            stateChanges
        };
    }

    /**
     * Format report as Markdown
     */
    private formatMarkdown(options: ReportOptions, metrics: ReportMetrics): string {
        const dateStr = options.startDate.toISOString().split('T')[0];
        const title =
            options.type === 'daily'
                ? `Daily Market Report - ${dateStr}`
                : `Weekly Market Summary - Week ${this.getWeekNumber(options.startDate)}`;

        let md = `# ${title}\n\n`;

        // 📊 Market Overview
        md += `## 📊 시장 개요\n\n`;
        md += `- **분석 대상**: ${metrics.totalSymbols}개 자산\n`;
        md += `- **성공**: ${metrics.analyzedSuccessfully}개\n`;
        md += `- **실패**: ${metrics.failedAnalysis}개\n`;
        md += `- **기간**: ${options.startDate.toISOString().split('T')[0]} ~ ${options.endDate.toISOString().split('T')[0]}\n`;
        md += `- **평균 확률**: ${metrics.averageProbability}%\n\n`;

        // 🎯 Signal Summary
        md += `## 🎯 신호 요약\n\n`;
        md += `- **매수 신호**: ${metrics.signalSummary.buySignals}개\n`;
        md += `- **매도 신호**: ${metrics.signalSummary.sellSignals}개\n`;
        md += `- **중립**: ${metrics.signalSummary.neutralSignals}개\n\n`;

        // 💾 Grade Distribution
        if (Object.keys(metrics.gradeDistribution).length > 0) {
            md += `## 📈 신뢰도 분포\n\n`;
            for (const [grade, count] of Object.entries(metrics.gradeDistribution)) {
                md += `- **${grade}**: ${count}개\n`;
            }
            md += `\n`;
        }

        // 📋 Detailed Results
        md += `## 📋 상세 결과\n\n`;
        md += `| 자산 | 상태 | 확률 | 신호 | 신뢰도 |\n`;
        md += `|------|------|------|------|--------|\n`;

        for (const record of options.results) {
            if (record.status === 'ok' && record.result) {
                const r = record.result;
                const probability = r.probability?.probability || 'N/A';
                const signals = r.probability?.signals?.length || 0;
                const grade = r.confidence?.grade || 'N/A';

                md += `| ${record.symbol} | ✅ | ${probability}% | ${signals} | ${grade} |\n`;
            } else {
                md += `| ${record.symbol} | ❌ | - | - | - |\n`;
            }
        }

        md += `\n`;

        // ⏱️ Execution Info
        md += `## ⏱️ 실행 정보\n\n`;
        md += `- **Batch ID**: ${options.batchId}\n`;
        md += `- **생성 시간**: ${new Date().toISOString()}\n`;
        md += `- **리포트 타입**: ${options.type === 'daily' ? '일간' : '주간'}\n\n`;

        return md;
    }

    /**
     * Get week number from date
     */
    private getWeekNumber(date: Date): number {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    }
}

/**
 * Convenience function
 */
export async function generateBatchReport(options: ReportOptions): Promise<string> {
    const generator = new ReportGenerator();
    return generator.generateReport(options);
}
