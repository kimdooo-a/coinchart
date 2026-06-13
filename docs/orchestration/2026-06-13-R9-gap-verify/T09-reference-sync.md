# T09 — 코드↔레퍼런스 정합 갱신 (R9 gap-verify)

> 일꾼용 자기완결 통합 프롬프트 · 역할 **T09 / 10** · Wave 2 권장
> 본 파일은 읽기전용 지침서입니다. 이 파일을 수정하지 마십시오.

---

## 1. 컨텍스트

- **프로젝트**: 코인·주식 정보 공유 커뮤니티 (Next.js 16, App Router, Turbopack)
- **루트**: `G:\11_dev\260601 코인 차트분석`
- **라운드**: R9 (gap-verify) — R1~R8 누적 변경분과 레퍼런스 문서 간 **드리프트(drift)**를 메우는 마감 라운드
- **너의 역할**: **T09 / 10** — 코드와 `docs/references/` 레퍼런스의 **정합 갱신** 담당
- **문제의 본질**: 레퍼런스(`_API_REFERENCE.md`, `_COMPONENT_MAP.md`)의 최종 업데이트가 **2026-03-08 기준(stale)**. R1~R8에서 추가된 신규 엔드포인트·컴포넌트가 다수 누락됨. 실제 코드는 앞서갔으나 문서가 따라오지 못한 상태.
- **핵심 원칙**: **실제 코드가 SSOT**. 코드에 맞춰 레퍼런스를 갱신한다. **역방향(문서→코드) 절대 금지.**

---

## 2. 공통 SOT (읽기전용 · 진실 공급원)

아래는 절대 수정하지 말고 **읽기 전용 근거**로만 사용한다.

| SOT | 용도 |
|-----|------|
| `CLAUDE.md` | 프로젝트 규칙·폴더 구조·SSOT 규칙 |
| `app/api/**/route.ts` | **실제 API 엔드포인트** (총 31개 route.ts) — `_API_REFERENCE.md`의 진실 |
| `components/**` | **실제 컴포넌트** — `_COMPONENT_MAP.md`의 진실 |
| `supabase/migrations/` | **실제 DB 스키마/RPC** — `_SCHEMA_REFERENCE.md`의 진실 |

검증 명령(읽기): `find app/api -name route.ts | sort`, `ls components/community/`, `grep -rn "CREATE OR REPLACE FUNCTION" supabase/migrations/`

---

## 3. 공통 의무

- 주석/커밋 메시지/문서 본문 **한국어**.
- `.env`·`.env.local`·`nul` 파일 생성·커밋 **금지**.
- **코드 수정 금지** — 이 역할은 문서(레퍼런스)만 갱신한다.
- `docs/status/current.md`는 **절대 건드리지 않는다** (cs 시 지휘자가 갱신).
- 상황 기록은 handover 산출물에만. 별도 status 파일 갱신 금지.

---

## 4. 작업 목표

레퍼런스 3종을 실제 코드 기준으로 정합 갱신한다. **쓰기 천장은 `docs/references/` 하위 3개 파일로 한정**한다.

### (A) `docs/references/_API_REFERENCE.md`
- 개요/최종업데이트가 `2026-03-08`·`총 29개`로 **stale**. → 실제 route.ts 수(31개)와 분류에 맞춰 **개요 총 개수·최종 업데이트일(2026-06-13) 갱신**.
- **R1~R8 신규 엔드포인트 누락분 추가**(실제 파일 기준 확인 후):
  - `/api/coins/ticker` — `app/api/coins/ticker/route.ts`
  - `/api/coins/hot-issues` — `app/api/coins/hot-issues/route.ts`
  - `/api/fng` — `app/api/fng/route.ts` (공포·탐욕 지수)
  - 보드 3종: `/api/board/[slug]`, `/api/board/[slug]/[postId]`, `/api/admin/board`(PATCH 포함)
  - `/api/community/comment` — `app/api/community/comment/route.ts`
  - `/api/community/like` — `app/api/community/like/route.ts`
- 각 엔드포인트에 **HTTP 메서드 명시**(GET/POST/PATCH/DELETE) — route.ts의 `export async function GET/POST/...` 시그니처를 근거로.
- 기존 항목 중 실제 파일과 어긋나는 항목은 코드 기준으로 정정.

### (B) `docs/references/_COMPONENT_MAP.md`
- 최종 업데이트 `2026-03-08` → `2026-06-13` 갱신.
- **`components/community/*` "Community" 섹션 신규 추가**. 실제 파일(`ls components/community/`)을 근거로 13개 이상 공통 컴포넌트 등재:
  `BoardRow` / `NewsRow` / `CoinHero` / `BoardSidebar` / `Pagination` / `Badge` / `BoardListControls` / `CoinRoomTabs` / `CommentSection` / `CommunityTabs` / `NewsFilters` / `NewsHeadlineCard` / `PostActions` / `PostVoteButtons` / `SidebarWidget` / `widgets/*` 등 (실제 디렉터리 스냅샷 기준으로 빠짐없이).
- 각 컴포넌트의 사용 페이지·lib 의존성·컴포넌트 의존성을 기존 표 포맷에 맞춰 기재.
- **R8에서 삭제된 3종은 이미 반영됨** — 새로 추가하지 말고 **현재 코드에 없음을 확인만** 한다(있으면 제거).

