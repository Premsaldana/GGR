import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { SkipLink } from "@/components/ui/SkipLink";
import { ResortHeader } from "@/components/resort/ResortHeader";
import { ResortFooter } from "@/components/resort/ResortFooter";
import { LayoutBoundary } from "@/components/resort/LayoutBoundary";
import { siteConfig } from "@/content/site";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * Font setup — Cormorant Garamond (display serif) + Inter (neutral sans)
 * Loaded via next/font: zero layout shift, self-hosted, no render-blocking.
 * CSS variables are injected on <html> and referenced in tokens.css.
 */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * Default metadata — overridden per-page when needed.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Goa Garden Resort — Private 5-Bedroom Resort in Colva",
    template: "%s | Goa Garden Resort",
  },
  description:
    "An entire gated five-bedroom resort in Colva, South Goa, with a private pool, tropical garden, and space for up to 20 guests.",
  keywords: ["private resort goa", "5 bedroom villa goa", "private pool villa colva", "group stay south goa", "goa garden resort"],
  authors: [{ name: siteConfig.propertyName }],
  openGraph: {
    type: "website",
    siteName: siteConfig.propertyName,
    title: "Goa Garden Resort — Your Private Resort in Colva",
    description:
      "Take over an entire five-bedroom resort in Colva, South Goa, with a private pool and tropical garden.",
    images: [{ url: "/resort/hero-pool-night.webp", width: 2400, height: 1500, alt: "Goa Garden Resort private pool at night" }],
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/resort/hero-pool-night.webp"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable}`}
    >
      <body>
        {/* Accessibility: first focusable element */}
        <SkipLink />

        <LayoutBoundary
          header={<ResortHeader />}
          footer={<ResortFooter />}
        >
          {children}
        </LayoutBoundary>
      </body>
    </html>
  );
}
