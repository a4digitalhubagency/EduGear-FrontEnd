import { NextRequest, NextResponse } from "next/server";
import {
  REFRESH_COOKIE, REMEMBER_COOKIE, backendUnreachable, clearAuthCookies, postToBackend, readJson,
  refreshCookieOptions,
} from "@/lib/server/backend";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ message: "No session" }, { status: 401 });
  }

  // Keep the cookie when the backend is down: the token may still be valid once it's back.
  const backendRes = await postToBackend(req, "/auth/refresh", { refreshToken });
  if (!backendRes) return backendUnreachable();

  const data = await readJson(backendRes);
  if (!data) return backendUnreachable();

  if (backendRes.status >= 500 || backendRes.status === 429) {
    // A backend error or rate limit, not a verdict on the token. Pass it through and keep the
    // cookie, or a few quick reloads would sign the user out.
    return NextResponse.json(data, { status: backendRes.status });
  }

  if (!backendRes.ok) {
    // Token invalid, expired, or replayed (backend kills the whole family on replay).
    // Clear our cookies so the browser stops presenting a dead token.
    const res = NextResponse.json(data, { status: 401 });
    clearAuthCookies(res);
    return res;
  }

  // AuthTokensDto: { accessToken, refreshToken, tokenType, expiresIn }
  const res = NextResponse.json({ accessToken: data.accessToken, expiresIn: data.expiresIn });
  // The backend rotated the refresh token, so we must store the NEW one or the next refresh fails.
  // Reuse the login's "remember me" choice; re-setting the flag keeps its 30 days rolling with the token.
  const persistent = req.cookies.get(REMEMBER_COOKIE)?.value === "1";
  res.cookies.set(REFRESH_COOKIE, data.refreshToken, refreshCookieOptions(persistent));
  if (persistent) res.cookies.set(REMEMBER_COOKIE, "1", refreshCookieOptions(true));
  return res;
}
