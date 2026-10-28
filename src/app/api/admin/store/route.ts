import { renameStore, requireRole, selectStore } from "@/lib/platform";

export async function POST(request: Request) {
  const user = await requireRole(["ADMIN", "MODERATOR"]);
  if (!user) return Response.json({ error: "No autorizado." }, { status: 401 });
  const body = (await request.json()) as { slug?: string };
  const store = await selectStore(body.slug ?? "");
  if (!store) return Response.json({ error: "Tienda no encontrada." }, { status: 404 });
  return Response.json({ store });
}

export async function PATCH(request: Request) {
  const user = await requireRole(["ADMIN"]);
  if (!user) return Response.json({ error: "Solo el administrador edita tiendas." }, { status: 403 });
  const body = (await request.json()) as { slug?: string; name?: string };
  if (!body.slug || !body.name?.trim()) return Response.json({ error: "Datos incompletos." }, { status: 400 });
  const store = await renameStore(body.slug, body.name);
  if (!store) return Response.json({ error: "Tienda no encontrada." }, { status: 404 });
  return Response.json({ store });
}
