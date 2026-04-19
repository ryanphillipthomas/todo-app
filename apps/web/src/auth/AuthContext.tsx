import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

interface AuthUser { id: string; email?: string; name?: string; }
interface AuthCtx {
  user: AuthUser | null;
  accessToken: string | null;
  signOut: () => Promise<void>;
  handleAppleCallback: (idToken: string) => Promise<void>;
  devLogin: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem(ACCESS_KEY));

  useEffect(() => {
    const refresh = localStorage.getItem(REFRESH_KEY);
    if (!refresh) return;
    fetch(`${API}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) { signOut(); return; }
        localStorage.setItem(ACCESS_KEY, data.accessToken);
        localStorage.setItem(REFRESH_KEY, data.refreshToken);
        setAccessToken(data.accessToken);
        setUser(decodeUser(data.accessToken));
      });
  }, []);

  async function handleAppleCallback(identityToken: string) {
    const res = await fetch(`${API}/auth/apple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identityToken }),
    });
    if (!res.ok) throw new Error('Sign in failed');
    const data = await res.json();
    localStorage.setItem(ACCESS_KEY, data.accessToken);
    localStorage.setItem(REFRESH_KEY, data.refreshToken);
    setAccessToken(data.accessToken);
    setUser(data.user);
  }

  async function devLogin() {
    const res = await fetch(`${API}/auth/dev-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error('Dev login failed — is the API running?');
    const data = await res.json();
    localStorage.setItem(ACCESS_KEY, data.accessToken);
    localStorage.setItem(REFRESH_KEY, data.refreshToken);
    setAccessToken(data.accessToken);
    setUser(data.user);
  }

  async function signOut() {
    const refresh = localStorage.getItem(REFRESH_KEY);
    if (refresh) {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      }).catch(() => {});
    }
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setAccessToken(null);
    setUser(null);
  }

  return (
    <Ctx.Provider value={{ user, accessToken, signOut, handleAppleCallback, devLogin }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

function decodeUser(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { id: payload.sub, email: payload.email };
  } catch { return null; }
}
