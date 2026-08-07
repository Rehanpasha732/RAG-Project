'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Lock, Loader2, Save } from 'lucide-react';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminSidebarNav from '@/components/admin/AdminSidebarNav';
import { useAdminAuth } from '@/context/AdminAuthContext';
import * as settingsApi from '@/lib/settingsApi';

function AdminSettingsContent() {
  const { admin } = useAdminAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      await settingsApi.changePassword(currentPassword, newPassword, confirmPassword, 'adminToken');
      toast.success('Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-1">Settings</h1>
      <p className="text-gray-500 text-sm mb-8">Signed in as {admin?.email}</p>

      <div className="glass-card p-6">
        <h2 className="flex items-center gap-2 font-semibold mb-1">
          <Lock className="w-4 h-4 text-teal-400" /> Change password
        </h2>
        <p className="text-xs text-gray-500 mb-5">Use at least 6 characters.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Current password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="glass-input w-full py-2.5 px-4 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">New password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="glass-input w-full py-2.5 px-4 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Confirm new password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="glass-input w-full py-2.5 px-4 text-sm"
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary !py-2.5 !px-5 text-sm flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Update password
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <AdminProtectedRoute>
      <AdminSidebarNav>
        <AdminSettingsContent />
      </AdminSidebarNav>
    </AdminProtectedRoute>
  );
}
