'use client';
import { useEffect, useState } from 'react';
import { PostCard } from '@/components/PostCard';
import { api, Post } from '@/lib/client';
export default function MyPostsPage() { const [posts, setPosts] = useState<Post[]>([]); useEffect(() => { api<Post[]>('/me/posts').then(setPosts); }, []); return <div className="space-y-4"><h1 className="text-2xl font-bold">我的帖子</h1>{posts.map((p) => <PostCard key={p.id} post={p} />)}</div>; }
