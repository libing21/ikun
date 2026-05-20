'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, PostTaxonomy } from '@/lib/client';
import { getBoardHeatMeta } from '@/lib/board-heat';
import { POST_BOARDS } from '@/lib/post-taxonomy';

function formatBoardTime(value?: string) {
  if (!value) return '暂无新帖';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '暂无新帖';
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function BoardHeaderStats({ slug }: { slug: string }) {
  const [taxonomy, setTaxonomy] = useState<PostTaxonomy>({ boards: POST_BOARDS, tags: [] });

  useEffect(() => {
    let cancelled = false;

    api<PostTaxonomy>('/posts/taxonomy')
      .then((data) => {
        if (!cancelled) {
          setTaxonomy(data);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const board = useMemo(() => taxonomy.boards.find((item) => item.slug === slug), [slug, taxonomy.boards]);
  const heat = getBoardHeatMeta(board || {});

  return (
    <div className="space-y-3">
      <div className={`inline-flex rounded-full px-4 py-2 text-sm font-black tracking-[0.24em] ${heat.panelClassName}`}>
        热度状态 {heat.label}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-[1.4rem] bg-white/12 px-4 py-4 backdrop-blur">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">总帖数</p>
        <p className="mt-2 text-3xl font-black text-white">{board?.post_count || 0}</p>
      </div>
      <div className="rounded-[1.4rem] bg-white/12 px-4 py-4 backdrop-blur">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">今日发文</p>
        <p className="mt-2 text-3xl font-black text-white">{board?.today_post_count || 0}</p>
      </div>
      <div className="rounded-[1.4rem] bg-white/12 px-4 py-4 backdrop-blur">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">24h 活跃度</p>
        <p className="mt-2 text-3xl font-black text-white">{board?.recent_post_count || 0}</p>
      </div>
      <div className="rounded-[1.4rem] bg-white/12 px-4 py-4 backdrop-blur">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">最新发帖</p>
        <p className="mt-2 text-sm font-semibold text-white">{formatBoardTime(board?.latest_post_at)}</p>
      </div>
      </div>
    </div>
  );
}
