# 인수인계서 — 세션 55 (functional-completeness audit R-C/R-D 전량 마감 + watchlist reorder UI)

> 작성일: 2026-06-21
> 이전 세션: [session54](./2026-06-21-session54-error-boundaries.md)
> 저널: 없음(단발 세션 — 대화 히스토리 기반 작성)

---

## 작업 요약

세션 51 functional-completeness audit에서 도출된 **R-C(데이터)·R-D(정리)** 잔여 항목을 자율주행으로 전량 마감하고, 추가로 watchlist reorder UI(P2)를 구현했다. **audit(R-A~R-D) 전체 종료.** 3개 배치로 커밋·푸시(`adf6cf2`·`e17447f`·`4d459bc`). 검증 게이트 전부 통과. 다만 핸드오버상 prod URL(`coinchart.vercel.app`)이 무관한 CRA 앱을 서빙하고 있어 실환경 검증은 불가(실배포 도메인 확인 필요).

## 대화 다이제스트

### 토픽 1: 자율주행 시작 + audit 출처 확인
> **사용자**: "세로운세션 시작... 자율주행... go go"

세션54 cs 결과를 받고 `current.md`·`next-dev-prompt.md`를 확인. 다음 작업이 **R-C/R-D(audit 잔여)**임을 식별. 출처 `2026-06-13-functional-completeness-audit.md`를 읽어 범위 확정: R-C=캘린더 실데이터·뉴스 코인별 집계·상승확률 엔진, R-D=blog/search 고아·/api/price SSOT·DetailedChart 지표·kimchi 폴백·contact 검증.

**결론**: 결정 불요·고신뢰 항목부터 배치 처리하고, 결정 필요 항목은 사용자에게 질의하기로.

### 토픽 2: 배치1 — 고신뢰 R-C/R-D (커밋 adf6cf2)
관련 코드 직독으로 규모 파악 후 5건 구현:
- **상승확률 엔진 연결**: `ChartAnalysisPanel`이 `generateSignals`의 전체 `signals`(+adx/DI/bbWidth/volumeRatio)를 버리고 `rawIndicators`만 사용 중이던 것 발견. `lib/probability/regime.detectRegime` + `lib/probability/engine.calculateProbability`(SSOT, 15~85 클램프)에 투입해 헤더 하드코딩 50/50을 실 가중확률로 교체. `getRiseProb`의 **`Math.random()`은 렌더마다 값이 바뀌어 SSR/CSR 하이드레이션 불일치를 유발하던 잠재버그** → 제거하고 결정론적 매핑(오실레이터=값 기반, MACD/ADX=실 시그널 기반).
- **뉴스 코인별 집계**: 사이드바 하드코딩(BTC124 등) → `news-server`에 오늘(KST) `symbol` 집계 쿼리(GROUP BY 미지원이라 symbol만 fetch 후 JS 집계) 추가, 0건 시 빈 상태.
- **primary-foreground alias**: globals.css shadcn alias 블록에 `card/muted/accent-foreground`는 있고 `primary-foreground`만 누락 확인 → `--color-primary-foreground: var(--color-on-primary)` 1줄로 `text-primary-foreground` 무음실패 **16곳(badge.tsx 등 shadcn 컴포넌트 포함) 일괄 해소**.
- **contact 검증**: 이메일 정규식·필드 길이제한·개행(헤더인젝션) 차단 + HTML 본문 escape(메일 인젝션 차단).
- **kimchi 폴백**: 환율 fetch 실패 시 1450 고정 → 마지막 성공값 모듈 캐시 폴백.

**결론**: tsc0·변경파일eslint0·vitest33·build0(58). 푸시.

### 토픽 3: 남은 3항목 결정 질의
> **사용자**: "1. 크롤링, 2.Supabase SSOT, 3. 지표 추가"

