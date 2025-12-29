# PHASE 1 BLUEPRINT — CLAUDE CODE

**ID**: `BP-20251227-001`
**DATE**: `2025-12-27T14:00:00+09:00`
**PHASE**: `1 (Architecture Lock)`
**OWNER**: `Claude Code`
**STATUS**: `DRAFT → PENDING APPROVAL`

---

## Non-Negotiables (준수 사항)

- [x] Watcher 미사용
- [x] TO_AGENT.md에 CMD 작성 금지
- [x] 토큰 과금 AI API 호출 전면 금지
- [x] Report는 `communication/Report/`에만 기록

---

# A. "AI" 표기 및 포지셔닝 정리

## A-1. 현재 상태 진단

| 현재 UI 표기 | 기술적 실체 | 리스크 |
|-------------|------------|--------|
| "⚡ 인공지능 정밀 분석" | `if (rsi < 30) return 'BUY'` | 허위광고 |
| "🧠 AI 패턴분석 (BETA)" | 피어슨 상관계수 | 과장광고 |
| "AI Commentary" | 하드코딩된 조건문 | 기대치 불일치 |
| "AI SCAN" | `setTimeout → 빈 배열` | 기능 미구현 |

## A-2. 법적/신뢰 리스크 분석

```
[위험 시나리오]
1. 사용자: "AI 분석 믿고 매수했는데 손실 발생"
2. 규제기관: "AI 표기 근거 제시 요청"
3. 경쟁사: "허위광고 신고"

[리스크 등급]
- 법적 리스크: MEDIUM (한국 공정거래법 표시광고법)
- 신뢰 리스크: HIGH (발각 시 브랜드 타격)
- 기술 리스크: LOW (기능 자체는 동작)
```

## A-3. 권장 포지셔닝 전략

### Option 1: 정직한 리브랜딩 (권장)
```
[변경 전] → [변경 후]
"AI 분석" → "Smart Analysis" 또는 "Technical Analysis"
"AI 패턴" → "Pattern Recognition"
"AI Commentary" → "Market Insight"
"AI SCAN" → "Signal Scanner"
```

### Option 2: 점진적 진화
```
Phase 1: "AI-Powered" → "Data-Driven"
Phase 2: TensorFlow.js 도입 후 → "ML-Enhanced"
Phase 3: 검증된 모델 배포 후 → "AI" 복원
```

### Option 3: 면책 고지 추가
```typescript
// 모든 분석 페이지 상단에 추가
const Disclaimer = () => (
  <div className="text-xs text-gray-500 bg-gray-900 p-2 rounded">
    본 분석은 기술적 지표 기반 참고 자료이며, 투자 권유가 아닙니다.
    모든 투자 결정은 본인 책임입니다.
  </div>
);
```

## A-4. 즉시 조치 사항

| 파일 | 현재 | 변경 |
|------|------|------|
| `components/Analysis/AnalysisPanel.tsx:39` | "⚡ 인공지능 정밀 분석" | "⚡ 스마트 기술분석" |
| `app/analysis/[symbol]/page.tsx:329` | "🧠 AI 패턴분석" | "🧠 패턴 매칭 분석" |
| `app/signal/page.tsx:69` | "AI SCAN" | "SIGNAL SCAN" |
| `app/market/page.tsx:449` | "AI Commentary" | "Market Commentary" |

---

# B. 유료 API 없이 가능한 고도화 설계

## B-1. 서버사이드 분석 아키텍처

### 현재 문제
```
[Client-Side 병목]
Browser → Binance API (1000 candles × 6 coins)
       → 지표 계산 (CPU 집약)
       → 패턴 매칭 (O(n²))
       → 렌더링

결과: 모바일에서 3-5초 지연, 배터리 소모
```

### 목표 아키텍처
```
┌─────────────────────────────────────────────────────────┐
│  CLIENT (Lightweight)                                   │
│  ├── UI 렌더링만 담당                                    │
│  ├── 캐시된 결과 표시                                    │
│  └── 실시간 가격만 WebSocket                            │
└────────────────────┬────────────────────────────────────┘
                     │ fetch('/api/analysis/BTCUSDT')
                     ▼
┌─────────────────────────────────────────────────────────┐
│  API LAYER (Next.js API Routes)                         │
│  ├── /api/analysis/[symbol]  → 캐시 체크 → 분석 반환    │
│  ├── /api/signals            → 전체 스캔 결과           │
│  └── /api/market-sentiment   → 시장 심리 지수           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  CACHE LAYER                                            │
│  ├── Vercel KV (무료 3000 req/day)                      │
│  ├── Upstash Redis (무료 10000 req/day)                 │
│  └── TTL: 5분 (분석), 1분 (가격)                        │
└────────────────────┬────────────────────────────────────┘
                     │ Cache Miss
                     ▼
┌─────────────────────────────────────────────────────────┐
│  COMPUTE LAYER                                          │
│  ├── 지표 계산 (indicators.ts)                          │
│  ├── 패턴 매칭 (fractal_engine.ts)                      │
│  ├── 백테스트 (backtest.ts)                             │
│  └── 결과 캐싱 → Cache Layer                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  DATA LAYER                                             │
│  ├── Binance API (Crypto) - 무료                        │
│  ├── Supabase (저장) - 무료 티어                        │
│  └── CronJob (5분마다 갱신)                             │
└─────────────────────────────────────────────────────────┘
```

