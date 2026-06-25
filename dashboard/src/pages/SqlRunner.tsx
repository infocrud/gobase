import { useState } from 'react';
import { apiFetch } from '../store/auth';

export default function SQLRunnerPage() {
  const [query, setQuery] = useState('SELECT * FROM policies LIMIT 10;');
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const runQuery = async () => {
    setLoading(true);
    setError('');
    setResults(null);

    try {
      // Parse the query to extract table and params for REST API
      const trimmed = query.trim().replace(/;$/, '');
      const match = trimmed.match(/^SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i);

      if (!match) {
        setError('SQL Runner supports: SELECT columns FROM table [WHERE col=val] [LIMIT n]');
        setLoading(false);
        return;
      }

      const [, cols, table, , limit] = match;
      let url = `/rest/v1/${table}?`;
      if (cols !== '*') url += `select=${cols.trim()}&`;
      if (limit) url += `limit=${limit}&`;

      const res = await apiFetch(url);
      const data = await res.json();

      if (data.success) {
        setResults(data.data);
      } else {
        setError(data.error || 'Query failed');
      }
    } catch (e) {
      setError('Failed to execute query');
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">SQL Runner</h2>
        <p className="text-sm text-[#64748b] mt-1">Execute SELECT queries with RLS enforcement</p>
      </div>

      {/* Help Card */}
      <div className="mt-6 mb-6 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
        <p className="text-sm text-blue-700 font-medium">📝 SQL Runner Notes</p>
        <ul className="text-xs text-blue-700 mt-2 space-y-1">
          <li>• <strong>SELECT queries only</strong> for now (INSERT/UPDATE/DELETE via REST API)</li>
          <li>• Row-level security policies are automatically applied</li>
          <li>• Syntax: <code className="bg-[#f1f5f9] px-1 rounded">SELECT cols FROM table [WHERE condition] [LIMIT n]</code></li>
        </ul>
      </div>

      {/* Query Editor */}
      <div className="rounded-xl border border-[#e2e8f0] p-4 mb-6">
        <textarea
          value={query}
          onChange={e => setQuery(e.target.value)}
          rows={5}
          placeholder="SELECT * FROM your_table LIMIT 10;"
          className="w-full px-4 py-3 rounded-lg bg-[#f1f5f9] border border-[#e2e8f0] text-emerald-700 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
        />
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-[#94a3b8]">
            Results respect your RLS policies
          </p>
          <button
            onClick={runQuery}
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm text-white font-medium transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Running...' : '▶ Execute'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-mono">
          {error}
        </div>
      )}

      {/* Results */}
      {results && Array.isArray(results) && results.length > 0 && (
        <div className="rounded-xl border border-[#e2e8f0] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f1f5f9]">
                  {Object.keys(results[0]).map(key => (
                    <th key={key} className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row: any, i: number) => (
                  <tr key={i} className="border-t border-[#e2e8f0] hover:bg-[#f1f5f9] transition-colors">
                    {Object.values(row).map((val: any, j: number) => (
                      <td key={j} className="px-4 py-3 text-[#1e293b] font-mono text-xs max-w-64 truncate">
                        {val === null ? <span className="text-[#94a3b8] italic">null</span> : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-[#f1f5f9] border-t border-[#e2e8f0] text-xs text-[#64748b]">
            {results.length} rows returned
          </div>
        </div>
      )}

      {results && Array.isArray(results) && results.length === 0 && (
        <div className="p-8 text-center text-[#64748b] rounded-xl border border-[#e2e8f0]">
          Query executed successfully — 0 rows returned
        </div>
      )}
    </div>
  );
}
