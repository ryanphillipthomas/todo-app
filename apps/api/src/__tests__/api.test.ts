import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

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

let db: Database.Database;
let app: ReturnType<typeof buildApp>;

beforeEach(() => {
  db = new Database(':memory:');
  db.exec(`CREATE TABLE todos (id TEXT PRIMARY KEY, text TEXT NOT NULL, completed INTEGER NOT NULL DEFAULT 0, createdAt INTEGER NOT NULL)`);
  app = buildApp(db);
});

afterAll(() => db?.close());

describe('GET /todos', () => {
  it('returns empty array', async () => {
    const res = await request(app).get('/todos');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

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
});

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
});

describe('DELETE /todos/:id', () => {
  it('deletes a todo', async () => {
    const { body: todo } = await request(app).post('/todos').send({ text: 'Read book' });
    await request(app).delete(`/todos/${todo.id}`);
    const res = await request(app).get('/todos');
    expect(res.body).toHaveLength(0);
  });
});
