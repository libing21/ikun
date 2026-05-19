import { PoolClient } from 'pg';
import {
  checkText,
  comparePassword,
  createModerationJob,
  ensureCommentLikesTable,
  ensureSiteLoopMediaTable,
  formatComment,
  formatPost,
  formatSiteLoopMedia,
  formatUser,
  getPool,
  getRuntimeDebugSnapshot,
  hashPassword,
  internal,
  invalid,
  notFound,
  ok,
  optionalAuth,
  readJSON,
  requireAuth,
  requireRole,
  signToken,
  unauthorized,
  uploadAvatarToSupabase,
  uploadPostMediaToSupabase,
  withTransaction,
} from '@/lib/server-api';
import { findBoardBySlug, POST_BOARDS, POST_TAGS, sanitizePostTags } from '@/lib/post-taxonomy';

export const runtime = 'nodejs';

type Context = { params: { slug: string[] } };

export async function GET(req: Request, ctx: Context) {
  return handle('GET', req, ctx.params.slug);
}

export async function POST(req: Request, ctx: Context) {
  return handle('POST', req, ctx.params.slug);
}

export async function PATCH(req: Request, ctx: Context) {
  return handle('PATCH', req, ctx.params.slug);
}

export async function DELETE(req: Request, ctx: Context) {
  return handle('DELETE', req, ctx.params.slug);
}

async function handle(method: string, req: Request, slug: string[]) {
  try {
    if (slug[0] === 'debug' && slug[1] === 'runtime-env' && method === 'GET') return ok(getRuntimeDebugSnapshot());
    if (slug[0] === 'debug' && slug[1] === 'db-ping' && method === 'GET') return debugDBPing();
    if (slug[0] === 'auth' && slug[1] === 'register' && method === 'POST') return register(req);
    if (slug[0] === 'auth' && slug[1] === 'login' && method === 'POST') return login(req);
    if (slug[0] === 'auth' && slug[1] === 'refresh' && method === 'POST') return ok({ message: 'refresh token flow can be extended later' });
    if (slug[0] === 'auth' && slug[1] === 'logout' && method === 'POST') return ok({ message: 'ok' });
    if (slug[0] === 'auth' && slug[1] === 'me' && method === 'GET') return me(req);
    if (slug[0] === 'me' && slug[1] === 'avatar' && method === 'POST') return uploadMyAvatar(req);
    if (slug[0] === 'me' && slug.length === 1 && method === 'PATCH') return updateMe(req);
    if (slug[0] === 'uploads' && slug[1] === 'post-media' && slug.length === 2 && method === 'POST') return uploadPostMedia(req);

    if (slug[0] === 'posts' && slug.length === 1 && method === 'GET') return listPosts(req);
    if (slug[0] === 'posts' && slug.length === 1 && method === 'POST') return createPost(req);
    if (slug[0] === 'posts' && slug[1] === 'taxonomy' && slug.length === 2 && method === 'GET') return listPostTaxonomy();
    if (slug[0] === 'posts' && slug.length === 2 && method === 'GET') return getPost(slug[1], req);
    if (slug[0] === 'posts' && slug[2] === 'comments' && method === 'GET') return listComments(slug[1], req);
    if (slug[0] === 'posts' && slug[2] === 'comments' && method === 'POST') return createComment(req, slug[1]);
    if (slug[0] === 'posts' && slug[2] === 'like' && method === 'POST') return likePost(req, slug[1]);
    if (slug[0] === 'posts' && slug[2] === 'like' && method === 'DELETE') return unlikePost(req, slug[1]);
    if (slug[0] === 'posts' && slug[2] === 'favorite' && method === 'POST') return favoritePost(req, slug[1]);
    if (slug[0] === 'posts' && slug[2] === 'favorite' && method === 'DELETE') return unfavoritePost(req, slug[1]);
    if (slug[0] === 'comments' && slug[2] === 'like' && method === 'POST') return likeComment(req, slug[1]);
    if (slug[0] === 'comments' && slug[2] === 'like' && method === 'DELETE') return unlikeComment(req, slug[1]);

    if (slug[0] === 'me' && slug[1] === 'posts' && method === 'GET') return myPosts(req);
    if (slug[0] === 'me' && slug[1] === 'favorites' && method === 'GET') return myFavorites(req);
    if (slug[0] === 'me' && slug[1] === 'reports' && method === 'GET') return myReports(req);

    if (slug[0] === 'reports' && slug.length === 1 && method === 'POST') return createReport(req);
    if (slug[0] === 'site' && slug[1] === 'loop-media' && slug.length === 2 && method === 'GET') return listSiteLoopMedia();
    if (slug[0] === 'rankings' && slug[1] === 'glory' && slug.length === 2 && method === 'GET') return listGloryRankings();

    if (slug[0] === 'admin' && slug[1] === 'moderation' && slug[2] === 'jobs' && slug.length === 3 && method === 'GET') return moderationJobs(req);
    if (slug[0] === 'admin' && slug[1] === 'moderation' && slug[2] === 'jobs' && slug[4] === 'review' && method === 'POST') return reviewModerationJob(req, slug[3]);
    if (slug[0] === 'admin' && slug[1] === 'reports' && slug.length === 2 && method === 'GET') return adminReports(req);
    if (slug[0] === 'admin' && slug[1] === 'reports' && slug[3] === 'resolve' && method === 'POST') return resolveReport(req, slug[2]);
    if (slug[0] === 'admin' && slug[1] === 'site' && slug[2] === 'loop-media' && slug.length === 3 && method === 'GET') return adminSiteLoopMedia(req);
    if (slug[0] === 'admin' && slug[1] === 'site' && slug[2] === 'loop-media' && slug.length === 3 && method === 'POST') return createSiteLoopMedia(req);
    if (slug[0] === 'admin' && slug[1] === 'site' && slug[2] === 'loop-media' && slug.length === 4 && method === 'PATCH') return updateSiteLoopMedia(req, slug[3]);
    if (slug[0] === 'admin' && slug[1] === 'site' && slug[2] === 'loop-media' && slug.length === 4 && method === 'DELETE') return deleteSiteLoopMedia(req, slug[3]);

    if (slug[0] === 'ai' && slug[1] === 'hotspots' && slug[2] === 'generate' && method === 'POST') {
      return invalid('热点抓取第二阶段再迁移，当前先保留 Go 后端版本');
    }

    return notFound('route not found');
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('[api/v1]', error);
    return internal(error instanceof Error ? error.message : 'internal error');
  }
}

