import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Image configuration
   * ──────────────────────────────────────────────
   * Phase 3: Images served from the legacy /pics/ directory,
   * copied into modern/public/pics/ during setup.
   * next/image handles WebP optimisation and srcset automatically.
   *
   * Phase 4: Add Sanity CDN remotePatterns when CMS is connected.
   */
  images: {
    // Allow very large images from legacy pics/ (they are optimised by next/image)
    // In production, set this to false and ensure images are properly sized
    unoptimized: false,
  },

  /**
   * Legacy URL redirects (301 permanent)
   * ──────────────────────────────────────────────
   * Source: audit/route-inventory.csv
   */
  async redirects() {
    return [
      {
        source: "/index.html",
        destination: "/",
        permanent: true,
      },
      {
        source: "/test.html",
        destination: "/stay",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
