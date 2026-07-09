import React, { useState, useEffect, useCallback } from 'react';
import { FiClipboard, FiPlus, FiSearch, FiEdit2, FiTrash2, FiMoreVertical, FiX } from 'react-icons/fi';
import api from '../api';
import { toast } from 'react-toastify';

const TYPE_COLORS = { Feature: '#6366f1', Bug: '#ef4444', Task: '#f59e0b', Epic: '#8b5cf6' };
const STATUS_COLORS = { 'Backlog': '#94a3b8', 'To Do': '#60a5fa', 'In Progress': '#fbbf24', 'Review': '#a78bfa', 'Done': '#34d399' };
const PRIORITY_COLORS = { Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#6b7280' };

export default function WorkItems({ projectId }) {
  const [workItems, setWorkItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ title: '', type: 'Task', priority: 'Medium', status: 'Backlog', assignee: '', storyPoints: 0, description: '' });

  const fetchItems = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await api.getWorkItems(projectId);
      if (res.success) setWorkItems(res.data);
    } catch { toast.error('Failed to load work items'); }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = workItems.filter(i => {
    const matchSearch = i.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'All' || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCreate = () => { setEditItem(null); setForm({ title: '', type: 'Task', priority: 'Medium', status: 'Backlog', assignee: '', storyPoints: 0, description: '' }); setShowModal(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ title: item.title, type: item.type, priority: item.priority, status: item.status, assignee: item.assignee || '', storyPoints: item.storyPoints || 0, description: item.description || '' }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        const res = await api.updateWorkItem(editItem._id, form);
        if (res.success) { setWorkItems(prev => prev.map(i => i._id === editItem._id ? res.data : i)); toast.success('Updated'); }
      } else {
        const res = await api.createWorkItem({ ...form, projectId, order: workItems.length });
        if (res.success) { setWorkItems(prev => [res.data, ...prev]); toast.success('Created'); }
      }
      setShowModal(false);
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this work item?')) return;
    try { await api.deleteWorkItem(id); setWorkItems(prev => prev.filter(i => i._id !== id)); toast.success('Deleted'); } catch { toast.error('Failed'); }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.22)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiClipboard size={19} /></div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', letterSpacing: -0.3 }}>Work Items</h1>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-muted, rgba(148,163,184,0.55))' }}>{workItems.length} items total</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.06))', background: 'var(--card-bg, rgba(255,255,255,0.02))', color: 'var(--text-primary, #f1f5f9)', fontSize: 13, outline: 'none' }}>
              <option value="All">All Status</option>
              {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div style={{ position: 'relative' }}>
              <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, rgba(148,163,184,0.55))' }} />
              <input placeholder="Search work items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: '8px 12px 8px 34px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.06))', background: 'var(--card-bg, rgba(255,255,255,0.02))', color: 'var(--text-primary, #f1f5f9)', fontSize: 13, outline: 'none', width: 200 }} />
            </div>
            <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}><FiPlus size={14} /> New Work Item</button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px 32px', overflow: 'auto' }}>
        <div style={{ background: 'var(--card-bg, rgba(255,255,255,0.02))', border: '1px solid var(--border-color, rgba(255,255,255,0.06))', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))' }}>
                {['Title', 'Type', 'Priority', 'Status', 'Assignee', 'Points', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted, rgba(148,163,184,0.55))', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted, rgba(148,163,184,0.55))', fontSize: 13 }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted, rgba(148,163,184,0.55))', fontSize: 13 }}>No work items found</td></tr>
              ) : filtered.map(item => (
                <tr key={item._id} style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))' }}>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary, #f1f5f9)' }}>{item.title}</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 5, background: `${TYPE_COLORS[item.type] || '#6b7280'}15`, color: TYPE_COLORS[item.type] || '#6b7280' }}>{item.type}</span></td>
                  <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 500, color: PRIORITY_COLORS[item.priority] || '#6b7280' }}>{item.priority}</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 5, background: `${STATUS_COLORS[item.status] || '#6b7280'}15`, color: STATUS_COLORS[item.status] || '#6b7280' }}>{item.status}</span></td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary, rgba(203,213,225,0.85))' }}>{item.assignee || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary, rgba(203,213,225,0.85))' }}>{item.storyPoints || 0}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => openEdit(item)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--text-muted, rgba(148,163,184,0.55))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiEdit2 size={13} /></button>
                      <button onClick={() => handleDelete(item._id)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiTrash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: 'var(--surface-elevated, #1e293b)', borderRadius: 16, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', boxShadow: '0 24px 64px rgba(0,0,0,0.4)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>{editItem ? 'Edit Work Item' : 'New Work Item'}</h3>
              <button onClick={() => setShowModal(false)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'var(--card-hover, rgba(255,255,255,0.04))', color: 'var(--text-muted, rgba(148,163,184,0.55))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiX size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, rgba(203,213,225,0.85))', marginBottom: 5 }}>Title *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required autoFocus style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', background: 'var(--input-bg, rgba(255,255,255,0.04))', color: 'var(--text-primary, #f1f5f9)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, rgba(203,213,225,0.85))', marginBottom: 5 }}>Type</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', background: 'var(--input-bg, rgba(255,255,255,0.04))', color: 'var(--text-primary, #f1f5f9)', fontSize: 13, outline: 'none' }}>
                    <option value="Feature">Feature</option><option value="Bug">Bug</option><option value="Task">Task</option><option value="Epic">Epic</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, rgba(203,213,225,0.85))', marginBottom: 5 }}>Priority</label>
                  <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', background: 'var(--input-bg, rgba(255,255,255,0.04))', color: 'var(--text-primary, #f1f5f9)', fontSize: 13, outline: 'none' }}>
                    <option value="Critical">Critical</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, rgba(203,213,225,0.85))', marginBottom: 5 }}>Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', background: 'var(--input-bg, rgba(255,255,255,0.04))', color: 'var(--text-primary, #f1f5f9)', fontSize: 13, outline: 'none' }}>
                    {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, rgba(203,213,225,0.85))', marginBottom: 5 }}>Story Points</label>
                  <input type="number" min="0" value={form.storyPoints} onChange={e => setForm(p => ({ ...p, storyPoints: parseInt(e.target.value) || 0 }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', background: 'var(--input-bg, rgba(255,255,255,0.04))', color: 'var(--text-primary, #f1f5f9)', fontSize: 13, outline: 'none' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, rgba(203,213,225,0.85))', marginBottom: 5 }}>Assignee</label>
                <input value={form.assignee} onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))} placeholder="Assignee name" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', background: 'var(--input-bg, rgba(255,255,255,0.04))', color: 'var(--text-primary, #f1f5f9)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, rgba(203,213,225,0.85))', marginBottom: 5 }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', background: 'var(--input-bg, rgba(255,255,255,0.04))', color: 'var(--text-primary, #f1f5f9)', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', background: 'transparent', color: 'var(--text-secondary, rgba(203,213,225,0.85))', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{editItem ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
