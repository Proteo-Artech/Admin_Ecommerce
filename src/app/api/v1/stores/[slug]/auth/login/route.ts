import { loginCustomer } from "@/lib/platform";

type Context = { params: Promise<{ slug: string }> };

export async function POST(request: Request, _context: Context) {
  const body = (await request.json()) as { email?: string; password?: string };
  const result = await loginCustomer(body.email ?? "", body.password ?? "");
  if (!result) return Response.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
  return Response.json(result);
}
