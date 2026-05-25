---
title: DB 의존 E2E 테스트 신뢰성 — 시드 부재 데이터 자체 생성 + 네트워크 응답 확정
date: 2026-05-25
session: 30
tags: [e2e, playwright, test-reliability, false-positive, seed-data, waitForResponse]
category: pattern
confidence: high
---

## 문제

R4/T04 커뮤니티 E2E에서 L-B4(댓글 추천)가 **운영 DB 적용 후에도 실패**(30s timeout). L-B3(댓글 작성)는 통과하는데 L-B4만 실패하는 모순. error-context 스냅샷: 진입한 게시글(공지글)의 "댓글 0개", "첫 댓글을 남겨보세요", 등록 버튼 disabled.

```
Error: locator.innerText: Test timeout of 30000ms exceeded.
  waiting for locator('section').filter({ hasText: '댓글' }).getByRole('button').filter({ hasText: /^\d+$/ }).first()
```

## 원인

- 시드(`scripts/seed-community.ts`)는 **게시글 156행만** 적재하고 **댓글은 0행**. 따라서 어느 게시글을 열어도 추천 대상(ThumbsUp 버튼)이 없어 `thumb.innerText()`가 timeout.
- L-B4는 L-B3와 **독립 테스트**라 L-B3가 만든 댓글에 의존할 수 없음(게다가 `firstPostRow`가 공지글을 열면 댓글 0).
- 추가로 L-B3는 낙관적 UI(`setComments`)로 "visible" 통과하나 실제 DB 저장은 검증하지 않음 → false positive 소지(세션 29에서 직접 curl로 백엔드 정상은 확인됨 — 즉 앱 버그가 아니라 **spec 신뢰성** 문제).

## 해결

- **추천/댓글 대상을 테스트가 자체 생성**: L-B4가 댓글을 먼저 작성(고유 본문 `E2E 추천대상 ${Date.now()}`)한 뒤 그 댓글 `li`를 필터해 ThumbsUp을 추천. 시드 댓글 유무와 무관하게 결정적.
- **네트워크 응답으로 확정**: 등록·추천 클릭을 `Promise.all([page.waitForResponse(...), click])`로 묶어 POST `201`·PATCH 응답을 확인 → 낙관적 UI false positive 차단.

```ts
const [res] = await Promise.all([
  page.waitForResponse((r) => r.url().includes("/api/community/comment") && r.request().method() === "POST"),
  page.getByRole("button", { name: "등록" }).click(),
]);
expect(res.status()).toBe(201);
```

- **테스트 데이터 정리**: E2E가 생성한 댓글(content `E2E ` prefix)은 실행 후 Management API로 일괄 삭제(`DELETE FROM community_comments WHERE content LIKE 'E2E %'`, comment_likes는 FK ON DELETE CASCADE). 잔여 0 확인.

결과: 전체 E2E 29 passed / 0 failed / 1 skipped(AD1, 관리자 storageState 미구성).

## 교훈

- **DB 의존 E2E는 자기 데이터를 자급**해야 한다 — 시드에 없는 종속 엔티티(댓글)에 의존하면 비결정적으로 깨진다.
- 낙관적 UI 컴포넌트의 E2E는 visible만으로 통과시키지 말고 **네트워크 응답(2xx)을 확정**해야 false positive를 막는다.
- 운영 DB에 쓰는 E2E는 **고유 마커 + 실행 후 정리**(CASCADE 활용)로 잔여를 남기지 않는다.
- 실패의 귀속을 분리하라 — "앱 버그 vs 테스트 신뢰성"은 직접 API 호출(curl)·DB 조회로 빠르게 판정(세션 29 [[supabase-management-api-migration]] §3과 연결).

## 관련 파일
- `e2e/community-board.spec.ts` (L-B3/L-B4)
- `docs/e2e/R4-scenarios.md`
- `scripts/seed-community.ts` (게시글만 시드 — 댓글 미시드)
- `docs/solutions/2026-05-25-supabase-management-api-migration.md` (§3 E2E false positive 선행 기록)
