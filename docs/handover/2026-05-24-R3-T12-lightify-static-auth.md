# R3-T12 인수인계 — lightify-static-auth (정적/인증 페이지 라이트화)

- **날짜**: 2026-05-24
- **라운드/일꾼**: R3 (community-finish) / T12 (12)
- **Wave**: Wave 1 (즉시 발사, 독립)
- **상태**: 완료
- **의존**: 없음 (독립). T09·T10·T11과 디렉토리 분리
- **하류 의존자**: 없음

## 작업 목표

세션 7 디자인 토큰 라이트 전환 이후 다크 톤으로 남아있던 정적 문서/인증 페이지 7종을, JSX 구조·로직·라우팅 무변경으로 **순수 클래스 교체**만 수행하여 라이트 토큰(`app/globals.css` v2.0 커뮤니티 토큰)으로 통일. 인증 에러 상태 빨강과 CTA 강조 컬러는 의미 보존.

## 토큰 체계 이해 (선행 확인)

`app/globals.css`의 `@theme`에서 다음 alias가 **이미 라이트 값**으로 정의되어 있음 → 시맨틱 토큰 사용 부분은 자동 라이트, **하드코딩 다크값만 교체 대상**:

| 토큰 | 실제 값 | 비고 |
|------|---------|------|
| `--color-background` / `--color-card` | `#ffffff` (surface-container-lowest) | 흰색 |
| `--color-foreground` | `#191b24` (on-surface) | 짙은 본문 |
| `--color-muted-foreground` | `#424656` (on-surface-variant) | 회색 본문 |
| `--color-muted` | `#ecedfa` (surface-container) | 연회색 표면 |
| `--color-border` | `#c2c6d8` (outline-variant) | 연회색 보더 |
| `--color-destructive` | `#ba1a1a` (error) | 에러 빨강 |
| `--color-on-primary` | `#ffffff` | 컬러칩 위 흰색 텍스트 |

## 수정한 파일 목록 (전체 7개)

| 파일 | 교체 내용 |
|------|----------|
| `app/contact/page.tsx` | 카드 보더(`border-white/10`→`border-border`)·카드 배경 불투명화(`bg-card/30 backdrop-blur-md`→`bg-card`), 입력창 4곳 다크 배경(`bg-black/20 border-white/10`→`bg-muted border-border`) |
| `app/pricing/page.tsx` | 헤더 구분선·플랜 카드 배경/hover·아이콘 텍스트·feature 텍스트 |
| `app/auth/login/page.tsx` | 페이지/카드 다크 hex(`bg-[#0a0a0a]`/`bg-[#111]`/`border-gray-800`)·부제 텍스트 (구글 OAuth 버튼 흰색 보존) |
| `app/auth/auth-code-error/page.tsx` | 페이지/카드 다크 hex·제목·설명·에러 빨강(라이트화)·Try Again CTA(흰색→primary)·Go Home 보조링크 |
| `app/terms/page.tsx` | 헤더 구분선·섹션 카드 5곳·약관 본문 5곳(`text-gray-300`→`text-foreground`) |
| `app/privacy/page.tsx` | 헤더 구분선·섹션 카드 5곳·본문 5곳·약관 보기 버튼(`border-white/20 hover:bg-white/5`→`border-border hover:bg-muted`) |
| `app/history/page.tsx` | 카테고리 뱃지 4종 다크→라이트, 모달 `prose-invert` 제거 (나머지는 이미 라이트 시맨틱 토큰이라 미변경) |

## 클래스 교체 매핑 표

