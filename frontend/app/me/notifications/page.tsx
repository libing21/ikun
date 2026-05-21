'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, emitNotificationsChanged, NotificationItem } from '@/lib/client';

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    setItems(await api<NotificationItem[]>('/me/notifications'));
  }

  useEffect(() => {
    load().catch((error) => setMessage(error instanceof Error ? error.message : '通知加载失败'));
  }, []);

  async function markRead(id: number) {
    await api(`/me/notifications/${id}/read`, { method: 'POST' });
    setItems((current) => current.map((item) => (item.id === id ? { ...item, is_read: true } : item)));
    emitNotificationsChanged();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">消息通知</h1>
          <p className="mt-1 text-sm text-slate-500">点赞、评论、回复、审核结果都会汇总在这里。</p>
        </div>
        <Link href="/me" className="text-sm font-semibold text-fuchsia-600">返回我的主页</Link>
      </div>
      {message ? <p className="text-sm text-fuchsia-600">{message}</p> : null}
      {items.length === 0 ? <div className="card text-slate-500">暂时还没有新通知。</div> : null}
      {items.map((item) => (
        <article key={item.id} className={`card space-y-3 ${item.is_read ? 'opacity-75' : 'border-fuchsia-100 bg-fuchsia-50/40'}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {!item.is_read ? <span className="rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-bold text-fuchsia-700">未读</span> : null}
                <p className="text-lg font-bold text-slate-950">{item.title}</p>
              </div>
              <p className="mt-2 text-sm text-slate-600">{item.content || '你有一条新的互动提醒。'}</p>
              <p className="mt-2 text-xs text-slate-400">
                {item.actor?.username ? `来自 ${item.actor.username} · ` : ''}
                {formatTime(item.created_at)}
              </p>
            </div>
            <div className="flex gap-2">
              {item.link_url ? (
                <Link href={item.link_url} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-cyan-700 shadow-sm">
                  查看内容
                </Link>
              ) : null}
              {!item.is_read ? (
                <button type="button" onClick={() => markRead(item.id)} className="bg-white px-3 py-1 text-xs text-fuchsia-600 shadow-sm">
                  标记已读
                </button>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
