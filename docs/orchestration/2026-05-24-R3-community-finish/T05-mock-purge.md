# T05 — mock-* 완전 삭제 통합 (mock-coins/posts/news 데이터부 제거)

> **본 터미널은 R3 일꾼(T05 / 12)**. Wave 3 (T02·T03·T04 SSR 전환으로 mock import가 모두 끊긴 후 발사). 통합 마무리 작업.

## 1. 컨텍스트

- 프로젝트: Crypto Chart Analysis (v2.0 커뮤니티)
- 작업 디렉토리: `F:\11_dev\260523 코인 차트분석`
- 본 터미널 역할: **T05 / 12** — 정적 메타가 `board-meta`/`news-meta`로 이전(T01)되고 모든 페이지의 mock import가 제거(T02~T04)된 후, **`lib/community/mock-*.ts`를 완전 삭제**
- 라운드: R3 (community-finish)

배경: R2 SUMMARY 인계 — 잔여 mock import는 정적 메타/타입뿐(데이터 배열·getter·`mock-coins` 전부 unused). T01이 메타를 분리하고 T02~T04가 페이지 import를 새 경로로 바꾸면, mock-*.ts는 더 이상 참조되지 않는다. 본 터미널이 **참조 0을 확인하고 삭제**한다.

## 2. 공통 SOT (읽기 전용)

```
CLAUDE.md
docs/handover/2026-05-23-R2-_SUMMARY.md          ← mock 정리 계획 (필독)
docs/handover/2026-05-24-R3-T01-meta-ssot.md     ← 메타 이전 결과 (선행)
docs/handover/2026-05-24-R3-T02-board-ssr.md     ← board mock import 제거 확인 (선행)
docs/handover/2026-05-24-R3-T03-news-ssr.md      ← news mock import 제거 확인 (선행)
docs/handover/2026-05-24-R3-T04-coin-ssr.md      ← coin mock import 제거 확인 (선행)
```

## 3. 작업 목표

### Phase 1: 전역 참조 스캔 (삭제 전 필수)
- `lib/community/mock-coins.ts`·`mock-posts.ts`·`mock-news.ts`를 import하는 모든 위치를 grep
- 잔여 참조가 있으면 출처별로 분류: (a) `BoardSidebar.tsx`·`seed-community.ts` 등 본 터미널 영역 → 직접 정리, (b) T02~T04 영역인데 남아 있으면 → **handover에 보고하고 해당 파일 삭제는 보류**

### Phase 2: 본 영역 참조 정리
- `components/community/BoardSidebar.tsx`: mock import가 남아 있으면 실데이터 fetch 또는 `board-meta`/`news-meta`로 교체 (R2에서 이미 위젯별 fetch 적용됨 — 메타 import만 정리)
- `scripts/seed-community.ts`: `MOCK_POSTS` 등에 의존하면, 시드 소스를 유지할지/별도 픽스처로 옮길지 결정. **시드 스크립트가 mock 데이터를 진짜로 필요로 하면** mock 데이터부를 `scripts/fixtures/`로 옮기는 것도 옵션 (handover에 근거 명시)

### Phase 3: mock 파일 삭제
- 참조 0 확인 후 `mock-coins.ts`·`mock-posts.ts`·`mock-news.ts` 삭제
- T01이 만든 re-export 스텁도 함께 제거 (board-meta/news-meta가 진짜 SSOT)

## 4. 도구 권장
- 직접 작성. 삭제 전 grep 증거 필수 (systematic — 무작위 삭제 금지).

## 5. 의존성
- **dep T01·T02·T03·T04**. 선행 handover에서 "mock import 제거" PASS 확인 후 진행.
- 선행 미완 시: 참조 잔존 파일을 handover에 보고하고 **삭제 보류** (부분 진행). 지휘자가 회수 시 판단.

## 6. 검증

```powershell
# 삭제 직전: 전역 mock 참조 0 (자기 삭제 대상 파일 자신 제외)
Select-String -Path app,components,lib,scripts -Include *.ts,*.tsx -Pattern "lib/community/mock-" -Recurse
# 삭제 후
Test-Path lib/community/mock-coins.ts   # False
npx tsc --noEmit                         # 0 error
npm run build 2>&1 | Select-Object -Last 15
```

```bash
grep -rn "lib/community/mock-" app/ components/ lib/ scripts/   # 기대: 0건
npx tsc --noEmit && npm run build 2>&1 | tail -15
```

## 7. 완료 신호
`docs/handover/2026-05-24-R3-T05-mock-purge.md` 작성. 명시: 삭제 전 참조 스캔 결과·삭제 파일 3종·BoardSidebar/seed 처리·잔존 참조(있으면 보류 사유)·tsc/build 결과.

## 8. 안티패턴
- ❌ **참조 스캔 없이 삭제** (tsc 깨짐 위험 — grep 증거 먼저)
- ❌ `app/board/`·`app/news/`·`app/coin/` 페이지 로직 수정 (T02~T04 영역 — 본 터미널은 mock 파일·BoardSidebar·seed만)
- ❌ `board-meta.ts`/`news-meta.ts` 내용 변경 (T01 SSOT)
- ❌ 선행 미완인데 강제 삭제 (graceful 보류 우선)
- ❌ 한국어 주석 누락
