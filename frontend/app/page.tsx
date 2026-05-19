import Link from 'next/link';
import { BoardPlazaGrid } from '@/components/BoardPlazaGrid';
import { GloryRankBoard } from '@/components/GloryRankBoard';
import { HomePostFeed } from '@/components/HomePostFeed';
import { SiteLoopMedia } from '@/components/SiteLoopMedia';
import { SitePoster } from '@/components/SitePoster';

export default function HomePage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <section className="space-y-4">
        <div className="relative overflow-hidden rounded-[2.2rem] border border-white/70 bg-gradient-to-br from-fuchsia-500 via-amber-300 to-cyan-400 p-8 text-white shadow-2xl shadow-fuchsia-200">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/25 blur-2xl" />
          <div className="absolute -bottom-16 left-20 h-48 w-48 rounded-full bg-cyan-200/30 blur-3xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_240px]">
            <div>
              <p className="text-sm font-semibold tracking-[0.35em] text-white/90">IKUN ZONGMEN</p>
              <h1 className="mt-3 text-5xl font-black leading-tight text-white drop-shadow-sm">ikun 不要感冒</h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-white/90">光辉迎来虚伪的拥护！黄昏见证真实的信徒！当然，不要问黄昏怎么来的。</p>
              <div className="mt-6 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-white/25 px-4 py-2 backdrop-blur">二创广场</span>
                <span className="rounded-full bg-white/25 px-4 py-2 backdrop-blur">宗门光荣榜</span>
                <span className="rounded-full bg-white/25 px-4 py-2 backdrop-blur">评论互动</span>
              </div>
            </div>
            <div>
              <SitePoster compact />
            </div>
          </div>
        </div>
        <section className="space-y-3">
          <div className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-slate-900">热板块</p>
              <p className="mt-1 text-sm text-slate-500">按最近活跃度自动排序，热板块会排在前面。</p>
            </div>
            <Link href="/boards" className="text-sm font-semibold text-fuchsia-600">
              查看完整板块广场
            </Link>
          </div>
          <BoardPlazaGrid />
        </section>
        <HomePostFeed />
      </section>
      <aside className="space-y-4">
        <GloryRankBoard />
        <SiteLoopMedia />
        <div className="card">
          <h2 className="text-lg font-black text-slate-950">ikun 宗门宗规</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">禁止造谣、开盒、隐私泄露、冒充声明、伪聊天记录和恶意攻击。二创可以快乐，但必须守边界；有宗主在👀你。</p>
        </div>
      </aside>
    </div>
  );
}
