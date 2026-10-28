import { revokePanelSession } from "@/lib/panel-session";

export async function POST() {
  await revokePanelSession();
  return Response.json({ ok: true });
}
