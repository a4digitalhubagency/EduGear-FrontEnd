/**
 * Everything on the landing page that the team fills in later, in one place.
 * Leave a value empty and the page shows a "coming soon" state instead of a dead link.
 */

/** Full link to the demo video, e.g. a YouTube URL. */
export const DEMO_VIDEO_URL = "";

export const CONTACT = {
  whatsapp: "", // full link, e.g. https://wa.me/2348012345678
  phone: "+234 812 484 9188",
  email: "edugearsupport@gmail.com",
  address: "",
};

/** Paste each page's full link. Delete a line to remove that network from the footer. */
export const SOCIALS: { label: "Facebook" | "Instagram" | "LinkedIn" | "X"; href: string }[] = [
  { label: "Facebook", href: "" },
  { label: "Instagram", href: "https://www.instagram.com/a4technologies_" },
  { label: "LinkedIn", href: "" },
  { label: "X", href: "https://x.com/a4digitalhub" },
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
