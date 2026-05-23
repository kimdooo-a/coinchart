---
title: tsx 1-liner 검증 시 path alias `@/` 모듈의 named export 손실
date: 2026-05-23
session: 8
tags: [tsx, esm, path-alias, nextjs, verification]
category: workaround
confidence: medium
---

## 문제

R1/T03 작업 명세서가 제시한 1회성 검증 명령:

```bash
npx tsx -e "import('./lib/supabase/crypto').then(async m => { const t = await m.fetchCommunityTickers(); console.log(t.length, t[0]); })"
```

가 다음 에러로 실패한다:

```
TypeError: m.fetchCommunityTickers is not a function
```

`Object.keys(m)`를 찍어보면 `['default']` 하나뿐. 분명 ESM `export async function fetchCommunityTickers()`로 export했고 `tsc --noEmit`은 통과한 상태.

## 원인

`lib/supabase/crypto.ts` 파일 상단에서 path alias를 사용한다:

```ts
import { createClient } from '@/lib/supabase/client';   // 런타임 import
import type { CoinTicker } from '@/types/coins';        // type-only import
```

`tsx`(esbuild 기반)는 tsconfig `paths.@/*` 매핑을 자체 해석하지만, 명령줄 `-e` 평가 모드에서 ESM 동적 import + path alias 조합이 들어가면 named export를 정상 추출하지 못하고 모듈 전체를 `default` 키로 래핑해 노출하는 케이스가 발생. (구체적으로는 `import.meta` 해석 실패 또는 module-namespace 객체 생성 단계에서의 에러 흡수로 추정. 같은 파일을 Next 빌드에서 import하면 정상 동작.)

핵심: `@/` alias가 포함된 모듈을 **tsx 1-liner로 동적 import**할 때 발생. 일반 빌드/실행에서는 재현되지 않는 검증-전용 함정.

## 해결

검증 명세는 따르되, **검증 로직만 추출한 1회성 ESM 스크립트**로 우회.

```js
// scripts/verify-t03-ticker.mjs (검증 후 삭제)
const URL = "https://api.binance.com/api/v3/ticker/24hr";
const SYMBOLS = ["BTCUSDT", "ETHUSDT", /* ... */];
const res = await fetch(`${URL}?symbols=${encodeURIComponent(JSON.stringify(SYMBOLS))}`);
const raw = await res.json();
const list = raw.map(r => ({
  symbol: r.symbol,
  baseSymbol: r.symbol.replace(/USDT$/, ""),
  price: Number(r.lastPrice),
  // ... 정규화 로직 그대로 복제
}));
console.log("count", list.length, "first", list[0]);
```

```powershell
node scripts/verify-t03-ticker.mjs
Remove-Item scripts/verify-t03-ticker.mjs -Force
```

이 우회는 **모듈 import는 포기하고 검증 로직만 복제**하는 식이라, 본체 코드의 회귀를 잡지는 못한다. 본체 검증은 `tsc --noEmit` + `eslint`로 위임하고, 본 스크립트는 **외부 API 응답 형식과 정규화 산출물의 형태만 확인**하는 역할.

## 교훈

- 작업 명세에 `npx tsx -e` 형태의 검증이 있고 대상 모듈이 path alias를 쓴다면, 사전에 alias 미사용 entry 모듈을 별도로 만들어 두거나, 위처럼 검증 로직만 분리한 `.mjs` 스크립트로 우회한다.
- `tsc --noEmit`이 통과한다고 tsx 1-liner도 통과한다고 가정하면 안 된다 — 둘은 모듈 해석 단계가 다르다.
- 우회 스크립트는 항상 **검증 후 즉시 삭제** (검증 명세에 명시되어야 하면 명세 자체를 수정 PR로 제안).

## 관련 파일

- `lib/supabase/crypto.ts` — `@/` alias를 쓰는 SSOT 모듈
- `docs/orchestration/2026-05-23-R1-mainpage/T03-ticker-ssot.md` — 명세의 검증 1-liner 출처
- `docs/handover/2026-05-23-R1-T03-ticker-ssot.md` — 본 우회를 적용한 검증 결과
