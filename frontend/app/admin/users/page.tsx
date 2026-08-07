'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Search, Loader2, RefreshCw, UserX, UserCheck } from 'lucide-react';
import clsx from 'clsx';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminSidebarNav from '@/components/admin/AdminSidebarNav';
import * as adminApi from '@/lib/adminApi';
import type { AdminUserRow } from '@/lib/adminApi';

function UsersContent() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async (q?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.listUsers(q);
      setUsers(res.users);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggle = async (user: AdminUserRow) => {
    const nextDisabled = !user.disabled;
    const verb = nextDisabled ? 'disable' : 'enable';
    if (!window.confirm(`${verb === 'disable' ? 'Disable' : 'Enable'} ${user.name}? ${nextDisabled ? 'They will be blocked from logging in.' : ''}`)) return;

    setTogglingId(user.id);
    try {
      const res = await adminApi.toggleUserStatus(user.id, nextDisabled);
      setUsers((list) => list.map((u) => (u.id === user.id ? res.user : u)));
      toast.success(`${user.name} ${verb}d`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : `Failed to ${verb} user`;
      toast.error(message);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-1">Users</h1>
      <p className="text-gray-500 text-sm mb-8">Search, review, and manage user access.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          fetchUsers(search);
        }}
        className="relative mb-6 max-w-sm"
      >
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="glass-input w-full py-2.5 pl-10 pr-4 text-sm"
        />
      </form>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center">
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button onClick={() => fetchUsers(search)} className="btn-secondary text-sm inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="glass-card p-12 text-center text-gray-500">No users found.</div>
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-white/10">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                  <td className="px-5 py-3">{u.name}</td>
                  <td className="px-5 py-3 text-gray-400">{u.email}</td>
                  <td className="px-5 py-3 text-gray-400 capitalize">{u.role}</td>
                  <td className="px-5 py-3">
                    <span
                      className={clsx(
                        'px-2 py-0.5 rounded-full text-[11px] font-medium border',
                        u.disabled
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                      )}
                    >
                      {u.disabled ? 'Disabled' : 'Active'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleToggle(u)}
                      disabled={togglingId === u.id}
                      className={clsx(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        u.disabled
                          ? 'bg-teal-500/10 text-teal-400 hover:bg-teal-500/20'
                          : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      )}
                    >
                      {togglingId === u.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : u.disabled ? (
                        <UserCheck className="w-3.5 h-3.5" />
                      ) : (
                        <UserX className="w-3.5 h-3.5" />
                      )}
                      {u.disabled ? 'Enable' : 'Disable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminProtectedRoute>
      <AdminSidebarNav>
        <UsersContent />
      </AdminSidebarNav>
    </AdminProtectedRoute>
  );
}
