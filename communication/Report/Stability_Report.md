# Stability_Report.md

## 1. Lint 폭발 문제 해결

- **문제**: kdy-addon/monet-registry-main 폴더의 외부 컴포넌트로 인해 399 errors 발생.
- **해결**: .eslintignore에 `kdy-addon/monet-registry-main/**` 추가. Lint script를 메인 코드만 대상으로 변경: `"eslint app/ lib/ scripts/ components/ middleware.ts next.config.ts --ignore-pattern 'kdy-addon/**'"`.
- **결과**: 메인 앱 lint pass 가능.

## 2. 배포 안정성 체크리스트

- **Env 누락**: Startup validation 추가 (e.g., lib/env.ts에서 required vars 체크, 누락 시 throw).
- **Supabase 실패**: 모든 쿼리에 try-catch, 실패 시 "데이터 unavailable" 메시지, 캐시 사용.
- **외부 API 실패**: Retry 로직, 사용자 알림, 캐싱 구현.

## 3. Supabase 장애 시 Graceful 처리

- **구현**: Supabase client 호출 시 try-catch, catch에서 fallback 데이터 반환 또는 에러 메시지.
- **예**: 가격 API에서 Supabase 실패 시, 이전 캐시 데이터 사용.