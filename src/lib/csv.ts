/** Quotes a cell only when it needs it (commas, quotes or line breaks). */
const escape = (value: string | number | null | undefined) => {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

/**
 * Builds a CSV in the browser and downloads it. The leading BOM makes Excel read it as
 * UTF-8, so names with accents survive.
 */
export function downloadCsv(filename: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const text = [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** "2014-03-12T00:00:00.000Z" -> "12/03/2014", the format the student import reads back. */
export function csvDate(iso: string | null | undefined) {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}
