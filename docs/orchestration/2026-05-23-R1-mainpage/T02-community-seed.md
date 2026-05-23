# T02 — community-seed

> **본 터미널은 R1 일꾼(T02)**. T01(community-migrations) handover 회수 후 발사된다.
> 본 .md 1개로 자기완결.

## 정체성

- 역할: `worker` (T02), 라운드 R1, 태그 mainpage
- 담당: community 게시판 시드 데이터 적재 스크립트 + 더미 50글
- 의존: **T01 완료 필요** (스키마 확정 후 작업)

## 컨텍스트

T01이 `community_posts` 스키마를 확정한 직후 본 작업이 진행된다. 메인페이지의 베스트30·게시판 3컬럼은 **실데이터가 0건이면 빈 화면**이 되므로, 시드 50글이 깔려야 R1 종료 시점에 메인이 살아 보인다.

기존 `lib/community/mock-posts.ts`에 이미 좋은 더미 텍스트가 있으므로 **그대로 재사용**하여 시드 스크립트가 mock-* 파일을 읽어 DB에 INSERT 하는 방식이 가장 빠르다.

## 공통 SOT (읽기 전용)

```
CLAUDE.md
docs/orchestration/2026-05-23-R1-mainpage/_INDEX.md
docs/handover/2026-05-23-R1-T01-community-migrations.md   ← T01 완료 후 생성됨
supabase/migrations/20260523_create_community_tables.sql   ← T01 산출물
lib/community/mock-posts.ts                                ← 시드 원본
lib/community/mock-coins.ts                                ← coin board 시드 원본
lib/supabase/server.ts                                     ← service_role 클라이언트 패턴
scripts/seed-blog.ts (있다면)                              ← 스타일 참조
```

## 작업 목표

`scripts/seed-community.ts` 신규 + 약 50개 게시글 INSERT.

## 산출물

### 신규 파일

#### 1. `scripts/seed-community.ts`

- `lib/community/mock-posts.ts`에서 `MOCK_POSTS` import
- 환경변수: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Supabase service_role 클라이언트 생성
- 작업 순서:
  1. 시작 로그: "community 시드 시작"
  2. `community_boards` 행이 9개인지 확인 (없으면 ERROR 종료)
  3. `community_posts` 기존 행 카운트 → 사용자에게 안내하고 `--force` 플래그 없으면 중단
  4. `MOCK_POSTS.free` / `MOCK_POSTS.market` / `MOCK_POSTS.info` 순회
  5. 각 mock 행을 community_posts INSERT 형식으로 매핑:
     - `board_slug` ← mock의 `boardSlug`
     - `title` ← `title`
     - `content_html` ← `contentHtml` 또는 `<p>{title}</p>` (없으면)
     - **author_id 분기**: mock의 `isAnonymous`가 true이면 익명, 아니면 회원으로 처리. 단 본 시드는 회원 시드를 만들지 않으므로 **전부 익명 처리**.
       - `guest_nickname` ← mock의 `nickname`
       - `guest_password_hash` ← bcrypt("seed123!") 1회 계산 후 재사용 (또는 import bcrypt)
       - `guest_ip_masked` ← mock의 `ipMasked` (이미 마스킹된 형식)
     - `category` ← mock의 `category` (있으면, 없으면 '전체')
     - `tags` ← mock의 `tags` (있으면)
     - `coin_symbol` ← mock의 `coinSymbol` (있으면)
     - `view_count`/`like_count`/`comment_count` ← mock의 값
     - `is_notice` ← mock의 `isNotice`
     - `is_hot` ← mock의 `isHot` 또는 view_count + like_count 기반 추론
     - `created_at` ← mock의 `createdAt`을 ISO로 변환 (mock은 "2일 전" 같은 형식이므로 본 시드는 NOW() - random interval 사용. 더미 분포를 위해 `0~30일` 균등)
  6. 1000줄 한 번에 가지 말고 100행씩 chunk로 INSERT (Supabase 권장)
  7. 완료 로그: "총 N개 게시글 시드 완료"

#### 2. `lib/community/seed-helpers.ts` (선택)

만약 bcrypt + mock 변환 로직이 길어지면 별도 모듈로. 필요 없으면 만들지 말 것.

### `package.json` 수정 가능?

**NO**. `package.json`은 본 일꾼의 `allowed_dirs`에 없다. 만약 `bcrypt` 또는 `bcryptjs`가 미설치라면 handover에 명시하고, 사용자에게 `npm install bcryptjs @types/bcryptjs` 안내 요청.

→ 검증 단계에서 `node -e "require('bcryptjs')"` 시도해서 미존재면 handover의 "미해결" 섹션에 명시.

## 작업 단계

1. 위 SOT 읽기 (T01 산출물 포함)
2. T01의 SCHEMA 변경에 맞춰 INSERT 컬럼 명세 확정
3. `scripts/seed-community.ts` 작성
4. **실행은 하지 말 것** — 본 일꾼은 코드만 작성. 사용자가 별도로 `npm run seed:community` (또는 `npx tsx scripts/seed-community.ts`)로 실행한다는 가정.
5. 검증

## 검증

```bash
# 1. TS 컴파일
npx tsc --noEmit

# 2. 스크립트 dry-run (실행 안 함, 임포트만 검증)
node -e "require('./scripts/seed-community.ts')" 2>&1 | head -5
# tsx 사용이면:
npx tsx --eval "import('./scripts/seed-community.ts').then(() => console.log('import OK'))" 2>&1 | head -5

# 3. 컬럼 매핑 누락 검사
grep -c "board_slug\|title\|content_html\|guest_nickname\|guest_password_hash\|guest_ip_masked\|category\|view_count\|like_count\|comment_count\|is_notice\|is_hot\|created_at" scripts/seed-community.ts
# 기대: 12 이상

# 4. ESLint
npx eslint scripts/seed-community.ts 2>&1 | tail -5
```

## 완료 신호

`docs/handover/2026-05-23-R1-T02-community-seed.md` 작성.

본문에 명시:
- 매핑 표 (mock 필드 → DB 컬럼)
- bcrypt 패키지 설치 필요 여부 (미해결 섹션)
- 실행 명령 안내 (`npx tsx scripts/seed-community.ts`)
- 사용자가 실행해야 함을 명시

## 안티패턴

- `mock-posts.ts` 삭제 금지 (T15 영역)
- 실제 DB INSERT 실행 금지 (코드만 작성)
- `package.json` 수정 금지 (`allowed_dirs` 외)
- `community_*` 스키마 변경 금지 (T01 영역)
- `_SCHEMA_REFERENCE.md` 수정 금지
