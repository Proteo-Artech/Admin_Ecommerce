import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import type { Prisma } from "@prisma/client";
import { brands as brandNames, categories as seedSections, products as seedProducts, type CategorySlug, type Product } from "@/data/catalog";
import { hashCode, resetToken, verificationCode } from "@/lib/codes";
import { prisma } from "@/lib/db";
import { panelSessionUser } from "@/lib/panel-session";
import {
  bulletinMail,
  bulletinPreviewHtml,
  contactCopyMail,
  contactStoreMail,
  distintoAttachments,
  newsletterWelcomeMail,
  orderCustomerMail,
  orderStatusMail,
  orderStoreMail,
  passwordChangedMail,
  resetMail,
  verificationMail,
  type MailOrder,
} from "@/lib/distinto-mail";
import { sendMail } from "@/lib/mail";

export type Role = "ADMIN" | "MODERATOR";
export type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: "ACTIVE" | "INACTIVE";
};

export type ShopRecord = {
  id: string;
  slug: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
};

export type StoreCategory = {
  id: string;
  slug: CategorySlug | string;
  name: string;
  image: string;
  subcategories: string[];
};

export type StoreBrand = { id: string; name: string; slug: string };

export type Coupon = {
  id: string;
  code: string;
  name: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  minSubtotal: number | null;
  maxDiscount: number | null;
  isActive: boolean;
  usageLimit: number | null;
  startsAt: string;
  endsAt: string | null;
  forNewCustomers: boolean;
  categoryIds: string[];
};

export type ShopOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  customerEmail: string;
  phone: string;
  address: string;
  city: string;
  items: { id: string; name: string; quantity: number; total: number }[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode: string | null;
  paymentMethod: "CARD";
  paymentStatus: string;
  isGift: boolean;
  giftNote: string | null;
  createdAt: string;
};

const STORE_COOKIE = "panel-store";
const productInclude = { brand: true, category: true, productType: true } as const;

const garmentTypes = [
  ["playeras", "Playeras"],
  ["pantalones", "Pantalones"],
  ["pants", "Pants"],
  ["shorts", "Shorts"],
  ["camisas", "Camisas"],
  ["vestidos", "Vestidos"],
  ["chamarras", "Chamarras"],
  ["zapatos", "Zapatos"],
  ["tenis", "Tenis"],
  ["gorras", "Gorras"],
  ["bolsas", "Bolsas"],
  ["carteras", "Carteras"],
] as const;

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function typeSlugFor(product: (typeof seedProducts)[number]) {
  const name = product.name.toLowerCase();
  if (name.includes("chaqueta") || name.includes("chamarra")) return "chamarras";
  if (name.includes("zapato")) return "zapatos";
  if (name.includes("tenis")) return "tenis";
  if (name.includes("gorra")) return "gorras";
  const map: Record<string, string> = {
    Playeras: "playeras",
    Camisa: "camisas",
    Básicos: "pantalones",
    Polos: "playeras",
    Vestidos: "vestidos",
    Blusas: "playeras",
    Pantalones: "pantalones",
    Hoodies: "chamarras",
    Jeans: "pants",
    Bolsos: "bolsas",
    Joyería: "carteras",
    Cinturones: "carteras",
  };
  return map[product.subcategory] ?? "playeras";
}

let ready: Promise<void> | null = null;

function readyDb() {
  ready ??= seedIfEmpty();
  return ready;
}

async function seedIfEmpty() {
  // Los despliegues nunca crean cuentas ni catálogo de demostración implícitamente.
  if (process.env.ALLOW_DEMO_SEED !== "true" || !["test", "develop"].includes(process.env.APP_ENV ?? "")) return;
  if ((await prisma.store.count()) > 0) return;
  const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!bootstrapPassword || bootstrapPassword.length < 16) throw new Error("Configura ADMIN_BOOTSTRAP_PASSWORD (mínimo 16 caracteres) para sembrar demo.");
  const passwordAdmin = await bcrypt.hash(bootstrapPassword, 10);
  const passwordStaff = await bcrypt.hash(resetToken(), 10);
  const admin = await prisma.user.create({
    data: { email: "admin@distinto.mx", passwordHash: passwordAdmin, name: "Administrador", role: "ADMIN", status: "ACTIVE" },
  });
  const staff = await prisma.user.create({
    data: { email: "encargado@distinto.mx", passwordHash: passwordStaff, name: "Encargado de catálogo", role: "MODERATOR", status: "ACTIVE" },
  });
  const stores = await Promise.all(
    [
      ["distinto", "Distinto", "localhost:3000"],
      ["tienda-2", "Tienda 2", "tienda-2.local"],
      ["tienda-3", "Tienda 3", "tienda-3.local"],
    ].map(([slug, name, domain]) => prisma.store.create({ data: { slug, name, domain, status: "ACTIVE" } })),
  );
  await prisma.storeMember.create({ data: { userId: staff.id, storeId: stores[0].id } });
  void admin;
  const categories = await Promise.all(
    seedSections.map((section) =>
      prisma.category.create({
        data: { slug: section.slug, name: section.slug === "juniors" ? "Junior" : section.name },
      }),
    ),
  );
  const types = await Promise.all(garmentTypes.map(([slug, name]) => prisma.productType.create({ data: { slug, name } })));
  const brands = await Promise.all(brandNames.map((name) => prisma.brand.create({ data: { name, slug: slugify(name) } })));
  const distinto = stores[0];
  for (const product of seedProducts) {
    const brand = brands.find((item) => item.name === product.brand) ?? brands[0];
    const category = categories.find((item) => item.slug === product.category) ?? categories[0];
    const type = types.find((item) => item.slug === typeSlugFor(product)) ?? types[0];
    await prisma.product.create({
      data: {
        storeId: distinto.id,
        categoryId: category.id,
        productTypeId: type.id,
        brandId: brand.id,
        name: product.name,
        slug: product.slug,
        description: product.description ?? "",
        price: product.price,
        comparePrice: product.comparePrice,
        size: product.sizes[0] ?? "Única",
        colorName: product.colors[0]?.name ?? "Único",
        colorHex: product.colors[0]?.hex ?? "#1D1B19",
        images: JSON.stringify(product.images),
        model: product.model,
        isFeatured: ["vestido", "cadena", "chino", "chaqueta", "cinturon"].includes(product.id),
        isNew: Boolean(product.isNew),
        pieceStatus: "AVAILABLE",
      },
    });
  }
  await prisma.coupon.create({
    data: {
      storeId: distinto.id,
      code: "BIENVENIDA",
      name: "Bienvenida 10%",
      type: "PERCENTAGE",
      value: 10,
      isActive: true,
    },
  });
}

