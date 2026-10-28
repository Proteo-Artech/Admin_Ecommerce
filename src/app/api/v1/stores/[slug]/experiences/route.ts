import { publicExperiences, saveExperience } from "@/lib/platform";

type Context = { params: Promise<{ slug: string }> };

function tokenOf(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

export async function GET(request: Request, context: Context) {
  const { slug } = await context.params;
  const url = new URL(request.url);
  const take = Number(url.searchParams.get("take") ?? "");
  const experiences = await publicExperiences(slug, {
    productId: url.searchParams.get("productId") ?? undefined,
    categorySlug: url.searchParams.get("category") ?? undefined,
    take: Number.isFinite(take) && take > 0 ? take : undefined,
  });
  return Response.json({ experiences });
}

export async function POST(request: Request, context: Context) {
  const { slug } = await context.params;
  const body = (await request.json()) as { orderId?: string; rating?: number; body?: string; photos?: string[] };
  if (!body.orderId) return Response.json({ error: "Falta el pedido." }, { status: 400 });
  const result = await saveExperience(slug, tokenOf(request), body.orderId, body);
  if ("error" in result) {
    return Response.json(result, { status: result.error === "Sesión no válida." ? 401 : 400 });
  }
  return Response.json(result);
}
