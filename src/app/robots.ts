import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_CONFIG.url.replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/about",
          "/pricing",
          "/contact",
          "/faq",
          "/docs",
          "/privacy",
          "/terms",
          "/cookies",
        ],
        disallow: [
          "/dashboard",
          "/customers",
          "/purchases",
          "/claims",
          "/rewards",
          "/reports",
          "/settings",
          "/platform",
          "/api/",
          "/card/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

