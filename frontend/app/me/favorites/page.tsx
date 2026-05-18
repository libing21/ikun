'use client';
import { useEffect, useState } from 'react';
import { PostCard } from '@/components/PostCard';
import { api, Post } from '@/lib/client';
export default function MyFavoritesPage() { const [posts, setPosts] = useState<Post[]>([]); useEffect(() => { api<Post[]>('/me/favorites').then(setPosts); }, []); return <div className="space-y-4"><h1 className="text-2xl font-bold">我的收藏</h1>{posts.map((p) => <PostCard key={p.id} post={p} />)}</div>; }
