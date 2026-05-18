'use client';
import { useEffect, useState } from 'react';
import { api, Report } from '@/lib/client';
export default function AdminReportsPage() { const [reports, setReports] = useState<Report[]>([]); useEffect(() => { api<Report[]>('/admin/reports').then(setReports); }, []); return <div className="space-y-4"><h1 className="text-2xl font-bold">举报处理</h1>{reports.map((r) => <div key={r.id} className="card"><p>#{r.id} {r.target_type}:{r.target_id} · {r.reason_code}</p><p className="text-sm text-slate-300">{r.reason_text}</p><p className="text-xs text-slate-500">{r.status}</p></div>)}</div>; }
