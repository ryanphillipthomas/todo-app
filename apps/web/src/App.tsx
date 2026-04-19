import { useState } from 'react';
import { useAuth } from './auth/AuthContext';
import { useRemoteTodos } from './useRemoteTodos';
import AddTodo from './components/AddTodo';
import TodoList from './components/TodoList';
import StatusBar from './components/StatusBar';
import LoginPage from './auth/LoginPage';
import Settings from './components/Settings';

export default function App() {
  const { user, accessToken } = useAuth();
  const { todos, addTodo, completeTodo, deleteTodo, status, error } = useRemoteTodos(accessToken);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
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
        </div>
      </header>

      <StatusBar status={status} error={error} />
      <AddTodo onAdd={addTodo} />
      <TodoList todos={todos} onComplete={completeTodo} onDelete={deleteTodo} />

      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
