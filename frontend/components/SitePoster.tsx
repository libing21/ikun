'use client';

import { useState } from 'react';

export function SitePoster() {
  const [missing, setMissing] = useState(false);

  if (missing) {
    return (
      <div className="card flex h-full min-h-72 items-center justify-center bg-gradient-to-br from-fuchsia-100 via-amber-50 to-cyan-50 text-center">
        <div>
          <p className="text-sm font-semibold tracking-[0.25em] text-fuchsia-600">SITE COVER</p>
          <h3 className="mt-3 text-2xl font-black text-slate-900">把图片放到 `frontend/public/site-cover.jpg`</h3>
          <p className="mt-2 text-sm text-slate-500">放进去后首页会自动展示这张图。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden p-0">
      <img
        src="/site-cover.jpg"
        alt="ikun 网站主视觉图"
        className="h-full min-h-72 w-full object-cover"
        onError={() => setMissing(true)}
      />
    </div>
  );
}
