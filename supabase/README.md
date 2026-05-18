# Supabase 接入说明

## 目标

把项目的数据库和媒体存储放到 `Supabase`，这样部署到 `reader` 时不依赖本地 MySQL。

## 一次性初始化

### 1. 创建 Supabase Project

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 点击 `New project`
3. 选择组织、项目名和数据库密码
4. 创建完成后，记录以下信息：
- `Project URL`
- `Database password`
- `Project reference`

### 2. 找到数据库连接串

路径：

1. 进入项目
2. 打开 `Settings`
3. 打开 `Database`
4. 找到 `Connection string`
5. 选择 `Transaction pooler` 或 `Session pooler`

推荐用 `Transaction pooler`，格式一般类似：

```text
postgresql://postgres.<project-ref>:<db-password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
```

把它填到后端环境变量：

```bash
DB_DRIVER=postgres
DATABASE_DSN=postgresql://postgres.<project-ref>:<db-password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
```

### 3. 创建业务表

路径：

1. 打开 `SQL Editor`
2. 点击 `New query`
3. 把 [setup.sql](file:///Users/bytedance/go/src/my/kunzong/supabase/setup.sql) 全部复制进去
4. 点击 `Run`

执行后会创建：

- 社区业务表
- 更新时间触发器
- `community-media` 存储 bucket
- 公共读策略

## 后端配置

参考 `backend/.env.example`，最少需要：

```bash
APP_ENV=production
HTTP_ADDR=:8080
DB_DRIVER=postgres
DATABASE_DSN=postgresql://postgres.<project-ref>:<db-password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
CORS_ORIGINS=https://你的前端域名
JWT_SECRET=换成一个长随机串
ARK_API_KEY=你的方舟apikey
```

可选预留：

```bash
SUPABASE_PROJECT_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=community-media
```

## 前端配置

```bash
NEXT_PUBLIC_API_BASE=https://你的后端域名/api/v1
```

## 验证是否成功

### 数据库

在 `Table Editor` 中应能看到：

- `users`
- `posts`
- `comments`
- `reports`
- `moderation_jobs`

### 存储

在 `Storage` 中应能看到：

- `community-media`

## 当前实现边界

- 现在项目已经可以直接用 `Supabase Postgres` 作为主数据库
- 当前媒体接口主要保存媒体元信息，不依赖本地磁盘
- 如果你下一步要做“前端直接上传到 Supabase Storage”，我可以继续把上传链路补完整
