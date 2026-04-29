import { Code, H2, H3, P } from '../../components/DocElements';

export default function QuickStartPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-2">Quick Start</h1>
      <P>Get GoBase running locally in under 5 minutes.</P>

      <H2>Prerequisites</H2>
      <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-1 mb-6">
        <li>Go 1.21+</li>
        <li>Docker & Docker Compose</li>
        <li>Node.js 18+ (for SDK and dashboard)</li>
      </ul>

      <H2>1. Clone the repo</H2>
      <Code>{`git clone https://github.com/infocrud/gobase.git
cd gobase
cp .env.example .env`}</Code>

      <H2>2. Start infrastructure</H2>
      <Code>{`make docker-up
# Starts MySQL 8, Redis 7, MinIO`}</Code>

      <H2>3. Run migrations</H2>
      <Code>{`make migrate
# Creates: users, refresh_tokens, policies, realtime_changes`}</Code>

      <H2>4. Start services</H2>
      <Code>{`# Start all services in background
make run-auth &
make run-rest &
make run-realtime &
make run-storage &
make run-functions &
make run-gateway`}</Code>

      <H2>5. Test it</H2>
      <Code>{`# Health check
curl http://localhost:8000/health

# Create a user
curl -X POST http://localhost:8000/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{"email":"hello@gobase.dev","password":"password123"}'`}</Code>

      <H2>6. Start the dashboard</H2>
      <Code>{`cd dashboard && npm install && npm run dev
# Open http://localhost:3000`}</Code>

      <H2>Next steps</H2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        {[
          { title: 'Authentication', desc: 'Set up OAuth2, email verification', link: '/docs/auth' },
          { title: 'Database API', desc: 'Auto REST from your MySQL tables', link: '/docs/database' },
          { title: 'File Storage', desc: 'Upload files with presigned URLs', link: '/docs/storage' },
          { title: 'Realtime', desc: 'Subscribe to table changes', link: '/docs/realtime' },
        ].map((item, i) => (
          <a key={i} href={item.link} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-blue-500/40 transition-all group">
            <h4 className="font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">{item.title} →</h4>
            <p className="text-xs text-[var(--text-secondary)]">{item.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
