import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

const navItems = [
  { path: '/tables', label: 'Table Editor', icon: '⊞' },
  { path: '/users', label: 'Users', icon: '◉' },
  { path: '/storage', label: 'Storage', icon: '◫' },
  { path: '/functions', label: 'Functions', icon: 'ƒ' },
  { path: '/sql', label: 'SQL Runner', icon: '⌘' },
];

export default function Layout() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [showBetaInfo, setShowBetaInfo] = React.useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[hsl(222.2,84%,4.9%)] flex-col">
      {/* Beta Banner */}
      {showBetaInfo && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="text-sm font-medium text-amber-200">Beta Dashboard</p>
              <p className="text-xs text-amber-200/70">Read-only for now. Use <a href="https://docs.gobase.io/api" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-100">REST API</a> for data edits.</p>
            </div>
          </div>
          <button
            onClick={() => setShowBetaInfo(false)}
            className="text-amber-200/70 hover:text-amber-200 text-lg leading-none"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-[hsl(217.2,32.6%,17.5%)] flex flex-col">
          <div className="p-5 border-b border-[hsl(217.2,32.6%,17.5%)]">
            <div className="bg-white rounded-lg px-3 py-1.5 inline-flex">
              <img src="/gobase-logo.svg" alt="GoBase" style={{ height: '26px' }} />
            </div>
            <p className="text-xs text-[hsl(215,20.2%,65.1%)] mt-2">Admin Dashboard</p>
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20">
              <span className="text-amber-400 text-xs font-semibold">BETA</span>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                      : 'text-[hsl(215,20.2%,65.1%)] hover:text-white hover:bg-[hsl(217.2,32.6%,17.5%)]'
                  }`
                }
              >
                <span className="text-lg w-5 text-center">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="p-3 border-t border-[hsl(217.2,32.6%,17.5%)] space-y-2">
            <a
              href="https://docs.gobase.io"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[hsl(215,20.2%,65.1%)] hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200 cursor-pointer"
            >
              <span className="text-lg w-5 text-center">📚</span>
              Docs
            </a>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[hsl(215,20.2%,65.1%)] hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
            >
              <span className="text-lg w-5 text-center">⏻</span>
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import React from 'react';
