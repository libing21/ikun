'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, GloryRankUser } from '@/lib/client';

export function GloryRankBoard() {
  const [users, setUsers] = useState<GloryRankUser[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api<GloryRankUser[]>('/rankings/glory')
      .then(setUsers)
      .catch((error) => setMessage(error instanceof Error ? error.message : '光荣榜加载失败'));
  }, []);

  const podiumUsers = useMemo(() => {
    if (users.length === 0) return [];
    return [users[1], users[0], users[2]].filter(Boolean) as GloryRankUser[];
  }, [users]);

  const restUsers = users.slice(3);

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
        <>
          <div className="mt-5 grid items-end gap-3 sm:grid-cols-3">
            {podiumUsers.map((user, index) => {
              const isChampion = user.user_id === users[0]?.user_id;
              const tier = isChampion ? '冠' : user.user_id === users[1]?.user_id ? '亚' : '季';
              const tierClass = isChampion
                ? 'from-amber-300 via-yellow-200 to-orange-300'
                : tier === '亚'
                  ? 'from-slate-300 via-slate-100 to-slate-200'
                  : 'from-orange-200 via-amber-100 to-rose-200';
              const heightClass = isChampion ? 'min-h-[216px]' : 'min-h-[184px]';

              return (
                <div key={user.user_id} className={`${isChampion ? 'sm:-order-0 sm:scale-[1.02]' : tier === '亚' ? 'sm:-order-1' : 'sm:order-1'} rounded-[1.7rem] bg-gradient-to-b ${tierClass} p-[1px] shadow-lg`}>
                  <div className={`flex ${heightClass} flex-col justify-between rounded-[1.65rem] bg-white/92 px-4 py-5 text-center backdrop-blur`}>
                    <div>
                      <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-base font-black shadow-sm ${
                        isChampion ? 'bg-amber-300 text-amber-950' : tier === '亚' ? 'bg-slate-200 text-slate-700' : 'bg-orange-200 text-orange-800'
                      }`}>
                        {tier}
                      </div>
                      <p className="mt-3 text-lg font-black text-slate-950">{user.username}</p>
                      <p className="mt-1 text-xs text-slate-500">综合武力值 {user.score}</p>
                    </div>
                    <div className={`mt-4 rounded-[1.3rem] px-3 py-4 ${isChampion ? 'bg-amber-50' : tier === '亚' ? 'bg-slate-50' : 'bg-orange-50'}`}>
                      <p className="text-3xl font-black text-slate-900">{user.post_count}</p>
                      <p className="text-xs font-semibold text-slate-500">发帖战绩</p>
                      <div className="mt-3 flex justify-center gap-2 text-xs">
                        <span className="rounded-full bg-white px-3 py-1 text-fuchsia-700 shadow-sm">赞 {user.like_count}</span>
                        <span className="rounded-full bg-white px-3 py-1 text-cyan-700 shadow-sm">评 {user.comment_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {restUsers.length > 0 ? (
            <div className="mt-4 space-y-3">
              {restUsers.map((user, index) => (
                <div key={user.user_id} className="rounded-[1.5rem] bg-white/80 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-fuchsia-100 text-sm font-black text-fuchsia-700">
                        #{index + 4}
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
          ) : null}
        </>
      )}
    </div>
  );
}
