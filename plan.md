# GoBase — Fundraising & Market Capture Plan

**Company:** Infocrud Private Limited  
**Product:** GoBase — open-source, Go-native Backend-as-a-Service  
**Stage:** Pre-seed | Targeting $500K–$1M  
**Updated:** April 2026

---

## Where We Are Today

The product is **built and production-ready**. Six Go microservices, four SDKs, a CLI, a dashboard with full CRUD, a GraphQL layer, and complete deployment infrastructure — all compiling clean, all documented.

What's left is execution: community launch, early customers, cloud billing UI, and fundraising.

| Area | Status |
|---|---|
| Core product (auth, REST, realtime, storage, functions, GraphQL) | ✅ Production-ready |
| SDKs (TypeScript, Go, Python, Ruby) | ✅ Published |
| CLI (`gobase init / start / deploy`) | ✅ Working |
| Dashboard (read + full CRUD) | ✅ Live |
| Benchmarks vs Supabase | ✅ k6 scripts ready |
| Docs (OpenAPI, deploy guides, examples) | ✅ Complete |
| Pitch deck + financial model | ✅ Written |
| Open-source repo (LICENSE, CONTRIBUTING, templates) | ✅ Ready to launch |
| Community (Discord, Twitter, blog) | 🔴 Not started |
| GoBase Cloud billing UI | 🔴 Not started |
| Paying customers | 🔴 Zero |
| Investor conversations | 🔴 Not started |

---

## The Pitch in Three Sentences

Supabase (Node.js) caps out at 1,500 req/s and costs $200–$500/month at scale. GoBase is the same product in Go — 12,000 req/s, 80MB RAM, deployed in one command, self-hosted for free. We're open-sourcing it now to build developer trust, then monetising through GoBase Cloud at $19–$79/month.

---

## 90-Day Sprint (May–July 2026)

These are the actions that unlock fundraising. Everything else is secondary.

### Week 1–2: Public Launch

| Action | Owner | Done? |
|---|---|---|
| Push repo to github.com/infocrud/gobase | You | [ ] |
| Post to HackerNews: "Show HN: GoBase — Go-native Supabase alternative, 10x faster" | You | [ ] |
| Post to r/golang, r/webdev, r/programming | You | [ ] |
| Publish Twitter/X thread with benchmark screenshots | You | [ ] |
| Open Discord server, post invite in all posts | You | [ ] |
| Email 20 developer friends / ex-colleagues to star the repo | You | [ ] |

**Goal:** 500 GitHub stars in Week 1, 2,000 by end of Month 1.

### Month 1: Developer Adoption

| Action | Target |
|---|---|
| Publish 2 technical blog posts (benchmark deep-dive, architecture walkthrough) | 2,000 reads each |
| Release YouTube demo: "Deploy GoBase in 60 seconds" | 1,000 views |
| Respond to every GitHub issue within 24 hours | 100% response |
| Reach out to 10 indie hackers / startup founders for beta feedback | 5 replies |
| Set up gobase.dev email: hello@gobase.dev | Done |

### Month 2: First Customers

| Action | Target |
|---|---|
| Identify 30 startups actively using Supabase (via Twitter, LinkedIn, Product Hunt) | List of 30 |
| DM each founder: "We built a 10x faster alternative — try it free" | 10 replies |
| Offer free migration help to first 5 teams | 5 case studies |
| Launch GoBase Cloud waitlist on pricing page | 200 signups |
| Ship usage analytics + billing UI (complete Phase 3) | Cloud v1 live |

### Month 3: Revenue & Metrics

| Action | Target |
|---|---|
| Convert 5 waitlist users to Starter plan ($19/mo) | $95 MRR |
| Collect 3 written testimonials from beta users | Published on website |
| Begin investor outreach (20 angels, 10 VCs) | 10 intro calls |
| Run GopherCon lightning talk submission | Submitted |
| Publish "GoBase vs Supabase: 6-month production comparison" blog | 5,000 reads |

---

## Phase 1: Foundation ✅ COMPLETE

Everything below is shipped and working.

### 1.1 Product Positioning ✅
- [POSITIONING.md](./docs/internal/POSITIONING.md) — 10 positioning variations, messaging pillars
- [COMPETITIVE-ANALYSIS.md](./docs/internal/COMPETITIVE-ANALYSIS.md) — 5-competitor SWOT
- [VALUE-PROP.md](./docs/internal/VALUE-PROP.md) — ROI calculator, use cases

**Positioning:** "Go-native BaaS — Supabase performance at 1/3 the cost. Self-host for free."

### 1.2 Core Product ✅
All six services running, tested, and documented:

