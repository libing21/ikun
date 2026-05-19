import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BoardHeaderStats } from '@/components/BoardHeaderStats';
import { FilteredPostFeed } from '@/components/FilteredPostFeed';
import { findBoardBySlug, isValidBoardSlug, POST_BOARDS } from '@/lib/post-taxonomy';

export default function BoardDetailPage({ params }: { params: { slug: string } }) {
  if (!isValidBoardSlug(params.slug)) {
    notFound();
  }

  const board = findBoardBySlug(params.slug);

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden bg-gradient-to-br from-slate-950 via-fuchsia-700 to-cyan-500 text-white shadow-2xl shadow-fuchsia-100">
        <div className="space-y-4 p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/boards" className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
              全部板块
            </Link>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">当前板块</span>
          </div>
          <h1 className="text-4xl font-black">{board.name}</h1>
          <p className="max-w-2xl text-sm leading-7 text-white/90">{board.description}</p>
          <BoardHeaderStats slug={board.slug} />
          <div className="flex flex-wrap gap-2">
            {POST_BOARDS.map((item) => (
              <Link
                key={item.slug}
                href={`/boards/${item.slug}`}
                className={`rounded-full px-4 py-2 text-sm font-semibold backdrop-blur ${item.slug === board.slug ? 'bg-white text-fuchsia-700' : 'bg-white/15 text-white/90'}`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <FilteredPostFeed boardSlug={board.slug} emptyMessage={`“${board.name}” 现在还没有帖子，去抢第一帖吧。`} />
    </div>
  );
}
