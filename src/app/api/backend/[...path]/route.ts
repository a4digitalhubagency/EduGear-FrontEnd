import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, backendUnreachable } from "@/lib/server/backend";

async function forward(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = `${BACKEND_URL}/${path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers();
  const auth = req.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  const type = req.headers.get("content-type");
  if (type) headers.set("content-type", type);

  const hasBody = !["GET", "HEAD"].includes(req.method);
  let backendRes: Response;
  try {
    backendRes = await fetch(url, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
    });
  } catch {
    return backendUnreachable();
  }

  // NestJS errors are always JSON; a non-JSON 5xx is a gateway page (e.g. HTML 502), not the API.
  const contentType = backendRes.headers.get("content-type") ?? "";
  if (backendRes.status >= 500 && !contentType.includes("application/json")) {
    return backendUnreachable();
  }

  return new NextResponse(backendRes.status === 204 ? null : backendRes.body, {
    status: backendRes.status,
    headers: { "content-type": backendRes.headers.get("content-type") ?? "application/json" },
  });
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };