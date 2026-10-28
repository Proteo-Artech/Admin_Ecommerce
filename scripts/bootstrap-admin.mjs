import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
if (!email || !password || password.length < 16) throw new Error("Define ADMIN_BOOTSTRAP_EMAIL y ADMIN_BOOTSTRAP_PASSWORD de al menos 16 caracteres.");
const db = new PrismaClient();
try {
  if (await db.user.findUnique({ where: { email } })) throw new Error("El usuario ya existe; no se modificó su contraseña.");
  const passwordHash = await bcrypt.hash(password, 12);
  await db.$transaction(async tx => {
    await tx.user.create({ data: { email, name: "Administrador", role: "ADMIN", status: "ACTIVE", passwordHash } });
    await tx.store.upsert({ where: { slug: "distinto" }, update: {}, create: {
      slug: "distinto", name: "Distinto", domain: new URL(process.env.STORE_PUBLIC_URL || "http://localhost:3000").host,
    } });
    for (const [slug, name] of [["hombres", "Hombres"], ["mujeres", "Mujeres"], ["juniors", "Juniors"], ["accesorios", "Accesorios"]]) {
      await tx.category.upsert({ where: { slug }, update: {}, create: { slug, name } });
    }
    await tx.brand.upsert({ where: { slug: "distinto" }, update: {}, create: { slug: "distinto", name: "Distinto" } });
    await tx.productType.upsert({ where: { slug: "camisas" }, update: {}, create: { slug: "camisas", name: "Camisas" } });
  });
  console.log("Administrador creado.");
} finally { await db.$disconnect(); }
