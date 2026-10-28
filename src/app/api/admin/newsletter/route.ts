import { newsletterDesk, previewBulletin, removeSubscribers, requireRole, sendBulletin } from "@/lib/platform";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireRole(["ADMIN", "MODERATOR"]);
  if (!user) return Response.json({ error: "No autorizado." }, { status: 401 });
  return Response.json(await newsletterDesk());
}

export async function POST(request: Request) {
  const user = await requireRole(["ADMIN", "MODERATOR"]);
  if (!user) return Response.json({ error: "No autorizado." }, { status: 401 });
  const body = (await request.json()) as {
    kind?: string;
    subject?: string;
    body?: string;
    couponCode?: string;
    subscriberIds?: string[];
    preview?: boolean;
  };
  const result = body.preview ? await previewBulletin(body) : await sendBulletin(body);
  if ("error" in result) return Response.json(result, { status: 400 });
  return Response.json(result);
}

export async function DELETE(request: Request) {
  const user = await requireRole(["ADMIN", "MODERATOR"]);
  if (!user) return Response.json({ error: "No autorizado." }, { status: 401 });
  const body = (await request.json()) as { ids?: string[] };
  const result = await removeSubscribers(body.ids ?? []);
  if ("error" in result) return Response.json(result, { status: 400 });
  return Response.json(result);
}