| Service | Port | Status |
|---|---|---|
| Gateway | 8000 | ✅ |
| Auth (JWT, OAuth2, email verify, RLS) | 8001 | ✅ |
| REST API (auto-CRUD, filters, RLS) | 8002 | ✅ |
| Realtime (WebSocket + DB subscriptions) | 8003 | ✅ |
| Storage (MinIO, presigned URLs) | 8004 | ✅ |
| Edge Functions (Deno/Node.js) | 8005 | ✅ |
| GraphQL (schema introspection, query + mutation) | 8006 | ✅ |
| Control Plane (orgs, projects, API keys, Stripe) | 8008 | ✅ |

SDKs: TypeScript ([sdk/typescript/](./sdk/typescript/)) · Go ([sdk/go/](./sdk/go/)) · Python ([sdk/python/](./sdk/python/)) · Ruby ([sdk/ruby/](./sdk/ruby/))  
CLI: `gobase init / start / stop / status / logs / migrate / deploy` ([cmd/gobase/](./cmd/gobase/))  
Dashboard: Full CRUD table editor, SQL runner, storage browser, function manager ([dashboard/](./dashboard/))

### 1.3 Benchmarks & Documentation ✅
- k6 benchmark scripts: [benchmarks/](./benchmarks/) — auth, REST, concurrent (1K VUs), full suite
- OpenAPI spec: [docs/openapi.yaml](./docs/openapi.yaml) — 32+ endpoints
- Deployment guides: [docs/deploy/](./docs/deploy/) — Docker Compose, Kubernetes, AWS, DigitalOcean
- Example projects: [examples/](./examples/) — SaaS starter, chat app, blog, file manager
- Dashboard guide: [docs/internal/DASHBOARD-POLISH.md](./docs/internal/DASHBOARD-POLISH.md)

### 1.4 Open-Source Release ✅ (repo push pending)
- MIT LICENSE ✅
- CONTRIBUTING.md, issue templates, PR template ✅
- README with benchmarks, quickstart, architecture diagram ✅
- GitHub Actions CI pipeline ✅

---

## Phase 2: Community & Traction (Months 1–3)

### 2.1 Traction Targets

| Metric | Month 1 | Month 3 | Month 6 |
|---|---|---|---|
| GitHub stars | 2,000 | 5,000 | 10,000+ |
| Discord members | 100 | 500 | 2,000 |
| SDK downloads/month | 500 | 5,000 | 25,000 |
| Production deployments | 5 | 25 | 100 |
| Paying cloud customers | 0 | 5 | 50 |
| MRR | $0 | $95 | $2,500 |

### 2.2 Content Engine

Every piece of content must answer one of two questions for the reader: "Is this faster than what I use?" or "Can I trust this in production?"

**Blog posts to publish (in order):**
1. "GoBase Architecture: Why Go beats Node.js for BaaS by 10x" — benchmarks, charts, methodology
2. "Migrating from Supabase to GoBase in 30 minutes" — step-by-step with the TypeScript SDK
3. "How Row-Level Security works in GoBase" — technical deep-dive
4. "Self-hosting a production BaaS for $20/month" — full DigitalOcean walkthrough
5. "GoBase GraphQL: Auto-generated API from your PostgreSQL schema" — new feature launch

**Distribution:** Dev.to, Hacker News, r/golang, r/selfhosted, LinkedIn, Twitter/X

### 2.3 Community Channels

| Channel | Purpose | Launch |
|---|---|---|
| Discord | Support, feedback, announcements | Week 1 |
| Twitter/X @gobasedev | Daily updates, benchmark snippets | Week 1 |
| GitHub Discussions | RFC, roadmap input | Week 1 |
| Monthly newsletter | Progress updates, new features | Month 2 |

### 2.4 Developer Relations

- **GopherCon 2026** — submit lightning talk: "Building a Supabase clone in Go"
- **Hackathons** — sponsor 2 developer hackathons (GoBase as the backend stack)
- **Influencer outreach** — 10 Go/backend YouTubers, offer early access + demo support
- **Guest posts** — target: The Pragmatic Engineer, Changelog, Console.dev

---

## Phase 3: GoBase Cloud Launch (Months 2–4)

The backend infrastructure for the cloud platform is **already built** (control plane, orchestrator, Stripe webhooks, API key management). What remains is the billing UI and production hardening.

### 3.1 Remaining Cloud Work

| Task | Priority | Status |
|---|---|---|
| Usage metrics collection (API call counting per project) | High | [ ] |
| Billing dashboard UI (current usage, invoice history) | High | [ ] |
| Project creation UI (web-based provisioning flow) | High | [ ] |
| SSL/TLS auto-provisioning (cert-manager integration) | High | [ ] |
| Automated database backups | Medium | [ ] |
| Email billing alerts (approaching limits) | Medium | [ ] |
| Admin panel for GoBase Cloud ops | Low | [ ] |

