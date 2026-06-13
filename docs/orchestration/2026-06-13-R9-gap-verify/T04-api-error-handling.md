# R9 / T04 — 외부 API 폴백·에러 핸들링 상태코드·예외 처리 통일

> 라운드 **R9 (gap-verify)** · 역할 **T04 / 10** · kdydispatch 일꾼용 자기완결 통합 프롬프트
> 코인·주식 커뮤니티 프로젝트 (Next.js 16, TypeScript Strict)
> 루트: `G:\11_dev\260601 코인 차트분석`
> 외부 데이터 소스: Binance · TwelveData · Alternative.me (FNG)

---

## 1. 컨텍스트

현재 외부 API 호출 라우트/라이브러리들이 **에러를 200 OK로 은폐**하거나, **상태코드를 일괄 500으로 뭉뚱그려** 클라이언트가 "데이터 없음" vs "서버 오류" vs "권한 없음"을 구분하지 못한다. 그 결과 프론트는 빈 화면을 "정상"으로 오인하고, 사용자에게 적절한 안내(재시도/로그인/심볼 확인)를 줄 수 없다.

R9는 gap-verify 라운드로, **응답 스키마(필드명)는 호환을 유지**하면서 **상태코드와 예외 흐름만 의미에 맞게 정합화**하는 것이 핵심이다. 너(T04)는 외부 API 4개 경계의 에러 처리를 통일한다.

- 본 문서가 너의 단일 진실 공급원(SOT)이다. 추가 지시 없이 이 문서만으로 작업을 완수한다.
- 의심나면 추측하지 말고, 아래 2절 공통 SOT를 읽고 판단한다.

## 2. 공통 SOT (읽기 전용 — 절대 수정 금지)

작업 전 반드시 먼저 읽는다. 추측 금지.

- `CLAUDE.md` — 프로젝트 규칙·폴더 구조·SSOT 규칙
- `docs/references/_API_REFERENCE.md` — API 엔드포인트 전체 스펙 (응답 스키마 확인용)
- `docs/references/_ENV_REFERENCE.md` — 환경변수 목록 (`TWELVEDATA_API_KEY` 등)
- `docs/rules/*.md` — 모듈화·SSOT 분리 규칙

이 파일들은 **레퍼런스**다. 코드 변경이 레퍼런스 내용과 어긋나면, 코드를 레퍼런스에 맞춘다(레퍼런스 자체는 T09가 반영).

## 3. 공통 의무

- 모든 주석/커밋 메시지는 **한국어**
- `.env`, `.env.local`, `nul` 커밋 **금지**
- SSOT 교차 import **금지** (`lib/supabase/crypto.ts` ↔ `lib/supabase/stock.ts`)
- 쓰기 천장(4절) **밖의 파일은 절대 수정하지 않는다**
- 응답 **필드명(스키마)은 유지** — 상태코드/에러 본문만 정합화 (프론트 깨짐 방지)

## 4. 작업 목표 (쓰기 천장 = 아래 4영역에 한함)

쓰기 허용 경로: `app/api/news/`, `app/api/stock/`, `app/api/board/`, `lib/community/fng.ts`

### 4-A. `app/api/news/route.ts` — 오류 은폐 제거

- 현재: `catch`에서 DB 오류든 뭐든 `NextResponse.json({ items: [] })`를 **200 OK**로 반환 → 클라가 "데이터 없음"으로 오인.
- 수정: DB 오류(`if (error) throw error` 경로 포함) 발생 시 **503**(서비스 일시 불가) 또는 게이트웨이성 오류는 **502**로 상태코드를 명시. 본문은 기존 스키마와 호환되게 `{ items: [], error: '<사유>' }` 형태로 반환(프론트가 `items` 배열을 계속 안전하게 읽을 수 있도록 `items: []` 필드는 유지하되, 상태코드로 오류임을 명확화).
- 정상 경로(데이터 0건)는 **200 + `{ items: [] }`** 그대로 유지 → "정상이지만 결과 없음"과 "서버 오류"가 상태코드로 구분되어야 한다.

### 4-B. `lib/community/fng.ts` — JSON 파싱 예외 보강

- 현재: `res.ok`만 체크(`if (!res.ok) throw`), `await res.json()` 파싱 실패는 **미처리** → 깨진 응답 시 throw가 아니라 런타임 예외/undefined 전파 가능.
- 수정: `res.json()` 호출을 try-catch로 감싸 파싱 실패 시 **명시적 `throw new Error("[fng] invalid json")`**. 상위 호출부(`lib/community/queries.ts`의 `.catch()` 폴백)가 이 throw를 일관되게 받아 폴백하도록 정합 맞춘다.
- 기존 `if (!res.ok) throw` 및 `empty response` throw는 유지. 반환 타입 `FngSnapshot` 불변.

### 4-C. `app/api/stock/quote/route.ts` — TwelveData 오류 분기

