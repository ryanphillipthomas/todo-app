import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import WhatsNew from './WhatsNew';

type Theme = 'light' | 'dark' | 'system';

function getInitial(user: { name?: string; email?: string }): string {
  const source = user.name ?? user.email ?? '?';
  return source.charAt(0).toUpperCase();
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

function getStoredTheme(): Theme {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'system';
}

interface SettingsProps {
  open: boolean;
  onClose: () => void;
}

export default function Settings({ open, onClose }: SettingsProps) {
  const { user, signOut } = useAuth();
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  function handleSignOut() {
    onClose();
    signOut();
  }

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: 320,
    background: '#fff',
    boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
    zIndex: 1001,
    display: 'flex',
    flexDirection: 'column',
    transform: open ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    overflowY: 'auto',
  };

  const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.3)',
    zIndex: 1000,
    opacity: open ? 1 : 0,
    pointerEvents: open ? 'auto' : 'none',
    transition: 'opacity 300ms',
  };

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: '#8e8e93',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 8,
    marginTop: 24,
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #f2f2f7',
  };

  const themeButtonBase: React.CSSProperties = {
    flex: 1,
    padding: '7px 0',
    border: '1.5px solid #ddd',
    borderRadius: 8,
    background: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    color: '#333',
    transition: 'all 150ms',
  };

  const themeButtonActive: React.CSSProperties = {
    ...themeButtonBase,
    background: '#1a1a1a',
    borderColor: '#1a1a1a',
    color: '#fff',
  };

  return (
    <>
      <div style={backdropStyle} onClick={onClose} />

      <div style={panelStyle}>
        <div style={{ padding: '20px 24px 24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Settings</h2>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 22, color: '#8e8e93', lineHeight: 1, padding: '0 2px',
              }}
              aria-label="Close settings"
            >
              ×
            </button>
          </div>

          {/* Account section */}
          <p style={sectionLabelStyle}>Account</p>
          <div style={{ ...rowStyle, gap: 14, borderBottom: 'none' }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: '#1a1a1a', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700, flexShrink: 0,
            }}>
              {user ? getInitial(user) : '?'}
            </div>
            <div style={{ minWidth: 0 }}>
              {user?.name && (
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name}
                </div>
              )}
              {user?.email && (
                <div style={{ fontSize: 13, color: '#8e8e93', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </div>
              )}
            </div>
          </div>

          {/* Appearance section */}
          <p style={sectionLabelStyle}>Appearance</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['light', 'dark', 'system'] as Theme[]).map(t => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                style={theme === t ? themeButtonActive : themeButtonBase}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* What's New section */}
          <p style={sectionLabelStyle}>Updates</p>
          <div style={{ ...rowStyle, justifyContent: 'space-between', borderBottom: 'none' }}>
            <WhatsNew />
          </div>

          {/* Sign Out section */}
          <p style={sectionLabelStyle}>Account Actions</p>
          <div style={{ ...rowStyle, borderBottom: 'none' }}>
            <button
              onClick={handleSignOut}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 15, color: '#ef4444', padding: 0, fontWeight: 500,
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
