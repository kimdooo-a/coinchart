'use client';

import React from 'react';
import { motion } from 'framer-motion';

// lib/signal_engine.ts의 Signal 타입과 동일한 구조
export type Signal = {
    symbol: string;
    type: 'BUY' | 'SELL' | 'WARNING' | 'INFO';
    title: string;
    description: string;
    score: number; // 0-100 심각도
    timestamp: number;
    metrics?: string;
};

type Props = {
    signal: Signal;
    index: number;
    lang: string;
};

// 타입별 색상/스타일 토큰 맵핑 (라이트 테마 기준)
const TYPE_CONFIG: Record<Signal['type'], {
    bg: string;
    border: string;
    badge: string;
    badgeText: string;
    icon: string;
    label: { ko: string; en: string };
}> = {
    BUY: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        badge: 'bg-green-100 text-green-700',
        badgeText: 'text-green-700',
        icon: '📈',
        label: { ko: '매수', en: 'BUY' },
    },
    SELL: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        badge: 'bg-red-100 text-red-700',
        badgeText: 'text-red-700',
        icon: '📉',
        label: { ko: '매도', en: 'SELL' },
    },
    WARNING: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        badge: 'bg-amber-100 text-amber-700',
        badgeText: 'text-amber-700',
        icon: '⚠️',
        label: { ko: '경보', en: 'ALERT' },
    },
    INFO: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        badge: 'bg-blue-100 text-blue-700',
        badgeText: 'text-blue-700',
        icon: 'ℹ️',
        label: { ko: '정보', en: 'INFO' },
    },
};

// score 값을 기반으로 강도 레이블 반환
function getScoreLabel(score: number, lang: string): string {
    if (score >= 80) return lang === 'ko' ? '강함' : 'HIGH';
    if (score >= 50) return lang === 'ko' ? '보통' : 'MED';
    return lang === 'ko' ? '약함' : 'LOW';
}

// score 값을 기반으로 강도 뱃지 스타일 반환
function getScoreBadgeClass(score: number): string {
    if (score >= 80) return 'bg-red-100 text-red-700 font-bold';
    if (score >= 50) return 'bg-yellow-100 text-yellow-700 font-semibold';
    return 'bg-gray-100 text-gray-600';
}

export default function SignalCard({ signal, index, lang }: Props) {
    const config = TYPE_CONFIG[signal.type];
    const scoreLabel = getScoreLabel(signal.score, lang);
    const scoreBadgeClass = getScoreBadgeClass(signal.score);

    // timestamp(ms)를 사람이 읽기 좋은 시간 문자열로 변환
    const timeStr = new Date(signal.timestamp).toLocaleTimeString(
        lang === 'ko' ? 'ko-KR' : 'en-US',
        { hour: '2-digit', minute: '2-digit', second: '2-digit' }
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.3 }}
            className={`p-5 rounded-2xl border ${config.bg} ${config.border} shadow-sm`}
        >
            <div className="flex items-start justify-between gap-4">
                {/* 좌측: 아이콘 + 본문 */}
                <div className="flex items-start gap-4 min-w-0">
                    {/* 타입 아이콘 */}
                    <div className="text-2xl flex-shrink-0 mt-0.5">{config.icon}</div>

                    <div className="min-w-0">
                        {/* 제목 행 */}
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            {/* 코인 심볼 */}
                            <span className="font-bold text-on-surface text-base">{signal.symbol}</span>

                            {/* 타입 뱃지 (BUY/SELL/WARNING/INFO) */}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${config.badge}`}>
                                {config.label[lang as 'ko' | 'en'] ?? config.label.en}
                            </span>

                            {/* 강도 뱃지 (score 기반) */}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${scoreBadgeClass}`}>
                                {scoreLabel}
                            </span>
                        </div>

                        {/* 신호 제목 */}
                        <p className="font-semibold text-on-surface text-sm mb-1">{signal.title}</p>

                        {/* 신호 설명 */}
                        <p className="text-on-surface-variant text-sm leading-relaxed">{signal.description}</p>

                        {/* 보조 지표 (있을 경우) */}
                        {signal.metrics && (
                            <p className="mt-1.5 text-xs font-mono text-on-surface-variant bg-surface-container/60 px-2 py-0.5 rounded inline-block">
                                {signal.metrics}
                            </p>
                        )}
                    </div>
                </div>

                {/* 우측: 시간 */}
                <div className="text-xs font-mono text-on-surface-variant flex-shrink-0 text-right whitespace-nowrap">
                    {timeStr}
                </div>
            </div>
        </motion.div>
    );
}