async function listPostTaxonomy() {
  const statsResult = await getPool().query(
    `select
        p.board_slug,
        count(*)::int as post_count,
        count(*) filter (where p.created_at >= now() - interval '1 day')::int as recent_post_count,
        max(p.created_at) as latest_post_at
      from posts p
     where p.status = 'published'
     group by p.board_slug`,
  );

  const statsMap = new Map<
    string,
    {
      post_count: number;
      recent_post_count: number;
      latest_post_at: string;
    }
  >();

  for (const row of statsResult.rows) {
    statsMap.set(String(row.board_slug || ''), {
      post_count: Number(row.post_count || 0),
      recent_post_count: Number(row.recent_post_count || 0),
      latest_post_at: row.latest_post_at || '',
    });
  }

  return ok({
    boards: POST_BOARDS.map((board) => ({
      ...board,
      post_count: statsMap.get(board.slug)?.post_count || 0,
      recent_post_count: statsMap.get(board.slug)?.recent_post_count || 0,
      latest_post_at: statsMap.get(board.slug)?.latest_post_at || '',
    })),
    tags: POST_TAGS,
  });
}

function parseID(value?: string) {
  const id = Number(value);
  if (!Number.isFinite(id) || id <= 0) throw invalid('invalid id');
  return id;
}

async function debugDBPing() {
  try {
    const result = await getPool().query('select 1 as ok');
    return ok({ connected: result.rows[0]?.ok === 1 });
  } catch (error) {
    const err = error as { name?: string; message?: string; code?: string; errno?: number; syscall?: string; hostname?: string };
    return Response.json(
      {
        code: 50002,
        message: 'db ping failed',
        data: {
          name: err?.name || '',
          message: err?.message || 'unknown error',
          code: err?.code || '',
          errno: err?.errno || 0,
          syscall: err?.syscall || '',
          hostname: err?.hostname || '',
        },
      },
      { status: 500 },
    );
  }
}

