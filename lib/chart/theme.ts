import { ColorType, type DeepPartial, type ChartOptions } from 'lightweight-charts';

// 디자인 토큰(app/globals.css의 라이트 테마)과 매핑한 TradingView Lightweight Charts 옵션.
// T09·T10·T11(R1)에서 차트 생성 시 본 모듈의 헬퍼를 호출하여 일관된 톤을 유지한다.

export const LIGHT_CHART_THEME: DeepPartial<ChartOptions> = {
  layout: {
    background: { type: ColorType.Solid, color: '#ffffff' },
    textColor: '#191b24',
    fontFamily: 'Noto Sans KR, sans-serif',
  },
  grid: {
    vertLines: { color: '#e7e7eb' },
    horzLines: { color: '#e7e7eb' },
  },
  rightPriceScale: { borderColor: '#cfd1d8' },
  timeScale: { borderColor: '#cfd1d8' },
  crosshair: {
    vertLine: { color: '#0050cb', labelBackgroundColor: '#0050cb' },
    horzLine: { color: '#0050cb', labelBackgroundColor: '#0050cb' },
  },
};

export const DARK_CHART_THEME: DeepPartial<ChartOptions> = {
  layout: {
    background: { type: ColorType.Solid, color: '#0d0d12' },
    textColor: '#e5e7eb',
    fontFamily: 'Noto Sans KR, sans-serif',
  },
  grid: {
    vertLines: { color: '#2a2c35' },
    horzLines: { color: '#2a2c35' },
  },
  rightPriceScale: { borderColor: '#3a3c46' },
  timeScale: { borderColor: '#3a3c46' },
};

// 한국식 색상: 상승 빨강, 하락 파랑
export const KR_CANDLE_COLORS = {
  upColor: '#ba1a1a',
  downColor: '#0050cb',
  borderUpColor: '#ba1a1a',
  borderDownColor: '#0050cb',
  wickUpColor: '#ba1a1a',
  wickDownColor: '#0050cb',
};

// 미국식 색상: 상승 초록, 하락 빨강
export const US_CANDLE_COLORS = {
  upColor: '#16a34a',
  downColor: '#dc2626',
  borderUpColor: '#16a34a',
  borderDownColor: '#dc2626',
  wickUpColor: '#16a34a',
  wickDownColor: '#dc2626',
};

export type ChartTone = 'light' | 'dark';
export type CandleScheme = 'kr' | 'us';

export function getChartTheme(tone: ChartTone = 'light'): DeepPartial<ChartOptions> {
  return tone === 'light' ? LIGHT_CHART_THEME : DARK_CHART_THEME;
}

export function getCandleColors(scheme: CandleScheme = 'kr') {
  return scheme === 'kr' ? KR_CANDLE_COLORS : US_CANDLE_COLORS;
}
