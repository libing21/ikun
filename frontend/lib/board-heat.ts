type BoardHeatInput = {
  post_count?: number;
  today_post_count?: number;
  recent_post_count?: number;
};

export type BoardHeatMeta = {
  label: '冷' | '温' | '热' | '爆';
  className: string;
  panelClassName: string;
};

const BOARD_HEAT_META: Record<BoardHeatMeta['label'], BoardHeatMeta> = {
  冷: {
    label: '冷',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
    panelClassName: 'bg-slate-50/70 text-slate-700 ring-1 ring-slate-200/80',
  },
  温: {
    label: '温',
    className: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    panelClassName: 'bg-cyan-50/80 text-cyan-800 ring-1 ring-cyan-200/80',
  },
  热: {
    label: '热',
    className: 'bg-orange-50 text-orange-700 border-orange-200',
    panelClassName: 'bg-orange-50/80 text-orange-800 ring-1 ring-orange-200/80',
  },
  爆: {
    label: '爆',
    className: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
    panelClassName: 'bg-fuchsia-100/85 text-fuchsia-800 ring-1 ring-fuchsia-200/90',
  },
};

export function getBoardHeatMeta(input: BoardHeatInput): BoardHeatMeta {
  const today = Number(input.today_post_count || 0);
  const recent = Number(input.recent_post_count || 0);
  const total = Number(input.post_count || 0);
  const score = today * 4 + recent * 2 + Math.min(total, 12) * 0.35;

  if (today >= 5 || recent >= 8 || score >= 18) return BOARD_HEAT_META.爆;
  if (today >= 2 || recent >= 4 || score >= 8) return BOARD_HEAT_META.热;
  if (today >= 1 || recent >= 2 || total >= 3 || score >= 3) return BOARD_HEAT_META.温;
  return BOARD_HEAT_META.冷;
}
