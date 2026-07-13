import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FiList, FiPlus, FiSearch, FiArrowUp, FiArrowDown, FiMinus,
  FiEdit2, FiTrash2, FiX, FiChevronRight, FiChevronDown,
  FiFilter, FiBarChart2, FiTarget, FiSun, FiMoon, FiTag,
  FiClock, FiUser, FiHash, FiZap, FiCheckCircle, FiLayers,
  FiMaximize2, FiMinimize2, FiAlertCircle, FiGitBranch,
  FiTrendingUp, FiActivity, FiCalendar
} from 'react-icons/fi';
import api from '../api';
import { toast } from 'react-toastify';

/* ═══════════════════ Theme System ═══════════════════ */
const themes = {
  dark: {
    bgPrimary: '#0b0e14',
    bgSecondary: '#12151e',
    bgTertiary: '#181c28',
    bgCard: '#151924',
    bgCardHover: '#1c2133',
    bgElevated: '#1a1f2e',
    bgInput: '#12151e',
    bgOverlay: 'rgba(0, 0, 0, 0.7)',
    bgGlass: 'rgba(18, 21, 30, 0.85)',

    textPrimary: '#e4e7ed',
    textSecondary: '#8b92a8',
    textMuted: '#525972',
    textInverse: '#0b0e14',

    borderPrimary: 'rgba(255, 255, 255, 0.05)',
    borderSecondary: 'rgba(255, 255, 255, 0.09)',
    borderHover: 'rgba(255, 255, 255, 0.14)',
    borderFocus: 'rgba(99, 102, 241, 0.55)',

    accentPrimary: '#6366f1',
    accentSecondary: '#818cf8',
    accentGradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    accentGlow: 'rgba(99, 102, 241, 0.18)',
    accentSoft: 'rgba(99, 102, 241, 0.08)',

    successColor: '#34d399',
    warningColor: '#fbbf24',
    dangerColor: '#f87171',

    shadowSm: '0 1px 3px rgba(0, 0, 0, 0.35)',
    shadowMd: '0 4px 20px rgba(0, 0, 0, 0.35)',
    shadowLg: '0 16px 48px rgba(0, 0, 0, 0.45)',
    shadowXl: '0 28px 72px rgba(0, 0, 0, 0.55)',
    shadowGlow: '0 0 20px rgba(99, 102, 241, 0.15)',

    scrollThumb: 'rgba(255, 255, 255, 0.07)',
    scrollThumbHover: 'rgba(255, 255, 255, 0.14)',

    rowEven: 'rgba(255, 255, 255, 0.01)',
    rowOdd: 'transparent',
    rowHover: 'rgba(99, 102, 241, 0.04)',
  },
  light: {
    bgPrimary: '#f3f4f8',
    bgSecondary: '#ffffff',
    bgTertiary: '#f8f9fc',
    bgCard: '#ffffff',
    bgCardHover: '#f0f1ff',
    bgElevated: '#ffffff',
    bgInput: '#f5f6fa',
    bgOverlay: 'rgba(15, 23, 42, 0.45)',
    bgGlass: 'rgba(255, 255, 255, 0.92)',

    textPrimary: '#1a1d2e',
    textSecondary: '#5c6178',
    textMuted: '#9aa0b4',
    textInverse: '#ffffff',

    borderPrimary: 'rgba(0, 0, 0, 0.06)',
    borderSecondary: 'rgba(0, 0, 0, 0.1)',
    borderHover: 'rgba(0, 0, 0, 0.16)',
    borderFocus: 'rgba(99, 102, 241, 0.5)',

    accentPrimary: '#6366f1',
    accentSecondary: '#4f46e5',
    accentGradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    accentGlow: 'rgba(99, 102, 241, 0.12)',
    accentSoft: 'rgba(99, 102, 241, 0.06)',

    successColor: '#10b981',
    warningColor: '#f59e0b',
    dangerColor: '#ef4444',

    shadowSm: '0 1px 3px rgba(0, 0, 0, 0.05)',
    shadowMd: '0 4px 20px rgba(0, 0, 0, 0.07)',
    shadowLg: '0 16px 48px rgba(0, 0, 0, 0.1)',
    shadowXl: '0 28px 72px rgba(0, 0, 0, 0.14)',
    shadowGlow: '0 0 20px rgba(99, 102, 241, 0.08)',

    scrollThumb: 'rgba(0, 0, 0, 0.1)',
    scrollThumbHover: 'rgba(0, 0, 0, 0.2)',

    rowEven: 'rgba(0, 0, 0, 0.015)',
    rowOdd: 'transparent',
    rowHover: 'rgba(99, 102, 241, 0.04)',
  },
};

/* ═══════════════════ Constants ═══════════════════ */
const TYPE_COLORS = {
  Epic: '#8b5cf6',
  Feature: '#6366f1',
  'User Story': '#3b82f6',
  Task: '#f59e0b',
  Bug: '#ef4444',
  Issue: '#f97316',
  'Test Case': '#10b981',
};

