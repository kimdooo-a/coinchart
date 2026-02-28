# Crypto Chart Analysis (코인 차트 분석)

바이낸스 등 주요 거래소의 실시간 데이터를 기반으로 가상화폐/주식 시장을 심층 분석하는 AI 웹 애플리케이션.
시장 상태(Trend/Range)를 자동 진단하고 통계적 확률(Win Rate)에 기반한 매매 전략을 제시합니다.

## 주요 기능

- **AI 기술적 분석**: 시장 상태 분류 (상승추세/하락추세/횡보/고변동성) + 동적 가중치 기반 매매 신호
- **시장 심리 분석**: Fear & Greed Index, 프랙탈 패턴 매칭, RSI 히트맵
- **실시간 시그널**: Pump/Dump 감지, RSI 과매수/과매도 알림
- **주식 분석**: 미국 주식 시장 데이터 연동 (TwelveData)
- **백테스트**: 전략 성과 시뮬레이션
- **보안 메모**: 클라이언트 측 암호화 메모 기능

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (Strict Mode) |
| Styling | Tailwind CSS v4, Framer Motion |
| Charting | TradingView Lightweight Charts |
| Backend | Supabase (Auth, DB, RPC) |
| Data | Binance API, TwelveData API, Alternative.me |
| Deployment | Vercel + GitHub Actions |

## 빠른 시작

```bash
# 의존성 설치
npm install

# 환경변수 설정 (.env.local)
cp .env.example .env.local
# 필수 변수 설정 (docs/ENV_REQUIRED.md 참조)

# 개발 서버 실행
npm run dev
```

http://localhost:3000 에서 확인

## 주요 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint 검사 |
| `npm run preflight` | 배포 전 사전 검증 |
| `npm run healthcheck` | 상태 점검 |
| `npm run cron:daily` | 일일 자동화 |

## 문서 구조

| 문서 | 설명 |
|------|------|
| [PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) | 프로젝트 아키텍처 상세 |
| [WORKFLOW.md](docs/WORKFLOW.md) | 개발 워크플로우 (Phase 1~4) |
| [MODULE_OWNERSHIP.md](docs/MODULE_OWNERSHIP.md) | 모듈 소유권 |
| [DEPLOYMENT_RUNBOOK.md](docs/DEPLOYMENT_RUNBOOK.md) | 배포 가이드 |
| [ENV_REQUIRED.md](docs/ENV_REQUIRED.md) | 환경변수 목록 |
| [SSOT_SEPARATION_RULES.md](docs/SSOT_SEPARATION_RULES.md) | 단일 진실 공급원 규칙 |
| [CHANGELOG.md](CHANGELOG.md) | 변경 이력 |

## 레퍼런스

- [API Reference](docs/references/_API_REFERENCE.md)
- [Type Reference](docs/references/_TYPE_REFERENCE.md)
- [Component Map](docs/references/_COMPONENT_MAP.md)
- [Environment Variables](docs/references/_ENV_REFERENCE.md)
- [Web Contract](docs/references/_WEB_CONTRACT.md)
