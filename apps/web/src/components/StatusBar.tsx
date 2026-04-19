import type { ConnectionStatus } from '../useRemoteTodos';

export default function StatusBar({ status, error }: { status: ConnectionStatus; error: string | null }) {
  if (status === 'connected' && !error) return null;

  const isError = status === 'disconnected' || !!error;
  return (
    <div style={{
      padding: '9px 14px', borderRadius: 10, marginBottom: 12,
      fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
      background: isError ? '#fff2f2' : '#fff9e6',
      color: isError ? '#c0392b' : '#856404',
      border: `1px solid ${isError ? '#ffd5d5' : '#ffeaa0'}`,
    }}>
      <span>{isError ? '⚠' : '⏳'}</span>
      <span>{error ?? (status === 'disconnected' ? 'Reconnecting…' : 'Connecting…')}</span>
    </div>
  );
}
