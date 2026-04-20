import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

// ---------------------------------------------------------------------------
// authDb must be created via vi.hoisted so it exists before vi.mock's factory
// runs (vi.mock calls are hoisted to the top of the file by Vitest).
// ---------------------------------------------------------------------------
const { authDb } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Database = require('better-sqlite3') as typeof import('better-sqlite3');
  const authDb = new Database(':memory:');
  authDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      apple_sub TEXT UNIQUE NOT NULL,
      email TEXT,
      name TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL
    )
  `);
  return { authDb };
});

// Replace the db singleton used by auth.ts and routes/auth.ts with authDb.
vi.mock('../db', () => ({ default: authDb }));

// Set NODE_ENV so dev-login route is registered (not 'production').
process.env.NODE_ENV = 'test';

// Import auth router AFTER the mock is in place.
// eslint-disable-next-line import/first
import authRouter from '../routes/auth';

// ---------------------------------------------------------------------------
// Todo app fixture (self-contained, does not use the db singleton)
// ---------------------------------------------------------------------------
function buildApp(db: Database.Database) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/todos', (_req, res) => {
    res.json(db.prepare('SELECT * FROM todos ORDER BY completed ASC, createdAt DESC').all());
  });

  app.post('/todos', (req, res) => {
    const { text } = req.body as { text: string };
    const trimmed = text?.trim();
    if (!trimmed) return res.status(400).json({ error: 'text is required' });
    if (trimmed.length > 500) return res.status(400).json({ error: 'text too long' });
    const todo = { id: randomUUID(), text: trimmed, completed: 0, createdAt: Date.now() };
    db.prepare('INSERT INTO todos (id, text, completed, createdAt) VALUES (?, ?, ?, ?)').run(todo.id, todo.text, todo.completed, todo.createdAt);
    res.status(201).json(todo);
  });

  app.patch('/todos/:id', (req, res) => {
    const { id } = req.params;
    const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as any;
    if (!todo) return res.status(404).json({ error: 'not found' });
    const completed = todo.completed ? 0 : 1;
    db.prepare('UPDATE todos SET completed = ? WHERE id = ?').run(completed, id);
    res.json({ ...todo, completed });
  });

  app.delete('/todos/:id', (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM todos WHERE id = ?').run(id);
    res.status(204).send();
  });

  return app;
}

// ---------------------------------------------------------------------------
// Auth app fixture — mounts the real auth router against the in-memory authDb
// ---------------------------------------------------------------------------
function buildAuthApp() {
  const app = express();
  app.use(express.json());
  app.use('/auth', authRouter);
  return app;
}

// ---------------------------------------------------------------------------
// State shared across todo tests
// ---------------------------------------------------------------------------
let db: Database.Database;
let app: ReturnType<typeof buildApp>;

beforeEach(() => {
  db = new Database(':memory:');
  db.exec(`CREATE TABLE todos (id TEXT PRIMARY KEY, text TEXT NOT NULL, completed INTEGER NOT NULL DEFAULT 0, createdAt INTEGER NOT NULL)`);
  app = buildApp(db);

  // Reset the auth in-memory db between auth tests
  authDb.exec('DELETE FROM refresh_tokens');
  authDb.exec('DELETE FROM users');
});

afterAll(() => {
  db?.close();
  authDb.close();
});

// ===========================================================================
// GET /todos
// ===========================================================================
describe('GET /todos', () => {
  it('returns empty array', async () => {
    const res = await request(app).get('/todos');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns todos sorted: incomplete first, then completed', async () => {
    // Create two todos and complete the first one
    const { body: t1 } = await request(app).post('/todos').send({ text: 'First' });
    const { body: t2 } = await request(app).post('/todos').send({ text: 'Second' });
    await request(app).patch(`/todos/${t1.id}`); // mark t1 completed

    const res = await request(app).get('/todos');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    // incomplete (completed=0) must come before completed (completed=1)
    expect(res.body[0].id).toBe(t2.id);
    expect(res.body[0].completed).toBe(0);
    expect(res.body[1].id).toBe(t1.id);
    expect(res.body[1].completed).toBe(1);
  });
});

// ===========================================================================
// POST /todos
// ===========================================================================
describe('POST /todos', () => {
  it('creates a todo', async () => {
    const res = await request(app).post('/todos').send({ text: 'Buy milk' });
    expect(res.status).toBe(201);
    expect(res.body.text).toBe('Buy milk');
    expect(res.body.completed).toBe(0);
  });

  it('rejects blank text', async () => {
    const res = await request(app).post('/todos').send({ text: '  ' });
    expect(res.status).toBe(400);
  });

  it('rejects text over 500 chars', async () => {
    const res = await request(app).post('/todos').send({ text: 'a'.repeat(501) });
    expect(res.status).toBe(400);
  });

  it('trims whitespace from text', async () => {
    const res = await request(app).post('/todos').send({ text: '  Walk dog  ' });
    expect(res.status).toBe(201);
    expect(res.body.text).toBe('Walk dog');
  });

  it('missing body returns 400', async () => {
    const res = await request(app).post('/todos').send({});
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// PATCH /todos/:id
// ===========================================================================
describe('PATCH /todos/:id', () => {
  it('toggles completion', async () => {
    const { body: todo } = await request(app).post('/todos').send({ text: 'Walk dog' });
    const res = await request(app).patch(`/todos/${todo.id}`);
    expect(res.body.completed).toBe(1);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).patch(`/todos/${randomUUID()}`);
    expect(res.status).toBe(404);
  });

  it('double toggle goes back to incomplete (completed=0)', async () => {
    const { body: todo } = await request(app).post('/todos').send({ text: 'Double toggle' });
    await request(app).patch(`/todos/${todo.id}`); // completed → 1
    const res = await request(app).patch(`/todos/${todo.id}`); // completed → 0
    expect(res.body.completed).toBe(0);
  });
});

// ===========================================================================
// DELETE /todos/:id
// ===========================================================================
describe('DELETE /todos/:id', () => {
  it('deletes a todo', async () => {
    const { body: todo } = await request(app).post('/todos').send({ text: 'Read book' });
    await request(app).delete(`/todos/${todo.id}`);
    const res = await request(app).get('/todos');
    expect(res.body).toHaveLength(0);
  });

  it('deleting non-existent id still returns 204', async () => {
    const res = await request(app).delete(`/todos/${randomUUID()}`);
    expect(res.status).toBe(204);
  });
});

// ===========================================================================
// Auth routes
// ===========================================================================
describe('Auth', () => {
  let authApp: ReturnType<typeof buildAuthApp>;

  beforeEach(() => {
    authApp = buildAuthApp();
  });

  describe('POST /auth/dev-login', () => {
    it('returns accessToken and refreshToken', async () => {
      const res = await request(authApp)
        .post('/auth/dev-login')
        .send({ name: 'Test User', email: 'test@example.com' });
      expect(res.status).toBe(200);
      expect(typeof res.body.accessToken).toBe('string');
      expect(typeof res.body.refreshToken).toBe('string');
      expect(res.body.user.email).toBe('test@example.com');
    });
  });

  describe('POST /auth/refresh', () => {
    it('returns new tokens when given a valid refresh token', async () => {
      // Obtain a refresh token via dev-login
      const loginRes = await request(authApp)
        .post('/auth/dev-login')
        .send({ email: 'refresh@example.com' });
      const { refreshToken } = loginRes.body;

      const res = await request(authApp)
        .post('/auth/refresh')
        .send({ refreshToken });
      expect(res.status).toBe(200);
      expect(typeof res.body.accessToken).toBe('string');
      expect(typeof res.body.refreshToken).toBe('string');
      // Rotated token must differ from the original
      expect(res.body.refreshToken).not.toBe(refreshToken);
    });

    it('returns 401 for invalid/expired token', async () => {
      const res = await request(authApp)
        .post('/auth/refresh')
        .send({ refreshToken: 'not-a-real-token' });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('returns 204 and deletes the refresh token', async () => {
      const loginRes = await request(authApp)
        .post('/auth/dev-login')
        .send({ email: 'logout@example.com' });
      const { refreshToken } = loginRes.body;

      const logoutRes = await request(authApp)
        .post('/auth/logout')
        .send({ refreshToken });
      expect(logoutRes.status).toBe(204);

      // Attempting to use the revoked token should now return 401
      const refreshRes = await request(authApp)
        .post('/auth/refresh')
        .send({ refreshToken });
      expect(refreshRes.status).toBe(401);
    });
  });
});
