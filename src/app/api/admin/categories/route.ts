import { requireRole, saveSubcategories } from "@/lib/platform";
import type { CategorySlug } from "@/data/catalog";

export async function PUT(request: Request) {
  const user = await requireRole(["ADMIN"]);
  if (!user) return Response.json({ error: "Solo el administrador edita categorías." }, { status: 403 });
  const body = (await request.json()) as { slug?: CategorySlug; subcategories?: string[] };
  if (!body.slug || !body.subcategories) return Response.json({ error: "Datos incompletos." }, { status: 400 });
  await saveSubcategories(body.slug, body.subcategories);
  return Response.json({ ok: true });
}
