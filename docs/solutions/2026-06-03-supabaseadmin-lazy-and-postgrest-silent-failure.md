---
title: supabaseAdmin lazy화(dotenv vs ESM import 순서) + PostgREST insert silent failure 차단
date: 2026-06-03
session: 46
tags: [supabase, postgrest, dotenv, esm, import-hoisting, silent-failure, ssot, batch]
category: bug-fix
confidence: high
---

## 문제

양평 자체호스팅 daily-cron 실행 중 발견된 3종 잠복버그 (GitHub Actions 시절 4개월간 가려져 있던 것):

1. **분석 0 candles**: daily 배치에서 ADA/AVAX/DOT가 매번 0 candles로 skip (5/8 succeeded).
2. **dotenv vs ESM import 순서**: `tsx scripts/daily_cron.ts` 직접 실행 시 exit 1. GitHub Actions는 `env:`로 진짜 `process.env`를 주입해 가려졌고, 양평 자체호스팅(래퍼 `set -a; . ./.env.local`)으로 우회 중이었음.
3. **insert silent failure**: 분석은 돌아도 결과가 DB에 저장되지 않는데 exit 0 (PGRST205, 테이블 PostgREST 스키마 부재).

## 원인

1. **SSOT 위반**: 분석목록이 `scripts/batch_analysis.ts`에 하드코딩(`BTC,ETH,SOL,XRP,ADA,AVAX,DOGE,DOT` 8종)되어, 수집목록 `lib/constants.ts#SUPPORTED_COINS`(BTC,ETH,XRP,SOL,BCH,DOGE 6종)와 어긋남. 수집 안 된 ADA/AVAX/DOT를 분석하니 0 candles, 분석 안 하는 BCH는 수집 낭비.

2. **ESM import 호이스팅 > dotenv.config()**: `daily_cron.ts`는 `import './batch_orchestrator'`(14행)가 `dotenv.config()`(19행)보다 위에 있다. ESM은 import를 호이스팅하므로 `batch_orchestrator → batch_analysis → lib/supabaseAdmin` 체인이 dotenv보다 먼저 module-load된다. 그런데 `supabaseAdmin.ts`가 **module-load 시점에 `createClient(url, key)`를 즉시 실행** → 빈 env로 throw → exit 1. (인라인 client를 쓰는 update-news는 통과했음.)

3. **PostgREST 에러는 throw가 아님**: supabase-js의 insert/update는 PostgREST 에러(테이블 부재 PGRST205 등)를 **예외로 throw하지 않고 `{ error }` 객체로 반환**한다. 코드가 `try { await insert } catch`만 두고 `.error`를 검사하지 않아, 쓰기가 미착지해도 조용히 통과.

## 해결

1. **SSOT 통일** — `SUPPORTED_COINS`에 ADA/AVAX/DOT 추가(9종) + `batch_analysis.ts`가 하드코딩 대신 `SUPPORTED_COINS.map(c => c.symbol)` 참조:
```ts
import { SUPPORTED_COINS } from '../lib/constants';
const symbols = options.symbols || SUPPORTED_COINS.map(c => c.symbol);
```

2. **supabaseAdmin lazy화 (Proxy 패턴)** — module-load `createClient`를 첫 접근 시점으로 지연. 호출처 6개 파일 무수정:
```ts
let _client: SupabaseClient | null = null;
function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase URL or Service Role Key is missing.');
  _client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  return _client;
}
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_t, prop, recv) {
    const c = getClient();
    const v = Reflect.get(c, prop, recv);
    return typeof v === 'function' ? v.bind(c) : v;  // bind 필수 — 내부 this 보존
  },
});
```

3. **insert `.error` 명시 검사** — `batch_runs`/`batch_analysis_results`/`alert_history`의 insert/update에서 반환 `.error`를 검사하고 로깅. 분석 성공분이 전건 저장 실패하면 `[CRITICAL]` 로그:
```ts
const { error } = await supabaseAdmin.from('batch_analysis_results').insert({...});
if (error) { persistFailed++; logger.error(`... ${error.code} ${error.message}`); }
// ...
if (persistAttempted > 0 && persistFailed === persistAttempted)
  logger.error('[CRITICAL] 분석 N건 전부 DB 저장 실패 — 테이블 부재 가능');
```

## 교훈

- **module-load 시점 사이드이펙트(createClient 등)는 ESM import 호이스팅 때문에 dotenv.config()보다 먼저 실행된다.** env 의존 초기화는 반드시 lazy(getter/Proxy)로. 기존 호출부를 안 건드리려면 Proxy + 메서드 `bind`가 정석.
- **supabase-js의 PostgREST 에러는 throw되지 않고 `.error`로 반환** — `try/catch`만으로는 silent failure. 쓰기 경로는 항상 `.error`를 명시 검사.
- **수집목록과 분석목록은 같은 SSOT를 참조해야 한다.** 하드코딩 분기는 시간이 지나면 반드시 어긋난다.
- 정렬 통일은 "0 candles(아예 미수집)"는 해소하지만, ADA/AVAX/DOT는 신규 수집이라 5분봉 누적 전까진 Insufficient data 가능. 또한 "batch_analysis 5분봉 288개 기대 vs update-market-data 일봉 적재" 구조 미스매치는 별개 과제로 잔존.
- 테이블 PostgREST 스키마 부재(PGRST205) 자체는 DB 작업(테이블 생성/스키마 reload)으로 코드 범위 밖. 코드는 silent → loud(로그) 전환까지만 담당.

## 관련 파일
- `lib/supabaseAdmin.ts` (lazy Proxy)
- `scripts/batch_analysis.ts` (SSOT 참조 + insert .error 검사)
- `scripts/alert_engine.ts` (alert_history insert .error 검사)
- `lib/constants.ts` (SUPPORTED_COINS 9종)
- `docs/DAILY_CRON_SELFHOST.md` (자체호스팅 런북)
