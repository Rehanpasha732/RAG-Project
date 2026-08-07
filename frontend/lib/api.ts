const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: AuthUser;
}

export interface DocumentItem {
  id: string;
  originalName: string;
  fileName: string;
  mimetype: string;
  size: number;
  sizeFormatted: string;
  pages: number;
  textLength: number;
  uploadedAt: string;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export async function signup(name: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  return handleResponse<AuthResponse>(res);
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<AuthResponse>(res);
}

export async function uploadDocument(file: File): Promise<{ success: boolean; document: Record<string, unknown> }> {
  const formData = new FormData();
  formData.append('document', file);

  const res = await fetch(`${API_URL}/documents/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  return handleResponse(res);
}

export async function listDocuments(): Promise<{ success: boolean; documents: DocumentItem[] }> {
  const res = await fetch(`${API_URL}/documents`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return handleResponse(res);
}

export async function renameDocument(id: string, originalName: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_URL}/documents/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ originalName }),
  });
  return handleResponse(res);
}

export async function deleteDocument(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_URL}/documents/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return handleResponse(res);
}

export interface AskSource {
  file_name: string;
  score: number;
}

export interface AskResponse {
  success: boolean;
  query: string;
  answer: string;
  sources: AskSource[];
}

export async function askQuestion(query: string): Promise<AskResponse> {
  const res = await fetch(`${API_URL}/documents/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ query }),
  });
  return handleResponse(res);
}