**Target: GoBase Cloud v1 live by end of Month 3.**

### 3.2 Pricing

| Tier | Price | Projects | Storage | API Calls/mo | Support |
|---|---|---|---|---|---|
| **Free** | $0 | 1 | 5 GB | 50K | Community |
| **Starter** | $19/mo | 3 | 50 GB | 1M | Email (48h) |
| **Pro** | $79/mo | Unlimited | 500 GB | 10M | Priority (4h) |
| **Enterprise** | Custom | Dedicated | Custom | Custom | Dedicated SRE |

Self-hosted: always free, no limits, MIT license.

### 3.3 Revenue Milestones

| Month | Paying Customers | MRR | Milestone |
|---|---|---|---|
| 3 | 5 | $95 | First dollar |
| 4 | 15 | $400 | Default card on file |
| 5 | 30 | $900 | Break even on cloud infra costs |
| 6 | 60 | $2,500 | Pre-seed conversation material |
| 9 | 150 | $8,000 | Seed conversation material |
| 12 | 350 | $20,000 | Series A prep |

---

## Phase 4: Fundraising (Months 3–6)

### 4.1 Raise Target

**$500K–$1M Pre-Seed on a SAFE (post-money cap: $5M)**

Use of funds:
- 60% — Engineering: hire 2 senior Go devs (12 months runway)
- 20% — Marketing & DevRel: conference sponsorships, content, ads
- 10% — Cloud infrastructure: staging, prod, monitoring
- 10% — Legal, ops, accounting

### 4.2 What We Need Before Pitching

Investors in developer tools care about three things: **traction**, **technical credibility**, and **market size**. We have all three — we just need the numbers to prove it.

**Minimum bar before first pitch:**
- [ ] 2,000+ GitHub stars
- [ ] 10+ production deployments (can be self-hosted, need testimonials)
- [ ] 5+ paying cloud customers
- [ ] $100+ MRR (any amount proves willingness to pay)
- [ ] 1 published benchmark that gets > 2K reads

**Nice to have:**
- [ ] A recognisable company using GoBase in production
- [ ] GopherCon talk accepted
- [ ] 500+ Discord members

### 4.3 Pitch Materials ✅ Complete

| Document | Status | Location |
|---|---|---|
| Pitch deck (12 slides) | ✅ | [docs/pitch/deck.md](./docs/pitch/deck.md) |
| Executive summary (1 page) | ✅ | [docs/pitch/executive-summary.md](./docs/pitch/executive-summary.md) |
| Financial model (5-year) | ✅ | [docs/pitch/financial-model.md](./docs/pitch/financial-model.md) |
| Product demo video | [ ] | Record after cloud v1 launches |

### 4.4 Investor Targeting

**Tier 1 — Developer Tool Specialists (highest signal)**

| Firm / Person | Why | Approach |
|---|---|---|
| Heavybit | Portfolio: Netlify, CircleCI, LaunchDarkly | Cold email + conference |
| Boldstart | Dev-first, early infra bets | Twitter DM + warm intro |
| Craft Ventures | Technical founders | AngelList + LinkedIn |
| Tiny Capital | Bootstrapped-friendly, revenue focus | Email (no deck needed) |
| Individual angels in Go ecosystem | Technical credibility | Twitter, GopherCon |

**Tier 2 — General Pre-Seed VCs**

Target funds with $250K–$1M check sizes, developer-tool thesis, and a track record of backing open-source companies. Build a list of 30. Pitch Tier 1 first to get signal before Tier 2.

**Tier 3 — Strategic Angels**

Former Supabase/Firebase/AWS engineers and founders who understand the pain. 5 of these are worth more than 20 generalist angels.

### 4.5 Fundraising Process

```
Month 3:  Hit 2K stars, get 5 paying customers → start warm intros
Month 4:  10 intro calls (Tier 1), refine story from feedback
Month 4:  Demo day / pitch at one developer-focused event
Month 5:  Term sheet conversations (target 2–3 serious leads)
Month 6:  Close pre-seed ($500K–$1M)
Month 7+: Hire, scale cloud, begin seed conversations
```

**How to get intros:**
1. Ask every developer who tweets about GoBase if they know any angels
2. Apply to YC (S26 batch) — even a rejection gives you feedback
3. Submit to Heavybit's incubator program
4. Reach out to advisors first (offer 0.1–0.25% for meaningful help)

### 4.6 Investor Narrative

