# T04 — watchlist/settings 신규 기능 기획·스펙 산출

## 0. 자기 정체성
너는 **R11 평면 4터미널 중 T04 일꾼**이다. 지휘자가 아니다. 본 작업은 **기획·스펙 산출만** — **코드를 작성하지 않는다**. 구현은 후속 라운드(R12 후보)가 본 산출물을 입력으로 진행한다.

## 1. 컨텍스트
- 프로젝트: Crypto Chart Analysis — Next.js 16 App Router. v2.0 커뮤니티 피벗(코인판×네이버). 디자인 톤: 네이버 스타일(흰 배경, 빨↑/파↓, 정보 밀도).
- 작업 디렉토리: `F:\11_dev\260523 코인 차트분석`
- 본 터미널 역할: **T04 / 4** (R11-reconcile-refactor, Wave 1).
- 쓰기 영역(격리): **`docs/design-brief/`** (신규 기획 문서). 코드·`docs/references/`(T01) 미접촉.

## 2. 배경 — 핵심 사실 (지휘부 사전 검증)
- **`/watchlist`·`/settings` = 의도적 "준비 중(Coming Soon)" 스텁**:
  - `app/watchlist/page.tsx`(66줄): 관심종목 — "코인/주식 즐겨찾기 + 실시간 가격 알림" 안내만, 기능 0.
  - `app/settings/page.tsx`(78줄): 설정 — 알림/보안/테마 3그룹 카드 "구현 예정" 표기만, 기능 0.
- R10이 이 둘을 **구현 대상에서 정당하게 제외**함("신규 기능이라 brainstorming 선행 필요, 병렬 부적합").
- 따라서 R11은 **구현이 아니라 기획**: 무엇을·어떻게·어떤 데이터로 만들지 스펙을 확정해 후속 구현 라운드의 입력을 만든다.

## 3. 공통 SOT (읽기 전용)
- `CLAUDE.md` — 기술 스택·SSOT 규칙·v2.0 피벗·환경변수
- `docs/PROJECT_DIRECTION.md` — v2.0 방향성(기획 정합 기준)
- `docs/design-brief/00-overview.md` — 디자인 시스템(전 페이지 공통 — 스펙 양식 참고)
- `docs/design-brief/README.md` — 기존 의뢰서 인덱스·구조(신규 문서 양식 일관성)
- `app/watchlist/page.tsx`·`app/settings/page.tsx` — 현 스텁(출발점)
- `docs/references/_SCHEMA_REFERENCE.md` — 기존 DB 스키마(watchlist 테이블 후보 정합)
- `lib/supabase/crypto.ts`·`lib/supabase/stock.ts` — SSOT 데이터 공급원(관심종목 데이터 후보)

## 4. 작업 목표 — 기획 문서 산출

`docs/design-brief/06-watchlist-settings.md`(또는 watchlist·settings 분리 2문서) 작성. 기존 design-brief 문서 양식 따름. 포함:

### 4-1. 현황 분석
- 두 스텁 페이지의 현 상태·진입점(GNB 도구 드롭다운에 등록됨)·디자인 톤.

### 4-2. watchlist 기획
- **기능 정의**: 코인/주식 즐겨찾기, 실시간 가격, 가격 알림(스텁 안내 기준).
- **데이터 모델 후보**: `community_*` 패턴 정합한 테이블 스키마(예: `user_watchlist` 또는 익명/세션 기반 — v2.0이 익명+회원 혼용임을 고려). 기존 `_SCHEMA_REFERENCE` 정합.
- **API 후보**: 추가/삭제/조회 엔드포인트.
- **UI 와이어**: 목록·추가 플로우·실시간 시세 연동(`/api/coins/ticker` 재사용 가능성).
- **인증 모델**: 익명(localStorage/세션) vs 회원 — v2.0 정책 정합.

### 4-3. settings 기획
- **기능 정의**: 알림/보안/테마 3그룹(스텁 기준).
- **현실성 평가**: 익명 혼용 커뮤니티에서 "설정"이 무엇을 담을지(테마=라이트 고정 정책과 충돌 여부, 언어 토글은 이미 헤더에 존재, 알림은 watchlist 의존). **불필요/중복 기능 솎아내기** 포함.
- 최소 구현(MVP) vs 확장 단계 구분.

### 4-4. 구현 로드맵
- R12+ 구현 단계(DB → API → UI 순), 의존성, 예상 터미널 분할 제안.
- 미결정 사항(taste 결정 필요 항목)을 명시 — 지휘자/사용자 결정 위임.

## 5. 도구 권장
- 기존 `docs/design-brief/*.md` 양식 정독 후 일관된 구조로 작성. 스텁 페이지·스키마·SSOT 코드 Read로 현실성 확보.

## 6. 의존성
- **독립** (Wave 1). 코드 미작성. T01(`docs/references/`)과 디렉토리 분리(`docs/design-brief/`).

## 7. 검증
- 기획 문서가 자기완결(현황·기능·데이터·API·UI·로드맵·미결정) / 기존 design-brief 양식 일관 / v2.0 방향성 정합 / 추측이 아닌 코드·스키마 근거 기반.

## 8. 완료 신호
`docs/handover/2026-05-29-R11-T04-watchlist-settings-plan.md` 작성. 포함 필수:
- 산출 기획 문서 경로·구성
- watchlist 데이터 모델·API·인증 모델 핵심 결정(과 근거)
- settings 기능 솎아내기 결과(무엇을 빼고 무엇을 남겼는지)
- R12 구현 로드맵 요약 + 미결정(taste) 항목 목록

## 안티패턴
- ❌ 코드 작성(구현은 후속 라운드 — 본 터미널은 기획만)
- ❌ `docs/references/`(T01)·코드 수정
- ❌ 코드/스키마 근거 없는 추측 기획
- ❌ 기존 design-brief 양식 무시
- ❌ 한국어 handover 누락
