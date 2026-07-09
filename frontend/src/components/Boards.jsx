import React from 'react';
import { FiLayers, FiPlus, FiUsers, FiClock, FiMoreVertical } from 'react-icons/fi';

const SAMPLE_BOARDS = [
  { id: 1, name: 'Sprint Board', description: 'Main sprint backlog board', members: 5, items: 24, active: true },
  { id: 2, name: 'Bug Tracker', description: 'Track and resolve bugs', members: 3, items: 12, active: true },
  { id: 3, name: 'Feature Requests', description: 'Product feature backlog', members: 8, items: 31, active: false },
];

export default function Boards({ projectId }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.22)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiLayers size={19} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', letterSpacing: -0.3 }}>Boards</h1>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-muted, rgba(148,163,184,0.55))' }}>Manage your project boards</p>
            </div>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <FiPlus size={14} /> New Board
          </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px 32px', overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {SAMPLE_BOARDS.map(board => (
            <div key={board.id} style={{ padding: 20, borderRadius: 12, border: '1px solid var(--border-color, rgba(255,255,255,0.06))', background: 'var(--card-bg, rgba(255,255,255,0.02))', cursor: 'pointer', transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary, #f1f5f9)' }}>{board.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {board.active && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />}
                  <FiMoreVertical size={14} style={{ color: 'var(--text-muted, rgba(148,163,184,0.55))', cursor: 'pointer' }} />
                </div>
              </div>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-secondary, rgba(203,213,225,0.85))', lineHeight: 1.5 }}>{board.description}</p>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted, rgba(148,163,184,0.55))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><FiUsers size={13} /> {board.members} members</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><FiClock size={13} /> {board.items} items</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
