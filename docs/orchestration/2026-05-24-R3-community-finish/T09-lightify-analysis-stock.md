# T09 — analysis + stock 계열 라이트화

> **본 터미널은 R3 일꾼(T09 / 12)**. Wave 1 (즉시 발사, 독립).

## 1. 컨텍스트

- 프로젝트: Crypto Chart Analysis (v2.0 커뮤니티 — **네이버 라이트 톤**, 흰 배경, 빨↑/파↓)
- 작업 디렉토리: `F:\11_dev\260523 코인 차트분석`
- 본 터미널 역할: **T09 / 12** — `app/analysis/*` + `app/stock` 페이지·관련 컴포넌트의 **남은 다크 톤을 라이트 토큰으로 교체**
- 라운드: R3 (community-finish)

배경: R1/T09(blog)·T10(analysis 일부)·T11(signal/market/stock-market)에서 라이트화가 진행됐다. R3는 **잔여 라이트화 완주**. 본 터미널은 analysis 계열(`/analysis`, `/analysis/[symbol]`, `/analysis/stock`, `/analysis/stock/[symbol]`) + `/stock`과 그 전용 컴포넌트의 다크 잔여를 정리한다. **방법: 순수 클래스 교체**(다크 토큰 → 라이트 토큰). JSX 구조·로직 불변.

## 2. 공통 SOT (읽기 전용)

```
CLAUDE.md  ·  docs/PROJECT_DIRECTION.md  ·  app/globals.css (디자인 토큰)
docs/handover/2026-05-23-R1-T09-blog-lightify.md         ← 라이트화 클래스 교체 패턴 (필독)
docs/handover/2026-05-23-R1-T11-signal-market-lightify.md ← 의미 컬러 보존 기준 (필독)
docs/handover/2026-05-23-R2-T04-chart-lightify.md         ← 차트 색 보존 기준 (참고)
```

## 3. 작업 목표

### Phase 1: 다크 톤 스캔
- 대상: `app/analysis/page.tsx`, `app/analysis/[symbol]/page.tsx`, `app/analysis/stock/page.tsx`, `app/analysis/stock/[symbol]/page.tsx`, `app/stock/page.tsx` + `components/Analysis/**`, `components/Stock/**`
- `bg-black`/`bg-gray-8xx,9xx`/`bg-slate/zinc-8xx,9xx`/`text-white`/`dark:`/`bg-[#1..]`/하드코딩 다크 hex 스캔

### Phase 2: 라이트 토큰 교체
- 다크 배경/텍스트 → `app/globals.css`의 라이트 토큰(흰 배경·gray-900 텍스트 등 기존 라이트화 컨벤션). R1/T09·T11이 쓴 토큰 그대로
- **보존**: TradingView 차트 색(R2-T04가 `getChartTheme`로 처리), RSI 히트맵·강조 뱃지·의미 컬러(빨↑/파↓), 코드블록 다크

### Phase 3: 검증 + 잔여 보고
- 다크 잔여 0(의도적 보존분 제외). 보존분은 handover에 사유 명시

## 4. 도구 권장
- 직접 작성(클래스 only). `git diff --stat` 대칭 확인(순수 교체).

## 5. 의존성
- **독립** (Wave 1). 다른 라이트화 터미널(T10·T11·T12)과 디렉토리 분리.

## 6. 검증

```powershell
npx tsc --noEmit
Select-String -Path app/analysis,app/stock,components/Analysis,components/Stock -Include *.tsx -Pattern "bg-black|bg-gray-9|text-white|dark:" -Recurse
npm run build 2>&1 | Select-Object -Last 15
```

```bash
npx tsc --noEmit
grep -rnE "bg-black|bg-(gray|slate|zinc)-(8|9)[0-9]{2}|text-white|dark:" app/analysis/ app/stock/ components/Analysis/ components/Stock/
npm run build 2>&1 | tail -15
```

## 7. 완료 신호
`docs/handover/2026-05-24-R3-T09-lightify-analysis-stock.md` 작성. 명시: 수정 파일·교체 토큰·보존분(차트/의미 컬러)·diff stat 대칭·잔여 다크 grep 결과.

## 8. 안티패턴
- ❌ `app/admin/`·`app/{portfolio,...}`·`app/{contact,...}` 수정 (T10·T11·T12 영역)
- ❌ TradingView 차트 색·코드블록 다크·의미 컬러(빨↑/파↓·강조) 무차별 제거
- ❌ JSX 구조·로직 변경 (클래스 교체만)
- ❌ 한국어 주석 누락
