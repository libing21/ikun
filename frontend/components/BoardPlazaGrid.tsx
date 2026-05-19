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

type BoardPlazaGridProps = {
  compact?: boolean;
  limit?: number;
};

const TOP_BADGE_STYLES = [
  'border-amber-200 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-100 text-amber-900 shadow-lg shadow-amber-100',
  'border-slate-200 bg-gradient-to-r from-slate-200 via-slate-100 to-white text-slate-700 shadow-md shadow-slate-100',
  'border-orange-200 bg-gradient-to-r from-orange-200 via-amber-100 to-white text-orange-700 shadow-md shadow-orange-100',
];

export function BoardPlazaGrid({ compact = false, limit }: BoardPlazaGridProps) {
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

  const visibleBoards = typeof limit === 'number' ? boards.slice(0, limit) : boards;

  return (
    <section className="space-y-4">
      {message ? <div className="card border-fuchsia-100 bg-fuchsia-50 text-sm text-fuchsia-700">{message}</div> : null}
      <div className={`grid gap-4 ${compact ? 'md:grid-cols-3' : 'md:grid-cols-2 xl:grid-cols-3'}`}>
        {visibleBoards.map((board, index) => {
          const isTopBoard = index < 3;
          const badgeStyle = TOP_BADGE_STYLES[index] || TOP_BADGE_STYLES[2];
          return (
          <Link
            key={board.slug}
            href={`/boards/${board.slug}`}
            className={`card rounded-[2rem] border bg-white/80 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-fuchsia-100 ${compact ? 'p-5' : 'p-6'} ${isTopBoard ? 'border-fuchsia-200 shadow-xl shadow-fuchsia-100/70' : 'border-white/70'}`}
          >
            <div className={compact ? 'space-y-3' : 'space-y-4'}>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">{board.name}</span>
                  {isTopBoard ? (
                    <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black tracking-[0.18em] ${badgeStyle}`}>
                      TOP {index + 1}
                    </span>
                  ) : null}
                </div>
                <h2 className="text-xl font-black text-slate-900">{board.name}</h2>
                <p className={`text-sm text-slate-600 ${compact ? 'line-clamp-2 leading-6' : 'leading-6'}`}>{board.description}</p>
              </div>

              {!compact ? (
                <>
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
                </>
              ) : null}

              <span className="inline-flex text-sm font-semibold text-fuchsia-600">进入板块</span>
            </div>
          </Link>
          );
        })}
      </div>
    </section>
  );
}
