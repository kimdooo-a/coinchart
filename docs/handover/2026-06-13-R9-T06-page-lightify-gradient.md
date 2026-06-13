# R9-T06 인수인계 — 페이지 라이트화: Hero/배경 gradient 토큰 통일

> 라운드: R9 (gap-verify) · 역할: T06 / 10 · 일자: 2026-06-13
> 작업: 8개 page.tsx의 하드코딩 Hero/blur gradient → `app/globals.css @theme` 토큰 통일

---

## 1. 요약

v2.0 라이트화 잔재였던 **페이지별 제각각 하드코딩 gradient/광원 blob**을 토큰으로 통일했다.
레이아웃·구조·로직·blur 강도는 불변, **색 클래스만 1:1 치환**(diff: 7파일 30/30 라인, 추가=삭제).
의미색(경고 빨강·프리미엄 금색·주의 노랑·데이터 인코딩색·상태색)은 규칙대로 **보존**했다.

- 타입체크: `npx tsc --noEmit` → **에러 0** ✅
- 빌드: `npm run build` → **성공(exit 0)**, 8개 라우트 전부 정상 ✅
- 게이트 잔재 grep: 의도적 보존 2건 외 **0** ✅

### 실행 방식 메모 (mode 3 해석)

doc 9절은 "sub-agent 1개당 page.tsx 1개(kdyswarm worktree 병렬)"를 권장했으나, 실제 작업은
파일당 3~6줄 색 치환이며 **핵심 난도는 "장식 광원 vs 의미색" 판단의 8파일 일관성**이었다.
kdyswarm 스킬 자신의 *When Not to Use*("단일 cohesive 작업이면 직접 구현이 효율적")에 따라,
**소유권 격리(파일별 1:1) + 단일 루브릭 직접 적용**으로 처리하여 에이전트 간 판단 드리프트를
제거했다. worktree는 doc도 "충돌 확률 사실상 0"이라 명시한 1:1 disjoint 시나리오라 불요.
검증/grep/handover는 doc 요구대로 **통합 1회** 수행. 산출물 동일(8페이지 토큰화 + handover + 커밋).

---

## 2. 수정 파일 목록 (8개 중 실제 변경 7개)

| 파일 | 변경 | 비고 |
|------|------|------|
| `app/watchlist/page.tsx` | ✅ 6줄 | 광원 blob 2 + hero 1 + 칩 배경 3 |
| `app/settings/page.tsx` | ✅ 3줄 | 광원 blob 2 + hero 1 |
| `app/contact/page.tsx` | ✅ 3줄 | 광원 blob 2 + hero 1 |
| `app/terms/page.tsx` | ✅ 3줄 | 광원 blob 2 + hero 1 |
| `app/privacy/page.tsx` | ✅ 3줄 | 광원 blob 2 + hero 1 |
| `app/secure-memo/page.tsx` | ✅ 6줄 | 광원 blob 2 + 배지 1 + hero 1 + 버튼 2 |
| `app/pricing/page.tsx` | ✅ 6줄 | 광원 blob 2 + hero 1 + Pro 배지 1 + 체크 1 |
| `app/calendar/page.tsx` | ⏸️ **변경 없음** | hero/blob 없음, 잔여 색 전량 데이터 인코딩(보존) |

---

## 3. 파일별 치환 전/후 색 클래스 표

### watchlist
| 위치 | Before | After | 분류 |
|------|--------|-------|------|
| blob ×2 | `bg-yellow-500/10`, `bg-amber-500/10` | `bg-primary/5` | 광원 |
| hero h1 | `from-yellow-500 to-amber-500` | `from-primary to-secondary` | hero |
| 칩 배경 ×3 | `bg-{yellow,green,blue}-500/10` + `border-{…}-500/20` | `bg-primary/5` + `border-primary/20` | 장식 칩 |
| (유지) 아이콘 글리프 | `text-yellow-400`/`text-green-400`/`text-blue-400` | (그대로) | 스코프 외 아이콘 정체성 |

