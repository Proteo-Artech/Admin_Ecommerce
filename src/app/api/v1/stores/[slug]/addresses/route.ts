import { listAddresses, saveAddress, type AddressInput } from "@/lib/platform";

function tokenOf(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

export async function GET(request: Request) {
  const addresses = await listAddresses(tokenOf(request));
  if (!addresses) return Response.json({ error: "Sesión no válida." }, { status: 401 });
  return Response.json({ addresses });
}

export async function POST(request: Request) {
  const body = (await request.json()) as AddressInput;
  const result = await saveAddress(tokenOf(request), body);
  if ("error" in result) return Response.json(result, { status: 400 });
  return Response.json(result);
}