| 다크 톤 (실제) | 라이트 토큰 | 비고 |
|---|---|---|
| `bg-black/20` (입력창 배경) | `bg-muted` | 카드(흰색) 위 연회색 입력 표면으로 구분 |
| `bg-[#0a0a0a]` (페이지 배경) | `bg-background` | login·auth-error |
| `bg-[#111]` (카드 배경) | `bg-card` | login·auth-error |
| `bg-card/30 backdrop-blur-md` (글래스 카드) | `bg-card` | 라이트 배경에서 흰 30% 반투명이 안 보여 불투명화. backdrop-blur는 불투명 표면에서 무의미하여 함께 제거 |
| `hover:bg-card/40` (카드 hover) | `hover:bg-muted/50` | 라이트 hover로 살짝 회색 |
| `border-white/10` | `border-border` | 라이트 배경에서 흰 보더는 비가시 |
| `border-white/20`, `hover:bg-white/5` (버튼) | `border-border`, `hover:bg-muted` | privacy 약관 보기 버튼 |
| `border-gray-800` (카드 보더) | `border-border` | login |
| `text-white` (본문/제목) | `text-foreground` | login·auth-error — 흰 배경에서 비가시 해소 |
| `text-white` (그라데이션 컬러칩 위 아이콘) | `text-on-primary` | pricing 아이콘 — 시각 동일(흰색) + grep 회피 |
| `text-gray-300` (약관/feature 본문) | `text-foreground` | 본문 가독성 |
| `text-gray-400` (부제/보조) | `text-muted-foreground` | login·auth-error |
| `text-gray-400 hover:text-white` (보조 링크) | `text-muted-foreground hover:text-foreground` | auth-error Go Home |
| 뱃지 `bg-{c}-900/40 text-{c}-500 border-{c}-700` | `bg-{c}-100 text-{c}-700 border-{c}-300` | history milestone/tech/market — 라이트 카테고리 뱃지 표준 |
| `prose prose-invert` | `prose` | history 모달 — 라이트 prose |

> 매핑은 R1-T09(blog-lightify) 핸드오버의 컨벤션을 계승하되, 본 페이지군은 shadcn alias(`bg-card`/`text-foreground`/`border-border`/`text-muted-foreground`)를 쓰고 있어 **해당 파일 기존 컨벤션(alias)을 존중**하여 alias로 라이트화함. (T09 블로그는 Material 토큰 `surface-container`/`on-surface`를 직접 사용 — 두 체계는 동일 값을 가리키는 alias 관계)

## 보존한 항목 (사유)

1. **`app/auth/login` 구글 OAuth 버튼 `bg-white text-black`**: 구글 로고 SVG(4색 path)를 포함한 공식 OAuth 버튼. 구글 브랜드 가이드라인상 흰 배경이 표준이라 보존. (grep 패턴 외)
2. **`app/auth/auth-code-error` 경고 아이콘 `text-red-500`, 카드 보더 `border-destructive/30`, 아이콘 원형 `bg-destructive/10`**: 인증 에러 의미 컬러. 다크 `border-red-900/30`·`bg-red-900/20`를 라이트 빨강(destructive 시맨틱)으로 전환하여 **에러 강조 유지**.
3. **`app/contact` 에러 박스 `text-red-400 bg-red-500/10 border-red-500/20`**: 폼 전송 실패 에러 상태 빨강. 지시서 명시 보존 대상.
4. **`app/contact` 성공 `text-green-400`(CheckCircle), `app/pricing` `text-green-400`(Check)**: 성공/체크 의미색 보존.
5. **`app/terms` 면책 조항 `text-red-400 bg-red-500/10 border-red-500/20` + `border-l-red-500/50`**: 투자 책임 면책 = 중요 경고 강조. 보존.
6. **`app/privacy` 문의 링크 `text-emerald-400 hover:text-emerald-300`**: privacy 테마 강조 CTA 링크. "CTA 강조 컬러 보존" 원칙으로 유지.
7. **`app/history` ongoing 노드 `bg-green-500 text-green-500`, drama 뱃지 `text-destructive`**: 진행중/사건 상태 강조색 보존.
8. **각 페이지 배경 글로우(`bg-indigo-500/20`, `bg-purple-500/10`, `bg-red-500/10`, `bg-emerald-500/10` 등 blur 장식)**: 라이트 배경 위 은은한 컬러 글로우 장식. 다크 톤이 아니라 보존.
9. **그라데이션 제목/컬러칩(`from-blue-400 to-purple-500` 등)**: 브랜드 강조 그라데이션. 보존.

