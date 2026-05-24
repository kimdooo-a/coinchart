# R3-T10 인수인계 — lightify-admin (page + blog)

- **날짜**: 2026-05-24
- **라운드/일꾼**: R3 (community-finish) / T10 (12 중)
- **상태**: 완료
- **의존**: 독립 (Wave 1). T06(admin/board 신규)과 경로 분리
- **방법**: 순수 Tailwind 클래스 토큰 교체 (JSX 구조·로직·라우팅·SEO 무변경)

## 작업 목표

세션 7 라이트 토큰 전환 이후에도 다크 톤으로 남아 있던 관리자 대시보드(`app/admin/page.tsx`)와
블로그 관리 3종(`app/admin/blog/**`)을 v2.0 커뮤니티 라이트 톤(네이버 라이트)으로 통일.
`app/admin/board/`는 **T06 신규 영역이라 일절 미터치**.

## 수정한 파일 (4개)

| 파일 | diff (+/-) | 주요 교체 |
|------|-----------|----------|
| `app/admin/page.tsx` | 약 19쌍 (+T06 동시 섹션 포함 56줄) | 카드·헤더·테이블·콘솔 출력·중립 버튼 |
| `app/admin/blog/page.tsx` | 25/25 (대칭) | 페이지 배경·테이블 헤더/행·작업 아이콘 버튼 |
| `app/admin/blog/new/page.tsx` | 29/29 (대칭) | 배경·사이드바 패널·입력 필드·초안/발행 버튼 |
| `app/admin/blog/edit/[id]/page.tsx` | 32/32 (대칭) | 위 + 아카이브 버튼(orange→tertiary) |

`git diff --stat` 합계: **4 files, 123 insertions / 105 deletions**.
blog 3종은 좌우 대칭(순수 클래스 스왑). `page.tsx`의 insertion 초과분(약 18줄)은 **T06이 동시에 추가한
"공지 게시판 관리" 섹션**(`/admin/board` 바로가기, 본 일꾼 작업 중 같은 파일에 삽입됨)으로,
해당 카드도 동일 카드 패턴이라 본 일꾼의 라이트화에 자연 포함됨(아래 "동시 편집" 절 참조).

## 클래스 교체 매핑 (T09/T11 컨벤션 + globals.css `@theme` 토큰)

| 다크 톤 | 라이트 토큰 | 비고 |
|---|---|---|
| `bg-black` / `bg-black text-white` (페이지 배경) | `bg-surface-container-lowest text-on-surface` | blog 3종 래퍼 |
| `bg-card/30 backdrop-blur-md` (섹션 카드) | `bg-surface-container` | 토큰 플립으로 흰 배경 위 투명→가시화. backdrop-blur 제거(무의미) |
| `bg-black/40` (입력 필드) | `bg-surface-container-lowest` | 라이트 회색 패널 위 흰 입력칸 |
| `bg-black/40` (콘솔 출력 박스) | `bg-surface-container-high` | 카드(surface-container)와 대비 |
| `bg-black/20` (테이블 tbody) | `bg-surface-container-lowest` | |
| `bg-white/5` (사이드바 패널) | `bg-surface-container` | |
| `text-white`, `text-gray-200`, `text-gray-300` (본문) | `text-on-surface` | |
| `text-gray-400`, `text-gray-500`, `text-gray-600` | `text-on-surface-variant` | placeholder 포함 |
| `hover:text-white` | `hover:text-on-surface` | 뒤로가기 링크 등 |
| `border-white/10` | `border-outline-variant` | 카드/헤더/테이블/패널/입력 보더 |
| `border-white/20` (초안 저장 버튼) | `border-outline` | |
| `bg-gray-800/700 hover:bg-gray-700/600 text-white` (중립 버튼) | `bg-surface-container-high hover:bg-surface-container-highest text-on-surface` | 뒤로/블로그보기/새로고침 |
| `bg-primary text-white` (주 버튼) | `bg-primary text-on-primary` | on-primary=white, 토큰 정합 |
| `hover:bg-white/5`, `hover:bg-white/10` | `hover:bg-surface-container`, `hover:bg-surface-container-high` | 행/아이콘 hover |
| `divide-white/10` | `divide-outline-variant` | 유저 테이블 행 구분선 |

### 의미 컬러 → 가독성 토큰 매핑 (라이트 배경 대비 확보)

