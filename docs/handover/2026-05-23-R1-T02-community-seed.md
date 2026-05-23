# 인수인계서 — R1 / T02 community-seed

> 작성일: 2026-05-23
> 라운드: R1 (mainpage)
> 일꾼: T02
> 의존: T01 (community-migrations) 완료 후 발사 — 4개 테이블 + 9 보드 시드 적용 SQL 확정 완료
> 산출물: `scripts/seed-community.ts` (신규)

---

## 작업 요약

T01 이 확정한 `community_posts` 스키마에 맞춰 더미 게시글 시드 스크립트 1개를 작성. `lib/community/mock-posts.ts` 의 `MOCK_POSTS` (3 게시판 × 52행 = **156행**) 를 평탄화하여 100행 chunk 로 INSERT 한다. 본 일꾼은 **코드만 작성**, 실제 DB INSERT 는 사용자가 별도로 실행 (`npx tsx scripts/seed-community.ts`). bcrypt 해시 1회 재사용·랜덤 `created_at` 분포(0~30일)·`--force` 가드를 포함한다.

## 산출물

### 신규
- `scripts/seed-community.ts` (약 180줄, 단일 파일)

### 수정
- 없음 (`package.json`·`mock-posts.ts`·SQL 미수정 — 안티패턴 회피)

### 미생성 (의도)
- `lib/community/seed-helpers.ts` — 매핑 로직이 짧아 본 파일 안에 함수로 inline. 모듈 분리 불필요.

## 매핑 표 (mock → DB 컬럼)

| MockPost 필드 | community_posts 컬럼 | 변환 / 비고 |
|---|---|---|
| `boardSlug` | `board_slug` | `free` / `market` / `info` 그대로 (T01 enum 9종 중 3종) |
| `title` | `title` | 그대로 (DB CHECK `length 1~200` 통과 가정) |
| `contentHtml` | `content_html` | 없으면 `<p>{escapeHtml(title)}</p>` fallback |
| (없음) | `author_id` | 항상 `null` — 회원 시드 없음 |
| `author` / `isAdmin` | `guest_nickname` | 익명 라벨이면 fallback 닉(`익명러` 등), 운영자는 `"운영자"`, 그 외는 원본 닉. 2~12자 clamp |
| (공용) | `guest_password_hash` | `bcrypt.hash("seed123!", 10)` 1회 계산 후 156행 재사용 — 60자 ≥ DB CHECK |
| `authorIp` | `guest_ip_masked` | `"211.34"` → `"211.34.*.*"` (CHECK `^\d+\.\d+\.\*\.\*$` 통과). 미존재 시 `"0.0.*.*"` |
| `category` | `category` | 없으면 `'전체'` |
| `tags` | `tags` | 배열 그대로, 미존재 시 `[]` |
| `coinSymbol` | `coin_symbol` | 그대로 (NULL 허용) |
| `views` | `view_count` | 정수 |
| `likes` | `like_count` | 정수 (DB 트리거가 likes 토글 시 재계산하므로 시드 값은 표시용) |
| `commentCount` | `comment_count` | 정수 (시드는 댓글 미적재 → 트리거가 추후 자동 동기화) |
| `isNotice` | `is_notice` | Boolean 캐스팅 |
| `isHot` | `is_hot` | Boolean 캐스팅 (배치 갱신 없이 시드 분포 그대로) |
| `createdAt` (상대시간 라벨) | `created_at` | **사용 불가** — 라벨을 ISO 로 역변환하지 않고 `NOW() - random(0~30일)` 으로 대체 |

## 실행 명령

사용자가 직접 실행해야 한다 (본 일꾼은 미실행):

```bash
# 0. 사전 조건: T01 마이그레이션이 Supabase 에 적용되어 community_boards 9행이 있어야 함
#    (없으면 스크립트가 "community_boards 행이 부족 (0/9)" 로 가드 종료)

# 1. 신규 적재 (기존 행 0개 가정)
npx tsx scripts/seed-community.ts

# 2. 기존 행 있을 때 추가 적재
npx tsx scripts/seed-community.ts --force
```

기대 출력 (성공):
```
[seed-community] 시드 시작
[seed-community] community_boards 확인 (9행)
[seed-community] 매핑 완료: 156행 (3개 게시판)
[seed-community] chunk 1: 100행 INSERT (누적 100)
[seed-community] chunk 2: 56행 INSERT (누적 156)
[seed-community] 총 156개 게시글 시드 완료
```

## 검증 결과

| 검증 | 명령 | 결과 |
|---|---|---|
| TypeScript 컴파일 | `npx tsc --noEmit` | ✓ 빈 출력 (신규 에러 0) |
| 컬럼 매핑 grep | `grep -c "board_slug\|title\|content_html\|guest_nickname\|guest_password_hash\|guest_ip_masked\|category\|view_count\|like_count\|comment_count\|is_notice\|is_hot\|created_at" scripts/seed-community.ts` | **27회** (기대 ≥12) ✓ |
| ESLint | `npx eslint scripts/seed-community.ts` | ✓ 에러 0 (`.eslintignore` deprecated 경고만 — 본 파일 무관) |
| tsx import dry-run | `npx tsx --eval "import('./scripts/seed-community.ts').then(() => console.log('import OK'))"` | ✓ "import OK" 후 가드 메시지 노출. T01 SQL 미적용 환경에서 정상 동작 (0/9 가드 종료) |

## 안티패턴 회피 체크

