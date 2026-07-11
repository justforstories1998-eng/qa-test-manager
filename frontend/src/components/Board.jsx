import React, { useState, useEffect, useCallback } from 'react';
import { FiTrello, FiPlus, FiSearch, FiTrash2, FiEdit2, FiX, FiArrowRight, FiArrowLeft, FiArrowUp, FiArrowDown, FiMinus, FiChevronDown, FiChevronRight, FiAlertTriangle, FiTag } from 'react-icons/fi';
import api from '../api';
import { toast } from 'react-toastify';

const DEFAULT_COLUMNS = [
  { id: 'Backlog', title: 'Backlog', color: '#94a3b8', wipLimit: 0 },
  { id: 'To Do', title: 'To Do', color: '#60a5fa', wipLimit: 0 },
  { id: 'In Progress', title: 'In Progress', color: '#fbbf24', wipLimit: 5 },
  { id: 'Review', title: 'Review', color: '#a78bfa', wipLimit: 0 },
  { id: 'Done', title: 'Done', color: '#34d399', wipLimit: 0 },
];

const COL_INDEX = {};
DEFAULT_COLUMNS.forEach((c, i) => { COL_INDEX[c.id] = i; });

const TYPE_COLORS = { Epic: '#8b5cf6', Feature: '#6366f1', 'User Story': '#3b82f6', Task: '#f59e0b', Bug: '#ef4444', Issue: '#f97316', 'Test Case': '#10b981' };
const PRIORITY_LABELS = { 1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low' };
const PRIORITY_COLORS = { 1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#6b7280' };

const EMPTY_FORM = {
  title: '',
  type: 'Task',
  priority: 3,
  severity: '',
  status: 'Backlog',
  assignee: '',
  storyPoints: 0,
  description: '',
  effort: 0,
  remainingWork: 0,
  tags: '',
  areaPath: '',
  activity: '',
  acceptanceCriteria: '',
};

export default function Board({ projectId }) {
  const [workItems, setWorkItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [collapsedSwimlanes, setCollapsedSwimlanes] = useState({});
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);

  const fetchItems = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await api.getWorkItems(projectId);
      if (res.success) setWorkItems(res.data);
    } catch {
      toast.error('Failed to load work items');
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = workItems.filter(i =>
    i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.description && i.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (i.tags && i.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))) ||
    (i.workItemId && `WI-${i.workItemId}`.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const moveItem = async (itemId, newStatus) => {
    const item = workItems.find(i => i._id === itemId);
    if (!item || item.status === newStatus) return;

    const colDef = columns.find(c => c.id === newStatus);
    if (colDef && colDef.wipLimit > 0) {
      const currentCount = workItems.filter(i => i.status === newStatus && i._id !== itemId).length;
      if (currentCount >= colDef.wipLimit) {
        toast.warning(`WIP limit reached for "${newStatus}" (${currentCount}/${colDef.wipLimit})`);
      }
    }

    const targetItems = filtered.filter(i => i.status === newStatus);
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
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item._id);
  };

  const handleDragEnd = (e) => {
    e.dataTransfer.clearData('text/plain');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    if (!itemId) return;
    await moveItem(itemId, targetStatus);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      const tagsArray = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const res = await api.createWorkItem({
        title: form.title,
        type: form.type,
        priority: parseInt(form.priority),
        severity: form.severity,
        status: form.status,
        assignee: form.assignee,
        storyPoints: parseInt(form.storyPoints) || 0,
        description: form.description,
        effort: parseFloat(form.effort) || 0,
        remainingWork: parseFloat(form.remainingWork) || 0,
        tags: tagsArray,
        areaPath: form.areaPath,
        activity: form.activity,
        acceptanceCriteria: form.acceptanceCriteria,
        projectId,
        order: filtered.filter(i => i.status === form.status).length,
      });
      if (res.success) {
        setWorkItems(prev => [...prev, res.data]);
        setShowAddModal(false);
        setForm({ ...EMPTY_FORM });
        toast.success('Work item created');
      }
    } catch {
      toast.error('Failed to create work item');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const tagsArray = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const res = await api.updateWorkItem(showEditModal._id, {
        title: form.title,
        type: form.type,
        priority: parseInt(form.priority),
        severity: form.severity,
        status: form.status,
        assignee: form.assignee,
        storyPoints: parseInt(form.storyPoints) || 0,
        description: form.description,
        effort: parseFloat(form.effort) || 0,
        remainingWork: parseFloat(form.remainingWork) || 0,
        tags: tagsArray,
        areaPath: form.areaPath,
        activity: form.activity,
        acceptanceCriteria: form.acceptanceCriteria,
      });
      if (res.success) {
        setWorkItems(prev => prev.map(i => i._id === showEditModal._id ? res.data : i));
        setShowEditModal(null);
        setForm({ ...EMPTY_FORM });
        toast.success('Work item updated');
      }
    } catch {
      toast.error('Failed to update work item');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this work item?')) return;
    try {
      await api.deleteWorkItem(id);
      setWorkItems(prev => prev.filter(i => i._id !== id));
      toast.success('Work item deleted');
    } catch {
      toast.error('Failed to delete work item');
    }
  };

  const openEdit = (item) => {
    setForm({
      title: item.title || '',
      type: item.type || 'Task',
      priority: item.priority || 3,
      severity: item.severity || '',
      status: item.status || 'Backlog',
      assignee: item.assignee || '',
      storyPoints: item.storyPoints || 0,
      description: item.description || '',
      effort: item.effort || 0,
      remainingWork: item.remainingWork || 0,
      tags: (item.tags && item.tags.length > 0) ? item.tags.join(', ') : '',
      areaPath: item.areaPath || '',
      activity: item.activity || '',
      acceptanceCriteria: item.acceptanceCriteria || '',
    });
    setShowEditModal(item);
  };

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(null);
    setForm({ ...EMPTY_FORM });
  };

  const toggleSwimlane = (lane) => {
    setCollapsedSwimlanes(prev => ({ ...prev, [lane]: !prev[lane] }));
  };

  const getAssignees = () => {
    const assigneeSet = new Set();
    workItems.forEach(item => {
      if (item.assignee) assigneeSet.add(item.assignee);
    });
    return Array.from(assigneeSet).sort();
  };

  const getItemsBySwimlane = (columnId, assignee) => {
    return filtered.filter(i => {
      const matchColumn = i.status === columnId;
      const matchAssignee = assignee === null ? !i.assignee : i.assignee === assignee;
      return matchColumn && matchAssignee;
    }).sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  const assignees = getAssignees();
  const swimlanes = ['Unassigned', ...assignees];

  const renderCard = (item, colIdx) => {
    const prevStatus = colIdx > 0 ? columns[colIdx - 1].id : null;
    const nextStatus = colIdx < columns.length - 1 ? columns[colIdx + 1].id : null;
    const canMoveBack = colIdx > 0;
    const canMoveForward = colIdx < columns.length - 1;
    const priorityLabel = PRIORITY_LABELS[item.priority] || 'Medium';
    const priorityColor = PRIORITY_COLORS[item.priority] || '#eab308';

    return (
      <div
        key={item._id}
        draggable="true"
        onDragStart={e => handleDragStart(e, item)}
        onDragEnd={handleDragEnd}
        style={cardStyle}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.3 }}>WI-{item.workItemId}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: TYPE_COLORS[item.type] || '#6b7280', padding: '2px 7px', borderRadius: 4, background: `${TYPE_COLORS[item.type] || '#6b7280'}18` }}>
              {item.type}
            </span>
          </div>
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
            <button onClick={(e) => { e.stopPropagation(); openEdit(item); }} style={iconBtnStyle}>
              <FiEdit2 size={11} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }} style={{ ...iconBtnStyle, color: '#ef4444' }}>
              <FiTrash2 size={11} />
            </button>
          </div>
        </div>

        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary, #f1f5f9)', lineHeight: 1.4 }}>{item.title}</p>

        {item.description && (
          <p style={{ margin: '0 0 10px', fontSize: 11, color: 'var(--text-muted, rgba(148,163,184,0.55))', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {item.description}
          </p>
        )}

        {item.tags && item.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
            {item.tags.map((tag, i) => (
              <span key={i} style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.1)', color: '#818cf8', display: 'flex', alignItems: 'center', gap: 3 }}>
                <FiTag size={8} />
                {tag}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: priorityColor, display: 'flex', alignItems: 'center', gap: 3 }}>
              {item.priority === 1 || item.priority === 2 ? <FiArrowUp size={10} /> : item.priority === 4 ? <FiArrowDown size={10} /> : <FiMinus size={10} />}
              {priorityLabel}
            </span>
            {item.storyPoints > 0 && (
              <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontWeight: 600 }}>
                {item.storyPoints} pts
              </span>
            )}
            {item.effort > 0 && (
              <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'rgba(234,179,8,0.1)', color: '#fbbf24', fontWeight: 600 }}>
                {item.effort}h
              </span>
            )}
          </div>
          {item.assignee && (
            <div title={item.assignee} style={avatarStyle}>
              {item.assignee.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
          )}
        </div>
      </div>
    );
  };

  const modalForm = (
    <form onSubmit={showEditModal ? handleUpdate : handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={labelStyle}>Title *</label>
        <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Work item title" required autoFocus style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Type</label>
          <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={selectStyle}>
            {Object.keys(TYPE_COLORS).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Priority (1-4)</label>
          <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: parseInt(e.target.value) }))} style={selectStyle}>
            <option value={1}>1 - Critical</option>
            <option value={2}>2 - High</option>
            <option value={3}>3 - Medium</option>
            <option value={4}>4 - Low</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Severity</label>
          <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))} style={selectStyle}>
            <option value="">None</option>
            <option value="S1">S1 - Critical</option>
            <option value="S2">S2 - Major</option>
            <option value="S3">S3 - Minor</option>
            <option value="S4">S4 - Trivial</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Status</label>
          <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={selectStyle}>
            {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Assignee</label>
          <input value={form.assignee} onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))} placeholder="Assignee name" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Story Points</label>
          <input type="number" min="0" max="100" value={form.storyPoints} onChange={e => setForm(p => ({ ...p, storyPoints: parseInt(e.target.value) || 0 }))} style={inputStyle} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Effort (hours)</label>
          <input type="number" min="0" step="0.5" value={form.effort} onChange={e => setForm(p => ({ ...p, effort: e.target.value }))} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Remaining Work (hours)</label>
          <input type="number" min="0" step="0.5" value={form.remainingWork} onChange={e => setForm(p => ({ ...p, remainingWork: e.target.value }))} style={inputStyle} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Activity</label>
          <select value={form.activity} onChange={e => setForm(p => ({ ...p, activity: e.target.value }))} style={selectStyle}>
            <option value="">None</option>
            <option value="Development">Development</option>
            <option value="Design">Design</option>
            <option value="Testing">Testing</option>
            <option value="Documentation">Documentation</option>
            <option value="Deployment">Deployment</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Area Path</label>
          <input value={form.areaPath} onChange={e => setForm(p => ({ ...p, areaPath: e.target.value }))} placeholder="e.g. Project/Module" style={inputStyle} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Tags (comma-separated)</label>
        <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="e.g. frontend, urgent, ui" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Description</label>
        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Detailed description..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
      </div>
      <div>
        <label style={labelStyle}>Acceptance Criteria</label>
        <textarea value={form.acceptanceCriteria} onChange={e => setForm(p => ({ ...p, acceptanceCriteria: e.target.value }))} placeholder="Define acceptance criteria..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        <button type="button" onClick={closeModal} style={cancelBtnStyle}>Cancel</button>
        <button type="submit" style={primaryBtnStyle}>{showEditModal ? 'Update' : 'Create'}</button>
      </div>
    </form>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={iconContainerStyle}>
              <FiTrello size={19} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', letterSpacing: -0.3 }}>Board</h1>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-muted, rgba(148,163,184,0.55))' }}>
                {workItems.length} items &middot; Drag or use arrows to move
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, rgba(148,163,184,0.55))' }} />
              <input
                placeholder="Search items..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={searchInputStyle}
              />
            </div>
            <button onClick={openCreate} style={primaryBtnStyle}>
              <FiPlus size={14} /> Add Item
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: 16, padding: '20px 32px', overflowX: 'auto', overflowY: 'hidden' }}>
        {columns.map((col, colIdx) => {
          const allItemsInCol = filtered.filter(i => i.status === col.id);
          const itemCount = allItemsInCol.length;
          const isOverLimit = col.wipLimit > 0 && itemCount >= col.wipLimit;
          const headerBg = isOverLimit ? 'rgba(239,68,68,0.12)' : 'transparent';
          const headerBorder = isOverLimit ? 'rgba(239,68,68,0.3)' : undefined;

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, col.id)}
              style={{
                minWidth: 290,
                maxWidth: 330,
                flex: '1 1 0',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--card-bg, rgba(255,255,255,0.02))',
                border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
                borderRadius: 12,
                overflow: 'hidden',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: headerBg, borderBottomColor: headerBorder }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: isOverLimit ? '#ef4444' : col.color }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: isOverLimit ? '#ef4444' : 'var(--text-primary, #f1f5f9)' }}>{col.title}</span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isOverLimit ? '#ef4444' : 'var(--text-muted, rgba(148,163,184,0.55))',
                    background: isOverLimit ? 'rgba(239,68,68,0.15)' : 'var(--card-hover, rgba(255,255,255,0.04))',
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}>
                    {itemCount}
                  </span>
                </div>
                {col.wipLimit > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: isOverLimit ? '#ef4444' : 'var(--text-muted, rgba(148,163,184,0.55))',
                    }}>
                      WIP: {itemCount}/{col.wipLimit}
                    </span>
                    {isOverLimit && <FiAlertTriangle size={12} color="#ef4444" />}
                  </div>
                )}
              </div>

              <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', minHeight: 100 }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted, rgba(148,163,184,0.55))', fontSize: 12 }}>Loading...</div>
                ) : (
                  swimlanes.map(lane => {
                    const laneItems = getItemsBySwimlane(col.id, lane === 'Unassigned' ? null : lane);
                    if (laneItems.length === 0 && colIdx !== 0) return null;

                    const isCollapsed = collapsedSwimlanes[lane] || false;

                    return (
                      <div key={lane} style={{ marginBottom: 4 }}>
                        {colIdx === 0 && (
                          <button
                            onClick={() => toggleSwimlane(lane)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '6px 8px',
                              borderRadius: 6,
                              border: 'none',
                              background: 'var(--card-hover, rgba(255,255,255,0.04))',
                              color: 'var(--text-secondary, rgba(203,213,225,0.85))',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              width: '100%',
                              marginBottom: 8,
                              textTransform: 'uppercase',
                              letterSpacing: 0.3,
                            }}
                          >
                            {isCollapsed ? <FiChevronRight size={12} /> : <FiChevronDown size={12} />}
                            <div title={lane} style={{ width: 18, height: 18, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff', fontWeight: 600, flexShrink: 0 }}>
                              {lane === 'Unassigned' ? '?' : lane.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <span>{lane}</span>
                            <span style={{ fontSize: 10, color: 'var(--text-muted, rgba(148,163,184,0.55))', marginLeft: 'auto' }}>
                              {workItems.filter(i => lane === 'Unassigned' ? !i.assignee : i.assignee === lane).length}
                            </span>
                          </button>
                        )}

                        {!isCollapsed && laneItems.map(item => renderCard(item, colIdx))}

                        {colIdx === 0 && isCollapsed && laneItems.length > 0 && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted, rgba(148,163,184,0.55))', padding: '2px 8px', textAlign: 'center' }}>
                            {laneItems.length} item{laneItems.length !== 1 ? 's' : ''} collapsed
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {!loading && filtered.filter(i => i.status === col.id).length === 0 && (
                  <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted, rgba(148,163,184,0.35))', fontSize: 12, fontStyle: 'italic' }}>
                    Drop items here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {(showAddModal || showEditModal) && (
        <div onClick={closeModal} style={modalOverlayStyle}>
          <div onClick={e => e.stopPropagation()} style={modalContainerStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>
                {showEditModal ? 'Edit Work Item' : 'New Work Item'}
              </h3>
              <button onClick={closeModal} style={closeBtnStyle}>
                <FiX size={16} />
              </button>
            </div>
            {modalForm}
          </div>
        </div>
      )}
    </div>
  );
}

const iconContainerStyle = {
  width: 40,
  height: 40,
  borderRadius: 11,
  background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
  border: '1px solid rgba(99,102,241,0.22)',
  color: '#818cf8',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const searchInputStyle = {
  padding: '8px 12px 8px 34px',
  borderRadius: 8,
  border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
  background: 'var(--card-bg, rgba(255,255,255,0.02))',
  color: 'var(--text-primary, #f1f5f9)',
  fontSize: 13,
  outline: 'none',
  width: 200,
};

const primaryBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  borderRadius: 8,
  border: 'none',
  background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-secondary, rgba(203,213,225,0.85))',
  marginBottom: 5,
};

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
  background: 'var(--input-bg, rgba(255,255,255,0.04))',
  color: 'var(--text-primary, #f1f5f9)',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};

const selectStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
  background: 'var(--input-bg, rgba(255,255,255,0.04))',
  color: 'var(--text-primary, #f1f5f9)',
  fontSize: 13,
  outline: 'none',
};

const cancelBtnStyle = {
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
  background: 'transparent',
  color: 'var(--text-secondary, rgba(203,213,225,0.85))',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
};

const closeBtnStyle = {
  width: 30,
  height: 30,
  borderRadius: 8,
  border: 'none',
  background: 'var(--card-hover, rgba(255,255,255,0.04))',
  color: 'var(--text-muted, rgba(148,163,184,0.55))',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const arrowBtnStyle = {
  width: 24,
  height: 24,
  borderRadius: 5,
  border: '1px solid rgba(99,102,241,0.25)',
  background: 'rgba(99,102,241,0.1)',
  color: '#818cf8',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s',
};

const iconBtnStyle = {
  width: 24,
  height: 24,
  borderRadius: 5,
  border: 'none',
  background: 'transparent',
  color: 'var(--text-muted, rgba(148,163,184,0.55))',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const cardStyle = {
  padding: 14,
  borderRadius: 10,
  border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
  background: 'var(--card-bg, rgba(255,255,255,0.02))',
  cursor: 'grab',
  transition: 'all 0.15s',
  userSelect: 'none',
};

const avatarStyle = {
  width: 24,
  height: 24,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 10,
  color: '#fff',
  fontWeight: 600,
};

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
};

const modalContainerStyle = {
  width: '100%',
  maxWidth: 520,
  maxHeight: '85vh',
  overflowY: 'auto',
  background: 'var(--surface-elevated, #1e293b)',
  borderRadius: 16,
  border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
  boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
  padding: 24,
};
