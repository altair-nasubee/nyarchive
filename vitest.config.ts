import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: {
      // tsconfig の "@/*" -> "src/*" に対応
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
