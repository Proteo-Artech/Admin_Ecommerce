import { randomUUID } from "node:crypto";
import { saveUpload } from "@/lib/uploads";
import { requireRole } from "@/lib/platform";

export async function POST(request: Request) {
  const user = await requireRole(["ADMIN", "MODERATOR"]);
  if (!user) return Response.json({ error: "No autorizado." }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Falta la imagen." }, { status: 400 });
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) return Response.json({ error: "Usa JPG, PNG o WebP." }, { status: 400 });
  if (file.size > 4_000_000) return Response.json({ error: "La imagen supera 4 MB." }, { status: 400 });
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
  const url = await saveUpload(filename, Buffer.from(await file.arrayBuffer()));
  return Response.json({ url });
}