function imagesOf(value: string) {
  try {
    const parsed = JSON.parse(value) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

function toPublic(product: ProductRow) {
  const stock = Math.max(0, product.stock);
  const sold = stock < 1;
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand.name,
    category: product.category.slug as CategorySlug,
    subcategory: product.productType.name,
    price: product.price,
    comparePrice: product.comparePrice ?? undefined,
    model: product.model,
    images: imagesOf(product.images),
    colors: [{ name: product.colorName, hex: product.colorHex }],
    sizes: [product.size],
    rating: 5,
    reviews: 0,
    isNew: product.isNew,
    isFeatured: product.isFeatured,
    isUnique: product.isUnique,
    isActive: product.isActive,
    description: product.description,
    stock: product.isActive ? stock : 0,
    sold,
  };
}

async function storeBySlug(slug: string) {
  await readyDb();
  return prisma.store.findFirst({ where: { slug, status: "ACTIVE" } });
}

export async function listStores() {
  await readyDb();
  return prisma.store.findMany({ orderBy: { name: "asc" } });
}

export async function visibleStores() {
  const user = await currentUser();
  const stores = await listStores();
  if (!user || user.role === "ADMIN") return stores;
  const links = await prisma.storeMember.findMany({ where: { userId: user.id } });
  const allowed = new Set(links.map((link) => link.storeId));
  return stores.filter((store) => allowed.has(store.id));
}

export async function storeProductCounts() {
  await readyDb();
  const rows = await prisma.product.groupBy({ by: ["storeId"], _count: { _all: true } });
  return Object.fromEntries(rows.map((row) => [row.storeId, row._count._all]));
}

export async function selectedStore() {
  const stores = await visibleStores();
  const jar = await cookies();
  const slug = jar.get(STORE_COOKIE)?.value;
  return stores.find((store) => store.slug === slug) ?? stores[0];
}

export async function selectStore(slug: string) {
  const stores = await visibleStores();
  const store = stores.find((item) => item.slug === slug);
  if (!store) return null;
  const jar = await cookies();
  jar.set(STORE_COOKIE, store.slug, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return store;
}

export async function renameStore(slug: string, name: string) {
  await readyDb();
  return prisma.store.update({ where: { slug }, data: { name: name.trim() } }).catch(() => null);
}

export async function currentUser(): Promise<SessionUser | null> {
  await readyDb();
  const user = await panelSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role, status: "ACTIVE" };
}

export async function requireRole(roles: Role[]) {
  const user = await currentUser();
  if (!user || !roles.includes(user.role)) return null;
  return user;
}

export async function login(email: string, password: string) {
  await readyDb();
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || user.status !== "ACTIVE" || (user.role !== "ADMIN" && user.role !== "MODERATOR") || !user.passwordHash) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role as Role, status: "ACTIVE" as const };
}

async function typeNames() {
  const types = await prisma.productType.findMany({ orderBy: { name: "asc" } });
  return types.map((type) => type.name);
}

export async function panelSnapshot() {
  const store = await selectedStore();
  const [categories, brands, products, coupons, orders, customers, types] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { storeId: store.id }, include: productInclude, orderBy: { createdAt: "desc" } }),
    prisma.coupon.findMany({
      where: { storeId: store.id },
      include: { redemptions: true, categories: { select: { categoryId: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({ where: { storeId: store.id }, include: { items: true }, orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({ where: { role: "CUSTOMER", orders: { some: { storeId: store.id } } }, orderBy: { createdAt: "desc" } }),
    typeNames(),
  ]);
  return {
    store,
    stores: await visibleStores(),
    categories: categories.map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      image: "",
      subcategories: types,
    })),
    brands: brands.map((brand) => ({ id: brand.id, name: brand.name, slug: brand.slug })),
    products: products.map(toPublic),
    customers: customers.map((customer) => ({
      id: customer.id,
      email: customer.email,
      name: customer.name,
      lastName: customer.lastName,
      phone: customer.phone ?? "",
      status: customer.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
    })),
    coupons: coupons.map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      name: coupon.name,
      type: coupon.type,
      value: coupon.value,
      minSubtotal: coupon.minSubtotal,
      maxDiscount: coupon.maxDiscount,
      isActive: coupon.isActive,
      usageLimit: coupon.usageLimit,
      startsAt: coupon.startsAt.toISOString(),
      endsAt: coupon.endsAt?.toISOString() ?? null,
      forNewCustomers: coupon.forNewCustomers,
      categoryIds: coupon.categories.map((item) => item.categoryId),
      uses: coupon.redemptions.length,
      discounted: coupon.redemptions.reduce((total, item) => total + item.discountAmount, 0),
    })),
    orders: orders.map(toOrder),
  };
}

function toOrder(order: Prisma.OrderGetPayload<{ include: { items: true } }>): ShopOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    phone: order.phone,
    address: order.isGift ? order.giftRecipientAddress || order.address : order.address,
    city: order.city,
    items: order.items.map((item) => ({ id: item.id, name: item.name, quantity: item.quantity, total: item.total })),
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    total: order.total,
    couponCode: order.couponCode,
    paymentMethod: "CARD",
    paymentStatus: order.paymentStatus,
    isGift: order.isGift,
    giftNote: order.giftNote,
    createdAt: order.createdAt.toISOString(),
  };
}

export async function dashboardStats() {
  const store = await selectedStore();
  const [orders, products, customers] = await Promise.all([
    prisma.order.findMany({ where: { storeId: store.id } }),
    prisma.product.findMany({ where: { storeId: store.id } }),
    prisma.order.findMany({ where: { storeId: store.id }, distinct: ["customerEmail"] }),
  ]);
  const paid = orders.filter((order) => order.status !== "CANCELLED" && order.status !== "PENDING");
  const sales = paid.reduce((total, order) => total + order.total, 0);
  return {
    store,
    sales,
    orders: orders.length,
    ticket: paid.length ? Math.round(sales / paid.length) : 0,
    activeProducts: products.filter((product) => product.isActive && product.stock > 0).length,
    outOfStock: products.filter((product) => product.stock < 1).length,
    featured: products.filter((product) => product.isFeatured).length,
    unique: products.filter((product) => product.isUnique).length,
    customers: customers.length,
  };
}

