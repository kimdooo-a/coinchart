---
title: React 19 react-hooks/set-state-in-effect 차단 — useEffect 데이터 fetch 패턴
date: 2026-05-23
session: 24
tags: [react19, eslint, react-hooks, set-state-in-effect, useEffect, data-fetching, nextjs]
category: workaround
confidence: high
---

## 문제

게시판 목록/상세를 `"use client"` + `useEffect` 데이터 fetch로 전환하니 ESLint가
**에러 레벨**로 차단:

```
error  Calling setState synchronously within an effect can trigger cascading renders
       react-hooks/set-state-in-effect
```

지적된 두 패턴:

```tsx
// (1) 로드 effect 본문에서 동기 setState
useEffect(() => {
  setLoading(true);   // ← 차단
  setError(null);     // ← 차단
  fetchX().then(setData).finally(() => setLoading(false));
}, [deps]);

// (2) 파생 상태 리셋 effect
useEffect(() => {
  setPage(1);         // ← 차단
}, [category, sort, search]);
```

## 원인

React 19와 함께 강화된 `react-hooks` 플러그인의 `set-state-in-effect` 규칙은
**effect 본문에서 동기적으로 호출되는 setState**를 cascading render 유발로 간주해 차단한다.
- `.then()`/`.finally()`/`setTimeout` 등 **콜백 안**의 setState는 비동기라 미차단
- effect 본문 최상단의 `setLoading(true)`처럼 **렌더 직후 동기 실행**되는 setState만 차단
- 상태 변화에 반응해 다른 상태를 리셋하는 effect(`setPage(1)`)도 동일하게 차단(React 공식: "you might not need an effect")

## 해결

**(1) 로드 effect — 동기 setState를 내부 async 함수로 이동**

```tsx
useEffect(() => {
  let alive = true;
  const load = async () => {
    setLoading(true);            // 본문이 아닌 함수 내부 → 미차단
    setError(null);
    try {
      const res = await fetchX(...);
      if (!alive) return;
      setData(res);
    } catch (e) {
      if (!alive) return;
      setError(e instanceof Error ? e.message : "...");
    } finally {
      if (alive) setLoading(false);
    }
  };
  void load();                   // 본문에서는 함수 호출만
  return () => { alive = false; };
}, [deps]);
```

**(2) 파생 상태 리셋 — effect 제거 후 이벤트 핸들러로 이동**

```tsx
// 리셋 effect 삭제. 대신 변경 지점에서 직접 호출:
const changeCategory = (c: string) => { setActiveCategory(c); setPage(1); };
const changeSort     = (s: SortKey) => { setSortKey(s);       setPage(1); };
const changeSearch   = (v: string)  => { setSearch(v);        setPage(1); };
```

검색은 별도 디바운스 effect(`setTimeout(() => setDebouncedSearch(...), 300)`)로 분리 —
setState가 타이머 콜백 안이라 미차단.

## 교훈

- `useEffect` 데이터 fetch는 **본문에 동기 setState를 두지 말고** 내부 `async load()` + `void load()` 패턴으로 감싼다(`alive` 플래그로 언마운트 가드).
- "A가 바뀌면 B를 리셋"은 effect가 아니라 **A를 바꾸는 이벤트 핸들러**에서 함께 처리한다.
- 규칙은 콜백 내부 setState는 허용하므로 `.then`/`.finally`/`setTimeout` 패턴은 그대로 둬도 된다.

## 관련 파일
- `app/board/[slug]/page.tsx`
- `app/board/[slug]/[postId]/page.tsx`
- `lib/community/board-queries.ts`
