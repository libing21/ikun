'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { api, Post, PostTaxonomy, UploadedMediaAsset } from '@/lib/client';
import { DEFAULT_POST_BOARD, POST_BOARDS, POST_TAGS } from '@/lib/post-taxonomy';

type PostType = 'text' | 'image' | 'video';

export default function CreatePostPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<PostType>('text');
  const [taxonomy, setTaxonomy] = useState<PostTaxonomy>({ boards: POST_BOARDS, tags: POST_TAGS });
  const [boardSlug, setBoardSlug] = useState(DEFAULT_POST_BOARD.slug);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadStage, setUploadStage] = useState('');

  const mediaPreviewURL = useMemo(() => (mediaFile ? URL.createObjectURL(mediaFile) : ''), [mediaFile]);
  const posterPreviewURL = useMemo(() => (posterFile ? URL.createObjectURL(posterFile) : ''), [posterFile]);

  useEffect(() => {
    api<PostTaxonomy>('/posts/taxonomy')
      .then(setTaxonomy)
      .catch(() => {
        setTaxonomy({ boards: POST_BOARDS, tags: POST_TAGS });
      });
  }, []);

  function resetMediaState(nextType: PostType) {
    setPostType(nextType);
    setMediaFile(null);
    setPosterFile(null);
    setUploadStage('');
  }

  function onMediaSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    setMediaFile(file);
  }

  function onPosterSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    setPosterFile(file);
  }

  function toggleTag(tag: string) {
    setSelectedTags((current) => {
      if (current.includes(tag)) {
        return current.filter((item) => item !== tag);
      }
      if (current.length >= 3) {
        return current;
      }
      return [...current, tag];
    });
  }

  async function uploadMedia(file: File, kind: 'image' | 'video' | 'poster') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('kind', kind);
    return api<UploadedMediaAsset>('/uploads/post-media', {
      method: 'POST',
      body: formData,
    });
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setMessage('');
      let uploadedMedia: UploadedMediaAsset | null = null;
      let uploadedPoster: UploadedMediaAsset | null = null;

      if (postType !== 'text') {
        if (!mediaFile) throw new Error(postType === 'image' ? '请选择要上传的图片' : '请选择要上传的视频');
        setUploadStage(postType === 'image' ? '正在上传图片...' : '正在上传视频...');
        uploadedMedia = await uploadMedia(mediaFile, postType === 'image' ? 'image' : 'video');

        if (postType === 'video' && posterFile) {
          setUploadStage('正在上传视频封面...');
          uploadedPoster = await uploadMedia(posterFile, 'poster');
        }
      }

      setUploadStage('正在提交帖子...');
      const post = await api<Post>('/posts', {
        method: 'POST',
        body: JSON.stringify({
          title,
          content,
          post_type: postType,
          board_slug: boardSlug,
          tags: selectedTags,
          media_url: uploadedMedia?.url || '',
          media_type: uploadedMedia?.media_type || '',
          poster_url: uploadedPoster?.url || '',
          media_mime: uploadedMedia?.mime || '',
          media_size: uploadedMedia?.size || 0,
        }),
      });
      setMessage(`已提交审核，帖子 ID：${post.id}`);
      setTitle('');
      setContent('');
      setBoardSlug(DEFAULT_POST_BOARD.slug);
      setSelectedTags([]);
      resetMediaState('text');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '提交失败');
    } finally {
      setSubmitting(false);
      setUploadStage('');
    }
  }

  return (
    <form onSubmit={submit} className="card mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">发布二创内容</h1>
        <p className="mt-2 text-sm text-slate-500">先上传媒体，再提交帖子；图片和视频会自动保存到 Supabase Storage。</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">标题</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="给你的作品起个标题" maxLength={120} required className="w-full" />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">帖子类型</span>
            <select value={postType} onChange={(e) => resetMediaState(e.target.value as PostType)}>
              <option value="text">文本</option>
              <option value="image">图片</option>
              <option value="video">视频</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">正文</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={postType === 'text' ? '正文，注意不要发布隐私、造谣或冒充内容' : '可以写作品说明、灵感来源、拍摄或剪辑备注'}
              rows={10}
              className="w-full"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">所属板块</span>
              <select value={boardSlug} onChange={(e) => setBoardSlug(e.target.value)}>
                {taxonomy.boards.map((board) => (
                  <option key={board.slug} value={board.slug}>
                    {board.name}
                  </option>
                ))}
              </select>
              <p className="text-xs leading-5 text-slate-500">{taxonomy.boards.find((board) => board.slug === boardSlug)?.description || '给帖子选一个更合适的归属区。'}</p>
            </label>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700">帖子标签</span>
                <span className="text-xs text-slate-500">最多选 3 个</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {taxonomy.tags.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${active ? 'border-fuchsia-400 bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-200/70' : 'border-fuchsia-100 bg-white text-slate-600 hover:border-fuchsia-300 hover:text-fuchsia-600'}`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-xl shadow-cyan-100/60">
          <div>
            <h2 className="text-lg font-black text-slate-900">媒体上传区</h2>
            <p className="mt-1 text-sm text-slate-500">
              {postType === 'text'
                ? '文本帖不用上传媒体。'
                : postType === 'image'
                  ? '支持 jpg/png/webp/gif，最大 10MB。'
                  : '支持 mp4/webm，最大 50MB；可选上传一张视频封面。'}
            </p>
          </div>

          {postType !== 'text' ? (
            <>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">{postType === 'image' ? '选择图片' : '选择视频'}</span>
                <input type="file" accept={postType === 'image' ? 'image/*' : 'video/mp4,video/webm'} onChange={onMediaSelected} required />
              </label>

              {postType === 'video' ? (
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">视频封面（可选）</span>
                  <input type="file" accept="image/*" onChange={onPosterSelected} />
                </label>
              ) : null}

              <div className="rounded-[1.6rem] border border-fuchsia-100 bg-white/90 p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-700">预览</p>
                <div className="mt-3 overflow-hidden rounded-[1.2rem] border border-slate-100 bg-slate-50">
                  {postType === 'image' && mediaPreviewURL ? (
                    <img src={mediaPreviewURL} alt="待发布图片预览" className="h-72 w-full object-cover" />
                  ) : null}
                  {postType === 'video' && mediaPreviewURL ? (
                    <video src={mediaPreviewURL} poster={posterPreviewURL || undefined} className="h-72 w-full object-cover" controls muted />
                  ) : null}
                  {!mediaPreviewURL ? (
                    <div className="flex h-72 items-center justify-center text-sm text-slate-400">
                      {postType === 'image' ? '选择图片后在这里预览' : '选择视频后在这里预览'}
                    </div>
                  ) : null}
                </div>
                {postType === 'video' && posterPreviewURL ? (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-slate-500">封面预览</p>
                    <img src={posterPreviewURL} alt="视频封面预览" className="mt-2 h-28 w-28 rounded-2xl object-cover shadow-sm" />
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="rounded-[1.6rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
              当前是文本帖模式，右侧预留给图片/视频帖子使用。
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button disabled={submitting}>{submitting ? '提交中...' : '提交审核'}</button>
        {uploadStage ? <span className="text-sm text-slate-500">{uploadStage}</span> : null}
        {message ? <p className="text-sm text-fuchsia-600">{message}</p> : null}
      </div>
    </form>
  );
}
