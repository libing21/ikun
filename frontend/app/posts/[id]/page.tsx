'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api, Comment, Post } from '@/lib/client';

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [message, setMessage] = useState('');
  async function load() { setPost(await api<Post>(`/posts/${params.id}`)); setComments(await api<Comment[]>(`/posts/${params.id}/comments`)); }
  useEffect(() => { load().catch((err) => setMessage(err.message)); }, []);
  async function comment(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const formElement = e.currentTarget; const form = new FormData(formElement); try { await api(`/posts/${params.id}/comments`, { method: 'POST', body: JSON.stringify({ content: form.get('content') }) }); setMessage('评论已进入审核'); formElement.reset(); } catch (err) { setMessage(err instanceof Error ? err.message : '失败'); } }
  async function report() { await api('/reports', { method: 'POST', body: JSON.stringify({ target_type: 'post', target_id: Number(params.id), reason_code: 'other', reason_text: '用户举报' }) }); setMessage('已举报，等待审核员处理'); }
  if (!post) return <div className="card">加载中... {message}</div>;
  return <div className="space-y-4"><article className="card"><h1 className="text-3xl font-bold">{post.title}</h1><p className="mt-4 whitespace-pre-wrap text-slate-600">{post.content}</p><div className="mt-4 flex gap-3"><button onClick={() => api(`/posts/${params.id}/like`, { method: 'POST' })}>点赞</button><button onClick={() => api(`/posts/${params.id}/favorite`, { method: 'POST' })}>收藏</button><button onClick={report}>举报</button></div></article><section className="card space-y-3"><h2 className="text-xl font-bold">评论</h2>{comments.map((c) => <p key={c.id} className="rounded-2xl bg-white/80 p-3 text-sm text-slate-700 shadow-sm">{c.content}</p>)}<form onSubmit={comment} className="flex gap-2"><input name="content" placeholder="评论先审核后公开" className="flex-1" required /><button>评论</button></form>{message && <p className="text-sm text-fuchsia-600">{message}</p>}</section></div>;
}
