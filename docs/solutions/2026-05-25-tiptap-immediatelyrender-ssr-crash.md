---
title: TipTap useEditor "SSR detected" 크래시 — immediatelyRender:false (+ 인증 뒤 페이지 E2E 공백)
date: 2026-05-25
session: 31
tags: [tiptap, nextjs, ssr, hydration, dynamic-import, e2e, blog-editor, admin]
category: bug-fix
confidence: high
---

## 문제

관리자 로그인 상태로 `/admin/board` 진입 시 페이지 전체가 클라이언트 사이드 예외로 크래시:

```
heading "Application error: a client-side exception has occurred while loading localhost"
```

콘솔 스택(probe로 캡처):
```
Tiptap Error: SSR has been detected, please set `immediatelyRender` explicitly to `false` to avoid hydration mismatches.
  at _EditorInstanceManager.getInitialEditor
  at useEditor
  at BlogEditor
```

- `/admin/board`는 `BlogEditor`를 `dynamic(() => import(...), { ssr: false })`로 마운트하는데도 발생.
- 결정적으로, **이 버그는 R6 이전까지 E2E로 한 번도 안 잡혔다** — 기존 관리자 E2E(S-AD1)는 *비로그인* 리다이렉트만 검증해 `/admin/board` 자체를 렌더하지 않았기 때문. R6에서 관리자 인증(storageState) AD1을 활성화하자 **처음 관리자 상태로 이 페이지를 렌더하며 즉시 적발**됐다.

## 원인

TipTap v2.5+ `useEditor`는 첫 렌더에서 에디터를 즉시 생성(`immediatelyRender` 기본 동작)하는데, SSR/하이드레이션 컨텍스트를 감지하면 **명시적 설정을 강제하기 위해 throw**한다. Next App Router에서는 `dynamic(ssr:false)`로 감싸도 컴포넌트 첫 렌더 경로에서 이 감지가 작동해 throw → React가 트리를 언마운트하고 "Application error"를 표시한다.

`BlogEditor`의 `useEditor({ extensions: [...] })`에 `immediatelyRender`가 없어 기본 throw 경로를 탔다. 같은 컴포넌트를 쓰는 blog 작성/편집(`/admin/blog/*`)에도 동일 버그가 잠재했다.

## 해결

`components/Blog/editor/BlogEditor.tsx`의 `useEditor`에 한 줄 추가:

```ts
const editor = useEditor({
  immediatelyRender: false, // SSR 감지 시 throw 방지(하이드레이션 미스매치 회피)
  extensions: [ ... ],
  ...
});
```

TipTap 공식 SSR 권장 설정. 별칭/토큰/레이아웃 영향 0, tsc 0·build green·blog 회귀 0으로 검증. AD1 재실행 시 `2 passed`.

## 교훈

1. **TipTap + Next App Router는 `immediatelyRender: false`가 사실상 필수**. `dynamic(ssr:false)`로 감싸도 useEditor 첫 렌더 throw를 막지 못한다.
2. **인증 뒤 페이지는 E2E 공백이 되기 쉽다**: 비로그인 리다이렉트만 검증하는 테스트는 보호된 페이지의 *렌더*를 절대 거치지 않는다. 관리자/로그인 storageState로 실제 페이지를 한 번이라도 렌더하는 테스트가 있어야 이런 런타임 크래시가 잡힌다. (E2E 커버리지를 "경로 도달"이 아니라 "렌더 성공"까지로 볼 것.)
3. 클라 예외 원인 확정은 error-context 스냅샷의 텍스트만으론 부족 — `page.on('pageerror')`로 콘솔 스택을 캡처하는 probe가 결정적이었다.

## 관련 파일
- `components/Blog/editor/BlogEditor.tsx` (수정)
- `e2e/community-admin-auth.spec.ts` (AD1 — 적발 경로)
- `app/admin/board/page.tsx` (크래시 발생 페이지, BlogEditor dynamic 마운트)
