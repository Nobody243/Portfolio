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
    // Agent tooling and throwaway verification harnesses — not project source.
    // These are gitignored, but .gitignore is not an eslint ignore: without
    // this line a batch of scratch CommonJS probe scripts turns `npm run lint`
    // red for reasons that have nothing to do with the site, and lint is a gate
    // the implementer and reviewer both rely on.
    ".claude/**",
  ]),
]);

export default eslintConfig;
