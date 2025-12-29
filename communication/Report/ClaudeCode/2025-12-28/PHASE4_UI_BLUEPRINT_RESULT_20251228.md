# PHASE4_UI_BLUEPRINT_RESULT_20251228

> ChartMaster 분석 페이지 UI 조합 설계 결과 (monet-registry 기반)

---

## 1. 전체 UI 구조 요약

분석 페이지는 **Header → Chart → Analysis Grid** 3단 구조로 구성한다.
monet-registry의 **Card/Section/Badge/Separator** 컴포넌트로 정보 위계를 표현한다.
Primary 정보(확률/신뢰도)는 **2-column 카드 그리드**, Secondary 정보는 **3-column Explanation 그리드**로 배치한다.
4가지 UI 상태(loading/insufficient/pro-locked/ok)는 **Badge variant + Card opacity**로 구분한다.
시각적 일관성은 **monet 컴포넌트 조합 규칙**을 통해 유지한다.

---

## 2. 분석 페이지 UI 블록별 컴포넌트 매핑

### 2.1 컴포넌트 매핑 표

| UI Block | monet Components | 구조 | 정보 위계 |
|----------|-----------------|------|----------|
| **Page Header** | Section + Label + Badge | 좌: Symbol+Price / 우: Timeframe Badge | Primary |
| **Chart Section** | Section (wrapper only) | 전체 너비, 차트 컨테이너 | Primary |
| **Probability Card** | Card + CardHeader + CardTitle + CardContent + Badge | 50% width, Badge로 방향 표시 | Primary |
| **Confidence Card** | Card + CardHeader + CardTitle + CardContent + Badge | 50% width, Grade Badge | Primary |
| **Explanation Card** | Card + CardContent + Separator | 3-column grid (Evidence/Risk/Watch) | Secondary |
| **Backtest Card** | Card + CardHeader + CardContent + CardFooter | 4-metric grid, Footer에 pro-lock | Secondary |
| **Position Status** | Card + CardContent + Badge | 단일 행, P&L Badge | Meta |

### 2.2 블록별 세부 구조

#### Page Header
```
Section
├── 좌측 영역 (flex-1)
│   ├── Label: Symbol 이름 (BTCUSDT)
│   └── CardTitle: 현재가격 ($94,500)
└── 우측 영역 (flex-shrink-0)
    └── Badge (outline): 타임프레임 (1D / 4H / 1H)
```
**적합 이유**: Section으로 의미적 구분, Badge로 선택 상태 표시

#### Probability Card
```
Card (50% width)
├── CardHeader
│   ├── CardTitle: "상승 확률"
│   └── Badge (variant by value): 방향 (UP/DOWN/SIDEWAYS)
└── CardContent
    ├── 대형 수치: 67%
    └── CardDescription: Regime 정보
```
**적합 이유**: CardTitle로 제목 강조, Badge variant로 방향성 직관 표현

#### Confidence Card
```
Card (50% width)
├── CardHeader
│   ├── CardTitle: "신뢰도 등급"
│   └── Badge (variant by grade): A/B/C/D/F
└── CardContent
    ├── 대형 문자: Grade Letter
    └── CardDescription: Score + Sample Size
```
**적합 이유**: Grade를 Badge로 색상 구분, 세부 정보는 Description으로 위계 분리

#### Explanation Card
```
Card (full width)
└── CardContent
    ├── Column 1: Evidence
    │   ├── Label: "근거"
    │   ├── Separator (vertical, blue)
    │   └── Bullet List
    ├── Column 2: Risk
    │   ├── Label: "위험"
    │   ├── Separator (vertical, orange)
    │   └── Bullet List
    └── Column 3: Watch
        ├── Label: "관찰"
        ├── Separator (vertical, purple)
        └── Bullet List
```
**적합 이유**: Separator로 3열 시각 구분, Label로 섹션 명칭 통일

