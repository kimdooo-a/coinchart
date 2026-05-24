# T01 — 커뮤니티 정적 메타 SSOT 분리 (board-meta · news-meta 신규)

> **본 터미널은 R3 일꾼(T01 / 12)**. Wave 1 (즉시 발사, 독립). **Wave 2(T02·T03·T04)의 선행**이므로 우선 처리 권장.

## 1. 컨텍스트

- 프로젝트: Crypto Chart Analysis (v2.0 커뮤니티 피벗 — 코인판×네이버, 라이트 톤, 빨↑/파↓)
- 작업 디렉토리: `F:\11_dev\260523 코인 차트분석`
- 본 터미널 역할: **T01 / 12** — mock 모듈에 섞여 있는 **정적 메타/타입**을 독립 SSOT 파일로 분리
- 라운드: R3 (community-finish)

배경: R2까지 board/news/coin이 실데이터로 전환됐으나, `lib/community/mock-posts.ts`(`BOARD_META`/`BoardSlug`)와 `mock-news.ts`(`NEWS_CATEGORIES`/`COIN_FILTERS`)에 정적 메타가 남아 페이지들이 mock 파일을 계속 import 중이다. R3 목표는 mock 완전 삭제(T05)인데, 그러려면 **정적 메타를 먼저 mock과 무관한 파일로 옮겨야** 한다. 본 터미널이 그 SSOT를 만든다.

## 2. 공통 SOT (읽기 전용)

```
CLAUDE.md
docs/PROJECT_DIRECTION.md
lib/community/mock-posts.ts    ← BOARD_META / BoardSlug 정의 위치 (분리 원본)
lib/community/mock-news.ts     ← NEWS_CATEGORIES / COIN_FILTERS 정의 위치 (분리 원본)
```

## 3. 작업 목표

### Phase 1: 메타 정의 식별
- `mock-posts.ts`에서 `BOARD_META`, `BoardSlug`(및 관련 정적 타입/상수) 추출 범위 확정
- `mock-news.ts`에서 `NEWS_CATEGORIES`, `COIN_FILTERS`(및 관련 라벨 사전/타입) 추출 범위 확정
- **MOCK_POSTS / MOCK_NEWS / mock-coins 데이터 배열은 손대지 않음** (T05가 삭제)

### Phase 2: 신규 SSOT 파일 작성
- **신규** `lib/community/board-meta.ts`: `BOARD_META`·`BoardSlug` + 관련 정적 타입 이전 (한국어 주석)
- **신규** `lib/community/news-meta.ts`: `NEWS_CATEGORIES`·`COIN_FILTERS` + 관련 라벨 사전/타입 이전

### Phase 3: 하위호환 re-export (충돌 방지 핵심)
- `mock-posts.ts`: `BOARD_META`/`BoardSlug` 원본 정의를 제거하고 **`export { BOARD_META } from './board-meta'`** 등 re-export로 교체 (기존 import 경로 무파손)
- `mock-news.ts`: `NEWS_CATEGORIES`/`COIN_FILTERS` 동일하게 re-export
- 이렇게 하면 Wave 2(T02~T04)가 새 경로(`board-meta`)로 바꾸기 전이라도 기존 `mock-*` import가 계속 동작 → graceful

## 4. 도구 권장

- 직접 작성. 정적 데이터 이동이므로 값 변경 금지 (1:1 복사 후 원본은 re-export).

## 5. 의존성

- **독립** (Wave 1). 단 T02·T03·T04·T05의 선행 → **가장 먼저 끝내는 게 라운드 효율에 좋음**.
- 후행: T02(board), T03(news), T04(coin)이 `board-meta`/`news-meta`에서 import. T05가 re-export까지 최종 삭제.

## 6. 검증

```powershell
npx tsc --noEmit                          # 0 error
Test-Path lib/community/board-meta.ts     # True
Test-Path lib/community/news-meta.ts      # True
# 기존 import 경로 무파손 확인 (BOARD_META 사용처가 여전히 resolve)
npm run build 2>&1 | Select-Object -Last 15   # Compiled successfully
```

```bash
npx tsc --noEmit
grep -n "export.*BOARD_META\|export.*from './board-meta'" lib/community/mock-posts.ts
npm run build 2>&1 | tail -15
```

## 7. 완료 신호

`docs/handover/2026-05-24-R3-T01-meta-ssot.md` 작성. 명시: 이전한 심볼 목록·신규 파일 2종·re-export 방식·새 import 경로(T02~T04 안내용)·tsc/build 결과.

## 8. 안티패턴

- ❌ MOCK_POSTS/MOCK_NEWS/mock-coins **데이터 배열 수정·삭제** (T05 영역 — 메타/타입만 이전)
- ❌ 메타 **값 변경** (1:1 복사, 라벨/슬러그 동일 유지)
- ❌ re-export 누락 → 기존 import 깨짐 (Wave 2 전 graceful 필수)
- ❌ `app/`·`app/api/` 수정 (T02~T12 영역)
- ❌ 한국어 주석 누락
