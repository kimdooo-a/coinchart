# R1 T07 — 익명 bcrypt + IP 마스킹 + middleware (Handover)

> 작성일: 2026-05-23
> 일꾼: T07 (R1, mainpage)
> 상태: **PARTIAL** (bcryptjs 미설치 — 패키지 추가 필요, 코드 완료)

---

## 1. 완료 산출물

| 파일 | 상태 | 비고 |
|------|------|------|
| `lib/community/auth.ts` | ✅ 신규 작성 | bcrypt 해시/검증, 닉네임 검증 |
| `lib/community/ip-mask.ts` | ✅ 신규 작성 | IP 추출/마스킹/HMAC 해시 |
| `middleware.ts` | ✅ 머지 수정 | 기존 supabase 세션 로직 보존 + IP 헤더 주입 추가 |
| `docs/references/_ENV_REFERENCE.md` | ✅ append | `IP_HASH_SECRET` 추가 |
| `docs/references/_TYPE_REFERENCE.md` | ✅ append | auth · ip-mask 모듈 + 헤더 명세 추가 |

---

## 2. 미해결 — bcryptjs 설치 필요 (PARTIAL 사유)

**현재 `package.json`에 `bcryptjs` 미포함.** 본 일꾼은 `package.json` 수정 권한이 없어 코드만 작성.

### 메인 터미널이 수행할 작업
```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

설치 후 즉시 `lib/community/auth.ts` 컴파일 통과 (현재 TS2307 1건 발생 중).

---

## 3. 검증 결과

### IP 마스킹 (✅ 통과)
```
maskIp("211.34.123.45") = "211.34.*.*"
maskIp("invalid")        = "0.0.*.*"
hashIp("1.2.3.4")        → 64자 hex (HMAC-SHA256)
```

### TypeScript (⚠️ bcryptjs 1건만 에러)
```
lib/community/auth.ts(3,20): error TS2307: Cannot find module 'bcryptjs'
```
- `ip-mask.ts`, `middleware.ts` 컴파일 통과
- bcryptjs 설치 시 즉시 해결

### ESLint (✅ 0 errors)
- 신규 파일 3종 모두 에러 없음
- middleware.ts에 기존 warning 1건 잔존 (`options is defined but never used` — supabase cookies.setAll, 본 작업과 무관)

### bcryptjs require 테스트 (❌ MODULE_NOT_FOUND, 예상됨)
- 설치 후 재검증 필요

---

## 4. T12(board API)가 의존할 인터페이스

### 4-1. middleware가 주입하는 헤더 (T12 라우트 핸들러가 소비)
| 헤더 | 값 예시 | 용도 |
|------|---------|------|
| `x-client-ip` | `211.34.123.45` | 원본 IP (서버 로깅 전용, DB 저장 금지) |
| `x-client-ip-masked` | `211.34.*.*` | 게시글 화면 표시 + DB `guest_ip_masked` 컬럼 |
| `x-client-ip-hash` | `<64-hex>` | 추천 dedup (`community_post_likes.ip_hash`) |

### 4-2. middleware matcher (T12 라우트가 이 경로 아래에 위치해야 IP 헤더 수신)
```ts
matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|auth/).*)',  // 기존
    '/api/board/:path*',          // T12 board API
    '/api/community/:path*',      // T12 community API (추천/댓글 등)
]
```

### 4-3. T12 라우트에서 헤더 읽기 패턴
```ts
// app/api/board/[slug]/route.ts
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const ipMasked = req.headers.get("x-client-ip-masked") ?? "0.0.*.*";
  const ipHash   = req.headers.get("x-client-ip-hash")   ?? "";
  // ... guest_ip_masked, ip_hash로 INSERT
}
```

### 4-4. T12에서 사용할 auth 헬퍼
```ts
import {
  hashGuestPassword,
  verifyGuestPassword,
  validateGuestNickname
} from "@/lib/community/auth";

// 익명 작성 INSERT 전
const nickCheck = validateGuestNickname(body.nickname);
if (!nickCheck.ok) return Response.json({ error: nickCheck.reason }, { status: 400 });
const guest_password_hash = await hashGuestPassword(body.password);
```

---

## 5. 환경변수 추가 권장 (운영 배포 전 필수)

`.env.local` / Vercel 환경변수에 추가:
```
IP_HASH_SECRET=<32바이트 이상 랜덤 문자열>
```
- 미설정 시 `default-secret-change-me` 사용되어 dedup 보안 취약
- 추천: `openssl rand -hex 32`

---

## 6. middleware 머지 결정 사항

기존 `middleware.ts`는 Supabase 세션 새로고침 + 보호 경로 리다이렉트 로직 보유. 본 작업에서 **다음 원칙으로 머지**:

1. **IP 헤더 주입을 supabase 로직 앞에 배치** — IP_INJECT_PATHS(`/board`, `/api/board`, `/api/community`)에 매칭 시 헤더 3종 주입
2. **`/api/` 경로는 supabase 세션 새로고침 스킵** — 커뮤니티 API는 자체 인증(익명 password / 회원 토큰) 사용. supabase getUser 호출은 페이지 라우트에서만 필요
3. **matcher 확장** — 기존 페이지 라우트 매처 + `/api/board/:path*` + `/api/community/:path*` 추가
4. **기존 보호 경로(`/portfolio`, `/settings`, `/watchlist`, `/secure-memo`, `/admin`) 동작 보존**

### 회귀 위험
- 기존 페이지 라우트 동작은 변경 없음 (IP 주입은 `/board` 경로에서만 트리거)
- supabase `setAll` 콜백 내에서 `request.headers`가 아닌 `requestHeaders`(IP 주입된 사본)를 전달하도록 변경 — Supabase 쿠키 동작에 영향 없음 확인

---

## 7. 안티패턴 준수 확인

- ✅ `package.json` 수정 안 함 (handover에 설치 요청 명시)
- ✅ `app/api/board/`, `app/api/community/` 라우트 작성 안 함 (T12 영역)
- ✅ `lib/supabase/auth-helpers` 등 회원 인증 플로우 미터치
- ✅ DB 마이그레이션 / SQL 작업 없음

---

## 8. 다음 단계 (T12가 진행할 작업)

1. **선행**: 메인 터미널이 `npm install bcryptjs @types/bcryptjs` 실행
2. T12는 본 handover §4의 헤더 명세대로 `app/api/board/*`, `app/api/community/*` 라우트 작성
3. T12는 `lib/community/auth.ts` 헬퍼를 호출하여 익명 작성 INSERT 처리
4. (별도 일꾼) DB 스키마 `community_posts.guest_password_hash`, `guest_ip_masked` 컬럼 마이그레이션 생성

---

## 9. 파일 변경 요약 (diff 관점)

```
A  lib/community/auth.ts              (19 lines)
A  lib/community/ip-mask.ts           (23 lines)
M  middleware.ts                      (44 → 90 lines, IP 주입 로직 + matcher 확장)
M  docs/references/_ENV_REFERENCE.md  (+6 lines, IP_HASH_SECRET)
M  docs/references/_TYPE_REFERENCE.md (+15 lines, auth · ip-mask 섹션)
```
