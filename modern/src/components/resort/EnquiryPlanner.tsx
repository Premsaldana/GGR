"use client";

import { FormEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { siteConfig } from "@/content/site";
import { dateSchema } from "@/lib/pricing-core";

export function EnquiryPlanner() {
  const searchParams = useSearchParams();
  const checkInParam = searchParams.get("checkIn") || "";
  const checkOutParam = searchParams.get("checkOut") || "";
  const checkIn = dateSchema.safeParse(checkInParam).success ? checkInParam : "";
  const checkOut = dateSchema.safeParse(checkOutParam).success ? checkOutParam : "";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const checkIn = String(data.get("checkIn") || "");
    const checkOut = String(data.get("checkOut") || "");

    if (checkIn && checkOut && checkOut <= checkIn) {
      const checkOutField = form.elements.namedItem("checkOut") as HTMLInputElement;
      checkOutField.setCustomValidity("Check-out must be after check-in.");
      checkOutField.reportValidity();
      return;
    }

    const message = [
      "Hello! I would like to enquire about a private stay at Goa Garden Resort.",
      `Name: ${String(data.get("name") || "")}`,
      `Guests: ${String(data.get("guests") || "Not decided")}`,
      `Check-in: ${checkIn || "Flexible"}`,
      `Check-out: ${checkOut || "Flexible"}`,
      `Message: ${String(data.get("message") || "No additional notes")}`,
    ].join("\n");

    window.location.assign(
      `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`,
    );
  }

  return (
    <form className="enquiry-planner" onSubmit={handleSubmit}>
      <div className="enquiry-planner__field enquiry-planner__field--full">
        <label htmlFor="name">Your name</label>
        <input id="name" name="name" type="text" autoComplete="name" placeholder="How should we address you?" required />
      </div>
      <div className="enquiry-planner__field">
        <label htmlFor="checkIn">Check-in</label>
        <input id="checkIn" name="checkIn" type="date" defaultValue={checkIn} />
      </div>
      <div className="enquiry-planner__field">
        <label htmlFor="checkOut">Check-out</label>
        <input id="checkOut" name="checkOut" type="date" defaultValue={checkOut} onChange={(event) => event.currentTarget.setCustomValidity("")} />
      </div>
      <div className="enquiry-planner__field enquiry-planner__field--full">
        <label htmlFor="guests">Number of guests</label>
        <input id="guests" name="guests" type="number" inputMode="numeric" min="1" max="20" placeholder="Up to 20" />
      </div>
      <div className="enquiry-planner__field enquiry-planner__field--full">
        <label htmlFor="message">Anything we should know?</label>
        <textarea id="message" name="message" rows={4} maxLength={600} placeholder="Tell us a little about your stay…" />
      </div>
      <button type="submit" className="button button--ink enquiry-planner__submit">
        Continue on WhatsApp <ArrowUpRight size={18} aria-hidden="true" />
      </button>
      <p className="enquiry-planner__note">
        This opens a pre-filled WhatsApp message. No payment is taken here.
      </p>
    </form>
  );
}
