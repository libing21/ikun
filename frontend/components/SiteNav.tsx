'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { api, clearToken, getToken, NotificationUnreadCount, User } from '@/lib/client';

export function SiteNav() {
  const [me, setMe] = useState<User | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
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
          setUnreadCount(0);
          setReady(true);
        }
        return;
      }
      try {
        const [user, unread] = await Promise.all([
          api<User>('/auth/me'),
          api<NotificationUnreadCount>('/me/notifications/unread-count').catch(() => ({ unread_count: 0 })),
        ]);
        if (!cancelled) {
          setMe(user);
          setUnreadCount(unread.unread_count || 0);
        }
      } catch {
        clearToken();
        if (!cancelled) {
          setMe(null);
          setUnreadCount(0);
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
    const onNotificationsChanged = () => {
      syncMe();
    };
    window.addEventListener('auth-changed', onAuthChanged);
    window.addEventListener('notifications-changed', onNotificationsChanged);
    return () => {
      cancelled = true;
      window.removeEventListener('auth-changed', onAuthChanged);
      window.removeEventListener('notifications-changed', onNotificationsChanged);
    };
  }, [pathname]);

  function logout() {
    clearToken();
    setMe(null);
    window.location.href = '/';
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <Link href="/boards">板块</Link>
      <Link href="/posts/create">发帖</Link>
      <Link href="/#feed">评论互动</Link>
      <Link href="/me">我的</Link>
      {me ? (
        <Link href="/me/notifications" className="relative inline-flex items-center gap-2">
          <span>通知</span>
          {unreadCount > 0 ? (
            <>
              <span className="absolute -right-2 -top-1 h-2.5 w-2.5 rounded-full bg-rose-500" />
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            </>
          ) : null}
        </Link>
      ) : null}
      {canModerate ? <Link href="/admin">运营总览</Link> : null}
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
