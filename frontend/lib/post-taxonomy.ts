export type PostBoard = {
  slug: string;
  name: string;
  description: string;
};

export const POST_BOARDS: PostBoard[] = [
  { slug: 'general', name: '宗门广场', description: '默认主板块，日常发帖、玩梗和闲聊都走这里。' },
  { slug: 'hotspot', name: '热帖快报', description: '公开热点、站内大事件和最新动态集中区。' },
  { slug: 'meme-lab', name: '梗图工坊', description: '表情包、梗图、二创海报和视觉整活专属板块。' },
  { slug: 'video-stage', name: '剪辑舞台', description: '混剪、鬼畜、直拍二创和视频作品集中展示。' },
  { slug: 'chat-room', name: '信徒茶水间', description: '轻讨论、闲聊、互动串和评论拉满的小角落。' },
];

export const POST_TAGS = [
  '热点围观',
  '新梗速递',
  '表情包',
  '二创海报',
  '混剪',
  '鬼畜',
  '舞台截图',
  '歌词接龙',
  '今日发疯',
  '宗门日报',
];

export const DEFAULT_POST_BOARD = POST_BOARDS[0];

export function findBoardBySlug(slug: string) {
  return POST_BOARDS.find((board) => board.slug === slug) || DEFAULT_POST_BOARD;
}

export function sanitizePostTags(input: unknown) {
  const source = Array.isArray(input) ? input : typeof input === 'string' ? input.split(/[,\n#，]/) : [];
  const uniqueTags = new Set<string>();

  for (const rawTag of source) {
    const normalized = String(rawTag || '')
      .replace(/^#+/, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 16);
    if (!normalized) continue;
    uniqueTags.add(normalized);
    if (uniqueTags.size >= 3) break;
  }

  return Array.from(uniqueTags);
}
