'use client';

import { useEffect, useState } from 'react';
import { PostCard } from '@/components/PostCard';
import { api, Post } from '@/lib/client';

type FilteredPostFeedProps = {
  boardSlug?: string;
  tag?: string;
  emptyMessage: string;
};

export function FilteredPostFeed({ boardSlug = '', tag = '', emptyMessage }: FilteredPostFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setMessage('');
        const query = new URLSearchParams();
        query.set('limit', '50');
        if (boardSlug) query.set('board', boardSlug);
        if (tag) query.set('tag', tag);
        const items = await api<Post[]>(`/posts?${query.toString()}`);
        if (!cancelled) {
          setPosts(items);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : '帖子加载失败');
          setPosts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [boardSlug, tag]);

  if (loading && posts.length === 0) {
    return <div className="card text-slate-500">帖子加载中...</div>;
  }

  if (message && posts.length === 0) {
    return <div className="card text-fuchsia-600">{message}</div>;
  }

  if (posts.length === 0) {
    return <div className="card text-slate-500">{emptyMessage}</div>;
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
