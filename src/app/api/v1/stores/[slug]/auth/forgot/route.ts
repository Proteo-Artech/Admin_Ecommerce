import { requestPasswordReset } from "@/lib/platform";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string };
  await requestPasswordReset(body.email ?? "");
  return Response.json({ ok: true, message: "Si el correo está registrado, enviamos las instrucciones para restablecer la contraseña." });
}
