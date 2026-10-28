import { requireRole, reviewExperience, reviewExperiencePhoto } from "@/lib/platform";

export async function PATCH(request: Request) {
  const user = await requireRole(["ADMIN", "MODERATOR"]);
  if (!user) return Response.json({ error: "No autorizado." }, { status: 401 });
  const body = (await request.json()) as { id?: string; photoId?: string; status?: "APPROVED" | "DECLINED" };
  if (body.status !== "APPROVED" && body.status !== "DECLINED") {
    return Response.json({ error: "Elige aprobar o declinar." }, { status: 400 });
  }
  if (body.photoId) {
    const photo = await reviewExperiencePhoto(body.photoId, body.status);
    if (!photo) return Response.json({ error: "No encontramos la foto." }, { status: 404 });
    return Response.json(photo);
  }
  if (!body.id) return Response.json({ error: "Falta la experiencia." }, { status: 400 });
  const experience = await reviewExperience(body.id, body.status);
  if (!experience) return Response.json({ error: "No encontramos la experiencia." }, { status: 404 });
  return Response.json(experience);
}
