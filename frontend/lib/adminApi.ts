const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AdminAuthResponse {
  success: boolean;
  token: string;
  user: AdminUser;
}

export interface AdminStats {
  totalUsers: number;
  totalDocuments: number;
  totalConversations: number;
}

export interface AdminDocument {
  id: string;
  originalName: string;
  mimetype: string;
  size: number;
  sizeFormatted: string;
  pages: number;
  textLength: number;
  uploadedAt: string;
  status: 'processing' | 'ready' | 'failed';
  error: string | null;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  disabled: boolean;
  createdAt: string;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminToken');
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export async function adminLogin(email: string, password: string): Promise<AdminAuthResponse> {
  const res = await fetch(`${API_URL}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<AdminAuthResponse>(res);
}

export async function getDashboardStats(): Promise<{ success: boolean; stats: AdminStats }> {
  const res = await fetch(`${API_URL}/admin/dashboard/stats`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return handleResponse(res);
}

export async function adminListDocuments(params?: { userId?: string; status?: string; q?: string }): Promise<{ success: boolean; documents: AdminDocument[] }> {
  const search = new URLSearchParams();
  if (params?.userId) search.set('userId', params.userId);
  if (params?.status) search.set('status', params.status);
  if (params?.q) search.set('q', params.q);
  const qs = search.toString();
  const res = await fetch(`${API_URL}/admin/documents${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return handleResponse(res);
}

export async function adminGetDocument(id: string): Promise<{ success: boolean; document: AdminDocument }> {
  const res = await fetch(`${API_URL}/admin/documents/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return handleResponse(res);
}

export async function adminUploadDocument(file: File): Promise<{ success: boolean; document: Record<string, unknown> }> {
  const formData = new FormData();
  formData.append('document', file);

  const res = await fetch(`${API_URL}/admin/documents/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  return handleResponse(res);
}

export async function adminDeleteDocument(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_URL}/admin/documents/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return handleResponse(res);
}

export async function listUsers(search?: string): Promise<{ success: boolean; users: AdminUserRow[] }> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await fetch(`${API_URL}/admin/users${qs}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return handleResponse(res);
}

export async function toggleUserStatus(id: string, disabled: boolean): Promise<{ success: boolean; user: AdminUserRow }> {
  const res = await fetch(`${API_URL}/admin/users/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ disabled }),
  });
  return handleResponse(res);
}
