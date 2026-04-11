import { useState, useEffect } from 'react';
import { authHeaders } from '../store/auth';

interface TableSchema {
  name: string;
  columns: { name: string; data_type: string; is_nullable: boolean; is_primary: boolean }[];
  primary_key: string;
}

export default function TablesPage() {
  const [tables, setTables] = useState<TableSchema[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSchema();
  }, []);

  useEffect(() => {
    if (selectedTable) fetchRows();
  }, [selectedTable]);

  const fetchSchema = async () => {
    const res = await fetch('/rest/v1/_schema', { headers: authHeaders() });
    const data = await res.json();
    if (data.success) setTables(data.data || []);
  };

  const fetchRows = async () => {
    setLoading(true);
    const res = await fetch(`/rest/v1/${selectedTable}?limit=50`, { headers: authHeaders() });
    const data = await res.json();
    if (data.success) setRows(data.data || []);
    setLoading(false);
  };

  const selectedSchema = tables.find(t => t.name === selectedTable);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Table Editor</h2>
        <button
          onClick={fetchSchema}
          className="px-4 py-2 rounded-lg bg-[hsl(217.2,32.6%,17.5%)] text-sm text-[hsl(215,20.2%,65.1%)] hover:text-white transition-all cursor-pointer"
        >
          ↻ Refresh Schema
        </button>
      </div>

      {/* Table Selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tables.map(t => (
          <button
            key={t.name}
            onClick={() => setSelectedTable(t.name)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              selectedTable === t.name
                ? 'bg-blue-600 text-white'
                : 'bg-[hsl(217.2,32.6%,17.5%)] text-[hsl(215,20.2%,65.1%)] hover:text-white'
            }`}
          >
            {t.name}
          </button>
        ))}
        {tables.length === 0 && (
          <p className="text-[hsl(215,20.2%,65.1%)] text-sm">No tables found. Create tables in MySQL and refresh.</p>
        )}
      </div>

      {/* Data Table */}
      {selectedTable && selectedSchema && (
        <div className="rounded-xl border border-[hsl(217.2,32.6%,17.5%)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[hsl(217.2,32.6%,12%)]">
                  {selectedSchema.columns.map(col => (
                    <th key={col.name} className="px-4 py-3 text-left text-xs font-semibold text-[hsl(215,20.2%,65.1%)] uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        {col.name}
                        {col.is_primary && <span className="text-yellow-400 text-[10px]">PK</span>}
                      </div>
                      <span className="text-[10px] text-[hsl(215,20.2%,45%)] font-normal normal-case">{col.data_type}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={selectedSchema.columns.length} className="px-4 py-8 text-center text-[hsl(215,20.2%,65.1%)]">
                      Loading...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={selectedSchema.columns.length} className="px-4 py-8 text-center text-[hsl(215,20.2%,65.1%)]">
                      No rows found
                    </td>
                  </tr>
                ) : (
                  rows.map((row, i) => (
                    <tr key={i} className="border-t border-[hsl(217.2,32.6%,17.5%)] hover:bg-[hsl(217.2,32.6%,10%)] transition-colors">
                      {selectedSchema.columns.map(col => (
                        <td key={col.name} className="px-4 py-3 text-[hsl(210,40%,90%)] font-mono text-xs max-w-64 truncate">
                          {row[col.name] === null ? <span className="text-[hsl(215,20.2%,45%)] italic">null</span> : String(row[col.name])}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-[hsl(217.2,32.6%,10%)] border-t border-[hsl(217.2,32.6%,17.5%)] text-xs text-[hsl(215,20.2%,65.1%)]">
            {rows.length} rows • {selectedSchema.columns.length} columns
          </div>
        </div>
      )}
    </div>
  );
}
