import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Vitest config for ContextForge.
 *
 * Tests target the pure extraction/parsing logic and the Supabase-facing
 * orchestration (with an injected mock client), so a plain Node environment is
 * sufficient — no jsdom required. The `@/` alias mirrors tsconfig `paths`.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
