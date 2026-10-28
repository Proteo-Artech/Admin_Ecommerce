import { createPanelSession } from "@/lib/panel-session";
import { login } from "@/lib/platform";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const user = await login(body.email ?? "", body.password ?? "");
  if (!user) return Response.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
  await createPanelSession(user.id);
  return Response.json({ user });
}
