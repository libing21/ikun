import Link from 'next/link';
import { FilteredPostFeed } from '@/components/FilteredPostFeed';

export default function TagDetailPage({ params }: { params: { tag: string } }) {
  const tag = decodeURIComponent(params.tag || '').trim();

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden bg-gradient-to-r from-fuchsia-500 via-pink-400 to-cyan-400 text-white shadow-2xl shadow-fuchsia-100">
        <div className="space-y-4 p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/boards" className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
              板块广场
            </Link>
            <Link href="/" className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
              返回首页
            </Link>
          </div>
          <p className="text-sm font-semibold tracking-[0.35em] text-white/90">TAG DISCOVERY</p>
          <h1 className="text-4xl font-black">#{tag}</h1>
          <p className="max-w-2xl text-sm leading-7 text-white/90">这个标签下会聚合同类帖子，方便一口气连刷同梗、同主题、同风格内容。</p>
        </div>
      </section>

      <FilteredPostFeed tag={tag} emptyMessage={`暂时还没有带 #${tag} 的帖子，去打一个标签开新帖吧。`} />
    </div>
  );
}
