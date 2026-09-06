# Booking Provider Comparison

**Context**: South Goa Garden Villa — 3 villa types (1BHK, 4BHK, 5BHK), max 20 guests, currently WhatsApp-only bookings, no existing booking engine, not yet live on OTAs. India market, Goa location.

> [!IMPORTANT]
> "Free trial" is not "free production." All costs recorded here are for production use. All pricing should be confirmed with providers directly before signing. Commission percentages and subscription fees change regularly.

---

## Provider 1: BookingJini

**Source**: [bookingjini.com](https://bookingjini.com) | [Product overview](https://bookingjini.com/booking-engine)

### Is it a true direct booking engine?
**Yes.** BookingJini is a genuine direct booking engine for hotels and resorts. Guests see real-time availability and rates and complete payment on the property's own site without being handed off to an OTA.

### Feature Matrix

| Feature | Status | Notes |
|---|---|---|
| Embeddable widget | ✅ Yes | Customizable "Clever Widget" embedded in the hotel's own website; no OTA redirect |
| Hosted checkout | ✅ Yes | Payment completed within the BookingJini flow |
| API / developer access | ⚠️ Client-only | API access is provided during onboarding; no public developer docs confirmed |
| Real-time availability | ✅ Yes | Synced with PMS |
| Rate management | ✅ Yes | Dynamic pricing with AI-powered rate suggestions; supports promo codes, packages, early-bird |
| Channel manager | ✅ Yes | Connects to 300+ OTAs; prevents overbooking |
| PMS | ✅ Yes | Bundled or integrates with third-party PMS |
| Payment gateway | ✅ Yes | Integrated; supports India payment methods |
| India support | ✅ Yes | Headquartered in India; GST-native; built for Indian hospitality market |
| Admin dashboard | ✅ Yes | Reservation management, reporting, guest communication (Jini Assist AI chatbot) |
| Multi-language/currency | ✅ Yes | Stated in product docs |
| WhatsApp integration | ✅ Yes | AI chatbot can handle WhatsApp enquiries |
| Webhook/API for reservations | ⚠️ Unconfirmed | API access exists but no public documentation for webhooks |
| Data export | ⚠️ Unknown | Must confirm: can reservation data be exported to CSV or connected to custom analytics? |
| Vendor lock-in risk | 🟡 Medium | If the site is fully built around BookingJini's widget, switching requires re-integrating a new engine |

### Pricing

| Fee Type | Value | Notes |
|---|---|---|
| Setup fee | Unknown | **Must be confirmed with sales** |
| Subscription / SaaS fee | Quote-based | No public pricing; customized per property size and module selection |
| OTA commission on direct bookings | **0%** | Direct bookings are commission-free |
| Payment processing fee | Included or pass-through | Confirm whether the gateway fee is bundled or separate |
| Trial | Demo available | Contact sales for a personalized demo |

> [!WARNING]
> BookingJini does not publish pricing. "No OTA commission" means no referral fee to an OTA — it does not mean the platform is free. A subscription cost exists and must be obtained from their sales team.

### Questions That Must Be Confirmed with BookingJini Sales

1. What is the monthly/annual subscription cost for a 3-villa, ≤20-guest property?
2. Is there a per-booking transaction fee in addition to the subscription?
3. Which payment gateways are supported? Does Razorpay or Cashfree work with their checkout?
4. Can reservation webhook events be sent to a custom backend URL?
5. Can booking data be exported or queried via API for analytics purposes?
6. Is there a sandbox/test environment for development integration?
7. Is there a minimum contract period or cancellation penalty?
8. Is the widget mobile-optimized and WCAG-accessible?

---

## Provider 2: eZee Reservation (Yanolja Cloud)

**Source**: [ezeereservation.com](https://www.ezeereservation.com) | [eZee Absolute PMS](https://www.ezeeabsolute.com)

### Is it a true direct booking engine?
**Yes.** eZee Reservation is a commission-free direct booking engine embedded in the hotel's own website.

### Feature Matrix

| Feature | Status | Notes |
|---|---|---|
| Embeddable widget | ✅ Yes | "2-click" booking widget; customizable theme and look; mobile-responsive |
| Hosted checkout | ✅ Yes | Payment within eZee's checkout flow |
| API / developer access | ✅ Yes | eZee has a documented integration API |
| Real-time availability | ✅ Yes | Synced with eZee Absolute PMS |
| Rate management | ✅ Yes | Yield management, promo codes, group bookings, seasonal rates |
| Channel manager | ✅ Yes | Connects to major OTAs; prevents overbooking |
| PMS | ✅ Yes | eZee Absolute PMS (sold separately or bundled) |
| Payment gateway | ✅ Yes | Supports 120+ integrated payment gateways globally |
| India support | ✅ Yes | Established India presence; GST-native; widely used by Indian hotels |
| Admin dashboard | ✅ Yes | Comprehensive PMS-level reservation management |
| Multi-language/currency | ✅ Yes | |
| Webhook/API for reservations | ✅ Yes (API) | API-accessible; check for webhook push vs. pull model |
| Data export | ✅ Yes | Standard reporting and export features in PMS |
| Vendor lock-in risk | 🟡 Medium | Similar to BookingJini; switching engines requires re-integration |

### Pricing

| Fee Type | Value | Notes |
|---|---|---|
| Setup fee | Likely included | Confirm with sales |
| Subscription / SaaS fee | ~₹40,000–₹45,000/year (reported) | For bundled suite (PMS + booking engine + channel manager); smaller or standalone configurations may differ; **confirm with sales** |
| OTA commission on direct bookings | **0%** | |
| Payment processing fee | Pass-through from gateway | Depends on which gateway is configured |
| Trial | 14-day free trial | Available on ezeereservation.com |

### Questions That Must Be Confirmed with eZee Sales

1. Can the booking engine be purchased standalone without the full PMS suite?
2. What is the standalone booking-engine-only subscription cost?
3. Which Indian payment gateways (Razorpay, Cashfree) are pre-integrated?
4. Is the widget accessible (WCAG 2.1 AA)?
5. Can the admin account be restricted so only the booking engine admin is accessible (not full PMS)?
6. Is there a sandbox environment for development testing?

---

## Provider 3: Lodgify

**Source**: [lodgify.com](https://www.lodgify.com) | [Pricing page](https://www.lodgify.com/pricing)

### Is it a true direct booking engine?
**Yes**, for vacation rentals. Lodgify is primarily designed for vacation rental hosts (Airbnb-style properties), not traditional hotel/resort management. The booking engine supports direct bookings commission-free on the host's own website.

### Feature Matrix

| Feature | Status | Notes |
|---|---|---|
| Embeddable widget | ✅ Yes | Bookable widget embedded in website; or use Lodgify's built-in website builder |
| Hosted checkout | ✅ Yes | |
| API / developer access | ✅ Yes | API available for custom integrations |
| Real-time availability | ✅ Yes | Calendar sync with Airbnb, VRBO, Booking.com |
| Rate management | ✅ Yes | Dynamic pricing integrations (Beyond Pricing) |
| Channel manager | ✅ Yes | Airbnb, VRBO, Booking.com, and more |
| PMS | 🟡 Partial | Task management, messaging; not a full hotel PMS |
| Payment gateway | ✅ Yes | Stripe-based (international-first); India Stripe support **must be confirmed** |
| India support | ⚠️ Unclear | Lodgify is a European/global product; Stripe is not natively strong in India for UPI/domestic cards; **this is a significant risk** |
| Admin dashboard | ✅ Yes | Reservation calendar, task management, messaging |
| Multi-language/currency | ✅ Yes | |
| Webhook/API for reservations | ✅ Yes | API-accessible |
| Data export | ✅ Yes | |
| Vendor lock-in risk | 🟡 Medium | |

### Pricing

| Fee Type | Value | Notes |
|---|---|---|
| Setup fee | ₹0 | No setup fees stated |
| Subscription / SaaS fee | ~$13–$20/month (annual, 1 property) | Entry-level "Starter" or "Basic" plan; goes up with property count and features |
| Booking fee on direct bookings | **1.9%** (Starter/Professional plans) | This is a per-booking fee on top of subscription; eliminated only on the "Ultimate" plan |
| OTA commission | Not charged by Lodgify; standard OTA rates apply | |
| Payment processing fee | Stripe rates (varies by country) | ~2.9% + $0.30 internationally; India Stripe fees differ |
| Trial | 7-day free trial (no credit card) | |

> [!CAUTION]
> **Lodgify has a critical India risk**: Its payment processing is built primarily around Stripe. Stripe's India support for domestic UPI and RuPay cards is limited compared to Razorpay or Cashfree. Indian guests paying with UPI or domestic debit cards may face friction or failure. This must be confirmed before selecting Lodgify for an India-market property. Additionally, the 1.9% booking fee on direct reservations makes Lodgify meaningfully more expensive than a subscription-only engine at typical booking volumes.

### Questions That Must Be Confirmed with Lodgify

1. Does Lodgify's payment processing support UPI, RuPay, and domestic Indian debit/credit cards?
2. Can an alternative Indian payment gateway (Razorpay, Cashfree) be plugged in instead of Stripe?
3. Is the "1 property" tier sufficient for a villa that has 3 distinct villa types (1BHK, 4BHK, 5BHK) treated as separate room/unit types?
4. Is the booking engine designed for villa/resort-style properties with named unit types, or only for vacation rental calendars?

---

## Provider 4: Booking.com Affiliate / Partner Program

### Is it a true direct booking engine?
**No.** The Booking.com affiliate program is an OTA referral path — it redirects the guest to Booking.com's website to complete the reservation. This:
- Sends the guest away from the resort's own website
- Gives Booking.com ownership of the guest data and relationship
- Earns Booking.com a 15–25% commission from the property on every booking
- Does not provide the resort with a direct booking capability

**Booking.com is not a direct booking engine for hotels.** It is an OTA that charges commission. It can be used as an *additional distribution channel* alongside a direct booking engine (in which case the direct engine should offer a price-match or price-parity advantage), but it is not a substitute for one.

> [!IMPORTANT]
> Do not treat a Booking.com listing or affiliate widget as a direct booking engine. A Booking.com listing sends guests to Booking.com and costs 15–25% commission per booking. A direct booking engine keeps guests on the resort's own site and captures bookings commission-free.

**Verdict**: Excluded from the recommendation. A Booking.com listing may be useful for OTA distribution and discoverability, but the resort should use a separate direct booking engine for its own website.

---

## Summary and Recommendation

| Criteria | BookingJini | eZee Reservation | Lodgify | Booking.com Affiliate |
|---|---|---|---|---|
| True direct engine | ✅ | ✅ | ✅ | ❌ |
| India payment support | ✅ Strong | ✅ Strong | ⚠️ Unconfirmed (Stripe-based) | N/A |
| India market focus | ✅ | ✅ | ❌ Global-first | ❌ |
| Direct booking fee | 0% (subscription cost) | 0% (subscription cost) | 1.9% + subscription | 15–25% commission |
| Small resort fit | ✅ | ✅ | 🟡 Vacation rental-oriented | N/A |
| Public pricing | ❌ | ⚠️ Partial | ✅ | N/A |
| Channel manager | ✅ | ✅ | ✅ | N/A |
| Sandbox/trial | Demo | 14-day trial | 7-day trial | N/A |
| Vendor lock-in | Medium | Medium | Medium | N/A |

### Primary Recommendation: **BookingJini or eZee Reservation**
Both are India-native, support domestic payment gateways, are built for hotel/resort use (not vacation-rental calendars), and charge zero commission on direct bookings. **BookingJini** is especially worth evaluating because it is specifically designed for the Indian direct-booking market with AI-powered tools, WhatsApp integration, and GST support. **eZee Reservation** has a published 14-day trial, allowing integration testing before commitment.

**Lodgify** is not recommended as the primary engine for this property due to: (a) its Stripe-first payment stack which creates India payment risk, (b) its 1.9% booking fee on direct bookings (lower plans), and (c) its vacation rental orientation rather than hotel/resort.

### What Must Be Confirmed Before Signing
1. Exact pricing for both BookingJini and eZee for a 3-villa-type property
2. Whether India payment gateways (Razorpay or Cashfree) are pre-integrated or can be connected
3. Whether a sandbox/test environment is available for development integration
4. Whether reservation webhook push is supported (for CMS enquiry logging)
5. Whether the booking widget is accessible (keyboard-navigable, WCAG compliant)
