import { QueryClient, isServer } from "@tanstack/react-query";
import { ApiError } from "./api-client";

/** Query key prefix for useFileUrl; the cached value is an object URL that must be revoked. */
export const FILE_URL_KEY = "file-url";

function makeQueryClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        // Matches the backend's 30s permission cache; avoids refetching on every mount.
        staleTime: 30_000,
        // A 4xx (validation, 403, 404) won't fix itself on retry; 5xx/502 and network errors might.
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2,
      },
      mutations: { retry: false }, // never silently re-send a create/update
    },
  });

  // Object URLs pin their blob in memory until revoked. Revoke when the cache drops the
  // query (garbage collection, or clear() on logout) rather than when a component unmounts,
  // since several components can share one cached URL.
  client.getQueryCache().subscribe((event) => {
    if (event.type !== "removed" || event.query.queryKey[0] !== FILE_URL_KEY) return;
    const url = event.query.state.data;
    if (typeof url === "string") URL.revokeObjectURL(url);
  });

  return client;
}

let browserClient: QueryClient | undefined;

// One client per browser tab, so non-React code (e.g. logout) can reach the same cache.
// On the server every render gets a fresh client, so cached data can't leak between requests.
export function getQueryClient() {
  if (isServer) return makeQueryClient();
  return (browserClient ??= makeQueryClient());
}