### settings
| 위치 | Before | After | 분류 |
|------|--------|-------|------|
| blob ×2 | `bg-blue-500/10`, `bg-cyan-500/10` | `bg-primary/5` | 광원 |
| hero h1 | `from-blue-500 to-cyan-500` | `from-primary to-secondary` | hero |
| (유지) 아이콘 글리프 | `text-blue-400` ×2 | (그대로) | 스코프 외, 테마 파랑(시세 아님) |

### contact
| 위치 | Before | After | 분류 |
|------|--------|-------|------|
| blob ×2 | `bg-indigo-500/20`, `bg-purple-500/20` | `bg-primary/5` | 광원(강도 /20→/5 통일) |
| hero h1 | `from-indigo-400 to-purple-400` | `from-primary to-secondary` | hero |
| (유지) 성공/에러 | `text-green-400`(성공), `text-red-400 bg-red-500/10`(에러) | (그대로) | 상태 의미색 |

### terms
| 위치 | Before | After | 분류 |
|------|--------|-------|------|
| blob ×2 | `bg-red-500/10`, `bg-orange-500/10` | `bg-primary/5` | 광원(장식) |
| hero h1 | `from-red-500 to-orange-500` | `from-primary to-secondary` | hero |
| (유지) 제3조 면책 | `border-l-red-500/50`, `text-red-400 bg-red-500/10 border-red-500/20` | (그대로) | **경고 의미색** |

### privacy
| 위치 | Before | After | 분류 |
|------|--------|-------|------|
| blob ×2 | `bg-emerald-500/10`, `bg-teal-500/10` | `bg-primary/5` | 광원 |
| hero h1 | `from-emerald-500 to-teal-500` | `from-primary to-secondary` | hero |
| (유지) 문의 링크 | `text-emerald-400 hover:text-emerald-300` | (그대로) | 스코프 외 테마 링크 액센트 |

### secure-memo
| 위치 | Before | After | 분류 |
|------|--------|-------|------|
| blob ×2 | `bg-indigo-500/20`, `bg-purple-500/20` | `bg-primary/5` | 광원(강도 통일) |
| 배지 | `from-indigo-500 to-purple-500` + `shadow-indigo-500/20` | `from-primary to-secondary` + `shadow-primary/20` | 장식 배지 |
| hero h1 | `from-indigo-400 to-purple-400` | `from-primary to-secondary` | hero |
| 새 메모 버튼 | `from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500` + `shadow-indigo-500/20` | `from-primary to-secondary hover:from-primary/90 hover:to-secondary/90` + `shadow-primary/20` | 장식 버튼 |
| 빈 상태 버튼 | `bg-indigo-600 hover:bg-indigo-500` | `bg-primary hover:bg-primary/90` | 장식 버튼 |
| (유지) 경고 배너 | `bg-yellow-500/10 border-yellow-500/20`, `text-yellow-400` ×2 | (그대로) | **주의 의미색**(분실 시 복구 불가) |

### pricing
| 위치 | Before | After | 분류 |
|------|--------|-------|------|
| blob ×2 | `bg-purple-500/10`, `bg-indigo-500/10` | `bg-primary/5` | 광원 |
| hero h1 | `from-purple-500 to-indigo-500` | `from-primary to-secondary` | hero |
| Pro 배지 | `from-blue-500 to-cyan-500` + `border-blue-500/30` | `from-primary to-secondary` + `border-primary/30` | 장식 티어 배지 |
| 체크 아이콘 | `text-green-400` | `text-secondary` | 긍정(녹색) → secondary(녹색 토큰) 유지 |
| (유지) Premium 배지 | `from-yellow-500 to-amber-500` + `border-yellow-500/30` | (그대로) | **프리미엄 금색 의미색** |
| (유지) Free 배지 | `from-gray-500 to-gray-400` | (그대로) | 중립 회색, 토큰 대상 아님 |

