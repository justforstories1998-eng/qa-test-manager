import React, { useState, useEffect, useCallback } from 'react';
import { FiClock, FiPlus, FiCalendar, FiCheckCircle, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import api from '../api';
import { toast } from 'react-toastify';

const STATUS_STYLE = {
  Active: { color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  Completed: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  Planned: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
};

export default function Sprints({ projectId }) {
  const [sprints, setSprints] = useState([]);
  const [workItems, setWorkItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editSprint, setEditSprint] = useState(null);
  const [form, setForm] = useState({ name: '', goal: '', startDate: '', endDate: '', status: 'Planned' });

  const fetchSprints = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [sprintsRes, itemsRes] = await Promise.all([
        api.getSprints(projectId),
        api.getWorkItems(projectId)
      ]);
      if (sprintsRes.success) setSprints(sprintsRes.data);
      if (itemsRes.success) setWorkItems(itemsRes.data);
    } catch { toast.error('Failed to load sprints'); }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchSprints(); }, [fetchSprints]);

  const getSprintStats = (sprint) => {
    const items = workItems.filter(i => i.sprintId === sprint._id);
    const total = items.length;
    const completed = items.filter(i => i.status === 'Done').length;
    return { total, completed, progress: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editSprint) {
        const res = await api.updateSprint(editSprint._id, form);
        if (res.success) { setSprints(prev => prev.map(s => s._id === editSprint._id ? res.data : s)); toast.success('Sprint updated'); }
      } else {
        const res = await api.createSprint({ ...form, projectId });
        if (res.success) { setSprints(prev => [res.data, ...prev]); toast.success('Sprint created'); }
      }
      setShowModal(false); setEditSprint(null); setForm({ name: '', goal: '', startDate: '', endDate: '', status: 'Planned' });
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sprint?')) return;
    try { await api.deleteSprint(id); setSprints(prev => prev.filter(s => s._id !== id)); toast.success('Sprint deleted'); } catch { toast.error('Failed'); }
  };

  const handleStatusChange = async (sprint, newStatus) => {
    try {
      const res = await api.updateSprint(sprint._id, { status: newStatus });
      if (res.success) { setSprints(prev => prev.map(s => s._id === sprint._id ? res.data : s)); toast.success(`Sprint ${newStatus.toLowerCase()}`); }
    } catch { toast.error('Failed'); }
  };

  const openEdit = (sprint) => {
    setEditSprint(sprint);
    setForm({
      name: sprint.name,
      goal: sprint.goal || '',
      startDate: sprint.startDate ? new Date(sprint.startDate).toISOString().split('T')[0] : '',
      endDate: sprint.endDate ? new Date(sprint.endDate).toISOString().split('T')[0] : '',
      status: sprint.status
    });
    setShowModal(true);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.22)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiClock size={19} /></div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', letterSpacing: -0.3 }}>Sprints</h1>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-muted, rgba(148,163,184,0.55))' }}>{sprints.length} sprints</p>
            </div>
          </div>
          <button onClick={() => { setEditSprint(null); setForm({ name: '', goal: '', startDate: '', endDate: '', status: 'Planned' }); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}><FiPlus size={14} /> New Sprint</button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px 32px', overflow: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted, rgba(148,163,184,0.55))' }}>Loading...</div>
        ) : sprints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted, rgba(148,163,184,0.35))', fontSize: 14 }}>No sprints yet. Create your first sprint to get started.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {sprints.map(sprint => {
              const st = STATUS_STYLE[sprint.status] || STATUS_STYLE.Planned;
              const stats = getSprintStats(sprint);
              return (
                <div key={sprint._id} style={{ padding: 20, borderRadius: 12, border: '1px solid var(--border-color, rgba(255,255,255,0.06))', background: 'var(--card-bg, rgba(255,255,255,0.02))', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary, #f1f5f9)' }}>{sprint.name}</h3>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: st.bg, color: st.color }}>{sprint.status}</span>
                      </div>
                      {sprint.goal && <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary, rgba(203,213,225,0.85))' }}>{sprint.goal}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {sprint.status === 'Planned' && <button onClick={() => handleStatusChange(sprint, 'Active')} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'rgba(52,211,153,0.1)', color: '#34d399', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Start</button>}
                      {sprint.status === 'Active' && <button onClick={() => handleStatusChange(sprint, 'Completed')} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'rgba(96,165,250,0.1)', color: '#60a5fa', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Complete</button>}
                      <button onClick={() => openEdit(sprint)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--text-muted, rgba(148,163,184,0.55))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiEdit2 size={13} /></button>
                      <button onClick={() => handleDelete(sprint._id)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiTrash2 size={13} /></button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 24, marginBottom: 14, fontSize: 12, color: 'var(--text-muted, rgba(148,163,184,0.55))' }}>
                    {sprint.startDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><FiCalendar size={13} /> {new Date(sprint.startDate).toLocaleDateString()} — {sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : '...'}</div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><FiCheckCircle size={13} /> {stats.completed}/{stats.total} items</div>
                  </div>

                  <div style={{ height: 6, borderRadius: 3, background: 'var(--card-hover, rgba(255,255,255,0.04))', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${stats.progress}%`, borderRadius: 3, background: `linear-gradient(90deg, ${st.color}, ${st.color}cc)`, transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-muted, rgba(148,163,184,0.55))', marginTop: 4 }}>{stats.progress}%</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: 'var(--surface-elevated, #1e293b)', borderRadius: 16, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', boxShadow: '0 24px 64px rgba(0,0,0,0.4)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>{editSprint ? 'Edit Sprint' : 'New Sprint'}</h3>
              <button onClick={() => setShowModal(false)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'var(--card-hover, rgba(255,255,255,0.04))', color: 'var(--text-muted, rgba(148,163,184,0.55))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiX size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, rgba(203,213,225,0.85))', marginBottom: 5 }}>Sprint Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required autoFocus placeholder="e.g. Sprint 24" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', background: 'var(--input-bg, rgba(255,255,255,0.04))', color: 'var(--text-primary, #f1f5f9)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, rgba(203,213,225,0.85))', marginBottom: 5 }}>Goal</label>
                <input value={form.goal} onChange={e => setForm(p => ({ ...p, goal: e.target.value }))} placeholder="Sprint goal" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', background: 'var(--input-bg, rgba(255,255,255,0.04))', color: 'var(--text-primary, #f1f5f9)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, rgba(203,213,225,0.85))', marginBottom: 5 }}>Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', background: 'var(--input-bg, rgba(255,255,255,0.04))', color: 'var(--text-primary, #f1f5f9)', fontSize: 13, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, rgba(203,213,225,0.85))', marginBottom: 5 }}>End Date</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', background: 'var(--input-bg, rgba(255,255,255,0.04))', color: 'var(--text-primary, #f1f5f9)', fontSize: 13, outline: 'none' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, rgba(203,213,225,0.85))', marginBottom: 5 }}>Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', background: 'var(--input-bg, rgba(255,255,255,0.04))', color: 'var(--text-primary, #f1f5f9)', fontSize: 13, outline: 'none' }}>
                  <option value="Planned">Planned</option><option value="Active">Active</option><option value="Completed">Completed</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', background: 'transparent', color: 'var(--text-secondary, rgba(203,213,225,0.85))', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{editSprint ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
