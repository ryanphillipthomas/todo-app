import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTodos } from '../store';

describe('useTodos', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useTodos());
    expect(result.current.todos).toHaveLength(0);
  });

  it('adds a todo', () => {
    const { result } = renderHook(() => useTodos());
    act(() => result.current.addTodo('Buy milk'));
    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].text).toBe('Buy milk');
    expect(result.current.todos[0].completed).toBe(false);
  });

  it('ignores blank text', () => {
    const { result } = renderHook(() => useTodos());
    act(() => result.current.addTodo('   '));
    expect(result.current.todos).toHaveLength(0);
  });

  it('completes a todo', () => {
    const { result } = renderHook(() => useTodos());
    act(() => result.current.addTodo('Walk dog'));
    const id = result.current.todos[0].id;
    act(() => result.current.completeTodo(id));
    expect(result.current.todos[0].completed).toBe(true);
  });

  it('toggles completion', () => {
    const { result } = renderHook(() => useTodos());
    act(() => result.current.addTodo('Walk dog'));
    const id = result.current.todos[0].id;
    act(() => result.current.completeTodo(id));
    act(() => result.current.completeTodo(id));
    expect(result.current.todos[0].completed).toBe(false);
  });

  it('deletes a todo', () => {
    const { result } = renderHook(() => useTodos());
    act(() => result.current.addTodo('Read book'));
    const id = result.current.todos[0].id;
    act(() => result.current.deleteTodo(id));
    expect(result.current.todos).toHaveLength(0);
  });

  it('sorts incomplete before completed', () => {
    const { result } = renderHook(() => useTodos());
    act(() => result.current.addTodo('First'));
    act(() => result.current.addTodo('Second'));
    act(() => result.current.completeTodo(result.current.todos[0].id));
    expect(result.current.todos[0].completed).toBe(false);
    expect(result.current.todos[1].completed).toBe(true);
  });
});
