# PHASE7_AUTOMATION_VSCODE_PROMPT_20251227

**작성일**: 2025-12-27  
**제목**: Phase 7 - Batch Report & Alert Implementation  
**최종 목표**: 자동 리포트 생성 + 조건 기반 알림 시스템 구현  
**실행 순서**: 1 / 4  
**완성도 요구**: 100% (이전 Phase 완료 후 차단 해제)

---

## 🎯 Phase 7 목표

### 핵심 기능
**일/주 단위 자동 배치 분석으로 리포트 + 알림 시스템 구축**

```
Daily Cron Job
    ↓
    ├─ [1] 시장 데이터 수집 (Supabase SSOT)
    ├─ [2] 기존 분석 엔진 재실행 (변경 금지)
    ├─ [3] 결과 저장
    ├─ [4] 리포트 생성
    └─ [5] 조건 기반 알림 발송
```

### 제약조건 (MANDATORY)

| 항목 | 규칙 | 이유 |
|------|------|------|
| **데이터 입력** | Supabase SSOT만 사용 | 단일 진실 공급원 |
| **분석 엔진** | 계산식 변경 금지 | 과거 결과와 비교 가능 |
| **배치 작업** | Idempotent 해야 함 | 중복 실행 안전 |
| **실시간 분석** | 금지 | 배치만 구동 |
| **중복 알림** | 방지 | 동일 조건 한 번만 |

---

## 📋 구현 범위 (5단계)

### Step 1: 배치 분석 구조 설계

#### 1.1 배치 분석 스크립트 위치
```
scripts/
  ├─ daily_cron.ts ← 기존 (수정)
  ├─ weekly_cron.ts ← 신규
  ├─ batch_analysis.ts ← 신규 (핵심)
  ├─ report_generator.ts ← 신규
  ├─ alert_engine.ts ← 신규
  └─ logs/
      └─ batch_YYYY-MM-DD.log
```

#### 1.2 배치 실행 주기
```
Daily (매일 15:00 UTC)
├─ 최근 24시간 데이터 분석
├─ 상태 변화 감지 (up → down, grade change)
├─ 간단한 리포트 생성
├─ 알림 조건 확인
└─ 결과 저장

Weekly (매주 일요일 20:00 UTC)
├─ 최근 7일 데이터 종합 분석
├─ 주간 핵심 지표 추출
├─ 상세 리포트 생성
├─ 주간 요약 알림 발송
└─ 결과 저장
```

#### 1.3 배치 Idempotent 설계

**문제**: 동일 시간에 여러 번 실행되면?

**해결책**:
```typescript
// batch_analysis.ts
async function runBatchAnalysis(params: {
    type: 'daily' | 'weekly',
    runDate: Date,
    force?: boolean  // true: 재실행 강제, false: skip
}) {
    // 1. 이미 실행된 적 있는지 확인
    const existing = await db.batchRuns.findOne({
        type: params.type,
        date: formatDate(params.runDate),
        status: 'completed'
    });
    
    // 2. 기존 실행 있으면 skip (force 아니면)
    if (existing && !params.force) {
        console.log(`[${params.type}] Already completed on ${params.runDate}`);
        return existing;  // 기존 결과 반환
    }
    
    // 3. 신규 또는 강제 재실행
    const batchId = generateBatchId();
    await db.batchRuns.insert({ id: batchId, type: params.type, ... });
    
    // ... 분석 수행 ...
    
    // 4. 완료 마크
    await db.batchRuns.update(batchId, { status: 'completed' });
    
    return result;
}
```

---

### Step 2: 리포트 생성 로직

#### 2.1 Daily Report 구조
```
Daily Market Report - 2025-12-27

📊 시장 개요
├─ 분석된 자산: BTC, ETH, ...
├─ 수집 기간: 2025-12-26 15:00 ~ 2025-12-27 15:00
└─ 데이터 포인트: 288개 (5분봉 기준)

🎯 핵심 변화 (State Change)
├─ BTC: NEUTRAL → UPTREND (prob: 65% → 78%)
├─ ETH: DOWNTREND → NEUTRAL
└─ SOL: (변화 없음)

⚠️ 주의 신호 (Alert Triggered)
├─ BTC: 신뢰도 높음 (confidence: A → AA)
├─ ETH: 신호 감소 (signals: 5 → 2)
└─ DOGE: 신호 변화 (거래 기회)

📈 신호 요약 (현재 상태)
├─ Buy Signal: BTC(1), ETH(2), ...
├─ Sell Signal: XRP(1), ADA(1), ...
└─ Neutral: DOGE(0 signals)

⏱️ 실행 정보
├─ 시작: 2025-12-27 15:00:15
├─ 종료: 2025-12-27 15:02:34
├─ 소요시간: 2분 19초
└─ 상태: ✅ SUCCESS
```

