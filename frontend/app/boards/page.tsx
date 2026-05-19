import { BoardPlazaGrid } from '@/components/BoardPlazaGrid';

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

      <BoardPlazaGrid />
    </div>
  );
}
