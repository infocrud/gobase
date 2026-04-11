import { useState } from 'react';
import { authHeaders } from '../store/auth';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Query users table directly via REST API
      const res = await fetch('/rest/v1/users?limit=100', { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch {
      // Users table may not have a policy — that's expected
      setUsers([]);
    }
    setSearched(true);
    setLoading(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Users</h2>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm text-white font-medium transition-all cursor-pointer"
        >
          Load Users
        </button>
      </div>

      {!searched && (
        <div className="rounded-xl border border-[hsl(217.2,32.6%,17.5%)] p-12 text-center">
          <p className="text-[hsl(215,20.2%,65.1%)] text-lg mb-2">User Management</p>
          <p className="text-[hsl(215,20.2%,45%)] text-sm">Click "Load Users" to fetch all registered users from the database.</p>
          <p className="text-[hsl(215,20.2%,45%)] text-xs mt-4">💡 Note: You may need an RLS policy allowing SELECT on the users table.</p>
        </div>
      )}

      {searched && (
        <div className="rounded-xl border border-[hsl(217.2,32.6%,17.5%)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[hsl(217.2,32.6%,12%)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(215,20.2%,65.1%)] uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(215,20.2%,65.1%)] uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(215,20.2%,65.1%)] uppercase">Provider</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(215,20.2%,65.1%)] uppercase">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-[hsl(215,20.2%,65.1%)]">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-[hsl(215,20.2%,65.1%)]">No users found or access denied</td></tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="border-t border-[hsl(217.2,32.6%,17.5%)] hover:bg-[hsl(217.2,32.6%,10%)] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-blue-400">{user.id}</td>
                    <td className="px-4 py-3 text-white">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs bg-[hsl(217.2,32.6%,17.5%)] text-[hsl(215,20.2%,65.1%)]">
                        {user.provider || 'email'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[hsl(215,20.2%,65.1%)]">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-[hsl(217.2,32.6%,10%)] border-t border-[hsl(217.2,32.6%,17.5%)] text-xs text-[hsl(215,20.2%,65.1%)]">
            {users.length} users
          </div>
        </div>
      )}
    </div>
  );
}
