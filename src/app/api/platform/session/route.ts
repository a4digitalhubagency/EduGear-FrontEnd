import { NextResponse } from "next/server";
import { PLATFORM_COOKIE, backendUnreachable, platformCookieOptions, postToBackend, readJson } from "@/lib/server/backend";

/** Platform sign-in (POST /platform/auth/login). Only the operator record reaches the browser. */
export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  const backendRes = await postToBackend(req, "/platform/auth/login", { email, password });
  if (!backendRes) return backendUnreachable();
  const data = await readJson(backendRes);
  if (!data) return backendUnreachable();
  if (!backendRes.ok) return NextResponse.json(data, { status: backendRes.status });

  const res = NextResponse.json({ admin: data.admin, expiresIn: data.tokens.expiresIn });
  res.cookies.set(PLATFORM_COOKIE, data.tokens.accessToken, platformCookieOptions(data.tokens.expiresIn));
  return res;
}

/** Sign out. The backend has no platform logout route; the token simply stops being sent. */
export async function DELETE() {
  const res = new NextResponse(null, { status: 204 });
  res.cookies.delete({ name: PLATFORM_COOKIE, path: "/api/platform" });
  return res;
}
