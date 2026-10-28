import { confirmStripePayment } from "@/lib/platform";

type Context = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: Context) {
  const { slug } = await context.params;
  const body = (await request.json()) as { sessionId?: string; paymentIntentId?: string };
  const order = await confirmStripePayment(slug, body.paymentIntentId || body.sessionId || "");
  if (!order) return Response.json({ error: "El pago todavía no está confirmado." }, { status: 400 });
  return Response.json({ orderNumber: order.orderNumber, status: order.status });
}
