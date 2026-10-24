import { NextRequest, NextResponse } from "next/server";
import { REFRESH_COOKIE, clearAuthCookies, postToBackend } from "@/lib/server/backend";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;

  // Revoke server-side if we have a token. Even if this fails or the backend is down
  // we still clear the cookies, so signing out always works from the user's side.
  if (refreshToken) await postToBackend("/auth/logout", { refreshToken });

  const res = NextResponse.json({ message: "Signed out" });
  clearAuthCookies(res);
  return res;
}
