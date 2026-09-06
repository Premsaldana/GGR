import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  
  // If we are not on the production domain (e.g. localhost, preview, staging), disallow indexing
  const isProduction = process.env.NODE_ENV === "production" && !siteUrl.includes("localhost") && !siteUrl.includes("vercel.app");

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
