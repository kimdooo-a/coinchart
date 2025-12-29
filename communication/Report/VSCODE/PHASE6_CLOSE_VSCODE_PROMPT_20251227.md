# PHASE6_CLOSE_VSCODE_PROMPT_20251227

**작성일**: 2025-12-27  
**프로젝트**: 코인/주식 차트분석 (Next.js + Supabase)  
**Phase**: Phase 6 CLOSE - Product Gate Implementation Verification  
**요청자**: VSCODE Agent  
**실행 순서**: 1/4 (SEQUENTIAL)  

---

## 📋 작업 배경

### Phase 6 설계 단계 완료
Phase 6에서 다음 설계를 완료했습니다:
- ✅ uiState 상태 머신 (5가지: loading, insufficient, error, ok, pro-locked)
- ✅ 4-State Pattern 표준화
- ✅ Pro-locked 카드 blur + CTA 설계
- ✅ Free 사용자 데이터 정화 전략

### 현재 상태
- Phase 6 설계 문서: `PHASE6_PRODUCT_GATE_VSCODE_RESULT_20251227.md` (작성됨)
- 실제 코드: AnalysisPanel.tsx, StockPanel.tsx, 분석 함수들 (구현 상태 불명확)

### 목표
**설계된 Product Gate (UI 상태 머신)이 실제 코드에 100% 반영되었는지 검증**

---

## 🎯 검증 범위

### 검증 항목 5가지

#### 1. uiState 정의 실제 코드 반영 여부
**설계**:
```
uiState: 'loading' | 'insufficient' | 'ok' | 'pro-locked' | 'error'
```

**검증 항목**:
- [ ] CryptoAnalysisResult 인터페이스에 정의되어 있나?
- [ ] StockAnalysisResult 인터페이스에 정의되어 있나?
- [ ] orchestrator.ts에서 정의되어 있나?
- [ ] 5가지 상태 모두 present인가? 아니면 부분인가?

#### 2. Free / Pro / Locked 상태별 렌더링 분기
**설계**:
- Loading: Skeleton UI
- Insufficient: 경고 메시지
- Error: 오류 메시지
- OK: 전체 데이터 표시
- Pro-locked: 일부 blur + CTA

**검증 항목** (AnalysisPanel.tsx):
- [ ] if (isLoading) → Skeleton UI 구현되어 있나?
- [ ] if (result?.uiState === 'insufficient') → 경고 메시지 구현되어 있나?
- [ ] if (result?.uiState === 'error') → 오류 메시지 구현되어 있나?
- [ ] 나머지 경우: 전체 데이터 표시 구현되어 있나?

**검증 항목** (StockPanel.tsx):
- [ ] 동일 5가지 상태 모두 처리되어 있나?
- [ ] Crypto와 동일 패턴인가?

#### 3. Pro-locked 상태에서 blur + CTA 실제 동작
**설계**:
```tsx
- Max Drawdown: blur (Free), 표시 (Pro)
- Profit Factor: blur (Free), 표시 (Pro)
- 🔒 PRO 오버레이: Free 사용자에게만 표시
- 클릭 시: PremiumLock 모달 열림
```

**검증 항목** (AnalysisPanel.tsx Backtest Section):
- [ ] Max Drawdown blur: `blur-sm` 클래스 있나?
- [ ] Profit Factor blur: `blur-sm` 클래스 있나?
- [ ] 🔒 PRO 오버레이: absolute overlay 있나?
- [ ] PremiumLock 모달: 클릭 핸들러 있나?

**검증 항목** (StockPanel.tsx):
- [ ] Pro-locked 상태 렌더링 있나?
- [ ] Crypto와 동일 수준인가?

#### 4. Free 사용자에게 오해 소지 있는 수치 노출 여부
**설계**:
```
❌ "N/A" 표시 제거
❌ 999 값 제거 → "Inf"로 변환
✅ uiState 기반 조건부 렌더링
```