const TYPE_ICONS = {
  Epic: '⚡',
  Feature: '✨',
  'User Story': '📖',
  Task: '✅',
  Bug: '🐛',
  Issue: '⚠️',
  'Test Case': '🧪',
};

const PRIORITY_COLORS = { 1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#6b7280' };
const PRIORITY_LABELS = { 1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low' };
const PRIORITY_ICONS = { 1: '🔴', 2: '🟠', 3: '🟡', 4: '⚪' };

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

const STATUS_COLORS = {
  Backlog: '#94a3b8',
  'To Do': '#60a5fa',
  'In Progress': '#fbbf24',
  Review: '#a78bfa',
  Done: '#34d399',
};

/* ═══════════════════ Utilities ═══════════════════ */
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function flattenTree(nodes, depth = 0, parentExpanded = true) {
  const result = [];
  for (const node of nodes) {
    result.push({ ...node, _depth: depth, _visible: parentExpanded });
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children, depth + 1, parentExpanded));
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
    if (sortBy === 'priority') return (a.priority || 4) - (b.priority || 4);
    if (sortBy === 'storyPoints') return (b.storyPoints || 0) - (a.storyPoints || 0);
    if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
    if (sortBy === 'date') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    if (sortBy === 'status') {
      const order = ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'];
      return order.indexOf(a.status) - order.indexOf(b.status);
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
      for (const [tp, c] of Object.entries(childCounts)) {
        counts[tp] = (counts[tp] || 0) + c;
      }
    }
  }
  return counts;
}

function sumStoryPoints(nodes) {
  let total = 0;
  for (const node of nodes) {
    total += node.storyPoints || 0;
    if (node.children) total += sumStoryPoints(node.children);
  }
  return total;
}

function countAllItems(nodes) {
  let total = 0;
  for (const node of nodes) {
    total += 1;
    if (node.children) total += countAllItems(node.children);
  }
  return total;
}

/* ═══════════════════ CSS Injection ═══════════════════ */
const injectStyles = (theme) => {
  const styleId = 'backlog-styles';
  let el = document.getElementById(styleId);
  if (!el) { el = document.createElement('style'); el.id = styleId; document.head.appendChild(el); }
  el.textContent = `
    .bl-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
    .bl-scroll::-webkit-scrollbar-track { background: transparent; }
    .bl-scroll::-webkit-scrollbar-thumb { background: ${theme.scrollThumb}; border-radius: 3px; }
    .bl-scroll::-webkit-scrollbar-thumb:hover { background: ${theme.scrollThumbHover}; }
    .bl-row { transition: all 0.15s ease; }
    .bl-row:hover { background: ${theme.rowHover} !important; }
    .bl-row:hover .bl-actions { opacity: 1 !important; }
    .bl-btn { transition: all 0.15s ease; }
    .bl-btn:hover { transform: scale(1.05); }
    .bl-btn:active { transform: scale(0.97); }
    .bl-icon-btn { transition: all 0.12s ease; border-radius: 7px; }
    .bl-icon-btn:hover { background: ${theme.bgCardHover} !important; }
    .bl-input { transition: border-color 0.2s ease, box-shadow 0.2s ease; }
    .bl-input:focus { border-color: ${theme.borderFocus} !important; box-shadow: 0 0 0 3px ${theme.accentGlow} !important; }
    .bl-modal-content { animation: blModalIn 0.28s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes blModalIn { from { opacity: 0; transform: translateY(16px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes blFadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes blSlideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 200px; } }
    @keyframes blPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    @keyframes blShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    .bl-skeleton {
      background: linear-gradient(90deg, ${theme.bgTertiary} 25%, ${theme.bgCardHover} 50%, ${theme.bgTertiary} 75%);
      background-size: 200% 100%;
      animation: blShimmer 1.5s infinite;
      border-radius: 8px;
    }
    .bl-chip { transition: all 0.12s ease; }
    .bl-chip:hover { transform: translateY(-1px); box-shadow: ${theme.shadowSm}; }
    .bl-expand-btn { transition: all 0.12s ease; }
    .bl-expand-btn:hover { color: ${theme.accentSecondary} !important; }
    .bl-tree-connector { position: relative; }
    .bl-tree-connector::before {
      content: '';
      position: absolute;
      left: -12px;
      top: 0;
      bottom: 50%;
      width: 1px;
      background: ${theme.borderSecondary};
    }
    .bl-tree-connector::after {
      content: '';
      position: absolute;
      left: -12px;
      top: 50%;
      width: 10px;
      height: 1px;
      background: ${theme.borderSecondary};
    }
    .bl-stat-card { transition: all 0.2s ease; }
    .bl-stat-card:hover { transform: translateY(-2px); box-shadow: ${theme.shadowMd}; }
    .bl-filter-pill { transition: all 0.15s ease; cursor: pointer; }
    .bl-filter-pill:hover { transform: translateY(-1px); }
    .bl-progress-bar { transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
  `;
};

