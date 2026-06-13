# T06 — 페이지 라이트화: Hero/배경 gradient 토큰 통일

> R9 (gap-verify) 통합 프롬프트 SOT · 역할 **T06 / 10** · 일꾼용 자기완결 문서
> 프로젝트: 코인·주식 커뮤니티 (Next.js 16, Tailwind v4, Material 3 + 한국식 빨↑/파↓ 라이트 테마)
> 루트: `G:\11_dev\260601 코인 차트분석`

---

## 1. 컨텍스트

v2.0 라이트화 피벗으로 다크 톤은 전반적으로 제거됐으나, 여러 페이지가 **Hero gradient**와
**배경 blur gradient**를 **하드코딩 색상**으로 제각각 사용하고 있다. 대표 잔재 패턴:

- Hero: `from-blue-600 to-indigo-600`, `from-yellow-500 to-amber-500`
- 배경 blur: `bg-yellow-500/10 blur-[120px]`, `bg-emerald-500/10`, `bg-blue-500/10`

이로 인해 페이지마다 동일한 "히어로/배경 광원" 의도가 서로 다른 임의 색으로 표현되어
**토큰 비일관**이 발생한다. 본 작업은 이 하드코딩 gradient를 `app/globals.css @theme`에
정의된 토큰(primary/secondary/surface-container 계열)으로 **통일**한다. 레이아웃·구조는
불변, **색만 토큰화**하여 시각 회귀를 최소화한다.

참고 — `app/globals.css @theme` 확정 토큰(읽기 전용으로 확인됨):
`--color-primary: #0050cb`, `--color-secondary: #006e2e`,
`--color-surface-container` / `-high` / `-highest`, `--color-primary-container` 등.
→ Tailwind v4에서 `from-primary`, `to-secondary`, `bg-primary/5`, `bg-surface-container-high` 형태로 사용.

## 2. 공통 SOT (읽기 전용 — 절대 수정 금지)

- `CLAUDE.md` (프로젝트 규칙)
- `app/globals.css` (@theme 토큰 정의 **확인용으로만 읽기** — 이 파일은 T06 천장 아님)
- `docs/references/_WEB_CONTRACT.md` (웹 계약)
- `docs/rules/*.md` (개발/모듈화 규칙)

## 3. 공통 의무

- 한국어 주석 / 한국어 커밋 메시지
- `.env`, `.env.local`, `nul` 커밋 금지
- 기존 로직·레이아웃·이벤트 핸들러 불변 (색 클래스만 치환)
- 각 페이지가 `"use client"`인지 확인하되 **지시문/로직은 건드리지 않는다**

## 4. 작업 목표

### 4-1. 쓰기 천장 (정확히 이 8개 `page.tsx`만 수정 — 그 외 파일 일절 금지)

```
app/watchlist/page.tsx
app/settings/page.tsx
app/contact/page.tsx
app/terms/page.tsx
app/privacy/page.tsx
app/secure-memo/page.tsx
app/calendar/page.tsx
app/pricing/page.tsx
```

### 4-2. 치환 규칙

1. **Hero gradient 하드코딩 → 토큰 통일**
   - `from-blue-600 to-indigo-600`, `from-blue-500 to-...` 등 → `from-primary to-secondary`
     (단색 그라데이션이 더 자연스러우면 `from-primary/80 to-primary/40` 형태 허용)
   - 반드시 `app/globals.css @theme` 정의 토큰(primary / secondary / primary-container)만 사용.
     **임의의 새 색상명 도입 금지.**
2. **배경 blur gradient `bg-{color}-500/10` → 토큰화**
   - `bg-yellow-500/10`, `bg-emerald-500/10`, `bg-blue-500/10` 등 (블롭/광원 장식)
     → `bg-primary/5` (기본) 또는 면 채움 의도면 `bg-surface-container-high`
   - `blur-[120px]` 등 blur 유틸리티는 **유지** (레이아웃/효과 불변, 색 클래스만 치환)

### 4-3. 보존(절대 토큰화하지 말 것 — 의미색)

