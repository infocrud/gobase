import { useState } from 'react';
import { Link } from 'react-router-dom';

// ── ROI Calculator ────────────────────────────────────────────────────────────

function ROICalculator() {
  const [users, setUsers] = useState(10_000);
  const [apiCalls, setApiCalls] = useState(1_000_000);
  const [storage, setStorage] = useState(50);

  // Supabase Pro: $25/mo base, ~$0.00025/extra API call over 5M, $0.021/GB storage
  // Rough estimation model
  const supabaseBase = 25;
  const supabaseApiExtra = Math.max(0, (apiCalls - 5_000_000)) * 0.00025;
  const supabaseStorage = storage * 0.021;
  const supabaseAuth = users > 50_000 ? (users - 50_000) * 0.00325 : 0;
  const supabaseTotal = supabaseBase + supabaseApiExtra + supabaseStorage + supabaseAuth;

  // GoBase self-hosted: just infrastructure cost
  // ~$20/mo for small VPS + $0.01/GB storage (MinIO/Cloudflare R2)
  const gobaseServer = users < 50_000 ? 20 : users < 200_000 ? 40 : 80;
  const gobaseStorage = storage * 0.015;
  const gobaseTotal = gobaseServer + gobaseStorage;

  const savings = supabaseTotal - gobaseTotal;
  const savingsPct = Math.round((savings / supabaseTotal) * 100);

  return (
    <div style={{ background: 'rgba(218,93,4,0.04)', border: '1px solid rgba(218,93,4,0.2)', borderRadius: '16px', padding: '32px' }}>
      <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '24px' }}>
        ROI Calculator
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <Slider label="Monthly Active Users" value={users} min={1000} max={500_000} step={1000} fmt={n => n.toLocaleString()} onChange={setUsers} />
        <Slider label="API Calls / Month" value={apiCalls} min={100_000} max={50_000_000} step={100_000} fmt={n => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : `${(n/1000).toFixed(0)}K`} onChange={setApiCalls} />
        <Slider label="Storage (GB)" value={storage} min={1} max={1000} step={1} fmt={n => `${n} GB`} onChange={setStorage} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        <CostBox label="Supabase" amount={supabaseTotal} color="#6366f1" note="Pro plan estimate" />
        <CostBox label="GoBase" amount={gobaseTotal} color="#da5d04" note="Self-hosted infra only" />
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#166534', marginBottom: '6px' }}>Monthly Savings</p>
          <p style={{ fontSize: '28px', fontWeight: 800, color: '#15803d' }}>${Math.round(savings).toLocaleString()}</p>
          <p style={{ fontSize: '13px', color: '#166534', marginTop: '4px' }}>{savingsPct}% cheaper</p>
        </div>
      </div>
      <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '16px' }}>
        * Estimates based on publicly available pricing. Actual costs vary. GoBase Cloud pricing coming soon.
      </p>
    </div>
  );
}

function Slider({ label, value, min, max, step, fmt, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  fmt: (n: number) => string; onChange: (n: number) => void;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '13px', color: '#da5d04', fontWeight: 700 }}>{fmt(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#da5d04' }}
      />
    </div>
  );
}

