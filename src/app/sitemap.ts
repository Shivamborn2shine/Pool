import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_CONFIG.url.replace(/\/$/, "");
  const lastModified = new Date("2026-10-30");

  const publicRoutes = [
    "",
    "/about",
    "/pricing",
    "/contact",
    "/faq",
    "/docs",
    "/privacy",
    "/terms",
    "/cookies",
  ];

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1.0 : 0.8,
  }));
}

