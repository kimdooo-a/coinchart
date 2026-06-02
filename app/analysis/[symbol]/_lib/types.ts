// analysis/[symbol] route-local 공유 타입
import type { TRANSLATIONS } from '@/lib/translations'

export type Language = 'ko' | 'en'

/** TRANSLATIONS[lang] 한 언어 묶음의 타입 */
export type Translation = (typeof TRANSLATIONS)['ko']

/**
 * analysis 라우트 캔들 1개.
 * useAnalysisData가 market_prices(date·open·high·low·close·volume)를 매핑한 shape.
 * time은 DB date 문자열(DetailedChart의 ChartData.time: string 계약과 정렬).
 * 실제 접근 필드만 포함 — PositionStatusCard는 close, ChartSection은 DetailedChart로 time/open/high/low/close 전달.
 */
export interface Candle {
    time: string
    open: number
    high: number
    low: number
    close: number
    volume: number
}
