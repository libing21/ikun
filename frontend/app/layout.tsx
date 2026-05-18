import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import { SiteNav } from '@/components/SiteNav';

export const metadata: Metadata = { title: 'ikun 不要感冒', description: 'ikun 宗门二创社区与热点雷达' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <nav className="border-b border-white/60 bg-white/80 px-6 py-4 shadow-sm shadow-fuchsia-100 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <Link href="/" className="bg-gradient-to-r from-fuchsia-600 via-amber-500 to-cyan-500 bg-clip-text text-2xl font-black text-transparent">ikun 不要感冒</Link>
            <SiteNav />
          </div>
        </nav>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
