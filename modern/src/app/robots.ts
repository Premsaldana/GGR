import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_ENV === "production" ? "https://goagardenresort.vercel.app" : "http://localhost:3000");
  
  // Keep previews and local builds out of search while allowing the live GGR domain.
  const isProduction = process.env.NODE_ENV === "production"
    && siteUrl === "https://goagardenresort.vercel.app";

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
