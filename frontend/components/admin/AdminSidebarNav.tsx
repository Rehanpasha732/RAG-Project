'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, Users, Settings, LogOut, ShieldCheck, Menu, X } from 'lucide-react';
import clsx from 'clsx';
import { useAdminAuth } from '@/context/AdminAuthContext';

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/documents', label: 'Documents', icon: FileText },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebarNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, logout } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen flex bg-[#0b0f14]">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={clsx(
          'fixed md:static inset-y-0 left-0 z-40 w-64 shrink-0 flex flex-col bg-[#0e141b] border-r border-white/10 transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Cortex Admin
            </span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="md:hidden p-1.5 rounded-lg hover:bg-white/10 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-gray-300 min-w-0">
              <div className="w-6 h-6 shrink-0 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-[10px] font-semibold text-white">
                {admin?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <span className="truncate">{admin?.name}</span>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white" title="Logout">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden flex items-center gap-3 px-4 py-3.5 border-b border-white/5">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold">Cortex Admin</span>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
