# T07 / 10 — Analysis·Stock 대형 컴포넌트 리팩토링 + 라이트화 (R9 gap-verify)

> 본 문서는 **일꾼 터미널용 자기완결 통합 프롬프트(SOT)** 다. 이 파일 하나만 읽고 작업을 끝낼 수 있도록 작성되었다.
> 라운드 **R9 (gap-verify)** / 역할 **T07 / 10**.

---

## 1. 컨텍스트

- **프로젝트**: 코인·주식 정보 공유 커뮤니티 (v2.0 피벗). 바이낸스/TwelveData 실시간 데이터 기반 AI 차트 분석 + 커뮤니티.
- **스택**: Next.js 16 (App Router, Turbopack), TypeScript Strict, Tailwind CSS v4 **(라이트 테마 기조)**, Framer Motion, TradingView Lightweight Charts, Supabase.
- **루트**: `G:\11_dev\260601 코인 차트분석`
- **이번 역할(T07)의 한 줄 정의**: Analysis/Stock 영역의 **대형 컴포넌트를 리팩토링(분할·훅 추출)** 하고, 남아 있는 **다크 톤 잔재를 라이트화**한다. 기능 회귀 없이 구조만 개선한다.
- **배경**: R7에서 차트 색 SSOT(`lib/chart/theme.ts`)가 신설되어 차트 라인/오버레이는 정리 완료. R8에서 페이지 다크 잔재 1차 라이트화 + dead code 삭제 완료. R9는 그 **갭(미처리 대형 파일 3종 + T05 인계 미사용 import)** 을 메우는 라운드다.

## 2. 공통 SOT (읽기 전용 — 수정 금지)

작업 착수 전 아래를 반드시 먼저 읽는다. **추측 금지.**

| 경로 | 용도 |
|------|------|
| `CLAUDE.md` | 프로젝트 규칙·폴더 구조·SSOT 규칙 |
| `docs/references/_COMPONENT_MAP.md` | 컴포넌트 의존성 맵 (분할 시 import 영향 파악) |
| `lib/chart/theme.ts` | **차트 색 SSOT (R7 신설) — 읽기만. 절대 수정 금지** |
| `docs/rules/*.md` | 모듈화·SSOT 분리 등 개발 규칙 |
| `docs/SSOT_SEPARATION_RULES.md` | Crypto/Stock 데이터 SSOT 교차 import 금지 규칙 |

- Crypto 데이터 SSOT: `lib/supabase/crypto.ts` / Stock 데이터 SSOT: `lib/supabase/stock.ts` — **교차 import 금지** (ESLint `no-restricted-imports` 로 차단됨).

## 3. 공통 의무

- 주석·커밋 메시지는 **한국어**.
- `.env`, `.env.local`, `nul` **커밋 금지**.
- **SSOT 교차 import 금지** (Crypto↔Stock). 데이터 접근은 각 영역 SSOT 모듈 경유.
- **차트 색은 `lib/chart/theme.ts`에서만** 가져온다. 컴포넌트 안에 색 하드코딩 신규 추가 금지.
- 의미색(상승=빨강 계열 / 하락=파랑 계열, 한국식 시세 방향) **보존**. 라이트화는 "배경/텍스트 대비"를 고치는 것이지 "방향 의미색을 뒤집는 것"이 아니다.
- 분할은 **동작 동등(behavior-preserving)** — props/상태/렌더 결과가 같아야 한다.

## 4. 작업 목표 (T07 구체 스펙)

### 쓰기 천장 (이 4영역 밖은 절대 수정 금지)
- `components/Analysis/`
- `components/Stock/`
- `components/hooks/`
- `app/analysis/`

> `components/Chart/` 는 **본 라운드 범위 외** (차트 SSOT는 R7 완료). 차트 색·차트 컴포넌트 손대지 않는다.

### 작업 항목

**(A) `components/Analysis/TradingStrategyGuide.tsx` (현재 372줄)**
- 상승/하강 AI 박스의 다크 클래스를 라이트로 교체:
  - 상승: `bg-green-900/20 text-green-400` → `bg-green-50 text-green-700 border-green-300` (또는 디자인 토큰)
  - 하강: `bg-red-900/20 text-red-400` → `bg-red-50 text-red-700 border-red-300` (또는 토큰)
  - 라이트 배경 위 대비 부족 문제 해결. 의미색(상승/하강 방향)은 보존.
- 372줄을 하위 컴포넌트로 **분할**. 예시 구조:
  - `AIAdviceSection` (AI 조언/박스)
  - `EntryPlanSection` (진입 계획)
  - `ConfigSection` (설정/파라미터)
  - 분할 파일은 `components/Analysis/` 하위(예: `TradingStrategyGuide/` 서브폴더)에 둔다. import 경로 정합 유지.

**(B) `components/Analysis/AnalysisPanel.tsx` (현재 359줄)**
- candle fetching·signal 생성 로직을 **커스텀 훅으로 추출** → `components/hooks/` 에 신규 훅 작성 (예: `useAnalysisCandles`, `useAnalysisSignals`).
- 추출 후 `AnalysisPanel.tsx` 본문은 **250줄 미만** 목표.
- 훅은 순수 로직(데이터 fetch + 파생 상태)만 담고, JSX는 패널에 남긴다.

**(C) `app/analysis/[symbol]/page.tsx` (현재 807줄)**
- 컴포넌트 **4~6개로 모듈화** (예: 헤더/요약/차트영역 래퍼/전략/푸터 등 책임 단위로 분리).
- 분리 컴포넌트는 `app/analysis/` 하위(라우트 colocated) 또는 `components/Analysis/` 에 배치 (천장 내).
- 남아 있는 **다크 톤 잔재를 라이트화** (`bg-gray-900`, `bg-green-900` 류).

