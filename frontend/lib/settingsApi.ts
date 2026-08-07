const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getToken(storageKey: 'token' | 'adminToken' = 'token'): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(storageKey);
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
  storageKey: 'token' | 'adminToken' = 'token'
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_URL}/user/settings/password`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken(storageKey)}`,
    },
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
  });
  return handleResponse(res);
}

export async function updateProfile(
  name: string,
  storageKey: 'token' | 'adminToken' = 'token'
): Promise<{ success: boolean; user: { id: string; name: string; email: string } }> {
  const res = await fetch(`${API_URL}/user/settings/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken(storageKey)}`,
    },
    body: JSON.stringify({ name }),
  });
  return handleResponse(res);
}