#### 2.2 Weekly Report 구조
```
Weekly Market Summary - Week 52 (2025-12-21 ~ 2025-12-27)

📊 주간 성과
├─ 정확도: 68% (지난 주 64% ↑)
├─ 수익성: +12.3% (평가 자산 기준)
└─ 거래 빈도: 45회 (지난 주 38회)

🏆 최우수 자산
├─ 1위: BTC (+18.2%)
├─ 2위: ETH (+14.5%)
└─ 3위: SOL (+9.8%)

⚠️ 위험 자산
├─ 1위: XRP (-8.2%)
├─ 2위: ADA (-5.3%)
└─ 3위: DOGE (-3.1%)

📈 신호 분석
├─ 평균 신호: 3.2개/자산
├─ 신뢰도 추세: A → AA
└─ 거래 성공률: 68%

🔄 주간 주기성
├─ 월요일: 상승 강함 (+62% 성공률)
├─ 수요일: 중립 (48% 성공률)
└─ 금요일: 하락 경향 (-3.2%)

⏱️ 데이터 품질
├─ 수집 성공률: 99.8%
├─ 오류: 없음
└─ 누락: 2개 시점 (연결 문제)
```

#### 2.3 리포트 생성 코드 구조
```typescript
// report_generator.ts
export interface ReportOptions {
    type: 'daily' | 'weekly';
    startDate: Date;
    endDate: Date;
    symbols: string[];
    includeCharts?: boolean;
    format: 'markdown' | 'json' | 'html';
}

export async function generateReport(options: ReportOptions) {
    // 1. 기간 내 분석 결과 수집
    const analysisResults = await fetchAnalysisResults(
        options.startDate,
        options.endDate,
        options.symbols
    );
    
    // 2. 상태 변화 감지 (State Change Detection)
    const stateChanges = detectStateChanges(analysisResults);
    
    // 3. 주요 지표 추출
    const metrics = calculateMetrics(analysisResults);
    
    // 4. 포맷 선택 및 생성
    return formatReport({
        type: options.type,
        stateChanges,
        metrics,
        format: options.format
    });
}
```

---

### Step 3: 알림 조건 정의

#### 3.1 알림 우선순위

| 우선순위 | 조건 | 예시 |
|---------|------|------|
| **CRITICAL** | 신뢰도 급상승 | A → AA (증가율 > 50%) |
| **CRITICAL** | 신호 급증가 | signals: 1 → 5+ |
| **HIGH** | 상태 역전 | UPTREND → DOWNTREND |
| **HIGH** | 신뢰도 악화 | A → B (감소율 > 30%) |
| **MEDIUM** | 신호 변화 | signals 변경 (±2개 이상) |
| **MEDIUM** | 신뢰도 변화 | A → A+ (단계 변경) |
| **LOW** | 데이터 경고 | 신호 0 상태 진입 |
| **LOW** | 분석 실패 | error state 발생 |

#### 3.2 알림 조건 예시

```typescript
// alert_engine.ts
interface AlertCondition {
    id: string;
    name: string;
    symbol: string;
    type: 'state_change' | 'metric_threshold' | 'comparison';
    condition: (current: AnalysisResult, previous?: AnalysisResult) => boolean;
    message: (current: AnalysisResult, previous?: AnalysisResult) => string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

const alertConditions: AlertCondition[] = [
    {
        id: 'btc_trend_reverse',
        name: 'BTC 추세 반전',
        symbol: 'BTC',
        type: 'state_change',
        condition: (curr, prev) => {
            if (!prev) return false;
            // Probability 급변 (> 30%)
            const probChange = Math.abs(curr.probability.probability - prev.probability.probability);
            return probChange > 30;
        },
        message: (curr, prev) => 
            `BTC 확률 급변: ${prev!.probability.probability}% → ${curr.probability.probability}%`,
        priority: 'HIGH'
    },
    
    {
        id: 'signal_spike',
        name: '신호 급증',
        symbol: '*',  // 모든 자산
        type: 'metric_threshold',
        condition: (curr, prev) => {
            if (!prev) return false;
            // 신호 수 2배 이상 증가
            return curr.signals.length > prev.signals.length * 2 && curr.signals.length >= 3;
        },
        message: (curr, prev) => 
            `신호 급증: ${prev!.signals.length} → ${curr.signals.length}개`,
        priority: 'HIGH'
    },
    
    {
        id: 'confidence_upgrade',
        name: '신뢰도 상향',
        symbol: '*',
        type: 'state_change',
        condition: (curr, prev) => {
            if (!prev) return false;
            const gradeMap = { F: 0, D: 1, C: 2, B: 3, A: 4, AA: 5 };
            const prevGrade = gradeMap[prev.confidence.grade as keyof typeof gradeMap] ?? 0;
            const currGrade = gradeMap[curr.confidence.grade as keyof typeof gradeMap] ?? 0;
            return currGrade > prevGrade + 1;  // 2단계 이상 상향
        },
        message: (curr, prev) => 
            `신뢰도 상향: ${prev!.confidence.grade} → ${curr.confidence.grade}`,
        priority: 'CRITICAL'
    }
];
```

