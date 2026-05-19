export function getApiBase() {
  if (process.env.NEXT_PUBLIC_API_BASE) return process.env.NEXT_PUBLIC_API_BASE;
  if (typeof window !== 'undefined') return '/api/v1';
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}/api/v1`;
  return 'http://localhost:3000/api/v1';
}

const API_BASE = getApiBase();

export type ApiResponse<T> = { code: number; message: string; data: T };

export function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || '';
}

export function setToken(token: string) {
  localStorage.setItem('token', token);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth-changed'));
  }
}

export function clearToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('auth-changed'));
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, cache: 'no-store' });
  const raw = await res.text();
  let body: ApiResponse<T> | null = null;
  try {
    body = raw ? (JSON.parse(raw) as ApiResponse<T>) : null;
  } catch {
    throw new Error(`Non-JSON response: ${res.status} ${res.statusText}; body=${raw.slice(0, 200) || '<empty>'}`);
  }
  if (!body) {
    throw new Error(`Empty response: ${res.status} ${res.statusText}`);
  }
  if (!res.ok || body.code !== 0) {
    if (res.status === 401 || body.code === 40101) clearToken();
    throw new Error(body.message || 'request failed');
  }
  return body.data;
}

export type User = { id: number; username: string; email: string; avatar_url: string; bio: string; role: string; status: string };
export type Post = {
  id: number;
  title: string;
  content: string;
  post_type: string;
  status: string;
  like_count: number;
  favorite_count: number;
  comment_count: number;
  created_at: string;
  liked_by_me?: boolean;
  favorited_by_me?: boolean;
  author?: User;
};
export type Comment = { id: number; content: string; status: string; like_count: number; liked_by_me?: boolean; author?: User; created_at: string };
export type Conversation = { id: number; title: string; persona_code: string; created_at: string };
export type AIMessage = { id: number; role: string; content: string; safety_label: string; created_at: string };
export type ModerationJob = {
  id: number;
  target_type: string;
  target_id: number;
  status: string;
  risk_level: string;
  result_json: string;
  created_at: string;
  target_title?: string;
  target_content?: string;
  target_status?: string;
  target_author_username?: string;
};
export type SiteLoopMediaItem = {
  id: number;
  title: string;
  media_type: string;
  media_url: string;
  poster_url: string;
  sort_order: number;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
};
export type GloryRankUser = {
  user_id: number;
  username: string;
  post_count: number;
  like_count: number;
  comment_count: number;
  score: number;
};
export type Report = { id: number; target_type: string; target_id: number; reason_code: string; reason_text: string; status: string; created_at: string };
