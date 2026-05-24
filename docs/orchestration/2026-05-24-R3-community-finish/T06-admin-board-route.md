# T06 — 관리자 게시판 라우트 (공지 is_notice 생성/관리)

> **본 터미널은 R3 일꾼(T06 / 12)**. Wave 1 (즉시 발사, 독립).

## 1. 컨텍스트

- 프로젝트: Crypto Chart Analysis (v2.0 커뮤니티 — 네이버 톤, 빨↑/파↓)
- 작업 디렉토리: `F:\11_dev\260523 코인 차트분석`
- 본 터미널 역할: **T06 / 12** — **관리자 전용 공지(is_notice) 게시글 생성/관리** 라우트 구현
- 라운드: R3 (community-finish)

배경: `community_posts.is_notice BOOLEAN NOT NULL DEFAULT false` 컬럼이 **이미 존재**(R1/T01 마이그레이션). 게시판 목록 API는 `notices`/`posts`를 분리 반환(R2-T01 계약). 하지만 **공지를 생성/토글하는 admin 경로가 없다**. 본 터미널이 admin 전용으로 공지 작성·is_notice 토글 기능을 추가한다. (DDL 불필요 — 컬럼·RLS는 기존)

## 2. 공통 SOT (읽기 전용)

```
CLAUDE.md  ·  docs/PROJECT_DIRECTION.md
docs/references/_API_REFERENCE.md                       ← 커뮤니티 API (POST /api/board/{slug} 등)
docs/references/_SCHEMA_REFERENCE.md                    ← community_posts (is_notice 컬럼·RLS)
docs/handover/2026-05-23-R2-T01-board-realdata.md       ← board API 계약표
app/admin/page.tsx                                       ← 기존 admin 대시보드 (UI 패턴 참고)
app/api/board/[slug]/route.ts                            ← 기존 게시글 POST/GET (확장 또는 참고)
lib/community/auth.ts  ·  middleware.ts                  ← 인증/권한 패턴 참고 (읽기 전용)
```

## 3. 작업 목표

### Phase 1: 권한 모델 확인
- 기존 admin 인증 방식 파악(`app/admin/*`이 어떻게 보호되는지 — Supabase auth/role). 관리자 판별 로직 재사용.

### Phase 2: 공지 생성/토글 API
- **옵션 A** `app/api/board/[slug]/route.ts` POST에 `isNotice` 파라미터 추가(관리자만 true 허용, 서버에서 role 검증) — 가장 간단
- **옵션 B** `app/api/admin/board/route.ts` 신규(admin 전용 공지 CRUD)
- is_notice 토글(PATCH) 포함. 비관리자 요청은 403

### Phase 3: 관리자 UI (`app/admin/board/`)
- **신규** `app/admin/board/page.tsx`: 보드별 공지 목록 + 공지 작성 폼 + is_notice 토글 버튼
- 디자인은 **v2.0 라이트 톤**(네이버 스타일) + 기존 `app/admin` 패턴 따름

## 4. 도구 권장
- 직접 작성. 서버 측 role 검증 필수(클라 신뢰 금지).

## 5. 의존성
- **독립** (Wave 1). 기존 community_posts 스키마·board API 활용.
- 주의: `app/api/board/[slug]/route.ts`를 확장할 경우, T02(board SSR)가 이 API를 **호출**한다. **응답 스키마·기존 파라미터는 하위호환 유지**(필드 추가만, 기존 제거 금지).

## 6. 검증

```powershell
npx tsc --noEmit
Test-Path app/admin/board/page.tsx
# 비관리자 403 / 관리자 공지 생성 로직 존재
npm run build 2>&1 | Select-Object -Last 15
```

```bash
npx tsc --noEmit
grep -rn "is_notice\|isNotice" app/api/board/ app/admin/board/
npm run build 2>&1 | tail -15
```

시각 검증(권장): `npm run dev` → admin 로그인 → `/admin/board` 공지 작성·토글 → `/board/free`에서 공지 상단 노출.

## 7. 완료 신호
`docs/handover/2026-05-24-R3-T06-admin-board-route.md` 작성. 명시: 선택한 옵션(A/B)·권한 검증 방식·신규/수정 파일·API 계약(하위호환 유지 증거)·시각 검증.

## 8. 안티패턴
- ❌ `community_posts` DDL 변경 (is_notice 컬럼 이미 존재 — 스키마 건드리지 말 것)
- ❌ board API **기존 응답 필드·파라미터 제거**(T02 호출 깨짐 — 추가만)
- ❌ `app/board/`(프론트), `app/api/community/` 수정 (T02·T07·T08 영역)
- ❌ 클라이언트만 신뢰한 권한 체크 (서버 role 검증 필수)
- ❌ 한국어 주석 누락
