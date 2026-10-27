import { useAuthStore } from "./store/auth-store";

type ErrorBody = {
  errorCode?: string;
  message?: string;
  details?: unknown;
  requestId?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly errorCode?: string;
  readonly details?: unknown;
  /** Every backend error carries one; it ties straight to the server logs. */
  readonly requestId?: string;

  constructor(status: number, body: ErrorBody | null) {
    super(body?.message ?? "Request failed.");
    this.name = "ApiError";
    this.status = status;
    this.errorCode = body?.errorCode;
    this.details = body?.details;
    this.requestId = body?.requestId;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

export function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        useAuthStore.getState().clear();
        return false;
      }

      const data = (await response.json()) as {
        accessToken: string;
        expiresIn: number;
      };
      useAuthStore.getState().setToken(data.accessToken, data.expiresIn);
      return true;
    } catch {
      useAuthStore.getState().clear();
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export type ApiOptions = RequestInit & {
  // false for public endpoints (forgot/reset password, verify email, accept invitation):
  // no Bearer header, and a 401 means bad input, not an expired session, so no refresh-and-retry.
  auth?: boolean;
};

/** Sends the request (with auth + one refresh-and-retry) and returns the OK response unread. */
async function send(path: string, options: ApiOptions, hasRetried: boolean): Promise<Response> {
  const { auth = true, ...init } = options;
  const headers = new Headers(init.headers);
  const accessToken = auth ? useAuthStore.getState().accessToken : null;
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  // A FormData body gets no Content-Type here on purpose: the browser sets
  // multipart/form-data with its boundary, and the proxy forwards it as-is.
  const response = await fetch(`/api/backend${path}`, {
    ...init,
    headers,
  });

  if (auth && response.status === 401 && !hasRetried && (await refreshSession())) {
    return send(path, options, true);
  }

  if (!response.ok) {
    const body = await readResponseBody(response);
    throw new ApiError(response.status, typeof body === "object" && body !== null ? body as ErrorBody : null);
  }

  return response;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const response = await send(path, options, false);
  return (await readResponseBody(response)) as T;
}

/** For binary responses (photos, the import template): reading those as text would corrupt them. */
export async function apiBlob(path: string, options: ApiOptions = {}): Promise<Blob> {
  const response = await send(path, options, false);
  return response.blob();
}

/**
 * Downloads a backend file to the user's computer, named by the server's
 * Content-Disposition when it sends one (e.g. the student import template).
 */
export async function downloadFile(path: string, fallbackName: string) {
  const response = await send(path, {}, false);
  const disposition = response.headers.get("content-disposition") ?? "";
  const name = /filename="?([^";]+)"?/i.exec(disposition)?.[1] ?? fallbackName;
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  // Give the browser a moment to start the download before freeing the memory.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Backend file URLs come back as "/api/files/:id" (relative to the backend), but the
 * browser must go through our proxy at /api/backend. Returns the path for api()/apiBlob(),
 * or null for anything that isn't a backend URL (e.g. an external photoUrl).
 */
export function backendPathFromUrl(url: string) {
  return url.startsWith("/api/") ? url.slice("/api".length) : null;
}

/** Request options for a JSON body. The proxy forwards Content-Type as-is, so it must be set here. */
export function jsonBody(method: "POST" | "PATCH" | "PUT", data: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) };
}

/** Builds "?a=1&b=x" from defined values only; "" when nothing is set. */
export function toQueryString(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

/**
 * The backend refuses weak passwords as "Password is too weak" with reasons such as
 * "must contain a number" in details[0].constraints. This makes them one sentence:
 * "Password must contain a number and is too common…". Anything else: errorMessage().
 */
export function passwordErrorMessage(error: unknown) {
  if (error instanceof ApiError && Array.isArray(error.details)) {
    const first = error.details[0] as { field?: unknown; constraints?: unknown } | undefined;
    if (first?.field === "password" && Array.isArray(first.constraints) && first.constraints.length > 0) {
      return `Password ${first.constraints.join(" and ")}.`;
    }
  }
  return errorMessage(error);
}

/**
 * A message fit to show the user. Validation failures say "Request validation failed"
 * and carry the real reasons (class-validator strings) in details, so show the first one;
 * those are the user's to fix. Any other backend error ends with "(Ref: 8587b724)", the
 * start of its requestId, so whoever reports it can quote it and the backend team can find
 * it in the logs.
 */
export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (!(error instanceof ApiError)) return fallback;
  if (error.errorCode === "VALIDATION_ERROR" && Array.isArray(error.details)) {
    const first: unknown = error.details[0];
    if (typeof first === "string") return first;
    // Some services report { field, constraints: ["student is not an active member of JSS 1 B"] }.
    const constraint = (first as { constraints?: unknown } | undefined)?.constraints;
    if (Array.isArray(constraint) && typeof constraint[0] === "string") return constraint[0];
  }
  return error.requestId && error.errorCode !== "VALIDATION_ERROR"
    ? `${error.message} (Ref: ${error.requestId.slice(0, 8)})`
    : error.message;
}