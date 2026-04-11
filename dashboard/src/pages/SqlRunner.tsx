import { useState } from 'react';
import { authHeaders } from '../store/auth';

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

      const res = await fetch(url, { headers: authHeaders() });
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
      <h2 className="text-2xl font-bold text-white mb-6">SQL Runner</h2>

      {/* Query Editor */}
      <div className="rounded-xl border border-[hsl(217.2,32.6%,17.5%)] p-4 mb-6">
        <textarea
          value={query}
          onChange={e => setQuery(e.target.value)}
          rows={5}
          placeholder="SELECT * FROM your_table LIMIT 10;"
          className="w-full px-4 py-3 rounded-lg bg-[hsl(222.2,84%,3%)] border border-[hsl(217.2,32.6%,17.5%)] text-green-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
        />
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-[hsl(215,20.2%,45%)]">
            Queries are routed through the REST API with RLS enforcement.
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
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-mono">
          {error}
        </div>
      )}

      {/* Results */}
      {results && Array.isArray(results) && results.length > 0 && (
        <div className="rounded-xl border border-[hsl(217.2,32.6%,17.5%)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[hsl(217.2,32.6%,12%)]">
                  {Object.keys(results[0]).map(key => (
                    <th key={key} className="px-4 py-3 text-left text-xs font-semibold text-[hsl(215,20.2%,65.1%)] uppercase tracking-wider">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row: any, i: number) => (
                  <tr key={i} className="border-t border-[hsl(217.2,32.6%,17.5%)] hover:bg-[hsl(217.2,32.6%,10%)] transition-colors">
                    {Object.values(row).map((val: any, j: number) => (
                      <td key={j} className="px-4 py-3 text-[hsl(210,40%,90%)] font-mono text-xs max-w-64 truncate">
                        {val === null ? <span className="text-[hsl(215,20.2%,45%)] italic">null</span> : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-[hsl(217.2,32.6%,10%)] border-t border-[hsl(217.2,32.6%,17.5%)] text-xs text-[hsl(215,20.2%,65.1%)]">
            {results.length} rows returned
          </div>
        </div>
      )}

      {results && Array.isArray(results) && results.length === 0 && (
        <div className="p-8 text-center text-[hsl(215,20.2%,65.1%)] rounded-xl border border-[hsl(217.2,32.6%,17.5%)]">
          Query executed successfully — 0 rows returned
        </div>
      )}
    </div>
  );
}
