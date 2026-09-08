# Payment Provider Comparison

**Context**: South Goa Garden Villa, India. Guest mix is primarily domestic Indian travelers and international tourists. Payment use cases: booking deposit or full payment through the booking engine's checkout, and optionally a web enquiry form. The booking engine may handle its own payment processing — this comparison is relevant if the selected booking engine requires an external gateway, or if the site adds standalone payment capabilities (e.g., for deposits on direct enquiries).

> [!IMPORTANT]
> **If the selected booking engine (e.g., BookingJini or eZee) includes its own integrated payment processing and that processing supports UPI, cards, and international methods, prefer that integrated path over adding a second gateway.** Two checkout systems create reconciliation complexity and guest confusion. Only add a standalone gateway if the booking engine's payment capability is insufficient.

> [!NOTE]
> All fees listed are based on publicly available data and should be verified against the provider's current rate card. GST applies to the platform fee (not the gross transaction value). Do not treat any promotional or introductory offer as a permanent rate.

---

## Provider 1: Razorpay

**Source**: [razorpay.com/pricing](https://razorpay.com/pricing) | [razorpay.com/docs](https://razorpay.com/docs)

### Overview
Razorpay is India's leading full-stack payment gateway. It is purpose-built for the Indian market with strong support for UPI, domestic cards, net banking, and wallets. It has documented APIs, sandbox environments, webhook support, and is widely used in the Indian SaaS, hospitality, and e-commerce sectors.

### Fee Structure

| Fee Component | Rate | Notes |
|---|---|---|
| Setup fee | ₹0 | Standard merchant accounts have no setup fee |
| Monthly maintenance fee | ₹0 | Standard accounts |
| Domestic UPI, debit cards, net banking, wallets | **2% + 18% GST on platform fee** | Effective rate ≈ 2.36% of transaction value |
| Domestic credit cards (Visa, Mastercard) | **2% + 18% GST** | Effective ≈ 2.36% |
| Premium methods (AmEx, Diners, EMI, Corporate cards) | **3% + 18% GST** | Effective ≈ 3.54% |
| International cards | **3% + 18% GST** | Effective ≈ 3.54%; T+7 settlement |
| International bank transfers | **1% + 18% GST** | Effective ≈ 1.18% |
| Refunds | Processing fee is not refunded on standard accounts | The 2–3% fee is charged on the original transaction; not returned on refund |
| Chargebacks | Dispute fee applies | Confirm current chargeback dispute fee with Razorpay |
| Settlement timeline | T+2 domestic, T+7 international | Standard settlement |
| New merchant promotional offer | Zero platform fee on first ₹5 lakh GMV or 90 days (whichever comes first) | **This is a time-limited promotional offer, not a permanent rate. Do not budget on this basis.** |
| Webhooks | ✅ Yes | Well-documented; supports idempotency keys; retry logic available |
| Sandbox | ✅ Yes | Full test environment at dashboard.razorpay.com |
| KYC/Onboarding | Standard Indian KYC | Aadhaar, PAN, business registration documents; typically completes in 2–5 business days |

### Hospitality / Booking-Specific Features

- **Payment links**: Generate a payment link from the dashboard and send to guests via WhatsApp or email — immediately useful for deposit collection
- **Subscriptions**: Not relevant for this use case
- **Smart routing**: Routes transactions through the highest-success payment method
- **International support**: Acceptable but not as strong as dedicated international gateways
- **Preauthorization (hold)**: Available — useful for damage deposit holds on villa bookings

### Integration Approach
- REST API with SDKs (JavaScript, Node.js, Python, PHP, and more)
- Checkout.js drop-in widget (embeds in the frontend)
- Server-to-server API (PCI-compliant flow)
- No raw card details ever touch the custom frontend (handled by Razorpay's hosted fields or redirect)

---

## Provider 2: Cashfree Payments

**Source**: [cashfree.com](https://www.cashfree.com) | [developer.cashfree.com](https://developer.cashfree.com)

### Overview
Cashfree is a strong Indian payment gateway with hospitality-specific features including preauthorization (critical for hotel damage deposits), payment links, and embedded payment flows. It has a developer-first API and a generous new-merchant promotional offer (which must not be treated as permanent).

### Fee Structure

| Fee Component | Rate | Notes |
|---|---|---|
| Setup fee | ₹0 | No setup fee stated |
| Monthly maintenance fee | ₹0 | Standard accounts |
| Standard domestic transactions | Competitive TDR | **No public flat rate published; must be confirmed with sales for exact rate card** |
| New merchant promotional offer | **0% on first ₹20 lakh GMV** valid until March 31, 2027 | **This is a temporary promotional offer. Post-promotion rates apply. Do not treat this as a permanent zero-fee structure.** |
| International cards | Standard international rate | Confirm with sales |
| Refunds | Depends on plan | Confirm refund fee policy |
| Chargebacks | Dispute fee applies | Confirm |
| Settlement timeline | T+2 domestic (confirm current schedule) | |
| Webhooks | ✅ Yes | Developer docs at developer.cashfree.com |
| Sandbox | ✅ Yes | Full test/UAT environment available |
| KYC/Onboarding | Standard Indian KYC | Similar to Razorpay |

### Hospitality-Specific Features

- **Preauthorization**: ✅ Explicitly documented for hotels — hold funds without charging, void if booking canceled within the window, no TDR charged on voided preauth
- **Payment links**: ✅ Customizable branded payment links (no-code; useful for WhatsApp handoff)
- **Payment forms**: ✅ Embeddable, branded; no custom development required for simple use cases
- **Embedded payments**: ✅ For platform operators who want to offer payment processing to sub-merchants (not applicable here)
- **International support**: Available but confirm support for specific currencies needed

---

## Provider 3: PayU India

**Source**: [payu.in](https://www.payu.in)

### Overview
PayU is a well-established Indian payment gateway (acquired by Prosus/Naspers). It is widely used in hospitality and travel. Its pricing is largely custom/negotiated and not published in a standard rate card.

### Fee Structure

| Fee Component | Rate | Notes |
|---|---|---|
| Setup fee | Typically ₹0 | Confirm with sales |
| Monthly maintenance fee | Negotiated | May be waived for higher-volume merchants |
| Standard domestic transactions | **Custom/negotiated** | No public standard rate card; PayU pricing is volume-based |
| International transactions | ~3% + GST | Confirm with sales |
| Webhooks | ✅ Yes | Available |
| Sandbox | ✅ Yes | |
| KYC/Onboarding | Standard Indian KYC | |

### Hospitality Features
- Preauthorization support: Confirm with PayU sales
- Payment links: Available
- Known hospitality integrations: Integrated with some PMS/booking engine platforms (confirm if it integrates with the chosen booking engine)

> [!NOTE]
> PayU's opaque pricing model makes direct comparison harder. It may offer favorable custom rates for a property that commits to minimum monthly volume, but a small property is unlikely to qualify for volume discounts. Contact sales for a quote before evaluating seriously.

---

## Comparison Summary

| Feature | Razorpay | Cashfree | PayU |
|---|---|---|---|
| Public pricing | ✅ Published | ⚠️ Promotional; standard rate unclear | ❌ Opaque, quote-based |
| Standard domestic rate | ~2.36% (incl. GST) | Not published | Not published |
| International cards | ~3.54% | Confirm | ~3% + GST |
| UPI / RuPay support | ✅ Strong | ✅ Strong | ✅ Strong |
| Preauthorization | ✅ Available | ✅ Documented specifically for hotels | Confirm |
| Payment links (WhatsApp) | ✅ | ✅ | ✅ |
| Sandbox/test env | ✅ | ✅ | ✅ |
| Developer docs quality | ✅ Excellent | ✅ Good | 🟡 Adequate |
| Webhook support | ✅ | ✅ | ✅ |
| India KYC onboarding | Standard 2–5 days | Standard | Standard |
| Hospitality-specific preauth | ✅ Available | ✅ Purpose-built | Confirm |
| Intro promotional offer | ₹5 lakh GMV zero fee (90 days) | ₹20 lakh GMV zero fee (until March 2027) | N/A |

---

## Recommendation

### Primary: **Razorpay**
Razorpay is recommended as the primary gateway if a standalone payment integration is needed. Reasons:
1. Clear published pricing (no hidden rates)
2. Excellent developer documentation and sandbox
3. Strongest India payment coverage (UPI, all domestic card types, international)
4. Payment links immediately useful for the current WhatsApp booking flow during transition
5. Preauthorization available for damage deposits
6. Very high developer community support — integration errors are well-documented

### Fallback / Evaluate: **Cashfree**
Cashfree is a strong alternative if the resort wants to leverage the hospitality-specific preauthorization workflow (better documented than Razorpay's), or if the selected booking engine has a native Cashfree integration. The ₹20 lakh introductory offer is attractive but must not be budgeted as permanent.

### Not Recommended (for small property): **PayU**
PayU's opaque pricing and enterprise-oriented sales process is poorly suited for a small property. Re-evaluate if the chosen booking engine has a native PayU integration with pre-negotiated rates.

---

## Critical Decision Logic

```
Is the booking engine's integrated payment processing sufficient for India payments?
  ├── YES → Use the booking engine's payment flow. No separate gateway needed.
  └── NO or UNKNOWN
       ├── Does the engine support an external gateway?
       │    ├── YES → Integrate Razorpay (primary) or Cashfree (fallback)
       │    └── NO → This is a significant constraint; reconsider engine choice
       └── Is the engine's payment coverage only for international cards?
            └── YES → Razorpay is essential for domestic Indian guest payments
```

### What Must Be Confirmed Before Activating Payments

1. Confirm whether BookingJini or eZee's integrated payment supports UPI, RuPay, and domestic debit/credit cards natively for Indian guests
2. If a separate gateway is needed, confirm which gateways are pre-integrated with the chosen booking engine (to avoid double checkout)
3. Complete KYC onboarding for the selected gateway before development testing (can take 2–5 days)
4. Confirm refund policy: who initiates refunds (resort or booking engine), and what is the fee recovery path
5. Do not store raw card numbers in any custom frontend code, database, or log file at any point
6. Confirm whether GST registration is required for the property before activating paid transactions
7. Set up webhook endpoint and idempotency handling before accepting live transactions
