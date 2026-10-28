import { randomUUID } from "node:crypto";
import { saveUpload } from "@/lib/uploads";
import { assertExperienceUpload } from "@/lib/platform";

type Context = { params: Promise<{ slug: string }> };

function tokenOf(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

export async function POST(request: Request, context: Context) {
  const { slug } = await context.params;
  const form = await request.formData();
  const orderId = String(form.get("orderId") ?? "");
  const owned = await assertExperienceUpload(slug, tokenOf(request), orderId);
  if ("error" in owned) {
    return Response.json(owned, { status: owned.error === "Sesión no válida." ? 401 : 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Falta la imagen." }, { status: 400 });
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) return Response.json({ error: "Usa JPG, PNG o WebP." }, { status: 400 });
  if (file.size > 4_000_000) return Response.json({ error: "La imagen supera 4 MB." }, { status: 400 });
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `exp-${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
  const url = await saveUpload(filename, Buffer.from(await file.arrayBuffer()));
  return Response.json({ url });
}
