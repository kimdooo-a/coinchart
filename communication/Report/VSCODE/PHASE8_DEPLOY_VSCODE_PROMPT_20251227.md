# PHASE8_DEPLOY_VSCODE_PROMPT_20251227

**작성일**: 2025-12-27  
**제목**: Phase 8 - Deployment Readiness Implementation  
**목표**: 배포 가능한 상태로 환경/게이트/롤백 구현  
**실행 순서**: 1 / 4

---

## 🎯 Phase 8 목표

### 핵심 문제
```
현재 상태:
- 코드는 완성됨 (Phase 7까지)
- 배치도 구현됨 (daily/weekly)
- 하지만 배포 준비 불충분:
  ❌ 환경변수 표준화 없음
  ❌ 런타임 킬스위치 없음
  ❌ 배포 전 체크리스트 없음
  ❌ 롤백 절차 없음
```

### 해결책 (배포 안전성)
```
구현할 것:
✅ 환경변수 표준화 (.env.example)
✅ 필수/선택 변수 문서화 (ENV_REQUIRED.md)
✅ Feature Gate (APP_MODE, DISABLE_AUTOMATION, DISABLE_PRO_GATE)
✅ 배포 전 체크 (preflight.ts)
✅ 배포 후 헬스체크 (healthcheck.ts)
✅ 운영 절차 문서화 (DEPLOYMENT_RUNBOOK.md)
```

---

## 📋 구현 범위 (5단계)

### Step 1: 환경변수 표준화

#### 1.1 .env.example 생성

**목적**: 개발자가 어떤 환경변수가 필요한지 알 수 있도록

**파일 위치**: `.env.example` (repo root)

**구조**:
```
# ============================================
# SUPABASE Configuration
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyXXXXXXXX
SUPABASE_SERVICE_ROLE_KEY=eyXXXXXXXX
SUPABASE_URL=https://xxxx.supabase.co

# ============================================
# External APIs (Optional)
# ============================================
TWELVEDATA_API_KEY=demo
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback

# ============================================
# Feature Flags & Deployment
# ============================================
NEXT_PUBLIC_APP_MODE=dev
NEXT_PUBLIC_DISABLE_AUTOMATION=false
NEXT_PUBLIC_DISABLE_PRO_GATE=false

# ============================================
# Analytics & Monitoring (Optional)
# ============================================
NEXT_PUBLIC_ANALYTICS_ID=
NEXT_PUBLIC_ERROR_TRACKING_DSN=
```

**특징**:
- ✅ 모든 값은 placeholder (real key 없음)
- ✅ 섹션별로 구분
- ✅ NEXT_PUBLIC 접두사로 구별
- ✅ 필수 vs 선택 구분 (선택사항은 Optional 주석)

#### 1.2 ENV_REQUIRED.md 생성

**목적**: 각 환경변수의 용도, 필수 여부, 어디에 설정하는지 명시

**구조**:
```markdown
# Environment Variables Guide

## 필수 변수 (MUST HAVE)

### Supabase
| Variable | 용도 | 설정 위치 | 예시 |
|----------|------|---------|-----|
| NEXT_PUBLIC_SUPABASE_URL | Supabase 프로젝트 URL | .env.local, Vercel | https://xxxx.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | 공개 인증 키 | .env.local, Vercel | eyJhbGc... |
| SUPABASE_SERVICE_ROLE_KEY | 관리자 키 (backend) | .env.local, Vercel Secrets | eyJhbGc... |

## 선택 변수 (OPTIONAL)

### Google OAuth
| Variable | 용도 | 설정 위치 |
|----------|------|---------|
| NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID | Google 로그인 | .env.local, Vercel |
| GOOGLE_OAUTH_CLIENT_SECRET | Google Secret | .env.local, Vercel Secrets |

## Feature Flags

| Variable | 기본값 | 설명 |
|----------|--------|------|
| NEXT_PUBLIC_APP_MODE | dev | 모드: dev/staging/prod |
| NEXT_PUBLIC_DISABLE_AUTOMATION | false | 자동화 비활성화 (배포 시 안전장치) |
| NEXT_PUBLIC_DISABLE_PRO_GATE | false | Pro 게이트 비활성화 (운영 대응) |
```

