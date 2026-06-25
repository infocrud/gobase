import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pb-20 px-6 grid-bg overflow-hidden" style={{ paddingTop: '160px' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#da5d04]/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#da5d04]/8 rounded-full blur-[120px]" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#da5d04]/10 border border-[#da5d04]/20 text-[#da5d04] text-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              Open Source BaaS — PostgreSQL + Go
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] animate-fade-in animate-delay-1 text-slate-900">
            Build apps faster with{' '}
            <span className="gradient-text">GoBase</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-slate-500 max-w-2xl mx-auto animate-fade-in animate-delay-2">
            The open-source Backend-as-a-Service built on PostgreSQL and Go.
            Auth, database, storage, realtime, and edge functions —
            all in one self-hosted platform.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in animate-delay-3">
            <Link
              to="/docs"
              className="px-8 py-3.5 rounded-xl bg-[#da5d04] hover:bg-[#c45303] text-white font-semibold text-base transition-all duration-200"
              style={{ boxShadow: '0 4px 20px rgba(218,93,4,0.25)' }}
            >
              Get Started — it's free
            </Link>
            <a
              href="https://github.com/infocrud/gobase"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-xl border border-slate-200 hover:border-[#da5d04] text-slate-600 hover:text-[#da5d04] font-medium text-base transition-all duration-200 bg-white"
            >
              ★ Star on GitHub
            </a>
          </div>

          {/* Code Preview */}
          <div className="mt-16 max-w-2xl mx-auto animate-fade-in animate-delay-4">
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xl shadow-slate-200/60">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-slate-400 ml-2 font-mono">app.ts</span>
              </div>
              <pre className="p-5 text-sm text-left overflow-x-auto bg-white text-slate-800">
                <code>
                  <span className="text-purple-600">import</span>{' '}
                  <span className="text-[#da5d04]">{'{ createClient }'}</span>{' '}
                  <span className="text-purple-600">from</span>{' '}
                  <span className="text-green-600">'@gobase/sdk'</span>{'\n\n'}
                  <span className="text-purple-600">const</span>{' '}
                  <span className="text-[#da5d04]">gb</span>{' = '}
                  <span className="text-slate-700">createClient</span>
                  {'('}<span className="text-green-600">'http://localhost:8000'</span>{')\n\n'}
                  <span className="text-slate-400">// Sign up a user</span>{'\n'}
                  <span className="text-purple-600">await</span>{' '}
                  <span className="text-[#da5d04]">gb</span>.auth.
                  <span className="text-slate-700">signUp</span>
                  {'({ '}
                  <span className="text-orange-500">email</span>, <span className="text-orange-500">password</span>
                  {' })\n\n'}
                  <span className="text-slate-400">// Query your database</span>{'\n'}
                  <span className="text-purple-600">const</span>{' { data } = '}
                  <span className="text-purple-600">await</span>{' '}
                  <span className="text-[#da5d04]">gb</span>.
                  <span className="text-slate-700">from</span>
                  {'('}<span className="text-green-600">'todos'</span>{')'}
                  {'\n  .'}
                  <span className="text-slate-700">select</span>
                  {'('}<span className="text-green-600">'*'</span>{')'}
                  {'\n  .'}
                  <span className="text-slate-700">eq</span>
                  {'('}<span className="text-green-600">'done'</span>, <span className="text-orange-500">false</span>{')'}
                  {'\n  .'}
                  <span className="text-slate-700">get</span>{'()'}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-slate-50 border-t border-slate-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-slate-900">
            Everything you need to build
          </h2>
          <p className="text-center text-slate-500 mb-16 max-w-xl mx-auto">
            Stop building boilerplate. Start building your product.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🔐', title: 'Authentication', desc: 'Email/password, OAuth2 (Google, GitHub), JWT tokens, email verification, password reset.' },
              { icon: '⊞', title: 'Auto REST API', desc: 'Instant CRUD from your PostgreSQL schema. Supabase-compatible query filters. Row-level security.' },
              { icon: '📁', title: 'File Storage', desc: 'S3-compatible MinIO storage. Upload, download, presigned URLs, bucket management.' },
              { icon: '⚡', title: 'Realtime', desc: 'WebSocket pub/sub with automatic change detection. Subscribe to table changes instantly.' },
              { icon: 'ƒ', title: 'Edge Functions', desc: 'Deploy and invoke JavaScript/TypeScript functions. Deno or Node.js runtime.' },
              { icon: '🛡️', title: 'Row-Level Security', desc: 'Policy-based access control. Template expressions with user context. Deny by default.' },
            ].map((f, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-[#da5d04]/40 hover:shadow-lg hover:shadow-[#da5d04]/5 transition-all duration-300 group"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-[#da5d04] transition-colors">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-24 px-6 border-t border-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">Microservices Architecture</h2>
          <p className="text-slate-500 mb-12">
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
              <div key={i} className="p-5 rounded-xl border border-slate-200 bg-white hover:border-[#da5d04]/40 transition-all text-left">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-900">{s.name}</h4>
                  <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">:{s.port}</span>
                </div>
                <p className="text-xs text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-slate-100 bg-slate-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
            Ready to build with <span className="gradient-text">GoBase</span>?
          </h2>
          <p className="text-slate-500 mb-8">
            Get up and running in under 5 minutes. No credit card required.
          </p>
          <div className="inline-flex items-center gap-3">
            <code className="px-5 py-3 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 font-mono shadow-sm">
              git clone https://github.com/infocrud/gobase && make docker-up
            </code>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/gobase-logo.svg" alt="GoBase" style={{ height: '18px' }} />
            <span className="text-sm text-slate-400">© 2026 GoBase. Open source under MIT License.</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-400">
            <Link to="/docs" className="hover:text-[#da5d04] transition-colors">Docs</Link>
            <a href="https://github.com/infocrud/gobase" target="_blank" rel="noopener noreferrer" className="hover:text-[#da5d04] transition-colors">GitHub</a>
            <a href="#" className="hover:text-[#da5d04] transition-colors">Discord</a>
            <a href="#" className="hover:text-[#da5d04] transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
