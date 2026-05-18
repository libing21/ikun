'use client';
import { useEffect, useState } from 'react';
import { api, User } from '@/lib/client';
export default function MePage() { const [me, setMe] = useState<User | null>(null); const [err, setErr] = useState(''); useEffect(() => { api<User>('/auth/me').then(setMe).catch((e) => setErr(e.message)); }, []); return <div className="card space-y-3"><h1 className="text-2xl font-bold">用户中心</h1>{me ? <><p>用户名：{me.username}</p><p>角色：{me.role}</p><a href="/me/posts">我的帖子</a><a className="ml-4" href="/me/favorites">我的收藏</a></> : <p>{err || '加载中...'}</p>}</div>; }
