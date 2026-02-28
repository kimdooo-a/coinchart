# Crypto Chart Analysis (코인 차트 분석)

## 프로젝트 개요

바이낸스 등 주요 거래소의 실시간 데이터를 기반으로 가상화폐/주식 시장을 심층 분석하는 AI 웹 애플리케이션.
시장 상태(Trend/Range)를 자동 진단하고 통계적 확률(Win Rate)에 기반한 매매 전략을 제시.

## 기술 스택

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4, Framer Motion
- **Charting**: TradingView Lightweight Charts
- **Backend**: Supabase (Auth, DB, RPC)
- **Data Source**: Binance API, TwelveData API, Alternative.me (FNG)
- **Deployment**: Vercel + GitHub Actions

## 폴더 구조

| 경로 | 설명 |
|------|------|
| `app/` | Next.js App Router 페이지 (17개 라우트) |
| `app/api/` | API 라우트 핸들러 (15개 엔드포인트) |
| `components/` | UI 컴포넌트 (Analysis, Chart, Market, Stock, SecureMemo, Signal, Common, ui, hooks) |
| `lib/` | 핵심 비즈니스 로직 (analysis, api, backtest, cache, config, crypto, explanation, probability, supabase) |
| `scripts/` | 운영 스크립트 (cron, healthcheck, preflight, seed, batch 등 30+) |
| `types/` | TypeScript 타입 정의 |
| `public/` | 정적 리소스 |
| `docs/` | 프로젝트 문서 |
| `supabase/` | Supabase 설정 |
| `.github/workflows/` | CI/CD (release-deploy, release-validate, daily-cron, release-observe) |

## 핵심 모듈

| 파일 | 역할 |
|------|------|
| `lib/analysis.ts` | AI 분석 메인 엔진 (시장 상태 분류, 동적 가중치) |
| `lib/indicators.ts` | 보조지표 수식 라이브러리 (RSI, MACD, BB, ADX 등) |
| `lib/fractal_engine.ts` | 프랙탈 패턴 매칭 엔진 |
| `lib/signal_engine.ts` | 실시간 시그널 엔진 (Pump/Dump 감지) |
| `lib/probability/engine.ts` | 확률 엔진 |
| `lib/backtest/engine.ts` | 백테스트 엔진 |

## SSOT 규칙

- **Crypto 데이터**: `lib/supabase/crypto.ts` 단일 진실 공급원
- **Stock 데이터**: `lib/supabase/stock.ts` 단일 진실 공급원
- ESLint `no-restricted-imports` 규칙으로 교차 임포트 금지

## 개발 규칙

- 상세: `docs/rules/` 참조
- 모듈 소유권: `docs/MODULE_OWNERSHIP.md` 참조
- SSOT 분리: `docs/SSOT_SEPARATION_RULES.md` 참조
- 배포: `docs/DEPLOYMENT_RUNBOOK.md` 참조

## 레퍼런스 파일

| 파일 | 경로 |
|------|------|
| 스키마 레퍼런스 | `docs/references/_SCHEMA_REFERENCE.md` |
| API 레퍼런스 | `docs/references/_API_REFERENCE.md` |
| 타입 레퍼런스 | `docs/references/_TYPE_REFERENCE.md` |
| 환경변수 레퍼런스 | `docs/references/_ENV_REFERENCE.md` |
| 컴포넌트 맵 | `docs/references/_COMPONENT_MAP.md` |
| 웹 계약 | `docs/references/_WEB_CONTRACT.md` |

## 환경변수 (필수)

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_MODE` / `NEXT_PUBLIC_DISABLE_AUTOMATION` / `NEXT_PUBLIC_DISABLE_PRO_GATE`
- 상세: `docs/ENV_REQUIRED.md` 참조

## 커밋 규칙

- .env, .env.local, nul 커밋 금지
- 주석/커밋 메시지 한국어
