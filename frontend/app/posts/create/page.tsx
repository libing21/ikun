'use client';

import { FormEvent, useState } from 'react';
import { api, Post } from '@/lib/client';

export default function CreatePostPage() {
  const [message, setMessage] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formElement = e.currentTarget;
    // #region debug-point A:create-post-submit
    fetch('http://127.0.0.1:7777/event', { method: 'POST', body: JSON.stringify({ sessionId: 'auth-hotspot-bugs', runId: 'pre-fix', hypothesisId: 'A', location: 'frontend/app/posts/create/page.tsx:submit:start', msg: '[DEBUG] create post submit start', data: { hasCurrentTarget: !!e.currentTarget }, ts: Date.now() }) }).catch(() => {});
    // #endregion
    const form = new FormData(formElement);
    try {
      const post = await api<Post>('/posts', { method: 'POST', body: JSON.stringify({ title: form.get('title'), content: form.get('content'), post_type: form.get('post_type') }) });
      // #region debug-point A:create-post-response
      fetch('http://127.0.0.1:7777/event', { method: 'POST', body: JSON.stringify({ sessionId: 'auth-hotspot-bugs', runId: 'pre-fix', hypothesisId: 'A', location: 'frontend/app/posts/create/page.tsx:submit:after-api', msg: '[DEBUG] create post api success', data: { postId: post.id, hasCurrentTarget: !!e.currentTarget }, ts: Date.now() }) }).catch(() => {});
      // #endregion
      setMessage(`已提交审核，帖子 ID：${post.id}`);
      formElement.reset();
    } catch (err) { setMessage(err instanceof Error ? err.message : '提交失败'); }
  }
  return (
    <form onSubmit={submit} className="card mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">发布二创内容</h1>
      <input name="title" placeholder="标题" maxLength={120} required className="w-full" />
      <select name="post_type" defaultValue="text"><option value="text">文本</option><option value="image">图片</option><option value="video">视频</option></select>
      <textarea name="content" placeholder="正文，注意不要发布隐私、造谣或冒充内容" rows={8} className="w-full" />
      <button>提交审核</button>
      {message && <p className="text-sm text-cyan-200">{message}</p>}
    </form>
  );
}
