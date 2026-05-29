'use client'

// 프랙탈 엔진 카드 (BETA — 유사도 + 예측 포지션)
// page.tsx에서 route-local로 분리 (마크업·시각 불변)

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import type { FractalAnalysisResult } from '@/lib/fractal_engine'
import type { Translation } from '../_lib/types'

interface FractalCardProps {
    fractalResult: FractalAnalysisResult | null
    t: Translation
}

export function FractalCard({ fractalResult, t }: FractalCardProps) {
    return (
        <Card className="bg-surface-container-lowest border-indigo-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    {t.analysis.fractalTitle}
                </CardTitle>
                <Badge variant="secondary" className="bg-indigo-500 text-white">
                    BETA
                </Badge>
            </CardHeader>
            <CardContent>
                {fractalResult ? (
                    <div className="flex justify-between items-end">
                        <div>
                            <Label className="text-on-surface-variant">{t.analysis.similarity}</Label>
                            <div className="text-on-surface font-bold text-2xl">
                                {fractalResult.bestMatches.length > 0
                                    ? `${fractalResult.bestMatches[0].similarity.toFixed(0)}%`
                                    : 'None'}
                            </div>
                        </div>
                        <div className="text-right">
                            <Label className="text-on-surface-variant">{t.analysis.prediction}</Label>
                            <div className={`text-2xl font-black ${
                                fractalResult.recommendedPosition === 'BUY' ? 'text-green-400' :
                                fractalResult.recommendedPosition === 'SELL' ? 'text-red-400' : 'text-on-surface-variant'
                            }`}>
                                {fractalResult.recommendedPosition}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                        <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        {t.analysis.analyzing}
                    </div>
                )}
                <CardDescription className="mt-4 text-xs text-indigo-300 bg-indigo-900/30 p-2 rounded">
                    {t.analysis.fractalDesc}
                </CardDescription>
            </CardContent>
        </Card>
    )
}
