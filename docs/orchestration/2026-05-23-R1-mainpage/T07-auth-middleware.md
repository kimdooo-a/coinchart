# T07 — auth-middleware

> **본 터미널은 R1 일꾼(T07)**. 1차 발사 (의존 없음).

## 정체성

- 역할: `worker` (T07), R1, mainpage
- 담당: 익명 작성 bcrypt + IP 마스킹 헬퍼 + Next.js middleware
- T12(board API)가 본 산출물에 의존

## 컨텍스트

코인판식 익명+회원 혼용 작성 모델은 다음 3가지 인프라가 필요:
1. **bcrypt 해시/검증** — 익명 작성 시 비밀번호 저장
2. **IP 마스킹** — `X-Forwarded-For`에서 앞 2옥텟만 추출 (`211.34.*.*`)
3. **middleware.ts** — `/board/*/write`, `/api/board/*`, `/api/community/*` 경로에 IP 헤더 주입 (`x-client-ip-masked`)

bcrypt는 `bcryptjs` 패키지 사용 (네이티브 컴파일 회피, Vercel/Next.js 호환).

## 공통 SOT

```
CLAUDE.md
docs/PROJECT_DIRECTION.md           §3 — 작성 권한 모델
docs/references/_ENV_REFERENCE.md
docs/references/_TYPE_REFERENCE.md
package.json                         ← bcryptjs 설치 여부 확인 (Read만, 수정 금지)
```

## 작업 목표

1. `lib/community/auth.ts` — bcrypt 해시/검증 함수
2. `lib/community/ip-mask.ts` — IP 마스킹 + 해시 함수
3. `middleware.ts` (프로젝트 루트) — 요청 헤더 가공
4. references append

## 산출물

#### 1. `lib/community/auth.ts`

```ts
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export async function hashGuestPassword(plain: string): Promise<string> {
  if (!plain || plain.length < 4) throw new Error("password must be at least 4 chars");
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyGuestPassword(plain: string, hash: string): Promise<boolean> {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}

export function validateGuestNickname(nickname: string): { ok: boolean; reason?: string } {
  if (!nickname) return { ok: false, reason: "닉네임 필수" };
  if (nickname.length < 2 || nickname.length > 12) return { ok: false, reason: "닉네임 2~12자" };
  return { ok: true };
}
```

#### 2. `lib/community/ip-mask.ts`

```ts
import crypto from "node:crypto";

const IP_HASH_SECRET = process.env.IP_HASH_SECRET ?? "default-secret-change-me";

export function extractClientIp(req: { headers: Headers } | Request): string {
  const headers = "headers" in req ? req.headers : new Headers();
  const xff = headers.get("x-forwarded-for") ?? "";
  const real = headers.get("x-real-ip") ?? "";
  const ip = (xff.split(",")[0] ?? "").trim() || real || "0.0.0.0";
  return ip;
}

export function maskIp(ip: string): string {
  const parts = ip.split(".");
  if (parts.length !== 4) return "0.0.*.*";
  const [a, b] = parts;
  return `${a}.${b}.*.*`;
}

export function hashIp(ip: string): string {
  return crypto.createHmac("sha256", IP_HASH_SECRET).update(ip).digest("hex");
}
```

#### 3. `middleware.ts` (프로젝트 루트, 신규)

```ts
import { NextResponse, type NextRequest } from "next/server";
import { extractClientIp, maskIp, hashIp } from "@/lib/community/ip-mask";

const TARGET_PATHS = [
  "/board",
  "/api/board",
  "/api/community",
];

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (!TARGET_PATHS.some((p) => path.startsWith(p))) {
    return NextResponse.next();
  }
  const ip = extractClientIp(req);
  const headers = new Headers(req.headers);
  headers.set("x-client-ip", ip);
  headers.set("x-client-ip-masked", maskIp(ip));
  headers.set("x-client-ip-hash", hashIp(ip));
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/board/:path*", "/api/board/:path*", "/api/community/:path*"],
};
```

#### 4. `docs/references/_ENV_REFERENCE.md` (append)

```markdown
### IP_HASH_SECRET (R1 2026-05-23)
- 익명 게시글 추천 dedup용 IP 해시 비밀키
- 미설정 시 default-secret-change-me 사용 (운영 환경 필수 설정)
```

#### 5. `docs/references/_TYPE_REFERENCE.md` (append)

```markdown
### auth · ip-mask 모듈 (R1 2026-05-23)
- `hashGuestPassword(plain)`, `verifyGuestPassword(plain, hash)`
- `extractClientIp(req)`, `maskIp(ip)`, `hashIp(ip)`
- 미들웨어가 주입하는 헤더: `x-client-ip`, `x-client-ip-masked`, `x-client-ip-hash`
```

## 작업 단계

1. SOT 읽기
2. `package.json` Read해서 `bcryptjs` 설치 여부 확인
   - 미설치 시 handover의 "미해결" 섹션에 명시 (`npm install bcryptjs @types/bcryptjs`)
   - 본 일꾼은 package.json 수정 권한 없음
3. 5개 파일 작성
4. 검증

## 검증

```bash
npx tsc --noEmit

# bcryptjs 호출 가능 여부
node -e "require('bcryptjs')" 2>&1 | head -3

# IP 마스킹 단위 검증
npx tsx -e "import('./lib/community/ip-mask').then(m => { console.log(m.maskIp('211.34.123.45')); })"
# 기대 출력: 211.34.*.*

# auth 해시 검증
npx tsx -e "import('./lib/community/auth').then(async m => { const h = await m.hashGuestPassword('test1234'); console.log('hash', h.slice(0,20), 'verify', await m.verifyGuestPassword('test1234', h)); })"

# ESLint
npx eslint lib/community/auth.ts lib/community/ip-mask.ts middleware.ts 2>&1 | tail -5
```

## 완료 신호

`docs/handover/2026-05-23-R1-T07-auth-middleware.md` 작성.

명시:
- bcryptjs 패키지 설치 필요 여부 (PARTIAL 가능)
- middleware matcher 경로 (T12가 의존)
- T12가 사용할 헤더 이름 (`x-client-ip-masked`, `x-client-ip-hash`)
- IP_HASH_SECRET 환경변수 추가 권장

## 안티패턴

- `package.json` 수정 금지 (`allowed_dirs` 외)
- `app/api/board/` 또는 `app/api/community/` 라우트 작성 금지 (T12 영역)
- 회원 인증 플로우 (`@/lib/supabase/auth-helpers`) 수정 금지 — 본 일꾼은 익명만 다룸
- 데이터베이스 작업 금지
