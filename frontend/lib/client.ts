const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080/api/v1';

export type ApiResponse<T> = { code: number; message: string; data: T };

export function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || '';
}

export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, cache: 'no-store' });
  const body = (await res.json()) as ApiResponse<T>;
  if (!res.ok || body.code !== 0) {
    if (res.status === 401 || body.code === 40101) clearToken();
    throw new Error(body.message || 'request failed');
  }
  return body.data;
}

export type User = { id: number; username: string; email: string; role: string; status: string };
export type Post = { id: number; title: string; content: string; post_type: string; status: string; like_count: number; favorite_count: number; comment_count: number; created_at: string; author?: User };
export type Comment = { id: number; content: string; status: string; author?: User; created_at: string };
export type Conversation = { id: number; title: string; persona_code: string; created_at: string };
export type AIMessage = { id: number; role: string; content: string; safety_label: string; created_at: string };
export type ModerationJob = { id: number; target_type: string; target_id: number; status: string; risk_level: string; result_json: string; created_at: string };
export type Report = { id: number; target_type: string; target_id: number; reason_code: string; reason_text: string; status: string; created_at: string };
