'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeft, Lock, User, Loader2, Save } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import * as settingsApi from '@/lib/settingsApi';

function SettingsContent() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSavingProfile(true);
    try {
      await settingsApi.updateProfile(name.trim());
      toast.success('Profile updated');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      toast.error(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSavingPassword(true);
    try {
      await settingsApi.changePassword(currentPassword, newPassword, confirmPassword);
      toast.success('Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      toast.error(message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0f14]">
      <header className="border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="glass-card p-6">
          <h2 className="flex items-center gap-2 font-semibold mb-1">
            <User className="w-4 h-4 text-teal-400" /> Profile
          </h2>
          <p className="text-xs text-gray-500 mb-5">Basic account information.</p>

          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Full name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input w-full py-2.5 px-4 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input
                value={user?.email || ''}
                disabled
                className="glass-input w-full py-2.5 px-4 text-sm opacity-60 cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="btn-primary !py-2.5 !px-5 text-sm flex items-center gap-2"
            >
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save profile
            </button>
          </form>
        </div>

        <div className="glass-card p-6">
          <h2 className="flex items-center gap-2 font-semibold mb-1">
            <Lock className="w-4 h-4 text-teal-400" /> Change password
          </h2>
          <p className="text-xs text-gray-500 mb-5">Use at least 6 characters.</p>

          <form onSubmit={handlePasswordChange} className="space-y-4">
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
            <button
              type="submit"
              disabled={savingPassword}
              className="btn-primary !py-2.5 !px-5 text-sm flex items-center gap-2"
            >
              {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Update password
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
