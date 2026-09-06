import { MetadataRoute } from "next";
import { getAllRoomSlugs } from "@/content/rooms";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const staticRoutes = ["", "/stay", "/contact"].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  const roomRoutes = getAllRoomSlugs().map((slug) => ({
    url: `${siteUrl}/stay/${slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...staticRoutes, ...roomRoutes];
}
