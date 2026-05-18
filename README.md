# ikun 不要感冒

一个以 ikun 宗门、二创内容、社区互动和公开热点聚合为核心的 MVP 社区项目。

## 合规边界

- 站内 AI 角色均为虚构角色，仅为角色演绎，不代表任何真实人物或机构。
- 用户上传文本、图片、视频都进入审核链路。
- AI 输出带有 `AI生成/角色演绎` 标识。
- 内置基础敏感词拦截、举报、下架、审核状态能力。

## 推荐部署方案

最省钱、最适合上线当前项目的方式是：

- 数据库：`Supabase Postgres`
- 媒体存储：`Supabase Storage`
- 后端：部署到 `Render`
- 前端：部署 Next.js，配置 `NEXT_PUBLIC_API_BASE`

当前后端已经原生支持 PostgreSQL，所以不依赖本地 MySQL。你只需要把 `DATABASE_DSN` 换成 Supabase 提供的 PostgreSQL 连接串即可。
当前版本也没有硬依赖 Redis，所以部署到 `reader` 时不需要额外准备本地缓存实例。

## 本地快速启动

```bash
cp backend/.env.example backend/.env
docker compose up -d postgres minio
cd backend
go mod tidy
go run ./cmd/server
```

如果你本地只想调试 PostgreSQL，也可以直接改 `backend/.env`：

```bash
DB_DRIVER=postgres
DATABASE_DSN=host=localhost user=kunzong password=kunzong dbname=kunzong port=5432 sslmode=disable TimeZone=Asia/Shanghai
```

首次使用本地 PostgreSQL 时先创建库并执行迁移：

```bash
createdb kunzong
psql "$DATABASE_DSN" -f backend/migrations/001_init.sql
```

如果你仍然想使用 MySQL，也保留了兼容配置：

```bash
DB_DRIVER=mysql
DATABASE_DSN=你的用户名:你的密码@tcp(127.0.0.1:3306)/kunzong?charset=utf8mb4&parseTime=True&loc=Local
```

前端：

```bash
cd frontend
npm install
npm run dev
```

## Supabase 接入

### 1. 创建项目

