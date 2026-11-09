import type { MetadataRoute } from "next";

const SITE = "https://www.edugear.ng";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE, priority: 1 },
    { url: `${SITE}/register`, priority: 0.8 },
    { url: `${SITE}/login`, priority: 0.5 },
    { url: `${SITE}/privacy`, priority: 0.3 },
  ];
}