async function register(req: Request) {
  const body = await readJSON(req);
  const username = String(body.username || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!username || !email || password.length < 8) return invalid('username, email and password>=8 required');

  const pool = getPool();
  const emailExists = await pool.query('select id from users where email = $1 limit 1', [email]);
  if (emailExists.rowCount) return invalid('email already exists');
  const usernameExists = await pool.query('select id from users where username = $1 limit 1', [username]);
  if (usernameExists.rowCount) return invalid('username already exists');

  const passwordHash = await hashPassword(password);
  const inserted = await pool.query(
    `insert into users (username, email, password_hash, role, status, created_at, updated_at)
     values ($1, $2, $3, 'user', 'active', now(), now())
     returning id, username, email, avatar_url, bio, role, status, created_at, updated_at`,
    [username, email, passwordHash],
  );
  const user = formatUser(inserted.rows[0]);
  return ok({ token: signToken(user.id, user.role), user });
}

async function login(req: Request) {
  const body = await readJSON(req);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!email || !password) return invalid('email and password required');

  const pool = getPool();
  const result = await pool.query(
    'select id, username, email, avatar_url, bio, role, status, password_hash, created_at, updated_at from users where email = $1 limit 1',
    [email],
  );
  if (!result.rowCount) return invalid('invalid credentials');

  const row = result.rows[0];
  if (!(await comparePassword(password, row.password_hash))) return invalid('invalid credentials');
  if (row.status !== 'active') return invalid('user is not active');

  const user = formatUser(row);
  return ok({ token: signToken(user.id, user.role), user });
}

async function me(req: Request) {
  const claims = await requireAuth(req);
  const result = await getPool().query(
    'select id, username, email, avatar_url, bio, role, status, created_at, updated_at from users where id = $1 limit 1',
    [claims.user_id],
  );
  if (!result.rowCount) return unauthorized('user not found');
  return ok(formatUser(result.rows[0]));
}

async function updateMe(req: Request) {
  const claims = await requireAuth(req);
  const body = await readJSON(req);
  const avatarURL = String(body.avatar_url || '').trim();
  const bio = String(body.bio || '').trim().slice(0, 255);
  const updated = await getPool().query(
    `update users
        set avatar_url = $2,
            bio = $3,
            updated_at = now()
      where id = $1
      returning id, username, email, avatar_url, bio, role, status, created_at, updated_at`,
    [claims.user_id, avatarURL, bio],
  );
  if (!updated.rowCount) return notFound('user not found');
  return ok(formatUser(updated.rows[0]));
}

async function uploadMyAvatar(req: Request) {
  const claims = await requireAuth(req);
  const formData = await req.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) return invalid('avatar file required');

  const avatarURL = await uploadAvatarToSupabase(claims.user_id, file);
  const updated = await getPool().query(
    `update users
        set avatar_url = $2,
            updated_at = now()
      where id = $1
      returning id, username, email, avatar_url, bio, role, status, created_at, updated_at`,
    [claims.user_id, avatarURL],
  );
  if (!updated.rowCount) return notFound('user not found');
  return ok(formatUser(updated.rows[0]));
}

async function uploadPostMedia(req: Request) {
  const claims = await requireAuth(req);
  const formData = await req.formData();
  const file = formData.get('file');
  const kindRaw = String(formData.get('kind') || '').trim().toLowerCase();
  const kind = (kindRaw || 'image') as 'image' | 'video' | 'poster';
  if (!(file instanceof File)) return invalid('media file required');
  if (!['image', 'video', 'poster'].includes(kind)) return invalid('kind must be image, video or poster');

  const uploaded = await uploadPostMediaToSupabase(claims.user_id, file, kind);
  return ok(uploaded, 201);
}

