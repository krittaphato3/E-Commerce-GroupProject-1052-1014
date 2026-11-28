import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 20000,
    // COV-01 (NFR-10, DEC-40): line coverage of the service layer, gated at 85%.
    coverage: {
      provider: "v8",
      // Every matching file is reported, so a service no test imports counts as uncovered.
      include: ["src/services/**/*.ts"],
      exclude: ["**/*.test.ts"],
      reporter: ["text", "json-summary", "lcov"],
      thresholds: { lines: 85 },
    },
  },
});