---

### Step 2: 런타임 게이트 구현

#### 2.1 Feature Gate 라이브러리

**파일**: `lib/config/gates.ts`

**내용**:
```typescript
// Feature Gate 타입
export type AppMode = 'dev' | 'staging' | 'prod';

export interface FeatureGates {
    appMode: AppMode;
    isDisabledAutomation: boolean;
    isDisabledProGate: boolean;
    isDevelopment: boolean;
    isProduction: boolean;
}

// 런타임에서 읽기
export function getFeatureGates(): FeatureGates {
    return {
        appMode: (process.env.NEXT_PUBLIC_APP_MODE || 'dev') as AppMode,
        isDisabledAutomation: process.env.NEXT_PUBLIC_DISABLE_AUTOMATION === 'true',
        isDisabledProGate: process.env.NEXT_PUBLIC_DISABLE_PRO_GATE === 'true',
        isDevelopment: process.env.NEXT_PUBLIC_APP_MODE === 'dev',
        isProduction: process.env.NEXT_PUBLIC_APP_MODE === 'prod',
    };
}

// 사용 예
// const gates = getFeatureGates();
// if (gates.isDisabledAutomation) {
//     // 배치 비활성화
// }
```

#### 2.2 Automation 비활성화 (선택사항)

**코드 위치**: `scripts/batch_orchestrator.ts`

```typescript
import { getFeatureGates } from '../lib/config/gates';

export async function runDailyBatchWorkflow(force?: boolean) {
    const gates = getFeatureGates();
    
    if (gates.isDisabledAutomation && !force) {
        logger.warn('[SKIP] Automation is disabled (NEXT_PUBLIC_DISABLE_AUTOMATION=true)');
        return {
            batchResult: { status: 'skipped', ... },
            status: 'completed'
        };
    }
    
    // ... 실행
}
```

#### 2.3 Pro Gate 비활성화 (선택사항)

**코드 위치**: `components/Analysis/AnalysisPanel.tsx`

```typescript
const gates = getFeatureGates();
const isPro = userTier === 'pro' || gates.isDisabledProGate;  // ← Pro Gate 무시

return (
    <div>
        {isPro ? (
            <div>{result.backtest.maxDrawdownPercent.toFixed(1)}%</div>
        ) : (
            <div className="blur-sm">??.?%</div>
        )}
    </div>
);
```

---

### Step 3: 릴리즈 게이트 체크

#### 3.1 preflight.ts 구현

**파일**: `scripts/preflight.ts`

**목적**: 배포 전 필수 조건 확인

**체크 항목**:
1. 필수 환경변수 존재 여부
2. DB 연결 확인 (읽기)
3. Lint 통과 여부
4. Build 성공 여부

**코드 스켈레톤**:
```typescript
import dotenv from 'dotenv';
import path from 'path';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { createLogger } from '../lib/logger';

const logger = createLogger('preflight.log');

// 필수 환경변수 목록
const REQUIRED_VARS = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
];

async function checkEnvironment(): Promise<boolean> {
    logger.info('[CHECK] Environment Variables');
    
    const missing = REQUIRED_VARS.filter(v => !process.env[v]);
    
    if (missing.length > 0) {
        logger.error(`Missing: ${missing.join(', ')}`);
        return false;
    }
    
    logger.info(`✅ All required variables present`);
    return true;
}

async function checkDatabaseConnection(): Promise<boolean> {
    logger.info('[CHECK] Database Connection');
    
    try {
        const { data, error } = await supabaseAdmin
            .from('batch_runs')
            .select('id')
            .limit(1);
        
        if (error) throw error;
        
        logger.info(`✅ Database connection OK`);
        return true;
    } catch (error: any) {
        logger.error(`Database error: ${error.message}`);
        return false;
    }
}

async function runPreflightChecks(): Promise<boolean> {
    try {
        logger.info('[START] Preflight Checks');
        
        const envOk = await checkEnvironment();
        const dbOk = await checkDatabaseConnection();
        
        if (!envOk || !dbOk) {
            logger.error('[FAILED] Preflight checks failed');
            process.exit(1);
        }
        
        logger.info('[PASSED] All preflight checks passed');
        process.exit(0);
    } catch (error: any) {
        logger.error(`[FATAL] ${error.message}`);
        process.exit(1);
    }
}

runPreflightChecks();
```