async function listPosts(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('limit') || '20') || 20, 100);
  const offset = Number(url.searchParams.get('offset') || '0') || 0;
  const boardSlug = String(url.searchParams.get('board') || '').trim();
  const tag = String(url.searchParams.get('tag') || '').trim();
  const viewerID = optionalAuth(req)?.user_id || null;
  const conditions = [`p.status = 'published'`];
  const params: Array<string | number | null> = [viewerID];

  if (boardSlug) {
    params.push(boardSlug);
    conditions.push(`p.board_slug = $${params.length}`);
  }
  if (tag) {
    params.push(tag);
    conditions.push(`$${params.length} = any(coalesce(p.tags, '{}'::text[]))`);
  }

  params.push(limit);
  const limitIndex = params.length;
  params.push(offset);
  const offsetIndex = params.length;

  const result = await getPool().query(
    `select p.*, u.id as author_id, u.username as author_username, u.email as author_email, u.avatar_url as author_avatar_url, u.bio as author_bio, u.role as author_role, u.status as author_status,
            (pl.user_id is not null) as liked_by_me,
            (f.user_id is not null) as favorited_by_me
     from posts p
     left join users u on u.id = p.author_id
     left join post_likes pl on pl.post_id = p.id and pl.user_id = $1
     left join favorites f on f.post_id = p.id and f.user_id = $1
     where ${conditions.join(' and ')}
     order by p.created_at desc
     limit $${limitIndex} offset $${offsetIndex}`,
    params,
  );
  return ok(result.rows.map(formatPost));
}

async function getPost(idRaw: string, req: Request) {
  const id = parseID(idRaw);
  const viewerID = optionalAuth(req)?.user_id || null;
  const result = await getPool().query(
    `select p.*, u.id as author_id, u.username as author_username, u.email as author_email, u.avatar_url as author_avatar_url, u.bio as author_bio, u.role as author_role, u.status as author_status,
            (pl.user_id is not null) as liked_by_me,
            (f.user_id is not null) as favorited_by_me
     from posts p
     left join users u on u.id = p.author_id
     left join post_likes pl on pl.post_id = p.id and pl.user_id = $2
     left join favorites f on f.post_id = p.id and f.user_id = $2
     where p.id = $1
     limit 1`,
    [id, viewerID],
  );
  if (!result.rowCount) return notFound('post not found');
  return ok(formatPost(result.rows[0]));
}

async function createPost(req: Request) {
  const claims = await requireAuth(req);
  const body = await readJSON(req);
  const title = String(body.title || '').trim();
  const content = String(body.content || '').trim();
  const postType = String(body.post_type || 'text').trim() || 'text';
  const board = findBoardBySlug(String(body.board_slug || '').trim() || 'general');
  const tags = sanitizePostTags(body.tags);
  const mediaURL = String(body.media_url || '').trim();
  const mediaType = String(body.media_type || '').trim();
  const posterURL = String(body.poster_url || '').trim();
  const mediaMime = String(body.media_mime || '').trim();
  const mediaSize = Math.max(Number(body.media_size || 0) || 0, 0);
  const mediaWidth = Math.max(Number(body.media_width || 0) || 0, 0);
  const mediaHeight = Math.max(Number(body.media_height || 0) || 0, 0);
  const durationSeconds = Math.max(Number(body.duration_seconds || 0) || 0, 0);
  if (!title) return invalid('title required');
  if (!['text', 'image', 'video'].includes(postType)) return invalid('post_type must be text, image or video');
  if (postType === 'image' && (!mediaURL || mediaType !== 'image')) return invalid('image post requires uploaded image');
  if (postType === 'video' && (!mediaURL || mediaType !== 'video')) return invalid('video post requires uploaded video');
  if (postType === 'text' && (mediaURL || posterURL)) return invalid('text post cannot include media');

  const moderation = checkText(`${title}\n${content}`);
  const status = moderation.allowed ? 'pending_review' : 'rejected';
  const post = await withTransaction(async (client) => {
    const inserted = await client.query(
      `insert into posts (
         author_id, title, content, post_type, board_slug, board_name, tags,
         media_url, media_type, poster_url, media_mime, media_size, media_width, media_height, duration_seconds,
         status, visibility, like_count, favorite_count, comment_count, view_count, created_at, updated_at
       )
       values ($1, $2, $3, $4, $5, $6, $7::text[], $8, $9, $10, $11, $12, $13, $14, $15, $16, 'public', 0, 0, 0, 0, now(), now())
       returning *`,
      [
        claims.user_id,
        title,
        content,
        postType,
        board.slug,
        board.name,
        tags,
        mediaURL,
        mediaType,
        posterURL,
        mediaMime,
        mediaSize,
        mediaWidth,
        mediaHeight,
        durationSeconds,
        status,
      ],
    );
    await createModerationJob(client, 'post', inserted.rows[0].id, moderation.risk, moderation);
    return inserted.rows[0];
  });
  return ok(formatPost(post));
}

