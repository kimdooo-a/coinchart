# T02 — analysis 라우트 useAnalysisData 정리 (미사용/하드코딩 명시화, 실등급 연동 보류)

## 1. 컨텍스트

- 프로젝트: Crypto Chart Analysis (코인 차트 분석)
- 작업 디렉토리(쓰기 허용): **`app/analysis/[symbol]/` 하위만** (page.tsx · `_lib/` · `_components/`)
- 본 터미널 역할: **T02 / 4** — analysis 상세 라우트의 기술부채(미호출 setter·미사용 구조분해) 정리
- 라운드: **R15 (tech-debt)** / Wave 1 (독립)

## 2. 배경 (왜 이 작업인가)

`app/analysis/[symbol]/_lib/useAnalysisData.ts`에 **죽은 코드**가 있다:

- `const [userTier, setUserTier] = useState<'free' | 'pro'>('free')` — **`setUserTier`가 코드 전체에서 한 번도 호출되지 않음** → `userTier`는 영원히 `'free'`.
- 즉 현재 분석 상세 페이지는 **항상 free 등급으로 렌더**되며, `AnalysisGrid`·`BacktestCard`로 전달되는 `userTier`도 항상 `'free'`.

### ⚠️ 범위 제한 — 실등급 연동은 이번에 하지 않는다

코드베이스에 **실제 tier 소스가 없다**(다른 패널 `components/Analysis/StockPanel.tsx`도 `isPro=false` 하드코딩, `AnalysisPanel.tsx`는 `'pro'` 하드코딩). 실등급 연동은 Supabase 세션→tier 해석 로직 신설 + pro-gate 제품결정이 필요한 **별도 기능**이며, 커뮤니티 피벗·`NEXT_PUBLIC_DISABLE_PRO_GATE` 상황에서 지금 가치가 낮아 **R15에서 보류**한다.

**따라서 본 작업은 "정리 + 의도 명시화"에 한정한다.** 동작(렌더 결과)은 보존한다.

## 3. 공통 SOT (읽기 전용)

```
lib/config/gates.ts                              isDisabledProGate 킬스위치 정의 (연동 시 진입점이 될 곳 — 이번엔 참조만)
app/analysis/[symbol]/_lib/useAnalysisData.ts    대상 1 (userTier state)
app/analysis/[symbol]/page.tsx                   useAnalysisData 구조분해 소비처
app/analysis/[symbol]/_components/AnalysisGrid.tsx, BacktestCard.tsx   userTier prop 소비처
```

## 4. 작업 목표

다음 중 **실제 코드 상태를 확인한 뒤** 적용 (현 상태와 다르면 현 상태 기준으로 판단):

1. **`useAnalysisData.ts`의 `userTier` 처리 정리** — 둘 중 택1 (더 깔끔한 쪽):
   - (A) `setUserTier` 미사용이므로 setter 제거 → `const userTier: 'free' | 'pro' = 'free'` 상수화 + 바로 위에 명시 주석:
     `// TODO(R15+): 실등급 연동 보류 — gates.ts isDisabledProGate + Supabase 세션 기반 tier 해석 필요. 현재 free 고정(pro-gate 제품결정 대기).`
   - (B) 향후 연동 지점을 살리고 싶으면 `useState` 유지하되, `setUserTier` 미사용 lint 경고를 없애도록 위 TODO 주석으로 의도 명시.
   - **권장 (A)** — 죽은 setter 제거가 가장 정직.
2. **미사용 구조분해 변수 정리** — `page.tsx`의 `useAnalysisData(...)` 구조분해에서 **실제로 JSX/로직에 쓰이지 않는** 변수가 있으면 제거. (현재 전부 사용 중일 수 있음 — `eslint`/`tsc`로 확인 후 미사용만 제거. 사용 중인 것을 억지로 빼지 말 것.)
3. 그 외 `useAnalysisData`의 `any` 사용(`useState<any[]>([])` 등)이 **쉽게 교체 가능하면** 적절한 타입으로 정리(과욕 금지 — 불확실하면 그대로 두고 handover에 후보로 기록).
4. **동작 보존**: 렌더 결과·tier 전달값(여전히 free)·기존 fetch 로직은 그대로.

## 5. 도구 권장

- `npx eslint app/analysis/[symbol]/` 로 미사용 변수·any 경고 먼저 수집 → 근거 기반 정리.
- `Grep "setUserTier"`로 미호출 재확인.

## 6. 의존성

- **독립** (Wave 1). `app/analysis/[symbol]/` 외 파일(특히 `components/Analysis/*`, `lib/`)은 **읽기만**. 다른 패널 하드코딩 정리는 본 라운드 범위 아님.

## 7. 검증 (자가)

```powershell
# 1) setUserTier 잔존 여부 (A안 선택 시 0이어야)
Select-String -Path "app/analysis/[symbol]/_lib/useAnalysisData.ts" -Pattern "setUserTier"
# 2) 타입체크 — 반드시 EXIT 0
npx tsc --noEmit
# 3) eslint — analysis 라우트 경고 0 (또는 착수 전 대비 감소)
npx eslint "app/analysis/[symbol]/**/*.{ts,tsx}"
# 4) 빌드 (전역 영향 없음 확인)
npm run build
```

## 8. 완료 신호

`docs/handover/2026-05-30-R15-T02-analysis-cleanup.md` 작성 — 택한 방안(A/B)·제거한 미사용 변수 목록·any 정리 내역·**동작 보존 근거(tier 전달값 여전히 free 확인)**·tsc/eslint/build 결과·실등급 연동을 보류한 이유 1줄.

## 안티패턴

- ❌ `app/analysis/[symbol]/` 외 파일 수정 (다른 패널 하드코딩 정리 금지 — 범위 외)
- ❌ **실등급 연동을 임의로 구현** (제품결정 대기 — 보류가 본 작업 지시)
- ❌ 사용 중인 구조분해 변수를 미사용으로 오판해 제거 → 빌드 깨짐
- ❌ any 일괄 치환하다 타입 에러 양산 (확실한 것만)
- ❌ 렌더 동작 변경 (tier가 pro로 바뀌는 등)
- ❌ handover 누락
