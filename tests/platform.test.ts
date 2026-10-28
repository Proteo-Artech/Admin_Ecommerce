import { beforeAll, afterAll, beforeEach, expect, test, vi } from "vitest";
const jar = vi.hoisted(() => {
  const values = new Map<string, string>();
  return { values, get: (key: string) => values.has(key) ? { value: values.get(key)! } : undefined,
    set: vi.fn((key: string, value: string, _options?: unknown) => { values.set(key, value); }), delete: (key: string) => values.delete(key) };
});
vi.mock("next/headers", () => ({ cookies: async () => jar }));
vi.mock("@/lib/mail", () => ({ sendMail: vi.fn(async () => undefined) }));
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { currentUser, login, placeOrder, quoteOrder, confirmOrder } from "@/lib/platform";
import { createPanelSession, revokePanelSession } from "@/lib/panel-session";
import { POST as upload } from "@/app/api/admin/upload/route";
import { PATCH as renameStore } from "@/app/api/admin/store/route";
import { readFile } from "node:fs/promises";
import path from "node:path";

let userId: string;
let productId: string;
beforeAll(async () => {
  const user = await prisma.user.create({ data: { email: "admin@test.invalid", name: "Test", role: "ADMIN", status: "ACTIVE", passwordHash: await bcrypt.hash("test-password-long", 4) } });
  userId = user.id;
  const store = await prisma.store.create({ data: { name: "Test", slug: "distinto", domain: "test.invalid" } });
  const category = await prisma.category.create({ data: { name: "Hombres", slug: "hombres" } });
  const type = await prisma.productType.create({ data: { name: "Camisas", slug: "camisas" } });
  const brand = await prisma.brand.create({ data: { name: "Test", slug: "test" } });
  const product = await prisma.product.create({ data: { storeId: store.id, categoryId: category.id, brandId: brand.id, productTypeId: type.id, name: "Camisa", slug: "camisa", images: "[]", price: 500, size: "M", colorName: "Negro", colorHex: "#000000" } });
  productId = product.id;
  await prisma.coupon.create({ data: { storeId: store.id, code: "TEST10", name: "10%", type: "PERCENTAGE", value: 10 } });
  await prisma.coupon.create({ data: { storeId: store.id, code: "EXPIRED", name: "Expired", type: "PERCENTAGE", value: 10, endsAt: new Date(0) } });
});
afterAll(() => prisma.$disconnect());
beforeEach(() => jar.values.clear());

test("login rechaza contraseña incorrecta y acepta la correcta", async () => {
  expect(await login("admin@test.invalid", "wrong")).toBeNull();
  expect((await login("admin@test.invalid", "test-password-long"))?.id).toBe(userId);
});
test("un ID de usuario falsificado en cookie ya no autentica", async () => {
  jar.values.set("panel-session", userId);
  expect(await currentUser()).toBeNull();
});
test("sesión aleatoria, hash persistido, vencimiento y revocación", async () => {
  await createPanelSession(userId);
  const token = jar.values.get("panel-session")!;
  expect(token).toMatch(/^[a-f0-9]{64}$/);
  expect(await prisma.session.findUnique({ where: { token } })).toBeNull();
  expect((await currentUser())?.id).toBe(userId);
  await prisma.session.updateMany({ where: { userId }, data: { createdAt: new Date(0) } });
  expect(await currentUser()).toBeNull();
  await createPanelSession(userId);
  const replay = jar.values.get("panel-session")!;
  await revokePanelSession();
  jar.values.set("panel-session", replay);
  expect(await currentUser()).toBeNull();
});
test("suspender un usuario invalida su acceso aunque conserve la cookie", async () => {
  await createPanelSession(userId);
  await prisma.user.update({ where: { id: userId }, data: { status: "SUSPENDED" } });
  expect(await currentUser()).toBeNull();
  await prisma.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });
});
test("cupón válido descuenta y cupón vencido no descuenta", async () => {
  expect((await quoteOrder("distinto", 500, "TEST10")).discount).toBe(50);
  expect((await quoteOrder("distinto", 500, "EXPIRED")).discount).toBe(0);
});
test("editar tienda espera la escritura y devuelve 404 cuando no existe", async () => {
  await createPanelSession(userId);
  const request = (slug: string) => new Request("http://localhost/api/admin/store", { method: "PATCH", body: JSON.stringify({ slug, name: "Nombre actualizado" }) });
  const response = await renameStore(request("distinto"));
  expect((await response.json()).store.name).toBe("Nombre actualizado");
  expect((await prisma.store.findUniqueOrThrow({ where: { slug: "distinto" } })).name).toBe("Nombre actualizado");
  expect((await renameStore(request("inexistente"))).status).toBe(404);
});
const orderInput = () => ({ customerName: "Prueba", customerEmail: "customer@test.invalid", phone: "5512345678", address: "Calle 1", city: "CDMX", items: [{ productId, quantity: 1, size: "M", color: "Negro", name: "Manipulado", price: 1 }] });
test("rechaza carrito vacío, cantidades inválidas y stock agregado en líneas duplicadas", async () => {
  expect(await placeOrder("distinto", { ...orderInput(), items: [] })).toHaveProperty("error");
  const item = orderInput().items[0];
  expect(await placeOrder("distinto", { ...orderInput(), items: [{ ...item, quantity: 0 }] })).toHaveProperty("error");
  expect(await placeOrder("distinto", { ...orderInput(), items: [item, item] })).toHaveProperty("error");
});
test("cobra precio del servidor, descuenta inventario una sola vez y rechaza reventa", async () => {
  const result = await placeOrder("distinto", orderInput());
  expect(result).toHaveProperty("order");
  const order = await prisma.order.findFirstOrThrow();
  expect(order.subtotal).toBe(500);
  expect(order.paymentStatus).toBe("SIMULATED");
  expect((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(0);
  await confirmOrder(order.id, "SIMULATED");
  expect((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(0);
  expect(await placeOrder("distinto", orderInput())).toHaveProperty("error");
});
test("subida exige sesión, rechaza SVG y tamaño excesivo, conserva PNG en volumen", async () => {
  const request = (file: File) => { const form = new FormData(); form.set("file", file); return new Request("http://localhost/api/admin/upload", { method: "POST", body: form }); };
  expect((await upload(request(new File(["x"], "a.png", { type: "image/png" })))).status).toBe(401);
  await createPanelSession(userId);
  expect((await upload(request(new File(["<svg/>"], "a.svg", { type: "image/svg+xml" })))).status).toBe(400);
  expect((await upload(request(new File([new Uint8Array(4_000_001)], "a.png", { type: "image/png" })))).status).toBe(400);
  const response = await upload(request(new File(["png-test-content"], "a.png", { type: "image/png" })));
  expect(response.status).toBe(200);
  const { url } = await response.json();
  expect(url).toMatch(/^\/uploads\/\d+-[a-f0-9]{8}\.png$/);
  expect((await readFile(path.join(process.env.UPLOAD_DIR!, path.basename(url)))).toString()).toBe("png-test-content");
});
