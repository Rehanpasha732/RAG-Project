import type { AskSource } from './api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  text: string;
  sources?: AskSource[];
  created_at: string;
}

export interface ConversationDetail extends ConversationSummary {
  messages: ConversationMessage[];
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

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

export async function createConversation(): Promise<{ success: boolean; conversation: ConversationSummary }> {
  const res = await fetch(`${API_URL}/user/conversations`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function listConversations(): Promise<{ success: boolean; conversations: ConversationSummary[] }> {
  const res = await fetch(`${API_URL}/user/conversations`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function getConversation(id: string): Promise<{ success: boolean; conversation: ConversationDetail }> {
  const res = await fetch(`${API_URL}/user/conversations/${id}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function appendMessages(
  id: string,
  question: string,
  answer: string,
  sources: AskSource[]
): Promise<{ success: boolean; conversation: ConversationSummary }> {
  const res = await fetch(`${API_URL}/user/conversations/${id}/messages`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ question, answer, sources }),
  });
  return handleResponse(res);
}

export async function renameConversation(id: string, title: string): Promise<{ success: boolean; conversation: ConversationSummary }> {
  const res = await fetch(`${API_URL}/user/conversations/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ title }),
  });
  return handleResponse(res);
}

export async function deleteConversation(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_URL}/user/conversations/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}
