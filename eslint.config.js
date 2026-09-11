import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * ESLint 9 flat config.
 *
 * Deliberately compact: the recommended JavaScript, TypeScript and React-hooks
 * rule sets catch real defects, while `eslint-config-prettier` comes last so
 * formatting is owned exclusively by Prettier and the two tools never disagree.
 */
export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "build/**",
      ".react-router/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    ...reactHooks.configs.flat.recommended,
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // Unused values are errors, but an underscore prefix marks an
      // intentionally unused binding (route args, destructured rest).
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports" },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    /**
     * The production server (`server.js`, `server/**`).
     *
     * Plain ESM JavaScript rather than TypeScript, so that Node can run it
     * without a build step and without `tsx` — a devDependency a pruned
     * production install would not have. It therefore sits outside the
     * TypeScript block above and needs Node's globals named here.
     *
     * `console.log` is allowed in this scope alone: the boot lines state
     * whether the access gate is enabled, and that is exactly the kind of fact
     * a deploy log must carry.
     */
    files: ["server.js", "server/**/*.js"],
    languageOptions: {
      globals: { ...globals.node },
      ecmaVersion: 2023,
      sourceType: "module",
    },
    rules: {
      "no-console": "off",
    },
  },
  prettierConfig,
);