### 구현 코드 스케치

```typescript
// app/api/analysis/[symbol]/route.ts
import { kv } from '@vercel/kv';
import { analyzeMarket } from '@/lib/analysis';
import { getKlines } from '@/lib/api/binance';

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  const cacheKey = `analysis:${params.symbol}:1d`;

  // 1. 캐시 체크
  const cached = await kv.get(cacheKey);
  if (cached) {
    return Response.json({ ...cached, fromCache: true });
  }

  // 2. 분석 실행
  const candles = await getKlines(params.symbol, '1d', 500);
  const analysis = analyzeMarket(candles, { lang: 'ko' });

  // 3. 캐싱 (5분 TTL)
  await kv.setex(cacheKey, 300, analysis);

  return Response.json({ ...analysis, fromCache: false });
}
```

## B-2. 로컬/온디바이스 ML (선택사항)

### TensorFlow.js 활용 (AI API 과금 없음)

```
[학습 파이프라인 - 오프라인]
Python (로컬) → 모델 학습 → SavedModel → TFJS 변환 → /public/models/

[추론 파이프라인 - 온라인]
Browser/Server → tf.loadLayersModel() → 예측 → 무료
```

### 가능한 모델

| 모델 | 용도 | 난이도 | 효과 |
|------|------|--------|------|
| LSTM | 가격 방향 예측 | ★★★★☆ | 높음 |
| Random Forest | 매수/매도 분류 | ★★★☆☆ | 중간 |
| Autoencoder | 이상 탐지 (급등락) | ★★★☆☆ | 높음 |
| Transformer | 시계열 예측 | ★★★★★ | 매우 높음 |

### 구현 예시 (서버사이드)

```typescript
// lib/ml/predictor.ts
import * as tf from '@tensorflow/tfjs-node';

let model: tf.LayersModel | null = null;

async function loadModel() {
  if (!model) {
    model = await tf.loadLayersModel('file://./models/price-predictor/model.json');
  }
  return model;
}

export async function predictDirection(prices: number[]): Promise<{
  direction: 'UP' | 'DOWN' | 'NEUTRAL';
  confidence: number;
}> {
  const m = await loadModel();

  // 정규화
  const normalized = normalize(prices.slice(-60));
  const input = tf.tensor2d([normalized], [1, 60]);

  // 예측
  const prediction = m.predict(input) as tf.Tensor;
  const [prob] = await prediction.data();

  return {
    direction: prob > 0.6 ? 'UP' : prob < 0.4 ? 'DOWN' : 'NEUTRAL',
    confidence: Math.abs(prob - 0.5) * 200
  };
}
```

## B-3. 데이터 정직성 (Real vs Demo 분리)

### 현재 문제
```
[혼재된 데이터]
Crypto 가격: Binance API (Real)
Stock 가격: generateMockCandles() (Fake)
Whale Alert: Math.random() (100% Fake)
```

### 해결 전략

#### Option 1: 명시적 분리
```typescript
// lib/constants.ts
export const DATA_SOURCES = {
  crypto: { type: 'REAL', source: 'Binance' },
  stock: { type: 'DEMO', source: 'Mock' },
  whale: { type: 'SIMULATION', source: 'Random' }
} as const;

// 모든 컴포넌트에서 표시
<Badge variant={source.type === 'REAL' ? 'success' : 'warning'}>
  {source.type}
</Badge>
```

#### Option 2: Demo 모드 페이지 분리
```
/analysis/[symbol]     → Real Data Only (Crypto)
/demo/stock/[symbol]   → Demo Mode 명시
/demo/whale            → Simulation 명시
```

#### Option 3: 실제 API 연동
```
[무료 옵션]
- Stock: Alpha Vantage Free (5 req/min, 500/day)
- Stock: TwelveData Free (800 req/day)
- Whale: Whale Alert Free (10 req/month)
- Onchain: Glassnode Free (기본 지표)
```

---

# C. 철학 있는 디자인 — UI 시스템 규칙 10개

## C-0. 디자인 철학 매핑