검증으로 audit 오류 2건 해소 후 남은 3건의 방향을 질의:
- **캘린더 실 API** → 크롤링: faireconomy(ForexFactory 호환) 공개 JSON 피드 채택(MT4/5 EA 표준·키/안티봇 없음). DB 테이블·cron 신설은 프로덕션 리스크라 **API+ISR(1h)**로 구현(프로덕션 안전).
- **/api/price** → Supabase SSOT: Binance 인라인 호출을 `lib/supabase/crypto.fetchBinanceTickers` 경유로(단일 외부접근 chokepoint·60s 캐시 공유). 응답 `{symbol,price}` shape 유지로 호출부(`useAnalysisData`) 무수정.
- **DetailedChart** → 지표 추가: 단일 페인 스냅샷 차트라 가격 페인 공유 오버레이(**MA7/25/99·볼린저밴드**)만 추가. RSI/MACD 서브페인은 고정높이 컨테이너 레이아웃 변경이 과대해 제외.

### 토픽 4: 배치2 — 크롤링·SSOT·지표 (커밋 e17447f) + 피드 실검증
3건 구현 후 **외부 의존(faireconomy 피드)을 가정만 하지 않고 실검증**: `curl` → HTTP 200·104 이벤트·내 가정 shape와 정확 일치(impact High19/Medium9/Low74/Holiday2, mapImpact 전부 처리). analysis 페이지의 dead 지표상태(showRSI/MACD/Volume·interval, 토글UI 없이 미사용)·`historyData: any[]`·미사용 Link import도 정리. tsc0·변경파일eslint0·vitest33·build0(`/api/calendar` ƒ 생성).

### 토픽 5: 배치3 — watchlist reorder UI (커밋 4d459bc)
audit P2: 훅 `reorder`·`PATCH /api/watchlist`는 존재하고 UI 진입점만 부재. `WatchlistTable`에 ▲▼ 버튼(경계 disabled·aria) + props, `WatchlistView`가 `reorder` 구독. **`reorder(from,to)`가 sortOrder 정렬 전체 스냅샷 인덱스 기반이므로 '추가순'+'전체' 탭에서만 버튼 활성**(필터/정렬 변형 시 row 인덱스 불일치 방지). 회원은 PATCH로 DB 영속화(기존 best-effort 경로).

### 토픽 6: prod 스모크 → 도메인 불일치 발견
> (자발적) 단언 대신 증거로 프로덕션 검증 시도

`curl https://coinchart.vercel.app/api/calendar` → **무관한 create-react-app("React App", `main.<hash>.js`)** 반환. 세션40 시점엔 이 앱을 서빙했으나 현재는 다른 Vercel 프로젝트(CRA)가 도메인 점유. **실배포 도메인 불명 → 실환경 검증 불가.** 메모리 기록 + "push·로컬빌드까지 검증, 실환경 미확인"으로 정직 보고.

## 의사결정 요약

| # | 결정 | 선택지 | 선택 이유 |
|---|------|--------|----------|
| 1 | primary-foreground = alias 추가 | 신규 파일만 on-primary(세션54 방식) / alias 1줄 | alias가 16곳·shadcn badge 포함 일괄 해소하는 SSOT 정답. 다른 foreground alias 이미 존재 |
| 2 | 캘린더 = API+ISR 크롤링 | DB테이블+cron / API+ISR | DB·cron 신설은 prod 마이그/cron 등록 리스크. API+ISR은 Vercel 자동배포만으로 안전. 사용자 "크롤링" 부합 |
| 3 | /api/price = SSOT 모듈 경유 | Binance 인라인 유지 / fetchBinanceTickers 경유 | 사용자 SSOT 선택. 60s 캐시로 5s 폴링 실시간성 다소 희생 수용 |
| 4 | DetailedChart = MA/BB만 | MA/BB 오버레이 / RSI·MACD 서브페인까지 | 단일페인+고정높이 컨테이너라 서브페인은 레이아웃 변경 과대. 가격오버레이가 깨끗 |
| 5 | reorder = 추가순+전체탭 한정 | 항상 활성 / 조건부 활성 | reorder가 sortOrder 인덱스 기반이라 필터/정렬 시 인덱스 불일치. 조건부가 정확성 보장 |

