'use client';

import { useCallback, useEffect, useState } from 'react';
import { Users, FileText, MessageSquare, Loader2, RefreshCw } from 'lucide-react';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminSidebarNav from '@/components/admin/AdminSidebarNav';
import * as adminApi from '@/lib/adminApi';
import type { AdminStats } from '@/lib/adminApi';

function DashboardContent() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getDashboardStats();
      setStats(res.stats);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const cards = [
    { label: 'Total Users', value: stats?.totalUsers, icon: Users, color: 'from-teal-500 to-cyan-500' },
    { label: 'Total Documents', value: stats?.totalDocuments, icon: FileText, color: 'from-cyan-500 to-blue-500' },
    { label: 'Total Conversations', value: stats?.totalConversations, icon: MessageSquare, color: 'from-teal-500 to-emerald-500' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-gray-500 text-sm mb-8">Overview of your Cortex workspace.</p>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center">
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button onClick={fetchStats} className="btn-secondary text-sm inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-3 gap-5">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass-card p-6">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-3xl font-bold">{value ?? 0}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminProtectedRoute>
      <AdminSidebarNav>
        <DashboardContent />
      </AdminSidebarNav>
    </AdminProtectedRoute>
  );
}