- 현재: `data.status === 'error'`는 일괄 400, `catch`는 일괄 **500** → "심볼 없음" vs "API 다운"이 구분 안 됨.
- 수정: TwelveData 응답을 분석하여 **심볼 없음/잘못된 심볼**은 **404**, **API 다운/타임아웃/네트워크 예외**(`catch` 블록 및 5xx 응답)는 **503**으로 구분해 클라에 전달. 판별은 `data.code`(TwelveData 에러 코드) 또는 `data.message` 패턴을 기준으로 한다.
- `TWELVEDATA_API_KEY` 미설정 시의 기존 500(설정 오류)은 유지. 응답 본문 스키마는 기존 형태(`{ error }` 또는 TwelveData 원본 패스스루) 유지.

### 4-D. `app/api/board/[slug]/[postId]/route.ts` (DELETE/PATCH) — RLS 에러 구분

- 현재: 최종 Supabase `update` 실패 시 `error.message`를 그대로 **500**으로 직통 반환 → RLS(권한) 거부와 실제 서버 오류가 뒤섞임.
- 수정: `error.code` 기반 분기. PostgREST **RLS 거부(예: `PGRST301`)** 또는 권한 관련 코드는 **403 + 친화 메시지**("권한이 없습니다" 등 한국어)로 반환, 그 외 DB 오류만 500 유지. PATCH·DELETE 두 핸들러 모두 동일 정책 적용.
- 기존 권한 검증(`verifyEditPermission`)이 반환하는 401/403/404/410 흐름은 건드리지 않는다 — 최종 `update` 단계의 에러 분기만 보강.

## 5. 도구 권장

- 코드 탐색: **Grep**(`error.code`, `status: 500`, `res.json` 패턴), **Read**(천장 4파일 전체)
- 호출부 정합 확인: `lib/community/queries.ts`의 fng `.catch()` 사용처를 **Read만**(수정 금지, 천장 밖)
- 응답 스키마 교차 확인: `docs/references/_API_REFERENCE.md` Read
- 수정: **Edit**(정밀 치환) 우선, 전면 재작성 지양

## 6. 의존성

- **상류 의존 없음** — 즉시 착수 가능.
- 경계 주의: `app/api/community/*`는 **T03 영역** → 절대 건드리지 말 것. `app/api/coins/*`는 **범위 외**.
- `lib/community/queries.ts`는 **읽기만**(fng throw 정합 확인용). 수정 금지.
- 응답 형태를 바꾼 경우 → **T09 레퍼런스 반영용으로 handover에 반드시 명기**(엔드포인트 / 변경 전 상태코드 / 변경 후 상태코드 / 본문 스키마).

## 7. 검증

순서대로 전부 통과해야 완료다.

1. `npx tsc --noEmit` — 타입 에러 0
2. `npm run build` — 빌드 성공
3. (가능 시) 각 라우트 수동 호출로 상태코드 확인:
   - news: 정상 200 / DB 오류 유도 시 503·502
   - stock/quote: 없는 심볼 404 / 키 미설정 500 / API 다운 503
   - board DELETE·PATCH: 권한 거부 403(+한국어 메시지)
4. 응답 **필드명(스키마) 불변** 재확인 — 프론트 소비 필드 깨짐 없음

## 8. 완료 신호

- handover 작성: `docs/handover/2026-06-13-R9-T04-api-error-handling.md`
  - 변경 파일 목록(4영역), 변경 전/후 상태코드 매핑 표, 응답 스키마 변경 여부, 검증 결과(tsc/build 로그 요약)
- 지휘자 보고 한 줄: `R9-T04 완료 — 4영역 에러핸들링 정합, tsc/build 통과, handover 작성`

## 9. 내부 병렬 (mode 2)

- **mode 2** — 4개 라우트/라이브러리는 상호 독립이므로 **병렬 처리**한다.
- 4영역(news / fng / stock-quote / board-detail)은 천장 위 서로 다른 파일 → 충돌 없음. 순서 무관.
- 각 영역 수정 후 개별로 `tsc`로 빠르게 확인하고, 마지막에 전체 `build`로 통합 검증.

---

## 안티패턴 (하면 안 되는 것)

- ❌ 천장 4영역 **밖** 파일 수정 (`app/api/community/*`=T03, `app/api/coins/*`=범위 외, `queries.ts`=읽기전용)
- ❌ 응답 **필드명 변경/삭제** → 프론트 즉시 깨짐. `items` 같은 기존 필드는 오류 시에도 유지
- ❌ "정상이지만 결과 0건"을 오류 코드로 바꾸기 → 빈 결과는 **200** 유지, 진짜 오류만 5xx/4xx
- ❌ 모든 catch를 무조건 500으로 되돌리기 → 의미별(404/403/503/502) 구분이 본 작업의 목적
- ❌ 영어 주석/커밋, `.env`·`nul` 커밋
- ❌ 레퍼런스 파일 직접 수정 (T09 담당) — handover에 변경만 명기
- ❌ tsc/build 미검증 상태로 완료 보고
