import { Router } from 'express';
import appleSignin from 'apple-signin-auth';
import { randomUUID } from 'crypto';
import db from '../db';
import { signAccessToken, issueRefreshToken, rotateRefreshToken } from '../auth';

const router = Router();

const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID ?? 'com.todoapp.mobile';

router.post('/apple', async (req, res) => {
  const { identityToken, fullName } = req.body as { identityToken: string; fullName?: { givenName?: string; familyName?: string } };

  if (!identityToken) return res.status(400).json({ error: 'identityToken required' });

  let appleSub: string;
  let email: string | undefined;

  try {
    const payload = await appleSignin.verifyIdToken(identityToken, {
      audience: APPLE_CLIENT_ID,
      ignoreExpiration: false,
    });
    appleSub = payload.sub;
    email = payload.email;
  } catch (err) {
    return res.status(401).json({ error: 'invalid Apple identity token' });
  }

  let user = db.prepare('SELECT * FROM users WHERE apple_sub = ?').get(appleSub) as any;

  if (!user) {
    const name = fullName ? [fullName.givenName, fullName.familyName].filter(Boolean).join(' ') : undefined;
    user = { id: randomUUID(), apple_sub: appleSub, email: email ?? null, name: name ?? null, created_at: Date.now() };
    db.prepare('INSERT INTO users (id, apple_sub, email, name, created_at) VALUES (?, ?, ?, ?, ?)').run(user.id, user.apple_sub, user.email, user.name, user.created_at);
  }

  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const refreshToken = issueRefreshToken(user.id);

  res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name } });
});

router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body as { refreshToken: string };
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });

  const result = rotateRefreshToken(refreshToken);
  if (!result) return res.status(401).json({ error: 'invalid or expired refresh token' });

  res.json({ accessToken: result.accessToken, refreshToken: result.refreshToken });
});

if (process.env.NODE_ENV !== 'production') {
  router.post('/dev-login', (req, res) => {
    const { name = 'Dev User', email = 'dev@localhost' } = req.body as { name?: string; email?: string };
    const appleSub = `dev-${email}`;
    let user = db.prepare('SELECT * FROM users WHERE apple_sub = ?').get(appleSub) as any;
    if (!user) {
      user = { id: randomUUID(), apple_sub: appleSub, email, name, created_at: Date.now() };
      db.prepare('INSERT INTO users (id, apple_sub, email, name, created_at) VALUES (?, ?, ?, ?, ?)').run(user.id, user.apple_sub, user.email, user.name, user.created_at);
    }
    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = issueRefreshToken(user.id);
    res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name } });
  });
}

router.post('/logout', (req, res) => {
  const { refreshToken } = req.body as { refreshToken: string };
  if (refreshToken) db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
  res.status(204).send();
});

export default router;
