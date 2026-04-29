# GoBase — Pitch Deck

**Pre-Seed | $500K–$1M**  
**Infocrud Private Limited | 2026**

---

## Slide 1 — Cover

**GoBase**  
*The performance-first, open-source Backend-as-a-Service*

> "Supabase is great. GoBase is 10× faster."

---

## Slide 2 — The Problem

**Backend infrastructure is slow, expensive, and complex.**

- Supabase (Node.js) maxes out at ~1,500 req/s per instance under load
- At scale, Supabase Pro + overages hits **$200–$500/mo** for mid-size apps
- Self-hosting Supabase requires 8+ containers and expert DevOps
- Developer time wasted on auth, storage, and API boilerplate every project

**Pain is real:** Every startup building an app re-solves the same backend problems.

---

## Slide 3 — The Solution

**GoBase: A Go-native BaaS that's 10× faster at 1/3 the cost.**

| Feature | GoBase | Supabase |
|---|---|---|
| REST API throughput | **12,000 req/s** | 1,500–2,000 req/s |
| p95 latency | **< 5ms** | 20–50ms |
| Memory per instance | **~80 MB** | ~400 MB |
| Self-host complexity | **1 command** | 8+ containers |
| Monthly cost (50K users) | **~$20 infra** | $25+ base + overages |

Same features. Better performance. Fraction of the cost.

---

## Slide 4 — Product

**Six production-ready microservices behind a single gateway:**

```
Client → Gateway :8000
              ├── Auth        — JWT, OAuth2 (Google/GitHub), email verify, RLS
              ├── REST API    — Auto-generated CRUD on any PostgreSQL table
              ├── Realtime    — WebSocket subscriptions + DB-change events
              ├── Storage     — MinIO/S3 file upload, signed URLs
              ├── Functions   — Edge function runner (Deno/Node.js)
              └── GraphQL     — Auto-generated GraphQL from schema (NEW)
```

**SDKs:** TypeScript, Go, Python, Ruby  
**CLI:** `gobase init && gobase start` — running in 30 seconds  
**Dashboard:** Beta read/write UI

---

## Slide 5 — Traction

*(To be updated with real metrics at time of pitch)*

- ⭐ **[X] GitHub stars** since launch
- 📦 **[Y] SDK downloads/month** (npm + PyPI)
- 🔌 **[Z] production deployments** (self-reported)
- 📝 **[N] Discord members** in community server
- 🔗 Featured on: HackerNews, r/golang, r/webdev

---

## Slide 6 — Market

**Backend-as-a-Service market: $7.1B (2024) → $20B+ (2028)**  
CAGR: ~29% | Driven by: developer productivity, startup velocity, AI-generated apps

**Target segments:**
1. **Indie developers & startups** — self-host free, upgrade to cloud
2. **Scale-ups** — migrate from Supabase to cut infra bills
3. **Enterprises** — on-premise + compliance (SOC2, HIPAA pipeline)

**Beachhead:** Open-source Go community (2M+ Go developers globally)

---

## Slide 7 — Business Model

**Three revenue streams:**

| Stream | Timing | Model |
|---|---|---|
| GoBase Cloud (Managed) | Q3 2026 | Usage-based SaaS |
| GoBase Enterprise | Q4 2026 | Annual license + support |
| Professional Services | Q4 2026 | Migration, integration |

**Cloud pricing:**
- Free: 1 project, 5 GB storage, 50K API calls/mo
- Starter: $19/mo — 3 projects, 50 GB, 1M calls
- Pro: $79/mo — unlimited projects, 500 GB, 10M calls
- Enterprise: Custom

**Unit economics (Pro):** ~85% gross margin (infra cost ~$12/mo at scale)

---

## Slide 8 — Go-to-Market

**Phase 1 — Developer adoption (now)**
- Open-source launch → HackerNews, r/golang, r/webdev
- Goal: 2,000 GitHub stars, 500 Discord members

**Phase 2 — Community → Commercial (Month 4–6)**
- 10 early-access cloud customers
- Technical blog content (benchmarks, migration guides)
- Conference talks: GopherCon, KubeCon

**Phase 3 — Enterprise sales (Month 9+)**
- Dedicated sales for $5K+/mo contracts
- AWS/GCP marketplace listings
- SOC2 Type II certification

---

## Slide 9 — Competition

| Company | Language | Open Source | Self-host | Performance |
|---|---|---|---|---|
| **GoBase** | Go | ✓ MIT | ✓ 1 cmd | ⚡ 12K req/s |
| Supabase | Node.js | ✓ Apache | ✓ complex | 1.5K req/s |
| Firebase | Node.js | ✗ | ✗ | N/A |
| PocketBase | Go | ✓ MIT | ✓ | ~5K req/s |
| Appwrite | PHP | ✓ BSD | ✓ | ~2K req/s |

**GoBase moat:** Go performance + auto-generated REST+GraphQL + RLS + production-ready from day 1.

**vs PocketBase:** GoBase is microservices (scale each component), supports PostgreSQL (not SQLite), has enterprise-grade auth and storage.

---

## Slide 10 — Team

**[Your Name]** — Founder & CEO  
*[Background: X years building production Go systems, former [Company]]*

**Looking for:**
- Co-founder (CTO or GTM) — will negotiate equity
- Senior Go engineer (post-seed hire)
- DevRel / Community lead (post-seed hire)

---

## Slide 11 — Financials

*(See financial-model.md for 5-year projections)*

**Pre-seed use of funds ($500K–$1M):**

| Category | % | Amount |
|---|---|---|
| Engineering (2 devs, 12 mo) | 60% | $300K–$600K |
| Cloud infrastructure (dev/staging) | 10% | $50K–$100K |
| Marketing / DevRel | 20% | $100K–$200K |
| Legal / ops / misc | 10% | $50K–$100K |

**18-month milestones:**
- Month 6: 2K GitHub stars, 10 paying cloud customers, $5K MRR
- Month 12: 5K stars, 50 customers, $30K MRR
- Month 18: 10K stars, 150 customers, $100K MRR → Series A ready

---

## Slide 12 — Ask

**Raising: $500K–$1M Pre-Seed**  
Instrument: SAFE (post-money cap $5M)

**What we need from investors:**
- Capital to hire 2 engineers and launch GoBase Cloud
- Introductions to developer-tool GTM advisors
- Portfolio companies as early customers

**Contact:** hello@gobase.dev | github.com/infocrud/gobase

---

*"We're building the infrastructure layer that every Go-first startup reaches for — starting with open source, winning on performance."*