async function listComments(idRaw: string, req: Request) {
  await ensureCommentLikesTable();
  const postID = parseID(idRaw);
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('limit') || '20') || 20, 100);
  const offset = Number(url.searchParams.get('offset') || '0') || 0;
  const viewerID = optionalAuth(req)?.user_id || null;
  const result = await getPool().query(
    `select c.*, u.id as author_id, u.username as author_username, u.email as author_email, u.avatar_url as author_avatar_url, u.bio as author_bio, u.role as author_role, u.status as author_status,
            (cl.user_id is not null) as liked_by_me
     from comments c
     left join users u on u.id = c.author_id
     left join comment_likes cl on cl.comment_id = c.id and cl.user_id = $4
     where c.post_id = $1 and c.status = 'approved'
     order by c.created_at asc
     limit $2 offset $3`,
    [postID, limit, offset, viewerID],
  );
  return ok(result.rows.map(formatComment));
}

async function createComment(req: Request, idRaw: string) {
  const claims = await requireAuth(req);
  const postID = parseID(idRaw);
  const body = await readJSON(req);
  const content = String(body.content || '').trim();
  const parentID = body.parent_id === null || body.parent_id === undefined || body.parent_id === '' ? null : parseID(String(body.parent_id));
  if (!content) return invalid('content required');

  const comment = await withTransaction(async (client) => {
    if (parentID) {
      const parentResult = await client.query('select id, post_id, status from comments where id = $1 limit 1', [parentID]);
      if (!parentResult.rowCount) throw invalid('parent comment not found');
      const parentComment = parentResult.rows[0];
      if (Number(parentComment.post_id) !== postID) throw invalid('parent comment does not belong to this post');
      if (String(parentComment.status) !== 'approved') throw invalid('parent comment unavailable');
    }

    const inserted = await client.query(
      `insert into comments (post_id, author_id, parent_id, content, status, like_count, created_at, updated_at)
       values ($1, $2, $3, $4, $5, 0, now(), now())
       returning *`,
      [postID, claims.user_id, parentID, content, 'approved'],
    );
    await client.query('update posts set comment_count = comment_count + 1, updated_at = now() where id = $1', [postID]);
    return inserted.rows[0];
  });
  return ok(formatComment(comment));
}

async function likePost(req: Request, idRaw: string) {
  const claims = await requireAuth(req);
  const postID = parseID(idRaw);
  await withTransaction(async (client) => {
    const created = await client.query(
      'insert into post_likes (user_id, post_id, created_at) values ($1, $2, now()) on conflict do nothing returning user_id',
      [claims.user_id, postID],
    );
    if (created.rowCount) {
      await client.query('update posts set like_count = like_count + 1 where id = $1', [postID]);
    }
  });
  return ok({ liked: true });
}

async function likeComment(req: Request, idRaw: string) {
  const claims = await requireAuth(req);
  const commentID = parseID(idRaw);
  await ensureCommentLikesTable();
  await withTransaction(async (client) => {
    const created = await client.query(
      'insert into comment_likes (user_id, comment_id, created_at) values ($1, $2, now()) on conflict do nothing returning user_id',
      [claims.user_id, commentID],
    );
    if (created.rowCount) {
      await client.query('update comments set like_count = like_count + 1, updated_at = now() where id = $1', [commentID]);
    }
  });
  return ok({ liked: true });
}

