'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as adminApi from '@/lib/adminApi';

interface AdminAuthContextValue {
  admin: adminApi.AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<adminApi.AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    const storedAdmin = localStorage.getItem('adminUser');
    if (storedToken && storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await adminApi.adminLogin(email, password);
    localStorage.setItem('adminToken', res.token);
    localStorage.setItem('adminUser', JSON.stringify(res.user));
    setAdmin(res.user);
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
