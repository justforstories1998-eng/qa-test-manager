import React, { useState } from 'react';
import { FiList, FiPlus, FiSearch, FiArrowUp, FiArrowDown, FiMinus, FiMoreVertical } from 'react-icons/fi';

const SAMPLE_BACKLOGS = [
  { id: 'BL-001', title: 'Implement SSO integration', priority: 'High', storyPoints: 8, status: 'New', assignee: 'Unassigned' },
  { id: 'BL-002', title: 'Email notification system', priority: 'Medium', storyPoints: 5, status: 'New', assignee: 'Sarah M.' },
  { id: 'BL-003', title: 'Data export to CSV', priority: 'Low', storyPoints: 3, status: 'Refined', assignee: 'John D.' },
  { id: 'BL-004', title: 'Performance monitoring dashboard', priority: 'High', storyPoints: 13, status: 'New', assignee: 'Unassigned' },
  { id: 'BL-005', title: 'Automated regression tests', priority: 'Critical', storyPoints: 8, status: 'Refined', assignee: 'Lisa K.' },
];

const PRIORITY_ICON = { Critical: <FiArrowUp size={12} />, High: <FiArrowUp size={12} />, Medium: <FiMinus size={12} />, Low: <FiArrowDown size={12} /> };
const PRIORITY_COLOR = { Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#6b7280' };

export default function Backlogs({ projectId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const filtered = SAMPLE_BACKLOGS.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.22)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiList size={19} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', letterSpacing: -0.3 }}>Backlogs</h1>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-muted, rgba(148,163,184,0.55))' }}>Manage your product backlog</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, rgba(148,163,184,0.55))' }} />
              <input placeholder="Search backlog..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: '8px 12px 8px 34px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.06))', background: 'var(--card-bg, rgba(255,255,255,0.02))', color: 'var(--text-primary, #f1f5f9)', fontSize: 13, outline: 'none', width: 220 }} />
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <FiPlus size={14} /> Add Item
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px 32px', overflow: 'auto' }}>
        <div style={{ background: 'var(--card-bg, rgba(255,255,255,0.02))', border: '1px solid var(--border-color, rgba(255,255,255,0.06))', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))' }}>
                {['ID', 'Title', 'Priority', 'Story Points', 'Status', 'Assignee', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted, rgba(148,163,184,0.55))', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))', cursor: 'pointer' }}>
                  <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#818cf8' }}>{item.id}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary, #f1f5f9)' }}>{item.title}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: PRIORITY_COLOR[item.priority] }}>
                      {PRIORITY_ICON[item.priority]}
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{item.priority}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>{item.storyPoints}</span></td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary, rgba(203,213,225,0.85))' }}>{item.status}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary, rgba(203,213,225,0.85))' }}>{item.assignee}</td>
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
