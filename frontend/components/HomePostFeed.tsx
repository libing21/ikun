'use client';

import { useEffect, useMemo, useState } from 'react';
import { PostCard } from '@/components/PostCard';
import { api, Post } from '@/lib/client';

function sortByCreatedAtDesc(posts: Post[]) {
  return [...posts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function HomePostFeed() {
  const [publishedPosts, setPublishedPosts] = useState<Post[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [message, setMessage] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const posts = await api<Post[]>('/posts');
        if (!cancelled) {
          setPublishedPosts(posts);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : '帖子加载失败');
        }
      }

      try {
        const mine = await api<Post[]>('/me/posts');
        if (!cancelled) {
          setMyPosts(mine);
        }
      } catch {}

      if (!cancelled) {
        setReady(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const posts = useMemo(() => {
    const merged = new Map<number, Post>();
    for (const post of publishedPosts) {
      merged.set(post.id, post);
    }
    for (const post of myPosts) {
      if (post.status === 'pending_review' && !merged.has(post.id)) {
        merged.set(post.id, post);
      }
    }
    return sortByCreatedAtDesc(Array.from(merged.values()));
  }, [myPosts, publishedPosts]);

  if (!ready && posts.length === 0) {
    return <div className="card text-slate-500">帖子加载中...</div>;
  }

  if (message && posts.length === 0) {
    return <div className="card text-fuchsia-600">{message}</div>;
  }

  if (posts.length === 0) {
    return <div className="card text-slate-500">暂无已发布帖子，去发一篇等待审核吧。</div>;
  }

  return (
    <div className="space-y-4">
      {message ? <div className="card border-fuchsia-100 bg-fuchsia-50 text-sm text-fuchsia-700">{message}</div> : null}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
