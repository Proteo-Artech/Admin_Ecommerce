import { resetPassword } from "@/lib/platform";

export async function POST(request: Request) {
  const body = (await request.json()) as { token?: string; password?: string };
  const result = await resetPassword(body.token ?? "", body.password ?? "");
  if ("error" in result) return Response.json(result, { status: 400 });
  return Response.json(result);
}