export async function catalogFor(slug: string) {
  const store = await storeBySlug(slug);
  if (!store) return null;
  const [products, categories, types] = await Promise.all([
    prisma.product.findMany({
      where: { storeId: store.id, isActive: true, stock: { gt: 0 } },
      include: productInclude,
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    typeNames(),
  ]);
  return {
    store: { slug: store.slug, name: store.name },
    products: products.map(toPublic),
    categories: categories.map((category) => ({
      slug: category.slug,
      name: category.name,
      image: seedSections.find((item) => item.slug === category.slug)?.image ?? "",
      filters: ["Todo", ...types],
    })),
  };
}

export async function productFor(storeSlug: string, productSlug: string) {
  const store = await storeBySlug(storeSlug);
  if (!store) return null;
  const product = await prisma.product.findFirst({
    where: { storeId: store.id, slug: productSlug, isActive: true, stock: { gt: 0 } },
    include: productInclude,
  });
  return product ? toPublic(product) : null;
}

export async function saveProduct(input: Partial<Product> & { sold?: boolean }, id?: string) {
  const store = await selectedStore();
  const name = (input.name ?? "").trim() || "Prenda sin nombre";
  let slug = slugify(input.slug || name) || "prenda";
  let index = 2;
  while (await prisma.product.findFirst({ where: { storeId: store.id, slug, NOT: id ? { id } : undefined } })) {
    slug = `${slugify(name)}-${index}`;
    index += 1;
  }
  const category = await prisma.category.findUnique({ where: { slug: input.category ?? "hombres" } });
  const typeName = (input.subcategory ?? "").trim();
  const type = (await prisma.productType.findFirst({ where: { name: typeName } })) ?? (await prisma.productType.findFirst());
  const brandName = (input.brand ?? "").trim();
  const brand =
    (await prisma.brand.findFirst({ where: { name: brandName } })) ??
    (await prisma.brand.create({ data: { name: brandName || "Distinto", slug: slugify(brandName || "distinto") } }));
  if (!category || !type || !brand) return null;
  const unique = input.isUnique !== false;
  const units = Math.max(0, Math.floor(Number(input.stock) || 0));
  const stock = unique ? (input.sold ? 0 : 1) : units;
  const price = Math.max(0, Number(input.price) || 0);
  const compareRaw = input.comparePrice == null ? null : Number(input.comparePrice);
  const data = {
    name,
    slug,
    description: (input.description ?? "").trim(),
    price,
    comparePrice: compareRaw && compareRaw > price ? compareRaw : null,
    size: input.sizes?.[0]?.trim() || "Única",
    colorName: input.colors?.[0]?.name?.trim() || "Único",
    colorHex: input.colors?.[0]?.hex || "#1D1B19",
    images: JSON.stringify((input.images ?? []).filter(Boolean)),
    model: (input.model ?? "").trim(),
    isFeatured: Boolean(input.isFeatured),
    isNew: Boolean(input.isNew),
    isActive: input.isActive !== false,
    isUnique: unique,
    stock,
    pieceStatus: stock > 0 ? "AVAILABLE" : "SOLD",
    categoryId: category.id,
    productTypeId: type.id,
    brandId: brand.id,
  } as const;
  if (id) {
    const current = await prisma.product.findFirst({ where: { id, storeId: store.id } });
    if (!current) return null;
    const saved = await prisma.product.update({
      where: { id },
      data: { ...data, soldOrderId: stock > 0 ? null : current.soldOrderId },
      include: productInclude,
    });
    return toPublic(saved);
  }
  const saved = await prisma.product.create({ data: { ...data, storeId: store.id, soldOrderId: null }, include: productInclude });
  return toPublic(saved);
}

export async function removeProduct(id: string) {
  const store = await selectedStore();
  const product = await prisma.product.findFirst({ where: { id, storeId: store.id }, include: { items: true } });
  if (!product) return "missing" as const;
  if (product.items.length) {
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    return "hidden" as const;
  }
  await prisma.product.delete({ where: { id } });
  return "deleted" as const;
}

export async function saveSubcategories(_slug: string, subcategories: string[]) {
  await readyDb();
  const names = [...new Set(subcategories.map((item) => item.trim()).filter(Boolean))];
  const existing = await prisma.productType.findMany({ include: { _count: { select: { products: true } } } });
  for (const type of existing) {
    const keep = names.some((name) => slugify(name) === type.slug);
    if (!keep && type._count.products > 0) continue;
    if (!keep) await prisma.productType.delete({ where: { id: type.id } });
  }
  for (const name of names) {
    const slug = slugify(name);
    await prisma.productType.upsert({ where: { slug }, update: { name }, create: { slug, name } });
  }
}

function couponDate(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function couponLimit(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const limit = Math.floor(Number(value));
  return Number.isFinite(limit) && limit > 0 ? limit : null;
}

function couponMoney(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : null;
}

export async function saveCoupon(input: Partial<Coupon>, id?: string) {
  const store = await selectedStore();
  const code = (input.code ?? "").trim().toUpperCase();
  const startsAt = couponDate(input.startsAt) ?? new Date();
  const endsAt = couponDate(input.endsAt);
  const usageLimit = couponLimit(input.usageLimit);
  const maxDiscount = couponMoney(input.maxDiscount);
  const forNewCustomers = input.forNewCustomers === undefined ? undefined : Boolean(input.forNewCustomers);
  if (endsAt && endsAt.getTime() <= startsAt.getTime()) return { error: "La hora de cierre tiene que ser después de la de inicio." };
  const data = {
    code,
    name: (input.name ?? code).trim(),
    type: forNewCustomers || input.type !== "FIXED_AMOUNT" ? ("PERCENTAGE" as const) : ("FIXED_AMOUNT" as const),
    value: Math.max(0, Number(input.value) || 0),
    minSubtotal: input.minSubtotal ? Number(input.minSubtotal) : null,
    maxDiscount,
    isActive: input.isActive !== false,
    usageLimit,
    startsAt,
    endsAt,
    forNewCustomers,
  };
  try {
    const current = id ? await prisma.coupon.findFirst({ where: { id, storeId: store.id } }) : null;
    if (id && !current) return { error: "No encontramos ese cupón." };
    const coupon = current
      ? await prisma.coupon.update({ where: { id: current.id }, data })
      : await prisma.coupon.create({ data: { ...data, storeId: store.id, forNewCustomers: Boolean(forNewCustomers) } });
    if (input.categoryIds) await replaceCouponCategories(coupon.id, input.categoryIds);
    return coupon;
  } catch {
    return { error: "Ese código ya existe en esta tienda." };
  }
}

async function replaceCouponCategories(couponId: string, categoryIds: string[]) {
  const unique = [...new Set(categoryIds.filter(Boolean))];
  const known = unique.length ? await prisma.category.findMany({ where: { id: { in: unique } }, select: { id: true } }) : [];
  await prisma.couponOnCategory.deleteMany({ where: { couponId } });
  if (!known.length) return;
  await prisma.couponOnCategory.createMany({ data: known.map((category) => ({ couponId, categoryId: category.id })) });
}

type QuoteLine = { productId: string; quantity: number };

async function eligibleSubtotal(storeId: string, categoryIds: string[], lines: QuoteLine[] | undefined, subtotal: number) {
  if (!categoryIds.length) return { base: subtotal, reason: undefined as string | undefined };
  if (!lines?.length) return { base: 0, reason: "Ese cupón solo aplica a algunas categorías." };
  const allowed = new Set(categoryIds);
  const products = await prisma.product.findMany({
    where: { storeId, id: { in: lines.map((line) => line.productId) } },
    select: { id: true, price: true, categoryId: true },
  });
  const byId = new Map(products.map((product) => [product.id, product]));
  const base = lines.reduce((total, line) => {
    const product = byId.get(line.productId);
    const quantity = Math.floor(Number(line.quantity) || 0);
    if (!product || quantity < 1 || !allowed.has(product.categoryId)) return total;
    return total + product.price * quantity;
  }, 0);
  if (base <= 0) return { base: 0, reason: "Ese cupón no aplica a las prendas de este pedido." };
  return { base, reason: undefined };
}

async function quoteCoupon(storeId: string, code: string, subtotal: number, email?: string, lines?: QuoteLine[]) {
  const coupon = await prisma.coupon.findFirst({
    where: { storeId, code: code.trim().toUpperCase(), isActive: true },
    include: { redemptions: { include: { order: true } }, categories: { select: { categoryId: true } } },
  });
  if (!coupon) return { coupon: null, discount: 0, reason: undefined as string | undefined };
  const now = new Date();
  if (coupon.startsAt > now || (coupon.endsAt && coupon.endsAt <= now)) return { coupon, discount: 0, reason: "El cupón no está vigente." };
  if (coupon.usageLimit != null && coupon.redemptions.length >= coupon.usageLimit) return { coupon, discount: 0, reason: "Ese cupón ya se agotó." };
  if (email && coupon.perCustomerLimit != null) {
    const mine = coupon.redemptions.filter((item) => item.order.customerEmail.toLowerCase() === email.toLowerCase()).length;
    if (mine >= coupon.perCustomerLimit) return { coupon, discount: 0, reason: "Ya usaste este cupón." };
  }
  if (coupon.forNewCustomers && email?.trim()) {
    const previous = await prisma.order.count({
      where: { storeId, customerEmail: email.trim().toLowerCase(), status: { not: "CANCELLED" } },
    });
    if (previous > 0) return { coupon, discount: 0, reason: "Este cupón es solo para tu primera compra." };
  }
  const eligible = await eligibleSubtotal(storeId, coupon.categories.map((item) => item.categoryId), lines, subtotal);
  if (eligible.reason) return { coupon, discount: 0, reason: eligible.reason };
  if (coupon.minSubtotal && eligible.base < coupon.minSubtotal) return { coupon, discount: 0, reason: "No alcanza el mínimo de compra." };
  const raw = coupon.type === "PERCENTAGE" || coupon.forNewCustomers ? (eligible.base * coupon.value) / 100 : coupon.value;
  const capped = coupon.maxDiscount != null ? Math.min(raw, coupon.maxDiscount) : raw;
  return { coupon, discount: Math.min(eligible.base, Math.max(0, Math.round(capped))), reason: undefined };
}

export async function quoteOrder(
  storeSlug: string,
  subtotal: number,
  couponCode?: string,
  email?: string,
  lines?: QuoteLine[],
) {
  const store = await storeBySlug(storeSlug);
  if (!store) return { discount: 0, shipping: 0, total: subtotal, coupon: null, couponCode: null, reason: "Tienda no disponible." };
  const quoted = couponCode?.trim() ? await quoteCoupon(store.id, couponCode, subtotal, email, lines) : { coupon: null, discount: 0, reason: undefined };
  const shipping = subtotal > 0 && subtotal - quoted.discount < 799 ? 99 : 0;
  return {
    discount: quoted.discount,
    shipping,
    total: Math.max(0, subtotal - quoted.discount) + shipping,
    coupon: quoted.coupon,
    couponCode: quoted.coupon && quoted.discount > 0 ? quoted.coupon.code : null,
    reason: quoted.reason,
  };
}

const statusFlow: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

async function deliver(storeSlug: string, to: string, mail: { subject: string; text: string; html: string }) {
  const branded = storeSlug === "distinto";
  await sendMail(to, mail.subject, mail.text, branded ? mail.html : undefined, branded ? distintoAttachments() : undefined);
}

function asMailOrder(order: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  address: string;
  city: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  isGift: boolean;
  giftRecipientName: string | null;
  giftRecipientAddress: string | null;
  giftNote: string | null;
  items: { name: string; quantity: number; size: string; color: string; total: number }[];
}): MailOrder {
  return {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    phone: order.phone,
    address: order.address,
    city: order.city,
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    total: order.total,
    isGift: order.isGift,
    giftRecipientName: order.giftRecipientName,
    giftRecipientAddress: order.giftRecipientAddress,
    giftNote: order.giftNote,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      total: item.total,
    })),
  };
}