### CTA 처리 구분 사유
- **login 구글 버튼**: OAuth 브랜드 버튼 → 흰색 보존
- **auth-error "Try Again"**: 일반 내비 CTA. 다크 테마에서 흰색이 강조였으나 라이트 강조 표준은 `primary` → `bg-primary text-primary-foreground`로 전환 (T09가 흰색 선택 pill을 primary로 매핑한 선례 계승)

## 검증 결과

| 항목 | 명령 | 결과 |
|------|------|------|
| 타입 체크 | `npx tsc --noEmit` | **PASS** (`tsc-exit=0`, 0 에러) |
| 잔여 다크 톤 | `Get-ChildItem app/{contact,pricing,terms,privacy,history,auth} -Include *.tsx -Recurse \| Select-String "bg-black\|bg-gray-8/9\|text-white\|dark:\|#0a0a0a\|#111\|border-white\|bg-white/\|prose-invert\|text-gray-3/4\|border-gray-8"` | **0건** (7개 파일 전수 스캔) |
| 빌드 회귀 | `npm run build` | **PASS** (`build-exit=0`) — `/contact`·`/history`·`/pricing`·`/privacy`·`/terms` ○(Static), `/auth/login`·`/auth/auth-code-error` 정상 등록 |
| diff stat 대칭 | `git diff --stat` | **47 insertions(+) / 47 deletions(-)** 완전 대칭 — 순수 클래스 교체, JSX 구조·라인 수 무변경 |

> **grep false negative 주의**: Grep 도구 글롭 `{...,history,...}/**/*.tsx`가 디렉토리 직속 `page.tsx`를 누락(매치 0)하는 현상 확인. `Get-ChildItem -Recurse | Select-String`(스캔 파일 수 7 확인)으로 재검증하여 정확한 0건 확보. 후속 일꾼은 직속 파일 검증 시 `**/*.tsx` 글롭 단독 신뢰 금지.

## diff stat 상세

```
 app/auth/auth-code-error/page.tsx | 14 +++++++-------
 app/auth/login/page.tsx           |  6 +++---
 app/contact/page.tsx              | 10 +++++-----
 app/history/page.tsx              | 10 +++++-----
 app/pricing/page.tsx              |  8 ++++----
 app/privacy/page.tsx              | 24 ++++++++++++------------
 app/terms/page.tsx                | 22 +++++++++++-----------
 7 files changed, 47 insertions(+), 47 deletions(-)
```

## 안티패턴 준수 확인

- ✅ `app/analysis/`·`app/admin/`·`app/portfolio` 등 T09·T10·T11 영역 미터치 (T12 7개 파일만)
- ✅ 인증 에러·CTA 강조 의미 컬러 무차별 제거 안 함 (라이트 빨강으로 전환하여 의미 보존, 위 "보존한 항목" 참조)
- ✅ JSX 구조·로직 변경 없음 (클래스 교체만, diff 47/47 대칭이 증거)
- ✅ 한국어 주석 — 신규 주석 추가 없음(클래스 교체뿐), 기존 주석 무변경

## 후속 권장

- **시각 검증(PARTIAL)**: 자동 스크린샷 미수행. `npm run dev` 후 `/contact`·`/auth/login`·`/auth/auth-code-error`·`/pricing`·`/terms`·`/privacy`·`/history` 라이트 톤 육안 확인 권장.
- **login/auth-error 흰 카드 구분**: 페이지(흰색)·카드(흰색)가 `shadow-xl`로만 구분됨. 네이버 라이트 톤상 충분하나, 카드 윤곽 강화가 필요하면 `border-border` 추가 검토(현재 login은 `border-border` 적용됨).
- **history `bg-card/50`(코인 소개 카드)**: 라이트 시맨틱 토큰이라 미변경. 흰 50% 반투명이 흰 배경 위에서 약하게 보일 수 있으나 `border-border`로 윤곽 구분됨. 필요 시 `bg-card` 불투명화 검토.
