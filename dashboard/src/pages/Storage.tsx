import { useState, useEffect } from 'react';
import { authHeaders } from '../store/auth';

export default function StoragePage() {
  const [buckets, setBuckets] = useState<any[]>([]);
  const [selectedBucket, setSelectedBucket] = useState('');
  const [objects, setObjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newBucket, setNewBucket] = useState('');

  useEffect(() => { fetchBuckets(); }, []);
  useEffect(() => { if (selectedBucket) fetchObjects(); }, [selectedBucket]);

  const fetchBuckets = async () => {
    const res = await fetch('/storage/v1/bucket', { headers: authHeaders() });
    const data = await res.json();
    if (data.success) setBuckets(data.data?.buckets || []);
  };

  const fetchObjects = async () => {
    setLoading(true);
    const res = await fetch(`/storage/v1/object/${selectedBucket}`, { headers: authHeaders() });
    const data = await res.json();
    if (data.success) setObjects(data.data?.objects || []);
    setLoading(false);
  };

  const createBucket = async () => {
    if (!newBucket) return;
    await fetch('/storage/v1/bucket', {
      method: 'POST',
      headers: authHeaders(),
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
    const token = localStorage.getItem('gobase_token');
    await fetch(`/storage/v1/object/${selectedBucket}/${file.name}`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
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
      <h2 className="text-2xl font-bold text-white mb-6">Storage Browser</h2>

      {/* Bucket Management */}
      <div className="flex gap-3 mb-6">
        <div className="flex gap-2 flex-wrap flex-1">
          {buckets.map(b => (
            <button
              key={b.name}
              onClick={() => setSelectedBucket(b.name)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                selectedBucket === b.name
                  ? 'bg-blue-600 text-white'
                  : 'bg-[hsl(217.2,32.6%,17.5%)] text-[hsl(215,20.2%,65.1%)] hover:text-white'
              }`}
            >
              ◫ {b.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newBucket}
            onChange={e => setNewBucket(e.target.value)}
            placeholder="New bucket name"
            className="px-3 py-2 rounded-lg bg-[hsl(217.2,32.6%,17.5%)] border border-[hsl(217.2,32.6%,22%)] text-white text-sm placeholder-[hsl(215,20.2%,45%)] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <button onClick={createBucket} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-sm text-white font-medium transition-all cursor-pointer">
            + Create
          </button>
        </div>
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
        <div className="rounded-xl border border-[hsl(217.2,32.6%,17.5%)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[hsl(217.2,32.6%,12%)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(215,20.2%,65.1%)] uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(215,20.2%,65.1%)] uppercase">Size</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(215,20.2%,65.1%)] uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(215,20.2%,65.1%)] uppercase">Modified</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-[hsl(215,20.2%,65.1%)]">Loading...</td></tr>
              ) : objects.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-[hsl(215,20.2%,65.1%)]">No files in this bucket</td></tr>
              ) : (
                objects.map(obj => (
                  <tr key={obj.key} className="border-t border-[hsl(217.2,32.6%,17.5%)] hover:bg-[hsl(217.2,32.6%,10%)] transition-colors">
                    <td className="px-4 py-3 text-blue-400 font-mono text-xs">{obj.key}</td>
                    <td className="px-4 py-3 text-[hsl(215,20.2%,65.1%)] text-xs">{formatSize(obj.size)}</td>
                    <td className="px-4 py-3 text-[hsl(215,20.2%,65.1%)] text-xs">{obj.content_type || '-'}</td>
                    <td className="px-4 py-3 text-[hsl(215,20.2%,65.1%)] text-xs">{obj.last_modified ? new Date(obj.last_modified).toLocaleString() : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-[hsl(217.2,32.6%,10%)] border-t border-[hsl(217.2,32.6%,17.5%)] text-xs text-[hsl(215,20.2%,65.1%)]">
            {objects.length} files in {selectedBucket}
          </div>
        </div>
      )}
    </div>
  );
}
