# 📈 코인 차트 분석 프로젝트 (Crypto Chart Analysis) - 프로젝트 개요

## 1. 프로젝트 소개 (Introduction)
본 프로젝트는 바이낸스(Binance) 등 주요 거래소의 실시간 데이터를 기반으로 가상화폐 시장을 심층 분석하는 AI 웹 어플리케이션입니다. 단순한 가격 추적을 넘어, **시장 상태(Trend/Range)**를 자동으로 진단하고 통계적 확률(Win Rate)에 기반한 구체적인 매매 전략을 제시합니다.

## 2. 기술 스택 (Tech Stack)
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4, Framer Motion (애니메이션)
- **Charting**: TradingView Lightweight Charts
- **Data Source**: Binance Public API, Alternative.me (FNG)

## 3. 핵심 기능 및 로직 (Core Features & Logic)

### A. AI 기술적 분석 (Advanced Analysis Engine)
사용자가 보고 있는 차트의 데이터를 분석하여 매수/매도 신호를 생성합니다.
- **위치**: `lib/analysis.ts`, `lib/indicators.ts`
- **주요 알고리즘**:
  - **Market State Classification**: ATR과 EMA를 활용하여 현재 장세가 **상승추세(Trending Up)**, **하락추세(Trending Down)**, **횡보(Ranging)**, **고변동성(Volatile)** 중 무엇인지 판단합니다.
  - **Dynamic Weighting**: 시장 상태에 따라 지표의 가중치를 자동 조절합니다. (예: 횡보장에서는 오실레이터 계열 지표 비중 확대)
  - **Wilder's Smoothing**: RSI, ADX 계산 시 표준 알고리즘을 적용하여 정밀도를 높였습니다.
  - **Advanced Price Levels**: 피벗 포인트(Pivot Points)와 피보나치 되돌림(Fibonacci)을 결합하여 지지/저항선 및 손절/익절가를 자동 계산합니다.

### B. 시장 심리 분석 (Market Mood)
거시적인 시장 분위기를 파악합니다.
- **위치**: `app/market/page.tsx`, `lib/fractal_engine.ts`
- **주요 기능**:
  - **Fear & Greed Index**: 공포/탐욕 지수 시각화.
  - **Fractal Pattern Matching**: 현재 차트 패턴과 가장 유사한 과거 패턴을 찾아 향후 움직임을 예측 (유사도 기반 시뮬레이션).
  - **RSI Heatmap**: 주요 코인들의 과열/침체 여부를 한눈에 파악.

### C. 실시간 시그널 엔진 (Signal Engine)
백그라운드에서 실시간으로 시장을 모니터링합니다.
- **위치**: `lib/signal_engine.ts`
- **기능**: 급등/급락(Pump/Dump) 감지, RSI 과매수/과매도 진입 알림.

### D. 뉴스 및 정보 (News & Info)
- **위치**: `lib/news.ts`
- **기능**: RSS 피드를 통해 주요 크립토 뉴스를 실시간으로 수집하고 분류합니다.

## 4. 폴더 구조 (Directory Structure)

```
📦 root
├── 📂 app            # Next.js App Router (페이지 라우팅)
│   ├── 📂 analysis   # 상세 분석 페이지
│   ├── 📂 market     # 시장 심리 페이지
│   └── 📂 api        # 서버 사이드 API 핸들러
├── 📂 components     # UI 컴포넌트 재사용 라이브러리
│   ├── 📂 Analysis   # 차트 분석 패널, 가이드 UI
│   ├── 📂 Chart      # Lightweight Charts 래퍼
│   └── 📂 Market     # 히트맵, 게이지 차트 등
├── 📂 lib            # 핵심 비즈니스 로직 (Core Logic)
│   ├── 📜 analysis.ts      # AI 분석 메인 엔진
│   ├── 📜 indicators.ts    # 보조지표 수식 라이브러리
│   ├── 📜 fractal_engine.ts # 프랙탈 패턴 분석기
│   └── 📜 api/*.ts         # 외부 API 연동
├── 📂 public         # 이미지 등 정적 리소스
└── 📜 package.json   # 의존성 관리
```

## 5. 데이터 흐름 (Data Flow)
1. **Fetch**: 클라이언트/서버에서 Binance API 호출 (`lib/api/binance.ts`)
2. **Compute**: `CandleData` 배열을 `lib/indicators.ts`를 통해 보조지표 수치로 변환
3. **Analyze**: `analyzeMarket` 함수가 시장 상태를 진단하고 점수(Score)와 확률(WinRate) 계산
4. **Render**: `AnalysisPanel` 및 `TradingStrategyGuide` 컴포넌트가 사용자에게 시각화된 정보 제공

## 6. 최근 주요 업데이트 (Latest Updates)
- **kdy-addon 통합**: 외부 애드온의 고급 분석 로직(ATR, 동적 가중치 등)이 프로젝트 코어(`lib/`)에 완전히 통합되었습니다.
- **타입 안정성 강화**: TypeScript Strict 모드 관련 빌드 오류 수정 완료.
