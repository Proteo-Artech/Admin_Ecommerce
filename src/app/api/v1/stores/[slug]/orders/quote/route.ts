import { quoteOrder } from "@/lib/platform";

type Context = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: Context) {
  const { slug } = await context.params;
  const body = (await request.json()) as {
    subtotal?: number;
    couponCode?: string;
    email?: string;
    items?: { productId?: string; quantity?: number }[];
  };
  const subtotal = Math.max(0, Number(body.subtotal) || 0);
  const items = (body.items ?? [])
    .filter((item) => item.productId)
    .map((item) => ({ productId: item.productId!, quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)) }));
  const quote = await quoteOrder(slug, subtotal, body.couponCode, body.email, items);
  return Response.json({
    discount: quote.discount,
    shipping: quote.shipping,
    total: quote.total,
    couponCode: quote.couponCode,
    reason: quote.reason,
  });
}
