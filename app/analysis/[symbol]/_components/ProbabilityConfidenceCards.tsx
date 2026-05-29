'use client'

// 상승 확률 + 신뢰도 등급 카드 (2열 그리드)
// page.tsx에서 route-local로 분리 (마크업·시각 불변)

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { AnalysisResult } from '@/lib/analysis/orchestrator'
import type { Language } from '../_lib/types'
import { getProbabilityBadgeVariant, getConfidenceBadgeVariant } from '../_lib/badge-variants'

interface ProbabilityConfidenceCardsProps {
    analysisResult: AnalysisResult
    lang: Language
}

export function ProbabilityConfidenceCards({ analysisResult, lang }: ProbabilityConfidenceCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Probability Card */}
            <Card className="bg-surface-container-lowest border-outline-variant">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">
                        {lang === 'ko' ? '상승 확률' : 'Rise Probability'}
                    </CardTitle>
                    <Badge variant={getProbabilityBadgeVariant(analysisResult.probability.probability)}>
                        {analysisResult.probability.direction === 'UP' ? '↑ UP' :
                         analysisResult.probability.direction === 'DOWN' ? '↓ DOWN' : '↔ SIDEWAYS'}
                    </Badge>
                </CardHeader>
                <CardContent>
                    <div className={`text-5xl font-black ${
                        analysisResult.probability.probability >= 60 ? 'text-green-400' :
                        analysisResult.probability.probability <= 40 ? 'text-red-400' : 'text-on-surface-variant'
                    }`}>
                        {analysisResult.probability.probability}%
                    </div>
                    <CardDescription className="mt-2">
                        Regime: {analysisResult.probability.regime}
                    </CardDescription>
                </CardContent>
            </Card>

            {/* Confidence Card */}
            <Card className="bg-surface-container-lowest border-outline-variant">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">
                        {lang === 'ko' ? '신뢰도 등급' : 'Confidence Grade'}
                    </CardTitle>
                    <Badge variant={getConfidenceBadgeVariant(analysisResult.confidence.grade)}>
                        Grade {analysisResult.confidence.grade}
                    </Badge>
                </CardHeader>
                <CardContent>
                    <div className={`text-5xl font-black ${
                        analysisResult.confidence.grade === 'A' ? 'text-green-400' :
                        analysisResult.confidence.grade === 'B' ? 'text-blue-400' :
                        analysisResult.confidence.grade === 'C' ? 'text-yellow-400' :
                        analysisResult.confidence.grade === 'D' ? 'text-orange-400' : 'text-red-400'
                    }`}>
                        {analysisResult.confidence.grade}
                    </div>
                    <CardDescription className="mt-2">
                        Score: {analysisResult.confidence.score}/100 |
                        {lang === 'ko' ? ' 레벨' : ' Level'}: {analysisResult.confidence.level || 'N/A'}
                    </CardDescription>
                </CardContent>
            </Card>
        </div>
    )
}
