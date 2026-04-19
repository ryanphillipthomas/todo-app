import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), 'todos.db');
const db = new Database(dbPath);

db.exec(`
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

export default db;
