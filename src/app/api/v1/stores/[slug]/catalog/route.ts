import { catalogFor } from "@/lib/platform";

type Context = { params: Promise<{ slug: string }> };

function originOf(request: Request) {
  const configured = (process.env.ASSET_PUBLIC_URL || process.env.ADMIN_PUBLIC_URL)?.replace(/\/$/, "");
  if (configured) return configured;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost:3001";
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

function absolute(value: string, origin: string) {
  if (!value.startsWith("/uploads/")) return value;
  return `${origin}${value}`;
}

export async function GET(request: Request, context: Context) {
  const { slug } = await context.params;
  const catalog = await catalogFor(slug);
  if (!catalog) return Response.json({ error: "Tienda no encontrada." }, { status: 404 });
  const origin = originOf(request);
  return Response.json({
    store: catalog.store,
    categories: catalog.categories.map((category) => ({ ...category, image: absolute(category.image, origin) })),
    products: catalog.products.map((product) => ({
      ...product,
      images: product.images.map((image) => absolute(image, origin)),
    })),
  });
}
