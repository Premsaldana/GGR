import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { SkipLink } from "@/components/ui/SkipLink";
import { ResortHeader } from "@/components/resort/ResortHeader";
import { ResortFooter } from "@/components/resort/ResortFooter";
import { siteConfig } from "@/content/site";
import "./globals.css";

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
 * Default metadata — overridden per-page via generateMetadata().
 * [OWNER APPROVAL NEEDED]: canonical URL (NEXT_PUBLIC_SITE_URL env var)
 */
export const metadata: Metadata = {
  title: {
    default: "South Goa Garden Villa — Private Villas in Colva, South Goa",
    template: "%s | South Goa Garden Villa",
  },
  description:
    "South Goa Garden Villa offers three private villa options in Colva, Goa — a 1-bedroom, 4-bedroom, and 5-bedroom villa with private pool. Ideal for families and groups.",
  keywords: ["goa villa", "south goa accommodation", "colva villa", "private pool villa goa", "south goa garden villa"],
  authors: [{ name: siteConfig.propertyName }],
  openGraph: {
    type: "website",
    siteName: siteConfig.propertyName,
    title: "South Goa Garden Villa — Private Villas in Colva, South Goa",
    description:
      "Three private villa options in Colva, Goa. 1-bedroom to 5-bedroom with private pool. Enquire today.",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
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

        {/* Shared shell */}
        <ResortHeader />

        {/* Main content — id matches SkipLink href */}
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>

        <ResortFooter />
      </body>
    </html>
  );
}
