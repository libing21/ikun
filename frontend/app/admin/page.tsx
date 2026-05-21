'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, AdminOverview, Post } from '@/lib/client';

function formatTime(value?: string) {
  if (!value) return '暂无';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '暂无';
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [message, setMessage] = useState('');
  const [savingID, setSavingID] = useState<number | null>(null);

  async function load() {
    setData(await api<AdminOverview>('/admin/overview'));
  }

  useEffect(() => {
    load().catch((error) => setMessage(error instanceof Error ? error.message : '运营数据加载失败'));
  }, []);

  async function togglePostOps(post: Post, key: 'is_pinned' | 'is_featured') {
    if (!data) return;
    setSavingID(post.id);
    setMessage('');
    try {
      const updated = await api<Post>(`/admin/posts/${post.id}/ops`, {
        method: 'PATCH',
        body: JSON.stringify({
          is_pinned: key === 'is_pinned' ? !post.is_pinned : Boolean(post.is_pinned),
          is_featured: key === 'is_featured' ? !post.is_featured : Boolean(post.is_featured),
        }),
      });
      setData({
        ...data,
        recent_posts: data.recent_posts.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
      });
      setMessage(key === 'is_pinned' ? '置顶状态已更新' : '精华状态已更新');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '更新失败');
    } finally {
      setSavingID(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">运营后台总览</h1>
          <p className="mt-1 text-sm text-slate-500">先看今天的数据，再快速处理置顶帖、精华帖和板块热度。</p>
        </div>
        <div className="flex gap-3 text-sm font-semibold">
          <Link href="/admin/moderation" className="text-fuchsia-700">审核后台</Link>
          <Link href="/admin/reports" className="text-cyan-700">举报处理</Link>
          <Link href="/admin/site-media" className="text-amber-700">宗主放映位</Link>
        </div>
      </div>

      {message ? <p className="text-sm text-fuchsia-600">{message}</p> : null}

      {!data ? (
        <div className="card text-slate-500">运营数据加载中...</div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="card rounded-[1.8rem] bg-gradient-to-br from-fuchsia-500 to-fuchsia-300 text-white">
              <p className="text-sm font-semibold text-white/80">今日发帖</p>
              <p className="mt-3 text-4xl font-black">{data.stats.today_posts}</p>
            </div>
            <div className="card rounded-[1.8rem] bg-gradient-to-br from-cyan-500 to-cyan-300 text-white">
              <p className="text-sm font-semibold text-white/80">今日评论</p>
              <p className="mt-3 text-4xl font-black">{data.stats.today_comments}</p>
            </div>
            <div className="card rounded-[1.8rem] bg-gradient-to-br from-amber-400 to-orange-300 text-white">
              <p className="text-sm font-semibold text-white/80">待审核帖子</p>
              <p className="mt-3 text-4xl font-black">{data.stats.pending_posts}</p>
            </div>
            <div className="card">
              <p className="text-sm font-semibold text-slate-500">未处理举报</p>
              <p className="mt-3 text-4xl font-black text-slate-950">{data.stats.open_reports}</p>
            </div>
            <div className="card">
              <p className="text-sm font-semibold text-slate-500">总用户数</p>
              <p className="mt-3 text-4xl font-black text-slate-950">{data.stats.total_users}</p>
            </div>
            <div className="card">
              <p className="text-sm font-semibold text-slate-500">已发布帖子</p>
              <p className="mt-3 text-4xl font-black text-slate-950">{data.stats.published_posts}</p>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="card space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-950">热板块追踪</h2>
                  <p className="mt-1 text-sm text-slate-500">运营优先看今天的热板块和最后活跃时间。</p>
                </div>
                <Link href="/boards" className="text-sm font-semibold text-fuchsia-600">查看板块广场</Link>
              </div>
              <div className="space-y-3">
                {data.hot_boards.map((board, index) => (
                  <div key={board.slug} className="flex items-center justify-between gap-4 rounded-[1.4rem] bg-slate-50 px-4 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500">TOP {index + 1}</span>
                        <Link href={`/boards/${board.slug}`} className="font-bold text-slate-900">{board.name}</Link>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">最后发文 {formatTime(board.latest_post_at)}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="rounded-full bg-fuchsia-50 px-3 py-1 text-xs font-semibold text-fuchsia-700">今日 {board.today_post_count}</span>
                      <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">24h {board.recent_post_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card space-y-4">
              <div>
                <h2 className="text-lg font-black text-slate-950">运营建议</h2>
                <p className="mt-1 text-sm text-slate-500">先盯待审核和热板块，再把优质内容做精华或置顶。</p>
              </div>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="rounded-[1.4rem] bg-fuchsia-50 px-4 py-3">今天新增 {data.stats.today_posts} 篇帖子，优先处理待审核内容。</div>
                <div className="rounded-[1.4rem] bg-cyan-50 px-4 py-3">评论活跃 {data.stats.today_comments} 条，通知链路已经能回流作者。</div>
                <div className="rounded-[1.4rem] bg-amber-50 px-4 py-3">举报池还有 {data.stats.open_reports} 条，适合定时清理。</div>
              </div>
            </div>
          </section>

          <section className="card space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-950">内容运营快捷台</h2>
                <p className="mt-1 text-sm text-slate-500">这里先给最近帖子加置顶和精华，前台帖子流会立即体现。</p>
              </div>
            </div>
            <div className="space-y-3">
              {data.recent_posts.map((post) => (
                <div key={post.id} className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-100 bg-white/90 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {post.board_name ? <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">{post.board_name}</span> : null}
                      {post.is_pinned ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">置顶</span> : null}
                      {post.is_featured ? <span className="rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-bold text-fuchsia-700">精华</span> : null}
                    </div>
                    <Link href={`/posts/${post.id}`} className="mt-2 block truncate text-base font-bold text-slate-950">{post.title}</Link>
                    <p className="mt-1 text-xs text-slate-500">
                      作者 {post.author?.username || '匿名创作者'} · 点赞 {post.like_count} · 评论 {post.comment_count} · {formatTime(post.published_at || post.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => togglePostOps(post, 'is_pinned')} disabled={savingID === post.id}>
                      {post.is_pinned ? '取消置顶' : '设为置顶'}
                    </button>
                    <button type="button" onClick={() => togglePostOps(post, 'is_featured')} disabled={savingID === post.id} className="bg-white text-fuchsia-600 shadow-sm">
                      {post.is_featured ? '取消精华' : '设为精华'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
