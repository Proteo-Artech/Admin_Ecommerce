import { removeProduct, requireRole, saveProduct } from "@/lib/platform";
import type { Product } from "@/data/catalog";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  const user = await requireRole(["ADMIN", "MODERATOR"]);
  if (!user) return Response.json({ error: "No autorizado." }, { status: 401 });
  const { id } = await context.params;
  const body = (await request.json()) as Partial<Product>;
  if (!body.images?.length) return Response.json({ error: "El producto necesita al menos una imagen." }, { status: 400 });
  const product = await saveProduct(body, id);
  if (!product) return Response.json({ error: "No encontramos el producto en esta tienda." }, { status: 404 });
  return Response.json({ product });
}

export async function DELETE(_request: Request, context: Context) {
  const user = await requireRole(["ADMIN", "MODERATOR"]);
  if (!user) return Response.json({ error: "No autorizado." }, { status: 401 });
  const { id } = await context.params;
  return Response.json({ mode: await removeProduct(id) });
}
