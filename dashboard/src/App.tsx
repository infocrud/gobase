import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
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