| 위치 | 다크 톤 | 라이트 토큰 | 사유 |
|------|--------|------------|------|
| `page.tsx` 뉴스 콘솔 출력 | `text-green-400` | `text-secondary` (#006e2e) | green-400은 흰 배경 대비 미달. 섹션 색 정체성 유지 |
| `page.tsx` 마켓 콘솔 출력 | `text-blue-400` | `text-primary` (#0050cb) | 동일 |
| `page.tsx` 클린업 콘솔 출력 | `text-red-400` | `text-error` (#ba1a1a) | 동일 |
| `blog/page.tsx` 삭제 hover | `hover:text-red-400` | `hover:text-error` | 위험 액션 빨강 유지 + 가독성 |
| `edit/page.tsx` 아카이브 버튼 | `border-orange-500/30 text-orange-400 hover:bg-orange-500/10` | `border-tertiary/40 text-tertiary hover:bg-tertiary/10` | tertiary(#a33200, "강조·경고")로 보관 의미 유지 + 가독성 |

## 의도적으로 보존한 색 (보존 사유)

1. **컬러 액션 버튼 6개 `text-white` 보존** — `page.tsx`의 채도 높은 액션 버튼 위 흰 글씨.
   T11 핸드오버가 `bg-indigo-600/bg-rose-600 text-white` 토글을 보존한 원칙과 동일.
   - L190 `bg-purple-600` (글 목록 관리)
   - L196 `bg-indigo-600` (새 글 작성)
   - L220 `bg-blue-600` (공지 관리 — **T06 동시 추가 섹션**)
   - L241 `bg-green-600` (크롤러 실행)
   - L266 `bg-blue-600` (시세 업데이트)
   - L292 `bg-red-600` (데이터 클린업 — 위험 액션)
2. **삭제 위험 버튼** — `page.tsx` 유저 삭제 `bg-red-500/10 text-red-400 ... border-red-500/30` 그대로 보존.
3. **상태 뱃지 의미 컬러** — `blog/page.tsx` `statusBadge`(published 그린 / draft 옐로 / archived 그레이)와
   게시 상태 아이콘(`Eye` `text-green-400`)은 상태 시각 시스템이라 보존. archived 뱃지의 `text-gray-400`만
   `text-on-surface-variant`로 라이트화(여전히 중립 그레이, 가독성↑).
4. **processing 뱃지** — `page.tsx` `text-yellow-500 bg-yellow-500/10` 펄스 뱃지(전이 상태 표시) 보존.
5. **데코 글로우 / 그라데이션 타이틀** — `bg-red-500/10`·`bg-indigo-500/20` 블러 오브,
   `from-red-500 to-orange-500` 그라데이션 타이틀 텍스트는 저투명도 액센트라 보존.

## 동시 편집 주의 (T06)

본 일꾼 작업 중 **T06이 `app/admin/page.tsx`에 "공지 게시판 관리" 섹션(`/admin/board` 바로가기)을 추가**함.
- 본 일꾼은 `app/admin/board/`는 미터치(T06 신규 영역).
- 단, T06이 같은 파일(`page.tsx`)에 삽입한 카드는 본 일꾼의 카드 라이트화 패턴
  (`bg-card/30 backdrop-blur-md border border-white/10` → `bg-surface-container border border-outline-variant`)에
  자연 포함되어 라이트화됨. blue 버튼 `text-white`는 다른 액션 버튼과 동일 기준으로 보존.
- **지휘자 통합 시**: `page.tsx`의 diff에는 본 일꾼 변경분 + T06 추가 섹션이 함께 들어 있음.
  커밋 분리가 필요하면 T06 섹션(L209-225 부근)과 라이트화 변경분을 구분할 것.

## 검증 결과

| 항목 | 명령 | 결과 |
|------|------|------|
| 타입 체크 | `npx tsc --noEmit` | **PASS** (0 에러) |
| 잔여 다크 톤 | `grep -rnE "bg-black\|bg-(gray\|slate\|zinc)-(8\|9)[0-9]{2}\|text-white\|dark:" app/admin/page.tsx app/admin/blog/` | **6건** — 전부 컬러 액션 버튼 `text-white`(보존분). `bg-black`·`bg-gray-8/9xx`·`dark:` 0건 |
| `blog/` 하위 다크 톤 | 위 패턴 + `border-white`·`bg-white/`·`text-gray-` | **0건** |
| 빌드 회귀 | `npm run build` | **PASS** (`✓ Compiled successfully in 3.6s`) |
| admin 라우트 등록 | 빌드 라우트 테이블 | `/admin`, `/admin/blog`, `/admin/blog/new`, `/admin/blog/edit/[id]` 모두 정상 (+T06 `/admin/board`) |

## 안티패턴 준수 확인

- ✅ `app/admin/board/` 미수정 (T06 신규 영역)
- ✅ `app/analysis/`·`app/portfolio` 등 미터치 (T09·T11·T12 영역)
- ✅ 위험 액션(삭제 빨강)·상태 뱃지 의미 컬러 보존
- ✅ JSX 구조·로직·라우팅·SEO 메타 무변경 (클래스 토큰 교체만)
- ✅ 새 패키지 설치 없음 / 다크 모드 토글 미추가
- ✅ 한국어 주석 유지

## 시각 검증 안내 (PARTIAL — 권장)

`npm run build` 성공 확인. 시각 회귀는 dev 서버 수동 확인 권장:

```powershell
npm run dev
# → /admin (smartkdy7@gmail.com 로그인 필요), /admin/blog, /admin/blog/new
```

확인 포인트:
- 흰 배경(`surface-container-lowest`) + 라이트 회색 카드(`surface-container`) + 짙은 본문(`on-surface`)
- 콘솔 출력 박스: 라이트 회색 박스에 섹션별 시맨틱 컬러 모노스페이스(secondary/primary/error)
- 컬러 액션 버튼(글 작성/크롤러/시세/클린업)은 채도 유지, 위험 빨강·상태 뱃지 보존
- 블로그 입력 폼: 흰 입력칸 + `border-outline-variant`, 포커스 시 `border-primary`

## 후속 권장 (R3 지휘자)

- `page.tsx`의 섹션 카드가 `backdrop-blur-md` 제거 후 솔리드 `surface-container`로 전환됨 →
  데코 블러 오브가 카드 뒤로 비치지 않음(의도). 홈/커뮤니티 카드 톤과 일관성 최종 점검 권장.
- T06 추가 "공지 게시판 관리" 섹션과의 커밋 정합성(위 "동시 편집" 절) 확인.
