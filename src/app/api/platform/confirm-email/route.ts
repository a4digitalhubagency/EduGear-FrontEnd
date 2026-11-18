import { NextResponse } from "next/server";
import { backendUnreachable, postToBackend, readJson } from "@/lib/server/backend";

/**
 * POST /platform/auth/confirm-email. Public: the emailed link is the proof, and it is often
 * opened in a browser with no platform session, so it doesn't go through the token proxy.
 */
export async function POST(req: Request) {
  const { token } = await req.json().catch(() => ({}));
  const backendRes = await postToBackend(req, "/platform/auth/confirm-email", { token });
  if (!backendRes) return backendUnreachable();
  const data = await readJson(backendRes);
  if (!data) return backendUnreachable();
  return NextResponse.json(data, { status: backendRes.status });
}