#### Backtest Card
```
Card (full width)
├── CardHeader
│   ├── CardTitle: "백테스트 결과"
│   └── Badge (outline): "PRO" (조건부)
├── CardContent
│   └── 4-column metric grid
│       ├── Win Rate
│       ├── Profit Factor
│       ├── Sharpe Ratio
│       └── Max Drawdown
└── CardFooter (조건부: pro-locked)
    └── Button (glow): "프리미엄 업그레이드"
```
**적합 이유**: CardFooter에 CTA 버튼 배치, glow variant로 전환 유도

---

## 3. 상태별 UI 설계

### 3.1 loading 상태

| 요소 | 컴포넌트 조합 | 시각 표현 |
|------|-------------|----------|
| 카드 컨테이너 | Card (opacity-50) | 반투명 배경 |
| 제목 영역 | CardHeader + skeleton div | 회색 펄스 애니메이션 |
| 콘텐츠 영역 | CardContent + skeleton bars | 3줄 회색 바 |
| 상태 표시 | Badge (secondary) | "분석 중..." 텍스트 |

**설계 의도**:
- Card의 opacity 조절로 "미완료" 상태 표현
- Badge secondary variant로 중립적 진행 상태 표시
- skeleton 요소는 실제 콘텐츠 위치 예고

### 3.2 insufficient 상태

| 요소 | 컴포넌트 조합 | 시각 표현 |
|------|-------------|----------|
| 메인 카드 | Card + CardHeader | 전체 너비, 단일 카드 |
| 상태 Badge | Badge (destructive) | "데이터 부족" 빨간색 |
| 사유 목록 | CardContent + bullet list | 주황색 아이콘 + 사유 텍스트 |
| 보조 액션 | CardFooter + Button (outline) | "다른 타임프레임 선택" |

**설계 의도**:
- Badge destructive로 "문제 상황" 즉각 인지
- CardContent에 구체적 사유 나열로 투명성 확보
- Button outline으로 대안 행동 유도 (glow 아님 = 비유료)

### 3.3 pro-locked 상태

| 요소 | 컴포넌트 조합 | 시각 표현 |
|------|-------------|----------|
| 컨테이너 | Card + relative position | 기본 카드 구조 유지 |
| 블러 레이어 | CardContent (blur-sm) | 콘텐츠 가림 |
| 오버레이 | absolute div | 반투명 검정 배경 (bg-black/50) |
| 잠금 표시 | Badge (outline) | 자물쇠 아이콘 + "PRO" |
| CTA 버튼 | Button (glow variant) | "프리미엄으로 전체 보기" |
| 설명 텍스트 | Label (muted) | "이 기능은 프리미엄 전용입니다" |

**설계 의도**:
- 콘텐츠 일부를 흐리게 보여줘 "존재는 하지만 잠김" 표현
- Button glow로 유료 전환 CTA 최대 강조
- Badge outline으로 잠금 상태 명시

### 3.4 ok 상태 (정상)

| 요소 | 컴포넌트 조합 | 시각 표현 |
|------|-------------|----------|
| Probability Card | Card + Badge (확률별 색상) | ≥60% green, ≤40% red, else gray |
| Confidence Card | Card + Badge (등급별 색상) | A=green, B=blue, C=yellow, D/F=red |
| Explanation Card | Card + 3-col grid + Separator | blue/orange/purple 구분선 |
| Backtest Card | Card + 4-col metrics | 숫자 강조 (CardTitle), 레이블 muted (CardDescription) |

**설계 의도**:
- 모든 컴포넌트가 완전 가시화
- Badge 색상으로 값의 의미를 직관적 전달
- Separator 색상으로 정보 영역 구분

---

## 4. 시각적 일관성 유지 원칙

### 4.1 색상 체계

