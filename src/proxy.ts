import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function sameSecret(left: string, right: string) {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return diff === 0;
}

export function proxy(request: NextRequest) {
  const expected = process.env.ADMIN_API_SECRET?.trim() ?? "";
  const received = request.headers.get("x-store-key") ?? "";
  if (!expected || !sameSecret(expected, received)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  return NextResponse.next();
}

export const config = { matcher: ["/api/v1/:path*"] };
