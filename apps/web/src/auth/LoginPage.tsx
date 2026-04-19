import { useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
const isDev = import.meta.env.DEV;

declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: object) => void;
        signIn: () => Promise<{ authorization: { id_token: string } }>;
      };
    };
  }
}

export default function LoginPage() {
  const { handleAppleCallback, devLogin } = useAuth();
  const initialized = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialized.current || !window.AppleID || !import.meta.env.VITE_APPLE_SERVICE_ID) return;
    initialized.current = true;
    window.AppleID.auth.init({
      clientId: import.meta.env.VITE_APPLE_SERVICE_ID,
      scope: 'name email',
      redirectURI: window.location.origin,
      usePopup: true,
    });
  }, []);

  async function signIn() {
    if (!window.AppleID || !import.meta.env.VITE_APPLE_SERVICE_ID) {
      setError('Apple Sign In requires VITE_APPLE_SERVICE_ID. Use dev login below.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await window.AppleID.auth.signIn();
      await handleAppleCallback(result.authorization.id_token);
    } catch (e) {
      console.error('Apple sign in failed', e);
      setError('Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDevLogin() {
    setError(null);
    setLoading(true);
    try {
      await devLogin();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Dev login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 24 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700 }}>Todos</h1>
      <p style={{ color: '#666', fontSize: 15, textAlign: 'center', maxWidth: 300 }}>
        Sign in to sync your todos across all your devices.
      </p>

      {error && (
        <p style={{ color: '#e53e3e', fontSize: 13, maxWidth: 260, textAlign: 'center', margin: 0 }}>{error}</p>
      )}

      <button
        onClick={signIn}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 24px', background: '#000', color: '#fff',
          border: 'none', borderRadius: 8, fontSize: 15,
          fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', width: 260,
          opacity: loading ? 0.6 : 1,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 814 1000" fill="white">
          <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.8 0 663 0 541.8c0-207.6 143.5-317.9 284.8-317.9 74.9 0 137.3 49.3 184.5 49.3 44.9 0 114.9-52 201.5-52 32.4 0 117.4 2.6 181.5 66.3zm-108.6-128.2c31.2-37.6 54.1-89.9 54.1-142.2 0-7.1-.6-14.3-1.9-20.1-51.5 1.9-112.3 34.2-149.2 75.8-28.5 32.4-55.1 84.7-55.1 137.8 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 46.8 0 103.1-31.2 136.6-70.7z"/>
        </svg>
        Sign in with Apple
      </button>

      {isDev && (
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <p style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>— dev only —</p>
          <button
            onClick={handleDevLogin}
            disabled={loading}
            style={{
              padding: '10px 24px', background: '#f5f5f5', color: '#555',
              border: '1.5px solid #ddd', borderRadius: 8, fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer', width: 260,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Signing in…' : 'Continue as Test User'}
          </button>
        </div>
      )}
    </div>
  );
}
