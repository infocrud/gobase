import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import Layout from './components/Layout';
import LoginPage from './pages/Login';
import TablesPage from './pages/Tables';
import UsersPage from './pages/Users';
import StoragePage from './pages/Storage';
import FunctionsPage from './pages/Functions';
import SqlRunnerPage from './pages/SqlRunner';
import PlatformPage from './pages/Platform';
import './index.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Handles the OAuth redirect: reads tokens (or error) from the URL fragment,
// applies the session, and routes the user into the app or back to login.
function OAuthCallback() {
  const navigate = useNavigate();
  const applyTokens = useAuthStore((s) => s.applyTokens);
  const setError = useAuthStore((s) => s.setError);
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const access = params.get('access_token');
    const refresh = params.get('refresh_token');
    const err = params.get('error');
    if (access) {
      applyTokens(access, refresh ?? undefined);
      navigate('/', { replace: true });
    } else {
      setError(err || 'OAuth sign-in failed');
      navigate('/login', { replace: true });
    }
  }, [navigate, applyTokens, setError]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
      Signing you in…
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        
        {/* Platform Root - Organization & Project Selection */}
        <Route path="/" element={<ProtectedRoute><PlatformPage /></ProtectedRoute>} />

        {/* Project Studio - Scoped to specific project */}
        <Route
          path="/project/:projectId"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="tables" replace />} />
          <Route path="tables" element={<TablesPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="storage" element={<StoragePage />} />
          <Route path="functions" element={<FunctionsPage />} />
          <Route path="sql" element={<SqlRunnerPage />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
