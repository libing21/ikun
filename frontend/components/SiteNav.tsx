'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { api, clearToken, getToken, User } from '@/lib/client';

export function SiteNav() {
  const [me, setMe] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  const canModerate = me?.role === 'moderator' || me?.role === 'admin';

  useEffect(() => {
    let cancelled = false;

    async function syncMe() {
      const token = getToken();
      if (!token) {
        if (!cancelled) {
          setMe(null);
          setReady(true);
        }
        return;
      }
      try {
        const user = await api<User>('/auth/me');
        if (!cancelled) {
          setMe(user);
        }
      } catch {
        clearToken();
        if (!cancelled) {
          setMe(null);
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    }

    syncMe();
    const onAuthChanged = () => {
      setReady(false);
      syncMe();
    };
    window.addEventListener('auth-changed', onAuthChanged);
    return () => {
      cancelled = true;
      window.removeEventListener('auth-changed', onAuthChanged);
    };
  }, [pathname]);

  function logout() {
    clearToken();
    setMe(null);
    window.location.href = '/';
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <Link href="/posts/create">发帖</Link>
      <Link href="/#feed">评论互动</Link>
      <Link href="/me">我的</Link>
      {canModerate ? <Link href="/admin/moderation">审核后台</Link> : null}
      {canModerate ? <Link href="/admin/site-media">宗主放映位</Link> : null}
      {!ready ? (
        <span className="text-slate-400">加载中...</span>
      ) : me ? (
        <>
          <span className="rounded-full bg-fuchsia-50 px-3 py-1 font-semibold text-fuchsia-700">{me.username}</span>
          <button type="button" onClick={logout} className="bg-white px-3 py-1 text-fuchsia-600 shadow-sm">退出</button>
        </>
      ) : (
        <Link href="/login">登录</Link>
      )}
    </div>
  );
}
