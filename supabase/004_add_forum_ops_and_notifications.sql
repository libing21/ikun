alter table posts
  add column if not exists is_pinned boolean not null default false,
  add column if not exists is_featured boolean not null default false;

create index if not exists idx_posts_pinned_featured
on posts(is_pinned desc, is_featured desc, created_at desc);

create table if not exists notifications (
  id bigserial primary key,
  user_id bigint not null references users(id),
  actor_id bigint references users(id),
  type varchar(32) not null,
  title varchar(120) not null default '',
  content text not null default '',
  link_url text not null default '',
  entity_type varchar(20) not null default '',
  entity_id bigint,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_notifications_user_read_created
on notifications(user_id, is_read, created_at desc);
