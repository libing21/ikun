alter table posts
  add column if not exists board_slug varchar(32) default 'general',
  add column if not exists board_name varchar(32) default '宗门广场',
  add column if not exists tags text[] not null default '{}';

comment on column posts.board_slug is '帖子所属板块 slug';
comment on column posts.board_name is '帖子所属板块显示名';
comment on column posts.tags is '帖子标签数组，最多建议 3 个';
