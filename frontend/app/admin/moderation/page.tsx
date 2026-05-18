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
    </div>
  );
}
