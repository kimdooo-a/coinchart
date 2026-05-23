# 인수인계서 — R1 / T01 community-migrations

> 작성일: 2026-05-23
> 라운드: R1 (mainpage)
> 일꾼: T01
> 산출물: `supabase/migrations/20260523_create_community_tables.sql` (신규) + `docs/references/_SCHEMA_REFERENCE.md` (append)

---

## 작업 요약

v2.0 커뮤니티 피벗에 따라 `community_boards / community_posts / community_comments / community_post_likes` **4개 테이블**의 단일 마이그레이션 SQL을 작성하고, `_SCHEMA_REFERENCE.md` 끝에 신규 섹션을 추가했다. 게시판 메타 9행(`free`/`market`/`info` + 코인룸 6종)을 같은 파일에서 시드한다. 익명+회원 혼용 작성 권한 모델을 CHECK 제약(`author_id` XOR `guest_*` 3요소)으로 DB 레벨에서 강제하고, `community_post_likes`는 작성과 다른 식별 단위(전체 IP의 sha256 해시)로 dedup한다.

## 산출물

### 신규
- `supabase/migrations/20260523_create_community_tables.sql` (260+ 줄, 단일 파일)

### 수정
- `docs/references/_SCHEMA_REFERENCE.md` (append-only, 기존 줄 무수정)

## 4개 테이블 컬럼·CHECK·인덱스·RLS 요약

| 테이블 | PK | 핵심 컬럼 | CHECK | 인덱스 | RLS |
|---|---|---|---|---|---|
| `community_boards` | `slug` (text) | name / name_en / emoji / description / sort_order | - | PK only | SELECT 공개, CUD service_role |
| `community_posts` | `id` (uuid) | board_slug FK / title(1~200) / content_html / author_id / guest_(nickname/password_hash/ip_masked) / category / tags[] / coin_symbol / view·like·comment_count / is_(notice/hot/deleted) | (a) title 길이 1~200<br>(b) guest_nickname 2~12<br>(c) guest_password_hash ≥60<br>(d) guest_ip_masked regex `^\d+\.\d+\.\*\.\*$`<br>(e) **author_id IS NOT NULL OR guest 3요소 모두 NOT NULL** | (board_slug, created_at DESC) WHERE !deleted<br>(coin_symbol, created_at DESC) WHERE !deleted<br>(is_hot, created_at DESC) WHERE !deleted AND is_hot | SELECT(`is_deleted=false`)<br>INSERT 전체 허용<br>UPDATE/DELETE 본인(`auth.uid()`) — 익명 수정은 서버 라우트가 service_role로 처리 |
| `community_comments` | `id` (uuid) | post_id FK CASCADE / parent_id FK CASCADE(대댓글) / content(1~2000) / 회원/익명 식별 동일 패턴 / like_count / is_deleted | posts와 동일 5가지 + content 1~2000 | (post_id, created_at) WHERE !deleted | posts와 동일 패턴 |
| `community_post_likes` | `id` (uuid) | post_id FK CASCADE / user_id FK CASCADE / ip_hash(sha256 전체 IP) / value(±1) | (a) value IN (-1,1)<br>(b) user_id IS NOT NULL OR ip_hash IS NOT NULL | **UNIQUE 부분 인덱스** 2종 (post_id+user_id WHERE user_id NN, post_id+ip_hash WHERE ip_hash NN) | SELECT 공개, INSERT 전체 허용, DELETE 본인 |

### 인덱스 카운트
- 일반 인덱스 4 (`idx_community_posts_board_created`, `_coin_created`, `_hot`, `idx_community_comments_post`)
- UNIQUE 부분 인덱스 2 (`uniq_community_post_likes_user`, `_iphash`)

### RLS 정책 카운트: 15
- boards 4 (S/I/U/D) + posts 4 + comments 4 + post_likes 3 (UPDATE 정책 없음 — value 변경은 서버가 INSERT/DELETE로 처리)

## 트리거 사용 여부와 이유

