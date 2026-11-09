import type { MetadataRoute } from "next";

/**
 * Search engines get the public pages only. An allow-list rather than listing what's private,
 * so this file doesn't advertise the app's routes and new private screens are covered by default.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/$", "/register$", "/login$", "/privacy$", "/_next/", "/opengraph-image"],
      disallow: "/",
    },
    sitemap: "https://www.edugear.ng/sitemap.xml",
  };
}
