# T03 — dead code 정리 (news-queries.ts SSR 전환 후 unused 제거)

## 1. 컨텍스트

- 프로젝트: **코인 차트 분석** (Next.js 16 + Supabase, v2.0 커뮤니티 피벗)
- 작업 디렉토리: `F:\11_dev\260523 코인 차트분석`
- 본 터미널 역할: **T03 / 4** — R3에서 `/news`가 SSR로 전환되며 더 이상 호출되지 않는 클라 fetch 함수 정리
- 라운드: R4 (community-wiring) · 발사 차수: **Wave 1 (독립)**

## 2. 배경

`lib/community/news-queries.ts`는 R2/T02에서 **클라이언트 컴포넌트(`app/news/page.tsx`, `"use client"`)** 전용 fetch 래퍼로 만들어졌다. 그런데 R3/T03에서 `/news`가 **SSR(server component)로 전환**되며 `lib/community/news-server.ts`(server-only) 경로로 데이터를 받게 됐다. 그 결과 `news-queries.ts`의 일부 **클라 fetch 함수가 unused(dead code)** 가 됐을 가능성이 크다.

**보존 대상(절대 삭제 금지)** — 순수 헬퍼/타입은 `news-server.ts` 또는 컴포넌트가 여전히 쓸 수 있다:
- `NEWS_CATEGORY_LABEL`, `categoryLabel()`
- `formatRelativeTime()`
- 타입: `ApiNewsItem`, `NewsListItem`, `FngData` 등
- `mapApiNews()`

**삭제 후보(검증 후)** — SSR 전환으로 호출처가 사라졌을 클라 fetch 함수:
- `fetchNews()`, `fetchTickerItems()`, `fetchHotIssueItems()`, `fetchFngData()`, `fetchOfficialPosts()`
- 이들이 참조하는 내부 상수(`COIN_DISPLAY`, `HOT_TREND_MAP`, 내부 인터페이스 `ApiTicker`/`ApiHotIssue`/`ApiBlogPost`)가 **다른 곳에서 안 쓰이면** 함께 제거.

## 3. 공통 SOT (읽기 전용)

```
CLAUDE.md                              진입점·SSOT 규칙
lib/community/news-server.ts           SSR 데이터 경로 — news-queries에서 무엇을 import하는지 확인
app/news/page.tsx                      /news 페이지 — 현재 무엇을 쓰는지 (SSR 전환됨)
components/community/NewsFilters.tsx (있으면)  클라 필터 — news-queries 사용처 후보
components/community/NewsHeadlineCard.tsx      NewsHeadlineItem/NewsSentiment 타입 소비처
```

## 4. 작업 목표 (단일 파일 — `lib/community/news-queries.ts`)

### Phase 1: 사용처 전수 조사 (삭제 전 필수)
프로젝트 전역에서 `news-queries`의 각 export를 grep으로 추적:
```powershell
# 모듈 전체 import 지점
Select-String -Path app,components,lib -Pattern 'from "@/lib/community/news-queries"' -Recurse
# 각 export별 실제 호출 — 예
Select-String -Path app,components,lib -Pattern 'fetchNews|fetchTickerItems|fetchHotIssueItems|fetchFngData|fetchOfficialPosts' -Recurse
Select-String -Path app,components,lib -Pattern 'categoryLabel|NEWS_CATEGORY_LABEL|formatRelativeTime|mapApiNews|ApiNewsItem|NewsListItem|FngData' -Recurse
```
→ **호출처 0건인 export만 삭제 대상**으로 확정. 호출처가 1건이라도 있으면 보존.

### Phase 2: unused 제거
- Phase 1에서 호출처 0으로 확정된 함수/상수/내부 타입만 제거.
- 제거한 함수가 유일하게 쓰던 내부 상수/타입도 연쇄 제거 (단 보존 대상이 참조하면 유지).
- 파일 상단 주석(데이터 소스 목록 등)도 현재 상태에 맞게 정리.
- import도 unused가 되면 제거 (`NewsHeadlineItem` 등 타입 import가 보존 export에 쓰이면 유지).

### Phase 3: 무결성 확인
- `news-server.ts`가 import하던 심볼이 살아있는지 재확인 (깨면 안 됨).

## 5. 도구 권장
- 직접 작업 (grep → 삭제 → 타입체크). `/kdyclean` 참고 가능하나 단일 파일이라 수동 권장.

## 6. 의존성
- (독립) — Wave 1 즉시
- 다른 터미널과 파일 겹침 0 (`news-queries.ts`는 본 터미널 전용)

## 7. 검증

```powershell
npx tsc --noEmit                       # 0 에러 (unused 제거가 다른 모듈 안 깸)
npx eslint lib/community/news-queries.ts
# 보존 대상이 살아있는지
Select-String -Path lib/community/news-queries.ts -Pattern 'categoryLabel|formatRelativeTime|mapApiNews'   # ≥1건
# 삭제 대상이 정말 호출처 없는지 재확인 (제거 후 깨진 참조 0)
npm run build                          # /news ƒ SSR 컴파일 성공
```

## 8. 완료 신호
`docs/handover/2026-05-25-R4-T03-dead-code.md` 작성:
- Phase 1 사용처 조사 결과 표 (export별 호출처 건수 → 삭제/보존 판정)
- 제거한 심볼 목록 + 보존한 심볼 목록
- 검증 결과 (tsc/eslint/build PASS/FAIL)
- 잔존 의심 dead code(다른 파일) 있으면 R5 후보로 메모

## 안티패턴
- ❌ 사용처 조사 없이 추측 삭제 (반드시 grep 0건 확인 후)
- ❌ 보존 대상(`categoryLabel`/`formatRelativeTime`/타입/`mapApiNews`) 삭제
- ❌ `lib/community/news-queries.ts` 밖 수정 (격리 위반 — 다른 파일이 깨지면 보고만)
- ❌ handover 누락 / 한국어 주석 누락