```
┌─────────────────────────────────────────────────────────┐
│  3대 거장 × 3대 페이지                                   │
├─────────────────────────────────────────────────────────┤
│  🎨 MONET    → 홈 (Landing)     → 인상주의적 유동성      │
│  🌻 VAN GOGH → 코인 분석        → 표현주의적 역동성      │
│  📐 DA VINCI → 주식 분석        → 르네상스적 정밀함      │
└─────────────────────────────────────────────────────────┘
```

---

## Design Tokens Definition

### 🎨 MONET 토큰 (홈/Landing)

```css
/* 색상 팔레트 - 수련, 빛의 반사 */
--monet-primary: #6B8E9F;      /* 연못 블루 */
--monet-secondary: #A7C4BC;    /* 수련 잎 */
--monet-accent: #E8B4BC;       /* 새벽 핑크 */
--monet-light: #F5EDE0;        /* 부드러운 크림 */
--monet-dark: #3A4A5C;         /* 깊은 물 */

/* 형태 - 부드러운 경계 */
--monet-radius: 24px;          /* 둥근 모서리 */
--monet-blur: 20px;            /* 글래스모피즘 */
--monet-border: 1px solid rgba(255,255,255,0.1);

/* 레이아웃 - 흐르는 구성 */
--monet-gap: 2rem;
--monet-padding: 3rem;

/* 모션 - 물결치는 움직임 */
--monet-duration: 0.8s;
--monet-easing: cubic-bezier(0.4, 0, 0.2, 1);
```

### 🌻 VAN GOGH 토큰 (코인 분석)

```css
/* 색상 팔레트 - 별이 빛나는 밤, 해바라기 */
--vangogh-primary: #1A3A5C;    /* 깊은 밤하늘 */
--vangogh-secondary: #F4C430;  /* 해바라기 노랑 */
--vangogh-accent: #E55B3C;     /* 열정의 주황 */
--vangogh-light: #A8D5E2;      /* 소용돌이 하늘 */
--vangogh-dark: #0D1B2A;       /* 칠흑의 밤 */

/* 형태 - 역동적 곡선 */
--vangogh-radius: 16px;
--vangogh-border: 2px solid;   /* 강한 윤곽 */
--vangogh-shadow: 0 4px 30px rgba(244, 196, 48, 0.3);

/* 레이아웃 - 긴장감 있는 배치 */
--vangogh-gap: 1.5rem;
--vangogh-padding: 2rem;

/* 모션 - 소용돌이 */
--vangogh-duration: 0.5s;
--vangogh-easing: cubic-bezier(0.68, -0.55, 0.27, 1.55);
```

### 📐 DA VINCI 토큰 (주식 분석)

```css
/* 색상 팔레트 - 해부도, 황금비 */
--davinci-primary: #2C2C2C;    /* 세피아 잉크 */
--davinci-secondary: #C9A959;  /* 금박 */
--davinci-accent: #8B4513;     /* 따뜻한 갈색 */
--davinci-light: #F5F1E6;      /* 양피지 */
--davinci-dark: #1A1A1A;       /* 깊은 그림자 */

/* 형태 - 기하학적 정밀함 */
--davinci-radius: 4px;         /* 각진 모서리 */
--davinci-border: 1px solid #C9A959;
--davinci-grid: 1.618;         /* 황금비 */

/* 레이아웃 - 황금 분할 */
--davinci-gap: 1rem;
--davinci-padding: 1.5rem;

/* 모션 - 절제된 움직임 */
--davinci-duration: 0.3s;
--davinci-easing: ease-out;
```

---

## 디자인 규칙 10개

### Rule 1: 페이지별 토큰 적용
```
각 페이지는 반드시 해당 거장의 토큰만 사용한다.
- 홈: Monet 토큰 100%
- 코인 분석: Van Gogh 토큰 100%
- 주식 분석: Da Vinci 토큰 100%
```

### Rule 2: 색상 계층 구조
```
[Monet] 배경→Primary, 카드→Light, 강조→Accent
[Van Gogh] 배경→Dark, 카드→Primary, 강조→Secondary(Yellow)
[Da Vinci] 배경→Light, 카드→Primary, 강조→Secondary(Gold)
```

### Rule 3: 모서리 반경 일관성
```typescript
const radius = {
  monet: '24px',    // 부드럽게 녹아드는
  vangogh: '16px',  // 역동적이지만 통제된
  davinci: '4px'    // 정밀하고 각진
};
```

### Rule 4: 모션 철학 반영
```typescript
const motion = {
  monet: {
    type: 'spring',
    stiffness: 100,
    damping: 20
  },
  vangogh: {
    type: 'spring',
    stiffness: 300,
    damping: 15  // 더 튀는 느낌
  },
  davinci: {
    type: 'tween',
    duration: 0.3,
    ease: 'easeOut'  // 절제된 움직임
  }
};
```

