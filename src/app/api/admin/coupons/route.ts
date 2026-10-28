import { requireRole, saveCoupon, type Coupon } from "@/lib/platform";

export async function POST(request: Request) {
  const user = await requireRole(["ADMIN", "MODERATOR"]);
  if (!user) return Response.json({ error: "No autorizado." }, { status: 401 });
  const body = (await request.json()) as Partial<Coupon> & { id?: string };
  if (!body.code?.trim()) return Response.json({ error: "Escribe el código." }, { status: 400 });
  const result = await saveCoupon(body, body.id);
  if ("error" in result) return Response.json(result, { status: 400 });
  return Response.json({ coupon: result });
}