async function notifyOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true, store: true } });
  if (!order || order.notifiedAt || order.status === "PENDING" || order.status === "CANCELLED") return;
  const mailOrder = asMailOrder(order);
  await deliver(order.store.slug, order.customerEmail, orderCustomerMail(mailOrder));
  await deliver(order.store.slug, process.env.ORDER_NOTIFY_EMAIL ?? "pedidos@distinto.mx", orderStoreMail(mailOrder, order.store.name));
  await prisma.order.update({ where: { id: order.id }, data: { notifiedAt: new Date() } });
}

async function notifyStatus(orderId: string, status: OrderStatus, note?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true, store: true } });
  if (!order) return;
  await deliver(order.store.slug, order.customerEmail, orderStatusMail(asMailOrder(order), status, note));
}

async function takeStock(orderId: string) {
  const items = await prisma.orderItem.findMany({ where: { orderId } });
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const taken = await tx.product.updateMany({
        where: { id: item.productId, isActive: true, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (taken.count !== 1) throw new Error("sin stock");
    }
    const products = await tx.product.findMany({ where: { id: { in: items.map((item) => item.productId) } } });
    for (const product of products) {
      if (product.stock > 0) continue;
      await tx.product.update({
        where: { id: product.id },
        data: { stock: 0, pieceStatus: "SOLD", soldOrderId: orderId },
      });
    }
  });
}

async function restoreSold(orderId: string) {
  const items = await prisma.orderItem.findMany({ where: { orderId } });
  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product) continue;
    const next = product.isUnique ? Math.min(1, product.stock + item.quantity) : product.stock + item.quantity;
    await prisma.product.update({
      where: { id: product.id },
      data: {
        stock: next,
        pieceStatus: next > 0 ? "AVAILABLE" : "SOLD",
        soldOrderId: product.soldOrderId === orderId ? null : product.soldOrderId,
      },
    });
  }
  await prisma.couponRedemption.deleteMany({ where: { orderId } });
}

