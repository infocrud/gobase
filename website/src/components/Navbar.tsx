import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/docs', label: 'Docs' },
  { path: '/docs/auth', label: 'Auth' },
  { path: '/docs/database', label: 'Database' },
  { path: '/docs/storage', label: 'Storage' },
  { path: '/docs/realtime', label: 'Realtime' },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      borderBottom: '1px solid var(--border)',
      backgroundColor: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/logo-full.png" alt="GoBase" style={{ height: '44px' }} />
        </Link>

        {/* Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {navLinks.map(link => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: isActive ? '#da5d04' : '#475569',
                  backgroundColor: isActive ? 'rgba(218,93,4,0.1)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a
            href="https://github.com/gobase"
            target="_blank"
            style={{ color: '#475569', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}
          >
            GitHub
          </a>
          <Link
            to="/docs"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: '#da5d04',
              color: 'white',
              fontSize: '14px',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
