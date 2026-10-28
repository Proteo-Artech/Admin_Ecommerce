import { expect, test, vi } from "vitest";
import { mediaUrl } from "@/lib/media";
test("imagen del detalle apunta al VPS o al dominio R2, nunca a la tienda", () => {
  vi.stubEnv("ADMIN_PUBLIC_URL", "https://admin.test/");
  vi.stubEnv("ASSET_PUBLIC_URL", "");
  expect(mediaUrl("/uploads/photo.png")).toBe("https://admin.test/uploads/photo.png");
  vi.stubEnv("ASSET_PUBLIC_URL", "https://media.test/");
  expect(mediaUrl("/uploads/photo.png")).toBe("https://media.test/uploads/photo.png");
  expect(mediaUrl("https://images.unsplash.com/photo")).toBe("https://images.unsplash.com/photo");
  vi.unstubAllEnvs();
});
