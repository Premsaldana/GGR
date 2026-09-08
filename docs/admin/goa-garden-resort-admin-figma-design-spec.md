# Figma Design Specification

## Goa Garden Resort Admin Calendar, Billing and UPI QR

## Design direction

The admin interface should feel like a calm, premium operations desk rather than a generic SaaS dashboard. Use a deep botanical sidebar, warm mineral content canvas, terracotta accent for primary actions, brass/gold for money and payment cues, and restrained red only for destructive or blocking states. The interface should be information-dense enough for operations but visually quiet enough to reduce mistakes.

## Core tokens

| Token | Value | Use |
| --- | --- | --- |
| Ink | `#1D2422` | Primary text and dark navigation |
| Botanical | `#233B35` | Sidebar, confirmed state, deep surfaces |
| Mineral | `#F5F1E9` | Main background |
| Shell | `#FFFCF6` | Cards and forms |
| Terracotta | `#B75E3C` | Primary action and selected dates |
| Brass | `#B88A3B` | Payment/amount emphasis |
| Sage | `#718779` | Secondary status |
| Mist | `#E8E1D6` | Borders and dividers |
| Danger | `#B8463D` | Conflicts and destructive actions |
| Display type | Cormorant Garamond or equivalent | Page titles and resort identity |
| UI type | Inter or equivalent | Tables, labels, inputs, controls |

## Screen inventory

1. Sign in.

1. Dashboard overview.

1. Calendar month view.

1. Calendar week view or responsive compact view.

1. New reservation drawer.

1. Reservation detail.

1. Invoice editor.

1. Invoice preview.

1. QR payment panel.

1. Manual payment confirmation.

1. Empty/error/loading/unauthorized states.

## Prototype flow

`Sign in → Dashboard → Calendar → Empty date → New reservation → Invoice preview → Generate QR → Payment status → Reservation detail`

## Component inventory

Sidebar navigation, top bar, date picker, month grid, reservation span, status badge, guest avatar/initial, metric card, form section, money input, line-item table, invoice preview, QR card, audit timeline, confirmation dialog, toast, empty state, conflict warning, skeleton loader, error panel, and print/download action group.

## Interaction principles

Selecting an empty date should preserve the chosen date and open the form without losing calendar context. Selecting an occupied date should open the reservation detail, not overwrite it. Any date conflict must appear before save with the conflicting reservation clearly identified. Invoice totals should update in a visible summary rail, while the server remains authoritative. The QR screen should show the encoded amount and a non-payment-confirmation disclaimer beside the QR. Destructive actions require confirmation. All controls require keyboard focus and visible state.

## Responsive behavior

On desktop, use a persistent sidebar and two-column form/summary layout. On tablet, collapse the sidebar and preserve the calendar’s date hierarchy. On mobile, use a compact top bar, stacked form sections, a horizontally scrollable or list-based calendar, and a full-width invoice/QR summary. Never hide critical totals or payment status behind hover.

## Figma approval criteria

The Figma file is ready for approval when the owner can follow the complete prototype flow, understand the selected QR amount, distinguish draft/issued/paid states, see empty and conflict calendar states, inspect the invoice layout against the supplied template, and review the responsive behavior without needing implementation knowledge.