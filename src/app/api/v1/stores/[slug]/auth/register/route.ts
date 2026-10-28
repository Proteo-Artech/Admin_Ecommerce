import { registerCustomer } from "@/lib/platform";

type Context = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: Context) {
  const { slug } = await context.params;
  const body = (await request.json()) as { email?: string; password?: string; name?: string; lastName?: string; newsletter?: boolean };
  const result = await registerCustomer({
    email: body.email ?? "",
    password: body.password ?? "",
    name: body.name ?? "",
    lastName: body.lastName ?? "",
    newsletter: Boolean(body.newsletter),
  }, slug);
  if ("error" in result) return Response.json(result, { status: 400 });
  return Response.json(result);
}