async function unlikeComment(req: Request, idRaw: string) {
  const claims = await requireAuth(req);
  const commentID = parseID(idRaw);
  await ensureCommentLikesTable();
  await withTransaction(async (client) => {
    const deleted = await client.query('delete from comment_likes where user_id = $1 and comment_id = $2', [claims.user_id, commentID]);
    if (deleted.rowCount) {
      await client.query('update comments set like_count = greatest(like_count - 1, 0), updated_at = now() where id = $1', [commentID]);
    }
  });
  return ok({ liked: false });
}

async function unlikePost(req: Request, idRaw: string) {
  const claims = await requireAuth(req);
  const postID = parseID(idRaw);
  await withTransaction(async (client) => {
    const deleted = await client.query('delete from post_likes where user_id = $1 and post_id = $2', [claims.user_id, postID]);
    if (deleted.rowCount) {
      await client.query('update posts set like_count = greatest(like_count - 1, 0) where id = $1', [postID]);
    }
  });
  return ok({ liked: false });
}

async function favoritePost(req: Request, idRaw: string) {
  const claims = await requireAuth(req);
  const postID = parseID(idRaw);
  await withTransaction(async (client) => {
    const created = await client.query(
      'insert into favorites (user_id, post_id, created_at) values ($1, $2, now()) on conflict do nothing returning user_id',
      [claims.user_id, postID],
    );
    if (created.rowCount) {
      await client.query('update posts set favorite_count = favorite_count + 1 where id = $1', [postID]);
    }
  });
  return ok({ favorited: true });
}

async function unfavoritePost(req: Request, idRaw: string) {
  const claims = await requireAuth(req);
  const postID = parseID(idRaw);
  await withTransaction(async (client) => {
    const deleted = await client.query('delete from favorites where user_id = $1 and post_id = $2', [claims.user_id, postID]);
    if (deleted.rowCount) {
      await client.query('update posts set favorite_count = greatest(favorite_count - 1, 0) where id = $1', [postID]);
    }
  });
  return ok({ favorited: false });
}

async function myPosts(req: Request) {
  const claims = await requireAuth(req);
  const result = await getPool().query(
    `select p.*, u.id as author_id, u.username as author_username, u.email as author_email, u.avatar_url as author_avatar_url, u.bio as author_bio, u.role as author_role, u.status as author_status,
            (pl.user_id is not null) as liked_by_me,
            (f.user_id is not null) as favorited_by_me
     from posts p
     left join users u on u.id = p.author_id
     left join post_likes pl on pl.post_id = p.id and pl.user_id = $2
     left join favorites f on f.post_id = p.id and f.user_id = $2
     where p.author_id = $1
     order by p.created_at desc`,
    [claims.user_id, claims.user_id],
  );
  return ok(result.rows.map(formatPost));
}

async function myFavorites(req: Request) {
  const claims = await requireAuth(req);
  const result = await getPool().query(
    `select p.*, u.id as author_id, u.username as author_username, u.email as author_email, u.avatar_url as author_avatar_url, u.bio as author_bio, u.role as author_role, u.status as author_status,
            (pl.user_id is not null) as liked_by_me,
            true as favorited_by_me
     from favorites f
     join posts p on p.id = f.post_id
     left join users u on u.id = p.author_id
     left join post_likes pl on pl.post_id = p.id and pl.user_id = $2
     where f.user_id = $1
     order by f.created_at desc`,
    [claims.user_id, claims.user_id],
  );
  return ok(result.rows.map(formatPost));
}

async function myReports(req: Request) {
  const claims = await requireAuth(req);
  const result = await getPool().query('select * from reports where reporter_id = $1 order by created_at desc', [claims.user_id]);
  return ok(result.rows);
}

async function createReport(req: Request) {
  const claims = await requireAuth(req);
  const body = await readJSON(req);
  const targetType = String(body.target_type || '').trim();
  const targetID = Number(body.target_id || 0);
  const reasonCode = String(body.reason_code || '').trim();
  const reasonText = String(body.reason_text || '').trim();
  if (!['post', 'comment'].includes(targetType)) return invalid('invalid target_type');
  if (!targetID || !reasonCode) return invalid('target_id and reason_code required');

  const inserted = await getPool().query(
    `insert into reports (reporter_id, target_type, target_id, reason_code, reason_text, status, created_at)
     values ($1, $2, $3, $4, $5, 'open', now())
     returning *`,
    [claims.user_id, targetType, targetID, reasonCode, reasonText],
  );
  return ok(inserted.rows[0]);
}

