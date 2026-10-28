import { NextResponse } from "next/server";
import {
  REFRESH_COOKIE, REMEMBER_COOKIE, backendUnreachable, postToBackend, readJson, refreshCookieOptions,
} from "@/lib/server/backend";

export async function POST(req: Request) {
  // A malformed browser body becomes {} and the backend's validation answers with a normal 400.
  const { email, password, remember, schoolId } = await req.json().catch(() => ({}));

  // Server-to-server call to NestJS. We forward only the fields LoginDto accepts,
  // because the backend uses forbidNonWhitelisted and would reject "remember".
  const backendRes = await postToBackend(req, "/auth/login", { email, password, ...(schoolId ? { schoolId } : {}) });
  if (!backendRes) return backendUnreachable();

  const data = await readJson(backendRes);
  if (!data) return backendUnreachable();

  // Pass the backend's error body straight through (same shape: statusCode, errorCode, message...)
  if (!backendRes.ok) return NextResponse.json(data, { status: backendRes.status });

  // SessionDto = { tokens, user, activeSchool, memberships, permissions }.
  // The refresh token is deliberately left out of the JSON the browser receives.
  const res = NextResponse.json({
    accessToken: data.tokens.accessToken,
    expiresIn: data.tokens.expiresIn,
    user: data.user,
    activeSchool: data.activeSchool,
    memberships: data.memberships,
    permissions: data.permissions,
  });

  res.cookies.set(REFRESH_COOKIE, data.tokens.refreshToken, refreshCookieOptions(!!remember));
  // Set or clear the flag every login, so a previous user's "remember me" can't leak into this one.
  if (remember) res.cookies.set(REMEMBER_COOKIE, "1", refreshCookieOptions(true));
  else res.cookies.delete({ name: REMEMBER_COOKIE, path: "/api/auth" });
  return res;
}
