# T08 — 접근성(a11y) 하드닝 + 회색 텍스트 대비 개선

> R9 (gap-verify) · 역할 **T08 / 10** · 자기완결 통합 프롬프트
> 프로젝트 루트: `G:\11_dev\260601 코인 차트분석`

---

## 1. 컨텍스트

- 프로젝트: **코인·주식 정보 공유 커뮤니티** (Next.js 16 App Router + Turbopack, TypeScript Strict).
- 디자인: **Tailwind v4 라이트 테마**, Material 3 토큰 기반. WCAG 2.2 AA 지향.
- 본 라운드(R9)는 gap-verify — 누락된 접근성·대비 결함을 메우고 검증하는 마감 라운드.
- 너(T08)의 임무: **아이콘 전용 버튼 aria-label 추가 + 폼 input/label 연결 + 회색 텍스트 대비 개선**.
- 너는 10개 병렬 일꾼 중 하나다. **천장(쓰기 허용 영역) 밖 파일은 절대 건드리지 않는다.** 특히 `components/Analysis`·`Stock`·`Chart`는 **T07이 담당**하므로 본 일꾼은 손대지 않는다.

## 2. 공통 SOT (읽기 전용)

작업 전 반드시 먼저 읽고 추측 금지:

- `CLAUDE.md` — 프로젝트 규칙·SSOT·커밋 규칙
- `docs/references/_COMPONENT_MAP.md` — 컴포넌트 의존성 맵
- `app/globals.css` — **디자인 토큰 SSOT**. 대비 토큰 확인:
  - `--color-on-surface-variant: #424656;` → Tailwind 클래스 `text-on-surface-variant`
  - `--color-muted-foreground`는 위 토큰의 별칭(alias)
- `docs/rules/*.md` — 모듈화·SSOT 분리 규칙

> ⚠️ 위 SOT 파일은 **읽기만** 한다. 절대 수정하지 않는다.

## 3. 공통 의무

- 주석·커밋 메시지는 **한국어**.
- `.env`, `.env.local`, `nul` 파일 **생성·커밋 금지**.
- 코드 변경 전 대상 파일을 Read 하고, 토큰·기존 패턴을 확인한 뒤 수정한다(추측 금지).
- 기존 들여쓰기·따옴표·코드 스타일을 보존한다. 시각 회귀를 최소화한다.

## 4. 작업 목표 (쓰기 천장: Blog / community / SecureMemo / ui 4영역만)

> **쓰기 허용 영역**: `components/Blog/`, `components/community/`, `components/SecureMemo/`, `components/ui/`
> **절대 금지 영역**: `components/Analysis/`, `components/Stock/`, `components/Chart/` (→ T07 소유) 및 그 외 모든 경로.

### 4-1. 아이콘 전용 버튼에 `aria-label` 추가

- 텍스트 라벨 없이 아이콘(SVG/Lucide)만 있는 `<button>`에 의미 있는 한국어 `aria-label` 부여.
- 대표 대상: `components/Blog/BlogSearchBar.tsx` 의 **Clear(X) 버튼** → `aria-label="검색어 지우기"` 등.
- 천장 4영역을 grep으로 훑어 아이콘 전용 버튼을 추가 발굴(예: 닫기 X, 공유, 좋아요/투표 아이콘 버튼 중 라벨 없는 것).
- 이미 `aria-label`이 있거나 가시 텍스트를 가진 버튼은 건드리지 않는다.

### 4-2. 폼 input/label 연결 (`htmlFor` + `id`)

- `<label>`과 대응 `<input>`/`<textarea>`/`<select>`를 `htmlFor`↔`id`로 명시 연결.
- 명시 대상:
  - `components/SecureMemo/MemoCreateModal.tsx` — label에 `htmlFor` 미연결 → 각 입력에 고유 `id` 부여 후 연결.
  - `components/community/BoardListControls.tsx` — 검색 input이 label과 미연결 → `id` 부여 + 연결(라벨이 시각적으로 없으면 `aria-label`로 대체 가능).
- `id`는 컴포넌트 내 충돌 없도록 명확한 이름 사용(예: `memo-title`, `memo-content`, `board-search`).

### 4-3. 회색 텍스트 대비 개선 (WCAG AA 위반 교체)

- 라이트 배경에서 대비 부족한 회색 유틸리티를 **`text-on-surface-variant`** 로 교체:
  - `text-gray-400` → `text-on-surface-variant`
  - `text-slate-400` → `text-on-surface-variant`
  - `text-zinc-400` → `text-on-surface-variant`
- **천장 4영역 내 파일만** 교체. 예시 대상: `components/Blog/BlogPostContent.tsx`, `components/Blog/editor/EditorToolbar.tsx` 등.
- **Analysis/Stock/Chart 파일의 회색 클래스는 절대 교체하지 않는다(T07 영역).**

### 4-4. 보존 규칙 (시각 회귀 방지)