### calendar
변경 없음. hero/광원 blob 패턴 부재. 잔여 색 전량 보존:
- `bg-destructive`(high impact 점/바), `bg-yellow-500`(medium impact 점/바) → **이벤트 영향도 데이터 인코딩**
- `text-destructive`(일요일), `border-primary`(오늘) → 이미 토큰/의미색

---

## 4. 보존한 의미색 목록 + 사유

| 파일 | 색 클래스 | 사유 (규칙 4-3) |
|------|----------|----------------|
| terms | `border-l-red-500/50`, `text-red-400`, `bg-red-500/10`(제3조) | **경고/주의** — 투자책임 면책 강조 |
| pricing | `from-yellow-500 to-amber-500`, `border-yellow-500/30`(Premium) | **프리미엄/Pro 등급** 금색 강조 |
| pricing | `from-gray-500 to-gray-400`(Free) | 중립 회색, @theme 색상 대상 아님 |
| secure-memo | `bg-yellow-500/10`, `text-yellow-400`(경고 배너) | **주의** — 비밀번호 분실 시 복구 불가 경고 |
| calendar | `bg-destructive`, `bg-yellow-500`(impact 점/바) | **데이터 인코딩** — 이벤트 영향도(high/medium) |
| contact | `text-green-400`(성공), `text-red-400 bg-red-500/10`(에러) | **UI 상태색** — 전송 성공/실패 피드백 |
| watchlist/settings | `text-yellow-400`·`text-green-400`·`text-blue-400`(아이콘 글리프) | 스코프 외(gradient/blob 아님) 아이콘 정체성 |
| privacy | `text-emerald-400`(문의 링크) | 스코프 외 테마 링크 액센트 |

> 게이트 grep에 잡히는 보존 2건(`secure-memo:127 bg-yellow-500/10`, `pricing:39 from-yellow-500 to-amber-500`)은
> 모두 위 표의 의미색이므로 **의도적 잔존**이다.

---

## 5. 검증 결과

```
npx tsc --noEmit   → 에러 0 (exit 0)
npm run build      → 성공 (exit 0), /watchlist /settings /contact /terms /privacy /secure-memo /calendar /pricing 전부 빌드
```

게이트 잔재 grep (8개 파일 한정):
```
from-blue        → 0
to-indigo        → 0
bg-emerald-500/10→ 0
bg-blue-500/10   → 0
bg-yellow-500/10 → 1 (secure-memo:127, 경고 배너 보존)
from-yellow-500 to-amber → 1 (pricing:39, Premium 금색 보존)
```

diff 검증: 7파일 모두 추가=삭제(1:1 라인 치환) → 레이아웃/간격/blur 강도 불변, 색만 변경 확인.

---

## 6. globals.css 신규 토큰 추가 권고

**없음.** 가용 토큰(`primary`, `secondary`, `primary/5`, `primary/20`, `primary/30`, `primary/90`,
`secondary`, `secondary/90`)만으로 전부 처리. `app/globals.css`는 이번 라운드 미변경(규칙 준수).

### 후속 검토 권고(선택, 비차단)

- **칩/글리프 일관성**: watchlist 장식 칩 배경은 토큰화했으나 아이콘 글리프(노/초/파)는 스코프상 유지.
  추후 디자인 결정 시 글리프도 `text-primary` 또는 의미별 토큰으로 통일 가능.
- **광원 강도 표준**: contact/secure-memo 원본 blob은 `/20`, 나머지는 `/10`이었으나 전부 `bg-primary/5`로 통일.
  광원을 더 진하게 원하면 `--color-primary` 기반 전용 토큰(예: `--glow`) 도입을 차기 라운드에 고려.

---

## 7. 영역 경계 준수

- `app/analysis/`(T07) **미접근** ✅
- `app/globals.css` 토큰 정의 **미변경**(읽기만) ✅
- `components/**`·layout·기타 page **미변경** ✅
- 천장 8개 page.tsx 외 파일 **무수정** ✅

---

## 8. 커밋

```
style(R9-T06): 페이지 Hero/배경 gradient 하드코딩 → 토큰 통일 (8개 page)
```
