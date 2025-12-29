# PHASE7_1_ENTRYPOINT_VSCODE_PROMPT_20251227

**작성일**: 2025-12-27  
**제목**: Phase 7.1 - Batch Entry Point Unification  
**목표**: 배치 실행 엔트리포인트를 orchestrator로 단일화  
**실행 순서**: 1 / 4

---

## 🎯 Phase 7.1 목표

### 핵심 문제
```
현재 상태:
├─ daily_cron.ts: 배치 로직 포함 (분석, 리포트, 알림)
├─ batch_orchestrator.ts: 배치 로직 포함 (분석, 리포트, 알림)
└─ GitHub Actions: daily_cron.ts 호출

문제점:
❌ 배치 로직이 2개 파일에 분산됨
❌ 수정할 때 2곳을 모두 수정해야 함
❌ orchestrator가 있는데 daily_cron을 여전히 사용
❌ 운영 혼선 및 중복 실행 위험
```

### 해결책 (SSOT 원칙)
```
목표 상태:
├─ daily_cron.ts: thin wrapper 역할
│  ├─ 환경 변수 로드
│  ├─ orchestrator 호출
│  └─ 예외 처리만
└─ batch_orchestrator.ts: 모든 배치 로직 통합
   ├─ 분석 (crypto/stock)
   ├─ 리포트 생성
   ├─ 알림 발송
   ├─ 배치 기록 저장
   └─ 로깅

이점:
✅ SSOT: orchestrator 하나만 수정
✅ 중복 제거: 로직이 한곳만
✅ 단순화: daily_cron 매우 간단
✅ 단위 테스트: orchestrator만 테스트
```

---

## 📋 구현 범위

### 1단계: daily_cron.ts 수정

#### 현재 코드 구조 (242 lines)
```
daily_cron.ts (현재)
├─ Supabase 클라이언트 초기화
├─ COIN/STOCK 심볼 정의
├─ syncStocks() - TwelveData API 호출 ← 분석 로직
├─ syncCoins() - Binance API 호출 ← 분석 로직
├─ syncNews() - Google News 파싱 ← 분석 로직
├─ cleanup() - 오래된 데이터 정리 ← 배치 로직
└─ run() - 모든 것을 조율
```

#### 목표 코드 구조
```
daily_cron.ts (수정 후, ~30 lines)
├─ 환경 변수 로드
├─ Logger 초기화
├─ orchestrator 호출: await runDailyBatchWorkflow()
├─ 예외 처리
└─ 프로세스 exit
```

#### 제거할 함수
- ❌ syncStocks()
- ❌ syncCoins()
- ❌ syncNews()
- ❌ cleanup()
- ❌ 심볼 정의 (SUPPORTED_COINS, TOP_US_STOCKS, POPULAR_SYMBOLS)

#### 유지할 항목
- ✅ 환경 변수 로드
- ✅ 기본 예외 처리
- ✅ 로깅
- ✅ Exit 처리

### 2단계: batch_orchestrator.ts 확인

#### 현재 기능
```typescript
export async function runDailyBatchWorkflow(force?: boolean) {
    // 1. runDailyBatch() ← 배치 분석 엔진
    // 2. generateBatchReport() ← 리포트 생성
    // 3. processAlertsForBatch() ← 알림 발송
    // 4. recordBatchComplete() ← 배치 기록 저장
}
```

#### 확인 항목
- ✅ 모든 분석 로직이 orchestrator에 있는가?
- ✅ 배치 기록이 저장되는가?
- ✅ 에러 처리가 완벽한가?

### 3단계: weekly_cron.ts 생성 (신규)

#### 목표
```typescript
import { runWeeklyBatchWorkflow } from '../scripts/batch_orchestrator';

async function run() {
    try {
        const result = await runWeeklyBatchWorkflow();
        console.log(`✅ Weekly batch completed: ${result.batchResult.batchId}`);
        process.exit(0);
    } catch (error) {
        console.error(`❌ Weekly batch failed:`, error);
        process.exit(1);
    }
}

run();
```

---

## 🔄 실행 경로 다이어그램

### Before (현재 상태)
```
GitHub Actions (cron schedule)
        ↓
    daily_cron.ts
        ├─ syncStocks() [분석 로직] ← 불필요
        ├─ syncCoins() [분석 로직] ← 불필요
        ├─ syncNews() [분석 로직] ← 불필요
        ├─ cleanup() [배치 로직] ← 불필요
        └─ run() [조율]
        
문제: orchestrator가 있는데 여전히 daily_cron에서 모든 것을 함

        batch_orchestrator.ts
        ├─ runDailyBatchWorkflow()
        │   ├─ runDailyBatch() [분석]
        │   ├─ generateBatchReport() [리포트]
        │   └─ processAlertsForBatch() [알림]
        └─ (호출되지 않음) ← 낭비
```

