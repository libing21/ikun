# AI 驱动的二创社区网站开发技术文档

## 1. 文档目标

本文档用于指导 AI 代码生成器直接完成一个可上线的 Web 产品 MVP 开发。目标产品是一个以梗文化、二创内容、社区互动和 AI 角色互动为核心的网站。

AI 在实现本项目时，必须优先满足以下原则：

1. 所有“人物设定”均为**虚构角色**，仅允许“受公开互联网流行文化启发”，不得声明或暗示为真实人物本人。
2. 所有用户上传的图片、视频、文本内容都必须进入审核链路。
3. 所有 AI 生成内容必须带有“AI 生成/角色演绎”标识。
4. 系统必须具备基础的内容治理能力：举报、下架、审核状态、敏感词拦截。
5. 优先实现 MVP，不做过度设计。

***

## 2. 产品定义

### 2.1 产品名称

暂定名：`Kunzong Community`

### 2.2 产品定位

这是一个围绕梗文化、二创作品、社区讨论和角色 AI 互动的社区平台。用户可以：

- 发布图片、视频、文本帖
- 浏览热门内容
- 点赞、评论、收藏、举报
- 与“宗主风格”的**虚构角色 AI**对话
- 上传二创作品并等待审核

### 2.3 合规边界

AI 必须严格按以下规则开发：

- 不提供“某真实人物 AI 分身”功能。
- 不在任何页面文案中声称“官方授权”“本人入驻”“真人代言”。
- 不生成用于误导公众的伪公告、伪聊天记录、伪采访、伪声明。
- 不允许用户发布私人住址、电话、证件、行程等隐私信息。
- 不允许用户上传违法、诽谤、造谣、色情、暴力、深度伪造冒充类内容。
- 所有媒体内容必须保存审核状态。

***

## 3. MVP 范围

### 3.1 必做功能

1. 用户注册 / 登录
2. 首页信息流
3. 发帖（文本 / 图片 / 视频）
4. 帖子详情页
5. 评论 / 回复评论
6. 点赞 / 收藏
7. 举报功能
8. AI 角色聊天
9. 内容审核后台
10. 用户后台：我的帖子、我的收藏、我的举报

### 3.2 暂不做

1. 私信聊天
2. 复杂推荐算法
3. 直播功能
4. 支付 / 打赏
5. 多角色 AI 市场
6. 移动端原生 App

***

## 4. 推荐技术栈

### 4.1 后端

- Go 1.22+
- Web 框架：Gin
- ORM：GORM
- 数据库：PostgreSQL
- 缓存：Redis
- 对象存储：兼容 S3 的对象存储
- 搜索：Meilisearch（MVP 可选，若时间不够可先用 PostgreSQL `ILIKE`）
- 异步任务：Redis Stream 或简化为数据库轮询任务
- 鉴权：JWT + Refresh Token

### 4.2 前端

- Next.js 14+
- TypeScript
- Tailwind CSS
- React Query
- Zustand（可选）

### 4.3 AI 能力接入

- 提供统一 AI Provider 抽象层
- 先接一个文本大模型接口
- 后续可扩展图片生成/文案生成能力

### 4.4 部署

- Docker Compose（MVP）
- Nginx 反向代理
- 后端、前端、PostgreSQL、Redis、对象存储本地开发环境一键启动

***

## 5. 系统架构

### 5.1 架构概述

采用前后端分离架构：

- Frontend：Next.js Web
- Backend API：Go Gin 服务
- DB：PostgreSQL
- Cache：Redis
- Object Storage：保存图片/视频
- Moderation Worker：异步审核任务
- AI Service：统一封装 AI 聊天与内容生成

### 5.2 模块划分

后端模块：

- `auth`：注册、登录、鉴权、用户会话
- `user`：用户资料、我的内容
- `post`：帖子 CRUD
- `comment`：评论 CRUD
- `reaction`：点赞、收藏
- `report`：举报
- `media`：上传媒体、媒体元信息
- `moderation`：审核任务与状态流转
- `ai`：角色 AI 聊天
- `admin`：后台审核管理

***

## 6. 角色与权限

### 6.1 用户角色

