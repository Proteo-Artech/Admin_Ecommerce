import { requireRole, setOrderStatus, type OrderStatus } from "@/lib/platform";

export async function PATCH(request: Request) {
  const user = await requireRole(["ADMIN", "MODERATOR"]);
  if (!user) return Response.json({ error: "No autorizado." }, { status: 401 });
  const body = (await request.json()) as { id?: string; status?: OrderStatus };
  if (!body.id || !body.status) return Response.json({ error: "Datos incompletos." }, { status: 400 });
  const order = await setOrderStatus(body.id, body.status);
  if (!order) return Response.json({ error: "No encontramos el pedido." }, { status: 404 });
  return Response.json({ order });
}