---

### Step 4: 중복 알림 방지

#### 4.1 알림 상태 저장

```sql
-- New table: alert_history
CREATE TABLE alert_history (
    id UUID PRIMARY KEY,
    batch_id UUID NOT NULL,              -- 어느 배치에서 발생했나
    symbol VARCHAR(20) NOT NULL,         -- 어느 자산에 대해
    alert_id VARCHAR(100) NOT NULL,      -- alert_conditions.id
    priority VARCHAR(20) NOT NULL,       -- CRITICAL, HIGH, MEDIUM, LOW
    triggered_at TIMESTAMP NOT NULL,     -- 언제 발생했나
    message TEXT NOT NULL,               -- 알림 메시지
    sent_at TIMESTAMP,                   -- 언제 발송했나 (null = 미발송)
    channel VARCHAR(50),                 -- email, discord, webhook
    status VARCHAR(20),                  -- pending, sent, failed, skipped
    reason VARCHAR(200),                 -- 미발송 이유
    
    UNIQUE(symbol, alert_id, triggered_at)  -- 동일 조건 동일 시간은 한 번만
);

-- Index for efficiency
CREATE INDEX idx_alert_pending ON alert_history(status, triggered_at)
WHERE status = 'pending';

CREATE INDEX idx_alert_duplicate ON alert_history(symbol, alert_id, triggered_at)
WHERE status IN ('sent', 'pending');
```

#### 4.2 중복 방지 로직

```typescript
// alert_engine.ts
async function checkAndSendAlert(
    alert: Alert,
    symbol: string,
    batchId: string
) {
    // 1. 이미 발송된 동일 알림이 있는지 확인
    const recent = await db.alertHistory.findOne({
        symbol,
        alert_id: alert.id,
        // 24시간 이내 발송된 알림
        triggered_at: {
            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        status: { $in: ['sent', 'pending'] }
    });
    
    // 2. 최근 발송 내역이 있으면 skip
    if (recent) {
        console.log(
            `[SKIP] Duplicate alert prevented: ${symbol} ${alert.id} ` +
            `(Last sent: ${recent.triggered_at})`
        );
        return {
            status: 'skipped',
            reason: `Already sent ${Math.floor((Date.now() - recent.sent_at!) / (60*1000))}min ago`
        };
    }
    
    // 3. 신규 알림 → 기록 생성
    const record = await db.alertHistory.insert({
        id: generateId(),
        batch_id: batchId,
        symbol,
        alert_id: alert.id,
        priority: alert.priority,
        triggered_at: new Date(),
        message: alert.message,
        status: 'pending',
        reason: null
    });
    
    // 4. 발송 시도
    try {
        await sendAlert(alert, symbol);
        await db.alertHistory.update(record.id, {
            status: 'sent',
            sent_at: new Date()
        });
        return { status: 'sent' };
    } catch (error) {
        await db.alertHistory.update(record.id, {
            status: 'failed',
            reason: error.message
        });
        return { status: 'failed', reason: error.message };
    }
}
```

---

### Step 5: 실패 안전 & 로깅

#### 5.1 배치 작업 안전성

