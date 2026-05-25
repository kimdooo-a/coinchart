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

// 히스토그램 방향색(MACD 양/음 막대). 캔들 KR과 동일 hex 재사용으로 톤 일관성 확보.
// 한국식: 상승/양(+) 빨강, 하락/음(-) 파랑
export const KR_DIRECTION_COLORS = {
  up: '#ba1a1a',
  down: '#0050cb',
};

// 미국식: 상승/양(+) 초록, 하락/음(-) 빨강
export const US_DIRECTION_COLORS = {
  up: '#26a69a',
  down: '#ef5350',
};

// 볼륨 히스토그램용 반투명(alpha 0.5) 방향색. 위 방향색과 동일 RGB의 0.5 투명도 변형.
// 한국식: 빨 #ba1a1a → rgba(186,26,26) / 파 #0050cb → rgba(0,80,203)
export const KR_VOLUME_COLORS = {
  up: 'rgba(186, 26, 26, 0.5)',
  down: 'rgba(0, 80, 203, 0.5)',
};

// 미국식: 녹 #26a69a → rgba(38,166,154) / 빨 #ef5350 → rgba(239,83,80)
export const US_VOLUME_COLORS = {
  up: 'rgba(38, 166, 154, 0.5)',
  down: 'rgba(239, 83, 80, 0.5)',
};

// 보조지표 라인 식별색(SSOT). 방향(상승/하락)이 아니라 "지표를 서로 구분"하는 식별 목적이라
// 캔들 KR 빨/파와 무관하게 고유색을 유지한다(MA7/25/99 세 선을 방향색으로 통일하면 구분 불가).
// 라이트 배경(#ffffff) 가독성 기준으로 선정. CryptoChart·StockChart·DetailedChart에서 공통 참조.
export const INDICATOR_COLORS = {
  rsi: '#9c27b0',                   // RSI 단일선 (보라)
  macd: '#2962FF',                  // MACD 라인 (파랑)
  signal: '#FF6D00',                // MACD 시그널 (주황)
  ma7: '#E91E63',                   // 단기 이동평균 (마젠타)
  ma25: '#2196F3',                  // 중기 이동평균 (하늘)
  ma99: '#c79100',                  // 장기 이동평균 — 노랑(#FFEA00)은 흰 배경 대비 부족 → 진앰버 교체
  bbBand: 'rgba(0, 150, 136, 0.6)', // 볼린저 상·하단 (청록, alpha 0.5→0.6 가독 보강)
  bbBasis: 'rgba(255, 179, 0, 1)',  // 볼린저 중앙선 (앰버)
  avgPrice: '#0050cb',              // 평단가 참조선 — brand primary 정렬
};

export type ChartTone = 'light' | 'dark';
export type CandleScheme = 'kr' | 'us';

export function getChartTheme(tone: ChartTone = 'light'): DeepPartial<ChartOptions> {
  return tone === 'light' ? LIGHT_CHART_THEME : DARK_CHART_THEME;
}

export function getCandleColors(scheme: CandleScheme = 'kr') {
  return scheme === 'kr' ? KR_CANDLE_COLORS : US_CANDLE_COLORS;
}

// MACD 히스토그램·시리즈 기본색용 불투명 방향색
export function getDirectionColors(scheme: CandleScheme = 'kr') {
  return scheme === 'kr' ? KR_DIRECTION_COLORS : US_DIRECTION_COLORS;
}

// 볼륨 히스토그램 막대용 반투명 방향색
export function getVolumeColors(scheme: CandleScheme = 'kr') {
  return scheme === 'kr' ? KR_VOLUME_COLORS : US_VOLUME_COLORS;
}

// 보조지표 라인 식별색(RSI/MACD/MA/BB·평단가선)
export function getIndicatorColors() {
  return INDICATOR_COLORS;
}