async function listSiteLoopMedia() {
  await ensureSiteLoopMediaTable();
  const result = await getPool().query(
    `select *
       from site_loop_media
      where is_active = true
      order by sort_order asc, created_at desc`,
  );
  return ok(result.rows.map(formatSiteLoopMedia));
}

async function listGloryRankings() {
  const result = await getPool().query(
    `select
        u.id as user_id,
        u.username,
        count(p.id)::int as post_count,
        coalesce(sum(p.like_count), 0)::int as like_count,
        coalesce(sum(p.comment_count), 0)::int as comment_count,
        (count(p.id) * 5 + coalesce(sum(p.like_count), 0) * 2 + coalesce(sum(p.comment_count), 0))::int as score
      from users u
      join posts p on p.author_id = u.id
     where p.status = 'published'
       and p.created_at >= now() - interval '1 day'
     group by u.id, u.username
     order by post_count desc, like_count desc, comment_count desc, score desc, u.id asc
     limit 10`,
  );
  return ok(result.rows);
}

async function adminSiteLoopMedia(req: Request) {
  const claims = await requireAuth(req);
  requireRole(claims.role, ['moderator', 'admin']);
  await ensureSiteLoopMediaTable();
  const result = await getPool().query(
    `select *
       from site_loop_media
      order by sort_order asc, created_at desc`,
  );
  return ok(result.rows.map(formatSiteLoopMedia));
}

async function createSiteLoopMedia(req: Request) {
  const claims = await requireAuth(req);
  requireRole(claims.role, ['moderator', 'admin']);
  await ensureSiteLoopMediaTable();

  const body = await readJSON(req);
  const title = String(body.title || '').trim();
  const mediaType = String(body.media_type || '').trim();
  const mediaURL = String(body.media_url || '').trim();
  const posterURL = String(body.poster_url || '').trim();
  const sortOrder = Number(body.sort_order || 0) || 0;
  const isActive = body.is_active !== false;
  if (!title || !['image', 'video'].includes(mediaType) || !mediaURL) {
    return invalid('title, media_type(image|video) and media_url required');
  }

  const inserted = await getPool().query(
    `insert into site_loop_media (title, media_type, media_url, poster_url, sort_order, is_active, created_by, created_at, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, now(), now())
     returning *`,
    [title, mediaType, mediaURL, posterURL, sortOrder, isActive, claims.user_id],
  );
  return ok(formatSiteLoopMedia(inserted.rows[0]));
}

async function updateSiteLoopMedia(req: Request, idRaw: string) {
  const claims = await requireAuth(req);
  requireRole(claims.role, ['moderator', 'admin']);
  await ensureSiteLoopMediaTable();

  const id = parseID(idRaw);
  const body = await readJSON(req);
  const title = String(body.title || '').trim();
  const mediaType = String(body.media_type || '').trim();
  const mediaURL = String(body.media_url || '').trim();
  const posterURL = String(body.poster_url || '').trim();
  const sortOrder = Number(body.sort_order || 0) || 0;
  const isActive = body.is_active !== false;
  if (!title || !['image', 'video'].includes(mediaType) || !mediaURL) {
    return invalid('title, media_type(image|video) and media_url required');
  }

  const updated = await getPool().query(
    `update site_loop_media
        set title = $2,
            media_type = $3,
            media_url = $4,
            poster_url = $5,
            sort_order = $6,
            is_active = $7,
            updated_at = now()
      where id = $1
      returning *`,
    [id, title, mediaType, mediaURL, posterURL, sortOrder, isActive],
  );
  if (!updated.rowCount) return notFound('site loop media not found');
  return ok(formatSiteLoopMedia(updated.rows[0]));
}

async function deleteSiteLoopMedia(req: Request, idRaw: string) {
  const claims = await requireAuth(req);
  requireRole(claims.role, ['moderator', 'admin']);
  await ensureSiteLoopMediaTable();

  const id = parseID(idRaw);
  await getPool().query('delete from site_loop_media where id = $1', [id]);
  return ok({ deleted: true });
}

