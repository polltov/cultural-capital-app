import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    exclude: ["tests/e2e/**"],
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 20000,
    coverage: { reporter: ["text", "html"], exclude: ["**/*.d.ts", "tests/**"] },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./") },
  },
});
