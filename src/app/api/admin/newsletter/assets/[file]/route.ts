import { readFile } from "node:fs/promises";
import path from "node:path";
import { emailAssetNames } from "@/lib/distinto-mail";
import { requireRole } from "@/lib/platform";

type Context = { params: Promise<{ file: string }> };

export async function GET(_request: Request, context: Context) {
  const user = await requireRole(["ADMIN", "MODERATOR"]);
  if (!user) return new Response("No autorizado.", { status: 401 });
  const { file } = await context.params;
  if (!emailAssetNames.has(file)) return new Response("No encontrado.", { status: 404 });
  const bytes = await readFile(path.join(process.cwd(), "email-assets", file));
  return new Response(bytes, { headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=3600" } });
}