async function moderationJobs(req: Request) {
  const claims = await requireAuth(req);
  requireRole(claims.role, ['moderator', 'admin']);
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const result = await getPool().query(
    `select mj.*,
            p.title as post_title,
            p.content as post_content,
            p.status as post_status,
            p.media_type as post_media_type,
            p.media_url as post_media_url,
            p.poster_url as post_poster_url,
            p.duration_seconds as post_duration_seconds,
            pu.username as post_author_username,
            c.content as comment_content,
            c.status as comment_status,
            cu.username as comment_author_username
       from moderation_jobs mj
       left join posts p on mj.target_type = 'post' and p.id = mj.target_id
       left join users pu on pu.id = p.author_id
       left join comments c on mj.target_type = 'comment' and c.id = mj.target_id
       left join users cu on cu.id = c.author_id
      ${status ? 'where mj.status = $1' : ''}
      order by mj.created_at desc`,
    status ? [status] : [],
  );
  return ok(
    result.rows.map((row) => ({
      ...row,
      target_title: row.post_title || (row.target_type === 'comment' ? '评论审核' : ''),
      target_content: row.post_content || row.comment_content || '',
      target_status: row.post_status || row.comment_status || '',
      target_author_username: row.post_author_username || row.comment_author_username || '',
      target_media_type: row.post_media_type || '',
      target_media_url: row.post_media_url || '',
      target_poster_url: row.post_poster_url || '',
      target_duration_seconds: Number(row.post_duration_seconds || 0),
    })),
  );
}

async function reviewModerationJob(req: Request, idRaw: string) {
  const claims = await requireAuth(req);
  requireRole(claims.role, ['moderator', 'admin']);
  const jobID = parseID(idRaw);
  const body = await readJSON(req);
  const decision = String(body.decision || '').trim();
  if (!['approved', 'rejected'].includes(decision)) return invalid('decision must be approved or rejected');

  await withTransaction(async (client) => {
    const jobResult = await client.query('select * from moderation_jobs where id = $1 limit 1', [jobID]);
    if (!jobResult.rowCount) throw notFound('moderation job not found');
    const job = jobResult.rows[0];
    await client.query("update moderation_jobs set status = 'reviewed', risk_level = $2, updated_at = now() where id = $1", [jobID, decision]);
    if (job.target_type === 'post') {
      await reviewPost(client, Number(job.target_id), decision);
    } else if (job.target_type === 'comment') {
      await client.query('update comments set status = $2, updated_at = now() where id = $1', [Number(job.target_id), decision === 'approved' ? 'approved' : 'rejected']);
    } else if (job.target_type === 'media') {
      await client.query('update media_assets set status = $2 where id = $1', [Number(job.target_id), decision === 'approved' ? 'approved' : 'rejected']);
    }
  });
  return ok({ reviewed: true });
}

async function reviewPost(client: PoolClient, postID: number, decision: string) {
  if (decision === 'approved') {
    await client.query("update posts set status = 'published', published_at = now(), updated_at = now() where id = $1", [postID]);
  } else {
    await client.query("update posts set status = 'rejected', updated_at = now() where id = $1", [postID]);
  }
}

async function adminReports(req: Request) {
  const claims = await requireAuth(req);
  requireRole(claims.role, ['moderator', 'admin']);
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const result = await getPool().query(
    status ? 'select * from reports where status = $1 order by created_at desc' : 'select * from reports order by created_at desc',
    status ? [status] : [],
  );
  return ok(result.rows);
}

async function resolveReport(req: Request, idRaw: string) {
  const claims = await requireAuth(req);
  requireRole(claims.role, ['moderator', 'admin']);
  const reportID = parseID(idRaw);
  const body = await readJSON(req);
  const status = String(body.status || '').trim() || 'resolved';
  const note = String(body.note || '').trim();
  await getPool().query(
    'update reports set status = $2, resolution_note = $3, reviewed_by = $4, reviewed_at = now() where id = $1',
    [reportID, status, note, claims.user_id],
  );
  return ok({ resolved: true });
}
