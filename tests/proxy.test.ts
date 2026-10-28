import { expect, test, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
test("API rechaza claves ausentes o incorrectas, incluso con servidor sin configurar", () => {
  vi.stubEnv("ADMIN_API_SECRET", "test-store-secret");
  expect(proxy(new NextRequest("https://admin.test/api/v1/stores/distinto/catalog")).status).toBe(401);
  expect(proxy(new NextRequest("https://admin.test/api/v1/stores/distinto/catalog", { headers: { "x-store-key": "incorrect" } })).status).toBe(401);
  expect(proxy(new NextRequest("https://admin.test/api/v1/stores/distinto/catalog", { headers: { "x-store-key": "test-store-secret" } })).status).toBe(200);
  vi.stubEnv("ADMIN_API_SECRET", "");
  expect(proxy(new NextRequest("https://admin.test/api/v1/stores/distinto/catalog")).status).toBe(401);
  vi.unstubAllEnvs();
});
