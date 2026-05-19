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
  const [activeBoard, setActiveBoard] = useState('all');
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

  const boardOptions = useMemo(() => {
    const options = new Map<string, string>();
    options.set('all', '全部板块');
    for (const post of posts) {
      if (post.board_slug && post.board_name) {
        options.set(post.board_slug, post.board_name);
      }
    }
    return Array.from(options.entries()).map(([slug, name]) => ({ slug, name }));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (activeBoard === 'all') return posts;
    return posts.filter((post) => post.board_slug === activeBoard);
  }, [activeBoard, posts]);

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
    <div id="feed" className="space-y-4">
      {message ? <div className="card border-fuchsia-100 bg-fuchsia-50 text-sm text-fuchsia-700">{message}</div> : null}
      <div className="card flex flex-wrap items-center gap-2">
        {boardOptions.map((board) => (
          <button
            key={board.slug}
            type="button"
            onClick={() => setActiveBoard(board.slug)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeBoard === board.slug ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-white shadow-lg shadow-fuchsia-100' : 'bg-white text-slate-600 shadow-sm hover:text-fuchsia-600'}`}
          >
            {board.name}
          </button>
        ))}
      </div>
      {filteredPosts.length === 0 ? <div className="card text-slate-500">这个板块暂时还没有帖子，去开一帖吧。</div> : null}
      {filteredPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
