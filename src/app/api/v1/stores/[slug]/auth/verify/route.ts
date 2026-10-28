import { verifyCustomer } from "@/lib/platform";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; code?: string };
  const result = await verifyCustomer(body.email ?? "", body.code ?? "");
  if ("error" in result) return Response.json(result, { status: 400 });
  return Response.json(result);
}
