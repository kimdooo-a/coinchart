'use client'

// 백테스트 결과 카드 (PRO 게이트 / 데이터 부족 / 전체 지표)
// page.tsx에서 route-local로 분리 (마크업·시각·게이트 로직 불변)
// ⚠️ analysisResult.backtest 존재 가드는 호출부(AnalysisGrid)에서 수행 — 원본 동작 보존

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { AnalysisResult } from '@/lib/analysis/orchestrator'
import type { Language } from '../_lib/types'

interface BacktestCardProps {
    analysisResult: AnalysisResult
    lang: Language
    userTier: 'free' | 'pro'
}

export function BacktestCard({ analysisResult, lang, userTier }: BacktestCardProps) {
    return (
        <Card className="bg-surface-container-lowest border-outline-variant relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">
                    {lang === 'ko' ? '백테스트 결과' : 'Backtest Results'}
                </CardTitle>
                {userTier === 'free' && (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                        PRO
                    </Badge>
                )}
            </CardHeader>

            {analysisResult.backtest.status === 'insufficient' ? (
                <CardContent>
                    <div className="text-center py-4">
                        <Badge variant="destructive" className="mb-2">
                            {lang === 'ko' ? '데이터 부족' : 'Insufficient Data'}
                        </Badge>
                        <p className="text-on-surface-variant text-sm">
                            {lang === 'ko' ? '최소 30개 거래가 필요합니다.' : 'Minimum 30 trades required.'}
                        </p>
                    </div>
                </CardContent>
            ) : userTier === 'free' ? (
                <>
                    <CardContent className="blur-sm pointer-events-none">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <Label className="text-on-surface-variant">{lang === 'ko' ? '승률' : 'Win Rate'}</Label>
                                <div className="text-2xl font-bold text-on-surface">--.--%</div>
                            </div>
                            <div>
                                <Label className="text-on-surface-variant">{lang === 'ko' ? '손익비' : 'Profit Factor'}</Label>
                                <div className="text-2xl font-bold text-on-surface">--.--</div>
                            </div>
                            <div>
                                <Label className="text-on-surface-variant">{lang === 'ko' ? '최대 낙폭' : 'Max DD'}</Label>
                                <div className="text-2xl font-bold text-on-surface">--.--%</div>
                            </div>
                            <div>
                                <Label className="text-on-surface-variant">{lang === 'ko' ? 'Sharpe' : 'Sharpe Ratio'}</Label>
                                <div className="text-2xl font-bold text-on-surface">--.--</div>
                            </div>
                        </div>
                    </CardContent>
                    {/* Pro Lock Overlay */}
                    <div className="absolute inset-0 bg-on-surface/40 flex flex-col items-center justify-center gap-4">
                        <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                            PRO
                        </Badge>
                        <Link href="/pricing">
                            <Button variant="glow">
                                {lang === 'ko' ? '프리미엄으로 전체 보기' : 'Unlock with Premium'}
                            </Button>
                        </Link>
                        <Label className="text-on-surface-variant text-xs">
                            {lang === 'ko' ? '이 기능은 프리미엄 전용입니다' : 'This feature is Premium only'}
                        </Label>
                    </div>
                </>
            ) : (
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <Label className="text-on-surface-variant">{lang === 'ko' ? '승률' : 'Win Rate'}</Label>
                            <div className="text-2xl font-bold text-on-surface">
                                {analysisResult.backtest.winRate >= 999 ? 'N/A' : `${analysisResult.backtest.winRate.toFixed(1)}%`}
                            </div>
                        </div>
                        <div>
                            <Label className="text-on-surface-variant">{lang === 'ko' ? '손익비' : 'Profit Factor'}</Label>
                            <div className="text-2xl font-bold text-on-surface">
                                {analysisResult.backtest.profitFactor >= 999 ? 'N/A' : analysisResult.backtest.profitFactor.toFixed(2)}
                            </div>
                        </div>
                        <div>
                            <Label className="text-on-surface-variant">{lang === 'ko' ? '최대 낙폭' : 'Max DD'}</Label>
                            <div className="text-2xl font-bold text-on-surface">
                                {analysisResult.backtest.maxDrawdownPercent.toFixed(1)}%
                            </div>
                        </div>
                        <div>
                            <Label className="text-on-surface-variant">{lang === 'ko' ? 'Sharpe' : 'Sharpe Ratio'}</Label>
                            <div className="text-2xl font-bold text-on-surface">
                                {analysisResult.backtest.sharpeRatio.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    )
}
