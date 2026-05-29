# R12 / T-C — DB·API (user_watchlist) 구현 (일꾼 통합 프롬프트)

## 0. 정체성
- 너는 **R12 일꾼 T-C (4명 중 1)**. 역할은 watchlist 회원 동기화 DB·API. **지휘관 아님** — handover만, cs 금지.

## 1. 컨텍스트
- 프로젝트: 코인차트분석. Supabase(Auth·DB·RLS). 회원=OAuth(구글/카카오).
- **쓰기 허용**: `supabase/`, `app/api/watchlist/`(신규), `lib/supabase/` **만**.

## 2. 공통 SOT (읽기 전용)
- `docs/design-brief/06-watchlist-settings.md` §2(데이터 모델)·§5-1(D1·D2)
- `docs/handover/2026-05-29-R11-T04-r12-kickoff.md` §1(taste #2·#3)
- `docs/references/_SCHEMA_REFERENCE.md` (**secure_memos RLS 패턴** — 본인 소유 모델 그대로 차용)
- `lib/supabase/crypto.ts`·`lib/supabase/stock.ts` (SSOT 구조·클라이언트 생성 패턴 참고)

## 3. 작업 목표 + 산출물
1. **마이그레이션** (`supabase/migrations/...user_watchlist.sql`):
   - 테이블 `user_watchlist`: `id`, `user_id`(FK auth.users), `asset_type`('CRYPTO'|'STOCK' check), `symbol`, `sort_order int`, `created_at`.
   - `UNIQUE(user_id, asset_type, symbol)`.
   - **RLS**: `secure_memos` 패턴 그대로 — 본인 `user_id` 행만 select/insert/update/delete.
2. **`lib/supabase/watchlist.ts` (신규 SSOT)**: watchlist DB 접근 단일 진실 공급원. crypto/stock SSOT와 교차 임포트 금지(신규 도메인).
3. **API** (`app/api/watchlist/`):
   - `GET` 본인 목록, `POST` 추가(상한 **회원 100** 가드 — taste #3), `DELETE` 제거.
   - `POST /api/watchlist/sync`: **로컬 우선 병합**(taste #2) — 클라이언트 로컬 목록 + DB = 합집합 업로드, 중복(unique)은 무시/유지. 회원 전용.
   - 모든 라우트 인증 가드(미회원 401).
4. `docs/references/_SCHEMA_REFERENCE.md`·`_API_REFERENCE.md` 갱신은 **하지 말 것**(레퍼런스는 지휘관이 통합 시 일괄 갱신 — 격리). 대신 handover에 "추가된 테이블/엔드포인트 스펙"을 명기.

## 4. 의존성
- 없음(D1 독립). 프론트 연동(D3)은 T-A·후속 — T-C는 마이그레이션+API+SSOT까지.

## 5. 검증
- 마이그레이션 로컬 적용 시도(또는 SQL 문법 검증). RLS 정책 본인 행 한정 논리 확인.
- API 라우트 타입 통과(`npx tsc --noEmit`)·`npm run lint`.
- SSOT: watchlist.ts가 crypto/stock 미임포트, 교차 금지 준수.

## 6. 완료 신호
- `docs/handover/2026-05-29-R12-TC-db-api.md`: 테이블 DDL·RLS·엔드포인트 스펙(레퍼런스 갱신용 원본) / 검증 / TODO(D3 연동 계약) / 격리 확인.
- **cs 금지**.

## 7. 안티패턴
레퍼런스 파일 직접 갱신(격리 위반) · RLS 누락 · SSOT 교차 임포트 · 상한 가드 누락 · 쓰기영역 밖 · 지휘관 자칭.
