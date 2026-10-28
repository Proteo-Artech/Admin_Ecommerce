import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

// Punto de adaptación para un futuro proveedor R2. Ambos endpoints usan esta función.
export async function saveUpload(filename: string, bytes: Buffer) {
  if (!/^(exp-)?\d+-[a-f0-9]{8}\.(jpg|png|webp)$/.test(filename)) throw new Error("Nombre de archivo inválido");
  const folder = process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
  await mkdir(folder, { recursive: true });
  await writeFile(path.join(folder, filename), bytes, { flag: "wx" });
  return `/uploads/${filename}`;
}
