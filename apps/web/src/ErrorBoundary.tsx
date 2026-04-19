import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: '#842029', marginBottom: 12 }}>Something went wrong.</p>
          <button onClick={() => this.setState({ error: null })} style={{ cursor: 'pointer' }}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
