import { Code, H2, H3, P, Table } from '../../components/DocElements';

export default function IntroPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-2">Introduction</h1>
      <P>GoBase is an open-source Backend-as-a-Service (BaaS) built with Go Fiber and MySQL. It provides everything you need to build modern applications — auth, database, storage, realtime, and edge functions — in a single, self-hosted platform.</P>

      <H2>Why GoBase?</H2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        {[
          { title: 'Built for MySQL', desc: 'Native MySQL 8 support. No need to switch to Postgres.' },
          { title: 'Go Performance', desc: 'Compiled Go binaries with minimal memory footprint and sub-ms latency.' },
          { title: 'Self-Hosted First', desc: 'Run on your own infrastructure. No vendor lock-in. MIT licensed.' },
          { title: 'Supabase-Compatible SDK', desc: 'Familiar API if you\'ve used Supabase. Easy migration path.' },
        ].map((item, i) => (
          <div key={i} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
            <h4 className="font-semibold text-white mb-1">{item.title}</h4>
            <p className="text-sm text-[var(--text-secondary)]">{item.desc}</p>
          </div>
        ))}
      </div>

      <H2>Architecture</H2>
      <Table
        headers={['Service', 'Port', 'Purpose']}
        rows={[
          ['Gateway', ':8000', 'API gateway with rate limiting and reverse proxy'],
          ['Auth', ':8001', 'JWT authentication, OAuth2, email verification'],
          ['REST', ':8002', 'Auto-generated CRUD API from MySQL schema'],
          ['Realtime', ':8003', 'WebSocket pub/sub for live data'],
          ['Storage', ':8004', 'S3-compatible file storage via MinIO'],
          ['Functions', ':8005', 'Edge function runtime (Deno/Node.js)'],
        ]}
      />

      <H2>Tech Stack</H2>
      <Table
        headers={['Component', 'Technology']}
        rows={[
          ['Language', 'Go 1.21+'],
          ['Web Framework', 'Fiber v2'],
          ['Database', 'MySQL 8 + GORM'],
          ['Cache', 'Redis 7'],
          ['Object Storage', 'MinIO (S3-compatible)'],
          ['Configuration', 'Viper + .env'],
          ['Logging', 'Zerolog'],
          ['Client SDK', 'TypeScript (@gobase/sdk)'],
          ['Dashboard', 'React + Vite + Tailwind'],
        ]}
      />
    </div>
  );
}
