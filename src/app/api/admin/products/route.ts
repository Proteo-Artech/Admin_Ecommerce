import { requireRole, saveProduct } from "@/lib/platform";
import type { Product } from "@/data/catalog";

export async function POST(request: Request) {
  const user = await requireRole(["ADMIN", "MODERATOR"]);
  if (!user) return Response.json({ error: "No autorizado." }, { status: 401 });
  const body = (await request.json()) as Partial<Product>;
  if (!body.images?.length) return Response.json({ error: "Sube al menos una imagen." }, { status: 400 });
  const product = await saveProduct(body);
  if (!product) return Response.json({ error: "No se pudo guardar." }, { status: 400 });
  return Response.json({ product });
}
