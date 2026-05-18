'use client';

import { useState } from 'react';

export function SitePoster({ compact = false }: { compact?: boolean }) {
  const [missing, setMissing] = useState(false);

  if (missing) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-fuchsia-100 via-amber-50 to-cyan-50 text-center ${compact ? 'h-full rounded-[1.5rem] border border-white/40 p-4' : 'card min-h-72'}`}>
        <div>
          <p className="text-sm font-semibold tracking-[0.25em] text-fuchsia-600">SITE COVER</p>
          <h3 className={`mt-3 font-black text-slate-900 ${compact ? 'text-lg' : 'text-2xl'}`}>把图片放到 `frontend/public/site-cover.jpg`</h3>
          <p className="mt-2 text-sm text-slate-500">放进去后首页会自动展示这张图。</p>
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? 'overflow-hidden rounded-[1.75rem] border border-white/30 bg-white/15 p-2 shadow-2xl backdrop-blur' : 'card overflow-hidden p-0'}>
      <img
        src="/site-cover.jpg"
        alt="ikun 网站主视觉图"
        className={compact ? 'h-56 w-full rounded-[1.2rem] object-cover object-top' : 'h-full min-h-72 w-full object-cover'}
        onError={() => setMissing(true)}
      />
    </div>
  );
}
