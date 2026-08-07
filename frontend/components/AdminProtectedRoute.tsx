'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminAuth } from '@/context/AdminAuthContext';

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAdminAuth();
  const router = useRouter();
  const toasted = useRef(false);

  useEffect(() => {
    if (!loading && !admin) {
      if (!toasted.current) {
        toasted.current = true;
        toast.error('Please sign in as an admin to continue');
      }
      router.replace('/admin/login');
    }
  }, [loading, admin, router]);

  if (loading || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f14]">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
