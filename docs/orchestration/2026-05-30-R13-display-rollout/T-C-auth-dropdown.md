# T-C — AuthButton 계정 드롭다운 UX (R13 / display-rollout / Wave1)

> 이 문서는 자기완결 통합 프롬프트다. 정독 후 그대로 실행하라.

## 0. 정체성

너는 R13의 **일꾼 터미널 T-C**다. 지휘자가 아니다. 다른 일꾼(T-A1·T-A2·T-B)의 작업을 건드리지 마라. 너의 쓰기 영역은 **`components/AuthButton.tsx`·`components/account/`(신규 폴더)** 뿐이다. `components/global-header.tsx`는 AuthButton을 import만 하므로 **수정하지 마라**(드롭다운은 AuthButton 내부에서 완결).

## 1. 컨텍스트

- 프로젝트: `F:\11_dev\260523 코인 차트분석` (Next.js 16 App Router·TS strict·Tailwind v4·Supabase Auth)
- 헤더 우측 `AuthButton`이 로그인 사용자에게 **인라인 아이콘 4종을 일렬로** 노출 중: ⚙️관리자(조건부)·⚙️설정·🅰️포트폴리오(아바타)·로그아웃. 아이콘이 평평하게 나열돼 밀도가 높고 확장성이 없다.
- R12에서 설정 진입점(⚙️→`/settings`)이 추가됐다(taste #5). 본 라운드는 이를 **계정 드롭다운**으로 정리한다.

## 2. 현재 구현 (정독)

`components/AuthButton.tsx`(109줄). 로그인 시:
- `Welcome` + 이름 텍스트(md 이상)
- 관리자 버튼(`user.email === 'smartkdy7@gmail.com'`만 — 톱니 아이콘 → `/admin`)
- 설정 링크(⚙️ → `/settings`)
- 포트폴리오 아바타(이니셜 → `/portfolio`)
- 로그아웃 버튼(`supabase.auth.signOut()` + `router.refresh()`)
- 비로그인 시: Login 버튼(`/auth/login`)
- 이미 lint 정리됨(`useState<User|null>`·`useMemo(()=>createClient(),[])`·deps `[supabase]`) — 이 구조 유지.

## 3. 작업 목표

로그인 사용자의 인라인 아이콘 4종을 **아바타 클릭 → 계정 드롭다운 메뉴**로 재구성한다.

### 요구

- **트리거**: 아바타(이니셜 원형). 클릭 시 드롭다운 토글. 사용자 이름/이메일을 드롭다운 헤더에 표시.
- **메뉴 항목**(위→아래):
  1. 내 포트폴리오 → `/portfolio`
  2. 관심종목 → `/watchlist` (신규 추가 — 계정 메뉴에서 바로 진입, R12 watchlist와 연결)
  3. 설정 → `/settings`
  4. (조건부) 관리자 → `/admin` — `user.email === 'smartkdy7@gmail.com'`만. **현재 하드코딩 이메일 조건을 그대로 유지**(권한 체계 변경은 범위 밖).
  5. 구분선
  6. 로그아웃 → 기존 `handleLogout`
- **UX**: 바깥 클릭/Esc 닫기, 키보드 접근성(focus trap까지는 아니어도 `role="menu"`·`menuitem`·`aria-expanded`·화살표/Esc), 모바일 대응. 네이버 톤(흰 배경·`surface-container`·`outline-variant`·그림자). 비로그인 Login 버튼은 현행 유지.
- **신규 컴포넌트**: 드롭다운 본체를 `components/account/AccountMenu.tsx`(또는 유사)로 분리하고 `AuthButton`이 사용. 작은 규모면 AuthButton 내부 완결도 허용 — 단 가독성 우선.

### 원칙

- 외부 클릭 감지는 `useRef`+`mousedown`/`pointerdown` 리스너 또는 기존 프로젝트 패턴 재사용.
- 기존 동작(로그아웃·관리자 조건·설정/포트폴리오 라우트) 회귀 0. 진입 경로는 유지/이전만, 삭제 금지.
- 다크 잔재 금지(`text-white`는 그라데이션 아바타 위 의도색만 허용, 메뉴 본문은 `on-surface` 토큰).

## 4. 검증

```
npx tsc --noEmit                          # exit 0
npx eslint components/AuthButton.tsx components/account/   # error 0 (신규 포함)
npm run build                             # 가능하면 (헤더 전 페이지 영향 → green 확인)
```

## 5. 완료 신호

`docs/handover/2026-05-30-R13-T-C-auth-dropdown.md` 작성:
- 수정/신규 파일 + 변경 요약
- 메뉴 항목 최종 구성 + 접근성 처리(키보드·aria)
- 기존 동작 회귀 0 확인 방법
- 미해결/후속(예: 알림 뱃지·아바타 이미지 등)

## 6. 안티패턴

- `components/global-header.tsx`·다른 일꾼 영역 수정 금지
- 관리자 권한 조건(이메일 하드코딩) 변경 금지 — 범위 밖
- 기존 진입 경로(설정·포트폴리오·로그아웃) 삭제 금지 — 드롭다운으로 이전만
- 접근성 무시한 div-only 드롭다운 금지
- 검증 미실행 PASS 주장 금지
