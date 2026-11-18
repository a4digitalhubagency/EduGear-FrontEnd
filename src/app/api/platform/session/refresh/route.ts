import { NextRequest, NextResponse } from "next/server";
import {
  PLATFORM_REFRESH_COOKIE, backendUnreachable, clearPlatformSession, postToBackend, readJson, setPlatformSession,
} from "@/lib/server/backend";

/**
 * POST /platform/auth/refresh. The refresh token rotates on every use and replaying a used one
 * revokes the whole session, so the new one replaces the old cookie in this same response.
 * Callers must never run two of these at once (see refreshPlatformSession).
 */
export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(PLATFORM_REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ statusCode: 401, errorCode: "UNAUTHENTICATED", message: "Please sign in again." }, { status: 401 });
  }

  // Unreachable, a gateway error page, a 5xx or a rate limit is not a verdict on the token: keep it.
  const backendRes = await postToBackend(req, "/platform/auth/refresh", { refreshToken });
  if (!backendRes) return backendUnreachable();
  const data = await readJson(backendRes);
  if (!data) return backendUnreachable();
  if (backendRes.status >= 500 || backendRes.status === 429) return NextResponse.json(data, { status: backendRes.status });

  if (!backendRes.ok) {
    // Expired, revoked (password changed, access withdrawn) or replayed. Drop both cookies.
    const res = NextResponse.json(data, { status: 401 });
    clearPlatformSession(res);
    return res;
  }

  const res = NextResponse.json({ admin: data.admin, expiresIn: data.tokens.expiresIn });
  setPlatformSession(res, data.tokens);
  return res;
}
