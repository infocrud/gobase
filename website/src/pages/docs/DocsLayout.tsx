import { Link, useLocation, Outlet } from 'react-router-dom';

const sidebar = [
  { title: 'Getting Started', items: [
    { path: '/docs', label: 'Introduction' },
    { path: '/docs/quickstart', label: 'Quick Start' },
  ]},
  { title: 'Features', items: [
    { path: '/docs/auth', label: 'Authentication' },
    { path: '/docs/database', label: 'Database' },
    { path: '/docs/storage', label: 'Storage' },
    { path: '/docs/realtime', label: 'Realtime' },
    { path: '/docs/functions', label: 'Edge Functions' },
    { path: '/docs/rls', label: 'Row-Level Security' },
  ]},
  { title: 'Client SDK', items: [
    { path: '/docs/sdk', label: 'JavaScript SDK' },
  ]},
  { title: 'Deployment', items: [
    { path: '/docs/deploy', label: 'Deployment Guide' },
  ]},
];

export default function DocsLayout() {
  const location = useLocation();

  return (
    <div style={{ paddingTop: '64px', minHeight: '100vh', display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        minWidth: '260px',
        borderRight: '1px solid var(--border)',
        padding: '24px 16px',
        position: 'sticky',
        top: '64px',
        height: 'calc(100vh - 64px)',
        overflowY: 'auto',
      }}>
        {sidebar.map((section, i) => (
          <div key={i} style={{ marginBottom: '24px' }}>
            <h4 style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
              paddingLeft: '12px',
            }}>
              {section.title}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {section.items.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      style={{
                        display: 'block',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: isActive ? '#3b82f6' : 'var(--text-secondary)',
                        backgroundColor: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
                        fontWeight: isActive ? 500 : 400,
                        textDecoration: 'none',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.color = '#f0f0f5';
                          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.color = 'var(--text-secondary)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </aside>

      {/* Content */}
      <main style={{
        flex: 1,
        padding: '32px 48px',
        maxWidth: '860px',
      }}>
        <Outlet />
      </main>
    </div>
  );
}
