import { useState, useEffect } from 'react';
import { releases, currentVersion, typeLabel, type Release } from '@todo-app/shared';

const SEEN_KEY = 'whats_new_seen_version';

const tagColor: Record<string, string> = {
  New: '#1a1a1a',
  Improved: '#2563eb',
  Fixed: '#16a34a',
};

function ReleaseSection({ release }: { release: Release }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>v{release.version}</span>
        <span style={{ fontSize: 12, color: '#999' }}>{release.date}</span>
      </div>
      {release.changes.map((c, i) => {
        const label = typeLabel[c.type];
        return (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 600, color: '#fff',
              background: tagColor[label] ?? '#888',
              padding: '2px 7px', borderRadius: 4, whiteSpace: 'nowrap', marginTop: 1,
            }}>
              {label}
            </span>
            <span style={{ fontSize: 14, color: '#333', lineHeight: 1.5 }}>{c.text}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function WhatsNew() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(SEEN_KEY);
    if (seen !== currentVersion) setOpen(true);
  }, []);

  function dismiss() {
    localStorage.setItem(SEEN_KEY, currentVersion);
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="What's new"
        style={{
          background: 'none', border: '1.5px solid #ddd', borderRadius: 8,
          padding: '6px 14px', cursor: 'pointer', fontSize: 13, color: '#666',
        }}
      >
        What's new
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }} onClick={dismiss}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 28, width: 420,
            maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>What's New</h2>
              <button onClick={dismiss} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999' }}>×</button>
            </div>
            {releases.map(r => <ReleaseSection key={r.version} release={r} />)}
          </div>
        </div>
      )}
    </>
  );
}