| 트리거 | 시점 | 동작 | 채택 이유 |
|---|---|---|---|
| `trg_community_posts_updated_at` | BEFORE UPDATE | `updated_at = now()` | 표준 패턴, blog_posts와 동일 |
| `trg_community_comments_updated_at` | BEFORE UPDATE | 동일 | 댓글 수정/대댓글 추가 추적 |
| `trg_community_comments_count` | AFTER INSERT/UPDATE/DELETE | `community_posts.comment_count` 동기화 (soft-delete 토글 포함) | UI에서 댓글 수가 글 목록에 노출되므로 `SELECT COUNT(*)` 없이 O(1) 조회 |
| `trg_community_post_likes_count` | AFTER INSERT/UPDATE/DELETE | `community_posts.like_count` = `SUM(value)` 합산 | 베스트 정렬·HOT 캐시(`is_hot`)의 1차 입력값 |

**채택했으나 주의**:
- `like_count`는 비추(-1) 포함 합산이라 **음수 가능**. 화면에 "추천 X" 단독 표시 시 `SUM(value=1)` 별도 집계 또는 컬럼 분리 필요 (차후 결정).
- `is_hot` 자동 갱신 트리거는 채택하지 않음 — 임계치 기준이 미정이라 배치(스크립트)로 갱신 권장.

## 익명 게시글 정합성 의도 (CHECK 설계)

```sql
CHECK (
  author_id IS NOT NULL
  OR (guest_nickname IS NOT NULL
      AND guest_password_hash IS NOT NULL
      AND guest_ip_masked IS NOT NULL)
)
```

- **의도**: 회원 식별(`author_id`)이 있으면 익명 필드는 NULL이어도 OK. 익명이면 닉/비번/IP마스킹 **3요소가 모두 채워져야** INSERT 통과.
- **왜 XOR이 아니라 OR**: 어드민이 회원으로 로그인했지만 "익명 닉네임으로 작성" 같은 시나리오 가능성 — 현재는 허용. UI에서 토글 정책을 정해 강제(예: 회원 작성 시 guest_* 모두 NULL로 보냄).
- **컬럼별 CHECK 추가**:
  - `guest_nickname` 길이 2~12 (NULL은 통과)
  - `guest_password_hash` 길이 ≥60 (bcrypt 출력 가정, NULL 통과)
  - `guest_ip_masked` regex `^\d+\.\d+\.\*\.\*$` — 정확히 "앞 2옥텟 + `.*.*`" 형식만 수용
- **추천/비추는 별도**: `community_post_likes.ip_hash`는 **마스킹 X**, 전체 IP의 sha256. dedup 정확도가 필요해서 표시용 마스킹과 분리.

## 다음 일꾼(T02·T12·T13)에게 줄 메모

### T02 (게시글 시드/페이지 DB 연동)
- **`board_slug` 허용값(enum)**: `free`, `market`, `info`, `coin-btc`, `coin-eth`, `coin-xrp`, `coin-sol`, `coin-altcoin`, `coin-kimp` (총 9). 시드는 본 마이그레이션에서 처리하므로 INSERT 게시글 시 `board_slug`를 위 9개 중 하나로 매핑.
- 기존 mock의 `BoardSlug = "free" | "market" | "info"` 외에 **코인룸 6종**도 같은 게시판 모델로 통합됨. `lib/community/mock-coins.ts`의 코인 6종(btc/eth/xrp/sol/altcoin/kimp)이 `coin-{slug}`로 매핑.
- 익명 게시글 시 `guest_ip_masked`는 정규식(`\d+\.\d+\.\*\.\*`)을 통과해야 한다. mock의 `authorIp` 값(예: `"211.34"`)을 그대로 INSERT하면 실패 — `"211.34.*.*"` 형식으로 변환 필요.

### T12 (게시글 작성 API)
- `community_post_likes` UNIQUE 조합은 **부분 인덱스 2종**으로 나뉜다:
  - 회원: `(post_id, user_id) WHERE user_id IS NOT NULL`
  - 익명: `(post_id, ip_hash) WHERE ip_hash IS NOT NULL`
  - → 같은 IP에서 회원 로그인 전/후로 추천 2번 가능. 의도된 동작(식별 단위가 다름). 막으려면 서버 단에서 user_id 보유 시 ip_hash 미저장.
