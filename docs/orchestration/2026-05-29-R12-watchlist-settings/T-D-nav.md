# R12 / T-D — nav 진입점 2건 (일꾼 통합 프롬프트) · Wave 2

## 0. 정체성
- 너는 **R12 일꾼 T-D (4명 중 1)**. 역할은 헤더 nav 진입점 연결. **지휘관 아님** — handover만, cs 금지.

## 1. 컨텍스트
- 프로젝트: 코인차트분석. v2.0. 익명 1급 시민이므로 익명도 settings·watchlist 진입 필요.
- **쓰기 허용**: `components/Common/` **만**.
- **⚠️ Wave 2**: T-A(`/watchlist`)·T-B(`/settings`) 라우트가 실페이지로 교체된 뒤 발사. 선행 미완료 시 대기.

## 2. 공통 SOT (읽기 전용)
- `docs/handover/2026-05-29-R11-T04-r12-kickoff.md` §2 T-D
- `docs/design-brief/06-watchlist-settings.md` §1(현황)·§3-1(진입점)
- `docs/design-brief/00-overview.md` (헤더·드롭다운·브랜드 그린)
- 기존 헤더/네비 컴포넌트 (`components/Common/` 내 — 현 "준비 중" 스텁 링크 위치 파악)

## 3. 작업 목표 + 산출물
1. **settings 진입 = 둘 다** (taste #5):
   - 회원: 계정 드롭다운에 "설정" 항목.
   - 익명: 상단 "도구 ▼" 메뉴에 "설정" 항목.
2. **watchlist 진입**: 헤더 또는 "도구 ▼"에 "관심종목"(⭐) 진입 — 익명·회원 공통.
3. 기존 "준비 중"/비활성 스텁 링크를 **실페이지 경로**(`/watchlist`, `/settings`)로 교체. 죽은 링크 0.
4. 브랜드 **그린**으로 ⭐·강조 색 일관(00-overview).

## 4. 의존성
- T-A·T-B 라우트 존재(선행). 라우트 레지스트리(`_WEB_CONTRACT.md`) 갱신은 **하지 말 것**(지휘관 통합 시 일괄) — handover에 신규 진입점만 명기.

## 5. 검증
- `npm run lint`·`npx tsc --noEmit`.
- 수동: 익명/회원 각각 settings·watchlist 진입 동작, 죽은 링크 0, 모바일 메뉴 포함.

## 6. 완료 신호
- `docs/handover/2026-05-29-R12-TD-nav.md`: 추가/교체한 진입점 목록(레퍼런스 갱신용) / 검증 / 격리 확인.
- **cs 금지**.

## 7. 안티패턴
선행(T-A·T-B) 미완료 상태로 강행 · 레퍼런스 직접 갱신 · 죽은 링크 잔존 · 쓰기영역 밖 · 지휘관 자칭.
