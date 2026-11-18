import { NextResponse } from "next/server";

export const BACKEND_URL = process.env.BACKEND_API_URL!;

// Server-only (never NEXT_PUBLIC_): it proves to the backend that a client address came from us.
const PROXY_SECRET = process.env.TRUSTED_PROXY_SECRET;

/**
 * Every call reaches the backend from this server's one address, so without help all users
 * would share one rate-limit budget. These headers name the real visitor, and the secret
 * makes the backend believe it. The address is X-Real-IP, which Railway's edge overwrites on
 * every request, so a visitor can't pick their own. X-Forwarded-For is deliberately not used:
 * its earlier hops are whatever the caller typed. No secret or no address (local dev) sends
 * nothing, and the backend falls back to the shared budget.
 */
export function clientIpHeaders(req: Request): Record<string, string> {
  const ip = req.headers.get("x-real-ip")?.trim();
  return PROXY_SECRET && ip ? { "X-Client-Ip": ip, "X-Edge-Secret": PROXY_SECRET } : {};
}

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
export async function postToBackend(req: Request, path: string, body: unknown): Promise<Response | null> {
  try {
    return await fetch(`${BACKEND_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...clientIpHeaders(req) },
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

// A4 platform console. Both tokens live in httpOnly cookies, so page JavaScript never holds
// either. The 15-minute access token goes to the whole platform proxy; the refresh token is
// scoped to /api/platform/session, so it only ever travels to refresh and sign-out.
export const PLATFORM_COOKIE = "edugear_platform";
export const PLATFORM_REFRESH_COOKIE = "edugear_platform_refresh";
const PLATFORM_SESSION_PATH = "/api/platform/session";

function platformCookieOptions(path: string, maxAgeSeconds?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path,
    // No maxAge on the refresh cookie: it dies with the browser, though the backend would honour it for 30 days.
    ...(maxAgeSeconds !== undefined ? { maxAge: maxAgeSeconds } : {}),
  };
}

/** Login and refresh both answer { admin, tokens }. The refresh token rotates, so always store the new one. */
export function setPlatformSession(res: NextResponse, tokens: { accessToken: string; refreshToken: string; expiresIn: number }) {
  res.cookies.set(PLATFORM_COOKIE, tokens.accessToken, platformCookieOptions("/api/platform", tokens.expiresIn));
  res.cookies.set(PLATFORM_REFRESH_COOKIE, tokens.refreshToken, platformCookieOptions(PLATFORM_SESSION_PATH));
}

export function clearPlatformSession(res: NextResponse) {
  res.cookies.delete({ name: PLATFORM_COOKIE, path: "/api/platform" });
  res.cookies.delete({ name: PLATFORM_REFRESH_COOKIE, path: PLATFORM_SESSION_PATH });
}
