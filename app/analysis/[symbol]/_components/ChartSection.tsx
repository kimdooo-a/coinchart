'use client'

import React from 'react'
import { DetailedChart } from '@/components/DetailedChart'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ChartSectionProps {
    loading: boolean
    historyData: any[]
    avgPrice: number | undefined
    symbol: string
    t: any
}

export function ChartSection({ loading, historyData, avgPrice, symbol, t }: ChartSectionProps) {
    return (
        <section>
            {loading ? (
                <Card className="bg-surface-container-lowest border-outline-variant">
                    <CardContent className="h-[500px] flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <Badge variant="secondary">{t.common.loading}</Badge>
                        </div>
                    </CardContent>
                </Card>
            ) : historyData.length > 0 ? (
                <div className="h-[500px] w-full">
                    <DetailedChart
                        data={historyData}
                        avgPrice={avgPrice}
                        symbol={symbol}
                    />
                </div>
            ) : (
                <Card className="bg-surface-container-lowest border-outline-variant">
                    <CardContent className="p-10 text-center">
                        <p className="text-on-surface-variant">{t.analysis.notSupported}</p>
                        <p className="text-xs text-on-surface-variant mt-2">{t.analysis.noHistoryDesc}</p>
                    </CardContent>
                </Card>
            )}
        </section>
    )
}
