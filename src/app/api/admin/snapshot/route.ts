import { dashboardStats, panelSnapshot, requireRole } from "@/lib/platform";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireRole(["ADMIN", "MODERATOR"]);
  if (!user) return Response.json({ error: "No autorizado." }, { status: 401 });
  return Response.json({ user, stats: await dashboardStats(), ...(await panelSnapshot()) });
}
