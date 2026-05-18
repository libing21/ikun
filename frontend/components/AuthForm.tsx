'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { api, clearToken, getToken, setToken, User } from '@/lib/client';
import { useRouter } from 'next/navigation';

type AuthResult = { token: string; user: User };

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken()) router.replace('/me');
  }, [router]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    clearToken();
    const form = new FormData(e.currentTarget);
    const payload: Record<string, string> = { email: String(form.get('email')), password: String(form.get('password')) };
    if (mode === 'register') payload.username = String(form.get('username'));
    try {
      const out = await api<AuthResult>(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(payload) });
      setToken(out.token);
      router.push('/me');
    } catch (err) {
      const message = err instanceof Error ? err.message : '请求失败';
      if (message.includes('invalid credentials')) {
        setError('账号或密码不正确。如果还没有账号，请先注册。');
      } else if (message.includes('user is not active')) {
        setError('账号当前不可用，请联系管理员。');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="card mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-bold">{mode === 'login' ? '登录' : '注册'}</h1>
      {mode === 'register' && <input name="username" placeholder="用户名" required />}
      <input name="email" type="email" placeholder="邮箱" required />
      <input name="password" type="password" placeholder="密码至少 8 位" minLength={8} required />
      {error && <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <button disabled={loading} className="w-full">{loading ? '提交中...' : '提交'}</button>
      <p className="text-center text-sm text-slate-500">
        {mode === 'login' ? <>还没有账号？<Link href="/register" className="font-semibold">去注册</Link></> : <>已有账号？<Link href="/login" className="font-semibold">去登录</Link></>}
      </p>
    </form>
  );
}
