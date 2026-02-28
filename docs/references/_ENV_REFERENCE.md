# Environment Variable Reference

> 프로젝트 환경변수 전체 인덱스
> 최종 업데이트: 2026-02-28

---

## 필수 변수 (Application)

| 변수명 | 필수 | Scope | 설명 | 사용 위치 |
|--------|------|-------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | **필수** | Public | Supabase 프로젝트 URL | `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`, `lib/supabaseAdmin.ts`, `middleware.ts`, `scripts/*` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **필수** | Public | Supabase 익명 키 (프론트엔드) | `lib/supabase/client.ts`, `lib/supabase/server.ts`, `middleware.ts`, `scripts/*` |
| `SUPABASE_SERVICE_ROLE_KEY` | **필수** | Private | Supabase 서비스 롤 키 (백엔드 전용) | `lib/supabase/admin.ts`, `lib/supabaseAdmin.ts`, `scripts/daily_cron.ts`, `scripts/weekly_cron.ts`, `scripts/seed_*.ts`, `scripts/check_*.ts` |
| `SUPABASE_URL` | **필수** | Private | Supabase URL (백엔드, `NEXT_PUBLIC_SUPABASE_URL`과 동일) | `scripts/preflight.ts` |

---

## 필수 변수 (CI/CD)

| 변수명 | 필수 | Scope | 설명 | 사용 위치 |
|--------|------|-------|------|----------|
| `VERCEL_TOKEN` | **필수** | CI | Vercel 배포 토큰 | GitHub Actions |
| `VERCEL_ORG_ID` | **필수** | CI | Vercel 조직 ID | GitHub Actions |
| `VERCEL_PROJECT_ID` | **필수** | CI | Vercel 프로젝트 ID | GitHub Actions |

---

## 선택 변수 (External APIs)

| 변수명 | 필수 | Scope | 설명 | 사용 위치 |
|--------|------|-------|------|----------|
| `TWELVEDATA_API_KEY` | 선택 | Private | TwelveData API 키 (주식 데이터) | `app/api/stock/quote/route.ts` |

---

## 선택 변수 (Google OAuth)

| 변수명 | 필수 | Scope | 설명 | 사용 위치 |
|--------|------|-------|------|----------|
| `NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID` | 선택 | Public | Google OAuth 클라이언트 ID | `.env.example` |
| `GOOGLE_OAUTH_CLIENT_SECRET` | 선택 | Private | Google OAuth 시크릿 | `.env.example` |
| `GOOGLE_OAUTH_REDIRECT_URI` | 선택 | Public | OAuth 리다이렉트 URI | `.env.example` |

---

## 선택 변수 (Contact / Email)

| 변수명 | 필수 | Scope | 설명 | 사용 위치 |
|--------|------|-------|------|----------|
| `CONTACT_EMAIL_TO` | 선택 | Private | 문의 수신 이메일 주소 (기본값: `smartkdy7@gmail.com`) | `app/api/contact/route.ts` |
| `CONTACT_EMAIL_USER` | 선택 | Private | SMTP 사용자 (발신 이메일) | `app/api/contact/route.ts` |
| `CONTACT_EMAIL_PASS` | 선택 | Private | SMTP 비밀번호 | `app/api/contact/route.ts` |

---

## 선택 변수 (Feature Flags)

| 변수명 | 필수 | Scope | 설명 | 사용 위치 |
|--------|------|-------|------|----------|
| `NEXT_PUBLIC_APP_MODE` | 선택 | Public | 앱 모드: `dev` (기본) / `staging` / `prod` | `lib/config/gates.ts` |
| `NEXT_PUBLIC_DISABLE_AUTOMATION` | 선택 | Public | `true`면 배치 작업 비활성화 (킬스위치) | `lib/config/gates.ts` |
| `NEXT_PUBLIC_DISABLE_PRO_GATE` | 선택 | Public | `true`면 Pro 티어 게이팅 비활성화 | `lib/config/gates.ts` |

---

## 선택 변수 (Monitoring / Analytics)

| 변수명 | 필수 | Scope | 설명 | 사용 위치 |
|--------|------|-------|------|----------|
| `SLACK_WEBHOOK_URL` | 선택 | CI | Slack 배포 알림 Webhook URL | GitHub Actions |
| `NEXT_PUBLIC_ANALYTICS_ID` | 선택 | Public | Google Analytics ID | `.env.example` |
| `NEXT_PUBLIC_ERROR_TRACKING_DSN` | 선택 | Public | 오류 추적 DSN (Sentry 등) | `.env.example` |
| `HEALTH_CHECK_URL` | 선택 | Private | 헬스체크 엔드포인트 (기본: `http://localhost:3000`) | `scripts/healthcheck.ts` |

---

## 내부 변수 (Node.js)

| 변수명 | 필수 | Scope | 설명 | 사용 위치 |
|--------|------|-------|------|----------|
| `NODE_ENV` | 자동 | Private | Node 환경 (`development` / `production`) | `app/auth/callback/route.ts` |
| `GITHUB_REF` | 자동 | CI | GitHub Actions 현재 ref | `scripts/release_body_from_changelog.ts`, `scripts/release_validate.ts` |

---

## 설정 파일 매핑

| 파일 | 용도 |
|------|------|
| `.env.local` | 로컬 개발 환경변수 (git 미추적) |
| `.env.example` | 환경변수 템플릿 (값 비어있음) |
| `docs/ENV_REQUIRED.md` | 환경변수 상세 설명 문서 |
| `lib/config/gates.ts` | Feature Flags 런타임 로직 |
| `scripts/preflight.ts` | 빌드 전 환경변수 검증 스크립트 |

---

## Scope 설명

- **Public** (`NEXT_PUBLIC_*`): 브라우저에 노출됨. 민감하지 않은 설정값만 사용
- **Private**: 서버 사이드에서만 접근 가능. API 키, 시크릿 등
- **CI**: GitHub Actions / Vercel 빌드 시스템에서만 사용
- **자동**: 프레임워크 또는 플랫폼이 자동 설정

---

## 주의사항

- `.env`, `.env.local` 파일은 **절대 커밋하지 않음**
- `SUPABASE_SERVICE_ROLE_KEY`는 **서버 사이드에서만** 사용해야 함 (프론트엔드 노출 금지)
- `TWELVEDATA_API_KEY`가 없으면 주식 실시간 호가 API가 실패할 수 있음 (SSOT 경로는 Supabase 데이터 사용)
- Feature Flags (`NEXT_PUBLIC_APP_MODE` 등)의 기본값은 `lib/config/gates.ts`에서 관리
