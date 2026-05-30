# R13 T-C — AuthButton 계정 드롭다운 인수인계

> 일꾼 터미널 T-C / R13 display-rollout Wave1 / 2026-05-30

## 1. 작업 개요

헤더 우측 `AuthButton`이 로그인 사용자에게 **인라인 아이콘 4종(관리자·설정·아바타·로그아웃)을 일렬로** 노출하던 평평한 구조를, **아바타 클릭 → 계정 드롭다운 메뉴**로 재구성. 진입 경로는 삭제 없이 전부 드롭다운으로 이전했고, R12 watchlist 진입점을 메뉴에 신규 추가.

`components/global-header.tsx`는 미수정(AuthButton을 import만 하며 드롭다운은 AuthButton 내부에서 완결).

## 2. 수정/신규 파일

| 파일 | 구분 | 변경 요약 |
|------|------|-----------|
| `components/account/AccountMenu.tsx` | **신규** | 드롭다운 본체. 트리거(아바타+이름+chevron pill) + 메뉴(헤더/항목/구분선/로그아웃). 외부클릭·키보드·aria 완비 |
| `components/AuthButton.tsx` | 수정 | 로그인 블록의 인라인 아이콘 4종 → `<AccountMenu user={user} onLogout={handleLogout} />`로 교체. 비로그인 Login 버튼·`handleLogout`·`useState/useMemo/useEffect` 구조 등 기존 그대로 |

- `AuthButton.tsx`: 109줄 → 약 60줄. `Link` import는 비로그인 Login 버튼에서 계속 사용되어 유지.

## 3. 메뉴 항목 최종 구성 (위→아래)

1. **내 포트폴리오** → `/portfolio` (차트 아이콘)
2. **관심종목** → `/watchlist` (별 아이콘 — R12 watchlist 연결, 신규 진입점)
3. **설정** → `/settings` (톱니 아이콘)
4. **(조건부) 관리자** → `/admin` (방패 아이콘, `text-red-500`) — `user.email === 'smartkdy7@gmail.com'`일 때만. **하드코딩 이메일 조건 그대로 유지**(권한 체계 변경은 범위 밖)
5. 구분선(`role="separator"`)
6. **로그아웃** → 기존 `handleLogout`(`supabase.auth.signOut()` + `router.refresh()`)

드롭다운 헤더에 사용자 **이름 + 이메일** 표시. 트리거 pill은 아바타(이니셜 원형) + (md 이상)이름 + 회전 chevron.

## 4. 접근성 처리

- **트리거 버튼**: `aria-haspopup="menu"`, `aria-expanded={isOpen}`, `aria-controls={menuId}`(`useId`로 고유 id).
- **메뉴 컨테이너**: `role="menu"`, `aria-label="계정 메뉴"`. 각 링크/로그아웃은 `role="menuitem"`.
- **roving tabindex**: 활성 항목만 `tabIndex=0`, 나머지 `-1`. 키보드로 열면(`ArrowDown`/`ArrowUp`) 해당 항목으로 자동 포커스(`useEffect`).
- **키보드**: 트리거에서 `ArrowDown`(첫 항목)/`ArrowUp`(마지막 항목)으로 열기 / 메뉴 내 `ArrowDown`·`ArrowUp`(순환)·`Home`·`End` 이동 / `Escape` 닫고 트리거로 포커스 복귀 / `Tab` 시 메뉴 닫고 자연 포커스 흐름.
- **바깥 클릭**: 열렸을 때만 `document` `pointerdown` 리스너 등록(`containerRef.contains`로 내부 판별), cleanup 포함.
- **모바일**: 트리거 이름은 `hidden md:block`, 메뉴는 `absolute right-0`로 화면 우측 정렬, `w-60` 고정폭.
- 장식 svg는 전부 `aria-hidden="true"`.

## 5. 네이버 톤 / 디자인 토큰

- 본문 토큰만 사용: `surface-container`·`surface-container-high`·`outline-variant`·`on-surface`·`on-surface-variant`·`primary`.
- `text-white`는 그라데이션 아바타(`from-blue-500 to-purple-500`) 위 의도색에만 사용(다크 잔재 아님). 메뉴 본문은 `on-surface` 계열.
- 드롭다운: 흰 배경(`surface-container`) + `outline-variant` 보더 + `shadow-xl` + `rounded-2xl`, 진입 애니메이션(`animate-in fade-in slide-in-from-top-1`).

## 6. 검증 결과 (모두 PASS)

```
npx tsc --noEmit                                          # exit 0
npx eslint components/AuthButton.tsx components/account/  # exit 0 (신규 포함)
npm run build                                             # exit 0 (전 라우트 green)
```

- 빌드 1차 시도는 `.next/lock` 충돌(다른 일꾼 터미널 동시 빌드)로 실패 → 락 해제 후 재시도하여 정상 통과. `/watchlist`·`/portfolio`·`/settings` 모두 빌드 산출물에 포함 확인.

## 7. 기존 동작 회귀 0 확인 방법

- **로그아웃**: 기존 `handleLogout`을 그대로 `onLogout` prop으로 전달 — 동작 동일.
- **관리자 조건**: `user.email === 'smartkdy7@gmail.com'` 비교 로직 유지(상수 `ADMIN_EMAIL`로 명명만).
- **설정/포트폴리오 라우트**: `/settings`·`/portfolio` href 유지, 추가로 `/watchlist` 신설.
- **비로그인 Login 버튼**: 미변경.
- 진입 경로는 삭제 없이 드롭다운으로 **이전만** 했고, watchlist만 신규 추가.

## 8. 미해결 / 후속 제안

- **알림 뱃지**: 트리거 아바타에 미확인 알림 카운트 뱃지 슬롯(향후 알림 시스템 연동 시).
- **아바타 이미지**: 현재 이메일 첫 글자 이니셜. `user.user_metadata.avatar_url` 있을 시 이미지 표시로 확장 가능.
- **권한 체계**: 관리자 판별이 여전히 이메일 하드코딩 — 별도 라운드에서 role 기반(RLS/claims)으로 전환 권장(본 라운드 범위 밖).
- **focus trap**: 현재 roving tabindex + Tab-닫기로 충분하나, 엄격한 모달형 trap이 필요하면 후속 보강 가능.