export async function confirmOrder(orderId: string, paymentStatus: "PAID" | "SIMULATED") {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true, coupon: true, store: true } });
  if (!order || order.status === "CANCELLED") return null;
  if (order.status !== "PENDING") return order;
  try {
    await takeStock(order.id);
  } catch {
    await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED", paymentStatus: "FAILED" } });
    await notifyStatus(order.id, "CANCELLED", "No pudimos completarlo porque ya no había piezas disponibles.");
    return null;
  }
  const saved = await prisma.order.update({
    where: { id: order.id },
    data: { status: "CONFIRMED", paymentStatus },
  });
  if (order.couponId && order.discount > 0) {
    await prisma.couponRedemption.create({
      data: {
        couponId: order.couponId,
        orderId: order.id,
        userId: order.userId,
        storeId: order.storeId,
        discountAmount: order.discount,
      },
    });
  }
  await notifyOrder(saved.id);
  return saved;
}

export async function placeOrder(
  storeSlug: string,
  input: {
    customerId?: string | null;
    customerName: string;
    customerEmail: string;
    phone: string;
    address: string;
    city: string;
    couponCode?: string;
    isGift?: boolean;
    giftRecipientName?: string;
    giftRecipientPhone?: string;
    giftRecipientAddress?: string;
    giftNote?: string;
    items: { productId: string; quantity: number; size: string; color: string; name: string; price: number }[];
  },
) {
  const store = await storeBySlug(storeSlug);
  if (!store) return { error: "Tienda no disponible." };
  if (!input.customerName?.trim() || !input.customerEmail?.trim() || !input.phone?.trim() || !input.address?.trim() || !input.city?.trim()) {
    return { error: "Completa nombre, correo, teléfono, dirección y ciudad." };
  }
  if (input.isGift && (!input.giftRecipientName?.trim() || !input.giftRecipientPhone?.trim() || !input.giftRecipientAddress?.trim())) {
    return { error: "Para un regalo indica nombre, teléfono y dirección de quien lo recibe." };
  }
  if (!input.items.length) return { error: "El carrito está vacío." };
  const wanted = new Map<string, { quantity: number; name: string }>();
  for (const item of input.items) {
    const quantity = Math.floor(Number(item.quantity) || 0);
    if (quantity < 1) return { error: "La cantidad tiene que ser al menos 1." };
    const current = wanted.get(item.productId);
    wanted.set(item.productId, { quantity: (current?.quantity ?? 0) + quantity, name: item.name });
  }
  const lines: { product: Awaited<ReturnType<typeof prisma.product.findFirst>>; quantity: number }[] = [];
  for (const [productId, request] of wanted) {
    const product = await prisma.product.findFirst({
      where: { id: productId, storeId: store.id, isActive: true, stock: { gte: request.quantity } },
    });
    if (!product) return { error: `${request.name} ya no tiene esas unidades.` };
    if (product.isUnique && request.quantity !== 1) return { error: `${product.name} es una pieza única.` };
    lines.push({ product, quantity: request.quantity });
  }
  const subtotal = lines.reduce((total, line) => total + line.product!.price * line.quantity, 0);
  const quoted = await quoteOrder(
    storeSlug,
    subtotal,
    input.couponCode,
    input.customerEmail,
    lines.map(({ product, quantity }) => ({ productId: product!.id, quantity })),
  );
  if (input.couponCode?.trim() && quoted.reason && quoted.discount <= 0) return { error: quoted.reason };
  const year = new Date().getFullYear();
  const sequence = (await prisma.order.count({ where: { orderNumber: { startsWith: `ORD-${year}-` } } })) + 1;
  const useStripe = Boolean(process.env.STRIPE_SECRET_KEY);
  const order = await prisma.order.create({
    data: {
      storeId: store.id,
      userId: input.customerId,
      orderNumber: `ORD-${year}-${String(sequence).padStart(3, "0")}`,
      status: "PENDING",
      customerName: input.customerName.trim(),
      customerEmail: input.customerEmail.trim().toLowerCase(),
      phone: input.phone.trim(),
      address: input.address.trim(),
      city: input.city.trim(),
      isGift: Boolean(input.isGift),
      giftRecipientName: input.giftRecipientName?.trim() || null,
      giftRecipientPhone: input.giftRecipientPhone?.trim() || null,
      giftRecipientAddress: input.giftRecipientAddress?.trim() || null,
      giftNote: input.giftNote?.trim() || null,
      subtotal,
      discount: quoted.discount,
      shipping: quoted.shipping,
      total: quoted.total,
      couponId: quoted.coupon?.id,
      couponCode: quoted.couponCode,
      paymentStatus: "PENDING",
      items: {
        create: lines.map(({ product, quantity }) => ({
          productId: product!.id,
          name: product!.name,
          price: product!.price,
          quantity,
          size: product!.size,
          color: product!.colorName,
          total: product!.price * quantity,
        })),
      },
    },
    include: { items: true },
  });
  if (!useStripe) {
    await confirmOrder(order.id, "SIMULATED");
    const confirmed = await prisma.order.findUnique({ where: { id: order.id }, include: { items: true } });
    return { order: toOrder(confirmed!) };
  }
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(order.total * 100),
    currency: "mxn",
    receipt_email: order.customerEmail,
    description: `Pedido ${order.orderNumber}`,
    automatic_payment_methods: { enabled: true },
    metadata: { orderId: order.id, storeSlug, orderNumber: order.orderNumber },
    shipping: {
      name: order.isGift ? order.giftRecipientName || order.customerName : order.customerName,
      phone: order.isGift ? order.giftRecipientPhone || order.phone : order.phone,
      address: { line1: order.address.slice(0, 200), city: order.city, country: "MX" },
    },
  });
  if (!paymentIntent.client_secret) return { error: "No se pudo preparar el pago." };
  await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: paymentIntent.id } });
  await notifyStatus(order.id, "PENDING");
  return { order: toOrder(order), clientSecret: paymentIntent.client_secret };
}

export async function confirmStripePayment(storeSlug: string, paymentId: string) {
  if (!process.env.STRIPE_SECRET_KEY || !paymentId) return null;
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  if (paymentId.startsWith("cs_")) {
    const session = await stripe.checkout.sessions.retrieve(paymentId);
    if (session.payment_status !== "paid" || session.metadata?.storeSlug !== storeSlug) return null;
    const orderId = session.metadata?.orderId;
    if (!orderId) return null;
    await confirmOrder(orderId, "PAID");
    return prisma.order.findUnique({ where: { id: orderId } });
  }
  const intent = await stripe.paymentIntents.retrieve(paymentId);
  if (intent.status !== "succeeded" || intent.metadata?.storeSlug !== storeSlug) return null;
  const orderId = intent.metadata?.orderId;
  if (!orderId) return null;
  const order = await prisma.order.findFirst({ where: { id: orderId, store: { slug: storeSlug } } });
  if (!order || Math.round(order.total * 100) !== intent.amount) return null;
  await confirmOrder(orderId, "PAID");
  return prisma.order.findUnique({ where: { id: orderId } });
}

