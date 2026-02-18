import nextEnv from "@next/env";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

nextEnv.loadEnvConfig(process.cwd());

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
    exclude: ["node_modules", ".next", "e2e"],
    environmentMatchGlobs: [
      ["test/services/**", "node"],
      ["test/actions/**", "node"],
      ["test/api/**", "node"],
      ["test/utils/errors.test.ts", "node"],
      ["test/auth/**", "node"],
    ],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/components/ui/**", "src/generated/**"],
    },
  },
});
