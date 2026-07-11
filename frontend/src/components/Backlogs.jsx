import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FiList, FiPlus, FiSearch, FiArrowUp, FiArrowDown, FiMinus,
  FiEdit2, FiTrash2, FiX, FiChevronRight, FiChevronDown,
  FiFilter, FiBarChart2, FiTarget
} from 'react-icons/fi';
import api from '../api';
import { toast } from 'react-toastify';

const TYPE_COLORS = {
  Epic: '#8b5cf6',
  Feature: '#6366f1',
  'User Story': '#3b82f6',
  Task: '#f59e0b',
  Bug: '#ef4444',
  Issue: '#f97316',
  'Test Case': '#10b981',
};

const PRIORITY_COLORS = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#6b7280',
};

const PRIORITY_LABELS = { 1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low' };

const ALL_TYPES = ['Epic', 'Feature', 'User Story', 'Task', 'Bug', 'Issue', 'Test Case'];

const CHILD_TYPES = {
  Epic: ['Feature'],
  Feature: ['User Story', 'Bug'],
  'User Story': ['Task', 'Bug', 'Test Case'],
  Task: [],
  Bug: ['Task'],
  Issue: ['Task'],
  'Test Case': [],
};

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function flattenTree(nodes, depth = 0) {
  const result = [];
  for (const node of nodes) {
    result.push({ ...node, _depth: depth });
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children, depth + 1));
    }
  }
  return result;
}

function filterTree(nodes, predicate) {
  const result = [];
  for (const node of nodes) {
    const childResults = node.children ? filterTree(node.children, predicate) : [];
    if (predicate(node) || childResults.length > 0) {
      result.push({ ...node, children: childResults.length > 0 ? childResults : node.children });
    }
  }
  return result;
}

function sortTree(nodes, sortBy) {
  const sorted = [...nodes].sort((a, b) => {
    if (sortBy === 'priority') {
      return (a.priority || 4) - (b.priority || 4);
    }
    if (sortBy === 'storyPoints') {
      return (b.storyPoints || 0) - (a.storyPoints || 0);
    }
    if (sortBy === 'title') {
      return (a.title || '').localeCompare(b.title || '');
    }
    if (sortBy === 'date') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
    return 0;
  });
  return sorted.map(node => ({
    ...node,
    children: node.children ? sortTree(node.children, sortBy) : [],
  }));
}

function countByType(nodes) {
  const counts = {};
  for (const node of nodes) {
    counts[node.type] = (counts[node.type] || 0) + 1;
    if (node.children) {
      const childCounts = countByType(node.children);
      for (const [t, c] of Object.entries(childCounts)) {
        counts[t] = (counts[t] || 0) + c;
      }
    }
  }
  return counts;
}

function sumStoryPoints(nodes) {
  let total = 0;
  for (const node of nodes) {
    total += node.storyPoints || 0;
    if (node.children) {
      total += sumStoryPoints(node.children);
    }
  }
  return total;
}

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

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-secondary, rgba(203,213,225,0.85))',
  marginBottom: 5,
};

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
};

