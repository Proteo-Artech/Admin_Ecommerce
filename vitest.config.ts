import { defineConfig } from "vitest/config";
import path from "node:path";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

const folder = mkdtempSync(path.join(tmpdir(), "distinto-admin-unit-"));
process.env.DATABASE_URL = `file:${path.join(folder, "test.db").replaceAll("\\", "/")}`;
process.env.UPLOAD_DIR = path.join(folder, "uploads");
process.env.AUTH_SECRET = "isolated-unit-test-secret";
process.env.ALLOW_DEMO_SEED = "false";
process.env.STRIPE_SECRET_KEY = "";
process.env.SMTP_HOST = "";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: { include: ["tests/**/*.test.ts"], globalSetup: "./tests/database-setup.ts", fileParallelism: false, restoreMocks: true },
});