- ✅ `lib/community/mock-posts.ts` 미수정 (T15 영역)
- ✅ 실제 DB INSERT 미실행 — 사용자 실행 가정
- ✅ `package.json` 미수정 (`bcryptjs@^3.0.3` 이미 설치되어 추가 의존성 불필요)
- ✅ `supabase/migrations/*` 미수정 (T01 영역)
- ✅ `_SCHEMA_REFERENCE.md` 미수정
- ✅ `lib/community/seed-helpers.ts` 미생성 (불필요했음 — spec "필요 없으면 만들지 말 것" 준수)

## 알려진 이슈 / 의사결정 메모

1. **시드 총량 156행 (≠ 50)**
   - spec 의 "약 50글" 은 최소 노출 보장치였고, `MOCK_POSTS` 가 이미 3 보드 × 52 = 156 을 생성하므로 그대로 채택. 메인 베스트30 다양성·코인룸 필터·페이지네이션 모두 즉시 확인 가능.
   - 줄이고 싶다면 `mapMockToRow` 호출 전 `posts.slice(0, 20)` 같은 한도 추가.

2. **`created_at` 분포 재현 불가**
   - mock 의 `relativeTime("2시간전")` 라벨은 정확한 timestamp 가 없으므로 `NOW() - random(0~30일)` 균등 분포로 대체. 베스트30·HOT 정렬은 `like_count + view_count`/`is_hot` 으로 결정되므로 시각적 차이 미미.
   - 필요 시 시드 후 `UPDATE community_posts SET created_at = ... WHERE id = ...` 보정 가능.

3. **모든 시드 글이 익명 (`author_id = NULL`)**
   - 회원 시드 부재로 spec 명시: "전부 익명 처리".
   - 운영자(`isAdmin=true`) 공지글도 익명 닉 `"운영자"` + guest_* 3요소로 적재. T07 의 회원 RLS update 정책(`auth.uid()`)은 본 시드에 적용되지 않으므로 수정/삭제는 service_role 라우트로만 가능.

4. **`like_count` 시드값 = mock.likes (음수 불가)**
   - T01 트리거(`community_sync_like_count`)는 실제 추천/비추 INSERT 시 합산. 시드 값은 표시용 더미. 사용자가 추후 추천 누르면 트리거가 +1/-1 누적 (시드값 + 실제 토글 누적).
   - 만약 시드와 실제 likes 합산이 누적되어 부담스러우면 시드 시 `like_count = 0` 으로 강제하는 옵션 추가 가능.

5. **공유 비밀번호 `seed123!`**
   - 개발용 더미. 운영 시드 시 변경 또는 익명 글 수정/삭제 비활성화 권장. 본 비번으로는 게시글 수정/삭제 라우트 통과 가능 (T07 영역).

## 미해결

- (없음 — 모든 차단 요인 해결됨)
  - `bcryptjs@^3.0.3` 이미 설치되어 있어 추가 NPM 작업 불필요 (`package.json` line: `"bcryptjs": "^3.0.3"` 확인).
  - `tsx@^4.21.0` 이미 설치되어 있어 실행기 추가 작업 불필요.

## 다음 일꾼 메모 (T12 / T13 / T15)

### T12 (게시글 작성 API)
- 본 시드 글은 모두 `guest_*` 3요소가 채워진 형태로 INSERT 됨. T12 가 만들 작성 API 도 동일 매핑 패턴(`extractClientIp` → `maskIp` → `hashGuestPassword` 의 `lib/community/auth.ts` + `lib/community/ip-mask.ts`)을 재사용하면 일관성 확보.
- 시드 글의 `guest_password_hash` 는 공용 `seed123!` 이므로, 본 시드 글을 "수정" 하려는 사용자가 우연히 같은 비번을 시도하면 통과한다. 운영 진입 전 시드 데이터 분리(테스트 환경 전용 플래그) 권장.

### T13 (코인룸 라우팅)
- 본 시드는 free/market/info 3보드만 채운다. coin-btc ~ coin-kimp 6 보드는 **빈 상태**. T13 가 coin-* 보드 페이지를 만들 때 빈 화면 fallback 또는 `coin_symbol` 매칭(free/market/info 글 중 `coin_symbol = 'BTC'`) UNION 으로 채울 수 있음 (T01 의 `idx_community_posts_coin_created` 인덱스 활용).

### T15 (메인 실데이터 통합)
- 본 시드 적용 후 `getBestPosts()` / `getPostsByBoard()` (mock) 대신 Supabase `community_posts` 직접 쿼리로 교체 가능. 정렬 키:
  - 베스트30: `ORDER BY (like_count + view_count * 0.01) DESC` (mock 과 동일 공식)
  - 게시판 3컬럼: `WHERE board_slug = ? AND is_deleted = false ORDER BY is_notice DESC, created_at DESC LIMIT 30`
- 시드 데이터가 깔리지 않은 환경(로컬 first run)에서는 빈 화면 → mock fallback 으로 graceful degradation 권장.

## 참조

- 작업 명세: `docs/orchestration/2026-05-23-R1-mainpage/T02-community-seed.md`
- T01 인수인계: `docs/handover/2026-05-23-R1-T01-community-migrations.md`
- T01 SQL: `supabase/migrations/20260523_create_community_tables.sql`
- 시드 원본: `lib/community/mock-posts.ts`
- 인증 헬퍼: `lib/community/auth.ts` (bcrypt — 본 스크립트는 직접 `bcryptjs` import)
- IP 마스킹 헬퍼: `lib/community/ip-mask.ts` (참고용 — 본 스크립트는 inline 변환)
- 참고 시드: `scripts/seed_blog.ts` (Supabase service_role 클라이언트 패턴)
