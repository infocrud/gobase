import { useState, useEffect } from 'react';
import { apiFetch } from '../store/auth';

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
    const res = await apiFetch('/functions/v1/');
    const data = await res.json();
    if (data.success) setFunctions(data.data?.functions || []);
  };

  const deploy = async () => {
    setDeploying(true);
    await apiFetch(`/functions/v1/deploy?name=${encodeURIComponent(name)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: code,
    });
    setDeploying(false);
    fetchFunctions();
  };

  const invoke = async (funcName: string) => {
    setInvokeResult('Running...');
    const res = await apiFetch(`/functions/v1/${encodeURIComponent(funcName)}`, {
      method: 'POST',
      body: '{}',
    });
    const data = await res.json();
    setInvokeResult(JSON.stringify(data, null, 2));
  };

  const deleteFunc = async (funcName: string) => {
    await apiFetch(`/functions/v1/${encodeURIComponent(funcName)}`, {
      method: 'DELETE',
    });
    fetchFunctions();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Edge Functions</h2>

      <div className="grid grid-cols-2 gap-6">
        {/* Deploy Panel */}
        <div className="rounded-xl border border-[#e2e8f0] p-4">
          <h3 className="text-sm font-semibold text-[#64748b] uppercase mb-3">Deploy Function</h3>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="function-name.ts"
            className="w-full px-3 py-2 mb-3 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            rows={10}
            className="w-full px-3 py-2 mb-3 rounded-lg bg-[#f1f5f9] border border-[#e2e8f0] text-emerald-700 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
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
        <div className="rounded-xl border border-[#e2e8f0] p-4">
          <h3 className="text-sm font-semibold text-[#64748b] uppercase mb-3">Invoke Result</h3>
          <pre className="p-4 rounded-lg bg-[#f1f5f9] border border-[#e2e8f0] text-emerald-700 font-mono text-xs min-h-64 overflow-auto whitespace-pre-wrap">
            {invokeResult || 'Click "Run" on a function to see output here.'}
          </pre>
        </div>
      </div>

      {/* Function List */}
      <div className="mt-6 rounded-xl border border-[#e2e8f0] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f1f5f9]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">Size</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">Updated</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[#64748b] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {functions.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-[#64748b]">No functions deployed</td></tr>
            ) : (
              functions.map(f => (
                <tr key={f.name} className="border-t border-[#e2e8f0] hover:bg-[#f1f5f9] transition-colors">
                  <td className="px-4 py-3 text-blue-600 font-mono text-xs">{f.name}</td>
                  <td className="px-4 py-3 text-[#64748b] text-xs">{f.size} bytes</td>
                  <td className="px-4 py-3 text-[#64748b] text-xs">{f.updated_at ? new Date(f.updated_at).toLocaleString() : '-'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => invoke(f.name)} className="px-3 py-1 rounded bg-blue-600/20 text-blue-600 text-xs hover:bg-blue-600/30 transition-all cursor-pointer">
                      ▶ Run
                    </button>
                    <button onClick={() => deleteFunc(f.name)} className="px-3 py-1 rounded bg-red-600/20 text-red-600 text-xs hover:bg-red-600/30 transition-all cursor-pointer">
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
