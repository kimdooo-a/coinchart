'use client'

// 분석 설명 카드 (근거 / 위험 / 관찰 3열 그리드)
// page.tsx에서 route-local로 분리 (마크업·시각 불변)

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import type { AnalysisResult } from '@/lib/analysis/orchestrator'
import type { Language } from '../_lib/types'

interface ExplanationCardProps {
    analysisResult: AnalysisResult
    lang: Language
}

export function ExplanationCard({ analysisResult, lang }: ExplanationCardProps) {
    return (
        <Card className="bg-surface-container-lowest border-outline-variant">
            <CardHeader>
                <CardTitle className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">
                    {analysisResult.explanation.title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Evidence Column */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-blue-500 rounded" />
                            <Label className="text-blue-400 font-semibold">
                                {lang === 'ko' ? '근거' : 'Evidence'}
                            </Label>
                        </div>
                        <ul className="space-y-2 text-on-surface text-sm">
                            {analysisResult.explanation.sections.evidence
                                .split(/[。.]/)
                                .filter((s: string) => s.trim().length > 0)
                                .map((sentence: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <span className="text-blue-400 mt-0.5">•</span>
                                        <span>{sentence.trim()}</span>
                                    </li>
                                ))}
                        </ul>
                    </div>

                    <Separator orientation="vertical" className="hidden md:block bg-outline-variant mx-auto" />

                    {/* Risk Column */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-orange-500 rounded" />
                            <Label className="text-orange-400 font-semibold">
                                {lang === 'ko' ? '위험' : 'Risk'}
                            </Label>
                        </div>
                        <ul className="space-y-2 text-on-surface text-sm">
                            {analysisResult.explanation.sections.risk
                                .split(/[。.]/)
                                .filter((s: string) => s.trim().length > 0)
                                .map((sentence: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <span className="text-orange-400 mt-0.5">•</span>
                                        <span>{sentence.trim()}</span>
                                    </li>
                                ))}
                        </ul>
                    </div>

                    <Separator orientation="vertical" className="hidden md:block bg-outline-variant mx-auto" />

                    {/* Watch Column */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-purple-500 rounded" />
                            <Label className="text-purple-400 font-semibold">
                                {lang === 'ko' ? '관찰' : 'Watch'}
                            </Label>
                        </div>
                        <ul className="space-y-2 text-on-surface text-sm">
                            {analysisResult.explanation.sections.watch
                                .split(/[。.]/)
                                .filter((s: string) => s.trim().length > 0)
                                .map((sentence: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <span className="text-purple-400 mt-0.5">•</span>
                                        <span>{sentence.trim()}</span>
                                    </li>
                                ))}
                        </ul>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
