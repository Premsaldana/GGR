import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: "var(--space-16) var(--gutter)",
        textAlign: "center",
      }}
    >
      <span
        style={{
          display: "block",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-eyebrow)",
          fontWeight: "500",
          letterSpacing: "var(--tracking-widest)",
          textTransform: "uppercase",
          color: "var(--color-cta)",
          marginBottom: "var(--space-4)",
        }}
      >
        404
      </span>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-display)",
          color: "var(--color-text-primary)",
          marginBottom: "var(--space-4)",
          letterSpacing: "var(--tracking-tight)",
        }}
      >
        Page not found
      </h1>
      <p style={{ color: "var(--color-text-body)", marginBottom: "var(--space-8)" }}>
        This page does not exist. Browse our villas or get in touch.
      </p>
      <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/stay" className="btn btn-primary btn-md">
          Browse villas
        </Link>
        <Link href="/contact" className="btn btn-secondary btn-md">
          Enquire
        </Link>
      </div>
    </div>
  );
}
