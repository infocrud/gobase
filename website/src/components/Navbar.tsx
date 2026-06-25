import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/docs', label: 'Docs' },
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
      borderBottom: '1px solid #e2e8f0',
      backgroundColor: 'rgba(255,255,255,0.9)',
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
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/gobase-logo.svg" alt="GoBase" style={{ height: '40px' }} />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {navLinks.map(link => {
            const isActive = location.pathname === link.path ||
              (link.path === '/docs' && location.pathname.startsWith('/docs'));
            return (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: isActive ? '#da5d04' : '#475569',
                  backgroundColor: isActive ? 'rgba(218,93,4,0.08)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a
            href="https://github.com/infocrud/gobase"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#64748b', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}
          >
            GitHub
          </a>
          <Link
            to="/docs"
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              backgroundColor: '#da5d04',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
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