export async function setOrderStatus(id: string, status: OrderStatus) {
  const store = await selectedStore();
  if (!statusFlow.includes(status)) return null;
  const order = await prisma.order.findFirst({ where: { id, storeId: store.id } });
  if (!order || order.status === status) return order ? toOrder({ ...order, items: [] }) : null;
  const previous = order.status;
  if (status === "CONFIRMED" && previous === "PENDING") {
    const confirmed = await confirmOrder(order.id, order.paymentStatus === "PAID" ? "PAID" : "SIMULATED");
    if (!confirmed) return null;
  } else if (status === "CANCELLED") {
    if (previous !== "PENDING") await restoreSold(order.id);
    await prisma.order.update({ where: { id }, data: { status: "CANCELLED" } });
    await notifyStatus(order.id, "CANCELLED");
  } else {
    await prisma.order.update({ where: { id }, data: { status } });
    await notifyStatus(order.id, status);
  }
  const saved = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  return saved ? toOrder(saved) : null;
}

function publicUser(user: { id: string; email: string; name: string; lastName: string; phone: string | null; status: string }) {
  return { id: user.id, email: user.email, name: user.name, lastName: user.lastName, phone: user.phone ?? "", status: user.status };
}

async function issueSession(userId: string) {
  const token = randomUUID();
  await prisma.session.create({ data: { token, userId } });
  return token;
}

export async function subscribeEmail(storeSlug: string, email: string, source: "boletin" | "registro") {
  const store = await storeBySlug(storeSlug);
  const normalized = email.trim().toLowerCase();
  if (!store) return { error: "Tienda no disponible." };
  if (!normalized.includes("@")) return { error: "Escribe un correo válido." };
  const subscriber = await prisma.subscriber.upsert({
    where: { storeId_email: { storeId: store.id, email: normalized } },
    update: {},
    create: { storeId: store.id, email: normalized, source },
  });
  if (source === "boletin") await deliver(store.slug, normalized, newsletterWelcomeMail());
  return { subscriber };
}

export async function newsletterDesk() {
  const store = await selectedStore();
  const now = new Date();
  const [subscribers, bulletins, coupons] = await Promise.all([
    prisma.subscriber.findMany({ where: { storeId: store.id }, orderBy: { createdAt: "desc" } }),
    prisma.bulletin.findMany({ where: { storeId: store.id }, orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.coupon.findMany({
      where: {
        storeId: store.id,
        isActive: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true, type: true, value: true, usageLimit: true, _count: { select: { redemptions: true } } },
    }),
  ]);
  return {
    store,
    subscribers,
    bulletins,
    coupons: coupons.filter((coupon) => coupon.usageLimit == null || coupon._count.redemptions < coupon.usageLimit),
  };
}

type BulletinInput = { kind?: string; subject?: string; body?: string; couponCode?: string; subscriberIds?: string[] };

async function composeBulletin(input: BulletinInput) {
  const store = await selectedStore();
  const kind = input.kind === "CUPON" || input.kind === "DESCUENTO" ? input.kind : "NOVEDAD";
  const subject = (input.subject ?? "").trim();
  const message = (input.body ?? "").trim();
  if (!subject || message.length < 5) return { error: "Escribe el asunto y el mensaje del boletín." };
  let couponCode = "";
  if (kind !== "NOVEDAD" && input.couponCode?.trim()) {
    const coupon = await prisma.coupon.findFirst({
      where: { storeId: store.id, code: input.couponCode.trim().toUpperCase(), isActive: true },
    });
    if (!coupon) return { error: "Elige un cupón que ya exista en esta tienda." };
    couponCode = coupon.code;
  }
  if (kind === "CUPON" && !couponCode) return { error: "Elige un cupón de la tienda." };
  const branded = bulletinMail({ kind, subject, body: message, couponCode });
  const text = store.slug === "distinto" ? branded.text : `${message}${couponCode ? `\nCupón: ${couponCode}` : ""}\n\n${store.name}`;
  const html = store.slug === "distinto" ? branded.html : text;
  return { store, kind, subject, body: message, couponCode, text, html };
}

export async function previewBulletin(input: BulletinInput) {
  const ready = await composeBulletin(input);
  if ("error" in ready) return ready;
  const html = ready.store.slug === "distinto" ? bulletinPreviewHtml(ready.html) : `<div style="font-family:Arial,sans-serif;white-space:pre-wrap;padding:24px;">${ready.text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</div>`;
  return { html, subject: ready.subject };
}

export async function sendBulletin(input: BulletinInput) {
  const ready = await composeBulletin(input);
  if ("error" in ready) return ready;
  const ids = [...new Set((input.subscriberIds ?? []).filter(Boolean))];
  if (!ids.length) return { error: "Elige al menos un suscrito." };
  const subscribers = await prisma.subscriber.findMany({ where: { storeId: ready.store.id, id: { in: ids } } });
  if (!subscribers.length) return { error: "Esos correos ya no están suscritos." };
  for (const subscriber of subscribers) {
    await deliver(ready.store.slug, subscriber.email, { subject: ready.subject, text: ready.text, html: ready.html });
  }
  const bulletin = await prisma.bulletin.create({
    data: {
      storeId: ready.store.id,
      kind: ready.kind,
      subject: ready.subject,
      body: ready.body,
      couponCode: ready.couponCode,
      recipientCount: subscribers.length,
    },
  });
  return { bulletin, recipients: subscribers.length };
}

export async function removeSubscribers(ids: string[]) {
  const store = await selectedStore();
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return { error: "Elige al menos un suscrito." };
  const result = await prisma.subscriber.deleteMany({ where: { storeId: store.id, id: { in: unique } } });
  return { removed: result.count };
}

export async function receiveContact(storeSlug: string, email: string, message: string) {
  const store = await storeBySlug(storeSlug);
  const normalized = email.trim().toLowerCase();
  const text = message.trim();
  if (!store) return { error: "Tienda no disponible." };
  if (!normalized.includes("@")) return { error: "Escribe un correo válido." };
  if (text.length < 5) return { error: "Escribe tu mensaje o duda." };
  await deliver(store.slug, normalized, contactCopyMail(text));
  await deliver(store.slug, process.env.CONTACT_EMAIL ?? "hola@distinto.mx", contactStoreMail(normalized, text, store.name));
  return { ok: true };
}

export async function registerCustomer(input: { email: string; password: string; name: string; lastName: string; newsletter?: boolean }, storeSlug = "distinto") {
  await readyDb();
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) return { error: "Escribe un correo válido." };
  if (input.password.length < 6) return { error: "La contraseña necesita al menos 6 caracteres." };
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.status === "ACTIVE") return { error: "Ese correo ya tiene cuenta. Inicia sesión." };
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user =
    existing ??
    (await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: input.name.trim() || "Cliente",
        lastName: input.lastName.trim(),
        role: "CUSTOMER",
        status: "PENDING",
      },
    }));
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, name: input.name.trim() || existing.name, lastName: input.lastName.trim(), status: "PENDING" },
    });
  }
  const code = verificationCode();
  await prisma.authToken.updateMany({ where: { email, purpose: "VERIFY_EMAIL", usedAt: null }, data: { usedAt: new Date() } });
  await prisma.authToken.create({
    data: { userId: user.id, email, purpose: "VERIFY_EMAIL", codeHash: hashCode(code), expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
  });
  await deliver(storeSlug, email, verificationMail(code));
  if (input.newsletter) await subscribeEmail(storeSlug, email, "registro");
  return { pending: true };
}

