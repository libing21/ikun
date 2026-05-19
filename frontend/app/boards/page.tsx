import Link from 'next/link';
import { POST_BOARDS } from '@/lib/post-taxonomy';

export default function BoardsPage() {
  return (
    <div className="space-y-6">
      <section className="card overflow-hidden bg-gradient-to-br from-fuchsia-500 via-amber-300 to-cyan-400 text-white shadow-2xl shadow-fuchsia-200">
        <div className="space-y-3 p-8">
          <p className="text-sm font-semibold tracking-[0.35em] text-white/90">BOARD PLAZA</p>
          <h1 className="text-4xl font-black">宗门板块广场</h1>
          <p className="max-w-2xl text-sm leading-7 text-white/90">每个板块都是一个独立小地盘。追热点、发梗图、丢剪辑、开聊天串，都可以走自己的区。</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {POST_BOARDS.map((board) => (
          <Link
            key={board.slug}
            href={`/boards/${board.slug}`}
            className="card rounded-[2rem] border border-white/70 bg-white/80 p-6 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-fuchsia-100"
          >
            <div className="space-y-3">
              <span className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">{board.name}</span>
              <h2 className="text-xl font-black text-slate-900">{board.name}</h2>
              <p className="text-sm leading-6 text-slate-600">{board.description}</p>
              <span className="inline-flex text-sm font-semibold text-fuchsia-600">进入板块</span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