#### 3.2 package.json 스크립트 추가

```json
{
    "scripts": {
        "build": "next build",
        "preflight": "ts-node scripts/preflight.ts",
        "deploy:check": "npm run preflight && npm run build"
    }
}
```

---

### Step 4: 롤백 훅 구현

#### 4.1 healthcheck.ts 구현

**파일**: `scripts/healthcheck.ts`

**목적**: 배포 후 핵심 경로 응답 확인

**체크 항목**:
- GET / (홈)
- GET /api/analysis/crypto/BTC (분석 API)
- GET /api/analysis/stock/AAPL (주식 분석 API)

**코드 스켈레톤**:
```typescript
import dotenv from 'dotenv';
import path from 'path';
import { createLogger } from '../lib/logger';

const logger = createLogger('healthcheck.log');

const BASE_URL = process.env.HEALTH_CHECK_URL || 'http://localhost:3000';

interface HealthCheckResult {
    path: string;
    status: number;
    ok: boolean;
    duration: number;
}

async function checkEndpoint(path: string): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
        const response = await fetch(`${BASE_URL}${path}`, { timeout: 5000 });
        const duration = Date.now() - startTime;
        
        return {
            path,
            status: response.status,
            ok: response.status === 200,
            duration
        };
    } catch (error: any) {
        return {
            path,
            status: 0,
            ok: false,
            duration: Date.now() - startTime
        };
    }
}

async function runHealthChecks(): Promise<void> {
    try {
        logger.info(`[START] Health Check (${BASE_URL})`);
        
        const endpoints = [
            '/',
            '/api/analysis/crypto/BTC',
            '/api/analysis/stock/AAPL'
        ];
        
        const results: HealthCheckResult[] = [];
        
        for (const endpoint of endpoints) {
            const result = await checkEndpoint(endpoint);
            results.push(result);
            
            logger.info(
                `${result.ok ? '✅' : '❌'} ${result.path} ` +
                `(${result.status}, ${result.duration}ms)`
            );
        }
        
        const allOk = results.every(r => r.ok);
        
        if (!allOk) {
            logger.error('[FAILED] Some endpoints are down');
            process.exit(1);
        }
        
        logger.info('[PASSED] All health checks passed');
        process.exit(0);
    } catch (error: any) {
        logger.error(`[FATAL] ${error.message}`);
        process.exit(1);
    }
}

runHealthChecks();
```

#### 4.2 package.json 스크립트 추가

```json
{
    "scripts": {
        "healthcheck": "ts-node scripts/healthcheck.ts",
        "deploy:verify": "HEALTH_CHECK_URL=http://localhost:3000 npm run healthcheck"
    }
}
```

---

### Step 5: 문서 생성

#### 5.1 DEPLOYMENT_RUNBOOK.md

**파일**: `docs/DEPLOYMENT_RUNBOOK.md`

**내용 구조**:

1. **배포 전 체크리스트**
   ```
   [ ] 모든 PR이 merge되었는가?
   [ ] 테스트 통과했는가?
   [ ] CHANGELOG 업데이트했는가?
   [ ] ENV 변수 설정했는가?
   [ ] preflight 통과했는가?
   ```

2. **배포 절차**
   ```
   Step 1: npm run deploy:check
   Step 2: npm run build
   Step 3: Deploy to Vercel
   Step 4: npm run deploy:verify (Vercel에서 HEALTH_CHECK_URL 설정 후)
   ```

