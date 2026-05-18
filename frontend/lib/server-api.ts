import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool, PoolClient } from 'pg';

type BackendEnvCache = Record<string, string>;

type UserClaims = {
  user_id: number;
  role: string;
};

type ModerationResult = {
  allowed: boolean;
  risk: string;
  matches: string[];
  decision: string;
};

const globalState = globalThis as typeof globalThis & {
  __ikunPgPool?: Pool;
  __ikunBackendEnv?: BackendEnvCache;
};

const DEFAULT_BLOCKED_WORDS = ['身份证', '手机号', '私人住址', '伪造声明', '伪聊天记录', '偷拍视频', '深度伪造', '开盒'];

function readBackendEnv(): BackendEnvCache {
  if (globalState.__ikunBackendEnv) return globalState.__ikunBackendEnv;
  const envPath = path.resolve(process.cwd(), '..', 'backend', '.env');
  const cache: BackendEnvCache = {};
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#') || !line.includes('=')) continue;
      const idx = line.indexOf('=');
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      cache[key] = value;
    }
  } catch {}
  globalState.__ikunBackendEnv = cache;
  return cache;
}

export function env(key: string, fallback = '') {
  return process.env[key] || readBackendEnv()[key] || fallback;
}

export function getPool() {
  if (!globalState.__ikunPgPool) {
    const connectionString = env('DATABASE_DSN');
    if (!connectionString) {
      throw new Error('DATABASE_DSN is required for Next API mode');
    }
    globalState.__ikunPgPool = new Pool({
      connectionString,
      ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
    });
  }
  return globalState.__ikunPgPool;
}

export async function withTransaction<T>(work: (client: PoolClient) => Promise<T>) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export function ok(data: unknown, status = 200) {
  return Response.json({ code: 0, message: 'ok', data }, { status });
}

export function fail(status: number, code: number, message: string) {
  return Response.json({ code, message, data: {} }, { status });
}

export function invalid(message: string) {
  return fail(400, 40001, message);
}

export function unauthorized(message = 'missing bearer token') {
  return fail(401, 40101, message);
}

export function forbidden(message = 'forbidden') {
  return fail(403, 40301, message);
}

export function notFound(message = 'not found') {
  return fail(404, 40401, message);
}

export function internal(message = 'internal error') {
  return fail(500, 50001, message);
}

export function parseBearerToken(req: Request) {
  const header = req.headers.get('authorization') || '';
  if (!header.toLowerCase().startsWith('bearer ')) return '';
  return header.slice(7).trim();
}

export async function requireAuth(req: Request) {
  const token = parseBearerToken(req);
  if (!token) {
    throw unauthorized('missing bearer token');
  }
  try {
    const decoded = jwt.verify(token, env('JWT_SECRET', 'change-me')) as UserClaims;
    return decoded;
  } catch {
    throw unauthorized('invalid token');
  }
}

export function requireRole(role: string, roles: string[]) {
  if (!roles.includes(role)) {
    throw forbidden('permission denied');
  }
}

export function signToken(userID: number, role: string) {
  const ttlHours = Number(env('JWT_TTL_HOURS', '24')) || 24;
  return jwt.sign({ user_id: userID, role }, env('JWT_SECRET', 'change-me'), { expiresIn: `${ttlHours}h` });
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function checkText(text: string): ModerationResult {
  const lower = text.toLowerCase();
  const matches = DEFAULT_BLOCKED_WORDS.filter((word) => lower.includes(word.toLowerCase()));
  if (matches.length > 0) {
    return { allowed: false, risk: 'high', matches, decision: 'rejected' };
  }
  return { allowed: true, risk: 'low', matches: [], decision: 'queued' };
}

export async function createModerationJob(client: PoolClient, targetType: string, targetID: number, riskLevel: string, result: unknown) {
  await client.query(
    `insert into moderation_jobs (target_type, target_id, status, risk_level, result_json, created_at, updated_at)
     values ($1, $2, 'queued', $3, $4::jsonb, now(), now())`,
    [targetType, targetID, riskLevel, JSON.stringify(result)],
  );
}

export function formatPost(row: any) {
  return {
    id: Number(row.id),
    author_id: Number(row.author_id),
    title: row.title,
    content: row.content || '',
    post_type: row.post_type,
    status: row.status,
    visibility: row.visibility,
    like_count: Number(row.like_count || 0),
    favorite_count: Number(row.favorite_count || 0),
    comment_count: Number(row.comment_count || 0),
    view_count: Number(row.view_count || 0),
    created_at: row.created_at,
    updated_at: row.updated_at,
    published_at: row.published_at,
    author: row.author_id
      ? {
          id: Number(row.author_id),
          username: row.author_username,
          email: row.author_email,
          role: row.author_role,
          status: row.author_status,
        }
      : undefined,
  };
}

export function formatComment(row: any) {
  return {
    id: Number(row.id),
    post_id: Number(row.post_id),
    author_id: Number(row.author_id),
    parent_id: row.parent_id ? Number(row.parent_id) : null,
    content: row.content,
    status: row.status,
    like_count: Number(row.like_count || 0),
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: row.author_id
      ? {
          id: Number(row.author_id),
          username: row.author_username,
          email: row.author_email,
          role: row.author_role,
          status: row.author_status,
        }
      : undefined,
  };
}

export function formatUser(row: any) {
  return {
    id: Number(row.id),
    username: row.username,
    email: row.email,
    avatar_url: row.avatar_url || '',
    bio: row.bio || '',
    role: row.role,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function readJSON(req: Request) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
