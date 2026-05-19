'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api, Comment, Post } from '@/lib/client';

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [message, setMessage] = useState('');
  const [postHeartPulse, setPostHeartPulse] = useState(0);
  const [commentPulseMap, setCommentPulseMap] = useState<Record<number, number>>({});
  async function load() {
    setPost(await api<Post>(`/posts/${params.id}`));
    setComments(await api<Comment[]>(`/posts/${params.id}/comments`));
  }

  useEffect(() => {
    load().catch((err) => setMessage(err.message));
  }, []);

  async function comment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    try {
      await api(`/posts/${params.id}/comments`, { method: 'POST', body: JSON.stringify({ content: form.get('content') }) });
      await load();
      setMessage('评论已发布');
      formElement.reset();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '失败');
    }
  }

  async function report() {
    await api('/reports', { method: 'POST', body: JSON.stringify({ target_type: 'post', target_id: Number(params.id), reason_code: 'other', reason_text: '用户举报' }) });
    setMessage('已举报，等待审核员处理');
  }

  async function togglePostLike() {
    if (!post) return;
    try {
      await api(`/posts/${params.id}/like`, { method: post.liked_by_me ? 'DELETE' : 'POST' });
      setPostHeartPulse((value) => value + 1);
      setPost({
        ...post,
        liked_by_me: !post.liked_by_me,
        like_count: post.liked_by_me ? Math.max(0, post.like_count - 1) : post.like_count + 1,
      });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '点赞失败');
    }
  }

  async function toggleCommentLike(commentID: number) {
    const target = comments.find((comment) => comment.id === commentID);
    if (!target) return;
    try {
      await api(`/comments/${commentID}/like`, { method: target.liked_by_me ? 'DELETE' : 'POST' });
      setCommentPulseMap((state) => ({ ...state, [commentID]: (state[commentID] || 0) + 1 }));
      setComments((items) =>
        items.map((comment) =>
          comment.id === commentID
            ? {
                ...comment,
                liked_by_me: !comment.liked_by_me,
                like_count: comment.liked_by_me ? Math.max(0, comment.like_count - 1) : comment.like_count + 1,
              }
            : comment,
        ),
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '评论点赞失败');
    }
  }

  if (!post) return <div className="card">加载中... {message}</div>;
  return (
    <div className="space-y-4">
      <article className="card">
        <h1 className="text-3xl font-bold">{post.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <span>作者：{post.author?.username || '匿名创作者'}</span>
          {post.media_type === 'image' ? <span className="rounded-full bg-cyan-50 px-3 py-1 text-cyan-700">图片帖</span> : null}
          {post.media_type === 'video' ? <span className="rounded-full bg-cyan-50 px-3 py-1 text-cyan-700">视频帖</span> : null}
        </div>
        {post.media_type === 'image' && post.media_url ? (
          <div className="mt-5 overflow-hidden rounded-[1.8rem] border border-fuchsia-100 bg-white shadow-sm">
            <img src={post.media_url} alt={post.title} className="max-h-[42rem] w-full object-contain bg-slate-50" />
          </div>
        ) : null}
        {post.media_type === 'video' && post.media_url ? (
          <div className="mt-5 overflow-hidden rounded-[1.8rem] border border-cyan-100 bg-slate-950 shadow-sm">
            <video
              src={post.media_url}
              poster={post.poster_url || undefined}
              className="max-h-[42rem] w-full bg-black"
              controls
              playsInline
              preload="metadata"
            />
          </div>
        ) : null}
        <p className="mt-4 whitespace-pre-wrap text-slate-600">{post.content}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={togglePostLike} className={post.liked_by_me ? 'from-rose-500 to-pink-400' : undefined}>
            <span className="inline-flex items-center gap-2">
              <svg key={postHeartPulse} viewBox="0 0 24 24" className={`h-4 w-4 ${postHeartPulse ? 'animate-heart-pop' : ''} ${post.liked_by_me ? 'fill-white stroke-white' : 'fill-none stroke-current'}`} strokeWidth="2">
                <path d="M12 21s-6.716-4.35-9.193-8.165C.87 9.75 2.008 5.5 6.027 4.603A5.48 5.48 0 0 1 12 6.438a5.48 5.48 0 0 1 5.973-1.835c4.019.897 5.157 5.147 3.22 8.232C18.716 16.65 12 21 12 21Z" />
              </svg>
              {post.liked_by_me ? `已点赞 ${post.like_count}` : `点赞 ${post.like_count}`}
            </span>
          </button>
          <button onClick={() => api(`/posts/${params.id}/favorite`, { method: 'POST' })}>收藏</button>
          <button onClick={report}>举报</button>
        </div>
      </article>
      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">评论</h2>
          <span className="text-sm text-slate-500">共 {comments.length} 条</span>
        </div>
        {comments.map((commentItem) => (
          <div key={commentItem.id} className="rounded-2xl bg-white/80 p-3 text-sm text-slate-700 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 overflow-hidden rounded-2xl border border-fuchsia-100 bg-white shadow-sm">
                  {commentItem.author?.avatar_url ? (
                    <img src={commentItem.author.avatar_url} alt={`${commentItem.author?.username || '匿名评论'} 的头像`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-fuchsia-100 to-cyan-100 text-sm font-black text-fuchsia-600">
                      {(commentItem.author?.username || '匿').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{commentItem.author?.username || '匿名评论'}</p>
                  <p className="mt-1">{commentItem.content}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleCommentLike(commentItem.id)}
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs shadow-sm transition-transform duration-150 hover:-translate-y-0.5 active:scale-95 ${commentItem.liked_by_me ? 'bg-rose-50 text-rose-600 shadow-rose-100' : 'bg-white text-slate-500'}`}
              >
                <svg key={commentPulseMap[commentItem.id] || 0} viewBox="0 0 24 24" className={`h-4 w-4 ${(commentPulseMap[commentItem.id] || 0) ? 'animate-heart-pop' : ''} ${commentItem.liked_by_me ? 'fill-rose-500 stroke-rose-500' : 'fill-none stroke-current'}`} strokeWidth="2">
                  <path d="M12 21s-6.716-4.35-9.193-8.165C.87 9.75 2.008 5.5 6.027 4.603A5.48 5.48 0 0 1 12 6.438a5.48 5.48 0 0 1 5.973-1.835c4.019.897 5.157 5.147 3.22 8.232C18.716 16.65 12 21 12 21Z" />
                </svg>
                <span>{commentItem.like_count}</span>
              </button>
            </div>
          </div>
        ))}
        <form onSubmit={comment} className="flex gap-2">
          <input name="content" placeholder="写下你的评论，发布后立即展示" className="flex-1" required />
          <button>评论</button>
        </form>
        {message && <p className="text-sm text-fuchsia-600">{message}</p>}
      </section>
    </div>
  );
}
