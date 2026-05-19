'use client';

import { useEffect, useState } from 'react';
import { api, ModerationJob } from '@/lib/client';

const JOB_STATUS_LABEL: Record<string, string> = {
  queued: '待处理',
  reviewed: '已处理',
};

const TARGET_STATUS_LABEL: Record<string, string> = {
  pending_review: '待审核',
  published: '已发布',
  approved: '已通过',
  rejected: '已拒绝',
};

export default function AdminModerationPage() {
  const [jobs, setJobs] = useState<ModerationJob[]>([]);
  const [msg, setMsg] = useState('');
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  async function load() {
    setJobs(await api<ModerationJob[]>('/admin/moderation/jobs'));
  }

  async function review(id: number, decision: string) {
    await api(`/admin/moderation/jobs/${id}/review`, { method: 'POST', body: JSON.stringify({ decision }) });
    setMsg('已处理');
    await load();
  }

  useEffect(() => {
    load().catch((e) => setMsg(e.message));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">审核后台</h1>
        <div className="flex gap-3 text-sm font-semibold">
          <a href="/admin/site-media" className="text-cyan-700">宗主放映位</a>
          <a href="/admin/reports" className="text-fuchsia-700">举报处理</a>
        </div>
      </div>
      {msg ? <p className="text-sm text-fuchsia-600">{msg}</p> : null}
      {jobs.map((job) => {
        const taskStatus = JOB_STATUS_LABEL[job.status] || job.status;
        const targetStatus = TARGET_STATUS_LABEL[job.target_status || ''] || job.target_status || '未知';
        const content = job.target_content?.trim() || '暂无正文';
        const isImagePost = job.target_type === 'post' && job.target_media_type === 'image' && Boolean(job.target_media_url);
        const isVideoPost = job.target_type === 'post' && job.target_media_type === 'video' && Boolean(job.target_media_url);
        const durationText = job.target_duration_seconds
          ? `${Math.floor(job.target_duration_seconds / 60)}:${String(job.target_duration_seconds % 60).padStart(2, '0')}`
          : '未知时长';

        return (
          <article key={job.id} className="card space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-slate-950">{job.target_title || `${job.target_type}:${job.target_id}`}</p>
                <p className="text-sm text-slate-500">
                  任务 #{job.id} · 类型 {job.target_type} · 作者 {job.target_author_username || '未知'}
                </p>
              </div>
              <div className="text-right text-sm text-slate-500">
                <p>审核任务：{taskStatus}</p>
                <p>帖子状态：{targetStatus}</p>
                <p>风险：{job.risk_level}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              <p className="whitespace-pre-wrap">{content}</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white/90 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-slate-800">媒体内容</p>
                {isImagePost ? <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">图片帖</span> : null}
                {isVideoPost ? <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">视频帖 · {durationText}</span> : null}
                {!isImagePost && !isVideoPost ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">文本帖 / 无媒体</span> : null}
              </div>

              {isImagePost ? (
                <button
                  type="button"
                  onClick={() => setPreviewImage({ url: job.target_media_url || '', title: job.target_title || '审核图片' })}
                  className="block w-full overflow-hidden rounded-[1.5rem] border border-fuchsia-100 bg-slate-50 shadow-sm"
                >
                  <img src={job.target_media_url} alt={job.target_title || '审核图片'} className="max-h-[28rem] w-full object-contain" />
                  <div className="border-t border-fuchsia-100 bg-white/90 px-4 py-3 text-left text-xs font-semibold text-fuchsia-600">点击查看大图</div>
                </button>
              ) : null}

              {isVideoPost ? (
                <div className="overflow-hidden rounded-[1.5rem] border border-cyan-100 bg-slate-950 shadow-sm">
                  <video
                    src={job.target_media_url}
                    poster={job.target_poster_url || undefined}
                    className="max-h-[28rem] w-full bg-black"
                    controls
                    playsInline
                    preload="metadata"
                  />
                </div>
              ) : null}
            </div>

            <div className="flex gap-2">
              <button onClick={() => review(job.id, 'approved')} disabled={job.status === 'reviewed'}>
                通过
              </button>
              <button onClick={() => review(job.id, 'rejected')} disabled={job.status === 'reviewed'}>
                拒绝
              </button>
            </div>
          </article>
        );
      })}

      {previewImage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4" onClick={() => setPreviewImage(null)}>
          <div className="w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between text-white">
              <p className="text-sm font-semibold">{previewImage.title}</p>
              <button type="button" onClick={() => setPreviewImage(null)} className="bg-white/10 hover:bg-white/20">
                关闭
              </button>
            </div>
            <div className="overflow-hidden rounded-[1.8rem] bg-black/80 p-3 shadow-2xl">
              <img src={previewImage.url} alt={previewImage.title} className="max-h-[82vh] w-full object-contain" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
