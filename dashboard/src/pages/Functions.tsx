import { useState, useEffect } from 'react';
import { authHeaders } from '../store/auth';

interface FunctionInfo {
  name: string;
  size: number;
  updated_at: string;
}

export default function FunctionsPage() {
  const [functions, setFunctions] = useState<FunctionInfo[]>([]);
  const [code, setCode] = useState('// Your edge function\nconsole.log("Hello from GoBase!");\n');
  const [name, setName] = useState('hello.ts');
  const [invokeResult, setInvokeResult] = useState('');
  const [deploying, setDeploying] = useState(false);

  useEffect(() => { fetchFunctions(); }, []);

  const fetchFunctions = async () => {
    const res = await fetch('/functions/v1/', { headers: authHeaders() });
    const data = await res.json();
    if (data.success) setFunctions(data.data?.functions || []);
  };

  const deploy = async () => {
    setDeploying(true);
    const token = localStorage.getItem('gobase_token');
    await fetch(`/functions/v1/deploy?name=${encodeURIComponent(name)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: code,
    });
    setDeploying(false);
    fetchFunctions();
  };

  const invoke = async (funcName: string) => {
    setInvokeResult('Running...');
    const res = await fetch(`/functions/v1/${encodeURIComponent(funcName)}`, {
      method: 'POST',
      headers: authHeaders(),
      body: '{}',
    });
    const data = await res.json();
    setInvokeResult(JSON.stringify(data, null, 2));
  };

  const deleteFunc = async (funcName: string) => {
    await fetch(`/functions/v1/${encodeURIComponent(funcName)}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    fetchFunctions();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Edge Functions</h2>

      <div className="grid grid-cols-2 gap-6">
        {/* Deploy Panel */}
        <div className="rounded-xl border border-[hsl(217.2,32.6%,17.5%)] p-4">
          <h3 className="text-sm font-semibold text-[hsl(215,20.2%,65.1%)] uppercase mb-3">Deploy Function</h3>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="function-name.ts"
            className="w-full px-3 py-2 mb-3 rounded-lg bg-[hsl(217.2,32.6%,17.5%)] border border-[hsl(217.2,32.6%,22%)] text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            rows={10}
            className="w-full px-3 py-2 mb-3 rounded-lg bg-[hsl(222.2,84%,3%)] border border-[hsl(217.2,32.6%,17.5%)] text-green-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
          />
          <button
            onClick={deploy}
            disabled={deploying}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-sm text-white font-medium transition-all disabled:opacity-50 cursor-pointer"
          >
            {deploying ? 'Deploying...' : '🚀 Deploy'}
          </button>
        </div>

        {/* Invoke Result */}
        <div className="rounded-xl border border-[hsl(217.2,32.6%,17.5%)] p-4">
          <h3 className="text-sm font-semibold text-[hsl(215,20.2%,65.1%)] uppercase mb-3">Invoke Result</h3>
          <pre className="p-4 rounded-lg bg-[hsl(222.2,84%,3%)] border border-[hsl(217.2,32.6%,17.5%)] text-green-400 font-mono text-xs min-h-64 overflow-auto whitespace-pre-wrap">
            {invokeResult || 'Click "Run" on a function to see output here.'}
          </pre>
        </div>
      </div>

      {/* Function List */}
      <div className="mt-6 rounded-xl border border-[hsl(217.2,32.6%,17.5%)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[hsl(217.2,32.6%,12%)]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(215,20.2%,65.1%)] uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(215,20.2%,65.1%)] uppercase">Size</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(215,20.2%,65.1%)] uppercase">Updated</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[hsl(215,20.2%,65.1%)] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {functions.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-[hsl(215,20.2%,65.1%)]">No functions deployed</td></tr>
            ) : (
              functions.map(f => (
                <tr key={f.name} className="border-t border-[hsl(217.2,32.6%,17.5%)] hover:bg-[hsl(217.2,32.6%,10%)] transition-colors">
                  <td className="px-4 py-3 text-blue-400 font-mono text-xs">{f.name}</td>
                  <td className="px-4 py-3 text-[hsl(215,20.2%,65.1%)] text-xs">{f.size} bytes</td>
                  <td className="px-4 py-3 text-[hsl(215,20.2%,65.1%)] text-xs">{f.updated_at ? new Date(f.updated_at).toLocaleString() : '-'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => invoke(f.name)} className="px-3 py-1 rounded bg-blue-600/20 text-blue-400 text-xs hover:bg-blue-600/30 transition-all cursor-pointer">
                      ▶ Run
                    </button>
                    <button onClick={() => deleteFunc(f.name)} className="px-3 py-1 rounded bg-red-600/20 text-red-400 text-xs hover:bg-red-600/30 transition-all cursor-pointer">
                      ✕ Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
