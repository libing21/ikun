'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, getToken, Post } from '@/lib/client';

export default function AIPage() {
  const [error, setError] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  useEffect(() => { setAuthed(Boolean(getToken())); }, []);
  async function generateDraft() {
    setError('');
    setLoading(true);
    try {
      const out = await api<Post | { message: string }>('/ai/hotspots/generate', { method: 'POST', body: '{}' });
      if ('message' in out) {
        setError(out.message);
        setPost(null);
      } else {
        setPost(out);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
    } finally {
      setLoading(false);
    }
  }
  return <div className="mx-auto max-w-4xl space-y-5"><section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-cyan-400 via-fuchsia-400 to-amber-300 p-8 text-white shadow-2xl shadow-fuchsia-200"><div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/25 blur-2xl" /><p className="relative text-sm font-semibold tracking-[0.3em]">AI HOTSPOT RADAR</p><h1 className="relative mt-3 text-4xl font-black">每日公开热点雷达</h1><p className="relative mt-3 max-w-2xl text-white/90">目标是每天从公开网络信息中整理蔡徐坤相关热点，生成带有 <span className="rounded-full bg-white/25 px-2 py-1 font-bold">AI热点</span> 标签的待审核帖子。审核通过后再进入首页热门展示。</p></section><section className="grid gap-4 md:grid-cols-3"><div className="card"><h2 className="font-black">采集范围</h2><p className="mt-2 text-sm text-slate-600">只看公开来源、公开视频平台、公开社媒和新闻页面，不采集隐私与小道消息。</p></div><div className="card"><h2 className="font-black">发布规则</h2><p className="mt-2 text-sm text-slate-600">AI 会真正抓取公开搜索结果，生成待审核帖子并写入数据库。</p></div><div className="card"><h2 className="font-black">独立标签</h2><p className="mt-2 text-sm text-slate-600">自动生成的热点帖会标记为 AI热点，方便和用户二创帖区分。</p></div></section><section className="card space-y-4"><h2 className="text-xl font-black">手动触发热点草稿</h2><p className="text-sm text-slate-600">点击后会立刻调用后端热点抓取任务，真正创建一篇待审核帖子，而不是只显示聊天输出。</p>{!authed ? <div className="rounded-3xl bg-fuchsia-50 p-5 text-sm text-slate-700"><p className="font-semibold text-slate-900">生成草稿需要先登录。</p><p className="mt-2">未登录也可以查看热点雷达说明；登录后可以手动触发草稿生成。</p><div className="mt-4 flex gap-3"><Link href="/login" className="rounded-xl bg-fuchsia-500 px-4 py-2 font-semibold text-white">去登录</Link><Link href="/register" className="rounded-xl bg-white px-4 py-2 font-semibold text-fuchsia-600 shadow-sm">先注册</Link></div></div> : <div className="space-y-4"><button type="button" onClick={generateDraft} disabled={loading}>{loading ? '生成中...' : '立即生成热点草稿'}</button>{post && <div className="rounded-3xl bg-white/70 p-5 shadow-sm"><p className="text-sm font-semibold text-fuchsia-700">已成功创建待审核帖子</p><h3 className="mt-2 text-xl font-black text-slate-950">{post.title}</h3><p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{post.content}</p><Link href={`/posts/${post.id}`} className="mt-4 inline-block font-semibold">查看帖子详情</Link></div>}</div>}{error && <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}</section></div>;
}