### After (목표 상태)
```
GitHub Actions (cron schedule)
        ↓
    daily_cron.ts (thin wrapper)
        ├─ 환경 변수 로드
        └─ orchestrator 호출
            ↓
    batch_orchestrator.ts (SSOT)
        ├─ runDailyBatch() [분석]
        │   ├─ analyzeCryptoSymbol()
        │   ├─ analyzeStockSymbol()
        │   └─ fetchMarketPrices()
        ├─ generateBatchReport() [리포트]
        ├─ processAlertsForBatch() [알림]
        └─ recordBatchComplete() [기록]

장점: 
- orchestrator 하나만 수정
- daily_cron 매우 간단 (예외 처리만)
- 재사용 가능 (weekly_cron도 같은 orchestrator 사용)
```

---

## 📝 수정 상세 계획

### File 1: scripts/daily_cron.ts (242 lines → ~40 lines)

#### 수정 전 (Line 1-20)
```typescript
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TWELVEDATA_API_KEY = process.env.TWELVEDATA_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase Credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});
```

#### 수정 후 (신규 코드)
```typescript
import dotenv from 'dotenv';
import path from 'path';
import { runDailyBatchWorkflow } from './batch_orchestrator';
import { createLogger } from '../lib/logger';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const logger = createLogger('daily_cron.log');

// Validate
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    logger.error('❌ Missing Supabase Credentials');
    process.exit(1);
}

async function main() {
    try {
        logger.info('[START] Daily batch via cron');
        const result = await runDailyBatchWorkflow();
        
        logger.info(`[COMPLETE] Daily batch completed`);
        logger.info(`Batch ID: ${result.batchResult.batchId}`);
        logger.info(`Status: ${result.batchResult.status}`);
        logger.info(`Symbols: ${result.batchResult.succeededCount}/${result.batchResult.symbolCount}`);
        
        process.exit(result.status === 'completed' ? 0 : 1);
    } catch (error: any) {
        logger.error(`[FAILED] Daily batch error: ${error.message}`);
        logger.error(error.stack);
        process.exit(1);
    }
}

main();
```

#### 삭제할 코드
- Lines 1-12: Supabase 직접 초기화 ← orchestrator에서 처리
- Lines 24-46: 심볼 정의 ← orchestrator에서 처리
- Lines 49-113: syncStocks() ← batch_analysis.ts에서 처리
- Lines 115-150: syncCoins() ← batch_analysis.ts에서 처리
- Lines 152-213: syncNews() ← (뉴스 동기화는 별도 처리)
- Lines 215-232: cleanup() ← (정리 로직은 별도 처리)
- Lines 234-238: run() ← 새 main()으로 대체

#### 추가할 코드
- `import { runDailyBatchWorkflow }`
- `import { createLogger }`
- `async function main()` with orchestrator call
- Error handling

**변경 내용**: 242 lines → ~40 lines (84% 감소)

### File 2: scripts/weekly_cron.ts (신규 생성)

#### 목표 코드
```typescript
import dotenv from 'dotenv';
import path from 'path';
import { runWeeklyBatchWorkflow } from './batch_orchestrator';
import { createLogger } from '../lib/logger';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const logger = createLogger('weekly_cron.log');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    logger.error('❌ Missing Supabase Credentials');
    process.exit(1);
}

async function main() {
    try {
        logger.info('[START] Weekly batch via cron');
        const result = await runWeeklyBatchWorkflow();
        
        logger.info(`[COMPLETE] Weekly batch completed`);
        logger.info(`Batch ID: ${result.batchResult.batchId}`);
        logger.info(`Status: ${result.batchResult.status}`);
        
        process.exit(result.status === 'completed' ? 0 : 1);
    } catch (error: any) {
        logger.error(`[FAILED] Weekly batch error: ${error.message}`);
        logger.error(error.stack);
        process.exit(1);
    }
}

main();
```

**라인 수**: ~35 lines

### File 3: scripts/batch_orchestrator.ts (검증만)

#### 확인 사항
- ✅ runDailyBatchWorkflow() 구현 확인
- ✅ runWeeklyBatchWorkflow() 구현 확인
- ✅ 모든 배치 로직이 여기에 있는가?
- ✅ 예외 처리 완벽한가?

**변경 사항**: 없음 (검증만)

---

## ⚠️ 주의사항

