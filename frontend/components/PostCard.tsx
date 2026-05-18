import Link from 'next/link';
import type { Post } from '@/lib/client';

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="card space-y-3">
      <div className="flex items-start justify-between gap-4">
        <Link href={`/posts/${post.id}`} className="text-lg font-bold text-slate-950">{post.title}</Link>
        <span className="rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-bold text-fuchsia-700">{post.status}</span>
      </div>
      <p className="line-clamp-3 text-sm text-slate-600">{post.content || '暂无正文'}</p>
      <div className="flex gap-4 text-xs text-slate-500">
        <span>作者：{post.author?.username || '匿名创作者'}</span>
        <span>点赞 {post.like_count}</span>
        <span>收藏 {post.favorite_count}</span>
      </div>
    </article>
  );
}
