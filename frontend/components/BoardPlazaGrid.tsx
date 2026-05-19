'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, PostTaxonomy } from '@/lib/client';
import { POST_BOARDS, type PostBoard } from '@/lib/post-taxonomy';

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

type BoardWithStats = PostBoard & {
  post_count?: number;
  recent_post_count?: number;
  latest_post_at?: string;
};

export function BoardPlazaGrid() {
  const [boards, setBoards] = useState<BoardWithStats[]>(POST_BOARDS);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    api<PostTaxonomy>('/posts/taxonomy')
      .then((taxonomy) => {
        if (!cancelled) {
          setBoards(taxonomy.boards as BoardWithStats[]);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : '板块统计加载失败');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-4">
      {message ? <div className="card border-fuchsia-100 bg-fuchsia-50 text-sm text-fuchsia-700">{message}</div> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {boards.map((board) => (
          <Link
            key={board.slug}
            href={`/boards/${board.slug}`}
            className="card rounded-[2rem] border border-white/70 bg-white/80 p-6 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-fuchsia-100"
          >
            <div className="space-y-4">
              <div className="space-y-3">
                <span className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">{board.name}</span>
                <h2 className="text-xl font-black text-slate-900">{board.name}</h2>
                <p className="text-sm leading-6 text-slate-600">{board.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[1.2rem] bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">总帖数</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">{board.post_count || 0}</p>
                </div>
                <div className="rounded-[1.2rem] bg-fuchsia-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-fuchsia-400">24h 新帖</p>
                  <p className="mt-1 text-2xl font-black text-fuchsia-700">{board.recent_post_count || 0}</p>
                </div>
              </div>

              <div className="rounded-[1.2rem] border border-cyan-100 bg-cyan-50/60 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-500">最新发帖</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">{formatBoardTime(board.latest_post_at)}</p>
              </div>

              <span className="inline-flex text-sm font-semibold text-fuchsia-600">进入板块</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