/* ═══════════════════ Component ═══════════════════ */
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
  const [showFilters, setShowFilters] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
  });

  const t = isDarkMode ? themes.dark : themes.light;

  useEffect(() => { injectStyles(t); }, [t]);
  useEffect(() => { localStorage.setItem('theme', isDarkMode ? 'dark' : 'light'); document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light'); }, [isDarkMode]);

  const defaultForm = {
    title: '', type: 'Task', priority: 3, status: 'Backlog',
    assignee: '', storyPoints: 0, effort: '', remainingWork: '',
    description: '', acceptanceCriteria: '', areaPath: '',
    iterationPath: '', activity: '', severity: '', tags: '',
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
    } catch { /* velocity is optional */ }
  }, [projectId]);

  useEffect(() => { fetchHierarchy(); fetchVelocity(); }, [fetchHierarchy, fetchVelocity]);

  /* ─── Filtering & Sorting ─── */
  const filteredHierarchy = useMemo(() => {
    let result = hierarchy;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = filterTree(result, node =>
        (node.title || '').toLowerCase().includes(term) ||
        (node.description || '').toLowerCase().includes(term) ||
        (node.assignee || '').toLowerCase().includes(term) ||
        (`WI-${node.workItemId}`).toLowerCase().includes(term)
      );
    }
    if (typeFilter !== 'All') result = filterTree(result, node => node.type === typeFilter);
    if (priorityFilter !== 'All') result = filterTree(result, node => node.priority === parseInt(priorityFilter));
    if (statusFilter !== 'All') result = filterTree(result, node => node.status === statusFilter);
    result = sortTree(result, sortBy);
    return result;
  }, [hierarchy, searchTerm, typeFilter, priorityFilter, statusFilter, sortBy]);

  const flatVisible = useMemo(() => flattenTree(filteredHierarchy), [filteredHierarchy]);
  const visibleCounts = useMemo(() => countByType(flatVisible), [flatVisible]);
  const visiblePoints = useMemo(() => sumStoryPoints(flatVisible), [flatVisible]);
  const allCounts = useMemo(() => countByType(hierarchy), [hierarchy]);
  const allPoints = useMemo(() => sumStoryPoints(hierarchy), [hierarchy]);
  const totalItems = useMemo(() => countAllItems(hierarchy), [hierarchy]);

  const activeFilterCount = [
    typeFilter !== 'All' ? 1 : 0,
    priorityFilter !== 'All' ? 1 : 0,
    statusFilter !== 'All' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  /* ─── Stats ─── */
  const stats = useMemo(() => {
    const doneCount = flatVisible.filter(i => i.status === 'Done').length;
    const inProgressCount = flatVisible.filter(i => i.status === 'In Progress').length;
    const total = flatVisible.length;
    const completionRate = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    return { doneCount, inProgressCount, total, completionRate };
  }, [flatVisible]);

  const estimatedVelocity = useMemo(() => {
    if (velocity && velocity.averageVelocity) return velocity.averageVelocity;
    return null;
  }, [velocity]);

  /* ─── Tree operations ─── */
  const toggleExpand = (id) => setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));

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

  /* ─── CRUD operations ─── */
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
    setForm({ ...defaultForm, type: allowed.length > 0 ? allowed[0] : 'Task' });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setParentForChild(null);
    setForm({
      title: item.title || '', type: item.type || 'Task',
      priority: item.priority || 3, status: item.status || 'Backlog',
      assignee: item.assignee || '', storyPoints: item.storyPoints || 0,
      effort: item.effort || '', remainingWork: item.remainingWork || '',
      description: item.description || '', acceptanceCriteria: item.acceptanceCriteria || '',
      areaPath: item.areaPath || '', iterationPath: item.iterationPath || '',
      activity: item.activity || '', severity: item.severity || '',
      tags: item.tags || '',
    });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditItem(null); setParentForChild(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        const res = await api.updateWorkItem(editItem._id, form);
        if (res.success) { toast.success('Work item updated'); await fetchHierarchy(); }
      } else {
        const payload = {
          ...form, projectId,
          parentId: parentForChild ? (parentForChild._id || parentForChild.id) : undefined,
        };
        const res = await api.createWorkItem(payload);
        if (res.success) {
          toast.success(parentForChild ? 'Child item created' : 'Work item created');
          await fetchHierarchy();
        }
      }
      closeModal();
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

  const clearAllFilters = () => {
    setTypeFilter('All');
    setPriorityFilter('All');
    setStatusFilter('All');
    setSearchTerm('');
  };

  const allowedChildTypes = parentForChild ? (CHILD_TYPES[parentForChild.type] || []) : [];

  /* ═══════════════════ Skeleton ═══════════════════ */
  const renderSkeletons = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0' }}>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="bl-skeleton"
          style={{ height: 48, marginLeft: (i % 3) * 24, opacity: 1 - (i * 0.08) }}
        />
      ))}
    </div>
  );

  /* ═══════════════════ Stats Cards ═══════════════════ */
  const renderStatsCards = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 4 }}>
      {[
        {
          icon: FiLayers, label: 'Total Items', value: totalItems,
          color: t.accentPrimary, bg: t.accentSoft
        },
        {
          icon: FiTarget, label: 'Story Points', value: allPoints,
          color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)'
        },
        {
          icon: FiCheckCircle, label: 'Completed', value: `${stats.completionRate}%`,
          color: t.successColor, bg: `${t.successColor}12`
        },
        {
          icon: FiTrendingUp, label: 'Velocity', value: estimatedVelocity ? `${estimatedVelocity}/sprint` : 'N/A',
          color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)'
        },
        {
          icon: FiCalendar, label: 'Sprints Left',
          value: estimatedVelocity > 0 ? Math.ceil(allPoints / estimatedVelocity) : '—',
          color: t.warningColor, bg: `${t.warningColor}12`
        },
      ].map((stat, i) => (
        <div key={i} className="bl-stat-card" style={{
          padding: '14px 16px', borderRadius: 12,
          background: t.bgCard, border: `1px solid ${t.borderPrimary}`,
          boxShadow: t.shadowSm, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: stat.bg, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <stat.icon size={16} color={stat.color} />
          </div>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: t.textPrimary, letterSpacing: -0.3, lineHeight: 1.2, marginTop: 2 }}>
              {stat.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  /* ═══════════════════ Row Renderer ═══════════════════ */
  const renderRow = (item, index) => {
    const depth = item._depth;
    const id = item._id || item.id;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedIds[id];
    const typeColor = TYPE_COLORS[item.type] || '#6b7280';
    const priorityColor = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS[4];
    const priorityLabel = PRIORITY_LABELS[item.priority] || 'Low';
    const statusColor = STATUS_COLORS[item.status] || '#94a3b8';
    const initials = getInitials(item.assignee);
    const canAddChild = (CHILD_TYPES[item.type] || []).length > 0;

    return (
      <div
        key={id}
        className="bl-row"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 16px',
          borderRadius: 10,
          background: index % 2 === 0 ? t.rowEven : t.rowOdd,
          border: `1px solid transparent`,
          marginLeft: depth * 28,
          gap: 10,
          position: 'relative',
          minHeight: 48,
        }}
      >
        {/* Left accent bar */}
        <div style={{
          position: 'absolute', left: 0, top: 8, bottom: 8,
          width: 3, borderRadius: 3, background: typeColor,
        }} />

        {/* Expand/Collapse */}
        <div
          onClick={() => hasChildren && toggleExpand(id)}
          className="bl-expand-btn"
          style={{
            width: 22, height: 22, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: hasChildren ? 'pointer' : 'default',
            color: hasChildren ? t.textSecondary : 'transparent',
            background: hasChildren ? t.bgTertiary : 'transparent',
            flexShrink: 0, border: hasChildren ? `1px solid ${t.borderPrimary}` : 'none',
          }}
        >
          {hasChildren && (isExpanded ? <FiChevronDown size={13} /> : <FiChevronRight size={13} />)}
        </div>

        {/* Work Item ID */}
        <span style={{
          fontSize: 10.5, fontWeight: 700, color: t.textMuted,
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          letterSpacing: 0.3, flexShrink: 0, minWidth: 54,
        }}>
          WI-{item.workItemId}
        </span>

        {/* Type Badge */}
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '3px 9px',
          borderRadius: 6, background: `${typeColor}14`,
          color: typeColor, flexShrink: 0, display: 'flex',
          alignItems: 'center', gap: 4, border: `1px solid ${typeColor}22`,
          letterSpacing: 0.2,
        }}>
          <span style={{ fontSize: 11 }}>{TYPE_ICONS[item.type] || '📋'}</span>
          {item.type}
        </span>

        {/* Title */}
        <span style={{
          fontSize: 13.5, fontWeight: 600, color: t.textPrimary,
          flex: 1, minWidth: 0, overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          lineHeight: 1.3,
        }}>
          {item.title}
        </span>

        {/* Status Badge */}
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '3px 9px',
          borderRadius: 6, background: `${statusColor}14`,
          color: statusColor, flexShrink: 0,
          border: `1px solid ${statusColor}22`,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: statusColor,
          }} />
          {item.status || 'Backlog'}
        </span>

        {/* Priority */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
          padding: '3px 8px', borderRadius: 6,
          background: `${priorityColor}10`, border: `1px solid ${priorityColor}20`,
        }}>
          {item.priority <= 2
            ? <FiArrowUp size={10} style={{ color: priorityColor }} />
            : item.priority === 4
              ? <FiArrowDown size={10} style={{ color: priorityColor }} />
              : <FiMinus size={10} style={{ color: priorityColor }} />
          }
          <span style={{ fontSize: 10.5, fontWeight: 600, color: priorityColor }}>
            {priorityLabel}
          </span>
        </div>

        {/* Story Points */}
        <span style={{
          fontSize: 11, fontWeight: 800, padding: '3px 10px',
          borderRadius: 8, background: t.accentSoft,
          color: t.accentSecondary, flexShrink: 0, minWidth: 36,
          textAlign: 'center', border: `1px solid ${t.accentPrimary}18`,
        }}>
          {item.storyPoints || 0} SP
        </span>

        {/* Effort */}
        {item.effort > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '3px 8px',
            borderRadius: 6, background: 'rgba(234,179,8,0.08)',
            color: '#eab308', flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 3,
            border: '1px solid rgba(234,179,8,0.18)',
          }}>
            <FiClock size={9} />
            {item.effort}h
          </span>
        )}

        {/* Assignee Avatar */}
        <div title={item.assignee || 'Unassigned'} style={{
          width: 28, height: 28, borderRadius: '50%',
          background: item.assignee ? t.accentGradient : t.bgTertiary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, border: `2px solid ${t.bgCard}`,
          boxShadow: item.assignee ? `0 2px 8px ${t.accentGlow}` : 'none',
        }}>
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: item.assignee ? '#fff' : t.textMuted,
          }}>
            {initials}
          </span>
        </div>

        {/* Actions */}
        <div className="bl-actions" style={{
          display: 'flex', gap: 2, flexShrink: 0, opacity: 0,
          transition: 'opacity 0.15s ease',
        }}>
          {canAddChild && (
            <button onClick={() => openCreateChild(item)} title="Add child"
              className="bl-icon-btn"
              style={{
                width: 28, height: 28, border: 'none', background: 'transparent',
                color: t.accentSecondary, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              <FiPlus size={13} />
            </button>
          )}
          <button onClick={() => openEdit(item)} title="Edit"
            className="bl-icon-btn"
            style={{
              width: 28, height: 28, border: 'none', background: 'transparent',
              color: t.textMuted, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <FiEdit2 size={13} />
          </button>
          <button onClick={() => handleDelete(id)} title="Delete"
            className="bl-icon-btn"
            style={{
              width: 28, height: 28, border: 'none', background: 'transparent',
              color: t.dangerColor, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <FiTrash2 size={13} />
          </button>
        </div>
      </div>
    );
  };

  /* ═══════════════════ Form Field Helper ═══════════════════ */
  const inputProps = (extraStyle = {}) => ({
    className: 'bl-input',
    style: {
      width: '100%', padding: '10px 14px', borderRadius: 10,
      border: `1px solid ${t.borderSecondary}`, background: t.bgInput,
      color: t.textPrimary, fontSize: 13, outline: 'none',
      boxSizing: 'border-box', fontFamily: 'inherit',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      ...extraStyle,
    },
  });

  const labelProps = {
    style: {
      display: 'block', fontSize: 12, fontWeight: 600,
      color: t.textSecondary, marginBottom: 6, letterSpacing: 0.2,
    },
  };

  /* ═══════════════════ Main Render ═══════════════════ */
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', background: t.bgPrimary,
      transition: 'background 0.3s ease',
    }}>
      {/* ═══ Header ═══ */}
      <div style={{
        padding: '20px 28px 16px',
        borderBottom: `1px solid ${t.borderPrimary}`,
        flexShrink: 0, background: t.bgSecondary,
        boxShadow: t.shadowSm,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
          {/* Left: Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 13,
              background: t.accentGradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: t.shadowGlow,
            }}>
              <FiList size={21} color="#fff" />
            </div>
            <div>
              <h1 style={{
                margin: 0, fontSize: 23, fontWeight: 800,
                color: t.textPrimary, letterSpacing: -0.5,
              }}>
                Backlog
              </h1>
              <p style={{ margin: '3px 0 0', fontSize: 12.5, color: t.textMuted }}>
                {totalItems} total items · {allPoints} story points · Epics → Features → Stories → Tasks
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="bl-btn"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                width: 38, height: 38, borderRadius: 10,
                border: `1px solid ${t.borderSecondary}`,
                background: t.bgTertiary, color: t.textSecondary,
                cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {isDarkMode ? <FiSun size={16} /> : <FiMoon size={16} />}
            </button>

            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bl-btn"
              style={{
                height: 38, borderRadius: 10, padding: '0 14px',
                border: `1px solid ${activeFilterCount > 0 ? t.accentPrimary + '40' : t.borderSecondary}`,
                background: activeFilterCount > 0 ? t.accentSoft : t.bgTertiary,
                color: activeFilterCount > 0 ? t.accentPrimary : t.textSecondary,
                cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600,
              }}
            >
              <FiFilter size={14} />
              Filters
              {activeFilterCount > 0 && (
                <span style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: t.accentGradient, color: '#fff',
                  fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <FiSearch size={14} style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)', color: t.textMuted,
              }} />
              <input
                placeholder="Search backlog..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                {...inputProps({ width: 220, paddingLeft: 36 })}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} style={{
                  position: 'absolute', right: 8, top: '50%',
                  transform: 'translateY(-50%)', width: 20, height: 20,
                  borderRadius: '50%', border: 'none', background: t.bgCardHover,
                  color: t.textMuted, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FiX size={10} />
                </button>
              )}
            </div>

            {/* Create */}
            <button onClick={openCreateRoot} className="bl-btn" style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 10,
              border: 'none', background: t.accentGradient,
              color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', boxShadow: `0 4px 14px ${t.accentGlow}`,
            }}>
              <FiPlus size={15} strokeWidth={2.5} /> New Item
            </button>
          </div>
        </div>

        {/* ═══ Filter Bar ═══ */}
        {showFilters && (
          <div style={{
            display: 'flex', gap: 10, alignItems: 'center',
            padding: '12px 16px', background: t.bgTertiary,
            borderRadius: 10, border: `1px solid ${t.borderPrimary}`,
            animation: 'blFadeIn 0.2s ease', flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: t.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
              <FiFilter size={12} /> Filter:
            </span>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              {...inputProps({ width: 'auto', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' })}>
              <option value="All">All Types</option>
              {ALL_TYPES.map(tp => <option key={tp} value={tp}>{TYPE_ICONS[tp]} {tp}</option>)}
            </select>
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
              {...inputProps({ width: 'auto', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' })}>
              <option value="All">All Priorities</option>
              {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{PRIORITY_ICONS[k]} {v}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              {...inputProps({ width: 'auto', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' })}>
              <option value="All">All Statuses</option>
              {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              {...inputProps({ width: 'auto', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' })}>
              <option value="priority">Sort: Priority</option>
              <option value="storyPoints">Sort: Story Points</option>
              <option value="title">Sort: Title</option>
              <option value="date">Sort: Date</option>
              <option value="status">Sort: Status</option>
            </select>
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} className="bl-btn" style={{
                padding: '5px 12px', borderRadius: 8, border: 'none',
                background: `${t.dangerColor}10`, color: t.dangerColor,
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <FiX size={11} /> Clear All
              </button>
            )}
          </div>
        )}
      </div>

      {/* ═══ Stats Row ═══ */}
      <div style={{
        padding: '16px 28px',
        borderBottom: `1px solid ${t.borderPrimary}`,
        flexShrink: 0, background: t.bgSecondary,
      }}>
        {renderStatsCards()}

        {/* Type summary chips */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginTop: 12, flexWrap: 'wrap',
        }}>
          <span style={{
            fontSize: 11, fontWeight: 600, color: t.textMuted,
            textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            Visible:
          </span>
          {ALL_TYPES.map(tp =>
            (visibleCounts[tp] || 0) > 0 && (
              <span key={tp} className="bl-chip" style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontWeight: 600, padding: '4px 10px',
                borderRadius: 7, background: `${TYPE_COLORS[tp]}12`,
                color: TYPE_COLORS[tp], border: `1px solid ${TYPE_COLORS[tp]}22`,
                cursor: 'pointer',
              }}
                onClick={() => setTypeFilter(tp === typeFilter ? 'All' : tp)}
              >
                <span style={{ fontSize: 12 }}>{TYPE_ICONS[tp]}</span>
                {visibleCounts[tp]} {tp}{visibleCounts[tp] !== 1 ? 's' : ''}
              </span>
            )
          )}

          {/* Completion progress */}
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted }}>
              Progress
            </span>
            <div style={{
              width: 120, height: 6, borderRadius: 3,
              background: t.bgTertiary, overflow: 'hidden',
              border: `1px solid ${t.borderPrimary}`,
            }}>
              <div className="bl-progress-bar" style={{
                width: `${stats.completionRate}%`, height: '100%',
                borderRadius: 3, background: t.accentGradient,
              }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: t.accentSecondary }}>
              {stats.completionRate}%
            </span>
          </div>

          {/* Expand/Collapse */}
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={expandAll} className="bl-btn" style={{
              padding: '5px 12px', borderRadius: 7,
              border: `1px solid ${t.borderSecondary}`, background: t.bgTertiary,
              color: t.textSecondary, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <FiMaximize2 size={11} /> Expand
            </button>
            <button onClick={collapseAll} className="bl-btn" style={{
              padding: '5px 12px', borderRadius: 7,
              border: `1px solid ${t.borderSecondary}`, background: t.bgTertiary,
              color: t.textSecondary, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <FiMinimize2 size={11} /> Collapse
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Tree Content ═══ */}
      <div className="bl-scroll" style={{
        flex: 1, padding: '16px 28px', overflow: 'auto',
      }}>
        {loading ? renderSkeletons() : filteredHierarchy.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: t.accentSoft, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', boxShadow: t.shadowGlow,
            }}>
              <FiList size={28} color={t.accentPrimary} />
            </div>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: t.textPrimary }}>
              {searchTerm || activeFilterCount > 0 ? 'No matching items' : 'No backlog items yet'}
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 13.5, color: t.textMuted, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
              {searchTerm || activeFilterCount > 0
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'Start building your product backlog by creating Epics, Features, and User Stories.'
              }
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
              {(searchTerm || activeFilterCount > 0) && (
                <button onClick={clearAllFilters} className="bl-btn" style={{
                  padding: '10px 20px', borderRadius: 10,
                  border: `1px solid ${t.borderSecondary}`, background: 'transparent',
                  color: t.textSecondary, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>
                  Clear Filters
                </button>
              )}
              <button onClick={openCreateRoot} className="bl-btn" style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 22px', borderRadius: 10,
                border: 'none', background: t.accentGradient,
                color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', boxShadow: `0 4px 14px ${t.accentGlow}`,
              }}>
                <FiPlus size={15} /> Create Item
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {flattenTree(filteredHierarchy).map((item, idx) => {
              const id = item._id || item.id;
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedIds[id];
              const parentExpanded = item._depth === 0 || (() => {
                let current = filteredHierarchy;
                const findParentExpanded = (nodes, depth) => {
                  for (const n of nodes) {
                    if (depth === item._depth - 1 && n.children?.some(c => (c._id || c.id) === id)) {
                      return expandedIds[n._id || n.id] !== false;
                    }
                    if (n.children) {
                      const result = findParentExpanded(n.children, depth + 1);
                      if (result !== undefined) return result;
                    }
                  }
                  return undefined;
                };
                const result = findParentExpanded(current, 0);
                return result !== false;
              })();

              if (item._depth > 0) {
                let shouldShow = true;
                const checkParents = (nodes, targetId, currentDepth) => {
                  for (const n of nodes) {
                    const nId = n._id || n.id;
                    if (n.children) {
                      for (const child of n.children) {
                        const cId = child._id || child.id;
                        if (cId === targetId) {
                          if (!expandedIds[nId]) return false;
                          if (currentDepth > 0) return checkParents(filteredHierarchy, nId, currentDepth - 1);
                          return true;
                        }
                      }
                      const deeper = checkParents([{ children: n.children }], targetId, currentDepth);
                      if (deeper !== undefined) return deeper;
                    }
                  }
                  return undefined;
                };
                const visCheck = checkParents(filteredHierarchy, id, item._depth);
                if (visCheck === false) return null;
              }

              return renderRow(item, idx);
            })}
          </div>
        )}
      </div>

      {/* ═══ Modal ═══ */}
      {showModal && (
        <div onClick={closeModal} style={{
          position: 'fixed', inset: 0, background: t.bgOverlay,
          backdropFilter: 'blur(10px)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 2000,
          animation: 'blFadeIn 0.2s ease',
        }}>
          <div onClick={e => e.stopPropagation()}
            className="bl-modal-content bl-scroll"
            style={{
              width: '100%', maxWidth: 580, maxHeight: '88vh',
              overflowY: 'auto', background: t.bgElevated,
              borderRadius: 20, border: `1px solid ${t.borderSecondary}`,
              boxShadow: t.shadowXl, padding: 28,
            }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 24, paddingBottom: 18, borderBottom: `1px solid ${t.borderPrimary}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: t.accentGradient, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 4px 12px ${t.accentGlow}`,
                }}>
                  {editItem ? <FiEdit2 size={17} color="#fff" /> :
                    parentForChild ? <FiGitBranch size={17} color="#fff" /> :
                      <FiPlus size={19} color="#fff" />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: t.textPrimary }}>
                    {editItem ? 'Edit Work Item' : parentForChild ? 'Add Child Item' : 'Create Work Item'}
                  </h3>
                  {parentForChild && (
                    <p style={{
                      margin: '4px 0 0', fontSize: 12, color: t.textMuted,
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '1px 6px',
                        borderRadius: 4, background: `${TYPE_COLORS[parentForChild.type]}14`,
                        color: TYPE_COLORS[parentForChild.type],
                      }}>
                        {parentForChild.type}
                      </span>
                      Parent: {parentForChild.title}
                    </p>
                  )}
                  {editItem && (
                    <span style={{
                      fontSize: 11, color: t.textMuted,
                      fontFamily: '"JetBrains Mono", monospace',
                    }}>
                      WI-{editItem.workItemId}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={closeModal} className="bl-icon-btn" style={{
                width: 34, height: 34, border: `1px solid ${t.borderPrimary}`,
                background: t.bgTertiary, color: t.textMuted, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FiX size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Title */}
              <div>
                <label {...labelProps}>
                  Title <span style={{ color: t.dangerColor }}>*</span>
                </label>
                <input value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  required autoFocus placeholder="Enter work item title"
                  {...inputProps()}
                />
              </div>

              {/* Type & Priority */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label {...labelProps}>Type</label>
                  <select value={form.type}
                    onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                    disabled={!!parentForChild}
                    {...inputProps({ cursor: 'pointer' })}>
                    {(parentForChild ? allowedChildTypes : ALL_TYPES).map(tp => (
                      <option key={tp} value={tp}>{TYPE_ICONS[tp]} {tp}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label {...labelProps}>Priority</label>
                  <select value={form.priority}
                    onChange={e => setForm(p => ({ ...p, priority: parseInt(e.target.value) }))}
                    {...inputProps({ cursor: 'pointer' })}>
                    <option value={1}>🔴 Critical</option>
                    <option value={2}>🟠 High</option>
                    <option value={3}>🟡 Medium</option>
                    <option value={4}>⚪ Low</option>
                  </select>
                </div>
              </div>

              {/* Status & Severity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label {...labelProps}>Status</label>
                  <select value={form.status}
                    onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    {...inputProps({ cursor: 'pointer' })}>
                    {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label {...labelProps}>Severity</label>
                  <select value={form.severity}
                    onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}
                    {...inputProps({ cursor: 'pointer' })}>
                    <option value="">None</option>
                    <option value="S1">S1 - Critical</option>
                    <option value="S2">S2 - Major</option>
                    <option value="S3">S3 - Minor</option>
                    <option value="S4">S4 - Trivial</option>
                  </select>
                </div>
              </div>

              {/* Assignee & Story Points */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label {...labelProps}>
                    <FiUser size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
                    Assignee
                  </label>
                  <input value={form.assignee}
                    onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))}
                    placeholder="Assignee name"
                    {...inputProps()}
                  />
                </div>
                <div>
                  <label {...labelProps}>Story Points</label>
                  <input type="number" min="0" value={form.storyPoints}
                    onChange={e => setForm(p => ({ ...p, storyPoints: parseInt(e.target.value) || 0 }))}
                    {...inputProps()}
                  />
                </div>
              </div>

              {/* Effort & Remaining */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label {...labelProps}>
                    <FiClock size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
                    Effort (hours)
                  </label>
                  <input type="number" min="0" step="0.5" value={form.effort}
                    onChange={e => setForm(p => ({ ...p, effort: e.target.value }))}
                    placeholder="0" {...inputProps()}
                  />
                </div>
                <div>
                  <label {...labelProps}>Remaining Work (hours)</label>
                  <input type="number" min="0" step="0.5" value={form.remainingWork}
                    onChange={e => setForm(p => ({ ...p, remainingWork: e.target.value }))}
                    placeholder="0" {...inputProps()}
                  />
                </div>
              </div>

              {/* Activity & Area Path */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label {...labelProps}>
                    <FiActivity size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
                    Activity
                  </label>
                  <select value={form.activity}
                    onChange={e => setForm(p => ({ ...p, activity: e.target.value }))}
                    {...inputProps({ cursor: 'pointer' })}>
                    <option value="">None</option>
                    <option value="Development">Development</option>
                    <option value="Design">Design</option>
                    <option value="Testing">Testing</option>
                    <option value="Documentation">Documentation</option>
                    <option value="Deployment">Deployment</option>
                  </select>
                </div>
                <div>
                  <label {...labelProps}>Area Path</label>
                  <input value={form.areaPath}
                    onChange={e => setForm(p => ({ ...p, areaPath: e.target.value }))}
                    placeholder="e.g. Project/Module"
                    {...inputProps()}
                  />
                </div>
              </div>

              {/* Iteration Path */}
              <div>
                <label {...labelProps}>
                  <FiCalendar size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
                  Iteration Path
                </label>
                <input value={form.iterationPath}
                  onChange={e => setForm(p => ({ ...p, iterationPath: e.target.value }))}
                  placeholder="e.g. Sprint 1"
                  {...inputProps()}
                />
              </div>

              {/* Tags */}
              <div>
                <label {...labelProps}>
                  <FiTag size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
                  Tags (comma-separated)
                </label>
                <input value={form.tags}
                  onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                  placeholder="e.g. frontend, urgent, api"
                  {...inputProps()}
                />
              </div>

              {/* Description */}
              <div>
                <label {...labelProps}>Description</label>
                <textarea value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3} placeholder="Add detailed description..."
                  {...inputProps({ resize: 'vertical', lineHeight: 1.6 })}
                />
              </div>

              {/* Acceptance Criteria */}
              <div>
                <label {...labelProps}>
                  <FiCheckCircle size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
                  Acceptance Criteria
                </label>
                <textarea value={form.acceptanceCriteria}
                  onChange={e => setForm(p => ({ ...p, acceptanceCriteria: e.target.value }))}
                  rows={2} placeholder="Define acceptance criteria..."
                  {...inputProps({ resize: 'vertical', lineHeight: 1.6 })}
                />
              </div>

              {/* Actions */}
              <div style={{
                display: 'flex', gap: 10, justifyContent: 'flex-end',
                paddingTop: 12, borderTop: `1px solid ${t.borderPrimary}`, marginTop: 4,
              }}>
                <button type="button" onClick={closeModal} className="bl-btn" style={{
                  padding: '10px 20px', borderRadius: 10,
                  border: `1px solid ${t.borderSecondary}`, background: 'transparent',
                  color: t.textSecondary, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>
                  Cancel
                </button>
                <button type="submit" className="bl-btn" style={{
                  padding: '10px 24px', borderRadius: 10,
                  border: 'none', background: t.accentGradient,
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', boxShadow: `0 4px 14px ${t.accentGlow}`,
                }}>
                  {editItem ? '✏️ Update Item' : parentForChild ? '🔗 Add Child' : '✨ Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