export async function verifyCustomer(email: string, code: string) {
  await readyDb();
  const normalized = email.trim().toLowerCase();
  const token = await prisma.authToken.findFirst({
    where: { email: normalized, purpose: "VERIFY_EMAIL", usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!token || token.codeHash !== hashCode(code.trim())) return { error: "Código incorrecto o vencido." };
  const user = await prisma.user.update({ where: { email: normalized }, data: { status: "ACTIVE" } });
  await prisma.authToken.update({ where: { id: token.id }, data: { usedAt: new Date() } });
  return { token: await issueSession(user.id), customer: publicUser(user) };
}

export async function loginCustomer(email: string, password: string) {
  await readyDb();
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || user.role !== "CUSTOMER" || user.status !== "ACTIVE" || !user.passwordHash) return null;
  if (!(await bcrypt.compare(password, user.passwordHash))) return null;
  return { token: await issueSession(user.id), customer: publicUser(user) };
}

export async function loginGoogle(profile: { googleId: string; email: string; name: string }) {
  await readyDb();
  const email = profile.email.trim().toLowerCase();
  if (!email.includes("@") || !profile.googleId) return null;
  const existing = await prisma.user.findUnique({ where: { email } });
  const user = existing
    ? await prisma.user.update({ where: { id: existing.id }, data: { googleId: profile.googleId, status: "ACTIVE", name: existing.name || profile.name } })
    : await prisma.user.create({
        data: { email, name: profile.name || "Cliente", googleId: profile.googleId, role: "CUSTOMER", status: "ACTIVE" },
      });
  return { token: await issueSession(user.id), customer: publicUser(user) };
}

export async function requestPasswordReset(email: string) {
  await readyDb();
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (user && user.role === "CUSTOMER") {
    const token = resetToken();
    await prisma.authToken.updateMany({ where: { email: normalized, purpose: "RESET_PASSWORD", usedAt: null }, data: { usedAt: new Date() } });
    await prisma.authToken.create({
      data: {
        userId: user.id,
        email: normalized,
        purpose: "RESET_PASSWORD",
        codeHash: hashCode(token),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });
    const origin = process.env.STORE_PUBLIC_URL ?? "http://localhost:3000";
    await deliver("distinto", normalized, resetMail(`${origin}/login/restablecer?token=${token}`));
  }
  return { ok: true };
}

export async function resetPassword(token: string, password: string) {
  await readyDb();
  if (password.length < 6) return { error: "La contraseña necesita al menos 6 caracteres." };
  const row = await prisma.authToken.findFirst({
    where: { purpose: "RESET_PASSWORD", codeHash: hashCode(token), usedAt: null, expiresAt: { gt: new Date() } },
  });
  if (!row) return { error: "El enlace no es válido o ya venció." };
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.update({ where: { email: row.email }, data: { passwordHash, status: "ACTIVE" } });
  await prisma.authToken.update({ where: { id: row.id }, data: { usedAt: new Date() } });
  await deliver("distinto", user.email, passwordChangedMail());
  return { ok: true };
}

export async function customerFromToken(token: string) {
  await readyDb();
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { token }, include: { user: true } });
  if (!session || session.user.status !== "ACTIVE") return null;
  return publicUser(session.user);
}

export async function updateCustomer(token: string, input: { name?: string; lastName?: string; phone?: string; password?: string }) {
  const current = await customerFromToken(token);
  if (!current) return { error: "Sesión no válida." };
  const data: Prisma.UserUpdateInput = {};
  if (input.name !== undefined) data.name = input.name.trim() || current.name;
  if (input.lastName !== undefined) data.lastName = input.lastName.trim();
  if (input.phone !== undefined) data.phone = input.phone.trim();
  if (input.password && input.password.length >= 6) data.passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.update({ where: { id: current.id }, data });
  return { customer: publicUser(user) };
}

