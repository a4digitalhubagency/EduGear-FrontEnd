import { NextRequest, NextResponse } from "next/server";
import {
  PLATFORM_REFRESH_COOKIE, backendUnreachable, clearPlatformSession, postToBackend, readJson, setPlatformSession,
} from "@/lib/server/backend";

/** Platform sign-in (POST /platform/auth/login). Only the operator record reaches the browser. */
export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  const backendRes = await postToBackend(req, "/platform/auth/login", { email, password });
  if (!backendRes) return backendUnreachable();
  const data = await readJson(backendRes);
  if (!data) return backendUnreachable();
  if (!backendRes.ok) return NextResponse.json(data, { status: backendRes.status });

  const res = NextResponse.json({ admin: data.admin, expiresIn: data.tokens.expiresIn });
  setPlatformSession(res, data.tokens);
  return res;
}

/**
 * Sign out (POST /platform/auth/logout), which revokes the refresh token so the session can't
 * be resumed. The cookies are cleared even if that call fails, so signing out always works here.
 */
export async function DELETE(req: NextRequest) {
  const refreshToken = req.cookies.get(PLATFORM_REFRESH_COOKIE)?.value;
  if (refreshToken) await postToBackend(req, "/platform/auth/logout", { refreshToken });
  const res = new NextResponse(null, { status: 204 });
  clearPlatformSession(res);
  return res;
}
