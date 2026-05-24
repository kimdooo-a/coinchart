# T11 — 계정/유틸 페이지 라이트화

> **본 터미널은 R3 일꾼(T11 / 12)**. Wave 1 (즉시 발사, 독립).

## 1. 컨텍스트

- 프로젝트: Crypto Chart Analysis (v2.0 커뮤니티 — **네이버 라이트 톤**)
- 작업 디렉토리: `F:\11_dev\260523 코인 차트분석`
- 본 터미널 역할: **T11 / 12** — 계정/유틸 인터랙티브 페이지의 다크 톤 라이트화
- 라운드: R3 (community-finish)

배경: 잔여 라이트화 중 계정/유틸 묶음. **대상**: `app/portfolio`(다크 5매치)·`app/secure-memo`(4매치)·`app/watchlist`·`app/calendar`·`app/settings` + `components/SecureMemo/**`. **방법: 순수 클래스 교체**.

## 2. 공통 SOT (읽기 전용)

```
CLAUDE.md  ·  docs/PROJECT_DIRECTION.md  ·  app/globals.css
docs/handover/2026-05-23-R1-T09-blog-lightify.md         ← 라이트화 패턴 (필독)
docs/handover/2026-05-23-R1-T11-signal-market-lightify.md ← 의미 컬러 보존
```

## 3. 작업 목표

### Phase 1: 다크 톤 스캔
- 대상 페이지: `app/portfolio/page.tsx`, `app/watchlist/page.tsx`, `app/calendar/page.tsx`, `app/settings/page.tsx`, `app/secure-memo/page.tsx`
- 컴포넌트: `components/SecureMemo/**`
- `bg-black`/`bg-gray-8xx,9xx`/`text-white`/`dark:`/하드코딩 다크 hex

### Phase 2: 라이트 토큰 교체
- 다크 → 라이트 토큰(기존 컨벤션)
- **보존**: SecureMemo 보안 상태 표시 의미 컬러, 빨↑/파↓ 시세 컬러

## 4. 도구 권장
- 직접 작성(클래스 only). diff stat 대칭 확인.

## 5. 의존성
- **독립** (Wave 1). T09·T10·T12와 디렉토리 분리.

## 6. 검증

```powershell
npx tsc --noEmit
Select-String -Path app/portfolio,app/watchlist,app/calendar,app/settings,app/secure-memo,components/SecureMemo -Include *.tsx -Pattern "bg-black|bg-gray-9|text-white|dark:" -Recurse
npm run build 2>&1 | Select-Object -Last 15
```

```bash
npx tsc --noEmit
grep -rnE "bg-black|bg-(gray|slate|zinc)-(8|9)[0-9]{2}|text-white|dark:" app/portfolio/ app/watchlist/ app/calendar/ app/settings/ app/secure-memo/ components/SecureMemo/
npm run build 2>&1 | tail -15
```

## 7. 완료 신호
`docs/handover/2026-05-24-R3-T11-lightify-account-util.md` 작성. 명시: 수정 파일·교체 토큰·보존분·diff stat·잔여 다크 grep.

## 8. 안티패턴
- ❌ `app/analysis/`·`app/admin/`·`app/{contact,...}` 수정 (T09·T10·T12 영역)
- ❌ SecureMemo 보안 상태·시세 의미 컬러 무차별 제거
- ❌ JSX 구조·로직 변경 (클래스 교체만)
- ❌ 한국어 주석 누락
