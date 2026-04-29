import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import DocsLayout from './pages/docs/DocsLayout';
import Intro from './pages/docs/Intro';
import QuickStart from './pages/docs/QuickStart';
import Auth from './pages/docs/Auth';
import Database from './pages/docs/Database';
import Storage from './pages/docs/Storage';
import Realtime from './pages/docs/Realtime';
import Functions from './pages/docs/Functions';
import RLS from './pages/docs/RLS';
import SDK from './pages/docs/SDK';
import Deploy from './pages/docs/Deploy';
import Pricing from './pages/Pricing';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/docs" element={<DocsLayout />}>
          <Route index element={<Intro />} />
          <Route path="quickstart" element={<QuickStart />} />
          <Route path="auth" element={<Auth />} />
          <Route path="database" element={<Database />} />
          <Route path="storage" element={<Storage />} />
          <Route path="realtime" element={<Realtime />} />
          <Route path="functions" element={<Functions />} />
          <Route path="rls" element={<RLS />} />
          <Route path="sdk" element={<SDK />} />
          <Route path="deploy" element={<Deploy />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
