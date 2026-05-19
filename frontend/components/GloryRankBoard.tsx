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

  const topSeven = useMemo(() => users.slice(0, 7), [users]);
  const seatMeta = [
    { seat: '鹰眼席', title: '宗门第一刀', accent: 'text-amber-700', chip: 'bg-amber-100 text-amber-700', glow: 'shadow-amber-100', card: 'from-amber-300 via-yellow-200 to-orange-300' },
    { seat: '天夜叉席', title: '嘴炮与热度双修', accent: 'text-slate-600', chip: 'bg-slate-100 text-slate-600', glow: 'shadow-slate-100', card: 'from-slate-300 via-slate-100 to-slate-200' },
    { seat: '暴君席', title: '冷面高压输出', accent: 'text-orange-700', chip: 'bg-orange-100 text-orange-700', glow: 'shadow-orange-100', card: 'from-orange-200 via-amber-100 to-rose-200' },
    { seat: '海侠席', title: '稳扎稳打发帖流', accent: 'text-cyan-700', chip: 'bg-cyan-100 text-cyan-700', glow: 'shadow-cyan-100', card: 'from-cyan-200 via-white to-sky-100' },
    { seat: '女帝席', title: '高颜值高互动', accent: 'text-fuchsia-700', chip: 'bg-fuchsia-100 text-fuchsia-700', glow: 'shadow-fuchsia-100', card: 'from-fuchsia-200 via-white to-rose-100' },
    { seat: '月光席', title: '阴影潜行补刀', accent: 'text-violet-700', chip: 'bg-violet-100 text-violet-700', glow: 'shadow-violet-100', card: 'from-violet-200 via-white to-indigo-100' },
    { seat: '甚平席', title: '评论区镇海神针', accent: 'text-sky-700', chip: 'bg-sky-100 text-sky-700', glow: 'shadow-sky-100', card: 'from-sky-200 via-white to-cyan-100' },
  ];

  return (
    <div className="card overflow-hidden border-amber-100 bg-gradient-to-br from-white/95 via-amber-50 to-rose-50">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-amber-200/35 blur-3xl" />
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-950">宗门王下七武海</h2>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">近 1 天</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">最近 1 天风头最劲的七位门面，全都摆在这一排。</p>

      {topSeven.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-white/80 p-4 text-sm text-slate-500">
          {message || '今天还没有上榜成员，先去发帖抢榜。'}
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto pb-1">
          <div className="flex min-w-max snap-x snap-mandatory gap-3 scroll-px-2">
            {topSeven.map((user, index) => {
              const meta = seatMeta[index] || seatMeta[seatMeta.length - 1];
              const isTopThree = index < 3;
              const isChampion = index === 0;
              const cardHeight = isChampion ? 'min-h-[244px]' : isTopThree ? 'min-h-[228px]' : 'min-h-[214px]';
              const cardWidth = isChampion ? 'w-[188px]' : 'w-[176px]';
              const crown = index === 0 ? '宗主钦点 C 位' : index === 1 ? '副席破圈输出' : index === 2 ? '第三席追击位' : `第 ${index + 1} 席`;

              return (
                <div
                  key={user.user_id}
                  className={`${cardWidth} snap-start shrink-0 rounded-[1.8rem] bg-gradient-to-b ${meta.card} p-[1px] shadow-lg ${meta.glow} transition-transform duration-200 hover:-translate-y-1`}
                >
                  <div className={`relative flex ${cardHeight} flex-col justify-between overflow-hidden rounded-[1.75rem] bg-white/92 px-4 py-4 text-center backdrop-blur`}>
                    {isChampion ? <div className="absolute -right-3 -top-3 h-20 w-20 rounded-full bg-amber-200/35 blur-2xl" /> : null}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-black shadow-sm ${meta.chip}`}>#{index + 1}</span>
                        <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-500">{meta.seat}</span>
                      </div>
                      {isChampion ? <p className="mt-3 text-xs font-black tracking-[0.24em] text-amber-700">KING OF KUN</p> : null}
                      <p className={`line-clamp-1 text-lg font-black text-slate-950 ${isChampion ? 'mt-2' : 'mt-4'}`}>{user.username}</p>
                      <p className={`mt-1 text-xs font-semibold ${meta.accent}`}>{meta.title}</p>
                      <p className="mt-2 text-[11px] text-slate-500">{crown}</p>
                    </div>
                    <div className={`mt-4 space-y-2 rounded-[1.35rem] p-3 shadow-sm ${isChampion ? 'bg-amber-50/90 ring-1 ring-amber-200/70' : isTopThree ? 'bg-white/90 ring-1 ring-white/70' : 'bg-white/80'}`}>
                      <div className={`${isChampion ? 'rounded-[1.1rem] bg-gradient-to-r from-amber-100 to-yellow-50' : 'rounded-2xl bg-white'} px-3 py-2 ${isChampion ? 'text-amber-800' : 'text-slate-800'}`}>
                        <p className={`${isChampion ? 'text-3xl' : 'text-2xl'} font-black`}>{user.post_count}</p>
                        <p className="text-[11px] font-semibold">发帖战绩</p>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className="flex-1 rounded-full bg-fuchsia-50 px-2 py-1 text-fuchsia-700">赞 {user.like_count}</span>
                        <span className="flex-1 rounded-full bg-cyan-50 px-2 py-1 text-cyan-700">评 {user.comment_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
