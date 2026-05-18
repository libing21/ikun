'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, SiteLoopMediaItem } from '@/lib/client';

const ROTATE_MS = 4500;

export function SiteLoopMedia() {
  const [items, setItems] = useState<SiteLoopMediaItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api<SiteLoopMediaItem[]>('/site/loop-media')
      .then(setItems)
      .catch((error) => setMessage(error instanceof Error ? error.message : '放映位加载失败'));
  }, []);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [items.length]);

  const active = useMemo(() => items[activeIndex] || null, [activeIndex, items]);

  if (!active) {
    return (
      <div className="card border-cyan-100 bg-gradient-to-br from-white/95 to-cyan-50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-950">宗主放映位</h2>
          <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-700">管理员可配</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">{message || '还没有启用的轮播素材，管理员可在顶部“宗主放映位”入口里添加图片或视频链接。'}</p>
      </div>
    );
  }

  return (
    <div className="card border-cyan-100 bg-gradient-to-br from-white/95 to-cyan-50">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-950">宗主放映位</h2>
        <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-700">
          {items.length > 1 ? `${activeIndex + 1}/${items.length}` : '单条展示'}
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-800">{active.title}</p>
      <div className="mt-3 overflow-hidden rounded-[1.4rem] border border-cyan-100 bg-slate-950/5">
        {active.media_type === 'video' ? (
          <video
            key={active.id}
            src={active.media_url}
            poster={active.poster_url || undefined}
            className="h-48 w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            controls
          />
        ) : (
          <img
            src={active.media_url}
            alt={active.title}
            className="h-48 w-full object-cover"
          />
        )}
      </div>
      <div className="mt-3 flex gap-2">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-label={`查看第 ${index + 1} 条素材`}
            onClick={() => setActiveIndex(index)}
            className={`h-2 flex-1 rounded-full transition ${index === activeIndex ? 'bg-cyan-500' : 'bg-cyan-100'}`}
          />
        ))}
      </div>
    </div>
  );
}
