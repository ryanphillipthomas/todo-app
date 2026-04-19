import type { Todo } from '@todo-app/shared';
import TodoItem from './TodoItem';

interface Props {
  todos: Todo[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TodoList({ todos, onComplete, onDelete }: Props) {
  if (todos.length === 0) {
    return <p style={{ color: '#aaa', fontSize: 15, textAlign: 'center', marginTop: 40 }}>No todos yet. Add one above.</p>;
  }

  return (
    <div>
      {todos.map(todo => (
        <TodoItem key={todo.id} todo={todo} onComplete={onComplete} onDelete={onDelete} />
      ))}
    </div>
  );
}
