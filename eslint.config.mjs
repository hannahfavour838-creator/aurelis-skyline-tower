import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Three.js objects (materials, uniforms, cameras) are imperative and are mutated
    // every frame inside useFrame — outside React's render phase by design. The React
    // Compiler's immutability heuristic cannot model that, so it is scoped off here only.
    files: ["src/components/scene/**/*.{ts,tsx}", "src/components/skyscraper/**/*.{ts,tsx}"],
    rules: { "react-hooks/immutability": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
