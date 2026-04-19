import { useState, type FormEvent, type KeyboardEvent } from 'react';

interface Props { onAdd: (text: string) => void; }

export default function AddTodo({ onAdd }: Props) {
  const [text, setText] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(text);
    setText('');
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSubmit(e as unknown as FormEvent);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px',
        background: '#fff', borderRadius: 14,
        boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)',
      }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="8" stroke={text ? '#007AFF' : '#c7c7cc'} strokeWidth="1.5"/>
          <path d="M9 5.5v7M5.5 9h7" stroke={text ? '#007AFF' : '#c7c7cc'} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="New todo…"
          style={{
            flex: 1, border: 'none', outline: 'none',
            fontSize: 15, background: 'transparent', color: '#1c1c1e',
          }}
        />
      </div>
      {text.trim() && (
        <button type="submit" style={{
          width: 46, height: 46, borderRadius: 14, border: 'none',
          background: '#007AFF', color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v12M2 8l6-6 6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </form>
  );
}
