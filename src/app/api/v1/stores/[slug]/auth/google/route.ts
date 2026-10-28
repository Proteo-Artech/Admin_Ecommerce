import { loginGoogle } from "@/lib/platform";

export async function POST(request: Request) {
  const body = (await request.json()) as { googleId?: string; email?: string; name?: string };
  const result = await loginGoogle({ googleId: body.googleId ?? "", email: body.email ?? "", name: body.name ?? "" });
  if (!result) return Response.json({ error: "No se pudo entrar con Google." }, { status: 400 });
  return Response.json(result);
}
