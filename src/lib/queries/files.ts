"use client";

import { useQuery } from "@tanstack/react-query";
import { apiBlob, backendPathFromUrl } from "@/lib/api-client";
import { FILE_URL_KEY } from "@/lib/query-client";

/**
 * A URL an <img> can use for a backend file. Backend files need the Bearer token,
 * which <img src> can't send, so the file is fetched as a blob and exposed as an
 * object URL (revoked by the query cache, see query-client.ts). External URLs pass through.
 */
export function useFileUrl(url: string | null | undefined) {
  const path = url ? backendPathFromUrl(url) : null;
  const query = useQuery({
    queryKey: [FILE_URL_KEY, path],
    queryFn: async () => URL.createObjectURL(await apiBlob(path!)),
    enabled: !!path,
    // A file id's bytes never change: a replaced photo gets a new id, so never refetch.
    staleTime: Infinity,
  });
  if (!url) return null;
  return path ? (query.data ?? null) : url;
}
