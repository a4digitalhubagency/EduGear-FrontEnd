import { NextResponse } from "next/server";
import { REFRESH_COOKIE, REMEMBER_COOKIE, backendUnreachable, postToBackend, readJson, refreshCookieOptions } from "@/lib/server/backend";

const FIELDS = ["schoolName", "schoolEmail", "schoolPhone", "city", "state", "firstName", "lastName", "email", "phone", "password"] as const;

/**
 * School sign-up. POST /auth/register-school creates the school and its proprietor and
 * returns a signed-in session, so this mirrors the login route: the refresh token goes
 * into the httpOnly cookie and never reaches the browser's JavaScript.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  // Only RegisterSchoolDto's fields (forbidNonWhitelisted), and blank optionals left out.
  const input = Object.fromEntries(FIELDS.filter((k) => typeof body[k] === "string" && body[k].trim() !== "").map((k) => [k, body[k]]));

  const backendRes = await postToBackend(req, "/auth/register-school", input);
  if (!backendRes) return backendUnreachable();
  const data = await readJson(backendRes);
  if (!data) return backendUnreachable();
  if (!backendRes.ok) return NextResponse.json(data, { status: backendRes.status });

  const res = NextResponse.json({
    accessToken: data.tokens.accessToken,
    expiresIn: data.tokens.expiresIn,
    user: data.user,
    activeSchool: data.activeSchool,
    memberships: data.memberships,
    permissions: data.permissions,
  });
  res.cookies.set(REFRESH_COOKIE, data.tokens.refreshToken, refreshCookieOptions(false));
  res.cookies.delete({ name: REMEMBER_COOKIE, path: "/api/auth" });
  return res;
}
