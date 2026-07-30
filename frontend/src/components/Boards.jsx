import React, { useState, useEffect, useCallback } from 'react';
import { FiLayers, FiPlus, FiEdit2, FiTrash2, FiX, FiSettings, FiArrowUp, FiArrowDown, FiHash, FiTarget, FiZap, FiSearch, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import api from '../api';
import { toast } from 'react-toastify';

const DEFAULT_COLUMNS = [
  { id: 'Backlog', title: 'Backlog', color: '#94a3b8', wipLimit: 0 },
  { id: 'To Do', title: 'To Do', color: '#60a5fa', wipLimit: 0 },
  { id: 'In Progress', title: 'In Progress', color: '#fbbf24', wipLimit: 5 },
  { id: 'Review', title: 'Review', color: '#a78bfa', wipLimit: 0 },
  { id: 'Done', title: 'Done', color: '#34d399', wipLimit: 0 },
];

const CARD_FIELD_OPTIONS = [
  { id: 'type', label: 'Type' },
  { id: 'priority', label: 'Priority' },
  { id: 'assignee', label: 'Assignee' },
  { id: 'storyPoints', label: 'Story Points' },
  { id: 'effort', label: 'Effort' },
  { id: 'tags', label: 'Tags' },
  { id: 'description', label: 'Description' },
  { id: 'severity', label: 'Severity' },
  { id: 'activity', label: 'Activity' },
  { id: 'areaPath', label: 'Area Path' },
];

export default function Boards({ projectId }) {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editBoard, setEditBoard] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [configBoard, setConfigBoard] = useState(null);
  const [configColumns, setConfigColumns] = useState([]);
  const [configSwimlanes, setConfigSwimlanes] = useState([]);
  const [configCardFields, setConfigCardFields] = useState([]);
  const [newColTitle, setNewColTitle] = useState('');
  const [configTab, setConfigTab] = useState('columns');

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
        const res = await api.createBoard({ ...form, projectId, columns: DEFAULT_COLUMNS });
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

  const openConfig = (board) => {
    setConfigBoard(board);
    setConfigColumns(board.columns && board.columns.length > 0 ? [...board.columns] : [...DEFAULT_COLUMNS]);
    setConfigSwimlanes(board.swimlanes && board.swimlanes.length > 0 ? [...board.swimlanes] : []);
    setConfigCardFields(board.cardFields || ['type', 'priority', 'assignee', 'storyPoints']);
    setConfigTab('columns');
  };

  const saveConfig = async () => {
    try {
      const res = await api.updateBoard(configBoard._id, {
        columns: configColumns,
        swimlanes: configSwimlanes,
        cardFields: configCardFields,
      });
      if (res.success) {
        setBoards(prev => prev.map(b => b._id === configBoard._id ? res.data : b));
        setConfigBoard(null);
        toast.success('Board configuration saved');
      }
    } catch { toast.error('Failed to save configuration'); }
  };

  const addColumn = () => {
    if (!newColTitle.trim()) return;
    const id = newColTitle.trim().replace(/\s+/g, ' ');
    if (configColumns.some(c => c.id === id)) { toast.warning('Column already exists'); return; }
    setConfigColumns(prev => [...prev, { id, title: id, color: '#94a3b8', wipLimit: 0 }]);
    setNewColTitle('');
  };

  const removeColumn = (idx) => {
    if (configColumns.length <= 2) { toast.warning('Need at least 2 columns'); return; }
    setConfigColumns(prev => prev.filter((_, i) => i !== idx));
  };

  const moveColumn = (idx, dir) => {
    const newCols = [...configColumns];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= newCols.length) return;
    [newCols[idx], newCols[swapIdx]] = [newCols[swapIdx], newCols[idx]];
    setConfigColumns(newCols);
  };

  const updateColumn = (idx, field, value) => {
    setConfigColumns(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const addSwimlane = () => {
    const id = `Swimlane ${configSwimlanes.length + 1}`;
    setConfigSwimlanes(prev => [...prev, { id, title: id, color: '#6366f1' }]);
  };

  const removeSwimlane = (idx) => {
    setConfigSwimlanes(prev => prev.filter((_, i) => i !== idx));
  };

  const toggleCardField = (fieldId) => {
    setConfigCardFields(prev => prev.includes(fieldId) ? prev.filter(f => f !== fieldId) : [...prev, fieldId]);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid var(--border-default)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.22)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiLayers size={19} /></div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.3 }}>Boards</h1>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>{boards.length} boards</p>
            </div>
          </div>
          <button onClick={() => { setEditBoard(null); setForm({ name: '', description: '' }); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}><FiPlus size={14} /> New Board</button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px 32px', overflow: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
        ) : boards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 14 }}>No boards yet. Create your first board to get started.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {boards.map(board => (
              <div key={board._id} style={{ padding: 20, borderRadius: 12, border: '1px solid var(--border-default)', background: 'var(--bg-card)', transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{board.name}</h3>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => openConfig(board)} title="Configure board" style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', color: '#818cf8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiSettings size={13} /></button>
                    <button onClick={() => openEdit(board)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiEdit2 size={13} /></button>
                    <button onClick={() => handleDelete(board._id)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiTrash2 size={13} /></button>
                  </div>
                </div>
                {board.description && <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{board.description}</p>}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {(board.columns || DEFAULT_COLUMNS).map(c => (
                    <span key={c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: `${c.color}18`, border: `1px solid ${c.color}30`, fontSize: 11, fontWeight: 600, color: c.color }}>
                      {c.title || c.id}
                      {c.wipLimit > 0 && <span style={{ fontSize: 9, opacity: 0.7 }}>({c.wipLimit})</span>}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Created {new Date(board.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: 'var(--bg-elevated)', borderRadius: 16, border: '1px solid var(--border-default)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{editBoard ? 'Edit Board' : 'New Board'}</h3>
              <button onClick={() => setShowModal(false)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'var(--bg-card-hover)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiX size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required autoFocus placeholder="Board name" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Optional description" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{editBoard ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {configBoard && (
        <div onClick={() => setConfigBoard(null)} style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 600, maxHeight: '85vh', background: 'var(--bg-elevated)', borderRadius: 16, border: '1px solid var(--border-default)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Configure: {configBoard.name}</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Columns, swimlanes, and card fields</p>
              </div>
              <button onClick={() => setConfigBoard(null)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'var(--bg-card-hover)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiX size={16} /></button>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-default)', flexShrink: 0 }}>
              {['columns', 'swimlanes', 'cards'].map(tab => (
                <button key={tab} onClick={() => setConfigTab(tab)} style={{ flex: 1, padding: '10px 0', border: 'none', borderBottom: configTab === tab ? '2px solid #6366f1' : '2px solid transparent', background: 'transparent', color: configTab === tab ? '#6366f1' : 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>{tab}</button>
              ))}
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
              {configTab === 'columns' && (
                <div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <input value={newColTitle} onChange={e => setNewColTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addColumn()} placeholder="New column name..." style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} />
                    <button onClick={addColumn} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Add</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {configColumns.map((col, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-card)' }}>
                        <div style={{ width: 14, height: 14, borderRadius: 4, background: col.color, cursor: 'pointer', position: 'relative' }} onClick={() => {
                          const colors = ['#94a3b8','#60a5fa','#fbbf24','#a78bfa','#34d399','#f472b6','#f97316','#06b6d4'];
                          const ci = colors.indexOf(col.color);
                          updateColumn(idx, 'color', colors[(ci + 1) % colors.length]);
                        }} title="Click to change color" />
                        <input value={col.title} onChange={e => updateColumn(idx, 'title', e.target.value)} style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} />
                        <input type="number" min="0" value={col.wipLimit} onChange={e => updateColumn(idx, 'wipLimit', parseInt(e.target.value) || 0)} style={{ width: 60, padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', textAlign: 'center' }} title="WIP Limit (0 = no limit)" />
                        <div style={{ display: 'flex', gap: 2 }}>
                          <button onClick={() => moveColumn(idx, -1)} disabled={idx === 0} style={{ width: 24, height: 24, borderRadius: 4, border: 'none', background: 'transparent', color: idx === 0 ? 'var(--border-default)' : 'var(--text-muted)', cursor: idx === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiArrowUp size={12} /></button>
                          <button onClick={() => moveColumn(idx, 1)} disabled={idx === configColumns.length - 1} style={{ width: 24, height: 24, borderRadius: 4, border: 'none', background: 'transparent', color: idx === configColumns.length - 1 ? 'var(--border-default)' : 'var(--text-muted)', cursor: idx === configColumns.length - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiArrowDown size={12} /></button>
                        </div>
                        <button onClick={() => removeColumn(idx)} style={{ width: 24, height: 24, borderRadius: 4, border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiTrash2 size={11} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {configTab === 'swimlanes' && (
                <div>
                  <button onClick={addSwimlane} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px dashed var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}><FiPlus size={13} /> Add Swimlane</button>
                  {configSwimlanes.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No custom swimlanes. The board will auto-detect swimlanes from assignees.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {configSwimlanes.map((lane, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-card)' }}>
                          <div style={{ width: 14, height: 14, borderRadius: 4, background: lane.color }} />
                          <input value={lane.title} onChange={e => setConfigSwimlanes(prev => prev.map((l, i) => i === idx ? { ...l, title: e.target.value } : l))} style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} />
                          <button onClick={() => removeSwimlane(idx)} style={{ width: 24, height: 24, borderRadius: 4, border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiTrash2 size={11} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {configTab === 'cards' && (
                <div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Choose which fields appear on board cards:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {CARD_FIELD_OPTIONS.map(field => (
                      <label key={field.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-default)', background: configCardFields.includes(field.id) ? 'rgba(99,102,241,0.06)' : 'var(--bg-card)', cursor: 'pointer', transition: 'all 0.15s' }}>
                        <input type="checkbox" checked={configCardFields.includes(field.id)} onChange={() => toggleCardField(field.id)} style={{ accentColor: '#6366f1' }} />
                        <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
              <button onClick={() => setConfigBoard(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveConfig} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save Configuration</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
