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
    // desktop/ is a separate plain-CommonJS Node/Electron codebase (not
    // part of the Next.js app), intentionally using require() the way
    // Electron's main process conventionally does — not this project's
    // TypeScript/ESM rules to lint.
    "desktop/**",
  ]),
]);

export default eslintConfig;