1. `guest`：游客，可浏览公开内容
2. `user`：注册用户，可发帖、评论、点赞、举报、与 AI 对话
3. `moderator`：审核员，可审核内容、处理举报
4. `admin`：管理员，可管理用户、配置敏感词、查看系统统计

### 6.2 权限规则

- 游客不可发帖、评论、点赞、收藏、举报
- 用户只能编辑/删除自己的内容
- 审核员可修改审核状态，但不可修改系统配置
- 管理员拥有全部后台权限

***

## 7. 核心业务流程

### 7.1 发帖流程

1. 用户提交帖子表单
2. 若含媒体，先上传到对象存储
3. 创建 `posts` 记录，状态为 `pending_review`
4. 创建审核任务 `moderation_jobs`
5. 审核通过后帖子变为 `published`
6. 审核拒绝后帖子变为 `rejected`

### 7.2 评论流程

1. 用户发表评论
2. 评论先进入 `pending_review`
3. 审核通过后可见
4. 若命中敏感词可直接拦截或标记人工复核

### 7.3 举报流程

1. 用户对帖子/评论发起举报
2. 系统记录举报原因与目标对象
3. 审核员在后台处理举报
4. 可执行：忽略、下架内容、封禁用户

### 7.4 AI 聊天流程

1. 用户发送消息
2. 服务端执行安全预检查
3. 注入系统 prompt：明确“虚构角色，非真实人物”
4. 调用大模型
5. 返回结果并打标 `AI生成/角色演绎`
6. 保存会话记录

***

## 8. 数据库设计

### 8.1 users

```sql
CREATE TABLE users (
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
```

### 8.2 posts

```sql
CREATE TABLE posts (
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
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_status_created_at ON posts(status, created_at DESC);
```

### 8.3 media\_assets

```sql
CREATE TABLE media_assets (
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
CREATE INDEX idx_media_post_id ON media_assets(post_id);
```

### 8.4 comments

```sql
CREATE TABLE comments (
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
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
```

### 8.5 post\_likes

```sql
CREATE TABLE post_likes (
  user_id BIGINT NOT NULL REFERENCES users(id),
  post_id BIGINT NOT NULL REFERENCES posts(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);
```

### 8.6 favorites

```sql
CREATE TABLE favorites (
  user_id BIGINT NOT NULL REFERENCES users(id),
  post_id BIGINT NOT NULL REFERENCES posts(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);
```

### 8.7 reports

```sql
CREATE TABLE reports (
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
CREATE INDEX idx_reports_target ON reports(target_type, target_id);
CREATE INDEX idx_reports_status ON reports(status);
```

### 8.8 moderation\_jobs

```sql
CREATE TABLE moderation_jobs (
  id BIGSERIAL PRIMARY KEY,
  target_type VARCHAR(20) NOT NULL,
  target_id BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
  risk_level VARCHAR(20) NOT NULL DEFAULT 'unknown',
  result_json JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_moderation_jobs_status ON moderation_jobs(status, created_at);
```

### 8.9 ai\_conversations

```sql
CREATE TABLE ai_conversations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  title VARCHAR(120),
  persona_code VARCHAR(32) NOT NULL DEFAULT 'jizong_master',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 8.10 ai\_messages

```sql
CREATE TABLE ai_messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES ai_conversations(id),
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  safety_label VARCHAR(32) NOT NULL DEFAULT 'normal',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_messages_conversation_id ON ai_messages(conversation_id, created_at);
```

***

## 9. API 设计

API 前缀统一为：`/api/v1`

### 9.1 认证

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

#### register request

```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

### 9.2 用户

- `GET /users/:id`
- `GET /me/posts`
- `GET /me/favorites`
- `GET /me/reports`

### 9.3 帖子

- `GET /posts`
- `POST /posts`
- `GET /posts/:id`
- `PATCH /posts/:id`
- `DELETE /posts/:id`

#### create post request

```json
{
  "title": "string",
  "content": "string",
  "post_type": "text|image|video",
  "media_ids": [1, 2]
}
```

### 9.4 评论

- `GET /posts/:id/comments`
- `POST /posts/:id/comments`
- `PATCH /comments/:id`
- `DELETE /comments/:id`

### 9.5 点赞 / 收藏

