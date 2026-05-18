import { HomePostFeed } from '@/components/HomePostFeed';
import { SitePoster } from '@/components/SitePoster';

export default function HomePage() {
  const hotTopics = [
    '今日公开平台热议：舞台名场面二创合集',
    '新鲜梗图征集：ikun 宗门今日快乐源泉',
    '待审核热点：公开消息聚合后自动生成帖子',
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <section className="space-y-4">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-fuchsia-500 via-amber-300 to-cyan-400 p-8 text-white shadow-2xl shadow-fuchsia-200">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/25 blur-2xl" />
          <div className="absolute -bottom-16 left-20 h-48 w-48 rounded-full bg-cyan-200/30 blur-3xl" />
          <p className="relative text-sm font-semibold tracking-[0.35em] text-white/90">IKUN ZONGMEN</p>
          <h1 className="relative mt-3 text-5xl font-black leading-tight text-white drop-shadow-sm">ikun 不要感冒</h1>
          <p className="relative mt-4 max-w-2xl text-base font-medium text-white/90">这里是绚丽多彩的 ikun 宗门二创社区，不是什么黑网站。一起追热点、玩梗、发作品，但所有内容都要走审核，快乐不越界。</p>
          <div className="relative mt-6 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-white/25 px-4 py-2 backdrop-blur">二创广场</span>
            <span className="rounded-full bg-white/25 px-4 py-2 backdrop-blur">公开热点</span>
            <span className="rounded-full bg-white/25 px-4 py-2 backdrop-blur">AI 聚合待审核</span>
          </div>
        </div>
        <HomePostFeed />
      </section>
      <aside className="space-y-4">
        <SitePoster />
        <div className="card border-fuchsia-100 bg-gradient-to-br from-white/90 to-fuchsia-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-950">AI 热点雷达</h2>
            <span className="rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-bold text-fuchsia-700">AI热点</span>
          </div>
          <p className="mt-2 text-sm text-slate-600">每天聚合公开网络消息，生成待审核热点帖；只收录公开来源，禁止造谣和未证实爆料。</p>
          <div className="mt-4 space-y-2">
            {hotTopics.map((topic) => (
              <div key={topic} className="rounded-2xl bg-white/80 p-3 text-sm font-medium text-slate-700 shadow-sm">{topic}</div>
            ))}
          </div>
          <a className="mt-4 inline-block font-semibold" href="/ai">查看热点任务</a>
        </div>
        <div className="card">
          <h2 className="text-lg font-black text-slate-950">ikun 宗门宗规</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">禁止造谣、开盒、隐私泄露、冒充声明、伪聊天记录和恶意攻击。二创可以快乐，但必须守边界；有宗主在👀你。</p>
        </div>
      </aside>
    </div>
  );
}