3. **장애 대응 (Kill Switch)**
   ```
   만약 배포 후 문제 발생:
   
   Option A: NEXT_PUBLIC_DISABLE_AUTOMATION=true
   - 배치 비활성화 (자동화 멈춤)
   
   Option B: NEXT_PUBLIC_DISABLE_PRO_GATE=true
   - Pro 게이트 해제 (모든 기능 오픈)
   
   Option C: 즉시 이전 버전으로 롤백
   ```

4. **모니터링 포인트**
   ```
   - DB 연결 상태
   - 배치 실행 로그
   - 에러 로그
   - 응답 시간
   ```

---

## ⚠️ 주의사항

### 1. 시크릿 관리
```typescript
// ❌ 금지
export const SUPABASE_KEY = 'eyXXXXX...';

// ✅ 허용
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
}
```

### 2. 분석 로직은 변경하지 않기
```typescript
// ❌ 금지: 게이트가 분석 결과를 변경하면 안 됨
if (gates.isDisabledProGate) {
    result.confidence.grade = 'A';  // ← 절대 금지
}

// ✅ 허용: UI 표시 방식만 변경
const isPro = userTier === 'pro' || gates.isDisabledProGate;
if (isPro) {
    display(result.backtest.maxDrawdownPercent);
} else {
    displayBlur();
}
```

### 3. DB 스키마 변경 금지
```typescript
// ❌ 금지: 배포 시점에 스키마 변경
await supabase.from('users').create(...);

// ✅ 허용: Migration (별도 문서)
// supabase/migrations/...
```

---

## 📊 환경변수 매트릭스

| 변수 | Dev | Staging | Prod | 주석 |
|------|-----|---------|------|------|
| APP_MODE | dev | staging | prod | 자동 설정 |
| DISABLE_AUTOMATION | false | false | false | 비상 상황에만 true |
| DISABLE_PRO_GATE | true | false | false | Dev에서만 true로 설정 가능 |
| SUPABASE_URL | local | staging-proj | prod-proj | 환경별로 다름 |

---

## 🔗 파일 구조 (예상)

```
repo/
├─ .env.example ← 새로 생성
├─ docs/
│   ├─ DEPLOYMENT_RUNBOOK.md ← 새로 생성
│   └─ ENV_REQUIRED.md ← 새로 생성
├─ lib/
│   └─ config/
│       └─ gates.ts ← 새로 생성
├─ scripts/
│   ├─ preflight.ts ← 새로 생성
│   └─ healthcheck.ts ← 새로 생성
└─ package.json ← 수정 (scripts 추가)
```

---

## ✅ 검증 체크리스트

### 환경변수
- [ ] .env.example 생성
- [ ] ENV_REQUIRED.md 생성
- [ ] 필수 vs 선택 구분
- [ ] 모든 키에 placeholder 사용

### 게이트
- [ ] lib/config/gates.ts 생성
- [ ] APP_MODE, DISABLE_AUTOMATION, DISABLE_PRO_GATE 지원
- [ ] 컴포넌트에서 사용 가능

### Preflight
- [ ] scripts/preflight.ts 생성
- [ ] 환경변수 체크
- [ ] DB 연결 체크
- [ ] package.json에 명령 추가

### Healthcheck
- [ ] scripts/healthcheck.ts 생성
- [ ] 핵심 경로 체크 (/, /api/analysis/*)
- [ ] 타임아웃 처리
- [ ] package.json에 명령 추가

### 문서
- [ ] DEPLOYMENT_RUNBOOK.md 생성
- [ ] 배포 절차 기술
- [ ] 장애 대응 (Kill Switch)
- [ ] 모니터링 포인트

---

## 📝 다음 단계

### Phase 8 완료 후
```
환경변수 표준화 ✅
런타임 게이트 ✅
Preflight 체크 ✅
Healthcheck ✅
배포 문서 ✅
    ↓
Phase 8.1: GitHub Actions 통합
    ├─ 빌드 & Preflight 자동화
    ├─ Vercel 배포
    └─ Healthcheck 자동화
```

---

**PROMPT 작성 완료**: 2025-12-27  
**예상 구현 시간**: 1시간  
**다음 문서**: PHASE8_DEPLOY_VSCODE_RESULT_20251227.md

