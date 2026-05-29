'use client'

import { useParams, useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { TRANSLATIONS } from '@/lib/translations'

import { useAnalysisData } from './_lib/useAnalysisData'
import { AnalysisHeader } from './_components/AnalysisHeader'
import { ChartSection } from './_components/ChartSection'
import { AnalysisGrid } from './_components/AnalysisGrid'

export default function AnalysisPage() {
    const { lang, setLang } = useLanguage()
    const t = TRANSLATIONS[lang]

    const params = useParams()
    const router = useRouter()
    const symbol = typeof params.symbol === 'string' ? decodeURIComponent(params.symbol) : ''

    const {
        historyData,
        avgPrice,
        loading,
        fractalResult,
        currentPrice,
        analysisResult,
        userTier,
        error,
        getPriceColor,
    } = useAnalysisData(symbol, router)

    // ===========================================
    // RENDER: Blueprint 구조
    // Header → Chart → Analysis Grid
    // ===========================================

    return (
        <div className="min-h-screen bg-surface text-on-surface p-4 flex flex-col items-center">
            <div className="w-full max-w-6xl space-y-6">

                {/* ========== HEADER SECTION ========== */}
                <AnalysisHeader
                    symbol={symbol}
                    lang={lang}
                    setLang={setLang}
                    t={t}
                    avgPrice={avgPrice}
                    currentPrice={currentPrice}
                    getPriceColor={getPriceColor}
                    onBack={() => router.back()}
                />

                {/* ========== CHART SECTION ========== */}
                <ChartSection
                    loading={loading}
                    historyData={historyData}
                    avgPrice={avgPrice}
                    symbol={symbol}
                    t={t}
                />

                {/* ========== ANALYSIS GRID ========== */}
                <AnalysisGrid
                    loading={loading}
                    analysisResult={analysisResult}
                    error={error}
                    lang={lang}
                    t={t}
                    userTier={userTier}
                    avgPrice={avgPrice}
                    historyData={historyData}
                    fractalResult={fractalResult}
                    router={router}
                />
            </div>
        </div>
    )
}
