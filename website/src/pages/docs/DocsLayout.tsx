import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  BookOpen, Zap, Lock, Database, HardDrive,
  Radio, FunctionSquare, Shield, Package, Rocket,
} from 'lucide-react';

const sidebar = [
  {
    title: 'Getting Started',
    items: [
      { path: '/docs', label: 'Introduction', icon: BookOpen },
      { path: '/docs/quickstart', label: 'Quick Start', icon: Zap },
    ],
  },
  {
    title: 'Features',
    items: [
      { path: '/docs/auth', label: 'Authentication', icon: Lock },
      { path: '/docs/database', label: 'Database', icon: Database },
      { path: '/docs/storage', label: 'Storage', icon: HardDrive },
      { path: '/docs/realtime', label: 'Realtime', icon: Radio },
      { path: '/docs/functions', label: 'Edge Functions', icon: FunctionSquare },
      { path: '/docs/rls', label: 'Row-Level Security', icon: Shield },
    ],
  },
  {
    title: 'Client SDK',
    items: [
      { path: '/docs/sdk', label: 'JavaScript SDK', icon: Package },
    ],
  },
  {
    title: 'Deployment',
    items: [
      { path: '/docs/deploy', label: 'Deployment Guide', icon: Rocket },
    ],
  },
];

export default function DocsLayout() {
  const location = useLocation();

  return (
    <div style={{ paddingTop: '64px', minHeight: '100vh', display: 'flex', background: '#fff' }}>
      {/* Sidebar */}
      <aside style={{
        width: '256px',
        minWidth: '256px',
        borderRight: '1px solid #e2e8f0',
        padding: '28px 12px',
        position: 'sticky',
        top: '64px',
        height: 'calc(100vh - 64px)',
        overflowY: 'auto',
        background: '#f8fafc',
      }}>
        {sidebar.map((section, i) => (
          <div key={i} style={{ marginBottom: '28px' }}>
            <p style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '6px',
              paddingLeft: '12px',
            }}>
              {section.title}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {section.items.map(item => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '9px',
                        padding: '7px 12px',
                        borderRadius: '8px',
                        fontSize: '13.5px',
                        color: isActive ? '#da5d04' : '#475569',
                        backgroundColor: isActive ? 'rgba(218,93,4,0.08)' : 'transparent',
                        fontWeight: isActive ? 600 : 400,
                        textDecoration: 'none',
                        transition: 'all 0.15s',
                        borderLeft: isActive ? '2px solid #da5d04' : '2px solid transparent',
                      }}
                      onMouseEnter={e => {
                        if (!isActive) {
                          e.currentTarget.style.color = '#0f172a';
                          e.currentTarget.style.backgroundColor = '#f1f5f9';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          e.currentTarget.style.color = '#475569';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <Icon size={14} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.5 }} />
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
        padding: '40px 56px',
        maxWidth: '820px',
        color: '#0f172a',
      }}>
        <Outlet />
      </main>
    </div>
  );
}
