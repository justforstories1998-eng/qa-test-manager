import React, { useState, useEffect, useCallback } from 'react';
import { FiLayers, FiPlus, FiUsers, FiClock, FiMoreVertical, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import api from '../api';
import { toast } from 'react-toastify';

export default function Boards({ projectId }) {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editBoard, setEditBoard] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const fetchBoards = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await api.getBoards(projectId);
      if (res.success) setBoards(res.data);
    } catch { toast.error('Failed to load boards'); }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchBoards(); }, [fetchBoards]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      if (editBoard) {
        const res = await api.updateBoard(editBoard._id, form);
        if (res.success) { setBoards(prev => prev.map(b => b._id === editBoard._id ? res.data : b)); toast.success('Board updated'); }
      } else {
        const res = await api.createBoard({ ...form, projectId });
        if (res.success) { setBoards(prev => [res.data, ...prev]); toast.success('Board created'); }
      }
      setShowModal(false); setEditBoard(null); setForm({ name: '', description: '' });
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this board and all its items?')) return;
    try { await api.deleteBoard(id); setBoards(prev => prev.filter(b => b._id !== id)); toast.success('Board deleted'); } catch { toast.error('Failed'); }
  };

  const openEdit = (board) => { setEditBoard(board); setForm({ name: board.name, description: board.description || '' }); setShowModal(true); };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.22)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiLayers size={19} /></div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', letterSpacing: -0.3 }}>Boards</h1>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-muted, rgba(148,163,184,0.55))' }}>{boards.length} boards</p>
            </div>
          </div>
          <button onClick={() => { setEditBoard(null); setForm({ name: '', description: '' }); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}><FiPlus size={14} /> New Board</button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px 32px', overflow: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted, rgba(148,163,184,0.55))' }}>Loading...</div>
        ) : boards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted, rgba(148,163,184,0.35))', fontSize: 14 }}>No boards yet. Create your first board to get started.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {boards.map(board => (
              <div key={board._id} style={{ padding: 20, borderRadius: 12, border: '1px solid var(--border-color, rgba(255,255,255,0.06))', background: 'var(--card-bg, rgba(255,255,255,0.02))', transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary, #f1f5f9)' }}>{board.name}</h3>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => openEdit(board)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--text-muted, rgba(148,163,184,0.55))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiEdit2 size={13} /></button>
                    <button onClick={() => handleDelete(board._id)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiTrash2 size={13} /></button>
                  </div>
                </div>
                {board.description && <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-secondary, rgba(203,213,225,0.85))', lineHeight: 1.5 }}>{board.description}</p>}
                <div style={{ fontSize: 11, color: 'var(--text-muted, rgba(148,163,184,0.55))' }}>
                  Created {new Date(board.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: 'var(--surface-elevated, #1e293b)', borderRadius: 16, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', boxShadow: '0 24px 64px rgba(0,0,0,0.4)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>{editBoard ? 'Edit Board' : 'New Board'}</h3>
              <button onClick={() => setShowModal(false)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'var(--card-hover, rgba(255,255,255,0.04))', color: 'var(--text-muted, rgba(148,163,184,0.55))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiX size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, rgba(203,213,225,0.85))', marginBottom: 5 }}>Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required autoFocus placeholder="Board name" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', background: 'var(--input-bg, rgba(255,255,255,0.04))', color: 'var(--text-primary, #f1f5f9)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, rgba(203,213,225,0.85))', marginBottom: 5 }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Optional description" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', background: 'var(--input-bg, rgba(255,255,255,0.04))', color: 'var(--text-primary, #f1f5f9)', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', background: 'transparent', color: 'var(--text-secondary, rgba(203,213,225,0.85))', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{editBoard ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
