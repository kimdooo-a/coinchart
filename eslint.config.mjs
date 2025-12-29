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
              group: ["@/lib/supabase/*", "!@/lib/supabase/crypto", "!@/lib/supabase/stock"],
              message: "❌ Invalid supabase import. Use @/lib/supabase/crypto or @/lib/supabase/stock only"
            },
            {
              group: ["@/lib/analysis/*", "!@/lib/analysis/crypto", "!@/lib/analysis/stock"],
              message: "❌ Invalid analysis import. Use @/lib/analysis/crypto or @/lib/analysis/stock only"
            }
          ]
        }
      ]
    }
  }
]);

export default eslintConfig;
