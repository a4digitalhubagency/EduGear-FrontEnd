"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";

const PHOTO_TYPES = "image/png,image/jpeg,image/webp";

interface PhotoPickerProps {
  /** What to show when no new file is picked, e.g. the saved photo's object URL. */
  currentUrl?: string | null;
  /** Called with the chosen file (or null when cleared). */
  onChange: (file: File | null) => void;
  busy?: boolean;
  label?: string;
}

/**
 * The round "Upload Photo" control from the Add Student design, now functional: picks a
 * PNG/JPG/WebP and previews it locally. The upload itself happens on save (Add) or
 * straight away (Edit), so this only reports the file.
 */
export function PhotoPicker({ currentUrl, onChange, busy, label = "Upload Photo" }: PhotoPickerProps) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Release the local preview's memory when it's replaced or the form goes away.
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  function pick(file: File | undefined) {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onChange(file);
    if (input.current) input.current.value = ""; // so the same file can be picked again
  }

  const shown = preview ?? currentUrl;

  return (
    <button
      type="button"
      onClick={() => input.current?.click()}
      disabled={busy}
      className="relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-gray/25 text-slate-gray hover:border-bright-blue hover:text-bright-blue disabled:cursor-wait"
      aria-label={label}
    >
      {shown ? (
        // eslint-disable-next-line @next/next/no-img-element -- object/blob URLs can't go through next/image
        <img src={shown} alt="Student photo" className="h-full w-full object-cover" />
      ) : (
        <span className="flex flex-col items-center gap-1">
          <Camera className="h-5 w-5" />
          <span className="text-[10px] font-medium">{label}</span>
        </span>
      )}
      {busy && (
        <span className="absolute inset-0 flex items-center justify-center bg-white/70">
          <Loader2 className="h-5 w-5 animate-spin text-bright-blue" />
        </span>
      )}
      <input ref={input} type="file" accept={PHOTO_TYPES} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
    </button>
  );
}
