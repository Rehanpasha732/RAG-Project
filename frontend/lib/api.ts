const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function uploadDocument(file: File): Promise<{
  success: boolean;
  document: Record<string, unknown>;
  extracted: { text: string; textLength: number; pages: number; metadata: Record<string, unknown> };
}> {
  const formData = new FormData();
  formData.append('document', file);

  const res = await fetch(`${API_URL}/documents/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || 'Upload failed');
  }

  return res.json();
}

export async function getDocument(id: string) {
  const res = await fetch(`${API_URL}/documents/${id}`);
  if (!res.ok) throw new Error('Document not found');
  return res.json();
}
