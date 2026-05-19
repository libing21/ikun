'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api, type Post } from '@/lib/client';

const STATUS_META: Record<string, { label: string; className: string }> = {
  pending_review: { label: '待审核', className: 'bg-amber-100 text-amber-700' },
  published: { label: '已发布', className: 'bg-fuchsia-100 text-fuchsia-700' },
  rejected: { label: '已拒绝', className: 'bg-rose-100 text-rose-700' },
};

export function PostCard({ post }: { post: Post }) {
  const statusMeta = STATUS_META[post.status] || { label: post.status, className: 'bg-slate-100 text-slate-600' };
  const [liked, setLiked] = useState(Boolean(post.liked_by_me));
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [message, setMessage] = useState('');
  const [heartPulse, setHeartPulse] = useState(0);
  const authorName = post.author?.username || '匿名创作者';
  const authorInitial = authorName.slice(0, 1).toUpperCase();
  const hasImage = post.media_type === 'image' && Boolean(post.media_url);
  const hasVideo = post.media_type === 'video' && Boolean(post.media_url);

  async function toggleLike() {
    try {
      if (liked) {
        await api(`/posts/${post.id}/like`, { method: 'DELETE' });
        setLiked(false);
        setLikeCount((count) => Math.max(0, count - 1));
      } else {
        await api(`/posts/${post.id}/like`, { method: 'POST' });
        setLiked(true);
        setLikeCount((count) => count + 1);
      }
      setHeartPulse((value) => value + 1);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '点赞失败');
    }
  }

  return (
    <article className="card space-y-3">
      <div className="flex items-start justify-between gap-4">
        <Link href={`/posts/${post.id}`} className="text-lg font-bold text-slate-950">{post.title}</Link>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusMeta.className}`}>{statusMeta.label}</span>
      </div>
      {hasImage ? (
        <Link href={`/posts/${post.id}`} className="block overflow-hidden rounded-[1.5rem] border border-fuchsia-100 bg-white/80 shadow-sm">
          <img src={post.media_url} alt={post.title} className="h-72 w-full object-cover transition duration-300 hover:scale-[1.02]" />
        </Link>
      ) : null}
      {hasVideo ? (
        <Link href={`/posts/${post.id}`} className="block overflow-hidden rounded-[1.5rem] border border-cyan-100 bg-slate-950/90 shadow-sm">
          {post.poster_url ? (
            <div className="relative">
              <img src={post.poster_url} alt={`${post.title} 视频封面`} className="h-72 w-full object-cover opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-xl">
                  <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-cyan-500 text-cyan-500">
                    <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.68L9.54 5.98A1 1 0 0 0 8 6.82Z" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-72 flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 text-white">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-cyan-300 text-cyan-300">
                  <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.68L9.54 5.98A1 1 0 0 0 8 6.82Z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-cyan-100">视频帖，点击进入播放</p>
            </div>
          )}
        </Link>
      ) : null}
      <p className="line-clamp-3 text-sm text-slate-600">{post.content || '暂无正文'}</p>
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 overflow-hidden rounded-2xl border border-fuchsia-100 bg-white shadow-sm">
            {post.author?.avatar_url ? (
              <img src={post.author.avatar_url} alt={`${authorName} 的头像`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-fuchsia-100 to-cyan-100 text-sm font-black text-fuchsia-600">
                {authorInitial}
              </div>
            )}
          </div>
          <div>
            <p className="text-[11px] text-slate-400">作者</p>
            <p className="font-semibold text-slate-600">{authorName}</p>
          </div>
        </div>
        <button type="button" onClick={toggleLike} className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs shadow-sm transition-transform duration-150 hover:-translate-y-0.5 active:scale-95 ${liked ? 'bg-rose-50 text-rose-600 shadow-rose-100' : 'bg-white text-slate-500'}`}>
          <svg key={heartPulse} viewBox="0 0 24 24" className={`h-4 w-4 ${heartPulse ? 'animate-heart-pop' : ''} ${liked ? 'fill-rose-500 stroke-rose-500' : 'fill-none stroke-current'}`} strokeWidth="2">
            <path d="M12 21s-6.716-4.35-9.193-8.165C.87 9.75 2.008 5.5 6.027 4.603A5.48 5.48 0 0 1 12 6.438a5.48 5.48 0 0 1 5.973-1.835c4.019.897 5.157 5.147 3.22 8.232C18.716 16.65 12 21 12 21Z" />
          </svg>
          <span>{likeCount}</span>
        </button>
        <span>收藏 {post.favorite_count}</span>
        <span>评论 {post.comment_count}</span>
        {hasImage ? <span className="rounded-full bg-cyan-50 px-3 py-1 text-cyan-700">图片帖</span> : null}
        {hasVideo ? <span className="rounded-full bg-cyan-50 px-3 py-1 text-cyan-700">视频帖</span> : null}
        <Link href={`/posts/${post.id}`} className="font-semibold text-fuchsia-600">去评论</Link>
      </div>
      {message ? <p className="text-xs text-fuchsia-600">{message}</p> : null}
    </article>
  );
}
