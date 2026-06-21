---
title: 핸드오버에 기록된 prod URL이 무관한 앱을 서빙 — 배포 검증은 지상진실로
date: 2026-06-21
session: 55
tags: [vercel, deployment, verification, prod-url, ground-truth, smoke-test]
category: tooling
confidence: medium
---

## 문제

세션 55에서 신규 라우트(`/api/calendar`·`/api/price`·`/calendar`)와 상승확률 헤더를 배포 후 실환경 스모크하려고 핸드오버상 프로덕션 URL인 `https://coinchart.vercel.app/api/calendar`를 호출했더니, 이 Next.js 프로젝트가 아닌 **무관한 create-react-app("React App", `main.<hash>.js`, "Web site created using create-react-app")**이 HTTP 200으로 반환됐다. `/api/price`도 동일하게 CRA index.html. Next 라우트가 존재하지 않음.

## 원인

세션 40(2026-05-30) 시점엔 `coinchart.vercel.app`이 이 앱을 서빙했고("R12 라우트 반영" 기록), 그 사실이 이후 핸드오버에 계속 전사(transcribe)됐다. 그러나 그 사이 **해당 Vercel 도메인이 다른 프로젝트(CRA)로 재할당**됐거나 이 레포가 다른 도메인으로 배포되도록 바뀌었다. 핸드오버는 "그때 참이었던" 스냅샷이지 현재 상태가 아니다 — 누구도 재검증하지 않아 stale 가정이 수 세션 누적됐다.

## 해결

- **배포 검증은 핸드오버 URL을 신뢰하지 말고 지상진실로**: 실제 응답 바디를 확인(`curl ... -w "HTTP %{http_code}"` + 본문 일부). CRA 마커(`create-react-app`)·Next 마커(`__next`, 라우트 존재) 등 앱 정체성을 직접 식별.
- 도메인이 틀렸으면 **"prod 검증 완료"라고 단언 금지**. "git push·로컬 `npm run build` EXIT 0까지 검증, 실환경 미확인(도메인 불명)"으로 정직 보고하고 사용자에게 실제 도메인 확인 요청.
- 코드 게이트(tsc/eslint/vitest/build)와 배포 게이트(실 도메인 스모크)를 **분리해서 보고** — 전자 통과가 후자를 의미하지 않는다.

## 교훈

- 핸드오버에 적힌 URL·엔드포인트·인프라 상태는 "작성 시점 스냅샷". 실행 전 1회 실측이 수 세션 누적 stale을 끊는다(같은 세션에서 `npm run lint` "eslint 0" 주장도 실측으로 깨졌다 — [[eslint-baseline-discrepancy]] 패턴 동형).
- "증거 우선": 단언하기 전에 실제 응답/출력을 본다. 200 OK ≠ 내 앱이 응답함.

## 관련 파일
- 메모리: `prod-url-coinchart-vercel-stale`, `eslint-baseline-discrepancy`
- `docs/handover/2026-06-21-session55-rc-rd-audit-closure.md`
