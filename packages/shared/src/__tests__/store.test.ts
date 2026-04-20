import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTodos } from '../store';
import { releases, currentVersion } from '../changelog';
import { generateId, sortTodos } from '../utils';

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

describe('changelog', () => {
  it('releases array is non-empty', () => {
    expect(releases.length).toBeGreaterThan(0);
  });

  it('currentVersion equals releases[0].version', () => {
    expect(currentVersion).toBe(releases[0].version);
  });

  it('every release has a non-empty version, date, and at least one change', () => {
    for (const release of releases) {
      expect(release.version.trim()).not.toBe('');
      expect(release.date.trim()).not.toBe('');
      expect(release.changes.length).toBeGreaterThan(0);
    }
  });

  it('every change has a valid type and non-empty text', () => {
    const validTypes = new Set(['feature', 'improvement', 'fix']);
    for (const release of releases) {
      for (const change of release.changes) {
        expect(validTypes.has(change.type)).toBe(true);
        expect(change.text.trim()).not.toBe('');
      }
    }
  });

  it('releases are in descending semver order', () => {
    const parseSemver = (v: string) => v.split('.').map(Number);
    const compareSemver = (a: string, b: string): number => {
      const [aMaj, aMin, aPat] = parseSemver(a);
      const [bMaj, bMin, bPat] = parseSemver(b);
      if (aMaj !== bMaj) return aMaj - bMaj;
      if (aMin !== bMin) return aMin - bMin;
      return aPat - bPat;
    };
    const first = releases[0].version;
    const last = releases[releases.length - 1].version;
    expect(compareSemver(first, last)).toBeGreaterThan(0);

    for (let i = 0; i < releases.length - 1; i++) {
      expect(compareSemver(releases[i].version, releases[i + 1].version)).toBeGreaterThan(0);
    }
  });
});

describe('utils', () => {
  describe('generateId', () => {
    it('returns a non-empty string', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('returns a valid UUID format', () => {
      const id = generateId();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(id)).toBe(true);
    });

    it('returns a different value each call', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('sortTodos', () => {
    const base = { text: 'x', createdAt: 0 };

    it('returns a new array (does not mutate the input)', () => {
      const todos = [
        { id: '1', ...base, completed: false },
        { id: '2', ...base, completed: true },
      ];
      const sorted = sortTodos(todos);
      expect(sorted).not.toBe(todos);
    });

    it('places incomplete todos before completed todos', () => {
      const todos = [
        { id: '1', ...base, completed: true },
        { id: '2', ...base, completed: false },
      ];
      const sorted = sortTodos(todos);
      expect(sorted[0].completed).toBe(false);
      expect(sorted[1].completed).toBe(true);
    });

    it('sorts todos with the same completion status by createdAt descending (newest first)', () => {
      const todos = [
        { id: '1', text: 'old', completed: false, createdAt: 1000 },
        { id: '2', text: 'new', completed: false, createdAt: 2000 },
      ];
      const sorted = sortTodos(todos);
      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('1');
    });

    it('returns an empty array when given an empty array', () => {
      expect(sortTodos([])).toEqual([]);
    });
  });
});
