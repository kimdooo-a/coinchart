# T05 — 디자인 토큰 클래스 통일 (on-surface-variant / muted-foreground 단일화)

> **⚠️ Wave 2 — T01~T04(Wave1)가 통합·커밋된 뒤에 발사할 것.** 본 작업은 전역 89파일 className을 교체하므로, Wave1 작업(특히 T03 `app/page.tsx`·T04 차트 컴포넌트)과 같은 파일을 건드린다. Wave1 미통합 상태로 발사하면 머지 충돌이 발생한다. 지휘부가 "T05 발사 가능" 신호를 준 뒤 시작.

## 1. 컨텍스트
- 프로젝트: Crypto Chart Analysis — Tailwind CSS v4 + 디자인 토큰
- 작업 디렉토리: `F:\11_dev\260523 코인 차트분석`
- 본 터미널 역할: **T05 / 5** (R6-polish Wave 2) — 텍스트 보조색 토큰 클래스 단일화
- 쓰기 영역: 전역(`app/`·`components/` className) — 단, **Wave2 단독이라 다른 터미널과 동시 충돌 없음**. `app/globals.css`는 토큰 정의 확인용(아래 §4 판단 후 필요 시만 수정).

## 2. 배경 — 핵심 사실 (시각 회귀 0)
같은 "보조 텍스트색"이 두 클래스로 이원화돼 있다:
- `text-on-surface-variant` — **307건** (Material 3 토큰계, 원천)
- `text-muted-foreground` — **138건** (shadcn 토큰계)

`app/globals.css`에 **`--color-muted-foreground: var(--color-on-surface-variant)`** 로 정의됨 → 두 토큰은 **이미 동일 색(`#424656`)을 가리키는 별칭**. 따라서 className을 한쪽으로 모아도 **렌더 결과 변화 0**(순수 문자열 정합). 안전한 기계적 통일 작업.

## 3. 공통 SOT (읽기 전용)
- `app/globals.css` (§23·24·90 토큰 정의·별칭 관계) — **먼저 정독**
- `CLAUDE.md` — 디자인 톤(네이버 스타일 라이트)
- `docs/handover/2026-05-25-session30-r5.md` — R6 후보 #5 맥락

## 4. SSOT 방향 결정 (먼저 판단)
globals.css 별칭 구조를 확인한 뒤 통일 방향을 정한다. **권장: 원천 토큰 `on-surface-variant`로 통일** (다수파 307건 유지, 138건만 교체, 토큰 계층상 원천이 SSOT). 이유·반례:
- shadcn `components/ui/*` 내부는 `muted-foreground`를 표준으로 쓸 수 있음 → **`components/ui/`의 shadcn 원본 컴포넌트 정의는 건드리지 말 것**(별칭이 살아있어 동작 보존). 앱/커뮤니티 코드 className만 통일.
- 별칭 `--color-muted-foreground`는 globals.css에 **유지**(shadcn ui/ 컴포넌트 의존). 제거하지 않는다.

대안(반대 방향 `muted-foreground`로 통일)을 택할 근거가 있으면 handover에 사유 기록. 단 **방향은 하나로 일관**.

## 5. 작업 목표
1. 결정한 방향으로 앱 코드 className 일괄 교체(`text-`·`bg-`·`border-` 접두 전부). 예(권장 방향): `text-muted-foreground` → `text-on-surface-variant`, `bg-muted-foreground` → `bg-on-surface-variant`.
   - 교체 범위: `app/**`·`components/**` (단 `components/ui/` shadcn 원본 제외).
2. globals.css 별칭은 유지. 토큰 정의 자체는 변경 없음.
3. 시각 회귀 0 확인(별칭 동일 색이므로 빌드·스냅샷 비교).

## 6. 도구 권장
- 일괄 치환 후 반드시 tsc·build로 검증. `replace_all` 편집 또는 안전한 sed/PowerShell 치환.

## 7. 검증
```powershell
npx tsc --noEmit                       # 0
npm run build                          # green (54/54, 모드 회귀 없음)
# 통일 방향(권장: on-surface-variant) 외 잔존 0 — 단 components/ui/ 제외
Select-String -Path app/**/*.tsx,components/**/*.tsx -Pattern 'muted-foreground' |
  Where-Object { $_.Path -notmatch 'components[\\/]ui[\\/]' }   # 0건 (권장 방향 기준)
# 별칭 정의는 globals.css에 살아있어야 함
Select-String -Path app/globals.css -Pattern '--color-muted-foreground'
```
- 가능하면 통일 전후 주요 페이지(`/`·`/board/[slug]`·`/news`·`/coin/[symbol]`) 빌드 산출 비교로 시각 동일 확인.

## 8. 완료 신호
`docs/handover/2026-05-25-R6-T05-token-unify.md` 작성. 포함: 통일 방향·사유, 교체 건수(파일·클래스), `components/ui/` 제외 처리, globals.css 별칭 유지 확인, tsc/build 결과, 시각 회귀 0 근거.

## 안티패턴
- ❌ Wave1 미통합 상태로 발사 (머지 충돌)
- ❌ `components/ui/` shadcn 원본 컴포넌트 토큰 변경
- ❌ globals.css `--color-muted-foreground` 별칭 제거 (shadcn ui/ 깨짐)
- ❌ 통일 방향 혼용(절반은 A, 절반은 B)
- ❌ 토큰 외 무관한 색/레이아웃 변경 / 한국어 주석·handover 누락
