'use client';

import { useEffect, useState } from 'react';
import { api, GloryRankUser } from '@/lib/client';

export function GloryRankBoard() {
  const [users, setUsers] = useState<GloryRankUser[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api<GloryRankUser[]>('/rankings/glory')
      .then(setUsers)
      .catch((error) => setMessage(error instanceof Error ? error.message : '光荣榜加载失败'));
  }, []);

  return (
    <div className="card overflow-hidden border-amber-100 bg-gradient-to-br from-white/95 via-amber-50 to-rose-50">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-amber-200/35 blur-3xl" />
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-950">宗门武力光荣榜</h2>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">近 1 天</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">按最近 1 天已发布帖子的发帖数、点赞数、评论数综合排序，谁最能打一眼就能看出来。</p>

      {users.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-white/80 p-4 text-sm text-slate-500">
          {message || '今天还没有上榜成员，先去发帖抢榜。'}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {users.map((user, index) => (
            <div
              key={user.user_id}
              className={`rounded-[1.5rem] p-[1px] shadow-sm transition ${
                index === 0
                  ? 'bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-300 shadow-amber-100'
                  : index === 1
                    ? 'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-300'
                    : index === 2
                      ? 'bg-gradient-to-r from-orange-200 via-amber-100 to-rose-200'
                      : 'bg-white/60'
              }`}
            >
              <div className="flex items-center justify-between gap-3 rounded-[1.45rem] bg-white/90 p-4 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-black shadow-sm ${
                    index === 0
                      ? 'bg-amber-300 text-amber-950'
                      : index === 1
                        ? 'bg-slate-200 text-slate-700'
                        : index === 2
                          ? 'bg-orange-200 text-orange-800'
                          : 'bg-fuchsia-100 text-fuchsia-700'
                  }`}>
                    {index < 3 ? ['冠', '亚', '季'][index] : `#${index + 1}`}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{user.username}</p>
                    <p className="text-xs text-slate-500">综合武力值 {user.score}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-2xl bg-amber-50 px-2 py-2 text-amber-800">
                    <p className="font-black">{user.post_count}</p>
                    <p>发帖</p>
                  </div>
                  <div className="rounded-2xl bg-fuchsia-50 px-2 py-2 text-fuchsia-700">
                    <p className="font-black">{user.like_count}</p>
                    <p>点赞</p>
                  </div>
                  <div className="rounded-2xl bg-cyan-50 px-2 py-2 text-cyan-700">
                    <p className="font-black">{user.comment_count}</p>
                    <p>评论</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