```typescript
// batch_analysis.ts
async function runBatchAnalysisWithSafety(options: BatchOptions) {
    const batchId = generateBatchId();
    const logger = createLogger(`batch_${batchId}.log`);
    
    try {
        logger.info(`[START] Batch ${options.type} analysis started`);
        logger.info(`Batch ID: ${batchId}`);
        logger.info(`Symbols: ${options.symbols.join(', ')}`);
        
        // 1. 시작 기록
        const batchRun = await db.batchRuns.insert({
            id: batchId,
            type: options.type,
            startedAt: new Date(),
            status: 'running',
            symbolCount: options.symbols.length
        });
        
        // 2. 각 단계별 try-catch
        let results = [];
        for (const symbol of options.symbols) {
            try {
                const result = await analyzeSymbol(symbol, options);
                results.push(result);
                logger.debug(`✓ ${symbol} analyzed successfully`);
            } catch (error) {
                logger.warn(`✗ ${symbol} analysis failed: ${error.message}`);
                results.push({
                    symbol,
                    status: 'error',
                    error: error.message,
                    timestamp: new Date()
                });
                // 다른 자산은 계속 분석 (fault isolation)
                continue;
            }
        }
        
        // 3. 리포트 생성 (분석 실패해도 진행)
        let report = null;
        try {
            report = await generateReport({
                type: options.type,
                results,
                batchId
            });
            logger.info(`Report generated successfully`);
        } catch (error) {
            logger.error(`Report generation failed: ${error.message}`);
            // 리포트 실패는 치명적이 아니므로 계속
        }
        
        // 4. 알림 발송 (리포트 실패해도 진행)
        let alertResults = { sent: 0, failed: 0, skipped: 0 };
        try {
            alertResults = await processAlerts(results, batchId);
            logger.info(
                `Alerts processed: sent=${alertResults.sent}, ` +
                `failed=${alertResults.failed}, skipped=${alertResults.skipped}`
            );
        } catch (error) {
            logger.error(`Alert processing failed: ${error.message}`);
        }
        
        // 5. 완료 마크
        await db.batchRuns.update(batchId, {
            status: 'completed',
            completedAt: new Date(),
            succeededCount: results.filter(r => r.status === 'ok').length,
            failedCount: results.filter(r => r.status === 'error').length,
            alertsSent: alertResults.sent,
            reportGenerated: report !== null
        });
        
        logger.info(`[COMPLETE] Batch analysis finished`);
        logger.info(`Summary: ${results.length} symbols, ${alertResults.sent} alerts`);
        
        return {
            batchId,
            status: 'completed',
            results,
            report,
            alerts: alertResults
        };
        
    } catch (error) {
        // 예상 외 에러 (fatal)
        logger.error(`[FATAL] Unexpected error: ${error.message}`);
        logger.error(error.stack);
        
        await db.batchRuns.update(batchId, {
            status: 'failed',
            error: error.message,
            completedAt: new Date()
        });
        
        // 알림 발송 (배치 실패)
        await notifyBatchFailure({
            batchId,
            error: error.message,
            timestamp: new Date()
        });
        
        throw error;  // 외부에서 처리하도록
    }
}
```

#### 5.2 로그 포맷

```
[2025-12-27T15:00:15.234Z] [INFO] [START] Batch daily analysis started
[2025-12-27T15:00:15.235Z] [INFO] Batch ID: batch_20251227_150015
[2025-12-27T15:00:15.236Z] [INFO] Symbols: BTC,ETH,SOL,XRP,ADA (5 total)
[2025-12-27T15:00:16.102Z] [DEBUG] ✓ BTC analyzed successfully (1.8s)
[2025-12-27T15:00:17.234Z] [DEBUG] ✓ ETH analyzed successfully (1.1s)
[2025-12-27T15:00:18.456Z] [WARN] ✗ SOL analysis failed: Insufficient data (3 candles)
[2025-12-27T15:00:19.567Z] [DEBUG] ✓ XRP analyzed successfully (1.1s)
[2025-12-27T15:00:20.789Z] [DEBUG] ✓ ADA analyzed successfully (1.2s)
[2025-12-27T15:00:20.890Z] [INFO] Report generated successfully (5 sections)
[2025-12-27T15:00:21.012Z] [INFO] Alerts processed: sent=3, failed=0, skipped=2
[2025-12-27T15:00:21.034Z] [INFO] [COMPLETE] Batch analysis finished
[2025-12-27T15:00:21.035Z] [INFO] Summary: 5 symbols, 3 alerts sent, 1 error
```

---

## 🏗️ 구현 체크리스트

### Step 1: 배치 분석 구조
- [ ] `scripts/batch_analysis.ts` 생성
  - [ ] `runBatchAnalysis()` 함수 구현
  - [ ] Idempotent 처리 (중복 실행 방지)
  - [ ] 에러 격리 (한 자산 실패 → 다른 자산 계속)
- [ ] `scripts/daily_cron.ts` 수정
  - [ ] 기존 로직 유지
  - [ ] 새 배치 엔진으로 마이그레이션
