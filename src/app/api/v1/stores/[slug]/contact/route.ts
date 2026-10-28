import { receiveContact } from "@/lib/platform";

type Context = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: Context) {
  const { slug } = await context.params;
  const body = (await request.json()) as { email?: string; message?: string };
  const result = await receiveContact(slug, body.email ?? "", body.message ?? "");
  if ("error" in result) return Response.json(result, { status: 400 });
  return Response.json(result);
}
