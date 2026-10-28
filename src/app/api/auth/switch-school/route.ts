import { NextRequest, NextResponse } from "next/server";
import {
  BACKEND_URL, REFRESH_COOKIE, REMEMBER_COOKIE, backendUnreachable, clientIpHeaders, readJson, refreshCookieOptions,
} from "@/lib/server/backend";

/**
 * Switch the signed-in user to another school they belong to. Like login, the backend
 * answers with a full SessionDto including a new refresh token, which must go into the
 * httpOnly cookie rather than to the browser, so this can't go through the plain proxy.
 */
export async function POST(req: NextRequest) {
  const { schoolId } = await req.json().catch(() => ({}));
  const auth = req.headers.get("authorization");
  if (typeof schoolId !== "string" || !auth) {
    return NextResponse.json({ message: "Missing school or session" }, { status: 400 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND_URL}/auth/switch-school/${encodeURIComponent(schoolId)}`, {
      method: "POST",
      headers: { ...clientIpHeaders(req), authorization: auth },
    });
  } catch {
    return backendUnreachable();
  }

  const data = await readJson(backendRes);
  if (!data) return backendUnreachable();
  if (!backendRes.ok) return NextResponse.json(data, { status: backendRes.status });

  // The backend issues a new token pair but leaves the old refresh token alive. Revoke it,
  // so the previous school's session doesn't linger until it expires. Best effort only.
  const oldRefreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (oldRefreshToken) {
    await fetch(`${BACKEND_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...clientIpHeaders(req) },
      body: JSON.stringify({ refreshToken: oldRefreshToken }),
    }).catch(() => {});
  }

  const res = NextResponse.json({
    accessToken: data.tokens.accessToken,
    expiresIn: data.tokens.expiresIn,
    user: data.user,
    activeSchool: data.activeSchool,
    memberships: data.memberships,
    permissions: data.permissions,
  });
  // Same "remember me" choice as the session being replaced.
  const persistent = req.cookies.get(REMEMBER_COOKIE)?.value === "1";
  res.cookies.set(REFRESH_COOKIE, data.tokens.refreshToken, refreshCookieOptions(persistent));
  return res;
}
