import { Code, H2, P, Table } from '../../components/DocElements';

export default function IntroPage() {
  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Introduction</h1>
      <P>GoBase is an open-source Backend-as-a-Service (BaaS) built with Go Fiber and PostgreSQL. It provides everything you need to build modern applications — auth, database, storage, realtime, and edge functions — in a single, self-hosted platform.</P>

      <H2>Why GoBase?</H2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', margin: '20px 0' }}>
        {[
          { title: 'PostgreSQL Native', desc: 'Built on PostgreSQL 15 with full GORM support and Row-Level Security.' },
          { title: 'Go Performance', desc: 'Compiled Go binaries with minimal memory footprint and sub-ms latency.' },
          { title: 'Self-Hosted First', desc: 'Run on your own infrastructure. No vendor lock-in. MIT licensed.' },
          { title: 'Supabase-Compatible SDK', desc: "Familiar API if you've used Supabase. Easy migration path." },
        ].map((item, i) => (
          <div key={i} style={{
            padding: '16px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            background: '#f8fafc',
          }}>
            <h4 style={{ fontWeight: 600, color: '#0f172a', marginBottom: '6px', fontSize: '14px' }}>{item.title}</h4>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>{item.desc}</p>
          </div>
        ))}
      </div>

      <H2>Architecture</H2>
      <Table
        headers={['Service', 'Port', 'Purpose']}
        rows={[
          ['Gateway', ':8000', 'API gateway with rate limiting and reverse proxy'],
          ['Auth', ':8001', 'JWT authentication, OAuth2, email verification'],
          ['REST', ':8002', 'Auto-generated CRUD API from PostgreSQL schema'],
          ['Realtime', ':8003', 'WebSocket pub/sub for live data'],
          ['Storage', ':8004', 'S3-compatible file storage via MinIO'],
          ['Functions', ':8005', 'Edge function runtime (Deno/Node.js)'],
        ]}
      />

      <H2>Tech Stack</H2>
      <Table
        headers={['Component', 'Technology']}
        rows={[
          ['Language', 'Go 1.22+'],
          ['Web Framework', 'Fiber v2'],
          ['Database', 'PostgreSQL 15 + GORM'],
          ['Cache', 'Redis 7'],
          ['Object Storage', 'MinIO (S3-compatible)'],
          ['Configuration', 'Viper + .env'],
          ['Logging', 'Zerolog'],
          ['Client SDK', 'TypeScript (@gobase/sdk)'],
          ['Dashboard', 'React + Vite + Tailwind'],
        ]}
      />

      <H2>Next Steps</H2>
      <Code>{`git clone https://github.com/infocrud/gobase.git
cd gobase && cp .env.example .env
make docker-up && make migrate
make run-gateway`}</Code>
      <P>Head to the Quick Start guide to get GoBase running in under 5 minutes.</P>
    </div>
  );
}
