import { useState, useEffect } from 'react';
import { apiFetch } from '../store/auth';

export default function StoragePage() {
  const [buckets, setBuckets] = useState<any[]>([]);
  const [selectedBucket, setSelectedBucket] = useState('');
  const [objects, setObjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newBucket, setNewBucket] = useState('');

  useEffect(() => { fetchBuckets(); }, []);
  useEffect(() => { if (selectedBucket) fetchObjects(); }, [selectedBucket]);

  const fetchBuckets = async () => {
    const res = await apiFetch('/storage/v1/bucket');
    const data = await res.json();
    if (data.success) setBuckets(data.data?.buckets || []);
  };

  const fetchObjects = async () => {
    setLoading(true);
    const res = await apiFetch(`/storage/v1/object/${selectedBucket}`);
    const data = await res.json();
    if (data.success) setObjects(data.data?.objects || []);
    setLoading(false);
  };

  const createBucket = async () => {
    if (!newBucket) return;
    await apiFetch('/storage/v1/bucket', {
      method: 'POST',
      body: JSON.stringify({ name: newBucket }),
    });
    setNewBucket('');
    fetchBuckets();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBucket) return;
    const formData = new FormData();
    formData.append('file', file);
    // apiFetch leaves Content-Type unset for FormData so the browser adds the
    // multipart boundary, and injects the bearer token / refreshes on 401.
    await apiFetch(`/storage/v1/object/${selectedBucket}/${file.name}`, {
      method: 'POST',
      body: formData,
    });
    fetchObjects();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="p-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Storage Browser</h2>
        <p className="text-sm text-[#64748b] mt-1">Manage buckets and files (S3-compatible)</p>
      </div>

      {/* Help Card */}
      <div className="mt-6 mb-6 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
        <p className="text-sm text-blue-700 font-medium">📦 Storage Features</p>
        <p className="text-xs text-blue-700 mt-1">Upload files, create buckets, and generate presigned download URLs</p>
      </div>

      {/* Bucket Management */}
      <div className="flex gap-3 mb-6">
        <div className="flex gap-2 flex-wrap flex-1">
          {buckets.length === 0 ? (
            <div className="w-full p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <p className="text-[#64748b] text-sm">📦 No buckets yet</p>
              <p className="text-xs text-[#94a3b8] mt-1">Create your first bucket using the form below</p>
            </div>
          ) : (
            buckets.map(b => (
              <button
                key={b.name}
                onClick={() => setSelectedBucket(b.name)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  selectedBucket === b.name
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#e2e8f0] text-[#64748b] hover:text-slate-900'
                }`}
              >
                ◫ {b.name}
              </button>
            ))
          )}
        </div>
          <input
            value={newBucket}
            onChange={e => setNewBucket(e.target.value)}
            placeholder="New bucket name"
            className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <button onClick={createBucket} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-sm text-white font-medium transition-all cursor-pointer">
            + Create
          </button>
        </div>

      {/* File Upload */}
      {selectedBucket && (
        <div className="mb-6">
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm text-white font-medium transition-all cursor-pointer">
            ↑ Upload File
            <input type="file" className="hidden" onChange={handleUpload} />
          </label>
        </div>
      )}

      {/* Object List */}
      {selectedBucket && (
        <div className="rounded-xl border border-[#e2e8f0] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f1f5f9]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">Size</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">Modified</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-[#64748b]">Loading...</td></tr>
              ) : objects.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-[#64748b]">No files in this bucket</td></tr>
              ) : (
                objects.map(obj => (
                  <tr key={obj.key} className="border-t border-[#e2e8f0] hover:bg-[#f1f5f9] transition-colors">
                    <td className="px-4 py-3 text-blue-600 font-mono text-xs">{obj.key}</td>
                    <td className="px-4 py-3 text-[#64748b] text-xs">{formatSize(obj.size)}</td>
                    <td className="px-4 py-3 text-[#64748b] text-xs">{obj.content_type || '-'}</td>
                    <td className="px-4 py-3 text-[#64748b] text-xs">{obj.last_modified ? new Date(obj.last_modified).toLocaleString() : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-[#f1f5f9] border-t border-[#e2e8f0] text-xs text-[#64748b]">
            {objects.length} files in {selectedBucket}
          </div>
        </div>
      )}
    </div>
  );
}
