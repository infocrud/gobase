import { useState, useEffect, useRef, FormEvent } from 'react';
import { apiFetch } from '../store/auth';

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
        className="bg-[#ffffff] border border-[#e2e8f0] rounded-xl w-full max-w-lg p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-slate-900 font-semibold text-lg mb-4">{isEdit ? 'Edit Row' : 'Insert Row'} — {schema.name}</h3>
        <form onSubmit={handleSubmit} className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {editableCols.map(col => (
            <div key={col.name}>
              <label className="block text-xs text-[#64748b] mb-1 font-medium">
                {col.name}
                <span className="text-[#94a3b8] ml-2 font-normal">{col.data_type}</span>
                {col.is_primary && <span className="ml-1 text-yellow-600 text-[10px]">PK</span>}
              </label>
              <input
                type="text"
                value={form[col.name] ?? ''}
                onChange={e => setForm(f => ({ ...f, [col.name]: e.target.value }))}
                placeholder={col.is_nullable ? 'null' : ''}
                disabled={col.is_primary && !isEdit}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:border-blue-500 disabled:opacity-40"
              />
            </div>
          ))}
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-[#e2e8f0] text-[#64748b] hover:text-slate-900 text-sm transition-all cursor-pointer"
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
        className="bg-[#ffffff] border border-red-500/30 rounded-xl p-6 w-80 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-slate-900 font-semibold mb-2">Delete row?</h3>
        <p className="text-sm text-[#64748b] mb-5">This action is irreversible.</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 px-3 py-2 rounded-lg bg-[#e2e8f0] text-[#64748b] hover:text-slate-900 text-sm transition-all cursor-pointer">
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
    const res = await apiFetch('/rest/v1/_schema');
    const data = await res.json();
    if (data.success) setTables(data.data || []);
  };

  const fetchRows = async (p = page) => {
    setLoading(true);
    const res = await apiFetch(
      `/rest/v1/${selectedTable}?limit=${PAGE_SIZE}&offset=${p * PAGE_SIZE}`
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
    const res = await apiFetch(`/rest/v1/${selectedTable}`, {
      method: 'POST',
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
    const res = await apiFetch(`/rest/v1/${selectedTable}/${id}`, {
      method: 'PATCH',
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
    await apiFetch(`/rest/v1/${selectedTable}/${id}`, {
      method: 'DELETE',
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
          <h2 className="text-2xl font-bold text-slate-900">Table Editor</h2>
          <p className="text-sm text-[#64748b] mt-1">View and edit table data.</p>
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
            className="px-4 py-2 rounded-lg bg-[#e2e8f0] text-sm text-[#64748b] hover:text-slate-900 transition-all cursor-pointer"
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
                : 'bg-[#e2e8f0] text-[#64748b] hover:text-slate-900'
            }`}
          >
            {t.name}
          </button>
        ))}
        {tables.length === 0 && (
          <div className="w-full p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <p className="text-[#64748b] text-sm">No tables found</p>
            <p className="text-xs text-[#94a3b8] mt-1">Create tables via the SQL runner, then refresh.</p>
          </div>
        )}
      </div>

      {/* Data Table */}
      {selectedTable && selectedSchema && (
        <div className="rounded-xl border border-[#e2e8f0] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f1f5f9]">
                  {selectedSchema.columns.map(col => (
                    <th key={col.name} className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {col.name}
                        {col.is_primary && <span className="text-yellow-400 text-[10px]">PK</span>}
                      </div>
                      <span className="text-[10px] text-[#94a3b8] font-normal normal-case">{col.data_type}</span>
                    </th>
                  ))}
                  {/* Actions column */}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={selectedSchema.columns.length + 1} className="px-4 py-8 text-center text-[#64748b]">
                      Loading...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={selectedSchema.columns.length + 1} className="px-4 py-8 text-center text-[#64748b]">
                      No rows — click <span className="text-blue-600">+ Insert Row</span> to add one.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, i) => (
                    <tr key={i} className="border-t border-[#e2e8f0] hover:bg-[#f1f5f9] transition-colors group">
                      {selectedSchema.columns.map(col => (
                        <td key={col.name} className="px-4 py-3 text-[#1e293b] font-mono text-xs max-w-48 truncate">
                          {row[col.name] === null || row[col.name] === undefined
                            ? <span className="text-[#94a3b8] italic">null</span>
                            : String(row[col.name])}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => { setEditRow(row); setModal('edit'); }}
                          className="text-xs text-[#94a3b8] hover:text-blue-600 transition-colors cursor-pointer mr-3 opacity-0 group-hover:opacity-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(row)}
                          className="text-xs text-[#94a3b8] hover:text-red-600 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
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
          <div className="px-4 py-3 bg-[#f1f5f9] border-t border-[#e2e8f0] flex items-center justify-between text-xs text-[#64748b]">
            <span>{rows.length} rows{total > rows.length ? ` of ${total}` : ''} • {selectedSchema.columns.length} columns</span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => { const p = page - 1; setPage(p); fetchRows(p); }}
                  className="px-2 py-1 rounded bg-[#e2e8f0] hover:text-slate-900 disabled:opacity-40 cursor-pointer"
                >
                  ← Prev
                </button>
                <span>Page {page + 1} / {totalPages}</span>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => { const p = page + 1; setPage(p); fetchRows(p); }}
                  className="px-2 py-1 rounded bg-[#e2e8f0] hover:text-slate-900 disabled:opacity-40 cursor-pointer"
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
