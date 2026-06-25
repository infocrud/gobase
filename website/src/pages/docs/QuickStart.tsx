import { Link } from 'react-router-dom';
import { Code, H2, P } from '../../components/DocElements';

export default function QuickStartPage() {
  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Quick Start</h1>
      <P>Get GoBase running locally in under 5 minutes.</P>

      <H2>Prerequisites</H2>
      <ul style={{ color: '#475569', paddingLeft: '20px', marginBottom: '24px', lineHeight: 2 }}>
        <li>Go 1.22+</li>
        <li>Docker &amp; Docker Compose</li>
        <li>Node.js 18+ (for SDK and dashboard)</li>
      </ul>

      <H2>1. Clone the repo</H2>
      <Code>{`git clone https://github.com/infocrud/gobase.git
cd gobase
cp .env.example .env`}</Code>

      <H2>2. Start infrastructure</H2>
      <Code>{`make docker-up
# Starts PostgreSQL 15, Redis 7, MinIO`}</Code>

      <H2>3. Run migrations</H2>
      <Code>{`make migrate
# Creates: users, refresh_tokens, policies, realtime_changes`}</Code>

      <H2>4. Start services</H2>
      <Code>{`make run-auth &
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '16px' }}>
        {[
          { title: 'Authentication', desc: 'Set up OAuth2, email verification', link: '/docs/auth' },
          { title: 'Database API', desc: 'Auto REST from your PostgreSQL tables', link: '/docs/database' },
          { title: 'File Storage', desc: 'Upload files with presigned URLs', link: '/docs/storage' },
          { title: 'Realtime', desc: 'Subscribe to table changes', link: '/docs/realtime' },
        ].map((item, i) => (
          <Link key={i} to={item.link} style={{
            padding: '14px 16px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            background: '#f8fafc',
            textDecoration: 'none',
            display: 'block',
            transition: 'border-color 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#da5d04')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
          >
            <p style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px', fontSize: '14px' }}>{item.title} →</p>
            <p style={{ fontSize: '12px', color: '#64748b' }}>{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
