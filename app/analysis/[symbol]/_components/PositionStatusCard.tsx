'use client'

// 포지션 상태 카드 (평단가 대비 손익률)
// page.tsx에서 route-local로 분리 (마크업·시각·계산 불변)

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Translation } from '../_lib/types'

interface PositionStatusCardProps {
    avgPrice: number | undefined
    historyData: any[]
    t: Translation
}

export function PositionStatusCard({ avgPrice, historyData, t }: PositionStatusCardProps) {
    return (
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
                            historyData[historyData.length - 1].close > avgPrice ? 'text-green-500' : 'text-red-500'
                        }`}>
                            {((historyData[historyData.length - 1].close - avgPrice) / avgPrice * 100).toFixed(2)}%
                        </div>
                        <Badge variant={historyData[historyData.length - 1].close > avgPrice ? 'default' : 'destructive'}>
                            {historyData[historyData.length - 1].close > avgPrice ? 'PROFIT' : 'LOSS'}
                        </Badge>
                        <p className="text-on-surface text-sm">
                            {historyData[historyData.length - 1].close > avgPrice
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
    )
}
