import Link from 'next/link';
import type { Post } from '@/lib/client';

const STATUS_META: Record<string, { label: string; className: string }> = {
  pending_review: { label: '待审核', className: 'bg-amber-100 text-amber-700' },
  published: { label: '已发布', className: 'bg-fuchsia-100 text-fuchsia-700' },
  rejected: { label: '已拒绝', className: 'bg-rose-100 text-rose-700' },
};

export function PostCard({ post }: { post: Post }) {
  const statusMeta = STATUS_META[post.status] || { label: post.status, className: 'bg-slate-100 text-slate-600' };

  return (
    <article className="card space-y-3">
      <div className="flex items-start justify-between gap-4">
        <Link href={`/posts/${post.id}`} className="text-lg font-bold text-slate-950">{post.title}</Link>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusMeta.className}`}>{statusMeta.label}</span>
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
