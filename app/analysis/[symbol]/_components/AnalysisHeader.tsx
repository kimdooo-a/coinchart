'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

interface AnalysisHeaderProps {
    symbol: string
    lang: 'ko' | 'en'
    setLang: (lang: 'ko' | 'en') => void
    avgPrice: number | undefined
    currentPrice: number | null
    t: any
    onBack: () => void
}

export function AnalysisHeader({ symbol, lang, setLang, avgPrice, currentPrice, t, onBack }: AnalysisHeaderProps) {
    // 현재가 색상: 평단가 대비 상승=green, 하락=red (방향 의미 보존)
    const getPriceColor = () => {
        if (!currentPrice || !avgPrice) return 'text-on-surface'
        return currentPrice >= avgPrice ? 'text-green-600' : 'text-red-600'
    }

    return (
        <section className="space-y-4">
            {/* Navigation Row */}
            <div className="flex justify-between items-center">
                <button
                    onClick={onBack}
                    className="text-on-surface-variant hover:text-on-surface flex items-center gap-2 text-sm"
                >
                    &larr; {t.common.back}
                </button>

                {/* Language Toggle */}
                <div className="flex gap-1">
                    <Badge
                        variant={lang === 'ko' ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setLang('ko')}
                    >
                        KR
                    </Badge>
                    <Badge
                        variant={lang === 'en' ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setLang('en')}
                    >
                        EN
                    </Badge>
                </div>
            </div>

            {/* Symbol Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        {symbol} {t.analysis.title}
                    </h1>
                    {avgPrice && (
                        <Badge variant="outline" className="text-blue-600 border-blue-500/30">
                            {t.analysis.myAvg}: ${avgPrice.toLocaleString()}
                        </Badge>
                    )}
                    <Badge variant="outline">1D</Badge>
                </div>
                {currentPrice && (
                    <div className="text-right">
                        <Label className="text-on-surface-variant text-xs">{t.analysis.currentPrice}</Label>
                        <div className={`text-4xl font-black ${getPriceColor()}`}>
                            ${currentPrice.toLocaleString()}
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}