- **빨강/파랑 = 시세 상승/하락** (한국식 빨↑·파↓) → 보존
- **노랑 = 프리미엄/Pro 등급** 강조 (특히 `pricing`) → 의미상 노랑이면 보존
- **주황 = 경고/주의** → 보존
- 판단 기준: "그 색이 **장식적 광원/히어로 배경**이면 토큰화, **데이터 의미**를 전달하면 보존"

## 5. 도구 권장

- 진입 시 `Grep`으로 천장 8개 파일에서 잔재 패턴 위치 확인:
  `from-blue` / `to-indigo` / `bg-yellow-500/10` / `bg-emerald-500/10` / `bg-blue-500/10` / `from-yellow-500 to-amber`
- 파일 수정은 `Read` → `Edit`. 색 클래스만 정밀 치환 (`replace_all` 신중히).
- 토큰 존재 여부 의심 시 `app/globals.css` 재확인(읽기만).

## 6. 의존성

- **선행 의존: 없음.** 8개 page.tsx는 파일별 완전 독립 → 동시 진행 가능.
- **영역 경계(충돌 차단)**:
  - `app/analysis/` 는 **T07 영역** → 절대 손대지 않는다.
  - `app/globals.css` 토큰 정의는 **이 라운드에서 변경 금지**. 새 토큰이 필요하면
    추가하지 말고 **handover에 "토큰 추가 권고"로 기록**하고 가용 토큰으로 우회.
  - 천장 외 컴포넌트(`components/**`)·layout·기타 page는 변경 금지.

## 7. 검증 (완료 전 필수 — 전부 통과해야 함)

```bash
npx tsc --noEmit          # 타입 에러 0
npm run build             # 빌드 성공
```

- 잔재 grep 확인 (천장 8개 파일에 한정해 0이어야 함):
  `from-blue` / `to-indigo` / `bg-yellow-500/10` / `bg-emerald-500/10` / `from-yellow-500 to-amber`
  (단, 4-3 보존 대상으로 의도적으로 남긴 의미색은 handover에 "보존 사유"와 함께 명시)
- 시각 회귀 점검: 레이아웃/간격/blur 강도 불변, 색만 변경됐는지 diff로 확인.

## 8. 완료 신호

- 산출 handover 작성: `docs/handover/2026-06-13-R9-T06-page-lightify-gradient.md`
  - 포함: 수정 파일 목록(8개 중 실제 변경분), 파일별 치환 전/후 색 클래스 표,
    보존한 의미색 목록 + 사유, `tsc`/`build` 결과, 잔재 grep 결과,
    globals.css 신규 토큰 추가 권고(있으면).
- 커밋 메시지(한국어) 예: `style(R9-T06): 페이지 Hero/배경 gradient 하드코딩 → 토큰 통일 (8개 page)`

## 9. 내부 병렬 (mode 3 — kdyswarm worktree)

- 8개 page.tsx는 파일별 독립 → **병렬 팬아웃**: sub-agent 1개당 **page.tsx 1개** 담당.
- 천장 = 위 4-1의 8개 파일. sub-agent는 자기 담당 파일 외에는 **읽기만** 허용.
- 각 sub-agent 산출: 치환 전/후 색 클래스 표 + 보존 의미색 메모 → 지휘 에이전트가
  handover로 통합. 통합 후 `tsc` / `build`는 **전체 1회** 실행.
- worktree 격리: 파일 경합 없음(파일별 1:1) → 충돌 가능성 사실상 0.

---

### 안티패턴 (하지 말 것)

- ❌ `app/globals.css`에 토큰 추가/수정 (이번 라운드 금지 — 권고만 기록)
- ❌ `app/analysis/` 등 T07 영역 침범
- ❌ 천장 8개 외 파일(components, layout, 기타 page) 수정
- ❌ 시세 빨/파, 프리미엄 노랑, 경고 주황 등 **의미색을 무분별 토큰화**
- ❌ 레이아웃/간격/blur 강도 변경 (색 클래스 외 diff 발생)
- ❌ `@theme`에 없는 임의 색상명(`from-violet-500` 등) 새로 도입
- ❌ `"use client"` 지시문·로직·핸들러 변경