**(D) T05 인계 — 미사용 backtest import 정리**
- `components/Analysis/AnalysisPanel.tsx`, `components/Analysis/StockAnalysisPanel.tsx` 에서 `generateHistoricalTrades` 등 **backtest 미호출 import** 가 실제 미사용이면 **제거**.
- 단, 호출처가 살아 있으면 남긴다. grep으로 사용 여부 먼저 확인 후 판단.

## 5. 도구 권장

- **분할 작업**: Read → 구조 파악 → 책임 단위로 Edit/Write. 큰 파일은 영역별로 잘라 읽어 정확히 옮긴다(누락·중복 방지).
- **다크 잔재 탐색**: Grep — `bg-gray-900`, `bg-green-900`, `bg-red-900`, `text-green-400`, `text-red-400`, `text-gray-100` 등 패턴으로 천장 4영역 스캔.
- **미사용 import 판정**: Grep — `generateHistoricalTrades` 등 심볼명으로 호출처 확인.
- **의존성 영향**: `docs/references/_COMPONENT_MAP.md` + Grep으로 분할된 컴포넌트의 외부 import 경로 변동 확인.
- **검증**: Bash로 `npx tsc --noEmit`, `npm run build`.

## 6. 의존성

- **선행 SSOT**: `lib/chart/theme.ts` (R7 완료, 읽기만). 차트 색은 이미 확정.
- **R8 완료분 위에서 동작**: 페이지 다크 잔재 1차 라이트화는 R8에서 끝남. T07은 **잔여분 + 대형 파일**만 처리.
- **T05 인계 항목(D)**: 다른 역할이 backtest import를 정리하다 남긴 잔재. 천장 내 두 파일만 본 역할이 마무리.
- 천장 밖(`components/Chart/`, `lib/`, 다른 라우트)은 **건드리지 않으므로** 타 역할과 파일 충돌 없음.

## 7. 검증 (완료 전 전부 통과 필수)

1. `npx tsc --noEmit` → **0 에러** (타입 회귀 없음).
2. `npm run build` → **green** (빌드 성공).
3. **라우트 렌더 확인**: 분할 후 `/analysis/[symbol]` 페이지가 분할 전과 동일하게 렌더되는지 (props/상태 누락 없음). 가능하면 dev 서버 또는 webapp-testing 으로 확인.
4. **다크 grep 잔여 점검**: 천장 4영역에서 `bg-gray-900`, `bg-green-900`, `bg-red-900`, `text-green-400`, `text-red-400` 잔여 0 (의미색 보존 케이스 제외하고 다크 배경 클래스 제거 확인).
5. **줄수 확인**: `AnalysisPanel.tsx` < 250줄, `TradingStrategyGuide.tsx`·`page.tsx` 분할로 본체 축소.
6. **미사용 import 제거 확인**: `generateHistoricalTrades` 등이 미사용으로 남아 있지 않음.

## 8. 완료 신호

- 산출 handover 작성: `docs/handover/2026-06-13-R9-T07-analysis-stock-refactor.md`
  - 포함: **분할 전후 줄수 표** (각 파일 before→after), **신설 컴포넌트/훅 목록**, **라이트화한 클래스 매핑**, **제거한 미사용 import**, **내부 병렬 내역(mode·슬라이스 분할)**, **검증 결과(tsc/build/렌더)**.
- 변경된 레퍼런스(`docs/references/_COMPONENT_MAP.md` — 신설 컴포넌트/훅 추가) 최신화.
- 천장 밖 파일 변경 0 확인 (`git status`).
- 지휘자에게 회수될 수 있도록 handover + 코드 변경만 남기고 종료 (일꾼은 cs 생략 가능 — 통합 cs는 지휘자 수행).

## 9. 내부 병렬

- **권장 모드: mode 3 (kdyswarm worktree) 또는 mode 5 (Workflow)**.
- 3개 대형 파일(A·B·C)은 서로 다른 파일이므로 **독립 슬라이스로 병렬 분할** 가능.
  - 슬라이스1: TradingStrategyGuide.tsx 분할 + 라이트화
  - 슬라이스2: AnalysisPanel.tsx 훅 추출 + (D) 미사용 import 정리
  - 슬라이스3: app/analysis/[symbol]/page.tsx 모듈화 + 라이트화
- **단, 신규 파일 추가/import 경로 변동이 겹칠 위험**이 있으니 worktree 격리 후 순차 머지(충돌 시 import 경로 우선 해결).
- `_COMPONENT_MAP.md` 갱신은 머지 후 **한 번에** (병렬 동시 편집 충돌 방지).

---

## 안티패턴 (하지 말 것)

- ❌ `lib/chart/theme.ts` 수정 — **읽기 전용**. 차트 색은 R7에서 확정됨.
- ❌ `components/Chart/` 손대기 — 본 라운드 범위 외.
- ❌ 상승/하락 **의미색 뒤집기** — 라이트화는 배경/텍스트 대비 교정이지 방향색 변경이 아니다.
- ❌ 분할 중 **동작 변경** — props 누락, 상태 끌어올리기 누락, 조건부 렌더 변형 금지. 구조만 옮긴다.
- ❌ 천장 밖(`lib/`, 다른 라우트, `components/Chart/`) 파일 수정.
- ❌ Crypto↔Stock **SSOT 교차 import** 신규 추가.
- ❌ 색·매직넘버 **하드코딩 신규 추가** — 토큰/SSOT 경유.
- ❌ tsc·build red 상태로 완료 선언.
- ❌ 미사용 import를 "혹시 몰라서" 남기기 — grep으로 미사용 확정 시 제거.
- ❌ `.env`·`nul` 커밋, 영어 주석.
