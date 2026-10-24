import { NextResponse } from "next/server";

export const BACKEND_URL = process.env.BACKEND_API_URL!;

// One cookie definition so login, refresh and logout can never drift apart.
export const REFRESH_COOKIE = "refresh_token";
// Non-sensitive flag: "1" when "remember me" was ticked, so refresh can keep the same cookie lifetime.
export const REMEMBER_COOKIE = "edugear_remember";

export function refreshCookieOptions(persistent: boolean) {
  return {
    httpOnly: true,                                   // JS in the browser can never read it
    secure: process.env.NODE_ENV === "production",    // HTTPS-only once deployed
    sameSite: "lax" as const,
    path: "/api/auth",                                // only sent to our auth routes
    // 30 days if "remember me", otherwise a session cookie that dies with the browser
    ...(persistent ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  };
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.delete({ name: REFRESH_COOKIE, path: "/api/auth" });
  res.cookies.delete({ name: REMEMBER_COOKIE, path: "/api/auth" });
}

// Same body shape as backend errors so the browser can read message/errorCode either way.
export function backendUnreachable() {
  return NextResponse.json(
    { statusCode: 502, errorCode: "BACKEND_UNREACHABLE", message: "Can't reach the server. Please try again shortly." },
    { status: 502 },
  );
}

// Server-to-server JSON POST. Returns null when the backend can't be reached at all
// (DNS failure, connection refused or reset) instead of throwing.
export async function postToBackend(path: string, body: unknown): Promise<Response | null> {
  try {
    return await fetch(`${BACKEND_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return null;
  }
}

// NestJS always answers JSON, so a body that won't parse came from something in front of it
// (e.g. a gateway's HTML 502 page). Callers treat null as "didn't really reach the backend".
export async function readJson(res: Response): Promise<any | null> { // eslint-disable-line @typescript-eslint/no-explicit-any
  return res.json().catch(() => null);
}
