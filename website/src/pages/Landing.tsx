import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pb-20 px-6 grid-bg overflow-hidden" style={{ paddingTop: '160px' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#da5d04]/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#da5d04]/10 rounded-full blur-[120px]" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#da5d04]/10 border border-[#da5d04]/20 text-[#da5d04] text-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              Open Source BaaS for MySQL
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] animate-fade-in animate-delay-1 text-slate-900">
            Build apps faster with{' '}
            <span className="gradient-text">GoBase</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto animate-fade-in animate-delay-2">
            The open-source Backend-as-a-Service for MySQL teams.
            Auth, database, storage, realtime, and edge functions —
            all in one Go-powered platform.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in animate-delay-3">
            <Link
              to="/docs"
              className="px-8 py-3.5 rounded-xl bg-[#da5d04] hover:bg-[#c45303] text-white font-semibold text-base transition-all duration-200 glow-blue"
            >
              Get Started — it's free
            </Link>
            <a
              href="https://github.com/infocrud/gobase"
              className="px-8 py-3.5 rounded-xl border border-[var(--border)] hover:border-[#da5d04] text-[var(--text-secondary)] hover:text-[#da5d04] font-medium text-base transition-all duration-200 bg-white"
            >
              ★ Star on GitHub
            </a>
          </div>

          {/* Code Preview */}
          <div className="mt-16 max-w-2xl mx-auto animate-fade-in animate-delay-4">
            <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden shadow-xl shadow-[#da5d04]/5">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-slate-50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-[var(--text-muted)] ml-2">app.ts</span>
              </div>
              <pre className="p-5 text-sm text-left overflow-x-auto bg-white text-slate-800">
                <code>
                  <span className="text-purple-600">import</span>{' '}
                  <span className="text-[#da5d04]">{'{ createClient }'}</span>{' '}
                  <span className="text-purple-600">from</span>{' '}
                  <span className="text-green-600">'@gobase/sdk'</span>{'\n\n'}
                  <span className="text-purple-600">const</span>{' '}
                  <span className="text-[#da5d04]">gb</span>{' = '}
                  <span className="text-slate-800">createClient</span>
                  {'('}<span className="text-green-600">'http://localhost:8000'</span>{')\n\n'}
                  <span className="text-slate-400">// Sign up a user</span>{'\n'}
                  <span className="text-purple-600">await</span>{' '}
                  <span className="text-[#da5d04]">gb</span>.auth.
                  <span className="text-slate-800">signUp</span>
                  {'({ '}
                  <span className="text-orange-600">email</span>, <span className="text-orange-600">password</span>
                  {' })\n\n'}
                  <span className="text-slate-400">// Query your database</span>{'\n'}
                  <span className="text-purple-600">const</span>{' { data } = '}
                  <span className="text-purple-600">await</span>{' '}
                  <span className="text-[#da5d04]">gb</span>.
                  <span className="text-slate-800">from</span>
                  {'('}<span className="text-green-600">'todos'</span>{')'}
                  {'\n  .'}
                  <span className="text-slate-800">select</span>
                  {'('}<span className="text-green-600">'*'</span>{')'}
                  {'\n  .'}
                  <span className="text-slate-800">eq</span>
                  {'('}<span className="text-green-600">'done'</span>, <span className="text-orange-600">false</span>{')'}
                  {'\n  .'}
                  <span className="text-slate-800">get</span>{'()'}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-slate-900">
            Everything you need to build
          </h2>
          <p className="text-center text-[var(--text-secondary)] mb-16 max-w-xl mx-auto">
            Stop building boilerplate. Start building your product.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '🔐', title: 'Authentication',
                desc: 'Email/password, OAuth2 (Google, GitHub), JWT tokens, email verification, password reset.',
                color: 'from-[#da5d04]/10 to-[#da5d04]/5',
              },
              {
                icon: '⊞', title: 'Auto REST API',
                desc: 'Instant CRUD from your MySQL schema. Supabase-compatible query filters. Row-level security.',
                color: 'from-[#da5d04]/10 to-[#da5d04]/5',
              },
              {
                icon: '📁', title: 'File Storage',
                desc: 'S3-compatible MinIO storage. Upload, download, presigned URLs, bucket management.',
                color: 'from-[#da5d04]/10 to-[#da5d04]/5',
              },
              {
                icon: '⚡', title: 'Realtime',
                desc: 'WebSocket pub/sub with automatic change detection. Subscribe to table changes instantly.',
                color: 'from-[#da5d04]/10 to-[#da5d04]/5',
              },
              {
                icon: 'ƒ', title: 'Edge Functions',
                desc: 'Deploy and invoke JavaScript/TypeScript functions. Deno or Node.js runtime.',
                color: 'from-[#da5d04]/10 to-[#da5d04]/5',
              },
              {
                icon: '🛡️', title: 'Row-Level Security',
                desc: 'Policy-based access control. Template expressions with user context. Deny by default.',
                color: 'from-[#da5d04]/10 to-[#da5d04]/5',
              },
            ].map((f, i) => (
              <div
                key={i}
                className={`p-6 rounded-2xl border border-[var(--border)] bg-gradient-to-br ${f.color} bg-white hover:border-[#da5d04] hover:shadow-lg hover:shadow-[#da5d04]/5 transition-all duration-300 group`}
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-[#da5d04] transition-colors">{f.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-24 px-6 border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">Microservices Architecture</h2>
          <p className="text-[var(--text-secondary)] mb-12">
            6 independent Go services behind a single API gateway. Scale what you need.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: 'Gateway', port: '8000', desc: 'Reverse proxy + rate limiting' },
              { name: 'Auth', port: '8001', desc: 'JWT + OAuth2 + verification' },
              { name: 'REST', port: '8002', desc: 'Auto CRUD + RLS policies' },
              { name: 'Realtime', port: '8003', desc: 'WebSocket pub/sub' },
              { name: 'Storage', port: '8004', desc: 'MinIO file management' },
              { name: 'Functions', port: '8005', desc: 'Edge function runtime' },
            ].map((s, i) => (
              <div key={i} className={`p-5 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-[#da5d04] transition-all text-left`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-900">{s.name}</h4>
                  <span className="text-xs text-[var(--text-muted)] font-mono bg-slate-100 px-2 py-0.5 rounded">:{s.port}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 border-t border-[var(--border)] bg-slate-50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">Simple, honest pricing</h2>
          <p className="text-[var(--text-secondary)] mb-16">Free forever for self-hosted. Pay only for managed cloud.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Self-Hosted', price: 'Free', period: 'forever',
                features: ['All features included', 'Unlimited projects', 'Community support', 'Your infrastructure'],
                cta: 'Get Started', primary: false,
              },
              {
                name: 'Pro Cloud', price: '$25', period: '/month',
                features: ['Managed infrastructure', '8 GB database', '50 GB storage', 'Email support', 'Auto backups'],
                cta: 'Coming Soon', primary: true,
              },
              {
                name: 'Enterprise', price: 'Custom', period: '',
                features: ['On-prem deployment', 'SLA guarantee', 'SSO / SAML', 'Priority support', 'Custom integrations'],
                cta: 'Contact Us', primary: false,
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`p-8 rounded-2xl border text-left bg-white ${
                  plan.primary
                    ? 'border-[#da5d04] bg-gradient-to-b from-[#da5d04]/5 to-transparent animate-border shadow-lg shadow-[#da5d04]/10'
                    : 'border-[var(--border)]'
                }`}
              >
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                  {plan.period && <span className="text-[var(--text-muted)]">{plan.period}</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <span className="text-[#da5d04]">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    plan.primary
                      ? 'bg-[#da5d04] hover:bg-[#c45303] text-white'
                      : 'border border-[var(--border)] text-slate-700 hover:text-[#da5d04] hover:border-[#da5d04] bg-white'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-[var(--border)]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
            Ready to build with <span className="gradient-text">GoBase</span>?
          </h2>
          <p className="text-[var(--text-secondary)] mb-8">
            Get up and running in under 5 minutes. No credit card required.
          </p>
          <div className="inline-flex items-center gap-3">
            <code className="px-5 py-3 rounded-lg bg-slate-100 border border-slate-200 text-sm text-slate-700 font-mono">
              git clone https://github.com/infocrud/gobase && make docker-up
            </code>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[var(--border)] bg-slate-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/gobase-logo.svg" alt="GoBase" style={{ height: '18px' }} />
            <span className="text-sm text-[var(--text-muted)]">© 2026 GoBase. Open source under MIT License.</span>
          </div>
          <div className="flex gap-6 text-sm text-[var(--text-muted)]">
            <Link to="/docs" className="hover:text-[#da5d04] transition-colors">Docs</Link>
            <a href="https://github.com/infocrud/gobase" className="hover:text-[#da5d04] transition-colors">GitHub</a>
            <a href="#" className="hover:text-[#da5d04] transition-colors">Discord</a>
            <a href="#" className="hover:text-[#da5d04] transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
