'use client'

// 분석 페이지 상단 헤더 (네비게이션 + 언어 토글 + 심볼/현재가)
// page.tsx에서 route-local로 분리 (마크업·시각 불변)

import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import type { Language, Translation } from '../_lib/types'

interface AnalysisHeaderProps {
    symbol: string
    lang: Language
    setLang: (lang: Language) => void
    t: Translation
    avgPrice: number | undefined
    currentPrice: number | null
    getPriceColor: () => string
    onBack: () => void
}

export function AnalysisHeader({
    symbol,
    lang,
    setLang,
    t,
    avgPrice,
    currentPrice,
    getPriceColor,
    onBack,
}: AnalysisHeaderProps) {
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
                        <Badge variant="outline" className="text-blue-400 border-blue-500/30">
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
