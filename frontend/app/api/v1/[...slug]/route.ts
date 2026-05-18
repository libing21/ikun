import { PoolClient } from 'pg';
import {
  checkText,
  comparePassword,
  createModerationJob,
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
  readJSON,
  requireAuth,
  requireRole,
  signToken,
  unauthorized,
  withTransaction,
} from '@/lib/server-api';

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

    if (slug[0] === 'posts' && slug.length === 1 && method === 'GET') return listPosts(req);
    if (slug[0] === 'posts' && slug.length === 1 && method === 'POST') return createPost(req);
    if (slug[0] === 'posts' && slug.length === 2 && method === 'GET') return getPost(slug[1]);
    if (slug[0] === 'posts' && slug[2] === 'comments' && method === 'GET') return listComments(slug[1], req);
    if (slug[0] === 'posts' && slug[2] === 'comments' && method === 'POST') return createComment(req, slug[1]);
    if (slug[0] === 'posts' && slug[2] === 'like' && method === 'POST') return likePost(req, slug[1]);
    if (slug[0] === 'posts' && slug[2] === 'like' && method === 'DELETE') return unlikePost(req, slug[1]);
    if (slug[0] === 'posts' && slug[2] === 'favorite' && method === 'POST') return favoritePost(req, slug[1]);
    if (slug[0] === 'posts' && slug[2] === 'favorite' && method === 'DELETE') return unfavoritePost(req, slug[1]);

    if (slug[0] === 'me' && slug[1] === 'posts' && method === 'GET') return myPosts(req);
    if (slug[0] === 'me' && slug[1] === 'favorites' && method === 'GET') return myFavorites(req);
    if (slug[0] === 'me' && slug[1] === 'reports' && method === 'GET') return myReports(req);

    if (slug[0] === 'reports' && slug.length === 1 && method === 'POST') return createReport(req);
    if (slug[0] === 'site' && slug[1] === 'loop-media' && slug.length === 2 && method === 'GET') return listSiteLoopMedia();

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

async function listPosts(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('limit') || '20') || 20, 100);
  const offset = Number(url.searchParams.get('offset') || '0') || 0;
  const result = await getPool().query(
    `select p.*, u.id as author_id, u.username as author_username, u.email as author_email, u.role as author_role, u.status as author_status
     from posts p
     left join users u on u.id = p.author_id
     where p.status = 'published'
     order by p.created_at desc
     limit $1 offset $2`,
    [limit, offset],
  );
  return ok(result.rows.map(formatPost));
}

async function getPost(idRaw: string) {
  const id = parseID(idRaw);
  const result = await getPool().query(
    `select p.*, u.id as author_id, u.username as author_username, u.email as author_email, u.role as author_role, u.status as author_status
     from posts p
     left join users u on u.id = p.author_id
     where p.id = $1
     limit 1`,
    [id],
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
  if (!title) return invalid('title required');

  const moderation = checkText(`${title}\n${content}`);
  const status = moderation.allowed ? 'pending_review' : 'rejected';
  const post = await withTransaction(async (client) => {
    const inserted = await client.query(
      `insert into posts (author_id, title, content, post_type, status, visibility, like_count, favorite_count, comment_count, view_count, created_at, updated_at)
       values ($1, $2, $3, $4, $5, 'public', 0, 0, 0, 0, now(), now())
       returning *`,
      [claims.user_id, title, content, postType, status],
    );
    await createModerationJob(client, 'post', inserted.rows[0].id, moderation.risk, moderation);
    return inserted.rows[0];
  });
  return ok(formatPost(post));
}

async function listComments(idRaw: string, req: Request) {
  const postID = parseID(idRaw);
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('limit') || '20') || 20, 100);
  const offset = Number(url.searchParams.get('offset') || '0') || 0;
  const result = await getPool().query(
    `select c.*, u.id as author_id, u.username as author_username, u.email as author_email, u.role as author_role, u.status as author_status
     from comments c
     left join users u on u.id = c.author_id
     where c.post_id = $1 and c.status = 'approved'
     order by c.created_at asc
     limit $2 offset $3`,
    [postID, limit, offset],
  );
  return ok(result.rows.map(formatComment));
}

async function createComment(req: Request, idRaw: string) {
  const claims = await requireAuth(req);
  const postID = parseID(idRaw);
  const body = await readJSON(req);
  const content = String(body.content || '').trim();
  const parentID = body.parent_id ? Number(body.parent_id) : null;
  if (!content) return invalid('content required');

  const moderation = checkText(content);
  const status = moderation.allowed ? 'pending_review' : 'rejected';
  const comment = await withTransaction(async (client) => {
    const inserted = await client.query(
      `insert into comments (post_id, author_id, parent_id, content, status, like_count, created_at, updated_at)
       values ($1, $2, $3, $4, $5, 0, now(), now())
       returning *`,
      [postID, claims.user_id, parentID, content, status],
    );
    await createModerationJob(client, 'comment', inserted.rows[0].id, moderation.risk, moderation);
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
    `select p.*, u.id as author_id, u.username as author_username, u.email as author_email, u.role as author_role, u.status as author_status
     from posts p
     left join users u on u.id = p.author_id
     where p.author_id = $1
     order by p.created_at desc`,
    [claims.user_id],
  );
  return ok(result.rows.map(formatPost));
}

async function myFavorites(req: Request) {
  const claims = await requireAuth(req);
  const result = await getPool().query(
    `select p.*, u.id as author_id, u.username as author_username, u.email as author_email, u.role as author_role, u.status as author_status
     from favorites f
     join posts p on p.id = f.post_id
     left join users u on u.id = p.author_id
     where f.user_id = $1
     order by f.created_at desc`,
    [claims.user_id],
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
