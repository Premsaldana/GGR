# Hosting and Deployment Options

**Status**: Proposed — no services purchased or deployed  
**Architecture**: Next.js 14+ frontend + Sanity CMS + Booking Engine (external)

> [!IMPORTANT]
> Do not purchase or activate any service based on this document. Confirm the booking engine choice and custom domain before committing to a hosting plan.

---

## Option A: Low-Cost Managed Deployment (Recommended)

This option uses fully managed PaaS services with generous free tiers. No server administration required. Suitable for a small resort team with no in-house DevOps.

### Components

| Component | Service | Plan | Estimated Cost |
|---|---|---|---|
| Frontend + API routes | **Vercel** | Hobby (free) → Pro ($20/month) | $0–$20/month |
| CMS | **Sanity.io** | Free tier | $0/month initially |
| Media / image CDN | Vercel Image Optimization (included) + Sanity asset store | Free | $0 |
| Email delivery | **Resend** | Free (3,000 emails/month) | $0 initially |
| Booking engine | BookingJini or eZee | Subscription (unconfirmed) | ~₹3,000–₹8,000/month |
| Custom domain | Registrar (GoDaddy, Namecheap, etc.) | Annual | ~₹1,000–₹2,000/year |
| SSL certificate | Vercel automatic (Let's Encrypt) | Included | $0 |
| Monitoring | Vercel Analytics (basic) + Vercel logs | Included in Hobby | $0 |
| Error tracking | Sentry free tier | $0 initially | |
| Analytics | Plausible (~$9/month) or Google Analytics 4 (free) | $0–$9/month | |
| **Total custom infra (excluding booking engine)** | | | **~$0–$30/month** |

### Vercel Free (Hobby) vs. Pro

| Limit | Hobby (Free) | Pro ($20/month) |
|---|---|---|
| Bandwidth | 100 GB/month | 1 TB/month |
| Deployments | Unlimited | Unlimited |
| Preview deployments | ✅ | ✅ |
| Custom domain | ✅ | ✅ |
| Team members | 1 | Unlimited |
| Edge functions | 500,000 invocations/month | 1,000,000 |
| Image optimization | 1,000 images/month | 5,000 images/month |
| Analytics | Basic | Advanced |
| Support | Community | Email |

**Assessment for this property**: The Hobby plan is adequate for initial launch and low-to-medium traffic. Upgrade to Pro when: (a) adding a second team member, (b) exceeding 100 GB bandwidth, or (c) needing more than 1,000 image optimizations/month.

### Sanity Free vs. Growth

| Limit | Free | Growth ($15/month) |
|---|---|---|
| Non-admin users | 2 | 25 |
| API CDN requests | 250,000/month | 1,000,000/month |
| Bandwidth | 10 GB/month | 100 GB/month |
| Storage | 10 GB | 100 GB |
| Custom domain for Studio | ❌ | ✅ |

**Assessment**: Sanity Free is sufficient unless more than 2 non-admin editors are needed or traffic grows substantially. The Growth tier at $15/month is very reasonable if needed.

### DNS and Domain

1. Purchase a domain from a registrar (e.g., `southgoagardenresort.com`, `southgoagardenvilla.com`, or `goagardenvilla.com`)
2. Add the domain to Vercel → Vercel provides SSL automatically via Let's Encrypt
3. Update DNS nameservers or add Vercel's A/CNAME records at the registrar

### Deployment Pipeline

```
Developer pushes to `brownfield-branch`
  ↓
Vercel creates a Preview deployment automatically
  ↓
Preview URL shared with owner for approval
  ↓
Merge to `main` branch
  ↓
Vercel deploys to Production automatically
```

### Upgrade Path (when traffic grows)

1. Vercel Hobby → Pro: straightforward upgrade in Vercel dashboard
2. Sanity Free → Growth: straightforward upgrade in Sanity dashboard
3. Resend Free → Pro: upgrade when email volume exceeds 3,000/month
4. No server migration needed — all managed services

---

## Option B: Self-Hosted Deployment

This option uses a VPS (Virtual Private Server) for the Next.js application and database. Suitable only if the team has a developer comfortable with server administration.

### Components

| Component | Service | Estimated Cost |
|---|---|---|
| VPS (Next.js + custom backend) | DigitalOcean Droplet, Hetzner, or AWS EC2 (Mumbai region) | ₹800–₹3,000/month |
| Database | PostgreSQL on the same VPS or PlanetScale (serverless MySQL) | ₹0–₹1,500/month |
| CMS | Sanity (same as Option A) or Strapi self-hosted on the VPS | $0 (Strapi) |
| Media storage | Cloudinary free tier or S3-compatible object storage | ₹0–₹1,000/month |
| Email | Same as Option A (Resend) | $0 initially |
| SSL | Caddy or Nginx with Let's Encrypt | $0 |
| Monitoring | Prometheus + Grafana or Datadog (expensive) | ₹0–₹3,000/month |
| Backups | VPS snapshot ($1–2/month) + pg_dump to S3 | ₹500–₹1,000/month |
| Custom domain | Same as Option A | Same |
| **Total** | | **₹2,000–₹10,000/month + developer time** |

### Self-Hosting Responsibilities

The resort team (or a retained developer) would be responsible for:

| Responsibility | Frequency | Skill Required |
|---|---|---|
| OS security patches | Monthly | Linux sysadmin |
| Node.js/Next.js updates | Quarterly | Node.js developer |
| Database backups and verification | Weekly | DBA basics |
| SSL certificate renewal (auto with Caddy) | Annual | Automated |
| Incident response (downtime) | On failure | DevOps |
| Scaling (add more resources) | When traffic grows | Cloud console |
| Strapi CMS updates | Quarterly (if using Strapi) | Node.js developer |

**Assessment**: Self-hosting is significantly more complex and only saves meaningful money at high traffic volumes. For a small resort with limited technical resources, the operational burden of managing a VPS outweighs the cost savings. Self-hosting is not recommended for this project.

---

## Comparison

| Dimension | Option A: Managed (Vercel + Sanity) | Option B: Self-Hosted VPS |
|---|---|---|
| Monthly cost | $0–$30 (+ booking engine) | ₹2,000–₹10,000 (+ developer time) |
| SSL | Automatic | Manual (though automatable) |
| Preview deployments | ✅ Automatic (every branch) | ❌ Manual setup |
| Scaling | Automatic | Manual (resize VPS or add load balancer) |
| Server maintenance | None | Developer required |
| Backup responsibility | Managed by Vercel/Sanity | Resort team |
| Database | Not needed (CMS is Sanity) | PostgreSQL managed by team |
| Uptime SLA | 99.99% (Vercel) | Depends on VPS tier |
| India latency | Excellent (Vercel Edge + Sanity CDN) | Good if Mumbai region selected |
| Incident response | Vercel handles infra; team handles app | Team handles everything |
| Operational skill required | Minimal (Git push = deploy) | Linux + Node.js + DB admin |

---

## Recommendation: **Option A — Managed (Vercel + Sanity)**

**Rationale**:
1. The resort has no in-house DevOps or permanent developer
2. Vercel provides automatic preview deployments, which are essential for the brownfield strangler migration pattern (test before cutover)
3. Sanity's managed CMS hosting means zero server responsibility for the CMS
4. The free tiers of Vercel and Sanity are sufficient for this property's scale
5. The total custom infrastructure cost is $0–$30/month, which is far below the cost of a developer managing a VPS
6. SSL, CDN, and image optimization are handled automatically
7. The upgrade path (Hobby → Pro, Free → Growth) is straightforward and reversible
8. If hosting requirements change in the future (e.g., a custom backend for a reservation system), a separate backend service (Railway, Render, or a small DigitalOcean Droplet) can be added without migrating the frontend

---

## Pre-Launch Infrastructure Checklist

- [ ] Custom domain purchased and DNS configured at registrar
- [ ] Vercel account created; domain added; SSL active
- [ ] Sanity project created; production dataset configured
- [ ] Environment variables added to Vercel (production + preview)
- [ ] Environment variables saved in a secure offline location (password manager)
- [ ] Resend account created; sending domain verified (requires DNS TXT record)
- [ ] Booking engine widget embed code obtained from provider
- [ ] Booking engine sandbox/test environment configured for staging
- [ ] Payment gateway sandbox configured (if not handled by booking engine)
- [ ] Preview deployment tested end-to-end (booking CTA, enquiry form, image loading)
- [ ] Monitoring/alerting configured in Vercel dashboard
- [ ] Rollback plan documented (revert to legacy static site at any time by restoring legacy files)
- [ ] Legacy static files preserved at commit `9f20b46` and in the `legacy/` folder

---

## Backup Strategy

| Data | Backup Method | Frequency | Owner |
|---|---|---|---|
| Next.js source code | Git → GitHub (`brownfield-branch` + `main`) | Every commit | Developer |
| Sanity content | Sanity automatic snapshots | Daily | Sanity (automatic) |
| Sanity content export | `sanity dataset export` script | Weekly or on-demand | Developer/Admin |
| Environment variables | Secure offline copy (password manager) | On change | Resort owner |
| Booking engine data | Booking engine's own backups | Provider-managed | Provider |
| Enquiry emails | Gmail inbox (resort's email) | Continuous | Gmail |

---

## Estimated Timeline to First Deployment

| Milestone | Effort | Blocker |
|---|---|---|
| Domain purchase | 1 hour | Owner decision on domain name |
| Vercel + Sanity setup | 2–4 hours | None |
| Booking engine account + sandbox | 1–5 business days | Provider KYC and account approval |
| Payment gateway KYC | 2–5 business days | If separate gateway needed |
| First preview deployment | 1–2 weeks of dev | Phase 3 implementation |
| Staff CMS training | 2–4 hours | After content is populated |
| DNS cutover | 1 hour + 24–48h propagation | Owner approval |