**검증 항목** (AnalysisPanel.tsx):
- [ ] "N/A" 문자열이 result 값 표시에 사용되나? (아니면 uiState로만)
- [ ] Profit Factor: `profitFactor >= 999 ? 'Inf' : ...` 구현되어 있나?
- [ ] Win Rate/Total Return: `result.backtest.status === 'insufficient'`로 조건부인가?
  
**검증 항목** (StockPanel.tsx):
- [ ] 동일 규칙 적용되어 있나?

#### 5. Empty / 999 / N/A 상태 발생 불가 구조
**설계**:
```
모든 경로에서 uiState 명시:
- if (isLoading) ✅
- if (result?.uiState === 'error') ✅
- if (result?.uiState === 'insufficient') ✅
- if (result?.uiState === 'ok') ✅
- if (result?.uiState === 'pro-locked') ✅
→ 빈 UI, N/A, 999 노출 불가능한 구조
```

**검증 항목** (AnalysisPanel.tsx):
- [ ] 모든 조건문이 명확한 uiState 체크하나?
- [ ] else 또는 fallback이 있나? (없어야 함)
- [ ] null/undefined 체크는 uiState 처리로 충분한가?

**검증 항목** (StockPanel.tsx):
- [ ] 동일 구조인가?

---

## 🔍 검증 방법

### 코드 레벨 검증
1. AnalysisPanel.tsx 전체 읽음
2. StockPanel.tsx 전체 읽음
3. lib/analysis/crypto.ts, stock.ts, orchestrator.ts 확인
4. 각 검증 항목마다 코드 라인 참조 기록

### 결과 판정 기준

#### PASS ✅ (100% 완료)
- 5가지 검증 항목 모두 설계와 100% 일치
- 빈 UI, N/A, 999 노출 가능성 0
- Pro-locked 상태에서 blur + CTA 동작

#### PARTIAL ⚠️ (부분 완료)
- 3-4개 항목만 완료
- 일부 상태 처리 미흡
- "N/A" 문자열이 남아있음

#### FAIL ❌ (미완료)
- 1-2개 항목만 완료
- uiState 정의 자체가 부분적
- Pro-locked 처리 없음

---

## 📂 산출물

### 최종 산출물 2건

1. **PHASE6_CLOSE_VSCODE_PROMPT_20251227.md** (본 문서)
   - 검증 배경, 범위, 방법, 판정 기준

2. **PHASE6_CLOSE_VSCODE_RESULT_20251227.md**
   - 5가지 항목별 상세 검증 결과
   - 코드 라인 참조
   - PASS / PARTIAL / FAIL 판정
   - 미흡 부분 개선안 (필요 시)

---

## ⚠️ 제약사항 (MANDATORY)

- 🚫 신규 기능 추가 금지 (검증만 수행)
- 🚫 분석/계산 로직 수정 금지 (UI/노출만 검토)
- 📝 설계 문서가 아닌 실제 코드 기준으로만 판단

---

## 📞 참고

**검증 대상 파일**:
- `components/Analysis/AnalysisPanel.tsx`
- `components/Analysis/StockPanel.tsx`
- `lib/analysis/crypto.ts`
- `lib/analysis/stock.ts`
- `lib/analysis/orchestrator.ts`
- `types/probability.ts` (uiState 정의 확인)

**설계 기준 문서**:
- `PHASE6_PRODUCT_GATE_VSCODE_RESULT_20251227.md` (설계 가이드)

**기타 참고**:
- Phase 6 설계: 5가지 uiState + 4-State Pattern + Pro-locked blur/CTA
- SSOT: 분석 엔진 결과는 티어와 무관, UI만 마스킹

---

**작업 실행 순서**: 1/4 (SEQUENTIAL)  
**다음 작업**: Phase 6.1 - Pro-locked CTA Implementation (ORDER: 2)  
