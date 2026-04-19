import type { Todo } from '@todo-app/shared';

interface Props {
  todo: Todo;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TodoItem({ todo, onComplete, onDelete }: Props) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '13px 16px',
      background: '#fff', borderRadius: 14,
      marginBottom: 8,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)',
      transition: 'opacity 0.15s',
      opacity: todo.completed ? 0.6 : 1,
    }}>
      <button
        onClick={() => onComplete(todo.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0 }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          {todo.completed ? (
            <>
              <circle cx="11" cy="11" r="10" fill="#007AFF"/>
              <path d="M7 11l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </>
          ) : (
            <circle cx="11" cy="11" r="10" stroke="#c7c7cc" strokeWidth="1.5"/>
          )}
        </svg>
      </button>

      <span style={{
        flex: 1, fontSize: 15, lineHeight: 1.4,
        color: todo.completed ? '#8e8e93' : '#1c1c1e',
        textDecoration: todo.completed ? 'line-through' : 'none',
      }}>
        {todo.text}
      </span>

      <button
        onClick={() => onDelete(todo.id)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#c7c7cc', fontSize: 18, lineHeight: 1,
          padding: '4px 6px', borderRadius: 6, flexShrink: 0,
          transition: 'color 0.1s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#8e8e93')}
        onMouseLeave={e => (e.currentTarget.style.color = '#c7c7cc')}
      >
        ×
      </button>
    </div>
  );
}
