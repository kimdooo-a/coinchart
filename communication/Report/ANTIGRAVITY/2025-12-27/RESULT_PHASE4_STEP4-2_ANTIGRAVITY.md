# RESULT_PHASE4_STEP4-2_ANTIGRAVITY

## 1. 개요
본 문서는 Phase 4-2에서 **반드시 준수하고 변경을 "Lock" 하는** 규칙을 정의한다.
Antigravity와 Cursor 등 모든 개발 주체는 이 규칙을 위반하는 코드 수정을 할 수 없다.

---

## 2. Backtest 이상치 봉인 (Infinite Value Rules)
Backtest 지표 계산 시 발생하는 무한대(Infinity)나 비정상적인 값(`NaN`)에 대한 처리 규칙이다.
현재 `lib/backtest/metrics.ts`는 이를 `999` 매직 넘버로 반환하고 있다.

### 2.1 매직 넘버 규칙 (Magic Number Rules)
| 지표 (Metric) | 조건 (Condition) | 매직 넘버 (Value) | UI 표시 (Display) | 사유 문구 (Reasoning) |
|---|---|---|---|---|
| **Profit Factor** | Gross Loss = 0 | `999` | `∞` or `N/A` | "손실 거래 없음 (Loss: 0)" |
| **Sortino Ratio** | Downside Dev = 0 | `999` | `Best` | "하락 변동성 없음" |
| **Ris/Reward** | Avg Loss = 0 | `999` | `Inf` | "평균 손실 0" |
| **Calmar/Recovery** | Max Drawdown = 0 | `999` | `Perfect` | "최대 낙폭 0" |

### 2.2 UI 표시 강제 규칙
1. `999` 값이 프론트엔드에 전달될 경우, **절대로 숫자 `999`를 그대로 노출하지 않는다.**
2. `result.backtest.profitFactor >= 999` 체크를 통해 위 표의 "UI 표시" 문자열로 변환해야 한다.
3. Free/Pro Lock 블러 처리 시에도, 이면의 값은 위 규칙에 따라 `999`로 유지되거나 안전하게 처리되어야 한다.

---

## 3. 금지 표현 리스트 (Prohibited Phrases & Grep Lock)
UI 및 생성 텍스트에서 사용을 금지하는 표현이다. Validator가 이를 감지하고 치환하지만, **UI 하드코딩**에서도 절대 사용 금지다.

| 금지 키워드 (Prohibited) | 대체 권장 (Recommended) | 위반 예시 |
|---|---|---|
| **AI 예측**, **인공지능 예상** | **통계적 분석**, **알고리즘 분석** | "AI가 상승을 예측했습니다" (X) |
| **확실한**, **보장**, **무조건** | **가능성 높음**, **기대**, **긍정적** | "확실한 수익을 보장합니다" (X) |
| **손실 없는**, **무패** | **리스크 관리된**, **높은 승률** | "손실 없는 매매 기법" (X) |
| **점지**, **픽**, **추천주** | **분석 종목**, **관심 종목** | "오늘의 추천 픽" (X) |
| **안정적 수익** | **장기적 성과 기대** | "매월 안정적 수익 발생" (X) |

### 3.1 Grep 검사 키워드 (CI/CD Check)
다음 정규식 패턴이 코드에 포함되면 배포/커밋을 중단해야 한다. (Validator 예외 제외)
- `/AI\s*예측/`
- `/수익\s*보장/`
- `/확실한/`
- `/무조건/`

---

## 4. uiState UI 규격 (Minimum UI Specifications)
`performAnalysis`가 반환하는 `uiState`에 따라 UI는 다음 **최소 요건**을 충족해야 한다.

### 4.1 Loading (`isLoading`)
- **필수 요소**: 데이터 로딩 중임을 알리는 애니메이션 (Skeleton or Spinner).
- **금지**: 빈 화면, 깨진 레이아웃.
- **크기**: 로딩 완료 후의 컨텐츠 높이와 유사하게 유지 (Layout Shift 방지).

### 4.2 Insufficient Data (`insufficient`)
- **트리거**: 캔들 데이터 개수 < 50 (Backtest 최소 요건 미달).
- **필수 텍스트**: "데이터 부족" (Insufficent Data), "최소 50개 캔들 필요".
- **동작**: 분석 실행 차단, 빈 결과 카드 대신 안내 메시지 박스 표시.

### 4.3 Pro-Locked (`pro-locked`)
- **트리거**: Free 유저가 Pro 전용 기능을 요청하거나 접근했을 때.
- **필수 UI**:
    1. **Blur** 처리된 데이터 (수치 식별 불가).
    2. **Lock Icon** (자물쇠).
    3. **Upgrade Call-to-Action** (업그레이드 유도 문구/버튼).
- **노출 허용**: Pro 기능을 제외한 기본 데이터(예: 단순 승률)는 Blur 없이 노출 가능(Hooking 용도).

### 4.4 OK (`ok`)
- **필수 구성**:
    1. **Probability**: 상승/하락 확률, 신뢰도 등급(Grade).
    2. **Explanation**: 3단 구조 (Evidence, Risk, Watch).
    3. **Backtest**: 주요 지표 4개 이상 (Win Rate, Return, MDD, Profit Factor).
    4. **Recommendation**: 매수/매도/관망에 대한 명확한 시각적 지표 (컬러/텍스트).

---

## 5. 결론 및 종료
본 문서는 Phase 4-2의 **불변의 기준점**이다.
이후 UI 작업 및 로직 수정 시 이 규칙을 참조해야 하며, 위반 시 "Reguardrails" 위반으로 간주한다.
