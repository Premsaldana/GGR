# Staging Deployment Plan (Phase 4)

This document outlines the strategy for deploying the Phase 4 isolated frontend to a staging environment for Owner review.

## 1. Recommended Staging Platform
**Platform:** Vercel (Recommended) or Netlify.
**Reasoning:** Vercel is the native platform for Next.js 16 (App Router). It provides zero-configuration deployment, automatic PR preview environments, out-of-the-box Turbopack build optimization, and automatic HTTPS.

## 2. Pre-Deployment Configuration Verification
We have verified the integrity of the application for a safe deployment:
- **Build Status:** `npm run build`, `npm run lint`, and TypeScript checks all pass flawlessly.
- **Unicorn Studio:** `NEXT_PUBLIC_ENABLE_UNICORN` defaults to `false` preventing accidental WebGL rendering on staging.
- **Indexing & SEO Safety:** `robots.ts` explicitly blocks `*.vercel.app` and `localhost` from being indexed. `sitemap.ts` and Canonical URLs are safely governed by the `NEXT_PUBLIC_SITE_URL` variable, ensuring the future production domain is not prematurely poisoned.
- **Secrets & Credentials:** No CMS, Payment, or Backend secrets are present. The repository contains only safe, static UI code.

## 3. Required Environment Variables
For the staging deployment, the following variables must be configured in the Vercel/Netlify dashboard:

| Variable | Value (Staging) | Purpose |
|----------|-----------------|---------|
| `NEXT_PUBLIC_SITE_URL` | e.g. `https://ggr-staging.vercel.app` | Drives canonical links and the sitemap. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `917813093075` | Populates contact links. |
| `NEXT_PUBLIC_ENABLE_UNICORN` | `false` | Keeps 3D enhancements off by default. |

*(No other keys like `SANITY_API_TOKEN` or `RESEND_API_KEY` should be added yet).*

## 4. Required Credentials / Account Access
To proceed with deployment, we require one of the following:
1. **GitHub/GitLab Integration:** You link the repository to a Vercel/Netlify account, and the build runs automatically.
2. **Vercel CLI Authorization:** If you want me to deploy it from the terminal directly, I will need you to authenticate the `vercel cli` (e.g. by providing a VERCEL_TOKEN) or authorize a Vercel login manually.

> **ACTION REQUIRED:** We cannot proceed with actual deployment without an authorized Vercel/Netlify account. Please advise if you will deploy this manually via GitHub, or if you would like me to push it via a provided Vercel Token.

## 5. Rollback Method
Vercel automatically provisions immutable deployments. If a visual defect is found during the Owner review:
- We can instantly revert to a previous working commit via the Vercel Dashboard (Instant Rollback).
- Since no CMS or database migrations are involved, the frontend rollback carries zero risk of data loss.

## 6. Post-Deployment Smoke-Test URLs
Once the staging URL is generated (e.g., `https://ggr-staging.vercel.app`), the following critical paths must be verified on both Desktop and Mobile:
1. `[STAGING_URL]/` (Homepage UI & LCP Priority)
2. `[STAGING_URL]/stay` (Room Listing)
3. `[STAGING_URL]/stay/1-bedroom-villa` (Detail routing and capacity facts)
4. `[STAGING_URL]/contact` (Enquiry form rendering)
