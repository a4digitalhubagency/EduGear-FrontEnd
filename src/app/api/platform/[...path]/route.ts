import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, PLATFORM_COOKIE, backendUnreachable } from "@/lib/server/backend";

/**
 * /api/platform/<path> -> backend /platform/<path>, with the platform token from its cookie.
 * Only the platform routes are reachable through here, never the school API.
 */
async function forward(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const token = req.cookies.get(PLATFORM_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ statusCode: 401, errorCode: "UNAUTHORIZED", message: "Please sign in again." }, { status: 401 });
  }

  const headers = new Headers({ authorization: `Bearer ${token}` });
  const type = req.headers.get("content-type");
  if (type) headers.set("content-type", type);

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND_URL}/platform/${path.join("/")}${req.nextUrl.search}`, {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.arrayBuffer(),
    });
  } catch {
    return backendUnreachable();
  }

  const contentType = backendRes.headers.get("content-type") ?? "";
  if (backendRes.status >= 500 && !contentType.includes("application/json")) return backendUnreachable();
  return new NextResponse(backendRes.status === 204 ? null : backendRes.body, {
    status: backendRes.status,
    headers: { "content-type": contentType || "application/json" },
  });
}

export { forward as GET, forward as POST, forward as DELETE };
