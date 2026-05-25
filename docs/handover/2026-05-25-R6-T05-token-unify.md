# R6-polish T05 — 디자인 토큰 클래스 통일 (on-surface-variant / muted-foreground 단일화)

- **날짜**: 2026-05-25
- **라운드/터미널**: R6-polish Wave 2 / T05 (텍스트 보조색 토큰 클래스 단일화)
- **작업 지시**: `docs/orchestration/2026-05-25-R6-polish/T05-token-unify.md`
- **결과**: ✅ 완료 (tsc 0 / build green / 시각 회귀 0)

---

## 1. 통일 방향 및 사유

**방향: `text-muted-foreground` → `text-on-surface-variant` (원천 토큰으로 통일)** — 작업 지시 §4 권장안 채택.

근거:
- 두 클래스는 `app/globals.css:90`의 `--color-muted-foreground: var(--color-on-surface-variant)` 별칭으로 **이미 동일 색(`#424656`)을 가리킴**. 따라서 한쪽으로 모아도 **렌더 결과 변화 0**(순수 문자열 정합).
- `on-surface-variant`가 Material 3 토큰계의 **원천(SSOT)**이며 다수파(작업 전 307건). shadcn 토큰계 `muted-foreground`(138건)를 원천으로 흡수하는 것이 토큰 계층상 타당.
- 반대 방향(`muted-foreground`로 통일)을 택할 근거 없음 — 채택하지 않음.

## 2. 교체 건수 (파일·클래스)

- **변경 파일 수**: 29개 (`app/**`·`components/**`, `components/ui/` 제외)
- **교체 클래스 총건수**: 137건
- **git diff**: 136 insertions / 136 deletions (순수 1:1 치환, 라인 수 변동 없음)
  - 137건 vs 136라인 차이는 `components/dashboard-grid.tsx:43` **한 줄에 2건**(`text-on-surface-variant/70` + `text-on-surface-variant`)이 있어 발생 — 정상.

### 파일별 교체 건수

| 파일 | 건수 | 파일 | 건수 |
|------|------|------|------|
| `app/admin/page.tsx` | 10 | `app/watchlist/page.tsx` | 1 |
| `app/analysis/page.tsx` | 1 | `components/Analysis/AnalysisPanel.tsx` | 7 |
| `app/auth/auth-code-error/page.tsx` | 2 | `components/Analysis/ChartAnalysisPanel.tsx` | 3 |
| `app/auth/login/page.tsx` | 1 | `components/SecureMemo/MemoCard.tsx` | 2 |
| `app/calendar/page.tsx` | 5 | `components/SecureMemo/MemoCreateModal.tsx` | 5 |
| `app/contact/page.tsx` | 10 | `components/SecureMemo/MemoUnlockModal.tsx` | 3 |
| `app/history/page.tsx` | 8 | `components/SecureMemo/MemoViewModal.tsx` | 7 |
| `app/portfolio/page.tsx` | 14 | `components/Stock/InvestmentQuotes.tsx` | 2 |
| `app/pricing/page.tsx` | 2 | `components/Stock/StockAnalysisPanel.tsx` | 19 |
| `app/privacy/page.tsx` | 1 | `components/Stock/StockRSIHeatmap.tsx` | 1 |
| `app/secure-memo/page.tsx` | 4 | `components/Stock/StockSectorPerformance.tsx` | 3 |
| `app/settings/page.tsx` | 2 | `components/dashboard-grid.tsx` | 4 |
| `app/stock/page.tsx` | 9 | `components/hero-chart.tsx` | 1 |
| `app/stock-market/page.tsx` | 7 | `components/news-rotator.tsx` | 2 |
| `app/terms/page.tsx` | 1 | | |

- **접두사**: 사용처는 전부 `text-` 접두사뿐 (`bg-`·`border-` 변형 없음). `text-muted-foreground` 문자열만 치환했으므로 opacity 변형(`/70`·`/90`·`/50`·`/40`)도 함께 `text-on-surface-variant/NN`으로 자연 보존됨.
  - opacity 변형 7건 검증 완료: `app/contact/page.tsx`(/50 ×4), `components/dashboard-grid.tsx`(/70·/90·/40).

## 3. `components/ui/` 제외 처리 (shadcn 원본 보존)

- 치환 시 `components/ui/` 경로 전체를 정규식(`components[\\/]ui[\\/]`)으로 제외.
- `components/ui/` 내 `muted-foreground` 사용은 **`components/ui/card.tsx:53` 1건뿐**이며 그대로 보존됨:
  ```tsx
  className={cn("text-sm text-muted-foreground", className)}
  ```
- shadcn 표준 토큰을 쓰는 원본 컴포넌트이므로 별칭(아래 §4)이 살아있는 한 동작·렌더 보존.

## 4. `globals.css` 별칭 유지 확인

- `app/globals.css:90` 별칭 정의 **변경 없이 유지**:
  ```css
  --color-muted-foreground: var(--color-on-surface-variant);
  ```
- 토큰 정의 자체는 일절 수정하지 않음. shadcn `ui/` 컴포넌트(card.tsx 등)가 이 별칭에 의존하므로 제거하지 않음(작업 지시 안티패턴 준수).

## 5. 검증 결과 (tsc / build)

| 검증 | 명령 | 결과 |
|------|------|------|
| 타입 검사 | `npx tsc --noEmit` | **exit 0** ✓ |
| 프로덕션 빌드 | `npm run build` | **green (exit 0)** ✓, 전 라우트 정상 생성(모드 회귀 없음) |
| 잔존 검증 | `Select-String 'muted-foreground'` (app·components, ui/ 제외) | **0건** ✓ |
| 별칭 정의 | `Select-String '--color-muted-foreground'` (globals.css) | **1건 존재** ✓ |

## 6. 시각 회귀 0 근거

- 두 토큰은 `globals.css` 별칭으로 **동일 색(`#424656`)을 가리킴** → className 문자열만 `muted-foreground` → `on-surface-variant`로 바뀌고 실제 색 출력은 불변.
- git diff 136/136 insertions·deletions로 **순수 1:1 문자열 치환**임을 확인(레이아웃·다른 색·구조 변경 0).
- UTF-8(no BOM) 인코딩 보존(.NET `WriteAllText` + `UTF8Encoding($false)`) → BOM 추가 등 부수 변경 없음(diff 라인 수 변동 없음으로 교차 확인).
- 빌드 green으로 Tailwind v4 토큰 클래스 정상 해석 확인.

## 7. 변경 파일 목록 (git)

`app/` 16개 + `components/` 13개 = 총 29개 (위 §2 표 참조). `app/globals.css` 및 `components/ui/**`는 미변경.

## 안티패턴 준수 체크

- ✅ Wave1 통합 이후 발사 (Wave2 단독 작업)
- ✅ `components/ui/` shadcn 원본(card.tsx) 토큰 미변경
- ✅ `globals.css` `--color-muted-foreground` 별칭 미제거
- ✅ 통일 방향 단일(`on-surface-variant`) — 혼용 없음
- ✅ 토큰 외 무관한 색/레이아웃 변경 없음
