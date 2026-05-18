'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, clearToken, getToken, User } from '@/lib/client';

export function SiteNav() {
  const [me, setMe] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setReady(true);
      return;
    }
    api<User>('/auth/me')
      .then(setMe)
      .catch(() => {
        clearToken();
        setMe(null);
      })
      .finally(() => setReady(true));
  }, []);

  function logout() {
    clearToken();
    setMe(null);
    window.location.href = '/';
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <Link href="/posts/create">发帖</Link>
      <Link href="/ai">热点雷达</Link>
      <Link href="/me">我的</Link>
      <Link href="/admin/moderation">审核后台</Link>
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
