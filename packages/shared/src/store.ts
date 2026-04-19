import { useState } from 'react';
import type { Todo, TodoId } from './types';
import { generateId, sortTodos } from './utils';

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);

  function addTodo(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTodos(prev => sortTodos([...prev, { id: generateId(), text: trimmed, completed: false, createdAt: Date.now() }]));
  }

  function completeTodo(id: TodoId) {
    setTodos(prev => sortTodos(prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t)));
  }

  function deleteTodo(id: TodoId) {
    setTodos(prev => prev.filter(t => t.id !== id));
  }

  return { todos, addTodo, completeTodo, deleteTodo };
}
