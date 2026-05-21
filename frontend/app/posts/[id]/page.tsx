'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, Comment, Post } from '@/lib/client';

type CommentNode = Comment & {
  replies: CommentNode[];
  floor: number;
  depth: number;
  parentAuthorName: string;
};

function buildCommentTree(comments: Comment[]) {
  const nodes = new Map<number, CommentNode>();
  for (const comment of comments) {
    nodes.set(comment.id, { ...comment, replies: [], floor: 0, depth: 0, parentAuthorName: '' });
  }

  const roots: CommentNode[] = [];
  let floor = 0;
  for (const comment of comments) {
    const node = nodes.get(comment.id);
    if (!node) continue;

    if (node.parent_id && nodes.has(node.parent_id)) {
      const parent = nodes.get(node.parent_id)!;
      node.floor = parent.floor;
      node.depth = parent.depth + 1;
      node.parentAuthorName = parent.author?.username || '';
      parent.replies.push(node);
      continue;
    }

    floor += 1;
    node.floor = floor;
    roots.push(node);
  }

  return roots;
}

function CommentThread({
  node,
  pulseMap,
  onReply,
  onToggleLike,
}: {
  node: CommentNode;
  pulseMap: Record<number, number>;
  onReply: (comment: CommentNode) => void;
  onToggleLike: (commentID: number) => void;
}) {
  const authorName = node.author?.username || '匿名评论';
  const authorInitial = authorName.slice(0, 1).toUpperCase();
  const pulseVersion = pulseMap[node.id] || 0;

  return (
    <div className={node.depth > 0 ? 'ml-4 border-l border-fuchsia-100 pl-4 md:ml-6 md:pl-5' : ''}>
      <div className="rounded-[1.4rem] bg-white/85 p-4 text-sm text-slate-700 shadow-sm shadow-fuchsia-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 overflow-hidden rounded-2xl border border-fuchsia-100 bg-white shadow-sm">
              {node.author?.avatar_url ? (
                <img src={node.author.avatar_url} alt={`${authorName} 的头像`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-fuchsia-100 to-cyan-100 text-sm font-black text-fuchsia-600">
                  {authorInitial}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-slate-800">{authorName}</p>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                  {node.depth === 0 ? `${node.floor}F` : `回复 ${node.floor}F`}
                </span>
                <span className="text-xs text-slate-400">{new Date(node.created_at).toLocaleString()}</span>
              </div>
              {node.parentAuthorName ? <p className="text-xs font-medium text-fuchsia-500">回复 @{node.parentAuthorName}</p> : null}
              <p className="whitespace-pre-wrap leading-6">{node.content}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onReply(node)} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
              回复
            </button>
            <button
              type="button"
              onClick={() => onToggleLike(node.id)}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs shadow-sm transition-transform duration-150 hover:-translate-y-0.5 active:scale-95 ${node.liked_by_me ? 'bg-rose-50 text-rose-600 shadow-rose-100' : 'bg-white text-slate-500'}`}
            >
              <svg key={pulseVersion} viewBox="0 0 24 24" className={`h-4 w-4 ${pulseVersion ? 'animate-heart-pop' : ''} ${node.liked_by_me ? 'fill-rose-500 stroke-rose-500' : 'fill-none stroke-current'}`} strokeWidth="2">
                <path d="M12 21s-6.716-4.35-9.193-8.165C.87 9.75 2.008 5.5 6.027 4.603A5.48 5.48 0 0 1 12 6.438a5.48 5.48 0 0 1 5.973-1.835c4.019.897 5.157 5.147 3.22 8.232C18.716 16.65 12 21 12 21Z" />
              </svg>
              <span>{node.like_count}</span>
            </button>
          </div>
        </div>
      </div>
      {node.replies.length ? (
        <div className="mt-3 space-y-3">
          {node.replies.map((reply) => (
            <CommentThread key={reply.id} node={reply} pulseMap={pulseMap} onReply={onReply} onToggleLike={onToggleLike} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState('');
  const [replyTarget, setReplyTarget] = useState<CommentNode | null>(null);
  const [message, setMessage] = useState('');
  const [postHeartPulse, setPostHeartPulse] = useState(0);
  const [commentPulseMap, setCommentPulseMap] = useState<Record<number, number>>({});
  async function load() {
    setPost(await api<Post>(`/posts/${params.id}`));
    setComments(await api<Comment[]>(`/posts/${params.id}/comments?limit=200`));
  }

  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

  useEffect(() => {
    load().catch((err) => setMessage(err.message));
  }, [params.id]);

  async function comment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    try {
      await api(`/posts/${params.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content, parent_id: replyTarget?.id || null }),
      });
      await load();
      setDraft('');
      setReplyTarget(null);
      setMessage(replyTarget ? '回复已发布' : '评论已发布');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '失败');
    }
  }

  async function report() {
    await api('/reports', { method: 'POST', body: JSON.stringify({ target_type: 'post', target_id: Number(params.id), reason_code: 'other', reason_text: '用户举报' }) });
    setMessage('已举报，等待审核员处理');
  }

  async function togglePostLike() {
    if (!post) return;
    try {
      await api(`/posts/${params.id}/like`, { method: post.liked_by_me ? 'DELETE' : 'POST' });
      setPostHeartPulse((value) => value + 1);
      setPost({
        ...post,
        liked_by_me: !post.liked_by_me,
        like_count: post.liked_by_me ? Math.max(0, post.like_count - 1) : post.like_count + 1,
      });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '点赞失败');
    }
  }

  async function toggleCommentLike(commentID: number) {
    const target = comments.find((comment) => comment.id === commentID);
    if (!target) return;
    try {
      await api(`/comments/${commentID}/like`, { method: target.liked_by_me ? 'DELETE' : 'POST' });
      setCommentPulseMap((state) => ({ ...state, [commentID]: (state[commentID] || 0) + 1 }));
      setComments((items) =>
        items.map((comment) =>
          comment.id === commentID
            ? {
                ...comment,
                liked_by_me: !comment.liked_by_me,
                like_count: comment.liked_by_me ? Math.max(0, comment.like_count - 1) : comment.like_count + 1,
              }
            : comment,
        ),
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '评论点赞失败');
    }
  }

  if (!post) return <div className="card">加载中... {message}</div>;
  return (
    <div className="space-y-4">
      <article className="card">
        <h1 className="text-3xl font-bold">{post.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          {post.is_pinned ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">置顶帖</span> : null}
          {post.is_featured ? <span className="rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-bold text-fuchsia-700">精华帖</span> : null}
          <span>作者：{post.author?.username || '匿名创作者'}</span>
          {post.board_name && post.board_slug ? (
            <Link href={`/boards/${post.board_slug}`} className="rounded-full bg-cyan-50 px-3 py-1 text-cyan-700 transition hover:bg-cyan-100">
              {post.board_name}
            </Link>
          ) : null}
          {post.tags?.map((tag) => (
            <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`} className="rounded-full bg-fuchsia-50 px-3 py-1 text-fuchsia-700 transition hover:bg-fuchsia-100">
              #{tag}
            </Link>
          ))}
          {post.media_type === 'image' ? <span className="rounded-full bg-cyan-50 px-3 py-1 text-cyan-700">图片帖</span> : null}
          {post.media_type === 'video' ? <span className="rounded-full bg-cyan-50 px-3 py-1 text-cyan-700">视频帖</span> : null}
        </div>
        {post.media_type === 'image' && post.media_url ? (
          <div className="mt-5 overflow-hidden rounded-[1.8rem] border border-fuchsia-100 bg-white shadow-sm">
            <img src={post.media_url} alt={post.title} className="max-h-[42rem] w-full object-contain bg-slate-50" />
          </div>
        ) : null}
        {post.media_type === 'video' && post.media_url ? (
          <div className="mt-5 overflow-hidden rounded-[1.8rem] border border-cyan-100 bg-slate-950 shadow-sm">
            <video
              src={post.media_url}
              poster={post.poster_url || undefined}
              className="max-h-[42rem] w-full bg-black"
              controls
              playsInline
              preload="metadata"
            />
          </div>
        ) : null}
        <p className="mt-4 whitespace-pre-wrap text-slate-600">{post.content}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={togglePostLike} className={post.liked_by_me ? 'from-rose-500 to-pink-400' : undefined}>
            <span className="inline-flex items-center gap-2">
              <svg key={postHeartPulse} viewBox="0 0 24 24" className={`h-4 w-4 ${postHeartPulse ? 'animate-heart-pop' : ''} ${post.liked_by_me ? 'fill-white stroke-white' : 'fill-none stroke-current'}`} strokeWidth="2">
                <path d="M12 21s-6.716-4.35-9.193-8.165C.87 9.75 2.008 5.5 6.027 4.603A5.48 5.48 0 0 1 12 6.438a5.48 5.48 0 0 1 5.973-1.835c4.019.897 5.157 5.147 3.22 8.232C18.716 16.65 12 21 12 21Z" />
              </svg>
              {post.liked_by_me ? `已点赞 ${post.like_count}` : `点赞 ${post.like_count}`}
            </span>
          </button>
          <button onClick={() => api(`/posts/${params.id}/favorite`, { method: 'POST' })}>收藏</button>
          <button onClick={report}>举报</button>
        </div>
      </article>
      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">评论</h2>
          <span className="text-sm text-slate-500">共 {comments.length} 条</span>
        </div>
        {commentTree.length === 0 ? <div className="rounded-2xl bg-white/70 px-4 py-5 text-sm text-slate-500">还没有评论，来坐第一层。</div> : null}
        <div className="space-y-3">
          {commentTree.map((commentItem) => (
            <CommentThread
              key={commentItem.id}
              node={commentItem}
              pulseMap={commentPulseMap}
              onReply={setReplyTarget}
              onToggleLike={toggleCommentLike}
            />
          ))}
        </div>
        <form onSubmit={comment} className="space-y-3 rounded-[1.6rem] border border-fuchsia-100 bg-white/80 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">{replyTarget ? `回复 ${replyTarget.author?.username || '该评论'} · ${replyTarget.floor}F` : '发布新评论'}</p>
            </div>
            {replyTarget ? (
              <button type="button" onClick={() => setReplyTarget(null)} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                取消回复
              </button>
            ) : null}
          </div>
          <textarea
            name="content"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={replyTarget ? `回复 ${replyTarget.author?.username || '这位信徒'}...` : '写下你的评论'}
            rows={4}
            className="w-full"
            required
          />
          <div className="flex items-center gap-3">
            <button>{replyTarget ? '发布回复' : '发表评论'}</button>
          </div>
        </form>
        {message && <p className="text-sm text-fuchsia-600">{message}</p>}
      </section>
    </div>
  );
}
