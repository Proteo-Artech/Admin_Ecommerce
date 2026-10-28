import { productFor } from "@/lib/platform";
import { mediaUrl } from "@/lib/media";

type Context = { params: Promise<{ slug: string; productSlug: string }> };

export async function GET(_request: Request, context: Context) {
  const { slug, productSlug } = await context.params;
  const product = await productFor(slug, productSlug);
  if (!product) return Response.json({ error: "Producto no encontrado." }, { status: 404 });
  return Response.json({ product: { ...product, images: product.images.map(mediaUrl) } });
}