- **의미색 보존**: 상승/하락·상태 색(green/red/amber 등)과 그라데이션 위 **의도적 흰 글씨**(`text-white`)는 변경 금지.
- `text-gray-500`/`-600` 등 이미 AA를 만족하는 톤은 굳이 교체하지 않는다(범위는 `-400` 계열 위반에 집중).
- `role`/`aria-selected`가 **이미 올바른** 컴포넌트(`CommunityTabs.tsx`, `Pagination.tsx`)는 건드리지 않는다.

## 5. 도구 권장

- **Grep**: 천장 내 위반·후보 탐색.
  - 회색: `text-(gray|slate|zinc)-400`, glob `components/{Blog,community,SecureMemo,ui}/**/*.tsx`
  - 아이콘 버튼 후보: `<button` 주변 `aria-label` 부재 + SVG/`lucide` import 라인 점검.
  - label 연결: `<label` 와 `htmlFor` 동시 존재 여부.
- **Read**: 수정 전 대상 파일 정독(컨텍스트·중복 id 확인).
- **Edit**: 정밀 치환. `text-gray-400`는 동일 파일 내 다수일 수 있으니 라인별 컨텍스트 확인 후 `replace_all` 신중 사용.
- **Bash/PowerShell**: 검증 명령 실행.

## 6. 의존성

- **선행/동시**: T07(Analysis/Stock/Chart a11y)과 **천장이 분리**되어 충돌 없음. 동일 파일을 두 일꾼이 수정하지 않도록 천장 경계를 엄수.
- 공통 SOT(`globals.css` 토큰)는 읽기 전용 — 다른 일꾼이 토큰을 바꾸지 않는다는 전제 하에 `text-on-surface-variant` 사용.
- 본 작업은 UI 클래스/속성 수준 변경으로 비즈니스 로직 의존성 없음.

## 7. 검증 (모두 PASS 필요)

루트 `G:\11_dev\260601 코인 차트분석` 에서:

1. 타입체크: `npx tsc --noEmit` → 에러 0.
2. 빌드: `npm run build` → 성공.
3. 회색 잔여 grep(천장 내): `text-(gray|slate|zinc)-400` 가 천장 4영역에서 **의도적 보존 건을 제외하고 0**인지 확인. 남는 게 있으면 사유를 handover에 기록.
4. aria-label/연결 확인: 4-1·4-2 대상 파일에서 `aria-label` 및 `htmlFor`↔`id` 쌍이 실제로 추가됐는지 Grep으로 재확인.
5. 보존 확인: 의미색·`text-white`·`CommunityTabs`/`Pagination` 미변경 확인.

> 검증 명령의 **실제 출력**을 근거로 PASS를 주장한다(추정 금지).

## 8. 완료 신호

- 인수인계서 작성: **`docs/handover/2026-06-13-R9-T08-a11y-contrast.md`** (한국어).
  - 포함: 변경 파일 목록(영역별), 추가한 aria-label·연결 id 목록, 교체한 회색→토큰 건수, 보존 결정(의미색/흰글씨/탭), 검증 4종 결과(tsc·build·grep 잔여·확인), 잔여 위험.
- 커밋은 지휘자 통합 단계에서 수행될 수 있으니, 일꾼은 **변경 + handover**까지 남기고 cs(세션 종료)는 생략 가능(지휘자가 통합 cs 수행).

## 9. 내부 병렬 (mode 2 — 영역별 팬아웃)

천장 4영역을 **병렬 서브에이전트**로 분담:

- 에이전트 A: `components/Blog/` (BlogSearchBar aria-label, BlogPostContent/editor 회색 교체 등)
- 에이전트 B: `components/community/` (BoardListControls 검색 input 연결, 회색 교체 — 단 CommunityTabs/Pagination 보존)
- 에이전트 C: `components/SecureMemo/` (MemoCreateModal label htmlFor 연결, 회색 교체)
- 에이전트 D: `components/ui/` (badge/button/card/label/separator 회색·라벨 점검)

각 에이전트는 **자기 영역 밖 파일을 만지지 않는다.** 완료 후 결과를 취합해 검증(7)·handover(8)를 단일하게 수행.

---

## ⚠️ 안티패턴 (하지 말 것)

- ❌ `components/Analysis`·`Stock`·`Chart` 파일 수정 (→ T07 영역).
- ❌ 천장 4영역 밖 어떤 파일이라도 생성·수정.
- ❌ `app/globals.css`·`CLAUDE.md` 등 SOT 수정.
- ❌ 의미색(상승/하락) 또는 그라데이션 위 의도적 `text-white` 변경.
- ❌ 이미 올바른 `CommunityTabs`/`Pagination`의 `role`/`aria-selected` 건드리기.
- ❌ `text-gray-500/600` 등 AA 만족 톤까지 무분별 교체(범위 이탈·시각 회귀).
- ❌ 검증 미실행 상태로 "완료" 주장, 영어 주석/커밋, `.env`·`nul` 생성.