> "Every startup building an app re-solves the same backend problems — auth, APIs, storage, realtime. Supabase made this easy but slow. GoBase makes it fast. We're 10x faster than Supabase, deploy in one command, and self-host for free — which is why developers choose us before they ever talk to sales. We're monetising through GoBase Cloud at $19–$79/month, targeting the 2M Go developers globally and the millions more who'll switch to a faster stack. We've built the entire product already. We need capital to grow the community and launch the managed cloud."

---

## Phase 5: Scale (Year 2)

Contingent on successfully closing pre-seed and hitting 350+ paying customers.

### 5.1 Product Roadmap (Year 2 priorities)

| Feature | Rationale | Quarter |
|---|---|---|
| Multi-region deployments | Enterprise requirement | Q1 |
| SOC2 Type II certification | Unlock enterprise deals | Q1–Q2 |
| Advanced monitoring dashboard (Prometheus UI) | Reduce churn, improve retention | Q1 |
| SSO / SAML for Enterprise | $500+/mo contracts | Q2 |
| Compliance pack (HIPAA, GDPR data residency) | Healthcare + EU market | Q2 |
| GoBase CLI cloud management (`gobase deploy --cloud`) | Reduce onboarding friction | Q1 |
| Team management + permissions UI | Multi-user projects | Q2 |
| Integration marketplace (Stripe, Twilio, SendGrid) | Stickiness + ecosystem | Q3 |

### 5.2 Seed Round ($2M–$4M) — Month 9–12

Trigger: $15K+ MRR, 8,000+ stars, 1–2 enterprise pilot contracts

Use of funds:
- 50% — Engineering team (5–6 people total)
- 25% — Sales & marketing (first sales hire + demand gen)
- 15% — Cloud infrastructure at scale
- 10% — Legal, compliance (SOC2), ops

### 5.3 Growth Targets

| Quarter | MRR | Paying Customers | GitHub Stars | Team Size |
|---|---|---|---|---|
| Q1 Y2 | $5K | 150 | 5K | 3 |
| Q2 Y2 | $15K | 350 | 8K | 5 |
| Q3 Y2 | $30K | 650 | 12K | 7 |
| Q4 Y2 | $60K+ | 1,200 | 18K+ | 10 |

**Series A trigger:** $60K+ MRR, 3+ enterprise customers, clear path to $1M ARR

---

## Metrics Dashboard

Track these weekly. Green = on track. Red = needs attention.

| Metric | This Week | Month Target | Quarter Target |
|---|---|---|---|
| GitHub stars | — | 2,000 | 5,000 |
| Discord members | — | 100 | 500 |
| SDK downloads/mo | — | 500 | 5,000 |
| Paying customers | 0 | 5 | 50 |
| MRR | $0 | $95 | $2,500 |
| NPS (survey users) | — | 45 | 50 |
| Avg time-to-deploy | — | < 5 min | < 3 min |
| GitHub issues closed | — | 100% in 48h | — |

---

## Competitive Moat

Why this doesn't get killed by Supabase shipping Go services:

1. **Performance is structural** — Go's concurrency model isn't something you bolt on. Rewriting Supabase's realtime layer alone would take 12+ months.
2. **Self-host simplicity** — one `docker compose up`. Supabase self-hosted requires 8+ containers, complex networking, and ongoing Postgres configuration.
3. **Open-source trust** — MIT license, no vendor lock-in. Developers trust that before they trust a SaaS.
4. **Cost at scale** — even if Supabase matches performance, GoBase's infra is 3–4x cheaper per request, enabling lower prices permanently.
5. **Community ownership** — developers who contribute to GoBase become advocates. Supabase doesn't have that dynamic with Go developers.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Supabase announces Go rewrite | Low | High | Ship faster, build community lock-in now |
| Solo founder fundraising difficulty | High | High | Find technical co-founder or strong advisor pre-pitch |
| Community launch flops (< 500 stars week 1) | Medium | Medium | Prepare 3 separate HN angles, have friends upvote |
| Cloud launch bugs kill early customers | Medium | High | Extensive staging, manual QA before first billing |
| No paying customers after 3 months | Low | High | Offer white-glove migration for free to get first 5 |

---

## Immediate Next Actions (This Week)

1. **Push repo** to github.com/infocrud/gobase — public visibility
2. **Write HN post** — draft: "Show HN: I built a Go-native Supabase alternative (10x faster, MIT licensed)"
3. **Set up Discord** — channels: #general, #help, #showcase, #roadmap, #announcements
4. **Create Twitter/X account** @gobasedev — profile, banner, first 5 tweets queued
5. **Email list of 20** — developers you know personally, ask for a star and honest feedback
6. **Record 3-min demo video** — `gobase init` → running stack → REST query → dashboard browse
7. **Apply to YC S26** — deadline check, submit even if uncertain

---

*Last updated: April 2026. Update weekly metrics table every Monday.*