## 수정 파일 (13개 + 신규 1)

| # | 파일 | 변경 |
|---|------|------|
| 1 | `components/Analysis/ChartAnalysisPanel.tsx` | 확률 엔진 연결·Math.random 제거·결정론적 매핑 |
| 2 | `lib/community/news-server.ts` | 오늘 KST symbol 집계 쿼리·`CoinNewsCount` 타입 |
| 3 | `app/news/page.tsx` | 하드코딩 사이드바 → `data.coinCounts` 렌더 |
| 4 | `app/globals.css` | `--color-primary-foreground` alias 1줄 |
| 5 | `app/api/contact/route.ts` | 검증(이메일/길이/개행) + HTML escape |
| 6 | `app/api/kimchi/route.ts` | 마지막 성공환율 모듈캐시 폴백 |
| 7 | `app/api/calendar/route.ts` | **신규** — faireconomy 피드 fetch·매핑·ISR |
| 8 | `app/calendar/page.tsx` | EVENTS 제거 → `/api/calendar` fetch |
| 9 | `app/api/price/route.ts` | Binance 인라인 → `fetchBinanceTickers` SSOT |
| 10 | `components/DetailedChart.tsx` | showMA/showBB 오버레이 + 다크클래스 정리 |
| 11 | `app/analysis/page.tsx` | dead 상태 정리 → MA/BB 토글 UI·타입화 |
| 12 | `components/Watchlist/WatchlistTable.tsx` | reorderable·▲▼ 버튼 props |
| 13 | `components/Watchlist/WatchlistView.tsx` | reorder 구독·조건부 활성 |
| 14 | `docs/references/_API_REFERENCE.md`·`_COMPONENT_MAP.md` | 레퍼런스 갱신 |

## 검증 결과
- `npx tsc --noEmit` — 0 (매 배치)
- 변경파일 `npx eslint` — 0 (기존 위반도 일부 정리, 전체 error 53→52)
- `npm test`(vitest) — 33/33 passed
- `npm run build` — EXIT 0 (`/api/calendar` ƒ 신규, `/calendar`·`/analysis` ○, `/watchlist` ○)
- faireconomy 피드 실검증 — HTTP 200·104 이벤트·shape 일치
- **⚠️ 실환경(prod) 검증 불가** — 아래 알려진 이슈

## 터치하지 않은 영역
- pricing Pro/Premium(결제 로드맵 — 제품 결정), Giscus/이미지업로드 E2E 실동작(런타임 필요), 양평 06:00 cron 관측(양평 회신 대기), `scripts/` 기존 eslint ~52 error(별도 정리 과제).
- 캘린더 horizon: faireconomy는 this/next week만 → 현재월 외 월은 빈 상태(무료 크롤 한계). DB 누적+장기 horizon은 후속 enhancement.

## 알려진 이슈
- 🔴 **prod 배포 도메인 불명**: `coinchart.vercel.app`이 이 프로젝트가 아닌 무관한 CRA 앱 서빙(세션40 이후 도메인 재할당 추정). repo `kimdooo-a/coinchart` push·로컬 build는 정상이나 **실환경 스모크 검증 불가** → 실제 Vercel 도메인 사용자 확인 필요. (메모리 `prod-url-coinchart-vercel-stale`)
- 🟡 eslint baseline: `npm run lint` ~52 error 전부 `scripts/` 기존 위반. 회귀 판단은 HEAD delta로. (메모리 `eslint-baseline-discrepancy`)

## 다음 작업 제안
1. **실배포 도메인 확인** 후 신규 라우트(`/api/calendar`·`/api/price`·`/calendar`) + 상승확률 헤더 실환경 스모크.
2. 캘린더 DB 누적(`economic_events` 재생성 + 크롤러 cron)으로 장기 horizon 확보(선택).
3. `scripts/` eslint ~52 error 정리 라운드(별도).
4. 양평 cron 관측 회신 확인.

---
[← handover/_index.md](./_index.md)