### Rule 5: 타이포그래피 매핑
```css
/* Monet - 부드러운 산세리프 */
--monet-font: 'Inter', sans-serif;
--monet-weight: 300;

/* Van Gogh - 개성 있는 디스플레이 */
--vangogh-font: 'Space Grotesk', sans-serif;
--vangogh-weight: 700;

/* Da Vinci - 클래식 세리프 */
--davinci-font: 'Cormorant Garamond', serif;
--davinci-weight: 400;
```

### Rule 6: 그리드 시스템
```
[Monet] 유기적 Masonry 그리드 - 불규칙한 아름다움
[Van Gogh] 12컬럼 그리드 - 긴장감 있는 비대칭
[Da Vinci] 황금비 그리드 (1:1.618) - 완벽한 비율
```

### Rule 7: 데이터 시각화 스타일
```typescript
const chartStyle = {
  monet: {
    lineColor: 'gradient(#6B8E9F, #E8B4BC)',
    areaFill: 'rgba(107, 142, 159, 0.1)',
    gridLines: 'none'  // 깔끔하게
  },
  vangogh: {
    lineColor: '#F4C430',
    areaFill: 'none',
    gridLines: 'swirl-pattern'  // 소용돌이 패턴
  },
  davinci: {
    lineColor: '#C9A959',
    areaFill: 'rgba(201, 169, 89, 0.05)',
    gridLines: 'fibonacci'  // 피보나치 레벨
  }
};
```

### Rule 8: 상호작용 피드백
```
[Monet] Hover: 빛이 반사되듯 밝아짐 (opacity 0.8 → 1)
[Van Gogh] Hover: 붓터치처럼 스케일업 (scale 1 → 1.05)
[Da Vinci] Hover: 정밀한 테두리 강조 (border-width 1px → 2px)
```

### Rule 9: 상태 색상 (공통)
```css
/* 세 거장 모두 공통 */
--state-positive: #22C55E;  /* 상승/성공 */
--state-negative: #EF4444;  /* 하락/실패 */
--state-neutral: #6B7280;   /* 중립/관망 */
--state-warning: #F59E0B;   /* 주의 */
```

### Rule 10: 로딩 애니메이션
```typescript
const loadingStyle = {
  monet: 'shimmer',      // 물결 치는 반짝임
  vangogh: 'pulse',      // 강렬한 펄스
  davinci: 'skeleton'    // 정밀한 스켈레톤
};
```

---

## 페이지별 적용 예시

### 홈 (Monet Style)
```tsx
<main className="bg-monet-primary min-h-screen">
  <Hero
    style={{
      borderRadius: 'var(--monet-radius)',
      backdropFilter: `blur(var(--monet-blur))`,
      animation: 'float var(--monet-duration) infinite'
    }}
  />
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
  >
    {/* 수련처럼 떠다니는 카드들 */}
  </motion.section>
</main>
```

### 코인 분석 (Van Gogh Style)
```tsx
<main className="bg-vangogh-dark min-h-screen">
  <ChartSection
    style={{
      border: '2px solid var(--vangogh-secondary)',
      boxShadow: 'var(--vangogh-shadow)',
    }}
  />
  <motion.div
    whileHover={{ scale: 1.05 }}
    transition={{ type: 'spring', stiffness: 300 }}
  >
    {/* 소용돌이치는 데이터 시각화 */}
  </motion.div>
</main>
```

### 주식 분석 (Da Vinci Style)
```tsx
<main className="bg-davinci-light min-h-screen">
  <AnalysisGrid
    style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1.618fr', // 황금비
      gap: 'var(--davinci-gap)'
    }}
  />
  <motion.table
    transition={{ duration: 0.3, ease: 'easeOut' }}
  >
    {/* 정밀한 숫자와 데이터 */}
  </motion.table>
</main>
```

---

# D. 로드맵 요약

| Phase | 기간 | 주요 작업 |
|-------|------|----------|
| **1.1** | Week 1 | "AI" 용어 수정, Mock 명시 |
| **1.2** | Week 2 | 디자인 토큰 시스템 구축 |
| **1.3** | Week 3-4 | 서버사이드 캐싱 아키텍처 |
| **2.1** | Month 2 | TensorFlow.js PoC |
| **2.2** | Month 2-3 | 실제 주식 API 연동 |
| **3.0** | Quarter 2 | 검증된 ML 모델 배포 → "AI" 복원 |

---

**Blueprint Status**: DRAFT → PENDING COMMANDER APPROVAL
**Next Action**: Antigravity 승인 후 Phase 1 실행

---

**Agent**: Claude Code
**Role**: Reasoning / Analysis
**Phase**: 1 (Architecture Lock)
