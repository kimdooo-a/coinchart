# PHASE1_QUALITY_GATES_2025-12-27.md

## A) Lint/Typecheck/Test 최소 기준

- **Lint**: 메인 앱 코드 (app/, lib/, scripts/, components/ 제외 monet-registry-main)에서 0 errors. Warnings 허용 but unused vars, any types 등 critical warnings은 0. 전체 프로젝트 lint 시 monet-registry-main 제외 필수.
- **Typecheck**: `npx tsc --noEmit` exit code 0 (no type errors).
- **Test**: 최소 단위 테스트 추가 (Jest 설치, API routes 및 lib functions 테스트). `npm test` pass, coverage 70% 이상 목표. 현재 없으므로 Phase 1에서 추가.

## B) 외부 폴더 분리 방안 (monet-registry-main lint 폭발 방지)

- **eslint ignore**: .eslintignore 파일에 `kdy-addon/monet-registry-main/**` 추가. Lint 명령에 `--ignore-pattern "kdy-addon/monet-registry-main/**/*"` 옵션 사용.
- **Workspace 분리**: monet-registry-main을 별도 Git repo 또는 폴더로 이동 (e.g., 별도 monorepo 구조). 메인 프로젝트에서 symlink 또는 npm workspace로 연결 but lint scope 제한.
- **Lint scope 한정**: package.json scripts에서 lint를 `eslint app/ lib/ scripts/ components/ --ignore-pattern "kdy-addon/**"`로 제한. CI/CD에서 이 scope만 체크.

## C) Supabase/Env 안전 점검 체크리스트

- **Env 노출 방지**: .env.local never commit (already gitignored). .env.example 제공 with placeholder values. 코드에서 process.env 직접 접근 대신 validation 함수 사용.
- **프로덕션 누락 방지**: Startup 시 required env vars 체크 (e.g., SUPABASE_URL, API keys). 누락 시 app crash with clear error.
- **Supabase 키 관리**: Anon key only for client, service role for server-side only. 키 rotation 정책 수립, 코드에 하드코딩 금지.
- **안전 점검**: `grep -r "SUPABASE" --exclude-dir=node_modules`로 키 노출 확인. Vercel env vars 사용 시 secret으로 설정.

## D) Cron 자동화 옵션 (유료 API 호출 없이)

- **GitHub Actions Cron**: 무료 티어에서 schedule workflow 사용 (e.g., daily at 00:00 UTC). `scripts/daily_cron.ts`를 workflow에서 실행.
- **Supabase Scheduled Jobs**: Supabase Edge Functions에 cron trigger 설정 (무료 티어 제한 확인, 가능 시 사용).
- **Vercel Cron Jobs**: Vercel 플랫폼에서 cron 설정 (프로젝트 배포 시 무료 옵션). API route에 cron endpoint 추가.