function CostBox({ label, amount, color, note }: { label: string; amount: number; color: string; note: string }) {
  return (
    <div style={{ border: `1px solid ${color}30`, borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
      <p style={{ fontSize: '13px', color: '#475569', marginBottom: '6px' }}>{label}</p>
      <p style={{ fontSize: '28px', fontWeight: 800, color }}>${Math.round(amount).toLocaleString()}<span style={{ fontSize: '14px', fontWeight: 500, color: '#94a3b8' }}>/mo</span></p>
      <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{note}</p>
    </div>
  );
}

// ── Tier Card ─────────────────────────────────────────────────────────────────

function TierCard({ tier, price, priceNote, features, cta, ctaHref, highlight }: {
  tier: string; price: string; priceNote: string; features: string[];
  cta: string; ctaHref: string; highlight?: boolean;
}) {
  return (
    <div style={{
      border: highlight ? '2px solid #da5d04' : '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '32px',
      display: 'flex',
      flexDirection: 'column',
      background: highlight ? 'rgba(218,93,4,0.03)' : 'white',
      position: 'relative',
    }}>
      {highlight && (
        <div style={{
          position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
          background: '#da5d04', color: 'white', fontSize: '11px', fontWeight: 700,
          padding: '4px 12px', borderRadius: '20px', letterSpacing: '0.05em',
        }}>MOST POPULAR</div>
      )}
      <p style={{ fontSize: '13px', fontWeight: 700, color: '#da5d04', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>{tier}</p>
      <div style={{ marginBottom: '8px' }}>
        <span style={{ fontSize: '40px', fontWeight: 800, color: '#0f172a' }}>{price}</span>
        <span style={{ fontSize: '14px', color: '#64748b', marginLeft: '4px' }}>{priceNote}</span>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 24px', flex: 1 }}>
        {features.map((f, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '10px', fontSize: '14px', color: '#334155' }}>
            <span style={{ color: '#da5d04', fontWeight: 700, flexShrink: 0 }}>✓</span>
            {f}
          </li>
        ))}
      </ul>
      <a
        href={ctaHref}
        style={{
          display: 'block', textAlign: 'center', padding: '12px',
          borderRadius: '10px',
          background: highlight ? '#da5d04' : 'transparent',
          border: highlight ? 'none' : '1.5px solid #e2e8f0',
          color: highlight ? 'white' : '#334155',
          fontWeight: 600, fontSize: '14px', textDecoration: 'none',
          transition: 'all 0.15s',
        }}
      >
        {cta}
      </a>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const FREE_FEATURES = [
  '1 project',
  '5 GB storage',
  '50K API calls/month',
  '10K monthly active users',
  'Community support',
  'All core features (auth, REST, realtime, storage, functions)',
];

const STARTER_FEATURES = [
  '3 projects',
  '50 GB storage',
  '1M API calls/month',
  '100K monthly active users',
  'Email support (48h SLA)',
  'Custom domains',
  'Daily backups',
];

const PRO_FEATURES = [
  'Unlimited projects',
  '500 GB storage',
  '10M API calls/month',
  'Unlimited monthly active users',
  'Priority support (4h SLA)',
  'Advanced monitoring & alerts',
  'SLA 99.9% uptime',
  'SOC2 compliance (Q3 2025)',
];

const ENTERPRISE_FEATURES = [
  'Dedicated infrastructure',
  'Custom storage & API limits',
  'Dedicated support engineer',
  'SSO / SAML',
  'Audit logs & compliance reports',
  'Custom SLA',
  'On-premise deployment option',
  'Security review & pen-testing',
];

export default function PricingPage() {
  return (
    <div style={{ paddingTop: '64px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '64px 24px 48px', background: 'linear-gradient(135deg, #fffbf7 0%, #fff7f0 100%)' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#da5d04', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>Pricing</p>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, color: '#0f172a', marginBottom: '16px', lineHeight: 1.1 }}>
          Simple, predictable pricing
        </h1>
        <p style={{ fontSize: '18px', color: '#475569', maxWidth: '540px', margin: '0 auto 32px', lineHeight: 1.6 }}>
          Start free, self-host for nothing, or use GoBase Cloud when you're ready to scale.
        </p>

        {/* Open-source callout */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 20px', marginBottom: '8px' }}>
          <span style={{ fontSize: '20px' }}>⚡</span>
          <span style={{ fontSize: '14px', color: '#334155', fontWeight: 500 }}>
            GoBase is <strong>100% open-source</strong> — self-host for free forever.
          </span>
          <a href="https://github.com/infocrud/gobase" target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: '#da5d04', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            View on GitHub →
          </a>
        </div>
      </section>

      {/* Tiers */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <TierCard
            tier="Free"
            price="$0"
            priceNote="/ month"
            features={FREE_FEATURES}
            cta="Self-host now"
            ctaHref="https://github.com/infocrud/gobase#quick-start"
          />
          <TierCard
            tier="Starter"
            price="$19"
            priceNote="/ month"
            features={STARTER_FEATURES}
            cta="Coming soon"
            ctaHref="#waitlist"
            highlight
          />
          <TierCard
            tier="Pro"
            price="$79"
            priceNote="/ month"
            features={PRO_FEATURES}
            cta="Coming soon"
            ctaHref="#waitlist"
          />
          <TierCard
            tier="Enterprise"
            price="Custom"
            priceNote=""
            features={ENTERPRISE_FEATURES}
            cta="Contact us"
            ctaHref="mailto:hello@gobase.dev"
          />
        </div>
      </section>

      {/* ROI Calculator */}
      <section style={{ maxWidth: '860px', margin: '0 auto', padding: '0 24px 64px' }}>
        <ROICalculator />
      </section>

      {/* Comparison table */}
      <section style={{ background: '#f8fafc', padding: '64px 24px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '8px', textAlign: 'center' }}>
            GoBase vs Supabase
          </h2>
          <p style={{ color: '#64748b', textAlign: 'center', marginBottom: '32px' }}>Same features, better performance, lower cost.</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Feature</th>
                <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#da5d04' }}>GoBase</th>
                <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#6366f1' }}>Supabase</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['REST API latency (p95)', '< 5ms', '20–50ms'],
                ['Throughput (req/s)', '12,000+', '1,500–2,000'],
                ['Memory per instance', '~80MB', '~400MB'],
                ['Language', 'Go (native)', 'Node.js'],
                ['Auth (JWT + OAuth2)', '✓', '✓'],
                ['Auto-generated REST API', '✓', '✓'],
                ['Row-Level Security', '✓', '✓'],
                ['Realtime / WebSocket', '✓', '✓'],
                ['File storage', '✓', '✓'],
                ['Edge functions', '✓', '✓'],
                ['Self-host', 'Free forever', 'Free (limited)'],
                ['Open source', 'MIT', 'Apache 2.0'],
                ['Docker Compose deploy', '1 command', '3+ steps'],
                ['Cloud pricing (free tier)', '$0 / forever', '$0 / limited'],
                ['Cloud pricing (pro)', '$79/mo (coming)', '$25/mo + overages'],
              ].map(([feat, gb, sb], i) => (
                <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 20px', fontSize: '14px', color: '#334155' }}>{feat}</td>
                  <td style={{ padding: '12px 20px', fontSize: '14px', color: '#da5d04', fontWeight: 600, textAlign: 'center' }}>{gb}</td>
                  <td style={{ padding: '12px 20px', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>{sb}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '12px', textAlign: 'center' }}>
            * Benchmarked with k6 at 1,000 concurrent users. See{' '}
            <a href="https://github.com/infocrud/gobase/tree/main/benchmarks" target="_blank" rel="noopener noreferrer" style={{ color: '#da5d04' }}>benchmarks/</a>{' '}
            for full methodology.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: '680px', margin: '0 auto', padding: '64px 24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '32px', textAlign: 'center' }}>FAQ</h2>
        {[
          ['Is GoBase really free to self-host?', 'Yes, forever. GoBase is MIT licensed. You pay for your own server (a $20/mo VPS handles ~50K users). We never charge for the software itself.'],
          ['When is GoBase Cloud launching?', 'GoBase Cloud is in development. Join the waitlist to get early access and founding member pricing.'],
          ['Can I migrate from Supabase?', 'Yes. GoBase uses the same PostgreSQL and a compatible REST API. Most Supabase projects can migrate by swapping the base URL and token in your SDK calls.'],
          ['What about the TypeScript SDK?', 'Drop-in compatible. Install @gobase/sdk and change your base URL. Go, Python, and Ruby SDKs are also available.'],
          ['Do you offer a Service Level Agreement?', 'SLAs are available on Pro and Enterprise plans. The open-source / self-hosted edition has no SLA.'],
          ['What happens to my data on GoBase Cloud?', 'Your data lives in your database. You can export it at any time, and self-host the same software for complete control.'],
        ].map(([q, a], i) => (
          <div key={i} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px', marginBottom: '20px' }}>
            <p style={{ fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>{q}</p>
            <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>{a}</p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '64px 24px', background: 'linear-gradient(135deg, #fffbf7 0%, #fff7f0 100%)' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>Ready to start?</h2>
        <p style={{ color: '#475569', marginBottom: '28px', fontSize: '16px' }}>Deploy in under 5 minutes. No credit card required.</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/docs/quickstart"
            style={{ padding: '14px 28px', background: '#da5d04', color: 'white', borderRadius: '10px', fontWeight: 600, textDecoration: 'none', fontSize: '15px' }}
          >
            Get Started Free
          </Link>
          <a
            href="https://github.com/infocrud/gobase"
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '14px 28px', border: '1.5px solid #e2e8f0', color: '#334155', borderRadius: '10px', fontWeight: 600, textDecoration: 'none', fontSize: '15px' }}
          >
            View on GitHub
          </a>
        </div>
      </section>
    </div>
  );
}
