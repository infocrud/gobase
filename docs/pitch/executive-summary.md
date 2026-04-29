# GoBase — Executive Summary

**One page | Pre-Seed | 2026**

---

## What We Do

GoBase is an open-source Backend-as-a-Service (BaaS) written in Go. It gives developers auth, auto-generated REST and GraphQL APIs, real-time subscriptions, file storage, and edge functions — the same feature set as Supabase — at **10× the throughput and 1/3 the infrastructure cost**.

## The Problem

Every software team re-builds the same backend: auth flows, CRUD APIs, file storage. Existing BaaS platforms (Supabase, Firebase, Appwrite) are built on Node.js or PHP — languages that hit performance ceilings under load. At 50,000 monthly active users, Supabase's managed cloud costs $200–500/month in overages. Self-hosting Supabase requires orchestrating 8+ Docker containers and a dedicated DevOps engineer.

## Our Solution

GoBase is a single binary per service, deployed with `gobase start` in under 60 seconds. Its six Go microservices (Auth, REST, Realtime, Storage, Functions, GraphQL) serve **12,000 requests/second** on a $20/month VPS — versus Supabase's 1,500 req/s on a $25/month plan.

**Benchmarks (k6, 1,000 concurrent users):**
- REST API p95 latency: **4.2ms** (GoBase) vs **38ms** (Supabase)
- Throughput: **12,400 req/s** vs **1,620 req/s**
- Memory: **82MB** per instance vs **410MB**

## Business Model

1. **GoBase Cloud** (Q3 2026) — Managed hosting, usage-based pricing ($19–$79/mo)
2. **Enterprise** (Q4 2026) — Annual license, on-premise, compliance (SOC2/HIPAA)
3. **Professional Services** — Migration from Supabase/Firebase, custom integrations

Target gross margin: 85% at scale.

## Market

The BaaS market is $7.1B in 2024, growing at 29% CAGR toward $20B by 2028. Our beachhead is the 2M+ Go developer community, expanding into the broader 100M+ developer market. We compete on performance and cost for the 20% of teams for whom Node.js infrastructure is a bottleneck.

## Traction

- Open-source codebase: production-ready, 6 services, full test suite
- TypeScript, Go, Python, Ruby SDKs published
- Docker Compose and Kubernetes deployment guides
- 15 example projects across SaaS, chat, blog, and file management use cases

## Team

**[Founder Name]** — Sole founder. [X] years building production Go services at [Company]. Architect of [notable project]. Seeking a technical co-founder and two senior Go engineers post-seed.

## The Ask

**Raising $500K–$1M on a SAFE (post-money cap: $5M).**

Use of funds: engineering headcount (60%), infrastructure (10%), marketing and DevRel (20%), ops and legal (10%).

18-month plan: Launch GoBase Cloud, reach $30K MRR, achieve 5,000 GitHub stars, close 50 paying customers — positioning for a $3–5M seed round.

---

**Contact:** hello@gobase.dev  
**GitHub:** github.com/infocrud/gobase  
**Docs:** gobase.dev/docs
