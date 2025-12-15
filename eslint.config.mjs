import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginNext from "@next/eslint-plugin-next";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      react: { version: "detect" },
    },
    plugins: {
      "@next/next": pluginNext,
      react: pluginReact,
      "react-hooks": pluginReactHooks,
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,
      ...pluginReact.configs["jsx-runtime"].rules,
      ...pluginReactHooks.configs.recommended.rules,
      // TanStack Table v8 uses interior mutability incompatible with React Compiler.
      // Disable until TanStack Table v9 releases with React Compiler support.
      // See: https://github.com/TanStack/table/issues/5567
      "react-hooks/incompatible-library": "off",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  eslintConfigPrettier,
  {
    files: ["**/*.config.js", "**/*.config.cjs"],
    languageOptions: {
      sourceType: "commonjs",
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"],
  },
];
