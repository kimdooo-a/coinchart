# R9-T02 인수인계 — /history 메뉴 정합 (도구 드롭다운 노출)

- 라운드: R9-tree-reconcile (Wave 1)
- 터미널: T02 / 3
- 작업일: 2026-05-29
- 쓰기 영역(격리): `components/global-header.tsx` (단독 변경)

## 1. 현황 (Phase 1 — 사전 확정)

### 도구 드롭다운 구성 (변경 전)
`components/global-header.tsx` line ~64 `const tools: MenuDropdown` — 7개 항목:
`/analysis`(코인분석) · `/stock`(주식분석) · `/signal`(AI시그널) · `/market`(시장무드) · `/calendar`(캘린더) · `/watchlist`(관심종목) · `/secure-memo`(보안메모)
→ **`/history` 누락 확인.**

### `/history` 페이지 기능 상태 — **살아있는 완성 기능 (스텁 아님)**
`app/history/page.tsx`는 `lib/history-data.ts`의 `COIN_INFO`·`COIN_HISTORY` 실데이터를 import하여:
- 코인 선택기(BTC/ETH/SOL/XRP/BCH/DOGE)
- 코인 소개 카드 + 타임라인(역사적 사건/기술/시장/사건사고 배지 분류)
- 이벤트 상세 모달, ko/en 양쪽 텍스트
를 렌더하는 **완성된 인터랙티브 페이지**.

### 링크 사용처 (grep)
`/history` 직접 링크가 헤더·페이지 어디에도 없음. grep `/history` 매칭은 전부 `/api/stock/history`(별개 API 경로). → 메뉴 미배치 = 진입 경로 없음 확정.

### 번역키
`lib/translations.ts`에 `menu.history`("코인 역사"/"History") + `history.{title,subtitle,...}` 카드·페이지 텍스트가 ko/en 양쪽 완비. **추가 번역키 작업 불필요.**

## 2. 결정 — **방안 A (도구 드롭다운에 추가)** + 사유

- 라우트·페이지·번역키·실데이터가 모두 존재하고 기능이 완성됨 → 폐기(B)는 멀쩡한 기능을 버리는 것. 보존적 정합인 A가 타당.
- 진입 경로만 누락된 상태였으므로 도구 드롭다운에 노출만 추가.

## 3. 변경 내용

### `components/global-header.tsx` (1줄 추가)
`tools.items` 배열에 `/calendar` 다음(정보성 항목 그룹)에 1개 항목 추가:
```ts
{ label: t.menu.history, href: "/history" },
```
- 라벨: 기존 `t.menu.history` 재사용 (ko "코인 역사" / en "History")
- 드롭다운 항목 구조는 `{label, href}`만 사용(아이콘 미사용 패턴) → 동일 패턴 준수
- 데스크탑/모바일 양쪽이 `[coinRoom, tools].map(...)`로 동일 배열을 렌더 → **양쪽 자동 노출**

### 미변경 (영역 준수)
- `lib/translations.ts`: 키 이미 완비 → 변경 없음
- `app/history/`: 페이지 정상 → 변경 없음
- `app/page.tsx`·`components/` 루트 dead: T01 전담 → 미접촉
- `docs/references/`: T03 전담 → 미접촉(본 문서에만 기록)

## 4. 검증 근거

| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` | 에러 0 (출력 없음) |
| `npm run build` | ✓ Compiled successfully, 정적 54/54 생성 |
| 라우트 수 | **54 유지** (방안 A — 라우트 불변) |
| `/history` | 빌드 출력 `○ /history` 정적 생성 확인 |
| 메뉴 노출 | 도구 드롭다운(데스크탑+모바일) 자동 반영 |
| `/history` 링크 정합 | 진입 경로 1개 신설, 깨진 링크 0 |

## 5. T03(레퍼런스 정합) 입력 — 변경 요약
- `components/global-header.tsx` 도구 드롭다운 항목: 7개 → **8개** (`/history` "코인 역사" 추가)
- 라우트 수 변동 없음(54). 컴포넌트 맵/메뉴 구조 문서에 도구 그룹 항목 수 갱신 필요 시 반영.