### (C) `docs/references/_SCHEMA_REFERENCE.md`
- 현 스키마에는 `community_toggle_post_like`(게시물 좋아요)는 반영됨. **댓글 좋아요 RPC `community_toggle_comment_like`는 T03이 추가하는 신규**.
- **T03 handover 회수 후**: 신규 RPC 시그니처를 `supabase/migrations/`의 실제 마이그레이션에서 확인하여 반영(기존 `community_toggle_post_like` 항목 바로 아래에 동일 포맷으로 추가).
- **T03 미완 시**: 신규 RPC를 임의로 작성하지 말 것. 현 스키마 기준으로 정합 점검만 수행하고 **미반영분을 handover에 명시 보고**.

---

## 5. 도구 권장

- 코드 사실 확인: `find app/api -name route.ts | sort`, `ls components/community/`, `grep -rn "export async function" app/api/`, `grep -rn "CREATE OR REPLACE FUNCTION" supabase/migrations/`.
- 레퍼런스 편집: **Edit**(부분 수정) 우선. 대규모 섹션 신규 추가만 부분 Edit 누적.
- 메서드 추출은 추측 금지 — 반드시 route.ts의 `export async function` 시그니처를 직접 읽고 근거로 삼는다.

---

## 6. 의존성

- **T03 (신규 댓글 좋아요 RPC)**: `(C)` 항목의 직접 입력. **lazy 참조** — 가능하면 `docs/handover/2026-06-13-R9-T03-*.md` 회수 후 반영.
- **T04 (API 응답 변경)**: `(A)` 일부 엔드포인트의 응답 스키마 갱신에 영향. **lazy 참조** — handover 회수 후 반영, 미완이면 현 코드 기준 갱신 + 미반영분 보고.
- **미완 시 원칙**: 두 의존이 미완이어도 T09는 **현 코드 기준으로 갱신 가능한 전부를 처리**하고, 의존 산출물 도착 후 반영할 항목만 handover에 "미반영(pending T03/T04)"으로 분리 기재. 차단(block)하지 말 것.
- **Wave**: Wave 2 권장(가능하면 T03/T04 산출물 도착 후 착수).

---

## 7. 검증

완료 전 아래를 모두 통과시킨다(읽기 명령으로 자가 검증):

1. **API diff 0**: 실제 `find app/api -name route.ts` 목록 ↔ `_API_REFERENCE.md` 등재 엔드포인트 **누락·과잉 0건**.
2. **개요 정합**: `_API_REFERENCE.md` 개요의 총 개수가 실제 route.ts 수와 일치, 최종 업데이트 `2026-06-13`.
3. **컴포넌트 diff**: 실제 `components/community/` 파일 목록 ↔ `_COMPONENT_MAP.md` "Community" 섹션 등재 항목 정합(누락 0). R8 삭제 3종 부재 확인.
4. **메서드 명시**: 신규 추가 엔드포인트 전부 HTTP 메서드 표기됨.
5. **스키마**: T03 반영 시 마이그레이션 실제 시그니처와 일치. 미완 시 pending 표기.
6. 수정 파일이 `docs/references/` 3종으로만 한정됨(코드·current.md 미변경) 확인.

---

## 8. 완료 신호

- 산출 handover: `docs/handover/2026-06-13-R9-T09-reference-sync.md`
- handover 필수 포함: (a) 갱신한 3개 레퍼런스별 변경 요약, (b) API/컴포넌트 diff 검증 결과(0건 확인), (c) T03/T04 미반영 pending 항목(있으면), (d) 다음 라운드 후속 권고.
- 작업 완료 시 지휘자에게 "T09 완료 + handover 경로 + diff 결과" 한 줄 보고.

---

## 9. 내부 병렬 (mode 2)

- **mode 2 — 파일별 disjoint 병렬**. 3개 레퍼런스가 서로 독립이므로 동시 진행 가능:
  - 서브작업 A → `_API_REFERENCE.md`
  - 서브작업 B → `_COMPONENT_MAP.md`
  - 서브작업 C → `_SCHEMA_REFERENCE.md`
- 천장: `docs/references/`. 세 파일은 상호 disjoint이므로 충돌 없음.
- 단, **(C)는 T03 handover 의존**이므로 A·B 먼저 끝내고 C는 의존 도착 시점에 마무리해도 무방.

---

## 안티패턴 (하지 말 것)

- ❌ 레퍼런스에 맞춰 **코드를 고치는 역방향** — 코드가 SSOT. 문서를 코드에 맞춘다.
- ❌ HTTP 메서드를 route.ts 확인 없이 **추측** 기재.
- ❌ T03 미완 상태에서 `community_toggle_comment_like` 시그니처를 **상상으로 작성**.
- ❌ `docs/status/current.md` 또는 `_TYPE_REFERENCE`·`_ENV_REFERENCE`(정합 확인됨) 수정.
- ❌ 쓰기 천장(`docs/references/` 3종) 밖의 파일 생성·수정.
- ❌ 의존 미완을 이유로 처리 가능한 항목까지 **전면 보류** — 가능분은 처리하고 pending만 분리.
- ❌ R8 삭제 컴포넌트 3종을 다시 등재.
