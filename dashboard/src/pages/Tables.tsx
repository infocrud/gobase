import { useState, useEffect, useRef, FormEvent } from 'react';
import { authHeaders } from '../store/auth';

interface Column {
  name: string;
  data_type: string;
  is_nullable: boolean;
  is_primary: boolean;
}

interface TableSchema {
  name: string;
  columns: Column[];
  primary_key: string;
}

type RowData = Record<string, any>;

const PAGE_SIZE = 50;

// ── Insert / Edit Modal ───────────────────────────────────────────────────────

function RowModal({
  schema,
  initial,
  onClose,
  onSave,
}: {
  schema: TableSchema;
  initial?: RowData;
  onClose: () => void;
  onSave: (data: RowData) => Promise<void>;
}) {
  const isEdit = !!initial;
  const editableCols = schema.columns.filter(c => !c.is_primary || isEdit);
  const [form, setForm] = useState<RowData>(() => {
    const d: RowData = {};
    editableCols.forEach(c => { d[c.name] = initial ? (initial[c.name] ?? '') : ''; });
    return d;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      // Strip PK from insert payload
      const payload = isEdit ? { ...form } : Object.fromEntries(
        Object.entries(form).filter(([k]) => !schema.columns.find(c => c.name === k && c.is_primary))
      );
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-[hsl(222.2,84%,6%)] border border-[hsl(217.2,32.6%,17.5%)] rounded-xl w-full max-w-lg p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-white font-semibold text-lg mb-4">{isEdit ? 'Edit Row' : 'Insert Row'} — {schema.name}</h3>
        <form onSubmit={handleSubmit} className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {editableCols.map(col => (
            <div key={col.name}>
              <label className="block text-xs text-[hsl(215,20.2%,65.1%)] mb-1 font-medium">
                {col.name}
                <span className="text-[hsl(215,20.2%,45%)] ml-2 font-normal">{col.data_type}</span>
                {col.is_primary && <span className="ml-1 text-yellow-400 text-[10px]">PK</span>}
              </label>
              <input
                type="text"
                value={form[col.name] ?? ''}
                onChange={e => setForm(f => ({ ...f, [col.name]: e.target.value }))}
                placeholder={col.is_nullable ? 'null' : ''}
                disabled={col.is_primary && !isEdit}
                className="w-full px-3 py-2 bg-[hsl(217.2,32.6%,12%)] border border-[hsl(217.2,32.6%,22%)] rounded-lg text-white text-sm font-mono placeholder:text-[hsl(215,20.2%,35%)] focus:outline-none focus:border-blue-500 disabled:opacity-40"
              />
            </div>
          ))}
        </form>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-[hsl(217.2,32.6%,17.5%)] text-[hsl(215,20.2%,65.1%)] hover:text-white text-sm transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Insert Row'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onCancel}>
      <div
        className="bg-[hsl(222.2,84%,6%)] border border-red-500/30 rounded-xl p-6 w-80 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-white font-semibold mb-2">Delete row?</h3>
        <p className="text-sm text-[hsl(215,20.2%,65.1%)] mb-5">This action is irreversible.</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 px-3 py-2 rounded-lg bg-[hsl(217.2,32.6%,17.5%)] text-[hsl(215,20.2%,65.1%)] hover:text-white text-sm transition-all cursor-pointer">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-all cursor-pointer">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TablesPage() {
  const [tables, setTables] = useState<TableSchema[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [rows, setRows] = useState<RowData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<'insert' | 'edit' | null>(null);
  const [editRow, setEditRow] = useState<RowData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RowData | null>(null);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { fetchSchema(); }, []);
  useEffect(() => { if (selectedTable) { setPage(0); fetchRows(0); } }, [selectedTable]);

  const showToast = (msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3000);
  };

  const fetchSchema = async () => {
    const res = await fetch('/rest/v1/_schema', { headers: authHeaders() });
    const data = await res.json();
    if (data.success) setTables(data.data || []);
  };

  const fetchRows = async (p = page) => {
    setLoading(true);
    const res = await fetch(
      `/rest/v1/${selectedTable}?limit=${PAGE_SIZE}&offset=${p * PAGE_SIZE}`,
      { headers: authHeaders() }
    );
    const data = await res.json();
    if (data.success) {
      setRows(data.data?.rows ?? data.data ?? []);
      setTotal(data.data?.total ?? data.data?.count ?? 0);
    }
    setLoading(false);
  };

  const selectedSchema = tables.find(t => t.name === selectedTable);
  const pkCol = selectedSchema?.primary_key || selectedSchema?.columns.find(c => c.is_primary)?.name || 'id';

  const handleInsert = async (payload: RowData) => {
    const res = await fetch(`/rest/v1/${selectedTable}`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    showToast('Row inserted');
    fetchRows();
  };

  const handleEdit = async (payload: RowData) => {
    if (!editRow) return;
    const id = editRow[pkCol];
    const res = await fetch(`/rest/v1/${selectedTable}/${id}`, {
      method: 'PATCH',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    showToast('Row updated');
    fetchRows();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget[pkCol];
    await fetch(`/rest/v1/${selectedTable}/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    setDeleteTarget(null);
    showToast('Row deleted');
    fetchRows();
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}

      {/* Modals */}
      {modal === 'insert' && selectedSchema && (
        <RowModal schema={selectedSchema} onClose={() => setModal(null)} onSave={handleInsert} />
      )}
      {modal === 'edit' && selectedSchema && editRow && (
        <RowModal schema={selectedSchema} initial={editRow} onClose={() => { setModal(null); setEditRow(null); }} onSave={handleEdit} />
      )}
      {deleteTarget && (
        <DeleteConfirm onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Table Editor</h2>
          <p className="text-sm text-[hsl(215,20.2%,65.1%)] mt-1">View and edit table data.</p>
        </div>
        <div className="flex gap-2">
          {selectedTable && (
            <button
              onClick={() => setModal('insert')}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all cursor-pointer"
            >
              + Insert Row
            </button>
          )}
          <button
            onClick={fetchSchema}
            className="px-4 py-2 rounded-lg bg-[hsl(217.2,32.6%,17.5%)] text-sm text-[hsl(215,20.2%,65.1%)] hover:text-white transition-all cursor-pointer"
          >
            ↻ Refresh
          </button>
        </div>
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
          <div className="w-full p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <p className="text-[hsl(215,20.2%,65.1%)] text-sm">No tables found</p>
            <p className="text-xs text-[hsl(215,20.2%,45%)] mt-1">Create tables via the SQL runner, then refresh.</p>
          </div>
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
                    <th key={col.name} className="px-4 py-3 text-left text-xs font-semibold text-[hsl(215,20.2%,65.1%)] uppercase tracking-wider whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {col.name}
                        {col.is_primary && <span className="text-yellow-400 text-[10px]">PK</span>}
                      </div>
                      <span className="text-[10px] text-[hsl(215,20.2%,45%)] font-normal normal-case">{col.data_type}</span>
                    </th>
                  ))}
                  {/* Actions column */}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[hsl(215,20.2%,65.1%)] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={selectedSchema.columns.length + 1} className="px-4 py-8 text-center text-[hsl(215,20.2%,65.1%)]">
                      Loading...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={selectedSchema.columns.length + 1} className="px-4 py-8 text-center text-[hsl(215,20.2%,65.1%)]">
                      No rows — click <span className="text-blue-400">+ Insert Row</span> to add one.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, i) => (
                    <tr key={i} className="border-t border-[hsl(217.2,32.6%,17.5%)] hover:bg-[hsl(217.2,32.6%,10%)] transition-colors group">
                      {selectedSchema.columns.map(col => (
                        <td key={col.name} className="px-4 py-3 text-[hsl(210,40%,90%)] font-mono text-xs max-w-48 truncate">
                          {row[col.name] === null || row[col.name] === undefined
                            ? <span className="text-[hsl(215,20.2%,45%)] italic">null</span>
                            : String(row[col.name])}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => { setEditRow(row); setModal('edit'); }}
                          className="text-xs text-[hsl(215,20.2%,55%)] hover:text-blue-400 transition-colors cursor-pointer mr-3 opacity-0 group-hover:opacity-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(row)}
                          className="text-xs text-[hsl(215,20.2%,55%)] hover:text-red-400 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer: count + pagination */}
          <div className="px-4 py-3 bg-[hsl(217.2,32.6%,10%)] border-t border-[hsl(217.2,32.6%,17.5%)] flex items-center justify-between text-xs text-[hsl(215,20.2%,65.1%)]">
            <span>{rows.length} rows{total > rows.length ? ` of ${total}` : ''} • {selectedSchema.columns.length} columns</span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => { const p = page - 1; setPage(p); fetchRows(p); }}
                  className="px-2 py-1 rounded bg-[hsl(217.2,32.6%,17.5%)] hover:text-white disabled:opacity-40 cursor-pointer"
                >
                  ← Prev
                </button>
                <span>Page {page + 1} / {totalPages}</span>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => { const p = page + 1; setPage(p); fetchRows(p); }}
                  className="px-2 py-1 rounded bg-[hsl(217.2,32.6%,17.5%)] hover:text-white disabled:opacity-40 cursor-pointer"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
