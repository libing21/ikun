alter table posts
  add column if not exists media_url text default '',
  add column if not exists media_type varchar(20) default '',
  add column if not exists poster_url text default '',
  add column if not exists media_mime varchar(100) default '',
  add column if not exists media_size bigint default 0,
  add column if not exists media_width int default 0,
  add column if not exists media_height int default 0,
  add column if not exists duration_seconds int default 0;

comment on column posts.media_url is '帖子主媒体公开 URL';
comment on column posts.media_type is '媒体类型: image/video';
comment on column posts.poster_url is '视频封面 URL';
comment on column posts.media_mime is '媒体 MIME 类型';
comment on column posts.media_size is '媒体文件大小(字节)';
comment on column posts.media_width is '媒体宽度，后续可选回填';
comment on column posts.media_height is '媒体高度，后续可选回填';
comment on column posts.duration_seconds is '视频时长秒数，后续可选回填';
