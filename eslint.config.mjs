import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // .eslintignore에서 이관 (flat config에서 .eslintignore는 deprecated):
    "kdy-addon/**",
  ]),
  // PHASE 5: Crypto/Stock SSOT Separation Rules
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/supabase",
              message: "❌ Never import from @/lib/supabase directly. Use @/lib/supabase/crypto or @/lib/supabase/stock instead (SSOT Separation)"
            },
            {
              name: "@/lib/analysis",
              message: "❌ Never import from @/lib/analysis directly. Use @/lib/analysis/crypto or @/lib/analysis/stock instead (SSOT Separation)"
            }
          ],
          patterns: [
            {
              group: ["@/lib/supabase/*", "!@/lib/supabase/crypto", "!@/lib/supabase/stock", "!@/lib/supabase/blog", "!@/lib/supabase/watchlist", "!@/lib/supabase/admin", "!@/lib/supabase/admin-guard", "!@/lib/supabase/server", "!@/lib/supabase/client"],
              message: "❌ Invalid supabase import. Use @/lib/supabase/crypto, @/lib/supabase/stock, @/lib/supabase/blog, or @/lib/supabase/watchlist only"
            },
            {
              // 자산-중립 범용 분석 모듈은 허용 (SSOT_SEPARATION_RULES.md 의도).
              // crypto↔stock 데이터 혼선은 @/lib/supabase/* 규칙이 별도 차단하며,
              // 여기서 막는 것은 @/lib/analysis 부모 직접 import(위 paths 규칙)와
              // 화이트리스트 미등록 신규 모듈뿐이다.
              group: [
                "@/lib/analysis/*",
                "!@/lib/analysis/crypto",
                "!@/lib/analysis/stock",
                "!@/lib/analysis/stock/**",
                "!@/lib/analysis/signals",
                "!@/lib/analysis/stock-signals",
                "!@/lib/analysis/orchestrator",
                "!@/lib/analysis/aggregation",
                "!@/lib/analysis/mtf",
                "!@/lib/analysis/divergence",
                "!@/lib/analysis/candlestick"
              ],
              message: "❌ Invalid analysis import. @/lib/analysis 부모 직접 import 금지. 자산별 진입점(crypto/stock) 또는 등록된 범용 모듈(signals/orchestrator/aggregation 등)만 사용"
            }
          ]
        }
      ]
    }
  }
]);

export default eslintConfig;
