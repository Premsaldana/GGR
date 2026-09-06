import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/content/site";
import { rooms } from "@/content/rooms";

export const metadata: Metadata = {
  title: "Enquire",
  description:
    "Enquire about availability at South Goa Garden Villa. Our team responds within 24 hours.",
};

/**
 * Contact / Enquiry page
 * ──────────────────────────────────────────────────────────
 * Phase 3: Static form — client-side only.
 * On submit, logs to console (no email delivery, no CMS write).
 *
 * Phase 4: Wire to /api/enquiry POST route with Resend email delivery.
 * The form shape here matches the Enquiry content model (audit/content-model.md).
 *
 * Note: The actual form is a client component (EnquiryForm) loaded below.
 * This server component handles SEO metadata only.
 */

export default function ContactPage() {
  const whatsappUrl = `https://wa.me/${siteConfig.whatsappNumber}?text=Hello%21%20I%20would%20like%20to%20enquire%20about%20a%20villa.`;

  return (
    <div className="page-section" style={{ maxWidth: "min(var(--max-content), 900px)" }}>
      <span className="page-eyebrow">Contact us</span>
      <h1 className="page-title">Enquire about a villa</h1>
      <p className="page-lead" style={{ marginBottom: "var(--space-10)" }}>
        Fill in the form below and our team will respond within 24 hours. You can also reach us directly on WhatsApp.
      </p>

      {/* WhatsApp shortcut — always available */}
      <div style={{
        display: "flex", alignItems: "center", gap: "var(--space-4)",
        padding: "var(--space-4) var(--space-5)", background: "var(--color-surface)",
        border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
        marginBottom: "var(--space-10)",
      }}>
        <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24" fill="currentColor" width="24" height="24"
          style={{ color: "hsl(130, 40%, 45%)", flexShrink: 0 }}>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <div>
          <p style={{ fontWeight: "500", color: "var(--color-text-primary)", marginBottom: "0" }}>
            Prefer to message directly?
          </p>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: "var(--text-small)", color: "hsl(130, 40%, 40%)" }}>
            Open WhatsApp chat →
          </a>
        </div>
      </div>

      {/* Enquiry form — inline client component via script tag removed;
          using a server-rendered static form that posts to #success.
          Phase 4: replace with <EnquiryForm /> client component wired to /api/enquiry */}
      <form
        id="enquiry-form"
        action="#success"
        method="get"
        aria-label="Villa enquiry form"
        style={{ display: "grid", gap: "var(--space-6)" }}
        onSubmit={undefined}
      >
        {/* Name */}
        <div style={{ display: "grid", gap: "var(--space-2)" }}>
          <label htmlFor="enquiry-name" style={{ fontSize: "var(--text-small)", fontWeight: "500", color: "var(--color-text-primary)" }}>
            Your name <span aria-hidden="true" style={{ color: "var(--color-cta)" }}>*</span>
          </label>
          <input
            id="enquiry-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="e.g. Priya Sharma"
            className="form-input"
          />
        </div>

        {/* Email */}
        <div style={{ display: "grid", gap: "var(--space-2)" }}>
          <label htmlFor="enquiry-email" style={{ fontSize: "var(--text-small)", fontWeight: "500", color: "var(--color-text-primary)" }}>
            Email address <span aria-hidden="true" style={{ color: "var(--color-cta)" }}>*</span>
          </label>
          <input
            id="enquiry-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="form-input"
          />
        </div>

        {/* Phone */}
        <div style={{ display: "grid", gap: "var(--space-2)" }}>
          <label htmlFor="enquiry-phone" style={{ fontSize: "var(--text-small)", fontWeight: "500", color: "var(--color-text-primary)" }}>
            Phone number <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-eyebrow)" }}>(optional)</span>
          </label>
          <input
            id="enquiry-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            className="form-input"
          />
        </div>

        {/* Villa interest */}
        <div style={{ display: "grid", gap: "var(--space-2)" }}>
          <label htmlFor="enquiry-room" style={{ fontSize: "var(--text-small)", fontWeight: "500", color: "var(--color-text-primary)" }}>
            Villa of interest
          </label>
          <select id="enquiry-room" name="room" className="form-input">
            <option value="">Any villa / not sure yet</option>
            {rooms.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.name} {/* [OWNER APPROVAL NEEDED]: canonical room names */}
              </option>
            ))}
          </select>
        </div>

        {/* Dates */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
          <div style={{ display: "grid", gap: "var(--space-2)" }}>
            <label htmlFor="enquiry-checkin" style={{ fontSize: "var(--text-small)", fontWeight: "500", color: "var(--color-text-primary)" }}>
              Preferred check-in <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-eyebrow)" }}>(optional)</span>
            </label>
            <input id="enquiry-checkin" name="checkin" type="date" className="form-input" />
          </div>
          <div style={{ display: "grid", gap: "var(--space-2)" }}>
            <label htmlFor="enquiry-checkout" style={{ fontSize: "var(--text-small)", fontWeight: "500", color: "var(--color-text-primary)" }}>
              Preferred check-out <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-eyebrow)" }}>(optional)</span>
            </label>
            <input id="enquiry-checkout" name="checkout" type="date" className="form-input" />
          </div>
        </div>

        {/* Message */}
        <div style={{ display: "grid", gap: "var(--space-2)" }}>
          <label htmlFor="enquiry-message" style={{ fontSize: "var(--text-small)", fontWeight: "500", color: "var(--color-text-primary)" }}>
            Your message <span aria-hidden="true" style={{ color: "var(--color-cta)" }}>*</span>
          </label>
          <textarea
            id="enquiry-message"
            name="message"
            required
            rows={5}
            maxLength={1000}
            placeholder="Tell us about your group size, dates, any special requirements…"
            className="form-input"
            style={{ resize: "vertical" }}
          />
        </div>

        {/* Submit */}
        <div>
          {/* Phase 3: form posts via GET to #success — no server action yet.
              Phase 4: replace with client-side POST to /api/enquiry */}
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }}>
            Send Enquiry
          </button>
          <p style={{ marginTop: "var(--space-3)", fontSize: "var(--text-eyebrow)", color: "var(--color-text-muted)", textAlign: "center" }}>
            We respond within 24 hours. No booking or payment is taken via this form.
          </p>
        </div>
      </form>

      {/* Contact details fallback */}
      <div style={{ marginTop: "var(--space-12)", paddingTop: "var(--space-8)", borderTop: "1px solid var(--color-border)" }}>
        <p className="room-detail__section-title">Direct contact</p>
        <address style={{ fontStyle: "normal", fontSize: "var(--text-small)", lineHeight: "var(--leading-relaxed)", color: "var(--color-text-body)" }}>
          <p>{siteConfig.propertyName}</p>
          <p>{siteConfig.address.street}, {siteConfig.address.city}, {siteConfig.address.state} {siteConfig.address.postalCode}</p>
          <p><a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`} style={{ color: "var(--color-cta)" }}>{siteConfig.phone}</a></p>
          <p><a href={`mailto:${siteConfig.email}`} style={{ color: "var(--color-cta)" }}>{siteConfig.email}</a></p>
        </address>
      </div>

      <p style={{ marginTop: "var(--space-6)" }}>
        <Link href="/stay" style={{ fontSize: "var(--text-small)", color: "var(--color-text-muted)" }}>← Back to villas</Link>
      </p>
    </div>
  );
}