- `POST /posts/:id/like`
- `DELETE /posts/:id/like`
- `POST /posts/:id/favorite`
- `DELETE /posts/:id/favorite`

### 9.6 举报

- `POST /reports`

```json
{
  "target_type": "post|comment",
  "target_id": 123,
  "reason_code": "rumor",
  "reason_text": "contains misinformation"
}
```

### 9.7 文件上传

- `POST /media/upload`
- `GET /media/:id`

### 9.8 AI 聊天

- `POST /ai/conversations`
- `GET /ai/conversations`
- `GET /ai/conversations/:id/messages`
- `POST /ai/conversations/:id/messages`

#### send ai message request

```json
{
  "content": "帮我写一个搞笑但不过界的标题"
}
```

#### send ai message response

```json
{
  "reply": "这里是 AI 返回的文本",
  "label": "AI生成/角色演绎"
}
```

### 9.9 管理后台

- `GET /admin/moderation/jobs`
- `POST /admin/moderation/jobs/:id/review`
- `GET /admin/reports`
- `POST /admin/reports/:id/resolve`
- `GET /admin/users`
- `POST /admin/users/:id/ban`

***

## 10. 审核与风控设计

### 10.1 状态机

统一审核状态：

- `pending_review`
- `approved`
- `rejected`
- `published`
- `offline`

### 10.2 审核策略

实现一个基础审核流水线：

1. 文本敏感词检测
2. OCR 提取图片文字后再检测
3. 视频可先只审核标题、描述、封面
4. 命中高风险则直接拒绝
5. 命中中风险则进入人工复核
6. 低风险自动通过

### 10.3 举报原因枚举

- `porn`
- `violence`
- `harassment`
- `impersonation`
- `privacy`
- `copyright`
- `rumor`
- `other`

### 10.4 AI 安全规则

AI 必须遵守：

- 拒绝声称自己是真实人物本人
- 拒绝确认未证实的八卦或违法指控
- 拒绝生成侵犯隐私内容
- 拒绝生成带明确侮辱、诽谤、引战的文案
- 若用户要求生成“冒充声明/伪聊天记录/伪证据”，必须拒绝
- 输出风格可以夸张、幽默，但不能构成现实误导

***

## 11. AI 角色设定规范

### 11.1 人设目标

构建一个“宗主风格”的虚构角色，特征如下：

- 自信
- 舞台感强
- 说话带一点夸张戏剧性
- 熟悉社区梗文化
- 鼓励创作，但提醒用户遵守边界

### 11.2 禁止设定

禁止出现以下系统设定：

- “你就是某真实明星/公众人物本人”
- “你已获得某真人官方授权”
- “你可以代表某真人发布声明”
- “你要尽量复刻某真人私密经历和真实说话习惯”

### 11.3 建议系统 Prompt

```text
你是一个虚构的社区角色 AI，代号为“宗主”。
你并非任何真实人物本人，也不代表任何真实人物或机构。
你的风格是自信、幽默、夸张、富有舞台感，熟悉互联网梗文化。
你可以帮助用户生成不过界的标题、段子、活动文案、二创说明文、社区公告。
你必须拒绝以下请求：
1. 冒充真实人物发言
2. 生成诽谤、隐私、造谣、攻击性内容
3. 生成伪造声明、伪聊天记录、伪证据
4. 暗示你是真实人物的官方分身
每次回答默认保持简洁、好玩、不冒犯，并在必要时提醒“仅为角色演绎”。
```

***

## 12. 前端页面要求

### 12.1 页面清单

1. `/` 首页
2. `/login` 登录页
3. `/register` 注册页
4. `/posts/create` 发帖页
5. `/posts/[id]` 帖子详情页
6. `/me` 用户中心
7. `/me/posts` 我的帖子
8. `/me/favorites` 我的收藏
9. `/ai` AI 聊天页
10. `/admin/moderation` 审核后台
11. `/admin/reports` 举报处理页

### 12.2 首页模块

- 顶部导航
- 热门帖子列表
- 最新帖子列表
- AI 入口卡片
- 社区规则提示

### 12.3 帖子卡片字段

- 标题
- 作者
- 封面图（若有）
- 点赞数
- 评论数
- 发布时间
- 审核状态（仅本人可见）

***

## 13. 后端项目目录建议