1. 打开 [Supabase](https://supabase.com/)
2. 新建一个 project
3. 记住这 3 个值：
- `Project URL`
- `Database password`
- `Connection string`

### 2. 创建业务表

在 Supabase 后台打开 `SQL Editor`，新建一个 query，把 [setup.sql](file:///Users/bytedance/go/src/my/kunzong/supabase/setup.sql) 全部粘进去执行。

这份 SQL 会创建：

- `users`
- `posts`
- `media_assets`
- `comments`
- `post_likes`
- `favorites`
- `reports`
- `moderation_jobs`
- `ai_conversations`
- `ai_messages`
- `community-media` bucket

### 3. 配置后端 `.env`

把 `backend/.env` 改成：

```bash
APP_ENV=production
HTTP_ADDR=:8080
DB_DRIVER=postgres
DATABASE_DSN=postgresql://postgres.your-project-ref:your-db-password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require

CORS_ORIGINS=https://你的前端域名
JWT_SECRET=换成一个长随机串
JWT_TTL_HOURS=24

ARK_API_KEY=你的方舟apikey
ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
ARK_MODEL=doubao-seed-2-0-lite-260215

SUPABASE_PROJECT_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=你的anon_key
SUPABASE_SERVICE_ROLE_KEY=你的service_role_key
SUPABASE_STORAGE_BUCKET=community-media
```

说明：

- 当前后端真正必须的是 `DATABASE_DSN`
- `SUPABASE_*` 这组变量是给后续媒体直传和管理预留的
- 现在的媒体接口仍然是“记录媒体元信息”，并不强制依赖本地磁盘

### 4. 配置前端 `.env`

把 `frontend/.env` 改成：

```bash
NEXT_PUBLIC_API_BASE=https://你的后端域名/api/v1
```

### 5. 在 Render 部署

后端部署时至少要带这些环境变量：

- `DB_DRIVER=postgres`
- `DATABASE_DSN=...`
- `JWT_SECRET=...`
- `CORS_ORIGINS=...`
- `ARK_API_KEY=...`

如果你暂时不用热点任务，可以关闭：

```bash
HOTSPOT_ENABLED=false
```

## Render 部署

仓库根目录已经新增 [render.yaml](file:///Users/bytedance/go/src/my/kunzong/render.yaml)，你可以直接在 Render 里用 Blueprint 导入。

### 服务规划

- 前端：`ikunzong-web`
- 后端：`ikunzong-api`
- 数据库：`Supabase`

### 自定义域名建议

- 前端：`https://www.ikunzong.com`
- 后端：`https://api.ikunzong.com`

### Render 导入步骤

1. 把当前项目推到 GitHub
2. 登录 [Render](https://render.com/)
3. 点击 `New` -> `Blueprint`
4. 选择你的 GitHub 仓库
5. Render 会自动读取 [render.yaml](file:///Users/bytedance/go/src/my/kunzong/render.yaml)
6. 创建 `ikunzong-api` 和 `ikunzong-web`

### 你要在 Render 后台补的密钥

后端服务：

- `DATABASE_DSN`
- `JWT_SECRET`
- `ARK_API_KEY`
- `ARK_MODEL`
- `SUPABASE_PROJECT_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WEBSEARCH_API_KEY`，如果你要开热点任务

前端服务：

- `NEXT_PUBLIC_API_BASE=https://api.ikunzong.com/api/v1`

### 域名配置

在 Render 里分别给两个服务绑定域名：

- `ikunzong-web` 绑定 `www.ikunzong.com`
- `ikunzong-api` 绑定 `api.ikunzong.com`

然后去你的域名服务商后台新增 DNS：

- `www`：
  - 类型：`CNAME`
  - 指向：Render 给前端服务的默认域名
- `api`：
  - 类型：`CNAME`
  - 指向：Render 给后端服务的默认域名

### 本地到线上环境变量映射

本地前端：

```bash
NEXT_PUBLIC_API_BASE=http://localhost:8080/api/v1
```

线上前端：

```bash
NEXT_PUBLIC_API_BASE=https://api.ikunzong.com/api/v1
```

本地后端：

```bash
CORS_ORIGINS=http://localhost:3000
```

线上后端：

```bash
CORS_ORIGINS=https://www.ikunzong.com
```

## 方舟 AI 配置

在 `backend/.env` 中配置：

```bash
ARK_API_KEY=你的方舟apikey
ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
ARK_MODEL=doubao-seed-2-0-lite-260215
```

## AI热点定时任务

开启后，后端启动时会创建 `ikun_hotspot_bot` 账号，定时调用 WebSearch 接口拉取公开热点，使用方舟模型整理成带 `AI热点` 标识的待审核帖子，并写入审核队列。

```bash
HOTSPOT_ENABLED=true
HOTSPOT_RUN_ON_START=true
HOTSPOT_INTERVAL=24h
HOTSPOT_QUERIES=蔡徐坤,蔡徐坤 热点,蔡徐坤 舞台,蔡徐坤 ikun
HOTSPOT_RESULT_LIMIT=8
HOTSPOT_AUTHOR_USERNAME=ikun_hotspot_bot
WEBSEARCH_DEFAULT_ENDPOINT=https://open.feedcoopapi.com/search_api/web_search
WEBSEARCH_ENDPOINTS=https://open.feedcoopapi.com/search_api/web_search
WEBSEARCH_API_KEY=你的websearch_apikey
```

注意：

- 自动生成的帖子默认是 `pending_review`，需要管理员审核后才会公开。
- 任务只整理公开来源结果，不应采集隐私、小道消息或未证实爆料。
- 多渠道搜索可以把多个接口写进 `WEBSEARCH_ENDPOINTS`，用英文逗号分隔。
- 如果 `ARK_API_KEY` 为空，会使用本地 fallback 文案，建议配置方舟后再开启正式任务。
- 如果你的 WebSearch 证书链比较特殊，可临时启用 `WEBSEARCH_INSECURE_SKIP_VERIFY=true`，但生产环境更建议修正证书配置。
