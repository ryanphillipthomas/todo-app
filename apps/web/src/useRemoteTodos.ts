import { useEffect, useState, useCallback, useRef } from 'react';
import type { Todo } from '@todo-app/shared';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
const WS = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3001';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export function useRemoteTodos(accessToken: string | null) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    function connect() {
      const ws = new WebSocket(`${WS}?token=${encodeURIComponent(accessToken!)}`);
      wsRef.current = ws;
      setStatus('connecting');
      ws.onopen = () => !cancelled && setStatus('connected');
      ws.onmessage = (e) => { if (!cancelled) setTodos(JSON.parse(e.data)); };
      ws.onclose = () => {
        if (!cancelled) {
          setStatus('disconnected');
          setTimeout(connect, 3000);
        }
      };
      ws.onerror = () => ws.close();
    }

    connect();
    return () => {
      cancelled = true;
      wsRef.current?.close();
    };
  }, [accessToken]);

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  }), [accessToken]);

  const addTodo = useCallback(async (text: string) => {
    if (!text.trim()) return;
    try {
      setError(null);
      const res = await fetch(`${API}/todos`, { method: 'POST', headers: headers(), body: JSON.stringify({ text }) });
      if (!res.ok) throw new Error();
    } catch { setError('Failed to add todo'); }
  }, [headers]);

  const completeTodo = useCallback(async (id: string) => {
    try {
      await fetch(`${API}/todos/${id}`, { method: 'PATCH', headers: headers() });
    } catch { setError('Failed to update todo'); }
  }, [headers]);

  const deleteTodo = useCallback(async (id: string) => {
    try {
      await fetch(`${API}/todos/${id}`, { method: 'DELETE', headers: headers() });
    } catch { setError('Failed to delete todo'); }
  }, [headers]);

  return { todos, addTodo, completeTodo, deleteTodo, status, error };
}
