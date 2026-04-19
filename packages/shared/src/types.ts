export type TodoId = string;

export interface Todo {
  id: TodoId;
  text: string;
  completed: boolean;
  createdAt: number;
}
