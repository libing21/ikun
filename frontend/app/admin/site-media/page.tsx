'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api, SiteLoopMediaItem } from '@/lib/client';

type EditorState = {
  title: string;
  media_type: string;
  media_url: string;
  poster_url: string;
  sort_order: number;
  is_active: boolean;
};

const EMPTY_FORM: EditorState = {
  title: '',
  media_type: 'image',
  media_url: '',
  poster_url: '',
  sort_order: 0,
  is_active: true,
};

export default function AdminSiteMediaPage() {
  const [items, setItems] = useState<SiteLoopMediaItem[]>([]);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState<EditorState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);

  async function load() {
    setItems(await api<SiteLoopMediaItem[]>('/admin/site/loop-media'));
  }

  useEffect(() => {
    load().catch((error) => setMessage(error instanceof Error ? error.message : '加载失败'));
  }, []);

  function startEdit(item: SiteLoopMediaItem) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      media_type: item.media_type,
      media_url: item.media_url,
      poster_url: item.poster_url,
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload = {
      ...form,
      sort_order: Number(form.sort_order) || 0,
    };
    if (editingId) {
      await api(`/admin/site/loop-media/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      setMessage('素材已更新');
    } else {
      await api('/admin/site/loop-media', { method: 'POST', body: JSON.stringify(payload) });
      setMessage('素材已添加');
    }
    resetForm();
    await load();
  }

  async function remove(id: number) {
    await api(`/admin/site/loop-media/${id}`, { method: 'DELETE' });
    setMessage('素材已删除');
    if (editingId === id) resetForm();
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">宗门放映位管理</h1>
          <p className="mt-1 text-sm text-slate-500">管理员可添加图片/视频 URL，控制首页右侧小轮播的顺序和启用状态。</p>
        </div>
        <a href="/admin/moderation" className="text-sm font-semibold text-fuchsia-600">返回审核后台</a>
      </div>

      <form onSubmit={submit} className="card grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">标题</span>
          <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} required />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">类型</span>
          <select value={form.media_type} onChange={(e) => setForm((prev) => ({ ...prev, media_type: e.target.value }))}>
            <option value="image">图片</option>
            <option value="video">视频</option>
          </select>
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">媒体链接</span>
          <input value={form.media_url} onChange={(e) => setForm((prev) => ({ ...prev, media_url: e.target.value }))} placeholder="https://..." required />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">视频封面链接</span>
          <input value={form.poster_url} onChange={(e) => setForm((prev) => ({ ...prev, poster_url: e.target.value }))} placeholder="视频可填，图片可留空" />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">排序</span>
          <input type="number" value={form.sort_order} onChange={(e) => setForm((prev) => ({ ...prev, sort_order: Number(e.target.value) || 0 }))} />
        </label>
        <label className="flex items-center gap-3 pt-8 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))} />
          启用这条素材
        </label>
        <div className="flex gap-2 md:col-span-2">
          <button>{editingId ? '保存修改' : '新增素材'}</button>
          {editingId ? (
            <button type="button" className="bg-white text-slate-700 shadow-sm" onClick={resetForm}>
              取消编辑
            </button>
          ) : null}
        </div>
        {message ? <p className="text-sm text-fuchsia-600 md:col-span-2">{message}</p> : null}
      </form>

      <div className="space-y-4">
        {items.map((item) => (
          <article key={item.id} className="card space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-slate-950">{item.title}</p>
                <p className="text-sm text-slate-500">
                  {item.media_type === 'video' ? '视频' : '图片'} · 排序 {item.sort_order} · {item.is_active ? '启用中' : '已停用'}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => startEdit(item)}>编辑</button>
                <button type="button" className="bg-white text-rose-600 shadow-sm" onClick={() => remove(item.id)}>删除</button>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
              {item.media_type === 'video' ? (
                <video src={item.media_url} poster={item.poster_url || undefined} className="h-48 w-full object-cover" controls muted />
              ) : (
                <img src={item.media_url} alt={item.title} className="h-48 w-full object-cover" />
              )}
            </div>
            <p className="text-xs text-slate-500">{item.media_url}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
