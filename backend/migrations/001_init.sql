CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(32) NOT NULL UNIQUE,
  email VARCHAR(128) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  bio VARCHAR(255),
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
  id BIGSERIAL PRIMARY KEY,
  author_id BIGINT NOT NULL REFERENCES users(id),
  title VARCHAR(120) NOT NULL,
  content TEXT,
  post_type VARCHAR(20) NOT NULL DEFAULT 'text',
  status VARCHAR(20) NOT NULL DEFAULT 'pending_review',
  visibility VARCHAR(20) NOT NULL DEFAULT 'public',
  like_count INT NOT NULL DEFAULT 0,
  favorite_count INT NOT NULL DEFAULT 0,
  comment_count INT NOT NULL DEFAULT 0,
  view_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  published_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_status_created_at ON posts(status, created_at DESC);

CREATE TABLE IF NOT EXISTS media_assets (
  id BIGSERIAL PRIMARY KEY,
  owner_id BIGINT NOT NULL REFERENCES users(id),
  post_id BIGINT REFERENCES posts(id),
  media_type VARCHAR(20) NOT NULL,
  object_key TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type VARCHAR(120),
  file_size BIGINT NOT NULL,
  width INT,
  height INT,
  duration_sec INT,
  sha256 VARCHAR(64),
  status VARCHAR(20) NOT NULL DEFAULT 'pending_review',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_media_post_id ON media_assets(post_id);

CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES posts(id),
  author_id BIGINT NOT NULL REFERENCES users(id),
  parent_id BIGINT REFERENCES comments(id),
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending_review',
  like_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

CREATE TABLE IF NOT EXISTS post_likes (
  user_id BIGINT NOT NULL REFERENCES users(id),
  post_id BIGINT NOT NULL REFERENCES posts(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id BIGINT NOT NULL REFERENCES users(id),
  post_id BIGINT NOT NULL REFERENCES posts(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id BIGSERIAL PRIMARY KEY,
  reporter_id BIGINT NOT NULL REFERENCES users(id),
  target_type VARCHAR(20) NOT NULL,
  target_id BIGINT NOT NULL,
  reason_code VARCHAR(32) NOT NULL,
  reason_text TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  resolution_note TEXT,
  reviewed_by BIGINT REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

CREATE TABLE IF NOT EXISTS moderation_jobs (
  id BIGSERIAL PRIMARY KEY,
  target_type VARCHAR(20) NOT NULL,
  target_id BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
  risk_level VARCHAR(20) NOT NULL DEFAULT 'unknown',
  result_json JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_moderation_jobs_status ON moderation_jobs(status, created_at);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  title VARCHAR(120),
  persona_code VARCHAR(32) NOT NULL DEFAULT 'jizong_master',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES ai_conversations(id),
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  safety_label VARCHAR(32) NOT NULL DEFAULT 'normal',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id, created_at);
