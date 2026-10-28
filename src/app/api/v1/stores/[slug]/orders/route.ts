import { customerFromToken, ordersForToken, placeOrder } from "@/lib/platform";

type Context = { params: Promise<{ slug: string }> };

function tokenOf(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

export async function GET(request: Request, context: Context) {
  const { slug } = await context.params;
  const orders = await ordersForToken(slug, tokenOf(request));
  if (!orders) return Response.json({ error: "Sesión no válida." }, { status: 401 });
  return Response.json({ orders });
}

export async function POST(request: Request, context: Context) {
  const { slug } = await context.params;
  const body = (await request.json()) as Parameters<typeof placeOrder>[1];
  if (!body.customerName?.trim() || !body.customerEmail?.trim() || !body.phone?.trim() || !body.address?.trim() || !body.city?.trim()) {
    return Response.json({ error: "Completa nombre, correo, teléfono, dirección y ciudad." }, { status: 400 });
  }
  const customer = await customerFromToken(tokenOf(request));
  const result = await placeOrder(slug, { ...body, customerId: customer?.id ?? null });
  if ("error" in result) return Response.json(result, { status: 400 });
  return Response.json(result);
}
