import tseslint from "typescript-eslint";

// Type-aware lint that reports only usage of @deprecated APIs (the TS6385 hints
// editors show but `npm run lint`, tsc, and next build do not). Kept separate from
// eslint.config.mjs so the default lint stays fast; this pass needs full type
// information. Run with `npm run lint:deprecations`.
export default tseslint.config(
  { ignores: ["src/generated/**"] },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "@typescript-eslint": tseslint.plugin },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-deprecated": "error",
    },
  },
);
