import { expect, test } from "@playwright/test";

test("panel rechaza cookie falsificada; login y logout revocan sesión", async ({ page, request }) => {
  expect((await request.get("/api/admin/snapshot")).status()).toBe(401);
  await page.goto("/admin/login");
  await page.getByLabel("Correo").fill("admin@test.invalid");
  await page.getByLabel("Contraseña").fill("ci-only-password-123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  const cookie = (await page.context().cookies()).find(c => c.name === "panel-session");
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.value).toMatch(/^[a-f0-9]{64}$/);
  expect((await page.request.get("/api/admin/snapshot")).status()).toBe(200);
  await page.request.post("/api/admin/logout");
  expect((await page.request.get("/api/admin/snapshot")).status()).toBe(401);
  const replay = await request.get("/api/admin/snapshot", { headers: { Cookie: `panel-session=${cookie!.value}` } });
  expect(replay.status()).toBe(401);
});
test("API exige clave y pedido recalcula precio y consume pieza", async ({ request }) => {
  const url = "/api/v1/stores/distinto";
  expect((await request.get(`${url}/catalog`)).status()).toBe(401);
  const headers = { "x-store-key": "e2e-only-key" };
  const catalog = await request.get(`${url}/catalog`, { headers });
  expect(catalog.ok()).toBe(true);
  expect((await catalog.json()).products[0].id).toBe("ci-product");
  const data = { customerName: "Test", customerEmail: "test@test.invalid", phone: "5512345678", address: "Calle 1", city: "CDMX", items: [{ productId: "ci-product", quantity: 1, size: "M", color: "Negro", name: "Manipulado", price: 1 }] };
  const order = await request.post(`${url}/orders`, { headers, data });
  expect(order.ok()).toBe(true);
  const result = await order.json();
  expect(result.order.subtotal).toBe(500);
  expect((await request.post(`${url}/orders`, { headers, data })).status()).toBe(400);
});
