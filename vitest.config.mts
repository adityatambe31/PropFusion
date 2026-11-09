import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    exclude: ["tests/e2e/**"],
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 10000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/db/payment.ts", "lib/db/assets-db.ts", "lib/db/tenant-invite.ts", "lib/db/transaction.ts", "lib/db/leases-db.ts", "lib/helpers/report-helpers.ts"],
      exclude: ["tests/**"],
    },
  },
});