- 추천 토글 구현: `INSERT ... ON CONFLICT DO UPDATE SET value = excluded.value` 권장. value 부호 변경은 `like_count` 트리거가 자동 차분 반영.
- 익명 비밀번호: bcrypt `$2b$10$...` 60자 — `guest_password_hash` CHECK가 길이 ≥60 강제. argon2 사용 시 더 김(통과).

### T13 (코인룸 라우팅)
- `coin_symbol` 컬럼 NULL의 의미는 **"이 글은 특정 코인과 무관한 일반 글"**. 코인룸 페이지(`/coin/btc` 등)에서 `coin_symbol = 'BTC'` 또는 `board_slug = 'coin-btc'` 둘 다로 조회 가능 — 양 축의 차이:
  - `board_slug = 'coin-btc'`: BTC 룸에 명시적으로 작성된 글
  - `coin_symbol = 'BTC'` AND `board_slug IN ('free','market','info')`: 일반 게시판에서 BTC 태그 단 글
  - 코인룸 페이지가 두 종류 모두 노출하려면 `OR` 조건. 인덱스는 `idx_community_posts_coin_created`가 후자를 커버.

## 검증 결과

- `grep -c "CREATE TABLE"` = **4** (기대 4) ✓
- `grep -c "CREATE INDEX"` = **4** (일반) + UNIQUE 부분 인덱스 2 = 총 6 (기대 ≥4) ✓
- `grep -c "CREATE POLICY"` = **15** (기대 ≥8) ✓
- `grep -c "CREATE TRIGGER"` = **4** ✓
- `npx tsc --noEmit` — 본 작업 산출물(`.sql`, `.md`)은 TypeScript 영향 0. 기존 에러 1건(`lib/community/auth.ts(3,20): Cannot find module 'bcryptjs'`)은 본 마이그레이션과 무관, 다른 일꾼 영역(NPM 의존성 또는 별도 트랙). 본 작업으로 신규 에러 0건.
- `psql` dry-run은 로컬 Supabase 미가동으로 건너뜀 (검증 명세대로 SKIP 허용).

## 안티패턴 회피 체크

- ✅ `lib/community/mock-posts.ts` 미수정 (T15 영역)
- ✅ `news` 테이블 미변경 (T06 영역)
- ✅ `_SCHEMA_REFERENCE.md` 기존 줄 0건 수정 (append-only 유지)
- ✅ 시드는 board 메타 9행만 (게시글 더미 0건 — T02 영역)
- ✅ 파일명 `20260523_create_community_tables.sql` 고정 준수

## 알려진 이슈 / 후속 결정 필요

1. **`like_count` 음수 가능성**: 비추(-1) 합산 누적 → 화면 "추천 N" 단독 표시 시 별도 집계 필요. 컬럼 분리(`like_count` vs `dislike_count`) 또는 뷰 도입은 차후.
2. **`is_hot` 자동화 미구현**: 임계치 미정. 배치 스크립트(예: `scripts/cron/update-hot-posts.ts`) 또는 후속 트리거로 결정.
3. **`coin_symbol` enum 미강제**: 자유 텍스트 컬럼. 잘못된 심볼 INSERT 가능. 차후 enum 또는 FK(coins 마스터 테이블) 검토 — 현재는 mock-coins.ts의 6종(BTC/ETH/XRP/SOL/ALT/KIMP)이 사실상 표준.
4. **익명 글 RLS UPDATE/DELETE 미허용**: 의도된 설계 — 서버 라우트가 비번 검증 후 service_role 키로 처리하므로 RLS는 회원만 통과시킴. T12에서 이 패턴 준수 필요.
5. **`profiles` 참조 vs `auth.users` 직참조**: 본 마이그레이션은 `auth.users(id)` 직참조. blog_posts와 일관. profiles 조인이 필요한 화면은 별도 SELECT.

## 참조

- 작업 명세: `docs/orchestration/2026-05-23-R1-mainpage/T01-community-migrations.md`
- 방향성: `docs/PROJECT_DIRECTION.md` §3
- 디자인 시스템: `docs/design-brief/00-overview.md`
- 직전 인수인계: `docs/handover/2026-05-10-session7-stitch-applied.md`
- 산출 SQL: `supabase/migrations/20260523_create_community_tables.sql`
- 갱신된 레퍼런스: `docs/references/_SCHEMA_REFERENCE.md` (`## community_*` 섹션)
