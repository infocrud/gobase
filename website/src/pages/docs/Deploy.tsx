import { Code, H2, P } from '../../components/DocElements';

const ic = { color: '#da5d04', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' } as const;

export default function DeployPage() {
  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Deployment Guide</h1>
      <P>Deploy GoBase on your own infrastructure using Docker, systemd, or Kubernetes.</P>

      <H2>Docker Compose (Recommended)</H2>
      <Code>{`# Clone and configure
git clone https://github.com/infocrud/gobase.git && cd gobase
cp .env.example .env
# Edit .env — change JWT_SECRET and passwords!

# Start everything
docker compose up -d

# Run migrations
make migrate`}</Code>

      <H2>Production Checklist</H2>
      <div style={{
        padding: '16px 20px',
        borderRadius: '10px',
        border: '1px solid #fed7aa',
        background: '#fff7ed',
        marginBottom: '24px',
      }}>
        <p style={{ color: '#c2410c', fontWeight: 600, marginBottom: '10px', fontSize: '14px' }}>⚠️ Before going to production:</p>
        <ul style={{ color: '#7c3a1e', paddingLeft: '20px', lineHeight: 2.2, fontSize: '13.5px' }}>
          <li>Change <code style={ic}>JWT_SECRET</code> — run <code style={ic}>openssl rand -hex 32</code></li>
          <li>Change all database and MinIO passwords</li>
          <li>Set <code style={ic}>APP_ENV=production</code></li>
          <li>Set <code style={ic}>MINIO_USE_SSL=true</code></li>
          <li>Enable SMTP for real email delivery</li>
          <li>Put Nginx with SSL in front of the gateway</li>
        </ul>
      </div>

      <H2>Build Binaries</H2>
      <Code>{`make build
# Produces: bin/gateway, bin/auth, bin/rest, bin/realtime, bin/storage, bin/functions`}</Code>

      <H2>Systemd Service</H2>
      <Code>{`[Unit]
Description=GoBase Gateway
After=network.target

[Service]
Type=simple
User=gobase
WorkingDirectory=/opt/gobase
ExecStart=/opt/gobase/bin/gateway
Restart=always
EnvironmentFile=/opt/gobase/.env

[Install]
WantedBy=multi-user.target`}</Code>

      <H2>Nginx Reverse Proxy</H2>
      <Code>{`server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket support for realtime
    location /realtime/ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}`}</Code>
    </div>
  );
}
