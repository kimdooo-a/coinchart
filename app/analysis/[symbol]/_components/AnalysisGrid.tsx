'use client'

// 분석 결과 그리드 (uiState 분기: loading / error / insufficient / ok·pro-locked)
// page.tsx에서 route-local로 분리 (마크업·시각·분기 조건 불변)

import type { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { AnalysisResult } from '@/lib/analysis/orchestrator'
import type { FractalAnalysisResult } from '@/lib/fractal_engine'
import type { Language, Translation, Candle } from '../_lib/types'
import { ProbabilityConfidenceCards } from './ProbabilityConfidenceCards'
import { ExplanationCard } from './ExplanationCard'
import { BacktestCard } from './BacktestCard'
import { PositionStatusCard } from './PositionStatusCard'
import { FractalCard } from './FractalCard'

type Router = ReturnType<typeof useRouter>

interface AnalysisGridProps {
    loading: boolean
    analysisResult: AnalysisResult | null
    error: string | null
    lang: Language
    t: Translation
    userTier: 'free' | 'pro'
    avgPrice: number | undefined
    historyData: Candle[]
    fractalResult: FractalAnalysisResult | null
    router: Router
}

export function AnalysisGrid({
    loading,
    analysisResult,
    error,
    lang,
    t,
    userTier,
    avgPrice,
    historyData,
    fractalResult,
    router,
}: AnalysisGridProps) {
    if (historyData.length === 0) return null

    return (
        <section className="space-y-6">

            {/* === uiState: loading === */}
            {loading && !analysisResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="bg-surface-container-lowest border-outline-variant opacity-50 relative">
                            <CardHeader>
                                <div className="h-6 bg-surface-container rounded animate-pulse" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="h-12 bg-surface-container rounded animate-pulse" />
                                    <div className="h-4 bg-surface-container rounded animate-pulse w-2/3" />
                                </div>
                            </CardContent>
                            <Badge variant="secondary" className="absolute top-4 right-4">
                                {lang === 'ko' ? '분석 중...' : 'Analyzing...'}
                            </Badge>
                        </Card>
                    ))}
                </div>
            )}

            {/* === uiState: error === */}
            {error && (
                <Card className="bg-surface-container-lowest border-red-800">
                    <CardHeader>
                        <Badge variant="destructive">{lang === 'ko' ? '오류 발생' : 'Error'}</Badge>
                    </CardHeader>
                    <CardContent>
                        <p className="text-on-surface-variant">{error}</p>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            {lang === 'ko' ? '다시 시도' : 'Retry'}
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* === uiState: insufficient === */}
            {!error && analysisResult && analysisResult.uiState === 'insufficient' && (
                <Card className="bg-surface-container-lowest border-orange-800">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">{lang === 'ko' ? '데이터 부족' : 'Insufficient Data'}</CardTitle>
                        <Badge variant="destructive">{lang === 'ko' ? '분석 불가' : 'Cannot Analyze'}</Badge>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="mb-4">
                            {lang === 'ko'
                                ? '분석을 수행하려면 최소 3개 이상의 지표 신호가 필요합니다.'
                                : 'At least 3 indicator signals are required for analysis.'}
                        </CardDescription>
                        {analysisResult.reasons && analysisResult.reasons.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-orange-400">{lang === 'ko' ? '상세 사유' : 'Details'}</Label>
                                <ul className="text-sm text-on-surface-variant space-y-1">
                                    {analysisResult.reasons.map((reason, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <span className="text-orange-400">•</span>
                                            <span>{reason}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" onClick={() => router.push('/analysis')}>
                            {lang === 'ko' ? '다른 심볼 선택' : 'Choose Another Symbol'}
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* === uiState: ok or pro-locked === */}
            {!error && analysisResult && (analysisResult.uiState === 'ok' || analysisResult.uiState === 'pro-locked') && (
                <>
                    {/* Probability & Confidence Row */}
                    <ProbabilityConfidenceCards analysisResult={analysisResult} lang={lang} />

                    {/* Explanation Card - 3 Column Grid */}
                    <ExplanationCard analysisResult={analysisResult} lang={lang} />

                    {/* Backtest Card (PRO Gate) */}
                    {analysisResult.backtest && (
                        <BacktestCard analysisResult={analysisResult} lang={lang} userTier={userTier} />
                    )}

                    {/* Position Status Card */}
                    <PositionStatusCard avgPrice={avgPrice} historyData={historyData} t={t} />

                    {/* Fractal Engine Card (BETA) */}
                    <FractalCard fractalResult={fractalResult} t={t} />
                </>
            )}
        </section>
    )
}