- [ ] `scripts/weekly_cron.ts` 신규 생성
  - [ ] Weekly 배치 로직

### Step 2: 리포트 생성
- [ ] `scripts/report_generator.ts` 생성
  - [ ] `generateReport()` 함수 구현
  - [ ] Daily/Weekly 포맷 구분
  - [ ] State Change 감지
  - [ ] Metrics 계산
  - [ ] Markdown/JSON/HTML 포맷 지원
- [ ] 리포트 저장소
  - [ ] DB 테이블: `batch_reports`
  - [ ] 파일 저장소: `reports/` 디렉토리

### Step 3: 알림 조건 정의
- [ ] `scripts/alert_engine.ts` 생성
  - [ ] `alertConditions[]` 정의
  - [ ] `evaluateAlerts()` 함수 구현
  - [ ] 우선순위 처리
- [ ] 알림 채널 구현
  - [ ] Email 발송 (선택)
  - [ ] Discord webhook (선택)
  - [ ] 내부 알림 (필수)

### Step 4: 중복 방지
- [ ] DB 테이블: `alert_history`
  - [ ] 구조 정의
  - [ ] 인덱스 생성
- [ ] 중복 체크 로직
  - [ ] `checkAndSendAlert()` 함수
  - [ ] 24시간 윈도우 적용

### Step 5: 안전성 & 로깅
- [ ] Logger 통합
  - [ ] `createLogger()` 함수
  - [ ] 로그 레벨 관리
  - [ ] 로그 파일 저장
- [ ] 에러 처리
  - [ ] Try-catch 모든 단계
  - [ ] Fault isolation
  - [ ] Graceful degradation
- [ ] 모니터링
  - [ ] `batchRuns` 테이블 추가
  - [ ] 배치 실행 히스토리 기록

---

## 📊 예상 결과

### 배치 실행 결과 (DB: batchRuns)
```json
{
    "id": "batch_20251227_150015",
    "type": "daily",
    "startedAt": "2025-12-27T15:00:15.234Z",
    "completedAt": "2025-12-27T15:02:45.567Z",
    "duration": 150333,  // ms
    "status": "completed",
    "symbolCount": 5,
    "succeededCount": 4,
    "failedCount": 1,
    "alertsSent": 3,
    "alertsSkipped": 2,
    "reportGenerated": true
}
```

### 리포트 저장 위치
```
reports/
├─ daily/
│   ├─ 2025-12-27_BTC_report.md
│   ├─ 2025-12-27_daily_summary.md
│   └─ ...
└─ weekly/
    ├─ 2025-W52_summary.md
    └─ ...
```

### 알림 발송 결과 (DB: alertHistory)
```json
[
    {
        "id": "alert_20251227_001",
        "symbol": "BTC",
        "alert_id": "btc_trend_reverse",
        "priority": "HIGH",
        "triggered_at": "2025-12-27T15:00:42.123Z",
        "sent_at": "2025-12-27T15:00:42.456Z",
        "status": "sent",
        "message": "BTC 확률 급변: 65% → 78%"
    },
    ...
]
```

---

## 🔗 이전 Phase와의 연계

### Phase 5: Stock SSOT
→ Phase 7에서 재사용: `fetchStockPrices()` 호출

### Phase 5.1: Data Flow Documentation
→ Phase 7 배치 흐름도 추가

### Phase 6: UI State Machine
→ Phase 7에서 analysis result는 기존대로 사용 (변경 X)

### Phase 6 Close: Verification
→ Phase 7 구현 후 배치 결과도 검증 대상

---

## 📝 다음 단계 (RESULT 문서에서)

### PHASE7_AUTOMATION_VSCODE_RESULT_20251227.md
1. 구현된 파일 목록 + 주요 코드 (batch_analysis.ts, report_generator.ts, alert_engine.ts)
2. DB 스키마 변경 (alert_history, batchRuns 테이블)
3. 배치 실행 테스트 결과
   - Daily 배치: BTC/ETH/SOL 분석 완료
   - Weekly 배치: 지난주 데이터 요약 생성
   - Alert 발송: 3건 성공, 2건 중복 방지
4. 리포트 샘플 출력
5. 로그 샘플 출력

---

**PROMPT 작성 완료**: 2025-12-27  
**구현 전략**: 5개 단계 순차 구현 + 안전성 강화  
**예상 소요시간**: 3-4시간  
**다음 문서**: PHASE7_AUTOMATION_VSCODE_RESULT_20251227.md

