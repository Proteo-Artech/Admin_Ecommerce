import { removeAddress, saveAddress, type AddressInput } from "@/lib/platform";

type Context = { params: Promise<{ slug: string; id: string }> };

function tokenOf(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

export async function PUT(request: Request, context: Context) {
  const { id } = await context.params;
  const body = (await request.json()) as AddressInput;
  const result = await saveAddress(tokenOf(request), { ...body, id });
  if ("error" in result) return Response.json(result, { status: 400 });
  return Response.json(result);
}

export async function DELETE(request: Request, context: Context) {
  const { id } = await context.params;
  const ok = await removeAddress(tokenOf(request), id);
  if (!ok) return Response.json({ error: "Sesión no válida." }, { status: 401 });
  return Response.json({ ok: true });
}
