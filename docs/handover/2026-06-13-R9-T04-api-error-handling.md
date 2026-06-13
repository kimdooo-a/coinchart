# R9 / T04 — 외부 API 폴백·에러 핸들링 상태코드·예외 처리 통일 (인수인계)

> 라운드 **R9 (gap-verify)** · 역할 **T04 / 10**
> 작성일 2026-06-13 · 프로젝트 루트 `G:\11_dev\260601 코인 차트분석`
> SOT: `docs/orchestration/2026-06-13-R9-gap-verify/T04-api-error-handling.md`

## 1. 요약

외부 API 4개 경계의 에러 처리를 의미에 맞게 정합화했다. **응답 필드명(스키마)은 전부 유지**하고, **상태코드와 예외 흐름만** 정합화하여 클라이언트가 "결과 없음" vs "서버 오류" vs "권한 없음" vs "심볼 없음"을 상태코드로 구분할 수 있도록 했다.

- `npx tsc --noEmit` → **타입 에러 0**
- `npm run build` → **성공** (전 라우트 컴파일 OK)
- 쓰기 천장(`app/api/news/`, `app/api/stock/`, `app/api/board/`, `lib/community/fng.ts`) 준수
- `app/api/community/*`(T03), `app/api/coins/*`(범위 외), `lib/community/queries.ts`(읽기전용) 미수정

## 2. 변경 파일 목록 (4영역)

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 4-A | `app/api/news/route.ts` | catch에서 200 은폐 제거 → DB 오류 시 503 |
| 4-B | `lib/community/fng.ts` | `res.json()` 파싱 실패 시 명시적 `throw new Error("[fng] invalid json")` 보강 |
| 4-C | `app/api/stock/quote/route.ts` | TwelveData 오류 분기 — 심볼없음 404 / API다운·5xx·예외 503 |
| 4-D | `app/api/board/[slug]/[postId]/route.ts` | PATCH·DELETE 최종 update 에러 RLS(403) vs DB오류(500) 분기 |

## 3. 변경 전/후 상태코드 매핑표 (T09 레퍼런스 반영용)

### 4-A. `GET /api/news`

| 상황 | 변경 전 | 변경 후 | 본문 스키마 |
|------|---------|---------|-------------|
| 정상(데이터 있음) | 200 | 200 (불변) | `{ items: [...] }` (불변) |
| 정상(결과 0건) | 200 | 200 (불변) | `{ items: [] }` (불변) |
| DB 오류 (`if (error) throw` 등) | **200** `{ items: [] }` | **503** `{ items: [], error: '<사유>' }` | `items: []` 유지 + `error` 필드 추가 |

> `items` 필드는 오류 시에도 빈 배열로 유지 → 프론트가 `data.items`를 안전하게 읽음. `error`는 신규 추가(선택 소비).

### 4-B. `lib/community/fng.ts` (라이브러리, HTTP 상태코드 없음)

| 상황 | 변경 전 | 변경 후 |
|------|---------|---------|
| `!res.ok` | `throw [fng] <status>` | (불변) |
| JSON 파싱 실패 | **미처리** (런타임 예외/undefined 전파 가능) | **`throw new Error("[fng] invalid json")`** |
| `data` 빈 배열 | `throw [fng] empty response` | (불변) |

> 반환 타입 `FngSnapshot` 불변. 상위 `lib/community/queries.ts:145`의 `fetchFng().catch()`가 throw를 일관되게 받아 `null` 폴백 → 메인 페이지는 기본값 `{ value: 50, classification: "Neutral" }` 표시. **호출부 정합 확인 완료(읽기만, 수정 없음).**

### 4-C. `GET /api/stock/quote?symbol=`

| 상황 | 변경 전 | 변경 후 | 본문 스키마 |
|------|---------|---------|-------------|
| 정상 | 200 (TwelveData passthrough) | 200 (불변) | TwelveData 원본 (불변) |
| `symbol` 누락 | 400 | 400 (불변) | `{ error: 'Symbol is required' }` |
| `TWELVEDATA_API_KEY` 미설정 | 500 | 500 (불변) | `{ error: 'Server configuration error' }` |
| 심볼 없음/잘못된 심볼 (`data.code===404` 또는 message 패턴) | **400** | **404** | TwelveData 원본 passthrough |
| TwelveData 측 5xx (`data.code>=500`) | 400 | **503** | TwelveData 원본 passthrough |
| 업스트림 HTTP 5xx (`res.status>=500`) | (파싱 후 분기 없음) | **503** | `{ error: 'Stock data service unavailable' }` |
| 기타 잘못된 요청 (`data.status==='error'`) | 400 | 400 (불변) | TwelveData 원본 passthrough |
| 네트워크 예외/타임아웃/JSON 파싱 실패 (catch) | **500** | **503** | `{ error: 'Failed to fetch data' }` |

> 심볼 판별 기준: `data.code === 404` 또는 `data.message`가 `/not found|symbol|no data/i` 매칭.

### 4-D. `PATCH·DELETE /api/board/[slug]/[postId]` — 최종 update 단계만

| 상황 | 변경 전 | 변경 후 | 본문 스키마 |
|------|---------|---------|-------------|
| RLS 거부 (`error.code === 'PGRST301'`) | **500** `{ error: error.message }` | **403** `{ error: '권한이 없습니다' }` | `{ error }` 유지 |
| Postgres 권한 부족 (`error.code === '42501'`) | **500** | **403** `{ error: '권한이 없습니다' }` | `{ error }` 유지 |
| 그 외 DB 오류 | 500 `{ error: error.message }` | 500 (불변) | `{ error }` 유지 |
| 정상 | 200 `{ ok: true }` | 200 (불변) | `{ ok: true }` |

> `verifyEditPermission`이 반환하는 기존 401/403/404/410 흐름은 **건드리지 않음**(지시대로). 공통 helper `mapUpdateError()`를 추가해 PATCH·DELETE 동일 정책 적용.

## 4. 응답 스키마 변경 여부

- **필드명 변경/삭제 없음** — 프론트 소비 필드 전부 호환.
- 신규 추가 필드: news 오류 응답의 `error` 1건(선택 소비, 기존 `items` 유지). 그 외 본문 스키마 전부 불변.

## 5. 검증 결과

| 단계 | 명령 | 결과 |
|------|------|------|
| 1 | `npx tsc --noEmit` | ✅ 타입 에러 0 |
| 2 | `npm run build` | ✅ 빌드 성공 (전 라우트 컴파일) |
| 3 | 상태코드 수동 호출 | 로컬 외부 API 키/DB 오류 유도 환경 미비로 코드 레벨 분기 검증으로 갈음 (위 매핑표) |
| 4 | 응답 필드명 불변 재확인 | ✅ 기존 필드 전부 유지, news `error`만 추가 |

## 6. 후속(T09 등)에게

- 위 3절 매핑표 그대로 `docs/references/_API_REFERENCE.md`에 반영 요망(엔드포인트별 신규 상태코드 404/403/503/502 분기).
- news 응답에 오류 시 `error` 필드가 추가됨(200 정상 응답에는 없음) — 레퍼런스 응답 예시에 명기 권장.

---

**지휘자 보고**: `R9-T04 완료 — 4영역 에러핸들링 정합, tsc/build 통과, handover 작성`
