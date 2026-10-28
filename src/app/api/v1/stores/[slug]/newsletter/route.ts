import { subscribeEmail } from "@/lib/platform";

type Context = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: Context) {
  const { slug } = await context.params;
  const body = (await request.json()) as { email?: string };
  const result = await subscribeEmail(slug, body.email ?? "", "boletin");
  if ("error" in result) return Response.json(result, { status: 400 });
  return Response.json({ ok: true });
}