| 용도 | 색상 규칙 |
|------|----------|
| **Primary 액센트** | monet Badge default variant의 primary 색상 |
| **상태: 위험/실패** | Badge destructive (빨간색 계열) |
| **상태: 중립/로딩** | Badge secondary (회색 계열) |
| **상태: 강조/잠금** | Badge outline (테두리만) |
| **Evidence 영역** | blue 계열 (#3B82F6) |
| **Risk 영역** | orange 계열 (#F97316) |
| **Watch 영역** | purple 계열 (#8B5CF6) |

### 4.2 간격 체계

| 요소 | 간격 값 | 적용 위치 |
|------|---------|----------|
| 카드 간 간격 | gap-4 (16px) | 그리드 컨테이너 |
| 카드 내부 패딩 | p-6 (24px) | CardContent 기본값 유지 |
| 섹션 구분 | my-4 (16px) | Separator 상하 마진 |
| 헤더-콘텐츠 간격 | space-y-1.5 | CardHeader 기본값 유지 |

### 4.3 타이포그래피 체계

| 정보 위계 | 스타일 | 적용 컴포넌트 |
|----------|--------|--------------|
| **Primary 수치** | text-2xl font-semibold | CardTitle |
| **Secondary 레이블** | text-sm text-muted-foreground | CardDescription |
| **Badge 텍스트** | text-xs | Badge 기본 |
| **Section 레이블** | font-medium | Label |

---

## 5. 향후 구현 시 절대 깨지면 안 되는 UI 규칙

### 5.1 컴포넌트 출처 규칙
- monet-registry-main에 존재하는 컴포넌트**만** 사용
- 신규 컴포넌트 생성 금지
- 외부 UI 라이브러리 추가 도입 금지

### 5.2 Card 구조 규칙
- 반드시 **CardHeader → CardContent → CardFooter** 순서
- CardHeader 없이 CardContent 단독 사용 가능
- CardFooter는 액션 버튼이 있을 때만 사용

### 5.3 Badge variant 의미 규칙
| Variant | 의미 | 절대 다른 용도 금지 |
|---------|------|-------------------|
| destructive | 위험/실패/경고 | 성공 상태에 사용 금지 |
| secondary | 중립/로딩/비활성 | 강조에 사용 금지 |
| outline | 강조/잠금/선택됨 | 위험 표시에 사용 금지 |
| default | 긍정/완료/활성 | 경고에 사용 금지 |

### 5.4 정보 위계 위치 규칙
- **Primary 정보**: 페이지 상단 (Header 직후)
- **Secondary 정보**: 페이지 중단
- **Meta 정보**: 페이지 하단
- 위계 역전 금지 (Meta가 Primary보다 위에 오면 안 됨)

### 5.5 상태 UI 분기 규칙
- uiState 값에 따라 **4가지 분기 명확히 구분**
- 상태 혼합 표시 금지 (loading + ok 동시 표시 금지)
- 각 상태별 전용 UI 구조 유지

### 5.6 Separator 방향 규칙
- 수평 구분 (행 사이): `orientation="horizontal"`
- 세로 열 구분 (열 사이): `orientation="vertical"`
- 방향과 용도 일치 필수

### 5.7 Button variant 용도 규칙
| Variant | 용도 | 예시 |
|---------|------|------|
| glow | CTA (유료 전환) | "프리미엄 업그레이드" |
| outline | 보조 액션 | "다른 타임프레임 선택" |
| ghost | 취소/닫기 | "닫기", "취소" |
| default | 주요 액션 (무료) | "분석 시작" |

---

## 부록: monet-registry 사용 컴포넌트 목록

| Category | Components | 파일 경로 |
|----------|------------|----------|
| Layout | Section | `src/components/ui/section.tsx` |
| Card | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter | `src/components/ui/card.tsx` |
| Status | Badge (4 variants) | `src/components/ui/badge.tsx` |
| Divider | Separator | `src/components/ui/separator.tsx` |
| Typography | Label | `src/components/ui/label.tsx` |
| Action | Button (7 variants) | `src/components/ui/button.tsx` |

---

**문서 생성일**: 2025-12-28
**작업 담당**: Claude Code (claude-opus-4-5-20251101)
**작업 유형**: UI Design Blueprint (Phase 4)
