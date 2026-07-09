import React, { useState } from 'react';
import { FiClipboard, FiPlus, FiSearch, FiFilter, FiEdit2, FiTrash2, FiMoreVertical } from 'react-icons/fi';

const SAMPLE_WORK_ITEMS = [
  { id: 'WI-001', title: 'User authentication flow', type: 'Feature', priority: 'High', status: 'In Progress', assignee: 'John D.', created: '2026-07-01' },
  { id: 'WI-002', title: 'Fix login timeout bug', type: 'Bug', priority: 'Critical', status: 'To Do', assignee: 'Sarah M.', created: '2026-07-03' },
  { id: 'WI-003', title: 'API documentation update', type: 'Task', priority: 'Medium', status: 'Done', assignee: 'Mike R.', created: '2026-06-28' },
  { id: 'WI-004', title: 'Dashboard performance optimization', type: 'Feature', priority: 'High', status: 'In Progress', assignee: 'Lisa K.', created: '2026-07-05' },
  { id: 'WI-005', title: 'Mobile responsive design', type: 'Feature', priority: 'Medium', status: 'To Do', assignee: 'Tom W.', created: '2026-07-07' },
];

const TYPE_COLORS = { Feature: '#6366f1', Bug: '#ef4444', Task: '#f59e0b', Epic: '#8b5cf6' };
const STATUS_COLORS = { 'To Do': '#60a5fa', 'In Progress': '#fbbf24', 'Done': '#34d399' };

export default function WorkItems({ projectId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const filtered = SAMPLE_WORK_ITEMS.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.22)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiClipboard size={19} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', letterSpacing: -0.3 }}>Work Items</h1>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-muted, rgba(148,163,184,0.55))' }}>Manage your work items and tasks</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, rgba(148,163,184,0.55))' }} />
              <input placeholder="Search work items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: '8px 12px 8px 34px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.06))', background: 'var(--card-bg, rgba(255,255,255,0.02))', color: 'var(--text-primary, #f1f5f9)', fontSize: 13, outline: 'none', width: 220 }} />
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <FiPlus size={14} /> New Work Item
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px 32px', overflow: 'auto' }}>
        <div style={{ background: 'var(--card-bg, rgba(255,255,255,0.02))', border: '1px solid var(--border-color, rgba(255,255,255,0.06))', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))' }}>
                {['ID', 'Title', 'Type', 'Priority', 'Status', 'Assignee', 'Created', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted, rgba(148,163,184,0.55))', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))', cursor: 'pointer', transition: 'background 0.15s' }}>
                  <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#818cf8' }}>{item.id}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary, #f1f5f9)' }}>{item.title}</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 5, background: `${TYPE_COLORS[item.type] || '#6b7280'}15`, color: TYPE_COLORS[item.type] || '#6b7280' }}>{item.type}</span></td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary, rgba(203,213,225,0.85))' }}>{item.priority}</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 5, background: `${STATUS_COLORS[item.status] || '#6b7280'}15`, color: STATUS_COLORS[item.status] || '#6b7280' }}>{item.status}</span></td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary, rgba(203,213,225,0.85))' }}>{item.assignee}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted, rgba(148,163,184,0.55))' }}>{item.created}</td>
                  <td style={{ padding: '12px 16px' }}><FiMoreVertical size={14} style={{ color: 'var(--text-muted, rgba(148,163,184,0.55))', cursor: 'pointer' }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
