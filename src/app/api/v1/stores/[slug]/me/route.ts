import { customerFromToken, updateCustomer } from "@/lib/platform";

type Context = { params: Promise<{ slug: string }> };

function tokenOf(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

export async function GET(request: Request, _context: Context) {
  const customer = await customerFromToken(tokenOf(request));
  if (!customer) return Response.json({ error: "Sesión no válida." }, { status: 401 });
  return Response.json({ customer });
}

export async function PUT(request: Request, _context: Context) {
  const body = (await request.json()) as { name?: string; lastName?: string; phone?: string; password?: string };
  const result = await updateCustomer(tokenOf(request), body);
  if ("error" in result) return Response.json(result, { status: 400 });
  return Response.json(result);
}
