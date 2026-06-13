'use client'

import React from 'react'
import { FractalAnalysisResult } from '@/lib/fractal_engine'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

interface PositionFractalCardsProps {
    avgPrice: number | undefined
    historyData: any[]
    fractalResult: FractalAnalysisResult | null
    t: any
    lang: 'ko' | 'en'
}

export function PositionFractalCards({ avgPrice, historyData, fractalResult, t, lang }: PositionFractalCardsProps) {
    const lastClose = historyData[historyData.length - 1]?.close

    return (
        <>
            {/* Position Status Card */}
            <Card className="bg-surface-container-lowest border-outline-variant">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">
                        {t.analysis.positionStatus}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {avgPrice ? (
                        <div className="flex items-center gap-4">
                            <div className={`text-3xl font-black ${
                                lastClose > avgPrice ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {((lastClose - avgPrice) / avgPrice * 100).toFixed(2)}%
                            </div>
                            <Badge variant={lastClose > avgPrice ? 'default' : 'destructive'}>
                                {lastClose > avgPrice ? 'PROFIT' : 'LOSS'}
                            </Badge>
                            <p className="text-on-surface text-sm">
                                {lastClose > avgPrice
                                    ? t.analysis.profitMsg
                                    : t.analysis.lossMsg
                                }
                            </p>
                        </div>
                    ) : (
                        <p className="text-on-surface-variant">{t.analysis.noTradeMsg}</p>
                    )}
                </CardContent>
            </Card>

            {/* Fractal Engine Card (BETA) */}
            <Card className="bg-surface-container-lowest border-indigo-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-medium text-indigo-600 uppercase tracking-wider flex items-center gap-2">
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
                                    fractalResult.recommendedPosition === 'BUY' ? 'text-green-600' :
                                    fractalResult.recommendedPosition === 'SELL' ? 'text-red-600' : 'text-on-surface-variant'
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
                    <CardDescription className="mt-4 text-xs text-indigo-700 bg-indigo-50 p-2 rounded">
                        {t.analysis.fractalDesc}
                    </CardDescription>
                </CardContent>
            </Card>
        </>
    )
}
