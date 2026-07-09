import React from 'react';
import { FiClock, FiPlus, FiCalendar, FiUsers, FiCheckCircle, FiMoreVertical } from 'react-icons/fi';

const SAMPLE_SPRINTS = [
  { id: 1, name: 'Sprint 24', goal: 'Complete user authentication module', startDate: '2026-07-01', endDate: '2026-07-14', status: 'Active', progress: 65, totalItems: 18, completedItems: 12 },
  { id: 2, name: 'Sprint 23', goal: 'Bug fixes and performance improvements', startDate: '2026-06-17', endDate: '2026-06-30', status: 'Completed', progress: 100, totalItems: 15, completedItems: 15 },
  { id: 3, name: 'Sprint 25', goal: 'Dashboard analytics and reporting', startDate: '2026-07-15', endDate: '2026-07-28', status: 'Planned', progress: 0, totalItems: 12, completedItems: 0 },
];

const STATUS_STYLE = {
  Active: { color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  Completed: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  Planned: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
};

export default function Sprints({ projectId }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.22)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiClock size={19} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', letterSpacing: -0.3 }}>Sprints</h1>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-muted, rgba(148,163,184,0.55))' }}>Manage your sprint cycles</p>
            </div>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <FiPlus size={14} /> New Sprint
          </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px 32px', overflow: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {SAMPLE_SPRINTS.map(sprint => {
            const st = STATUS_STYLE[sprint.status] || STATUS_STYLE.Planned;
            return (
              <div key={sprint.id} style={{ padding: 20, borderRadius: 12, border: '1px solid var(--border-color, rgba(255,255,255,0.06))', background: 'var(--card-bg, rgba(255,255,255,0.02))', cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary, #f1f5f9)' }}>{sprint.name}</h3>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: st.bg, color: st.color }}>{sprint.status}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary, rgba(203,213,225,0.85))' }}>{sprint.goal}</p>
                  </div>
                  <FiMoreVertical size={14} style={{ color: 'var(--text-muted, rgba(148,163,184,0.55))', cursor: 'pointer' }} />
                </div>

                <div style={{ display: 'flex', gap: 24, marginBottom: 14, fontSize: 12, color: 'var(--text-muted, rgba(148,163,184,0.55))' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><FiCalendar size={13} /> {sprint.startDate} — {sprint.endDate}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><FiCheckCircle size={13} /> {sprint.completedItems}/{sprint.totalItems} items</div>
                </div>

                {/* Progress bar */}
                <div style={{ height: 6, borderRadius: 3, background: 'var(--card-hover, rgba(255,255,255,0.04))', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${sprint.progress}%`, borderRadius: 3, background: `linear-gradient(90deg, ${st.color}, ${st.color}cc)`, transition: 'width 0.3s' }} />
                </div>
                <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-muted, rgba(148,163,184,0.55))', marginTop: 4 }}>{sprint.progress}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