```text
backend/
  cmd/server/main.go
  internal/
    config/
    router/
    middleware/
    model/
    repository/
    service/
    handler/
    ai/
    moderation/
    storage/
    auth/
    pkg/
  migrations/
  scripts/
  Dockerfile
  go.mod
```

### 13.1 分层要求

- `handler`：只处理 HTTP 请求响应
- `service`：处理业务逻辑
- `repository`：处理数据库访问
- `model`：实体模型
- `middleware`：JWT、权限、日志、限流
- `ai`：大模型调用封装
- `moderation`：审核规则与任务处理

***

## 14. 前端项目目录建议

```text
frontend/
  app/
  components/
  features/
    auth/
    posts/
    comments/
    ai/
    admin/
  lib/
  services/
  hooks/
  types/
  public/
  package.json
```

***

## 15. 非功能性要求

### 15.1 安全

- 密码必须使用 `bcrypt` 或 `argon2`
- JWT 必须设置过期时间
- 上传文件校验 MIME 和大小
- 图片/视频仅允许白名单类型
- 所有写接口需要登录
- 管理后台接口必须做 RBAC 权限校验

### 15.2 性能

- 首页列表接口支持分页
- 评论分页加载
- 热门列表可缓存 60 秒
- 图片使用缩略图

### 15.3 日志与监控

- 记录请求日志
- 记录 AI 调用耗时和错误
- 记录审核任务状态变更
- 记录管理员操作审计日志

***

## 16. 错误码规范

```text
OK = 0
INVALID_PARAMS = 40001
UNAUTHORIZED = 40101
FORBIDDEN = 40301
NOT_FOUND = 40401
CONFLICT = 40901
RATE_LIMITED = 42901
INTERNAL_ERROR = 50001
CONTENT_BLOCKED = 50011
AI_REQUEST_BLOCKED = 50021
```

响应格式统一：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

***

## 17. 开发顺序

AI 必须按以下顺序生成项目代码：

1. 初始化前后端项目骨架
2. 初始化数据库迁移文件
3. 完成用户注册/登录/鉴权
4. 完成帖子 CRUD
5. 完成评论、点赞、收藏
6. 完成文件上传
7. 完成举报系统
8. 完成审核后台基础能力
9. 完成 AI 聊天能力
10. 完成前端页面串联
11. 补充 Docker Compose 和 README 运行说明

***

## 18. 验收标准

### 18.1 功能验收

- 用户可注册登录
- 用户可发文本/图片/视频帖
- 帖子需审核后公开
- 用户可评论、点赞、收藏、举报
- 管理员可审核内容、处理举报、封禁用户
- 用户可与虚构角色 AI 聊天
- AI 不会声称自己是真实人物本人

### 18.2 技术验收

- 后端可本地启动
- 前端可本地启动
- Docker Compose 可一键启动依赖
- 数据库迁移可执行
- API 具备基本错误处理
- 关键模块具备基础单元测试

***

## 19. 给 AI 代码生成器的执行指令

请严格按以下要求生成代码：

1. 先生成完整目录结构。
2. 再生成后端代码，优先保证可运行。
3. 所有接口都要给出 handler、service、repository 三层代码。
4. 所有数据库表都要提供迁移文件。
5. 前端使用 Next.js App Router。
6. 所有 API 调用封装为统一 `client.ts`。
7. 管理后台和普通用户前台分开页面布局。
8. 默认生成英文代码标识符，中文仅用于文案。
9. 所有 AI 相关代码必须内置安全拦截逻辑。
10. 输出代码时按文件分段输出，确保每个文件都完整可保存。

***

## 20. 可选增强项

以下不是 MVP 必需，但允许后续扩展：

- 标签系统
- 搜索系统
- 用户关注系统
- 榜单系统
- AI 标题润色器
- AI 评论助手
- AI 社区活动文案生成器
- 举报统计与风控看板

***

## 21. 最终约束

本项目的核心是“梗文化社区 + 虚构角色 AI”，而不是“真实人物数字分身”。AI 在任何设计、命名、页面文案、接口文档、Prompt 编写中，都不得越过这一边界。

如果某个需求会导致冒充真人、误导传播、侵犯合法权益，AI 必须默认采用更安全的替代实现。