export async function listAddresses(token: string) {
  const customer = await customerFromToken(token);
  if (!customer) return null;
  return prisma.address.findMany({
    where: { userId: customer.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export type AddressInput = {
  id?: string;
  label?: string;
  name?: string;
  phone?: string;
  zipCode?: string;
  street?: string;
  exteriorNumber?: string;
  interiorNumber?: string;
  neighborhood?: string;
  municipality?: string;
  state?: string;
  references?: string;
  isDefault?: boolean;
  accepted?: boolean;
};

function clean(value?: string) {
  return (value ?? "").trim();
}

export async function saveAddress(token: string, input: AddressInput) {
  const customer = await customerFromToken(token);
  if (!customer) return { error: "Sesión no válida." };
  if (!input.accepted) return { error: "Acepta el resumen de la dirección antes de guardarla." };
  const zipCode = clean(input.zipCode);
  const street = clean(input.street);
  const exteriorNumber = clean(input.exteriorNumber);
  const interiorNumber = clean(input.interiorNumber);
  const neighborhood = clean(input.neighborhood);
  const municipality = clean(input.municipality);
  const state = clean(input.state);
  const references = clean(input.references);
  const phone = clean(input.phone).replace(/\s+/g, " ");
  const name = clean(input.name);
  if (!/^\d{5}$/.test(zipCode)) return { error: "El código postal tiene 5 dígitos." };
  if (!street || !exteriorNumber || !neighborhood || !municipality || !state) {
    return { error: "Completa calle, número exterior, colonia, municipio y estado." };
  }
  if (phone.replace(/\D/g, "").length < 10) return { error: "Escribe un teléfono de 10 dígitos para esta entrega." };
  const others = await prisma.address.count({
    where: { userId: customer.id, ...(input.id ? { NOT: { id: input.id } } : {}) },
  });
  let isDefault = Boolean(input.isDefault) || others === 0;
  if (!isDefault) {
    const primary = await prisma.address.count({
      where: { userId: customer.id, isDefault: true, ...(input.id ? { NOT: { id: input.id } } : {}) },
    });
    if (!primary) isDefault = true;
  }
  if (isDefault) await prisma.address.updateMany({ where: { userId: customer.id }, data: { isDefault: false } });
  const interior = interiorNumber ? ` int. ${interiorNumber}` : "";
  const reference = references ? `. Ref. ${references}` : "";
  const receiver = name ? `. Recibe: ${name}` : "";
  const line = `${street} ${exteriorNumber}${interior}, ${neighborhood}, C.P. ${zipCode}${reference}${receiver}`;
  const data = {
    label: clean(input.label) || "Casa",
    name,
    phone,
    street,
    exteriorNumber,
    interiorNumber,
    neighborhood,
    municipality,
    references,
    line,
    city: municipality,
    state,
    zipCode,
    isDefault,
    confirmedAt: new Date(),
  };
  if (input.id) {
    const current = await prisma.address.findFirst({ where: { id: input.id, userId: customer.id } });
    if (!current) return { error: "No encontramos la dirección." };
    return { address: await prisma.address.update({ where: { id: input.id }, data }) };
  }
  return { address: await prisma.address.create({ data: { ...data, userId: customer.id } }) };
}

export async function removeAddress(token: string, id: string) {
  const customer = await customerFromToken(token);
  if (!customer) return false;
  await prisma.address.deleteMany({ where: { id, userId: customer.id } });
  return true;
}

function mediaUrl(value: string) {
  if (!value.startsWith("/uploads/")) return value;
  const origin = (process.env.ASSET_PUBLIC_URL || process.env.ADMIN_PUBLIC_URL || "http://localhost:3001").replace(/\/$/, "");
  return `${origin}${value}`;
}

export async function ordersForToken(storeSlug: string, token: string) {
  const customer = await customerFromToken(token);
  const store = await storeBySlug(storeSlug);
  if (!customer || !store) return null;
  const orders = await prisma.order.findMany({
    where: {
      storeId: store.id,
      OR: [{ userId: customer.id }, { customerEmail: customer.email.toLowerCase() }],
    },
    include: { items: true, experience: { include: { photos: true } } },
    orderBy: { createdAt: "desc" },
  });
  return orders.map((order) => ({
    ...toOrder(order),
    experience: order.experience
      ? {
          rating: order.experience.rating,
          body: order.experience.body,
          status: order.experience.status,
          photos: order.experience.photos.map((photo) => mediaUrl(photo.url)),
        }
      : null,
  }));
}

async function deliveredOrderFor(storeSlug: string, token: string, orderId: string) {
  const customer = await customerFromToken(token);
  const store = await storeBySlug(storeSlug);
  if (!customer || !store) return { error: "Sesión no válida." as const };
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      storeId: store.id,
      status: "DELIVERED",
      OR: [{ userId: customer.id }, { customerEmail: customer.email.toLowerCase() }],
    },
    include: { experience: true },
  });
  if (!order) return { error: "Ese pedido no está entregado." as const };
  if (order.experience) return { error: "Ya compartiste la experiencia de este pedido." as const };
  return { order };
}

const experiencePhoto = /^\/uploads\/exp-\d+-[a-f0-9]{8}\.(jpg|png|webp)$/;

export async function assertExperienceUpload(storeSlug: string, token: string, orderId: string) {
  return deliveredOrderFor(storeSlug, token, orderId);
}

export async function saveExperience(
  storeSlug: string,
  token: string,
  orderId: string,
  input: { rating?: number; body?: string; photos?: string[] },
) {
  const owned = await deliveredOrderFor(storeSlug, token, orderId);
  if ("error" in owned) return owned;
  const rating = Number(input.rating);
  const body = (input.body ?? "").trim();
  const photos = [...new Set((input.photos ?? []).filter((url) => experiencePhoto.test(url)))].slice(0, 3);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: "Elige de 1 a 5 estrellas." };
  if (!body) return { error: "Escribe tu experiencia." };
  if (body.length > 400) return { error: "La experiencia puede tener hasta 400 caracteres." };
  const name = owned.order.customerName.trim().split(/\s+/)[0] || "Cliente";
  await prisma.experience.create({
    data: {
      storeId: owned.order.storeId,
      orderId: owned.order.id,
      customerName: name,
      rating,
      body,
      photos: { create: photos.map((url) => ({ url })) },
    },
  });
  return { ok: true as const };
}

export async function publicExperiences(
  storeSlug: string,
  filter: { productId?: string; categorySlug?: string; take?: number } = {},
) {
  const store = await storeBySlug(storeSlug);
  if (!store) return [];
  const take = Math.min(Math.max(filter.take ?? 6, 1), 12);
  const rows = await prisma.experience.findMany({
    where: {
      storeId: store.id,
      status: "APPROVED",
      ...(filter.productId ? { order: { items: { some: { productId: filter.productId } } } } : {}),
      ...(filter.categorySlug
        ? { order: { items: { some: { product: { category: { slug: filter.categorySlug } } } } } }
        : {}),
    },
    include: {
      photos: true,
      order: {
        include: {
          items: { include: { product: { select: { slug: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
  return rows.map((row) => {
    const seen = new Set<string>();
    const products: { name: string; slug: string }[] = [];
    for (const item of row.order.items) {
      if (seen.has(item.product.slug)) continue;
      seen.add(item.product.slug);
      products.push({ name: item.name, slug: item.product.slug });
    }
    return {
      id: row.id,
      name: row.customerName,
      rating: row.rating,
      body: row.body,
      photos: row.photos.filter((photo) => photo.status === "APPROVED").map((photo) => mediaUrl(photo.url)),
      products,
    };
  });
}

export async function panelExperiences() {
  const store = await selectedStore();
  const rows = await prisma.experience.findMany({
    where: { storeId: store.id },
    include: {
      photos: true,
      order: { select: { orderNumber: true, items: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  const rank = { PENDING: 0, APPROVED: 1, DECLINED: 2 };
  return rows
    .map((row) => ({
      id: row.id,
      name: row.customerName,
      rating: row.rating,
      body: row.body,
      status: row.status,
      orderNumber: row.order.orderNumber,
      products: [...new Set(row.order.items.map((item) => item.name))],
      createdAt: row.createdAt.toISOString(),
      photos: row.photos.map((photo) => ({ id: photo.id, url: photo.url, status: photo.status })),
    }))
    .sort((a, b) => rank[a.status] - rank[b.status] || b.createdAt.localeCompare(a.createdAt));
}

export async function reviewExperience(id: string, status: "APPROVED" | "DECLINED") {
  const store = await selectedStore();
  const current = await prisma.experience.findFirst({ where: { id, storeId: store.id } });
  if (!current) return null;
  await prisma.experience.update({ where: { id }, data: { status } });
  if (status === "APPROVED") {
    await prisma.experiencePhoto.updateMany({
      where: { experienceId: id, status: { not: "DECLINED" } },
      data: { status: "APPROVED" },
    });
  }
  return { ok: true as const };
}

export async function reviewExperiencePhoto(id: string, status: "APPROVED" | "DECLINED") {
  const store = await selectedStore();
  const photo = await prisma.experiencePhoto.findFirst({ where: { id, experience: { storeId: store.id } } });
  if (!photo) return null;
  await prisma.experiencePhoto.update({ where: { id }, data: { status } });
  return { ok: true as const };
}

export { slugify };
