import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FiTrello, FiPlus, FiSearch, FiTrash2, FiEdit2, FiX,
  FiArrowRight, FiArrowLeft, FiArrowUp, FiArrowDown, FiMinus,
  FiChevronDown, FiChevronRight, FiAlertTriangle, FiTag,
  FiMoreHorizontal, FiFilter, FiLayout,
  FiClock, FiUser, FiHash, FiZap, FiTarget, FiCheckCircle
} from 'react-icons/fi';
import api from '../api';
import { toast } from 'react-toastify';

const getTheme = () => {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (dark) {
    return {
      bgPrimary: 'var(--bg-app)', bgSecondary: 'var(--surface-primary)', bgTertiary: 'var(--surface-tertiary)',
      bgCard: 'var(--bg-card)', bgCardHover: 'var(--surface-glass-hover)', bgElevated: 'var(--surface-elevated)',
      bgInput: 'var(--surface-secondary)', bgOverlay: 'var(--surface-overlay)',
      textPrimary: 'var(--text-primary)', textSecondary: 'var(--text-secondary)', textMuted: 'var(--text-muted)', textInverse: 'var(--text-on-primary)',
      borderPrimary: 'var(--border-color)', borderSecondary: 'var(--border-medium)',
      borderFocus: 'var(--focus-ring)',
      accentPrimary: 'var(--primary-color)', accentSecondary: 'var(--primary-light)',
      accentGradient: 'var(--gradient-primary)', accentGlow: 'var(--glow-primary)',
      shadowSm: 'var(--shadow-sm)', shadowMd: 'var(--shadow-md)',
      shadowLg: 'var(--shadow-lg)', shadowXl: 'var(--shadow-xl)',
      scrollTrack: 'transparent', scrollThumb: 'rgba(255, 255, 255, 0.08)',
      scrollThumbHover: 'rgba(255, 255, 255, 0.15)',
      columnBg: 'rgba(255, 255, 255, 0.015)', columnHeaderBg: 'rgba(255, 255, 255, 0.02)',
      dropZone: 'rgba(99, 102, 241, 0.08)', swimlaneBg: 'rgba(255, 255, 255, 0.03)',
      swimlaneHover: 'rgba(255, 255, 255, 0.06)',
    };
  }
  return {
    bgPrimary: 'var(--bg-app)', bgSecondary: 'var(--surface-primary)', bgTertiary: 'var(--surface-tertiary)',
    bgCard: 'var(--bg-card)', bgCardHover: 'var(--surface-glass-hover)', bgElevated: 'var(--surface-elevated)',
    bgInput: 'var(--surface-secondary)', bgOverlay: 'var(--surface-overlay)',
    textPrimary: 'var(--text-primary)', textSecondary: 'var(--text-secondary)', textMuted: 'var(--text-muted)', textInverse: 'var(--text-on-primary)',
    borderPrimary: 'var(--border-color)', borderSecondary: 'var(--border-medium)',
    borderFocus: 'var(--focus-ring)',
    accentPrimary: 'var(--primary-color)', accentSecondary: 'var(--primary-600)',
    accentGradient: 'var(--gradient-primary)', accentGlow: 'var(--glow-primary)',
    shadowSm: 'var(--shadow-sm)', shadowMd: 'var(--shadow-md)',
    shadowLg: 'var(--shadow-lg)', shadowXl: 'var(--shadow-xl)',
    scrollTrack: 'transparent', scrollThumb: 'rgba(0, 0, 0, 0.1)',
    scrollThumbHover: 'rgba(0, 0, 0, 0.2)',
    columnBg: 'rgba(0, 0, 0, 0.02)', columnHeaderBg: 'rgba(0, 0, 0, 0.015)',
    dropZone: 'rgba(99, 102, 241, 0.06)', swimlaneBg: 'rgba(0, 0, 0, 0.025)',
    swimlaneHover: 'rgba(0, 0, 0, 0.05)',
  };
};

const DEFAULT_COLUMNS = [
  { id: 'Backlog', title: 'Backlog', color: '#94a3b8', icon: FiHash, wipLimit: 0, split: false },
  { id: 'To Do', title: 'To Do', color: '#60a5fa', icon: FiTarget, wipLimit: 0, split: false },
  { id: 'In Progress', title: 'In Progress', color: '#fbbf24', icon: FiZap, wipLimit: 5, split: true },
  { id: 'Review', title: 'Review', color: '#a78bfa', icon: FiSearch, wipLimit: 0, split: false },
  { id: 'Done', title: 'Done', color: '#34d399', icon: FiCheckCircle, wipLimit: 0, split: false },
];

