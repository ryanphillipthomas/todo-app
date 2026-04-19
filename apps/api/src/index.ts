import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import pino from 'pino';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { randomUUID } from 'crypto';
import db from './db';
import authRouter from './routes/auth';
import { requireAuth, type AuthRequest } from './middleware/requireAuth';
import { verifyAccessToken } from './auth';

const PORT = Number(process.env.PORT) || 3001;
const isDev = process.env.NODE_ENV !== 'production';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const corsOrigin = isDev
  ? (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => cb(null, true)
  : (process.env.CORS_ORIGIN || 'http://localhost:5173');

const app = express();
app.use(helmet());
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use(pinoHttp({ logger }));

const server = createServer(app);
const wss = new WebSocketServer({ server });

const userSockets = new Map<string, Set<WebSocket>>();

function broadcastToUser(userId: string) {
  const todos = db.prepare('SELECT * FROM todos WHERE user_id = ? ORDER BY completed ASC, createdAt DESC').all(userId);
  const payload = JSON.stringify(todos);
  userSockets.get(userId)?.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) ws.send(payload);
  });
}

wss.on('connection', (ws, req) => {
  const token = new URL(req.url ?? '/', `http://localhost`).searchParams.get('token');
  let userId: string | null = null;

  try {
    const payload = verifyAccessToken(token ?? '');
    userId = payload.sub;
  } catch {
    ws.close(1008, 'unauthorized');
    return;
  }

  if (!userSockets.has(userId)) userSockets.set(userId, new Set());
  userSockets.get(userId)!.add(ws);

  const todos = db.prepare('SELECT * FROM todos WHERE user_id = ? ORDER BY completed ASC, createdAt DESC').all(userId);
  ws.send(JSON.stringify(todos));

  ws.on('close', () => {
    userSockets.get(userId!)?.delete(ws);
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

app.use('/auth', authRouter);

app.get('/todos', requireAuth, (req: AuthRequest, res) => {
  const todos = db.prepare('SELECT * FROM todos WHERE user_id = ? ORDER BY completed ASC, createdAt DESC').all(req.userId);
  res.json(todos);
});

app.post('/todos', requireAuth, (req: AuthRequest, res) => {
  const { text } = req.body as { text: string };
  const trimmed = text?.trim();
  if (!trimmed) return res.status(400).json({ error: 'text is required' });
  if (trimmed.length > 500) return res.status(400).json({ error: 'text too long' });

  const todo = { id: randomUUID(), user_id: req.userId!, text: trimmed, completed: 0, createdAt: Date.now() };
  db.prepare('INSERT INTO todos (id, user_id, text, completed, createdAt) VALUES (?, ?, ?, ?, ?)').run(todo.id, todo.user_id, todo.text, todo.completed, todo.createdAt);
  broadcastToUser(req.userId!);
  res.status(201).json(todo);
});

app.patch('/todos/:id', requireAuth, (req: AuthRequest, res) => {
  const { id } = req.params;
  const todo = db.prepare('SELECT * FROM todos WHERE id = ? AND user_id = ?').get(id, req.userId) as any;
  if (!todo) return res.status(404).json({ error: 'not found' });

  const completed = todo.completed ? 0 : 1;
  db.prepare('UPDATE todos SET completed = ? WHERE id = ?').run(completed, id);
  broadcastToUser(req.userId!);
  res.json({ ...todo, completed });
});

app.delete('/todos/:id', requireAuth, (req: AuthRequest, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM todos WHERE id = ? AND user_id = ?').run(id, req.userId);
  broadcastToUser(req.userId!);
  res.status(204).send();
});

app.use((_req, res) => res.status(404).json({ error: 'not found' }));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, __next: express.NextFunction) => {
  logger.error(err);
  res.status(500).json({ error: 'internal server error' });
});

server.listen(PORT, () => logger.info(`API running on http://localhost:${PORT}`));

export { app };
