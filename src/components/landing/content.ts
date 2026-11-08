/**
 * Everything on the landing page that the team fills in later, in one place.
 * Leave a value empty and the page shows a "coming soon" state instead of a dead link.
 */

/** Full link to the demo video, e.g. a YouTube URL. */
export const DEMO_VIDEO_URL = "";

export const CONTACT = {
  whatsapp: "", // full link, e.g. https://wa.me/2348012345678
  phone: "", // e.g. +234 801 234 5678
  email: "",
  address: "",
};

/** Paste each page's full link. Delete a line to remove that network from the footer. */
export const SOCIALS: { label: "Facebook" | "Instagram" | "LinkedIn" | "X"; href: string }[] = [
  { label: "Facebook", href: "" },
  { label: "Instagram", href: "" },
  { label: "LinkedIn", href: "" },
  { label: "X", href: "" },
];

export type Plan = {
  name: string;
  price: string; // e.g. "₦500"
  period: string; // e.g. "per student, per term"
  description: string;
  features: string[];
};

/** Add plans here and the pricing section switches from "coming soon" to plan cards. */
export const PLANS: Plan[] = [];