const COLUMN_ICONS = { Backlog: FiHash, 'To Do': FiTarget, 'In Progress': FiZap, Review: FiSearch, Done: FiCheckCircle };

const TYPE_COLORS = { Epic: '#8b5cf6', Feature: '#6366f1', 'User Story': '#3b82f6', Task: '#f59e0b', Bug: '#ef4444', Issue: '#f97316', 'Test Case': '#10b981' };
const TYPE_ICONS = { Epic: '⚡', Feature: '✨', 'User Story': '📖', Task: '✅', Bug: '🐛', Issue: '⚠️', 'Test Case': '🧪' };
const PRIORITY_LABELS = { 1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low' };
const PRIORITY_COLORS = { 1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#6b7280' };

const EMPTY_FORM = {
  title: '', type: 'Task', priority: 3, severity: '', status: 'Backlog',
  assignee: '', storyPoints: 0, description: '', effort: 0, remainingWork: 0,
  tags: '', areaPath: '', activity: '', acceptanceCriteria: '',
};

const injectScrollbarStyles = (theme) => {
  const styleId = 'board-scrollbar-styles';
  let styleEl = document.getElementById(styleId);
  if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = styleId; document.head.appendChild(styleEl); }
  styleEl.textContent = `
    .board-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
    .board-scroll::-webkit-scrollbar-track { background: ${theme.scrollTrack}; }
    .board-scroll::-webkit-scrollbar-thumb { background: ${theme.scrollThumb}; border-radius: 3px; }
    .board-scroll::-webkit-scrollbar-thumb:hover { background: ${theme.scrollThumbHover}; }
    .board-column-scroll::-webkit-scrollbar { width: 4px; }
    .board-column-scroll::-webkit-scrollbar-track { background: transparent; }
    .board-column-scroll::-webkit-scrollbar-thumb { background: ${theme.scrollThumb}; border-radius: 2px; }
    .board-card { transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease; }
    .board-card:hover { transform: translateY(-2px); }
    .board-card:active { transform: translateY(0); cursor: grabbing; }
    .board-column { transition: background 0.2s ease, border-color 0.2s ease; }
    .board-column.drag-over { border-color: ${theme.accentPrimary} !important; background: ${theme.dropZone} !important; }
    .board-modal-content { animation: modalSlideIn 0.25s ease; }
    @keyframes modalSlideIn { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    .skeleton-loading { background: linear-gradient(90deg, ${theme.bgTertiary} 25%, ${theme.bgCardHover} 50%, ${theme.bgTertiary} 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 8px; }
    .btn-hover-scale { transition: all 0.15s ease; }
    .btn-hover-scale:hover { transform: scale(1.04); }
    .btn-hover-scale:active { transform: scale(0.98); }
    .icon-btn-hover { transition: all 0.15s ease; }
    .icon-btn-hover:hover { background: ${theme.bgCardHover} !important; }
    .board-input:focus { border-color: ${theme.borderFocus} !important; box-shadow: 0 0 0 3px ${theme.accentGlow} !important; }
    .swimlane-toggle:hover { background: ${theme.swimlaneHover} !important; }
  `;
};

export default function Board({ projectId }) {
  const [workItems, setWorkItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [collapsedSwimlanes, setCollapsedSwimlanes] = useState({});
  const [quickAddCol, setQuickAddCol] = useState(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [boards, setBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [dragOverCol, setDragOverCol] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [themeVersion, setThemeVersion] = useState(0);

  useEffect(() => {
    const observer = new MutationObserver(() => setThemeVersion(v => v + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const t = useMemo(() => getTheme(), [themeVersion]);

  useEffect(() => { injectScrollbarStyles(t); }, [t]);

  const fetchBoards = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await api.getBoards(projectId);
      if (res.success && res.data.length > 0) {
        setBoards(res.data);
        if (!selectedBoardId) {
          setSelectedBoardId(res.data[0]._id);
        }
      }
    } catch { /* ignore */ }
  }, [projectId, selectedBoardId]);

  useEffect(() => { fetchBoards(); }, [fetchBoards]);

  useEffect(() => {
    if (selectedBoardId) {
      const board = boards.find(b => b._id === selectedBoardId);
      if (board && board.columns && board.columns.length > 0) {
        setColumns(board.columns.map(c => ({
          ...c,
          icon: COLUMN_ICONS[c.id] || COLUMN_ICONS[c.title] || FiHash,
        })));
      } else {
        setColumns(DEFAULT_COLUMNS);
      }
    } else {
      setColumns(DEFAULT_COLUMNS);
    }
  }, [selectedBoardId, boards]);

  const fetchItems = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try { const res = await api.getWorkItems(projectId); if (res.success) setWorkItems(res.data); } catch { toast.error('Failed to load work items'); }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = useMemo(() => {
    return workItems.filter(i => {
      const matchSearch = i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.description && i.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (i.tags && i.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (i.workItemId && `WI-${i.workItemId}`.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchType = !filterType || i.type === filterType;
      const matchPriority = !filterPriority || i.priority === parseInt(filterPriority);
      const matchAssignee = !filterAssignee || (filterAssignee === 'unassigned' ? !i.assignee : i.assignee === filterAssignee);
      return matchSearch && matchType && matchPriority && matchAssignee;
    });
  }, [workItems, searchTerm, filterType, filterPriority, filterAssignee]);

  const moveItem = async (itemId, newStatus) => {
    const item = workItems.find(i => i._id === itemId);
    if (!item || item.status === newStatus) return;
    const colDef = columns.find(c => c.id === newStatus);
    if (colDef && colDef.wipLimit > 0) {
      const currentCount = workItems.filter(i => i.status === newStatus && i._id !== itemId).length;
      if (currentCount >= colDef.wipLimit) toast.warning(`WIP limit reached for "${newStatus}" (${currentCount}/${colDef.wipLimit})`);
    }
    const targetItems = filtered.filter(i => i.status === newStatus);
    const newOrder = targetItems.length;
    setWorkItems(prev => prev.map(i => i._id === itemId ? { ...i, status: newStatus, order: newOrder } : i));
    try { await api.updateWorkItem(itemId, { status: newStatus, order: newOrder }); toast.success(`Moved to ${newStatus}`); } catch { fetchItems(); toast.error('Failed to move item'); }
  };

  const handleDragStart = (e, item) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', item._id); e.currentTarget.style.opacity = '0.5'; };
  const handleDragEnd = (e) => { e.currentTarget.style.opacity = '1'; setDragOverCol(null); };
  const handleDragOver = (e, colId) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverCol(colId); };
  const handleDragLeave = () => { setDragOverCol(null); };
  const handleDrop = async (e, targetStatus) => { e.preventDefault(); setDragOverCol(null); const itemId = e.dataTransfer.getData('text/plain'); if (!itemId) return; await moveItem(itemId, targetStatus); };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      const tagsArray = form.tags ? form.tags.split(',').map(t2 => t2.trim()).filter(Boolean) : [];
      const res = await api.createWorkItem({
        ...form, priority: parseInt(form.priority), storyPoints: parseInt(form.storyPoints) || 0,
        effort: parseFloat(form.effort) || 0, remainingWork: parseFloat(form.remainingWork) || 0,
        tags: tagsArray, projectId, order: filtered.filter(i => i.status === form.status).length,
      });
      if (res.success) { setWorkItems(prev => [...prev, res.data]); setShowAddModal(false); setForm({ ...EMPTY_FORM }); toast.success('Work item created'); }
    } catch { toast.error('Failed to create work item'); }
  };

  const handleQuickAdd = async (colId) => {
    if (!quickAddTitle.trim()) return;
    try {
      const res = await api.createWorkItem({
        title: quickAddTitle, type: 'Task', priority: 3, status: colId,
        projectId, order: filtered.filter(i => i.status === colId).length,
      });
      if (res.success) { setWorkItems(prev => [...prev, res.data]); setQuickAddTitle(''); setQuickAddCol(null); toast.success('Work item created'); }
    } catch { toast.error('Failed to create work item'); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const tagsArray = form.tags ? form.tags.split(',').map(t2 => t2.trim()).filter(Boolean) : [];
      const res = await api.updateWorkItem(showEditModal._id, {
        ...form, priority: parseInt(form.priority), storyPoints: parseInt(form.storyPoints) || 0,
        effort: parseFloat(form.effort) || 0, remainingWork: parseFloat(form.remainingWork) || 0, tags: tagsArray,
      });
      if (res.success) { setWorkItems(prev => prev.map(i => i._id === showEditModal._id ? res.data : i)); setShowEditModal(null); setForm({ ...EMPTY_FORM }); toast.success('Work item updated'); }
    } catch { toast.error('Failed to update work item'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this work item?')) return;
    try { await api.deleteWorkItem(id); setWorkItems(prev => prev.filter(i => i._id !== id)); toast.success('Work item deleted'); } catch { toast.error('Failed to delete work item'); }
  };

  const openEdit = (item) => {
    setForm({
      title: item.title || '', type: item.type || 'Task', priority: item.priority || 3,
      severity: item.severity || '', status: item.status || 'Backlog', assignee: item.assignee || '',
      storyPoints: item.storyPoints || 0, description: item.description || '', effort: item.effort || 0,
      remainingWork: item.remainingWork || 0, tags: (item.tags && item.tags.length > 0) ? item.tags.join(', ') : '',
      areaPath: item.areaPath || '', activity: item.activity || '', acceptanceCriteria: item.acceptanceCriteria || '',
    });
    setShowEditModal(item);
  };

  const openCreate = () => { setForm({ ...EMPTY_FORM }); setShowAddModal(true); };
  const closeModal = () => { setShowAddModal(false); setShowEditModal(null); setForm({ ...EMPTY_FORM }); };
  const toggleSwimlane = (lane) => { setCollapsedSwimlanes(prev => ({ ...prev, [lane]: !prev[lane] })); };

  const assignees = useMemo(() => {
    const set = new Set();
    workItems.forEach(item => { if (item.assignee) set.add(item.assignee); });
    return Array.from(set).sort();
  }, [workItems]);

  const swimlanes = ['Unassigned', ...assignees];

  const getItemsBySwimlane = (columnId, assignee) => {
    return filtered.filter(i => {
      const matchCol = i.status === columnId;
      const matchAssignee = assignee === null ? !i.assignee : i.assignee === assignee;
      return matchCol && matchAssignee;
    }).sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  const stats = useMemo(() => {
    const total = workItems.length;
    const done = workItems.filter(i => i.status === 'Done').length;
    const inProgress = workItems.filter(i => i.status === 'In Progress').length;
    const totalPoints = workItems.reduce((acc, i) => acc + (i.storyPoints || 0), 0);
    return { total, done, inProgress, totalPoints };
  }, [workItems]);

  const activeFilterCount = [filterType, filterPriority, filterAssignee].filter(Boolean).length;

  const renderCard = (item, colIdx) => {
    const prevStatus = colIdx > 0 ? columns[colIdx - 1].id : null;
    const nextStatus = colIdx < columns.length - 1 ? columns[colIdx + 1].id : null;
    const priorityLabel = PRIORITY_LABELS[item.priority] || 'Medium';
    const priorityColor = PRIORITY_COLORS[item.priority] || '#eab308';
    const typeColor = TYPE_COLORS[item.type] || '#6b7280';

    return (
      <div key={item._id} draggable="true" onDragStart={e => handleDragStart(e, item)} onDragEnd={handleDragEnd}
        className="board-card"
        style={{ padding: 14, borderRadius: 12, border: `1px solid ${t.borderPrimary}`, background: t.bgCard, cursor: 'grab', userSelect: 'none', boxShadow: t.shadowSm, position: 'relative', overflow: 'hidden' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = t.borderSecondary; e.currentTarget.style.boxShadow = t.shadowMd; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = t.borderPrimary; e.currentTarget.style.boxShadow = t.shadowSm; }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: typeColor, borderRadius: '12px 0 0 12px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingLeft: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, letterSpacing: 0.5, fontFamily: 'monospace' }}>WI-{item.workItemId}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: typeColor, padding: '2px 8px', borderRadius: 6, background: `${typeColor}15`, display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ fontSize: 11 }}>{TYPE_ICONS[item.type] || '📋'}</span>{item.type}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 1 }}>
            {prevStatus && <button onClick={(e) => { e.stopPropagation(); moveItem(item._id, prevStatus); }} title={`Move to ${prevStatus}`} className="icon-btn-hover" style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', color: t.accentSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiArrowLeft size={11} /></button>}
            {nextStatus && <button onClick={(e) => { e.stopPropagation(); moveItem(item._id, nextStatus); }} title={`Move to ${nextStatus}`} className="icon-btn-hover" style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', color: t.accentSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiArrowRight size={11} /></button>}
            <button onClick={(e) => { e.stopPropagation(); openEdit(item); }} className="icon-btn-hover" style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', color: t.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiEdit2 size={11} /></button>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }} className="icon-btn-hover" style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiTrash2 size={11} /></button>
          </div>
        </div>
        <p style={{ margin: '0 0 10px', paddingLeft: 4, fontSize: 13.5, fontWeight: 600, color: t.textPrimary, lineHeight: 1.45 }}>{item.title}</p>
        {item.description && <p style={{ margin: '0 0 10px', paddingLeft: 4, fontSize: 11.5, color: t.textMuted, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.description}</p>}
        {item.tags && item.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10, paddingLeft: 4 }}>
            {item.tags.map((tag, i) => (
              <span key={i} style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 5, background: `${t.accentPrimary}12`, color: t.accentSecondary, display: 'flex', alignItems: 'center', gap: 3, border: `1px solid ${t.accentPrimary}20` }}>
                <FiTag size={8} />{tag}
              </span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 4, paddingTop: 4, borderTop: `1px solid ${t.borderPrimary}`, marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: priorityColor, display: 'flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 5, background: `${priorityColor}12`, border: `1px solid ${priorityColor}25` }}>
              {item.priority <= 2 ? <FiArrowUp size={9} /> : item.priority === 4 ? <FiArrowDown size={9} /> : <FiMinus size={9} />}{priorityLabel}
            </span>
            {item.storyPoints > 0 && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 5, background: `${t.accentPrimary}10`, color: t.accentSecondary, fontWeight: 700, border: `1px solid ${t.accentPrimary}20` }}>{item.storyPoints} SP</span>}
            {item.effort > 0 && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 5, background: 'rgba(234,179,8,0.08)', color: '#eab308', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid rgba(234,179,8,0.2)' }}><FiClock size={8} />{item.effort}h</span>}
          </div>
          {item.assignee && (
            <div title={item.assignee} style={{ width: 26, height: 26, borderRadius: '50%', background: t.accentGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700, boxShadow: `0 2px 6px ${t.accentGlow}`, border: `2px solid ${t.bgCard}` }}>
              {item.assignee.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSkeleton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[1, 2, 3].map(k => (<div key={k} className="skeleton-loading" style={{ height: 100, borderRadius: 12 }} />))}
    </div>
  );

  const modalForm = (
    <form onSubmit={showEditModal ? handleUpdate : handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 6, letterSpacing: 0.3 }}>Title <span style={{ color: '#ef4444' }}>*</span></label>
        <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Enter work item title" required autoFocus className="board-input" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${t.borderSecondary}`, background: t.bgInput, color: t.textPrimary, fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 6 }}>Type</label>
          <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="board-input" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${t.borderSecondary}`, background: t.bgInput, color: t.textPrimary, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            {Object.keys(TYPE_COLORS).map(tp => (<option key={tp} value={tp}>{TYPE_ICONS[tp]} {tp}</option>))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 6 }}>Priority</label>
          <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: parseInt(e.target.value) }))} className="board-input" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${t.borderSecondary}`, background: t.bgInput, color: t.textPrimary, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            <option value={1}>🔴 Critical</option><option value={2}>🟠 High</option><option value={3}>🟡 Medium</option><option value={4}>⚪ Low</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 6 }}>Severity</label>
          <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))} className="board-input" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${t.borderSecondary}`, background: t.bgInput, color: t.textPrimary, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            <option value="">None</option><option value="S1">S1 - Critical</option><option value="S2">S2 - Major</option><option value="S3">S3 - Minor</option><option value="S4">S4 - Trivial</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 6 }}>Status</label>
          <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="board-input" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${t.borderSecondary}`, background: t.bgInput, color: t.textPrimary, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            {columns.map(c => <option key={c.id} value={c.id}>{c.title || c.id}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 6 }}>Assignee</label>
          <div style={{ position: 'relative' }}>
            <FiUser size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: t.textMuted }} />
            <input value={form.assignee} onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))} placeholder="Assignee name" className="board-input" style={{ width: '100%', padding: '10px 14px 10px 34px', borderRadius: 10, border: `1px solid ${t.borderSecondary}`, background: t.bgInput, color: t.textPrimary, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 6 }}>Story Points</label>
          <input type="number" min="0" max="100" value={form.storyPoints} onChange={e => setForm(p => ({ ...p, storyPoints: parseInt(e.target.value) || 0 }))} className="board-input" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${t.borderSecondary}`, background: t.bgInput, color: t.textPrimary, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 6 }}>Effort (hours)</label>
          <input type="number" min="0" step="0.5" value={form.effort} onChange={e => setForm(p => ({ ...p, effort: e.target.value }))} className="board-input" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${t.borderSecondary}`, background: t.bgInput, color: t.textPrimary, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 6 }}>Remaining (hours)</label>
          <input type="number" min="0" step="0.5" value={form.remainingWork} onChange={e => setForm(p => ({ ...p, remainingWork: e.target.value }))} className="board-input" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${t.borderSecondary}`, background: t.bgInput, color: t.textPrimary, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 6 }}>Activity</label>
          <select value={form.activity} onChange={e => setForm(p => ({ ...p, activity: e.target.value }))} className="board-input" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${t.borderSecondary}`, background: t.bgInput, color: t.textPrimary, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            <option value="">None</option><option value="Development">Development</option><option value="Design">Design</option><option value="Testing">Testing</option><option value="Documentation">Documentation</option><option value="Deployment">Deployment</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 6 }}>Area Path</label>
          <input value={form.areaPath} onChange={e => setForm(p => ({ ...p, areaPath: e.target.value }))} placeholder="e.g. Project/Module" className="board-input" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${t.borderSecondary}`, background: t.bgInput, color: t.textPrimary, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 6 }}><FiTag size={11} style={{ verticalAlign: -1, marginRight: 4 }} />Tags (comma-separated)</label>
        <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="e.g. frontend, urgent, ui" className="board-input" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${t.borderSecondary}`, background: t.bgInput, color: t.textPrimary, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 6 }}>Description</label>
        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Add a detailed description..." rows={3} className="board-input" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${t.borderSecondary}`, background: t.bgInput, color: t.textPrimary, fontSize: 13, outline: 'none', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5, fontFamily: 'inherit' }} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 6 }}>Acceptance Criteria</label>
        <textarea value={form.acceptanceCriteria} onChange={e => setForm(p => ({ ...p, acceptanceCriteria: e.target.value }))} placeholder="Define acceptance criteria..." rows={3} className="board-input" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${t.borderSecondary}`, background: t.bgInput, color: t.textPrimary, fontSize: 13, outline: 'none', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5, fontFamily: 'inherit' }} />
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: `1px solid ${t.borderPrimary}`, marginTop: 4 }}>
        <button type="button" onClick={closeModal} className="btn-hover-scale" style={{ padding: '10px 20px', borderRadius: 10, border: `1px solid ${t.borderSecondary}`, background: 'transparent', color: t.textSecondary, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        <button type="submit" className="btn-hover-scale" style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: t.accentGradient, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 12px ${t.accentGlow}` }}>{showEditModal ? '✏️ Update Item' : '✨ Create Item'}</button>
      </div>
    </form>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: t.bgPrimary, transition: 'background 0.3s ease' }}>
      <div style={{ padding: '20px 28px 16px', borderBottom: `1px solid ${t.borderPrimary}`, flexShrink: 0, background: t.bgSecondary, boxShadow: t.shadowSm }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: t.accentGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px ${t.accentGlow}` }}>
              <FiTrello size={20} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: t.textPrimary, letterSpacing: -0.4 }}>Board</h1>
              <p style={{ margin: '2px 0 0', fontSize: 12.5, color: t.textMuted }}>{stats.total} items · {stats.done} done · {stats.totalPoints} story points</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {boards.length > 0 && (
              <select value={selectedBoardId} onChange={e => setSelectedBoardId(e.target.value)} className="board-input" style={{ padding: '8px 12px', borderRadius: 10, border: `1px solid ${t.borderSecondary}`, background: t.bgInput, color: t.textPrimary, fontSize: 13, outline: 'none', cursor: 'pointer', maxWidth: 180 }}>
                {boards.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            )}
            <button onClick={() => setShowFilters(!showFilters)} className="btn-hover-scale" style={{ height: 38, borderRadius: 10, padding: '0 14px', border: `1px solid ${showFilters || activeFilterCount > 0 ? t.accentPrimary + '50' : t.borderSecondary}`, background: activeFilterCount > 0 ? `${t.accentPrimary}10` : t.bgTertiary, color: activeFilterCount > 0 ? t.accentPrimary : t.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
              <FiFilter size={14} />Filters
              {activeFilterCount > 0 && <span style={{ width: 18, height: 18, borderRadius: '50%', background: t.accentGradient, color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeFilterCount}</span>}
            </button>
            <div style={{ position: 'relative' }}>
              <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: t.textMuted }} />
              <input placeholder="Search items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="board-input" style={{ padding: '9px 14px 9px 36px', borderRadius: 10, border: `1px solid ${t.borderSecondary}`, background: t.bgInput, color: t.textPrimary, fontSize: 13, outline: 'none', width: 220 }} />
              {searchTerm && <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, borderRadius: '50%', border: 'none', background: t.bgCardHover, color: t.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiX size={10} /></button>}
            </div>
            <button onClick={openCreate} className="btn-hover-scale" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, border: 'none', background: t.accentGradient, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 14px ${t.accentGlow}` }}>
              <FiPlus size={15} strokeWidth={2.5} /> New Item
            </button>
          </div>
        </div>
        {showFilters && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 16px', background: t.bgTertiary, borderRadius: 10, border: `1px solid ${t.borderPrimary}`, animation: 'fadeIn 0.2s ease' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: t.textMuted, marginRight: 4 }}><FiFilter size={12} style={{ verticalAlign: -1, marginRight: 4 }} />Filter by:</span>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="board-input" style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.borderSecondary}`, background: t.bgInput, color: t.textPrimary, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
              <option value="">All Types</option>{Object.keys(TYPE_COLORS).map(tp => (<option key={tp} value={tp}>{tp}</option>))}
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="board-input" style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.borderSecondary}`, background: t.bgInput, color: t.textPrimary, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
              <option value="">All Priorities</option>{Object.entries(PRIORITY_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
            </select>
            <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} className="board-input" style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.borderSecondary}`, background: t.bgInput, color: t.textPrimary, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
              <option value="">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {[...new Set(workItems.map(i => i.assignee).filter(Boolean))].sort().map(a => (<option key={a} value={a}>{a}</option>))}
            </select>
            {activeFilterCount > 0 && <button onClick={() => { setFilterType(''); setFilterPriority(''); setFilterAssignee(''); }} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><FiX size={11} /> Clear</button>}
          </div>
        )}
      </div>

      <div className="board-scroll" style={{ flex: 1, display: 'flex', gap: 14, padding: '18px 28px', overflowX: 'auto', overflowY: 'hidden' }}>
        {columns.map((col, colIdx) => {
          const allItemsInCol = filtered.filter(i => i.status === col.id);
          const itemCount = allItemsInCol.length;
          const isOverLimit = col.wipLimit > 0 && itemCount >= col.wipLimit;
          const isDragTarget = dragOverCol === col.id;
          const ColIcon = col.icon;
          return (
            <div key={col.id} className={`board-column ${isDragTarget ? 'drag-over' : ''}`} onDragOver={e => handleDragOver(e, col.id)} onDragLeave={handleDragLeave} onDrop={e => handleDrop(e, col.id)} style={{ minWidth: 290, maxWidth: 340, flex: '1 1 0', display: 'flex', flexDirection: 'column', background: t.columnBg, border: `1px solid ${isOverLimit ? 'rgba(239,68,68,0.25)' : t.borderPrimary}`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: `1px solid ${t.borderPrimary}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isOverLimit ? 'rgba(239,68,68,0.06)' : t.columnHeaderBg }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${isOverLimit ? '#ef4444' : col.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${isOverLimit ? '#ef4444' : col.color}30` }}>
                    <ColIcon size={13} color={isOverLimit ? '#ef4444' : col.color} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: isOverLimit ? '#ef4444' : t.textPrimary, letterSpacing: -0.2 }}>{col.title}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isOverLimit ? '#ef4444' : t.textMuted, background: isOverLimit ? 'rgba(239,68,68,0.12)' : t.bgTertiary, padding: '2px 9px', borderRadius: 6, border: `1px solid ${isOverLimit ? 'rgba(239,68,68,0.2)' : t.borderPrimary}` }}>{itemCount}</span>
                </div>
                {col.wipLimit > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ fontSize: 10, fontWeight: 600, color: isOverLimit ? '#ef4444' : t.textMuted, padding: '2px 7px', borderRadius: 5, background: isOverLimit ? 'rgba(239,68,68,0.1)' : 'transparent' }}>WIP {itemCount}/{col.wipLimit}</span>{isOverLimit && <FiAlertTriangle size={12} color="#ef4444" />}</div>}
              </div>
              <div className="board-column-scroll" style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', minHeight: 80 }}>
                {loading ? renderSkeleton() : swimlanes.map(lane => {
                  const laneItems = getItemsBySwimlane(col.id, lane === 'Unassigned' ? null : lane);
                  if (laneItems.length === 0 && colIdx !== 0) return null;
                  const isCollapsed = collapsedSwimlanes[lane] || false;
                  return (
                    <div key={lane} style={{ marginBottom: 2 }}>
                      {colIdx === 0 && (
                        <button onClick={() => toggleSwimlane(lane)} className="swimlane-toggle" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, border: `1px solid ${t.borderPrimary}`, background: t.swimlaneBg, color: t.textSecondary, fontSize: 11, fontWeight: 600, cursor: 'pointer', width: '100%', marginBottom: 8, letterSpacing: 0.3 }}>
                          {isCollapsed ? <FiChevronRight size={12} /> : <FiChevronDown size={12} />}
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: lane === 'Unassigned' ? t.bgCardHover : t.accentGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: lane === 'Unassigned' ? t.textMuted : '#fff', fontWeight: 700, flexShrink: 0 }}>
                            {lane === 'Unassigned' ? '?' : lane.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <span style={{ flex: 1, textAlign: 'left' }}>{lane}</span>
                          <span style={{ fontSize: 10, color: t.textMuted, background: t.bgTertiary, padding: '1px 7px', borderRadius: 5 }}>{workItems.filter(i => lane === 'Unassigned' ? !i.assignee : i.assignee === lane).length}</span>
                        </button>
                      )}
                      {!isCollapsed && laneItems.map(item => renderCard(item, colIdx))}
                      {colIdx === 0 && isCollapsed && laneItems.length > 0 && <div style={{ fontSize: 11, color: t.textMuted, padding: '6px 10px', textAlign: 'center', background: t.bgTertiary, borderRadius: 8, fontStyle: 'italic' }}>{laneItems.length} item{laneItems.length !== 1 ? 's' : ''} collapsed</div>}
                    </div>
                  );
                })}
                {!loading && allItemsInCol.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 16px', color: isDragTarget ? t.accentPrimary : t.textMuted, fontSize: 12, border: `2px dashed ${isDragTarget ? t.accentPrimary : t.borderPrimary}`, borderRadius: 12, background: isDragTarget ? `${t.accentPrimary}08` : 'transparent', transition: 'all 0.2s' }}>
                    <FiLayout size={20} style={{ marginBottom: 6, opacity: 0.5 }} /><br />{isDragTarget ? 'Drop here' : 'No items'}
                  </div>
                )}
                <div style={{ marginTop: 8 }}>
                  {quickAddCol === col.id ? (
                    <form onSubmit={e => { e.preventDefault(); handleQuickAdd(col.id); }} style={{ display: 'flex', gap: 6 }}>
                      <input autoFocus value={quickAddTitle} onChange={e => setQuickAddTitle(e.target.value)} placeholder="Title..." className="board-input" style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: `1px solid ${t.borderSecondary}`, background: t.bgInput, color: t.textPrimary, fontSize: 12, outline: 'none' }} onKeyDown={e => { if (e.key === 'Escape') { setQuickAddCol(null); setQuickAddTitle(''); } }} />
                      <button type="submit" style={{ padding: '4px 10px', borderRadius: 8, border: 'none', background: t.accentPrimary, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Add</button>
                      <button type="button" onClick={() => { setQuickAddCol(null); setQuickAddTitle(''); }} style={{ padding: '4px 8px', borderRadius: 8, border: `1px solid ${t.borderSecondary}`, background: 'transparent', color: t.textMuted, fontSize: 11, cursor: 'pointer' }}>×</button>
                    </form>
                  ) : (
                    <button onClick={() => { setQuickAddCol(col.id); setQuickAddTitle(''); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '7px 12px', borderRadius: 8, border: `1px dashed ${t.borderSecondary}`, background: 'transparent', color: t.textMuted, fontSize: 11, cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = t.accentPrimary; e.currentTarget.style.color = t.accentPrimary; }} onMouseLeave={e => { e.currentTarget.style.borderColor = t.borderSecondary; e.currentTarget.style.color = t.textMuted; }}>
                      <FiPlus size={12} /> Quick Add
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(showAddModal || showEditModal) && (
        <div onClick={closeModal} style={{ position: 'fixed', inset: 0, background: t.bgOverlay, backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, animation: 'fadeIn 0.2s ease' }}>
          <div onClick={e => e.stopPropagation()} className="board-modal-content board-scroll" style={{ width: '100%', maxWidth: 560, maxHeight: '88vh', overflowY: 'auto', background: t.bgElevated, borderRadius: 18, border: `1px solid ${t.borderSecondary}`, boxShadow: t.shadowXl, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${t.borderPrimary}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: t.accentGradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {showEditModal ? <FiEdit2 size={16} color="#fff" /> : <FiPlus size={18} color="#fff" />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: t.textPrimary }}>{showEditModal ? 'Edit Work Item' : 'Create Work Item'}</h3>
                  {showEditModal && <span style={{ fontSize: 11, color: t.textMuted, fontFamily: 'monospace' }}>WI-{showEditModal.workItemId}</span>}
                </div>
              </div>
              <button onClick={closeModal} className="icon-btn-hover" style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${t.borderPrimary}`, background: t.bgTertiary, color: t.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiX size={16} /></button>
            </div>
            {modalForm}
          </div>
        </div>
      )}
    </div>
  );
}
