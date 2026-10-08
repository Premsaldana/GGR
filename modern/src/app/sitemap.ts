import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const productionFallback = process.env.VERCEL_ENV === "production" || process.env.VERCEL === "1"
    ? "https://goagardenresort.vercel.app"
    : "http://localhost:3000";
  const siteUrl = configuredSiteUrl && !configuredSiteUrl.includes("localhost")
    ? configuredSiteUrl
    : productionFallback;

  return [
    {
      url: siteUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date().toISOString(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/availability`,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];
}
