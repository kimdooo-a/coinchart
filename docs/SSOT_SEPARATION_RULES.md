// eslint-rules-ssot-separation.md
// CRYPTO vs STOCK SSOT SEPARATION ENFORCEMENT

## Import Rules (Enforced by ESLint)

### ✅ ALLOWED

#### Crypto Components (app/analysis/[symbol], components/Analysis/CryptoPanel.tsx)
```typescript
import { fetchCryptoMarketPrices } from '@/lib/supabase/crypto';
import { analyzeCrypto } from '@/lib/analysis/crypto';
import { generateSignals } from '@/lib/analysis/signals'; // Crypto signals only
```

#### Stock Components (app/analysis/stock/[symbol], components/Analysis/StockPanel.tsx)
```typescript
import { fetchStockPrices } from '@/lib/supabase/stock';
import { analyzeStock } from '@/lib/analysis/stock';
import { generateStockSignals } from '@/lib/analysis/stock-signals'; // Stock signals only
```

#### 자산-중립 범용 분석 모듈 (crypto/stock 양쪽에서 사용 가능)
`lib/analysis/` 하위 범용 모듈은 특정 자산에 종속되지 않으므로 crypto·stock 컨텍스트 모두에서 직접 import 허용한다.
```typescript
import { performAnalysis } from '@/lib/analysis/orchestrator';   // 범용 분석 오케스트레이터
import { generateSignals } from '@/lib/analysis/signals';        // 범용 캔들→시그널 (CandleData)
import { aggregateCandles } from '@/lib/analysis/aggregation';   // 범용 시간프레임 집계
// 그 외 범용: mtf, divergence, candlestick
```
> crypto↔stock **데이터** 혼선은 `@/lib/supabase/*` 규칙이 별도 차단한다. analysis 레이어 규칙이 막는 것은
> `@/lib/analysis` 부모 직접 import(아래 FORBIDDEN)와 화이트리스트 미등록 신규 모듈뿐이다.
> eslint 규칙은 `eslint.config.mjs`의 `no-restricted-imports` patterns 화이트리스트로 집행한다.

### ❌ FORBIDDEN

#### Cross-asset imports
```typescript
// ❌ Crypto component importing Stock functions
import { fetchStockPrices } from '@/lib/supabase/stock';
import { analyzeStock } from '@/lib/analysis/stock';
import { generateStockSignals } from '@/lib/analysis/stock-signals';

// ❌ Stock component importing Crypto functions
import { fetchCryptoMarketPrices } from '@/lib/supabase/crypto';
import { analyzeCrypto } from '@/lib/analysis/crypto';
import { generateSignals } from '@/lib/analysis/signals';

// ❌ Importing from parent directories (forces explicit files)
import { fetchCryptoMarketPrices } from '@/lib/supabase';
import { analyzeCrypto } from '@/lib/analysis';
```

## File Structure Verification

### Crypto Path (MUST NOT have Stock imports)
```
app/analysis/[symbol]/page.tsx
├── components/Analysis/CryptoPanel.tsx
│   ├── @/lib/supabase/crypto (market_prices)
│   ├── @/lib/analysis/crypto (analyzeCrypto)
│   └── @/lib/analysis/signals (generateSignals)
└── No Stock imports ❌
```

### Stock Path (MUST NOT have Crypto imports)
```
app/analysis/stock/[symbol]/page.tsx
├── components/Analysis/StockPanel.tsx
│   ├── @/lib/supabase/stock (stock_prices)
│   ├── @/lib/analysis/stock (analyzeStock)
│   └── @/lib/analysis/stock-signals (generateStockSignals)
└── No Crypto imports ❌
```

## Validation Script

```bash
# Detect cross-asset imports
grep -r "import.*Stock" app/analysis/[symbol]/page.tsx \
    components/Analysis/CryptoPanel.tsx

grep -r "import.*Crypto\|import.*generateSignals" app/analysis/stock/[symbol]/page.tsx \
    components/Analysis/StockPanel.tsx

# ESLint
npm run lint
```

## CI Integration

### Pre-commit Hook (husky)
```bash
#!/bin/sh
npm run lint -- --fix
git add .

# Verify no cross-asset imports
if grep -r "from.*stock" app/analysis/\[symbol\]/ && ! grep -q "test"; then
    echo "❌ Crypto path has Stock imports"
    exit 1
fi

if grep -r "from.*crypto\|generateSignals" app/analysis/stock/ && ! grep -q "test"; then
    echo "❌ Stock path has Crypto imports"
    exit 1
fi
```

### CI/CD (GitHub Actions)
```yaml
- name: Verify SSOT Separation
  run: |
    # Fail if cross-asset imports found
    ! grep -r "from '@/lib/supabase/stock'" app/analysis/[symbol]/ \
      components/Analysis/CryptoPanel.tsx
    ! grep -r "from '@/lib/supabase/crypto'" app/analysis/stock/ \
      components/Analysis/StockPanel.tsx
```