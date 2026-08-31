import { useState } from 'react';
import { useAuth } from './auth/AuthContext';
import { useRemoteTodos } from './useRemoteTodos';
import AddTodo from './components/AddTodo';
import TodoList from './components/TodoList';
import StatusBar from './components/StatusBar';
import LoginPage from './auth/LoginPage';
import Settings from './components/Settings';

function getInitial(user: { name?: string; email?: string }): string {
  const source = user.name ?? user.email ?? '?';
  return source.charAt(0).toUpperCase();
}

export default function App() {
  const { user, accessToken, signOut } = useAuth();
  const { todos, addTodo, completeTodo, deleteTodo, status, error } = useRemoteTodos(accessToken);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  if (!user) return <LoginPage />;

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.5px' }}>Todos</h1>
          {(user.name ?? user.email) && (
            <p style={{ fontSize: 13, color: '#8e8e93', marginTop: 2 }}>{user.name ?? user.email}</p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <button
            onClick={() => setSettingsOpen(true)}
            title="Settings"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 20, color: '#8e8e93', padding: '6px 4px', lineHeight: 1,
            }}
            aria-label="Open settings"
          >
            ⚙
          </button>
          <button
            onClick={() => setSignOutOpen(true)}
            title="Sign out"
            aria-label="Sign out"
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#1a1a1a', color: '#fff',
              border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 700, lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {getInitial(user)}
          </button>
        </div>
      </header>

      <StatusBar status={status} error={error} />
      <AddTodo onAdd={addTodo} />
      <TodoList todos={todos} onComplete={completeTodo} onDelete={deleteTodo} />

      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {signOutOpen && (
        <>
          <div
            onClick={() => setSignOutOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 2000,
            }}
          />
          <div style={{
            position: 'fixed',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#fff',
            borderRadius: 16,
            padding: '28px 28px 24px',
            zIndex: 2001,
            width: 300,
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            textAlign: 'center',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: '#1a1a1a', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700,
              margin: '0 auto 16px',
            }}>
              {getInitial(user)}
            </div>
            {(user.name ?? user.email) && (
              <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', margin: '0 0 4px' }}>
                {user.name ?? user.email}
              </p>
            )}
            <p style={{ fontSize: 13, color: '#8e8e93', margin: '0 0 24px' }}>
              Sign out of your account?
            </p>
            <button
              onClick={() => signOut()}
              style={{
                width: '100%', padding: '12px 0',
                background: '#ef4444', color: '#fff',
                border: 'none', borderRadius: 10,
                fontSize: 15, fontWeight: 600, cursor: 'pointer',
                marginBottom: 10,
              }}
            >
              Sign out
            </button>
            <button
              onClick={() => setSignOutOpen(false)}
              style={{
                width: '100%', padding: '12px 0',
                background: '#f5f5f5', color: '#555',
                border: 'none', borderRadius: 10,
                fontSize: 15, fontWeight: 500, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
