import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
export async function fixture() {
  const db = new PrismaClient();
  try {
    await db.user.create({ data: { email: "admin@test.invalid", name: "CI Admin", role: "ADMIN", status: "ACTIVE", passwordHash: await bcrypt.hash("ci-only-password-123", 4) } });
    const store = await db.store.create({ data: { name: "Distinto", slug: "distinto", domain: "test.invalid" } });
    const category = await db.category.create({ data: { slug: "hombres", name: "Hombres" } });
    const brand = await db.brand.create({ data: { slug: "ci", name: "CI" } });
    const type = await db.productType.create({ data: { slug: "camisas", name: "Camisas" } });
    await db.product.create({ data: { id: "ci-product", storeId: store.id, categoryId: category.id, brandId: brand.id, productTypeId: type.id, name: "Camisa CI", slug: "camisa-ci", price: 500, size: "M", colorName: "Negro", colorHex: "#000000", images: "[]" } });
  } finally { await db.$disconnect(); }
}
