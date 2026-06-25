import { useState } from 'react';
import { apiFetch } from '../store/auth';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Users are managed via the auth admin API (the users table is excluded
      // from the generic REST engine because it holds password hashes).
      const res = await apiFetch('/auth/admin/users?limit=100');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data?.users || []);
      }
    } catch {
      // Requires an admin JWT — non-admin users get a 403.
      setUsers([]);
    }
    setSearched(true);
    setLoading(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Users</h2>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm text-white font-medium transition-all cursor-pointer"
        >
          Load Users
        </button>
      </div>

      {!searched && (
        <div className="rounded-xl border border-[#e2e8f0] p-12 text-center">
          <p className="text-[#64748b] text-lg mb-2">User Management</p>
          <p className="text-[#94a3b8] text-sm">Click "Load Users" to fetch all registered users from the database.</p>
          <p className="text-[#94a3b8] text-xs mt-4">💡 Note: You may need an RLS policy allowing SELECT on the users table.</p>
        </div>
      )}

      {searched && (
        <div className="rounded-xl border border-[#e2e8f0] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f1f5f9]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">Provider</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-[#64748b]">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-[#64748b]">No users found or access denied</td></tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="border-t border-[#e2e8f0] hover:bg-[#f1f5f9] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600">{user.id}</td>
                    <td className="px-4 py-3 text-slate-900">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs bg-[#e2e8f0] text-[#64748b]">
                        {user.provider || 'email'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#64748b]">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-[#f1f5f9] border-t border-[#e2e8f0] text-xs text-[#64748b]">
            {users.length} users
          </div>
        </div>
      )}
    </div>
  );
}
