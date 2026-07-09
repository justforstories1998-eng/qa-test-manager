import React, { useState } from 'react';
import { FiTrello, FiPlus, FiSearch, FiFilter, FiMoreVertical } from 'react-icons/fi';

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: '#94a3b8' },
  { id: 'todo', title: 'To Do', color: '#60a5fa' },
  { id: 'in-progress', title: 'In Progress', color: '#fbbf24' },
  { id: 'review', title: 'Review', color: '#a78bfa' },
  { id: 'done', title: 'Done', color: '#34d399' },
];

const SAMPLE_ITEMS = [
  { id: 1, title: 'Login page redesign', priority: 'High', assignee: 'John D.', column: 'in-progress', tags: ['UI', 'Frontend'] },
  { id: 2, title: 'API rate limiting', priority: 'Critical', assignee: 'Sarah M.', column: 'todo', tags: ['Backend'] },
  { id: 3, title: 'Dashboard analytics', priority: 'Medium', assignee: 'Mike R.', column: 'backlog', tags: ['Feature'] },
  { id: 4, title: 'Unit tests for auth', priority: 'High', assignee: 'Lisa K.', column: 'review', tags: ['Testing'] },
  { id: 5, title: 'Database migration', priority: 'Low', assignee: 'Tom W.', column: 'done', tags: ['Backend'] },
  { id: 6, title: 'Mobile responsive fixes', priority: 'Medium', assignee: 'John D.', column: 'todo', tags: ['UI', 'Frontend'] },
];

const PRIORITY_COLORS = {
  Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#6b7280',
};

export default function Board() {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = SAMPLE_ITEMS.filter(i =>
    i.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.22)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiTrello size={19} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', letterSpacing: -0.3 }}>Board</h1>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-muted, rgba(148,163,184,0.55))' }}>Kanban view of your work items</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, rgba(148,163,184,0.55))' }} />
              <input
                placeholder="Search items..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ padding: '8px 12px 8px 34px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.06))', background: 'var(--card-bg, rgba(255,255,255,0.02))', color: 'var(--text-primary, #f1f5f9)', fontSize: 13, outline: 'none', width: 200 }}
              />
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <FiPlus size={14} /> Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Board columns */}
      <div style={{ flex: 1, display: 'flex', gap: 16, padding: '20px 32px', overflowX: 'auto', overflowY: 'hidden' }}>
        {COLUMNS.map(col => {
          const items = filtered.filter(i => i.column === col.id);
          return (
            <div key={col.id} style={{ minWidth: 280, maxWidth: 320, flex: '1 1 0', display: 'flex', flexDirection: 'column', background: 'var(--card-bg, rgba(255,255,255,0.02))', border: '1px solid var(--border-color, rgba(255,255,255,0.06))', borderRadius: 12, overflow: 'hidden' }}>
              {/* Column header */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #f1f5f9)' }}>{col.title}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted, rgba(148,163,184,0.55))', background: 'var(--card-hover, rgba(255,255,255,0.04))', padding: '2px 7px', borderRadius: 4 }}>{items.length}</span>
                </div>
                <FiMoreVertical size={14} style={{ color: 'var(--text-muted, rgba(148,163,184,0.55))', cursor: 'pointer' }} />
              </div>

              {/* Items */}
              <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
                {items.map(item => (
                  <div key={item.id} style={{ padding: 14, borderRadius: 10, border: '1px solid var(--border-color, rgba(255,255,255,0.06))', background: 'var(--card-bg, rgba(255,255,255,0.02))', cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: PRIORITY_COLORS[item.priority] || '#6b7280', padding: '2px 8px', borderRadius: 4, background: `${PRIORITY_COLORS[item.priority] || '#6b7280'}15` }}>{item.priority}</span>
                    </div>
                    <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary, #f1f5f9)', lineHeight: 1.4 }}>{item.title}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {item.tags.map(tag => (
                          <span key={tag} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontWeight: 500 }}>{tag}</span>
                        ))}
                      </div>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 600 }}>
                        {item.assignee.split(' ').map(n => n[0]).join('')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
