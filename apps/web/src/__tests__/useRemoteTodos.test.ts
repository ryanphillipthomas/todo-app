import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRemoteTodos } from '../useRemoteTodos';

const mockSend = vi.fn();
const mockClose = vi.fn();
let wsOnMessage: ((e: MessageEvent) => void) | null = null;

class MockWebSocket {
  static OPEN = 1;
  readyState = 1;
  onopen: (() => void) | null = null;
  onmessage: ((e: MessageEvent) => void) | null = null;
  send = mockSend;
  close = mockClose;
  constructor() {
    wsOnMessage = (e) => this.onmessage?.(e);
    setTimeout(() => this.onopen?.(), 0);
  }
}

vi.stubGlobal('WebSocket', MockWebSocket);

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const FAKE_TOKEN = 'fake-token';

function sendWsUpdate(todos: unknown[]) {
  wsOnMessage?.({ data: JSON.stringify(todos) } as MessageEvent);
}

beforeEach(() => {
  mockFetch.mockResolvedValue({ ok: true });
  mockSend.mockClear();
  mockClose.mockClear();
});

afterEach(() => vi.clearAllMocks());

describe('useRemoteTodos', () => {
  it('starts with empty todos', () => {
    const { result } = renderHook(() => useRemoteTodos(FAKE_TOKEN));
    expect(result.current.todos).toEqual([]);
  });

  it('updates todos from WebSocket message', async () => {
    const { result } = renderHook(() => useRemoteTodos(FAKE_TOKEN));
    const todos = [{ id: '1', text: 'Buy milk', completed: false, createdAt: Date.now() }];
    act(() => sendWsUpdate(todos));
    expect(result.current.todos).toEqual(todos);
  });

  it('calls POST on addTodo', async () => {
    const { result } = renderHook(() => useRemoteTodos(FAKE_TOKEN));
    await act(() => result.current.addTodo('Walk dog'));
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/todos', expect.objectContaining({ method: 'POST' }));
  });

  it('calls PATCH on completeTodo', async () => {
    const { result } = renderHook(() => useRemoteTodos(FAKE_TOKEN));
    await act(() => result.current.completeTodo('abc-123'));
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/todos/abc-123', expect.objectContaining({ method: 'PATCH' }));
  });

  it('calls DELETE on deleteTodo', async () => {
    const { result } = renderHook(() => useRemoteTodos(FAKE_TOKEN));
    await act(() => result.current.deleteTodo('abc-123'));
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/todos/abc-123', expect.objectContaining({ method: 'DELETE' }));
  });

  it('status starts as connecting', () => {
    const { result } = renderHook(() => useRemoteTodos(FAKE_TOKEN));
    expect(result.current.status).toBe('connecting');
  });

  it('status becomes connected after WebSocket opens', async () => {
    const { result } = renderHook(() => useRemoteTodos(FAKE_TOKEN));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(result.current.status).toBe('connected');
  });

  it('addTodo with empty string does NOT call fetch', async () => {
    const { result } = renderHook(() => useRemoteTodos(FAKE_TOKEN));
    await act(() => result.current.addTodo(''));
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('addTodo with blank/whitespace string does NOT call fetch', async () => {
    const { result } = renderHook(() => useRemoteTodos(FAKE_TOKEN));
    await act(() => result.current.addTodo('   '));
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('error is null initially', () => {
    const { result } = renderHook(() => useRemoteTodos(FAKE_TOKEN));
    expect(result.current.error).toBeNull();
  });

  it('sets error to a non-null string when fetch returns ok: false', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    const { result } = renderHook(() => useRemoteTodos(FAKE_TOKEN));
    await act(() => result.current.addTodo('Buy milk'));
    expect(result.current.error).not.toBeNull();
    expect(typeof result.current.error).toBe('string');
  });

  it('does not create a WebSocket when token is null', () => {
    const wsConstructorSpy = vi.spyOn(globalThis, 'WebSocket');
    renderHook(() => useRemoteTodos(null));
    expect(wsConstructorSpy).not.toHaveBeenCalled();
    wsConstructorSpy.mockRestore();
  });
});
