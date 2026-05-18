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
    <div className="card border-amber-100 bg-gradient-to-br from-white/95 to-amber-50">
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
            <div key={user.user_id} className="rounded-2xl bg-white/85 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${index === 0 ? 'bg-amber-300 text-amber-950' : index === 1 ? 'bg-slate-200 text-slate-700' : index === 2 ? 'bg-orange-200 text-orange-800' : 'bg-fuchsia-100 text-fuchsia-700'}`}>
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{user.username}</p>
                    <p className="text-xs text-slate-500">综合武力值 {user.score}</p>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>发帖 {user.post_count}</p>
                  <p>点赞 {user.like_count}</p>
                  <p>评论 {user.comment_count}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
