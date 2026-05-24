# T10 — admin 계열 라이트화 (page + blog)

> **본 터미널은 R3 일꾼(T10 / 12)**. Wave 1 (즉시 발사, 독립).

## 1. 컨텍스트

- 프로젝트: Crypto Chart Analysis (v2.0 커뮤니티 — **네이버 라이트 톤**)
- 작업 디렉토리: `F:\11_dev\260523 코인 차트분석`
- 본 터미널 역할: **T10 / 12** — `app/admin/page.tsx`(다크 16매치) + `app/admin/blog/**`의 다크 톤 라이트화
- 라운드: R3 (community-finish)

배경: 관리자 대시보드(`app/admin/page.tsx`)는 다크 톤 매치가 16건으로 잔여 라이트화 대상 중 가장 크다. `app/admin/blog/*`(목록·신규·편집)도 함께. **방법: 순수 클래스 교체**.

> **격리 주의**: `app/admin/board/`는 **T06이 신규 생성**하는 영역이다. 본 터미널은 **`app/admin/page.tsx`와 `app/admin/blog/**`만** 건드린다. `app/admin/board/`는 손대지 않는다.

## 2. 공통 SOT (읽기 전용)

```
CLAUDE.md  ·  docs/PROJECT_DIRECTION.md  ·  app/globals.css
docs/handover/2026-05-23-R1-T09-blog-lightify.md         ← 라이트화 패턴 (필독)
docs/handover/2026-05-23-R1-T11-signal-market-lightify.md ← 의미 컬러 보존 기준
```

## 3. 작업 목표

### Phase 1: 다크 톤 스캔
- 대상: `app/admin/page.tsx`, `app/admin/blog/page.tsx`, `app/admin/blog/new/page.tsx`, `app/admin/blog/edit/[id]/page.tsx` + admin 전용 컴포넌트(있으면)
- `bg-black`/`bg-gray-8xx,9xx`/`text-white`/`dark:`/하드코딩 다크 hex

### Phase 2: 라이트 토큰 교체
- 다크 → 라이트 토큰(기존 라이트화 컨벤션). 관리자 UI도 v2.0 톤 통일
- **보존**: 상태 뱃지 의미 컬러, 위험 액션(삭제) 빨강 등

## 4. 도구 권장
- 직접 작성(클래스 only). `git diff --stat` 대칭 확인.

## 5. 의존성
- **독립** (Wave 1). T06(admin/board 신규)과 경로 분리.

## 6. 검증

```powershell
npx tsc --noEmit
Select-String -Path app/admin/page.tsx,app/admin/blog -Include *.tsx -Pattern "bg-black|bg-gray-9|text-white|dark:" -Recurse
npm run build 2>&1 | Select-Object -Last 15
```

```bash
npx tsc --noEmit
grep -rnE "bg-black|bg-(gray|slate|zinc)-(8|9)[0-9]{2}|text-white|dark:" app/admin/page.tsx app/admin/blog/
npm run build 2>&1 | tail -15
```

## 7. 완료 신호
`docs/handover/2026-05-24-R3-T10-lightify-admin.md` 작성. 명시: 수정 파일·교체 토큰·보존분·diff stat·잔여 다크 grep.

## 8. 안티패턴
- ❌ `app/admin/board/` 수정 (T06 신규 영역)
- ❌ `app/analysis/`·`app/{portfolio,...}`·`app/{contact,...}` 수정 (T09·T11·T12 영역)
- ❌ 위험 액션·상태 뱃지 의미 컬러 무차별 제거
- ❌ JSX 구조·로직 변경 (클래스 교체만)
- ❌ 한국어 주석 누락
