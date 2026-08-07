'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Sparkles, LayoutDashboard, MessageSquare, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/context/AuthContext';

const links = [
  { href: '/dashboard', label: 'Documents', icon: LayoutDashboard },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
];

export default function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="relative z-10 border-b border-white/5 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            DocXtract
          </span>
        </Link>

        <nav className="flex items-center gap-1 glass-card !rounded-full p-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300',
                pathname === href
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-semibold text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            {user?.name}
          </div>
          <button
            onClick={handleLogout}
            className="btn-secondary !py-2 !px-3 text-xs flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
