---
title: Playwright 인증 setup의 collection 타이밍 함정 + service_role magiclink fallback
date: 2026-05-25
session: 32
tags: [playwright, e2e, supabase-auth, magiclink, generateLink, verifyOtp, storageState, ci]
category: pattern
confidence: high
---

## 문제
관리자 인증이 필요한 E2E(AD1)를 `dependencies:['setup']` + storageState로 구성했는데 두 가지 벽:
1. 비밀번호 없는 **Google OAuth 전용** 관리자 계정으로 어떻게 세션을 만들 것인가.
2. `--project=admin` **fresh 실행** 시 setup은 성공하는데 AD1이 항상 skip된다(마커가 이미 있던 재실행에서만 우연히 통과).

## 원인
1. (인증) `app/auth/login`이 OAuth 전용이라 UI/비번 로그인 불가.
2. (skip) AD1 활성 조건 `RUN_AD1`이 spec **모듈 top-level**에서 평가됨. playwright의 **test collection은 모든 프로젝트 실행보다 먼저 1회** 일어나므로, dependencies로 setup이 먼저 돌더라도 collection 시점엔 `e2e/.auth/admin.ready` 마커가 아직 없어 `test.skip(!RUN_AD1)`이 비활성으로 굳어진다. → CI fresh 첫 회 항상 skip되는 결함.

## 해결
1. **service_role magiclink fallback** (비번 불요): `auth.admin.generateLink({type:'magiclink', email})` → `data.properties.hashed_token` → `@supabase/ssr` `createServerClient`(쿠키 jar 어댑터)로 `verifyOtp({token_hash, type:'magiclink'})` → `setAll` 콜백이 인증 쿠키를 캡처(`sb-<ref>-auth-token.0/.1`, `signInWithPassword`와 동일 청크 포맷). storageState로 저장. CI는 `E2E_ADMIN_EMAIL`+`SUPABASE_SERVICE_ROLE_KEY`+`E2E_DB_READY=1` secret만 주입.
2. **런타임 평가 전환**: `const RUN_AD1 = ...`(top-level) → `const runAd1 = () => ...`(함수). `beforeAll`에 `if (!runAd1()) return` 가드 + test 본문 첫 줄 `test.skip(!runAd1(), ...)`. setup(dependency) 완료 후 시점이라 `admin.ready` 존재 → fresh 1회 실행으로 활성.

검증: `admin.ready` 삭제 후 비번 미주입 `--project=admin` 1회 → setup+AD1 **2 passed**. env 미주입 시 graceful skip 회귀 보존.

## 교훈
- playwright에서 **파일/외부 마커 존재에 의존하는 skip 판정은 반드시 런타임(beforeAll/test)** 에서 한다. top-level 평가는 collection이 setup 의존성보다 앞서 항상 비활성된다 — "재실행하면 통과"는 마커 잔여에 의한 착시다.
- OAuth 전용 계정 E2E는 service_role `generateLink`+`verifyOtp`로 비번 없이 세션 발급. type은 추측 말고 운영 DB로 실측해 `'magiclink'` 확정.

## 관련 파일
- `e2e/auth.setup.ts`
- `e2e/community-admin-auth.spec.ts`
- `e2e/playwright.config.ts`
