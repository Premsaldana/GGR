import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const productionFallback = process.env.VERCEL_ENV === "production" || process.env.VERCEL === "1"
    ? "https://goagardenresort.vercel.app"
    : "http://localhost:3000";
  const siteUrl = configuredSiteUrl && !configuredSiteUrl.includes("localhost")
    ? configuredSiteUrl
    : productionFallback;
  
  // Keep previews and local builds out of search while allowing configured production domains.
  const isProduction = process.env.NODE_ENV === "production" && !siteUrl.includes("localhost");

  if (!isProduction) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
