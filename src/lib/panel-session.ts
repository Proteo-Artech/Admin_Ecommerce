import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const COOKIE = "panel-session";
const TTL = 60 * 60 * 24 * 14;
const key = (token: string) => `panel:${createHash("sha256").update(token).digest("hex")}`;

export async function createPanelSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  await prisma.session.create({ data: { token: key(token), userId } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: TTL,
  });
}

export async function panelSessionUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await prisma.session.findUnique({ where: { token: key(token) }, include: { user: true } });
  if (!session || session.createdAt.getTime() + TTL * 1000 <= Date.now()) return null;
  const user = session.user;
  return user.status === "ACTIVE" && (user.role === "ADMIN" || user.role === "MODERATOR") ? user : null;
}

export async function revokePanelSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { token: key(token) } });
  jar.delete(COOKIE);
}
