import React, { useState, useEffect, useCallback } from 'react';
import { FiTrello, FiPlus, FiSearch, FiTrash2, FiEdit2, FiX, FiArrowRight, FiArrowLeft, FiArrowUp, FiArrowDown, FiMinus } from 'react-icons/fi';
import api from '../api';
import { toast } from 'react-toastify';

const COLUMNS = [
  { id: 'Backlog', title: 'Backlog', color: '#94a3b8' },
  { id: 'To Do', title: 'To Do', color: '#60a5fa' },
  { id: 'In Progress', title: 'In Progress', color: '#fbbf24' },
  { id: 'Review', title: 'Review', color: '#a78bfa' },
  { id: 'Done', title: 'Done', color: '#34d399' },
];

const COL_INDEX = {};
COLUMNS.forEach((c, i) => { COL_INDEX[c.id] = i; });

const TYPE_COLORS = { Feature: '#6366f1', Bug: '#ef4444', Task: '#f59e0b', Epic: '#8b5cf6' };
const PRIORITY_COLORS = { Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#6b7280' };

export default function Board({ projectId }) {
  const [workItems, setWorkItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [newItem, setNewItem] = useState({ title: '', type: 'Task', priority: 'Medium', assignee: '', storyPoints: 0, description: '' });

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

  const filtered = workItems.filter(i =>
    i.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const itemsByColumn = {};
  COLUMNS.forEach(c => { itemsByColumn[c.id] = filtered.filter(i => i.status === c.id).sort((a, b) => a.order - b.order); });

  const moveItem = async (itemId, newStatus) => {
    const item = workItems.find(i => i._id === itemId);
    if (!item || item.status === newStatus) return;

    const targetItems = itemsByColumn[newStatus] || [];
    const newOrder = targetItems.length;

    setWorkItems(prev => prev.map(i =>
      i._id === itemId ? { ...i, status: newStatus, order: newOrder } : i
    ));

    try {
      await api.updateWorkItem(itemId, { status: newStatus, order: newOrder });
      toast.success(`Moved to ${newStatus}`);
    } catch {
      fetchItems();
      toast.error('Failed to move item');
    }
  };

  const handleDragStart = (e, item) => {
    setDraggedItemId(item._id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item._id);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => { setDragOverColumn(null); };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const itemId = e.dataTransfer.getData('text/plain');
    if (!itemId) return;
    await moveItem(itemId, targetStatus);
    setDraggedItemId(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newItem.title.trim()) return;
    try {
      const res = await api.createWorkItem({ ...newItem, projectId, status: 'Backlog', order: (itemsByColumn['Backlog'] || []).length });
      if (res.success) {
        setWorkItems(prev => [res.data, ...prev]);
        setShowAddModal(false);
        setNewItem({ title: '', type: 'Task', priority: 'Medium', assignee: '', storyPoints: 0, description: '' });
        toast.success('Work item created');
      }
    } catch { toast.error('Failed to create work item'); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.updateWorkItem(showEditModal._id, newItem);
      if (res.success) {
        setWorkItems(prev => prev.map(i => i._id === showEditModal._id ? res.data : i));
        setShowEditModal(null);
        toast.success('Work item updated');
      }
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this work item?')) return;
    try {
      await api.deleteWorkItem(id);
      setWorkItems(prev => prev.filter(i => i._id !== id));
      toast.success('Work item deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const openEdit = (item) => {
    setNewItem({ title: item.title, type: item.type, priority: item.priority, assignee: item.assignee || '', storyPoints: item.storyPoints || 0, description: item.description || '' });
    setShowEditModal(item);
  };

  const itemForm = (
    <form onSubmit={showEditModal ? handleUpdate : handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={labelStyle}>Title *</label>
        <input value={newItem.title} onChange={e => setNewItem(p => ({ ...p, title: e.target.value }))} placeholder="Work item title" required autoFocus style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Type</label>
          <select value={newItem.type} onChange={e => setNewItem(p => ({ ...p, type: e.target.value }))} style={selectStyle}>
            <option value="Feature">Feature</option><option value="Bug">Bug</option><option value="Task">Task</option><option value="Epic">Epic</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Priority</label>
          <select value={newItem.priority} onChange={e => setNewItem(p => ({ ...p, priority: e.target.value }))} style={selectStyle}>
            <option value="Critical">Critical</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Assignee</label>
          <input value={newItem.assignee} onChange={e => setNewItem(p => ({ ...p, assignee: e.target.value }))} placeholder="Assignee name" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Story Points</label>
          <input type="number" min="0" value={newItem.storyPoints} onChange={e => setNewItem(p => ({ ...p, storyPoints: parseInt(e.target.value) || 0 }))} style={inputStyle} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Description</label>
        <textarea value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} placeholder="Optional description..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(null); }} style={cancelBtnStyle}>Cancel</button>
        <button type="submit" style={primaryBtnStyle}>{showEditModal ? 'Update' : 'Create'}</button>
      </div>
    </form>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.22)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiTrello size={19} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', letterSpacing: -0.3 }}>Board</h1>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-muted, rgba(148,163,184,0.55))' }}>{workItems.length} items &middot; Drag or use arrows to move</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, rgba(148,163,184,0.55))' }} />
              <input placeholder="Search items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: '8px 12px 8px 34px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.06))', background: 'var(--card-bg, rgba(255,255,255,0.02))', color: 'var(--text-primary, #f1f5f9)', fontSize: 13, outline: 'none', width: 200 }} />
            </div>
            <button onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <FiPlus size={14} /> Add Item
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: 16, padding: '20px 32px', overflowX: 'auto', overflowY: 'hidden' }}>
        {COLUMNS.map(col => {
          const items = itemsByColumn[col.id] || [];
          const isOver = dragOverColumn === col.id;
          const colIdx = COL_INDEX[col.id];
          const canMoveBack = colIdx > 0;
          const canMoveForward = colIdx < COLUMNS.length - 1;
          const prevStatus = canMoveBack ? COLUMNS[colIdx - 1].id : null;
          const nextStatus = canMoveForward ? COLUMNS[colIdx + 1].id : null;

          return (
            <div key={col.id} onDragOver={e => handleDragOver(e, col.id)} onDragLeave={handleDragLeave} onDrop={e => handleDrop(e, col.id)} style={{ minWidth: 290, maxWidth: 330, flex: '1 1 0', display: 'flex', flexDirection: 'column', background: isOver ? 'rgba(99,102,241,0.06)' : 'var(--card-bg, rgba(255,255,255,0.02))', border: isOver ? '2px dashed rgba(99,102,241,0.5)' : '1px solid var(--border-color, rgba(255,255,255,0.06))', borderRadius: 12, overflow: 'hidden', transition: 'all 0.2s ease' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #f1f5f9)' }}>{col.title}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted, rgba(148,163,184,0.55))', background: 'var(--card-hover, rgba(255,255,255,0.04))', padding: '2px 7px', borderRadius: 4 }}>{items.length}</span>
                </div>
              </div>
              <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', minHeight: 100 }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted, rgba(148,163,184,0.55))', fontSize: 12 }}>Loading...</div>
                ) : items.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted, rgba(148,163,184,0.35))', fontSize: 12, fontStyle: 'italic' }}>Drop items here</div>
                ) : items.map(item => (
                  <div key={item._id} draggable="true" onDragStart={e => handleDragStart(e, item)} onDragEnd={handleDragEnd} style={{ padding: 14, borderRadius: 10, border: '1px solid var(--border-color, rgba(255,255,255,0.06))', background: draggedItemId === item._id ? 'rgba(99,102,241,0.1)' : 'var(--card-bg, rgba(255,255,255,0.02))', cursor: 'grab', transition: 'all 0.15s', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: TYPE_COLORS[item.type] || '#6b7280', padding: '2px 8px', borderRadius: 4, background: `${TYPE_COLORS[item.type] || '#6b7280'}15` }}>{item.type}</span>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {canMoveBack && (
                          <button onClick={(e) => { e.stopPropagation(); moveItem(item._id, prevStatus); }} title={`Move to ${prevStatus}`} style={arrowBtnStyle}>
                            <FiArrowLeft size={11} />
                          </button>
                        )}
                        {canMoveForward && (
                          <button onClick={(e) => { e.stopPropagation(); moveItem(item._id, nextStatus); }} title={`Move to ${nextStatus}`} style={arrowBtnStyle}>
                            <FiArrowRight size={11} />
                          </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); openEdit(item); }} style={iconBtnStyle}><FiEdit2 size={11} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }} style={{ ...iconBtnStyle, color: '#ef4444' }}><FiTrash2 size={11} /></button>
                      </div>
                    </div>
                    <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary, #f1f5f9)', lineHeight: 1.4 }}>{item.title}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: PRIORITY_COLORS[item.priority], display: 'flex', alignItems: 'center', gap: 3 }}>
                          {item.priority === 'Critical' || item.priority === 'High' ? <FiArrowUp size={10} /> : item.priority === 'Low' ? <FiArrowDown size={10} /> : <FiMinus size={10} />}
                          {item.priority}
                        </span>
                        {item.storyPoints > 0 && <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontWeight: 600 }}>{item.storyPoints} pts</span>}
                      </div>
                      {item.assignee && (
                        <div title={item.assignee} style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 600 }}>
                          {item.assignee.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {(showAddModal || showEditModal) && (
        <div onClick={() => { setShowAddModal(false); setShowEditModal(null); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: 'var(--surface-elevated, #1e293b)', borderRadius: 16, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', boxShadow: '0 24px 64px rgba(0,0,0,0.4)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>{showEditModal ? 'Edit Work Item' : 'New Work Item'}</h3>
              <button onClick={() => { setShowAddModal(false); setShowEditModal(null); }} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'var(--card-hover, rgba(255,255,255,0.04))', color: 'var(--text-muted, rgba(148,163,184,0.55))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiX size={16} /></button>
            </div>
            {itemForm}
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, rgba(203,213,225,0.85))', marginBottom: 5 };
const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', background: 'var(--input-bg, rgba(255,255,255,0.04))', color: 'var(--text-primary, #f1f5f9)', fontSize: 13, outline: 'none', boxSizing: 'border-box' };
const selectStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', background: 'var(--input-bg, rgba(255,255,255,0.04))', color: 'var(--text-primary, #f1f5f9)', fontSize: 13, outline: 'none' };
const cancelBtnStyle = { padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', background: 'transparent', color: 'var(--text-secondary, rgba(203,213,225,0.85))', fontSize: 13, fontWeight: 500, cursor: 'pointer' };
const primaryBtnStyle = { padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const arrowBtnStyle = { width: 24, height: 24, borderRadius: 5, border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.1)', color: '#818cf8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' };
const iconBtnStyle = { width: 24, height: 24, borderRadius: 5, border: 'none', background: 'transparent', color: 'var(--text-muted, rgba(148,163,184,0.55))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