const gradBtn = {
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

const smallBtn = {
  width: 28,
  height: 28,
  borderRadius: 6,
  border: 'none',
  background: 'transparent',
  color: 'var(--text-muted, rgba(148,163,184,0.55))',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const deleteBtn = {
  ...smallBtn,
  color: '#ef4444',
};

export default function Backlogs({ projectId }) {
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('priority');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [parentForChild, setParentForChild] = useState(null);
  const [velocity, setVelocity] = useState(null);

  const defaultForm = {
    title: '',
    type: 'Task',
    priority: 3,
    status: 'Backlog',
    assignee: '',
    storyPoints: 0,
    effort: '',
    remainingWork: '',
    description: '',
    acceptanceCriteria: '',
    areaPath: '',
    iterationPath: '',
    activity: '',
    severity: '',
    tags: '',
  };

  const [form, setForm] = useState(defaultForm);

  const fetchHierarchy = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await api.getWorkItemHierarchy(projectId);
      if (res.success) setHierarchy(res.data || []);
    } catch {
      toast.error('Failed to load backlog hierarchy');
    }
    setLoading(false);
  }, [projectId]);

  const fetchVelocity = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await api.getVelocity(projectId);
      if (res.success && res.data) setVelocity(res.data);
    } catch {
      // velocity is optional
    }
  }, [projectId]);

  useEffect(() => {
    fetchHierarchy();
    fetchVelocity();
  }, [fetchHierarchy, fetchVelocity]);

  const filteredHierarchy = useMemo(() => {
    let result = hierarchy;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = filterTree(result, node =>
        (node.title || '').toLowerCase().includes(term)
      );
    }

    if (typeFilter !== 'All') {
      result = filterTree(result, node => node.type === typeFilter);
    }

    result = sortTree(result, sortBy);

    return result;
  }, [hierarchy, searchTerm, typeFilter, sortBy]);

  const flatVisible = useMemo(() => flattenTree(filteredHierarchy), [filteredHierarchy]);
  const visibleCounts = useMemo(() => countByType(flatVisible), [flatVisible]);
  const visiblePoints = useMemo(() => sumStoryPoints(flatVisible), [flatVisible]);
  const allCounts = useMemo(() => countByType(hierarchy), [hierarchy]);
  const allPoints = useMemo(() => sumStoryPoints(hierarchy), [hierarchy]);

  const toggleExpand = (id) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all = {};
    const walk = (nodes) => {
      for (const n of nodes) {
        if (n.children && n.children.length > 0) {
          all[n._id || n.id] = true;
          walk(n.children);
        }
      }
    };
    walk(filteredHierarchy);
    setExpandedIds(all);
  };

  const collapseAll = () => setExpandedIds({});

  const openCreateRoot = () => {
    setEditItem(null);
    setParentForChild(null);
    setForm({ ...defaultForm });
    setShowModal(true);
  };

  const openCreateChild = (parent) => {
    setEditItem(null);
    setParentForChild(parent);
    const allowed = CHILD_TYPES[parent.type] || [];
    const defaultChildType = allowed.length > 0 ? allowed[0] : 'Task';
    setForm({ ...defaultForm, type: defaultChildType });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setParentForChild(null);
    setForm({
      title: item.title || '',
      type: item.type || 'Task',
      priority: item.priority || 3,
      status: item.status || 'Backlog',
      assignee: item.assignee || '',
      storyPoints: item.storyPoints || 0,
      effort: item.effort || '',
      remainingWork: item.remainingWork || '',
      description: item.description || '',
      acceptanceCriteria: item.acceptanceCriteria || '',
      areaPath: item.areaPath || '',
      iterationPath: item.iterationPath || '',
      activity: item.activity || '',
      severity: item.severity || '',
      tags: item.tags || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        const res = await api.updateWorkItem(editItem._id, form);
        if (res.success) {
          toast.success('Work item updated');
          await fetchHierarchy();
        }
      } else {
        const payload = {
          ...form,
          projectId,
          parentId: parentForChild ? (parentForChild._id || parentForChild.id) : undefined,
        };
        const res = await api.createWorkItem(payload);
        if (res.success) {
          toast.success(parentForChild ? 'Child item created' : 'Work item created');
          await fetchHierarchy();
        }
      }
      setShowModal(false);
      setEditItem(null);
      setParentForChild(null);
    } catch {
      toast.error('Failed to save work item');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this work item and all its children?')) return;
    try {
      await api.deleteWorkItem(id);
      toast.success('Deleted');
      await fetchHierarchy();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleTypeChange = (newType) => {
    setForm(p => ({ ...p, type: newType }));
  };

  const allowedChildTypes = parentForChild ? (CHILD_TYPES[parentForChild.type] || []) : [];

  const estimatedVelocity = useMemo(() => {
    if (velocity && velocity.averageVelocity) return velocity.averageVelocity;
    return null;
  }, [velocity]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.22)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiList size={19} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', letterSpacing: -0.3 }}>
                Backlog
              </h1>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-muted, rgba(148,163,184,0.55))' }}>
                {flatVisible.length} items &middot; {visiblePoints} story points
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.06))', background: 'var(--card-bg, rgba(255,255,255,0.02))', color: 'var(--text-primary, #f1f5f9)', fontSize: 13, outline: 'none' }}
            >
              <option value="All">All Types</option>
              {ALL_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.06))', background: 'var(--card-bg, rgba(255,255,255,0.02))', color: 'var(--text-primary, #f1f5f9)', fontSize: 13, outline: 'none' }}
            >
              <option value="priority">Sort: Priority</option>
              <option value="storyPoints">Sort: Story Points</option>
              <option value="title">Sort: Title</option>
              <option value="date">Sort: Date</option>
            </select>
            <div style={{ position: 'relative' }}>
              <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, rgba(148,163,184,0.55))' }} />
              <input
                placeholder="Search items..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ padding: '8px 12px 8px 34px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.06))', background: 'var(--card-bg, rgba(255,255,255,0.02))', color: 'var(--text-primary, #f1f5f9)', fontSize: 13, outline: 'none', width: 180 }}
              />
            </div>
            <button onClick={openCreateRoot} style={gradBtn}>
              <FiPlus size={14} /> New Item
            </button>
          </div>
        </div>
      </div>

      {/* Forecasting Bar */}
      <div style={{ padding: '12px 32px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiTarget size={14} style={{ color: '#818cf8' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, rgba(203,213,225,0.85))' }}>
            Total Points:
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>
            {allPoints}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiBarChart2 size={14} style={{ color: '#818cf8' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, rgba(203,213,225,0.85))' }}>
            Est. Velocity:
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: estimatedVelocity ? '#818cf8' : 'var(--text-muted, rgba(148,163,184,0.55))' }}>
            {estimatedVelocity ? `${estimatedVelocity} pts/sprint` : 'No data'}
          </span>
        </div>
        {estimatedVelocity > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, rgba(203,213,225,0.85))' }}>
              Sprints Remaining:
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>
              {Math.ceil(allPoints / estimatedVelocity)}
            </span>
          </div>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={expandAll} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', background: 'transparent', color: 'var(--text-muted, rgba(148,163,184,0.55))', fontSize: 11, cursor: 'pointer' }}>
            Expand All
          </button>
          <button onClick={collapseAll} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', background: 'transparent', color: 'var(--text-muted, rgba(148,163,184,0.55))', fontSize: 11, cursor: 'pointer' }}>
            Collapse All
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div style={{ padding: '10px 32px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted, rgba(148,163,184,0.55))', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Visible:
        </span>
        {ALL_TYPES.map(t => (
          (visibleCounts[t] || 0) > 0 && (
            <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, padding: '2px 8px', borderRadius: 6, background: `${TYPE_COLORS[t]}15`, color: TYPE_COLORS[t] }}>
              {visibleCounts[t]} {t}{visibleCounts[t] !== 1 ? 's' : ''}
            </span>
          )
        ))}
        <span style={{ fontSize: 12, fontWeight: 600, color: '#818cf8', marginLeft: 'auto' }}>
          {visiblePoints} pts
        </span>
      </div>

      {/* Tree Content */}
      <div style={{ flex: 1, padding: '16px 32px', overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted, rgba(148,163,184,0.55))', fontSize: 13 }}>
            Loading backlog...
          </div>
        ) : filteredHierarchy.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#818cf8' }}>
              <FiList size={24} />
            </div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary, #f1f5f9)' }}>No backlog items</p>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-muted, rgba(148,163,184,0.55))' }}>
              Create a root work item to get started
            </p>
            <button onClick={openCreateRoot} style={{ ...gradBtn, margin: '16px auto 0' }}>
              <FiPlus size={14} /> Create Item
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {flattenTree(filteredHierarchy).map(item => {
              const depth = item._depth;
              const id = item._id || item.id;
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedIds[id];
              const typeColor = TYPE_COLORS[item.type] || '#6b7280';
              const priorityColor = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS[4];
              const priorityLabel = PRIORITY_LABELS[item.priority] || 'Low';
              const initials = getInitials(item.assignee);

              return (
                <div
                  key={id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'var(--card-bg, rgba(255,255,255,0.02))',
                    border: '1px solid var(--border-color, rgba(255,255,255,0.04))',
                    marginLeft: depth * 24,
                    borderLeft: `3px solid ${typeColor}`,
                    transition: 'background 0.15s',
                    gap: 10,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--card-hover, rgba(255,255,255,0.04))'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--card-bg, rgba(255,255,255,0.02))'; }}
                >
                  {/* Expand/Collapse Arrow */}
                  <div
                    onClick={() => hasChildren && toggleExpand(id)}
                    style={{
                      width: 20,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: hasChildren ? 'pointer' : 'default',
                      color: hasChildren ? 'var(--text-muted, rgba(148,163,184,0.55))' : 'transparent',
                      flexShrink: 0,
                    }}
                  >
                    {hasChildren && (
                      isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />
                    )}
                  </div>

                  {/* Type Badge */}
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 4,
                    background: `${typeColor}18`,
                    color: typeColor,
                    flexShrink: 0,
                    textTransform: 'uppercase',
                    letterSpacing: 0.3,
                  }}>
                    {item.type}
                  </span>

                  {/* Title */}
                  <span style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--text-primary, #f1f5f9)',
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {item.title}
                  </span>

                  {/* Priority Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                    {item.priority === 1 && <FiArrowUp size={11} style={{ color: priorityColor }} />}
                    {item.priority === 2 && <FiArrowUp size={11} style={{ color: priorityColor }} />}
                    {item.priority === 3 && <FiMinus size={11} style={{ color: priorityColor }} />}
                    {item.priority === 4 && <FiArrowDown size={11} style={{ color: priorityColor }} />}
                    <span style={{ fontSize: 11, fontWeight: 600, color: priorityColor }}>
                      {priorityLabel}
                    </span>
                  </div>

                  {/* Story Points Pill */}
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 10px',
                    borderRadius: 10,
                    background: 'rgba(99,102,241,0.12)',
                    color: '#818cf8',
                    flexShrink: 0,
                    minWidth: 28,
                    textAlign: 'center',
                  }}>
                    {item.storyPoints || 0}
                  </span>

                  {/* Assignee Avatar */}
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: item.assignee ? `linear-gradient(135deg, ${typeColor}, ${typeColor}cc)` : 'var(--card-hover, rgba(255,255,255,0.06))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: '1.5px solid var(--border-color, rgba(255,255,255,0.08))',
                  }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: item.assignee ? '#fff' : 'var(--text-muted, rgba(148,163,184,0.55))' }}>
                      {item.assignee ? initials : '?'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0, opacity: 0.6, transition: 'opacity 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; }}
                  >
                    {allowedChildTypes.length > 0 || CHILD_TYPES[item.type]?.length > 0 ? (
                      <button
                        onClick={() => openCreateChild(item)}
                        title="Add child"
                        style={{ ...smallBtn, color: '#818cf8' }}
                      >
                        <FiPlus size={13} />
                      </button>
                    ) : null}
                    <button onClick={() => openEdit(item)} title="Edit" style={smallBtn}>
                      <FiEdit2 size={13} />
                    </button>
                    <button onClick={() => handleDelete(id)} title="Delete" style={deleteBtn}>
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          onClick={() => { setShowModal(false); setEditItem(null); setParentForChild(null); }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 520,
              maxHeight: '85vh',
              background: 'var(--surface-elevated, #1e293b)',
              borderRadius: 16,
              border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
              boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
              padding: 24,
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>
                  {editItem ? 'Edit Work Item' : parentForChild ? `Add Child to ${parentForChild.type}` : 'Create Work Item'}
                </h3>
                {parentForChild && (
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted, rgba(148,163,184,0.55))' }}>
                    Parent: {parentForChild.title}
                  </p>
                )}
              </div>
              <button
                onClick={() => { setShowModal(false); setEditItem(null); setParentForChild(null); }}
                style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'var(--card-hover, rgba(255,255,255,0.04))', color: 'var(--text-muted, rgba(148,163,184,0.55))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <FiX size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Title */}
              <div>
                <label style={labelStyle}>Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  required
                  autoFocus
                  placeholder="Enter work item title"
                  style={inputStyle}
                />
              </div>

              {/* Type & Priority */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select
                    value={form.type}
                    onChange={e => handleTypeChange(e.target.value)}
                    style={selectStyle}
                    disabled={!!parentForChild}
                  >
                    {parentForChild ? (
                      allowedChildTypes.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))
                    ) : (
                      ALL_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(p => ({ ...p, priority: parseInt(e.target.value) }))}
                    style={selectStyle}
                  >
                    <option value={1}>1 - Critical</option>
                    <option value={2}>2 - High</option>
                    <option value={3}>3 - Medium</option>
                    <option value={4}>4 - Low</option>
                  </select>
                </div>
              </div>

              {/* Assignee & Story Points */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Assignee</label>
                  <input
                    value={form.assignee}
                    onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))}
                    placeholder="Assignee name"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Story Points</label>
                  <input
                    type="number"
                    min="0"
                    value={form.storyPoints}
                    onChange={e => setForm(p => ({ ...p, storyPoints: parseInt(e.target.value) || 0 }))}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Effort & Remaining Work */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Effort</label>
                  <input
                    type="number"
                    min="0"
                    value={form.effort}
                    onChange={e => setForm(p => ({ ...p, effort: e.target.value }))}
                    placeholder="Hours"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Remaining Work</label>
                  <input
                    type="number"
                    min="0"
                    value={form.remainingWork}
                    onChange={e => setForm(p => ({ ...p, remainingWork: e.target.value }))}
                    placeholder="Hours"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label style={labelStyle}>Tags</label>
                <input
                  value={form.tags}
                  onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                  placeholder="Comma-separated tags"
                  style={inputStyle}
                />
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  placeholder="Detailed description..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {/* Acceptance Criteria */}
              <div>
                <label style={labelStyle}>Acceptance Criteria</label>
                <textarea
                  value={form.acceptanceCriteria}
                  onChange={e => setForm(p => ({ ...p, acceptanceCriteria: e.target.value }))}
                  rows={2}
                  placeholder="Acceptance criteria..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditItem(null); setParentForChild(null); }}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.08))', background: 'transparent', color: 'var(--text-secondary, rgba(203,213,225,0.85))', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button type="submit" style={{ ...gradBtn, padding: '8px 20px' }}>
                  {editItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