### 1. 분석 로직은 변경하지 않는다
```typescript
// ❌ 금지: daily_cron에서 분석 호출
const prices = await fetch('https://api.binance.com/...');

// ✅ 허용: batch_orchestrator 호출
await runDailyBatchWorkflow();
```

### 2. 배치 비즈니스 로직 중복 금지
```typescript
// ❌ 금지: daily_cron에 배치 로직 추가
if (batchAlreadyRun) return;

// ✅ 허용: orchestrator에서만 처리
// orchestrator.ts에서 Idempotent 체크 수행
```

### 3. DB 스키마 변경 금지
```typescript
// ❌ 금지: daily_cron에서 테이블 생성/수정
const { error } = await supabase.from('batch_runs').create(...);

// ✅ 허용: Migration 파일 (별도)
// supabase/migrations/... (Phase 8)
```

### 4. orchestrator 외 다른 엔트리포인트 금지
```typescript
// ❌ 금지: batch_analysis.ts를 직접 호출
import { runBatchAnalysis } from './batch_analysis';
runBatchAnalysis(); // ← 이렇게 하면 안 됨

// ✅ 허용: orchestrator를 거쳐서만 호출
import { runDailyBatchWorkflow } from './batch_orchestrator';
runDailyBatchWorkflow();
```

---

## 🔗 파일 의존성

```
daily_cron.ts
    ↓
batch_orchestrator.ts
    ├─ batch_analysis.ts
    │   ├─ lib/analysis/orchestrator.ts
    │   ├─ lib/supabase/crypto.ts
    │   └─ lib/supabase/stock.ts
    ├─ report_generator.ts
    ├─ alert_engine.ts
    └─ lib/logger.ts

weekly_cron.ts
    ↓
batch_orchestrator.ts
    (동일한 의존성)
```

---

## ✅ 검증 체크리스트

### Step 1: daily_cron.ts 수정
- [ ] 모든 API 호출 코드 제거
- [ ] 모든 심볼 정의 제거
- [ ] orchestrator import 추가
- [ ] logger import 추가
- [ ] main() 함수 작성
- [ ] 예외 처리 추가

### Step 2: weekly_cron.ts 생성
- [ ] daily_cron.ts 복사
- [ ] runWeeklyBatchWorkflow 호출로 변경
- [ ] 로그 메시지 'Daily' → 'Weekly' 변경

### Step 3: batch_orchestrator.ts 검증
- [ ] runDailyBatchWorkflow() 구현 확인
- [ ] runWeeklyBatchWorkflow() 구현 확인
- [ ] 에러 처리 완벽한가?
- [ ] 모든 단계가 기록되는가?

### Step 4: 로컬 테스트
- [ ] daily_cron.ts 실행 → orchestrator 1회 호출 확인
- [ ] batch_runs 테이블에 기록 생성 확인
- [ ] 로그 파일 생성 확인
- [ ] 로그 내용 검증 (start → complete)

### Step 5: GitHub Actions 준비
- [ ] daily_cron.ts 경로 업데이트 (필요하면)
- [ ] weekly_cron.ts 경로 추가
- [ ] Cron 스케줄 설정 (별도 Phase)

---

## 📊 변경 요약

| 파일 | 현재 라인 | 목표 라인 | 변경 내용 |
|------|---------|---------|----------|
| **daily_cron.ts** | 242 | 40 | 대폭 축소 (thin wrapper) |
| **weekly_cron.ts** | 0 | 35 | 신규 생성 |
| **batch_orchestrator.ts** | 140 | 140 | 변경 없음 (검증만) |
| **batch_analysis.ts** | 350 | 350 | 변경 없음 |
| **report_generator.ts** | 210 | 210 | 변경 없음 |
| **alert_engine.ts** | 380 | 380 | 변경 없음 |

**총 감소**: 242 - 40 = 202 lines  
**총 증가**: 35 lines (weekly_cron)  
**순 감소**: 167 lines (배치 로직 중복 제거)

---

## 🚀 다음 단계 (Phase 7.2)

### Phase 7.1 완료 후
```
daily_cron.ts (thin wrapper) ✅
weekly_cron.ts (thin wrapper) ✅
batch_orchestrator.ts (SSOT) ✅
    ↓
Phase 7.2: Alert Channel 구현
    ├─ Discord webhook 통합
    ├─ Email 발송 (선택)
    └─ SMS 발송 (선택)
```

---

**PROMPT 작성 완료**: 2025-12-27  
**예상 구현 시간**: 30분  
**다음 문서**: PHASE7_1_ENTRYPOINT_VSCODE_RESULT_20251227.md

