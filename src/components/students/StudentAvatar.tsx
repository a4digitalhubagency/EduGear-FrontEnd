"use client";

import { useFileUrl } from "@/lib/queries/files";
import { cn, getInitials } from "@/lib/utils";

// Same palette as the Students list's initials avatars.
const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-pink-100 text-pink-700",
  "bg-amber-100 text-amber-700",
];

/** Stable colour per student, so a row keeps its colour across pages and sorts. */
function colorFor(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface StudentAvatarProps {
  /** Student id; picks the initials colour. */
  id: string;
  /** "Ada Obi"; initials come from the first two words. */
  name: string;
  photoUrl: string | null;
  /** Size and text classes, e.g. "h-9 w-9 text-xs" (the default). */
  className?: string;
}

/** Student photo when there is one (fetched with auth, see useFileUrl), initials otherwise. */
export function StudentAvatar({ id, name, photoUrl, className = "h-9 w-9 text-xs" }: StudentAvatarProps) {
  const src = useFileUrl(photoUrl);

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- object/blob URLs can't go through next/image
      <img src={src} alt={name} className={cn("shrink-0 rounded-full object-cover", className)} />
    );
  }

  return (
    <div
      aria-hidden
      className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold", colorFor(id), className)}
    >
      {getInitials(name)}
    </div>
  );
}
