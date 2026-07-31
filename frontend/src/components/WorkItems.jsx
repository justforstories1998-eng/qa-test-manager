import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api';
import RichTextEditor from './shared/RichTextEditor';
import './shared/chartSetup';
import { Doughnut, Bar } from 'react-chartjs-2';
import { LiquidButton } from './ui/liquid-glass-button';
const PRIORITY_COLORS = { 1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#6b7280' };
const PRIORITY_LABELS = { 1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low' };
const TYPE_COLORS = { Epic: '#8b5cf6', Feature: '#6366f1', 'User Story': '#3b82f6', Task: '#f59e0b', Bug: '#ef4444', Issue: '#f97316', 'Test Case': '#10b981' };
const STATUS_COLORS = { 'Backlog': '#94a3b8', 'To Do': '#60a5fa', 'In Progress': '#fbbf24', 'Review': '#a78bfa', 'Done': '#34d399' };
const TYPES = ['Epic', 'Feature', 'User Story', 'Task', 'Bug', 'Issue', 'Test Case'];
const STATUSES = ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'];
const PRIORITIES = [1, 2, 3, 4];
const SEVERITIES = ['Critical', 'High', 'Medium', 'Low', 'Info'];
const ACTIVITIES = ['Development', 'Design', 'Testing', 'Documentation', 'Deployment', 'Research'];
const LINK_TYPES = ['Parent', 'Child', 'Related', 'Dependency', 'Blocking', 'Duplicate'];
const PAGE_SIZE = 50;

const btnBase = {
  padding: '8px 16px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '600',
  fontFamily: 'inherit',
  transition: 'all 0.2s ease',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
};

const btnPrimary = { ...btnBase, background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff' };
const btnSecondary = { ...btnBase, background: 'var(--surface-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' };
const btnDanger = { ...btnBase, background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger-border)' };
const btnSmall = { ...btnBase, padding: '4px 10px', fontSize: '12px' };
const btnIcon = { ...btnSmall, padding: '6px 8px', background: 'transparent', border: '1px solid var(--border-color)' };

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  background: 'var(--surface-secondary)',
  color: 'var(--text-primary)',
  fontSize: '13px',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle = {
  fontSize: '12px',
  fontWeight: '600',
  color: 'var(--text-muted)',
  marginBottom: '4px',
  display: 'block',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

function Badge({ text, color, small }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: small ? '2px 6px' : '4px 10px',
      borderRadius: '6px', fontSize: small ? '10px' : '11px', fontWeight: '600',
      background: `${color}20`, color, whiteSpace: 'nowrap',
    }}>{text}</span>
  );
}

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} />
      <div style={{
        position: 'relative', width: wide ? '780px' : '500px', maxWidth: '92vw', maxHeight: '88vh',
        background: 'var(--surface-elevated)', borderRadius: '16px', border: '1px solid var(--border-color)',
        boxShadow: '0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'modalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', borderBottom: '1px solid var(--border-color)',
          background: 'var(--surface-secondary)',
        }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{title}</h3>
          <button onClick={onClose} style={{
            width: '28px', height: '28px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: 'var(--surface-tertiary)', color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', lineHeight: 1, transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-bg)'; e.currentTarget.style.color = 'var(--danger)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-tertiary)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >×</button>
        </div>
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
      <style>{`@keyframes modalSlideIn { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
    </div>
  );
}

function Select({ value, onChange, options, style: s, placeholder }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', ...s }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>{typeof o === 'string' ? o : o.label}</option>)}
    </select>
  );
}

function WorkItemForm({ initial, onSubmit, onCancel, submitLabel, templates, projectId }) {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', type: 'User Story', priority: 3, severity: 'Medium',
    status: 'Backlog', assignee: '', storyPoints: '', effort: '', remainingWork: '',
    originalEstimate: '', completedWork: '', tags: '', areaPath: '', iterationPath: '',
    activity: '', acceptanceCriteria: '', ...initial,
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    const payload = { ...form };
    payload.storyPoints = payload.storyPoints !== '' ? Number(payload.storyPoints) : undefined;
    payload.effort = payload.effort !== '' ? Number(payload.effort) : undefined;
    payload.remainingWork = payload.remainingWork !== '' ? Number(payload.remainingWork) : undefined;
    payload.originalEstimate = payload.originalEstimate !== '' ? Number(payload.originalEstimate) : undefined;
    payload.completedWork = payload.completedWork !== '' ? Number(payload.completedWork) : undefined;
    payload.tags = typeof payload.tags === 'string' ? payload.tags.split(',').map(t => t.trim()).filter(Boolean) : payload.tags;
    onSubmit(payload);
  };

  return (
    <div>
      {/* ── Template selector ── */}
      {templates && templates.length > 0 && (
        <div style={{ marginBottom: '16px', padding: '12px 14px', background: 'var(--surface-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <label style={{ ...labelStyle, marginBottom: '6px', display: 'block' }}>Apply Template</label>
          <select value={selectedTemplate} onChange={e => {
            const tpl = templates.find(t => t._id === e.target.value);
            if (tpl) {
              setSelectedTemplate(e.target.value);
              setForm(p => ({ ...p,
                type: tpl.type || p.type, priority: tpl.priority || p.priority, severity: tpl.severity || p.severity,
                status: tpl.status || p.status, assignee: tpl.assignee || p.assignee,
                storyPoints: tpl.storyPoints || p.storyPoints, effort: tpl.effort || p.effort,
                areaPath: tpl.areaPath || p.areaPath, iterationPath: tpl.iterationPath || p.iterationPath,
                activity: tpl.activity || p.activity, acceptanceCriteria: tpl.acceptanceCriteria || p.acceptanceCriteria,
                tags: tpl.tags?.length ? tpl.tags.join(', ') : p.tags, description: tpl.description || p.description,
              }));
            }
          }} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-tertiary)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
            <option value="">— Select a template —</option>
            {templates.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>
      )}

      {/* ── Type color bar ── */}
      <div style={{ height: '3px', background: TYPE_COLORS[form.type] || '#888', borderRadius: '2px', marginBottom: '20px', transition: 'background 0.2s' }} />

      {/* ── Title ── */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Title *</label>
        <input value={form.title} onChange={e => set('title', e.target.value)}
          placeholder="Enter work item title..."
          style={{ ...inputStyle, fontSize: '15px', fontWeight: '600', padding: '10px 14px' }} />
      </div>

      {/* ── Section: Details ── */}
      <div style={{ padding: '0 0 16px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
        <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Type</label>
            <Select value={form.type} onChange={v => set('type', v)} options={TYPES} style={{ height: '36px' }} />
          </div>
          <div>
            <label style={labelStyle}>Priority</label>
            <Select value={form.priority} onChange={v => set('priority', Number(v))}
              options={PRIORITIES.map(p => ({ value: p, label: `${p} - ${PRIORITY_LABELS[p]}` }))} style={{ height: '36px' }} />
          </div>
          <div>
            <label style={labelStyle}>Severity</label>
            <Select value={form.severity} onChange={v => set('severity', v)}
              options={SEVERITIES.map(s => ({ value: s, label: s }))} style={{ height: '36px' }} />
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <Select value={form.status} onChange={v => set('status', v)}
              options={STATUSES.map(s => ({ value: s, label: s }))} style={{ height: '36px' }} />
          </div>
          <div>
            <label style={labelStyle}>Assignee</label>
            <input value={form.assignee} onChange={e => set('assignee', e.target.value)}
              placeholder="e.g. john" style={{ ...inputStyle, height: '36px' }} />
          </div>
          <div>
            <label style={labelStyle}>Activity</label>
            <Select value={form.activity} onChange={v => set('activity', v)}
              options={ACTIVITIES.map(a => ({ value: a, label: a }))} style={{ height: '36px' }} />
          </div>
          <div>
            <label style={labelStyle}>Story Points</label>
            <input type="number" value={form.storyPoints} onChange={e => set('storyPoints', e.target.value)}
              style={{ ...inputStyle, height: '36px' }} />
          </div>
          <div>
            <label style={labelStyle}>Effort</label>
            <input type="number" value={form.effort} onChange={e => set('effort', e.target.value)}
              style={{ ...inputStyle, height: '36px' }} />
          </div>
          <div>
            <label style={labelStyle}>Remaining Work</label>
            <input type="number" value={form.remainingWork} onChange={e => set('remainingWork', e.target.value)}
              style={{ ...inputStyle, height: '36px' }} />
          </div>
          <div>
            <label style={labelStyle}>Original Estimate</label>
            <input type="number" value={form.originalEstimate} onChange={e => set('originalEstimate', e.target.value)}
              style={{ ...inputStyle, height: '36px' }} />
          </div>
          <div>
            <label style={labelStyle}>Completed Work</label>
            <input type="number" value={form.completedWork} onChange={e => set('completedWork', e.target.value)}
              style={{ ...inputStyle, height: '36px' }} />
          </div>
          <div>
            <label style={labelStyle}>Area Path</label>
            <input value={form.areaPath} onChange={e => set('areaPath', e.target.value)}
              style={{ ...inputStyle, height: '36px' }} />
          </div>
          <div>
            <label style={labelStyle}>Iteration Path</label>
            <input value={form.iterationPath} onChange={e => set('iterationPath', e.target.value)}
              style={{ ...inputStyle, height: '36px' }} />
          </div>
        </div>
      </div>

      {/* ── Section: Tags ── */}
      <div style={{ padding: '0 0 16px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
        <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Tags</div>
        <input value={form.tags} onChange={e => set('tags', e.target.value)}
          placeholder="tag1, tag2, tag3" style={{ ...inputStyle, height: '36px' }} />
      </div>

      {/* ── Section: Description ── */}
      <div style={{ padding: '0 0 16px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
        <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Description</div>
        <RichTextEditor value={form.description} onChange={v => set('description', v)} placeholder="Describe the work item..." minHeight={100} />
      </div>

      {/* ── Section: Acceptance Criteria ── */}
      <div style={{ padding: '0 0 16px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
        <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Acceptance Criteria</div>
        <RichTextEditor value={form.acceptanceCriteria} onChange={v => set('acceptanceCriteria', v)} placeholder="Define acceptance criteria..." minHeight={100} />
      </div>

      {/* ── Actions ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
        <LiquidButton variant="secondary" size="sm" onClick={onCancel}>Cancel</LiquidButton>
        <LiquidButton variant="default" size="sm" onClick={handleSubmit}>{submitLabel || 'Create'}</LiquidButton>
      </div>
    </div>
  );
}

export default function WorkItems({ projectId }) {
  const [tab, setTab] = useState('items');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortKey, setSortKey] = useState('workItemId');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [queries, setQueries] = useState([]);
  const [queryName, setQueryName] = useState('');
  const [showSaveQuery, setShowSaveQuery] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [deletedItems, setDeletedItems] = useState([]);
  const [queryChartVisible, setQueryChartVisible] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const filters = {};
      if (filterType) filters.type = filterType;
      if (filterStatus) filters.status = filterStatus;
      if (filterPriority) filters.priority = filterPriority;
      if (filterAssignee) filters.assignee = filterAssignee;
      if (filterTag) filters.tag = filterTag;
      if (filterDateFrom) filters.dateFrom = filterDateFrom;
      if (filterDateTo) filters.dateTo = filterDateTo;
      if (search) filters.search = search;
      const res = await api.getWorkItems(projectId, filters);
      if (res.success) setItems(res.data || []);
    } catch (err) {
      console.error('Failed to fetch work items', err);
    }
    setLoading(false);
  }, [projectId, filterType, filterStatus, filterPriority, filterAssignee, filterTag, filterDateFrom, filterDateTo, search]);

  const fetchQueries = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await api.getQueries(projectId);
      if (res.success) setQueries(res.data || []);
    } catch (err) {
      console.error('Failed to fetch queries', err);
    }
  }, [projectId]);

  const fetchTemplates = useCallback(async () => {
    if (!projectId) return;
    try { const res = await api.getTemplates(projectId); if (res.success) setTemplates(res.data || []); } catch {}
  }, [projectId]);

  const fetchDeleted = useCallback(async () => {
    if (!projectId) return;
    try { const res = await api.getRecycleBin(projectId); if (res.success) setDeletedItems(res.data || []); } catch {}
  }, [projectId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { if (tab === 'queries') fetchQueries(); }, [tab, fetchQueries]);
  useEffect(() => { if (tab === 'templates') fetchTemplates(); }, [tab, fetchTemplates]);
  useEffect(() => { if (tab === 'recycle') fetchDeleted(); }, [tab, fetchDeleted]);

  const sorted = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === 'priority') { av = av || 99; bv = bv || 99; }
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av === undefined || av === null) return 1;
      if (bv === undefined || bv === null) return -1;
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [items, sortKey, sortDir]);

  const uniqueAssignees = useMemo(() => {
    const set = new Set();
    items.forEach(i => { if (i.assignee) set.add(i.assignee); });
    return [...set].sort();
  }, [items]);

  const uniqueTags = useMemo(() => {
    const set = new Set();
    items.forEach(i => (i.tags || []).forEach(t => set.add(t)));
    return [...set].sort();
  }, [items]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const queryChartData = useMemo(() => {
    if (!queryChartVisible || sorted.length === 0) return null;
    const statusCounts = {};
    const typeCounts = {};
    const priorityCounts = {};
    sorted.forEach(item => {
      statusCounts[item.status || 'Unknown'] = (statusCounts[item.status || 'Unknown'] || 0) + 1;
      typeCounts[item.type || 'Unknown'] = (typeCounts[item.type || 'Unknown'] || 0) + 1;
      priorityCounts[item.priority || 'Unknown'] = (priorityCounts[item.priority || 'Unknown'] || 0) + 1;
    });
    const statusColors = { Backlog: '#64748b', 'To Do': '#818cf8', 'In Progress': '#f59e0b', 'Code Review': '#8b5cf6', Done: '#22c55e', Closed: '#94a3b8', Removed: '#ef4444' };
    const typeColors = { Epic: '#ef4444', Feature: '#8b5cf6', 'User Story': '#818cf8', Task: '#f59e0b', Bug: '#22c55e', Issue: '#f97316', 'Test Case': '#06b6d4' };
    return {
      status: {
        labels: Object.keys(statusCounts),
        datasets: [{ data: Object.values(statusCounts), backgroundColor: Object.keys(statusCounts).map(s => (statusColors[s] || '#64748b') + '40'), borderColor: Object.keys(statusCounts).map(s => statusColors[s] || '#64748b'), borderWidth: 1.5, borderRadius: 6, barPercentage: 0.6 }],
      },
      type: {
        labels: Object.keys(typeCounts),
        datasets: [{ data: Object.values(typeCounts), backgroundColor: Object.keys(typeCounts).map(t => typeColors[t] || '#64748b'), borderWidth: 0, hoverOffset: 6, spacing: 2 }],
      },
      priority: {
        labels: Object.keys(priorityCounts).map(p => `P${p}`),
        datasets: [{ data: Object.values(priorityCounts), backgroundColor: ['#ef444440', '#f9731640', '#6366f140', '#22c55e40'], borderColor: ['#ef4444', '#f97316', '#6366f1', '#22c55e'], borderWidth: 1.5, borderRadius: 6, barPercentage: 0.6 }],
      },
    };
  }, [sorted, queryChartVisible]);

  const queryChartOptions = useMemo(() => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', titleColor: '#f1f5f9', bodyColor: '#cbd5e1', borderWidth: 1, padding: 10, cornerRadius: 8 } },
    scales: {
      x: { grid: { display: false }, ticks: { color: 'rgba(148,163,184,0.5)', font: { size: 11 } }, border: { display: false } },
      y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(148,163,184,0.5)', font: { size: 11 } }, border: { display: false } },
    },
  }), []);

  useEffect(() => { setPage(1); }, [filterType, filterStatus, filterPriority, filterAssignee, filterTag, filterDateFrom, filterDateTo, search]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paged.length) setSelected(new Set());
    else setSelected(new Set(paged.map(i => i._id)));
  };

  const handleCreate = async (data) => {
    try {
      const res = await api.createWorkItem({ ...data, projectId });
      if (res.success) { setShowCreate(false); fetchItems(); }
    } catch (err) { console.error('Create failed', err); }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} items?`)) return;
    await api.bulkDeleteWorkItems([...selected]);
    setSelected(new Set());
    fetchItems();
  };

  const handleBulkStatus = async (status) => {
    await api.bulkUpdateWorkItems([...selected], { status });
    setSelected(new Set());
    fetchItems();
  };

  const handleBulkAssignee = async (assignee) => {
    await api.bulkUpdateWorkItems([...selected], { assignee });
    setSelected(new Set());
    fetchItems();
  };

  const handleBulkType = async (type) => {
    await api.bulkChangeType([...selected], type);
    setSelected(new Set());
    fetchItems();
  };

  return (
    <div style={{ padding: '0' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Work Items</h2>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', background: 'var(--surface-tertiary)', padding: '3px 10px', borderRadius: '20px' }}>{sorted.length}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {selected.size > 0 && (
            <>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>{selected.size} selected</span>
              <Select value="" onChange={v => { if (v) handleBulkStatus(v); }} options={[{ value: '', label: 'Status...' }, ...STATUSES.map(s => ({ value: s, label: s }))]} style={{ width: '120px', height: '34px', fontSize: '12px' }} />
              <Select value="" onChange={v => { if (v) handleBulkType(v); }} options={[{ value: '', label: 'Type...' }, ...TYPES.map(t => ({ value: t, label: t }))]} style={{ width: '120px', height: '34px', fontSize: '12px' }} />
              <LiquidButton variant="destructive" size="sm" onClick={handleBulkDelete}>🗑 Delete</LiquidButton>
            </>
          )}
          {tab === 'queries' && (
            <LiquidButton variant="secondary" size="sm" onClick={() => setShowSaveQuery(true)}>💾 Save Current Query</LiquidButton>
          )}
          <LiquidButton variant="default" size="sm" onClick={() => setShowCreate(true)}>+ New Work Item</LiquidButton>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '20px', borderBottom: '2px solid var(--border-color)', paddingBottom: '0' }}>
        {[['items', 'All Items', items.length], ['queries', 'Queries', queries.length], ['templates', 'Templates', templates.length], ['recycle', 'Recycle Bin', deletedItems.length]].map(([k, l, count]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: '10px 16px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer',
            fontSize: '13px', fontWeight: '600', fontFamily: 'inherit',
            background: 'transparent', transition: 'all 0.15s',
            color: tab === k ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: tab === k ? '2px solid #6366f1' : '2px solid transparent',
            marginBottom: tab === k ? '-2px' : '0',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            {l}
            {count > 0 && (
              <span style={{
                fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '10px',
                background: tab === k ? 'rgba(99,102,241,0.15)' : 'var(--surface-tertiary)',
                color: tab === k ? '#6366f1' : 'var(--text-muted)',
              }}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'items' && (
        <>
          {/* ── Filter Bar ── */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 280px' }}>
              <input placeholder="Search by title, ID, or tag..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ ...inputStyle, paddingLeft: '36px', height: '38px', borderRadius: '10px' }} />
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', opacity: 0.35 }}>🔍</span>
            </div>
            <Select value={filterType} onChange={setFilterType} options={[{ value: '', label: 'All Types' }, ...TYPES.map(t => ({ value: t, label: t }))]} style={{ width: '150px', height: '38px', borderRadius: '10px' }} />
            <Select value={filterStatus} onChange={setFilterStatus} options={[{ value: '', label: 'All Statuses' }, ...STATUSES.map(s => ({ value: s, label: s }))]} style={{ width: '150px', height: '38px', borderRadius: '10px' }} />
            <button onClick={() => setShowAdvancedFilters(v => !v)} style={{
              height: '38px', padding: '0 14px', borderRadius: '10px', border: '1px solid var(--border-color)',
              background: showAdvancedFilters ? 'rgba(99,102,241,0.08)' : 'var(--surface-secondary)',
              color: showAdvancedFilters ? '#6366f1' : 'var(--text-muted)',
              cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: '13px' }}>⚙</span> Filters
              {(filterPriority || filterAssignee || filterTag || filterDateFrom || filterDateTo) && (
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }} />
              )}
            </button>
          </div>
          {showAdvancedFilters && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', padding: '14px 16px', background: 'var(--surface-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', alignItems: 'center' }}>
              <Select value={filterPriority} onChange={setFilterPriority} options={[{ value: '', label: 'All Priorities' }, ...PRIORITIES.map(p => ({ value: String(p), label: PRIORITY_LABELS[p] || p }))]} style={{ width: '150px', height: '36px' }} />
              <Select value={filterAssignee} onChange={setFilterAssignee} options={[{ value: '', label: 'All Assignees' }, { value: '__unassigned', label: 'Unassigned' }, ...uniqueAssignees.map(a => ({ value: a, label: a }))]} style={{ width: '150px', height: '36px' }} />
              <Select value={filterTag} onChange={setFilterTag} options={[{ value: '', label: 'All Tags' }, ...uniqueTags.map(t => ({ value: t, label: t }))]} style={{ width: '150px', height: '36px' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>From</span>
                <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} style={{ ...inputStyle, height: '36px', width: '140px' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>To</span>
                <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} style={{ ...inputStyle, height: '36px', width: '140px' }} />
              </div>
              {(filterPriority || filterAssignee || filterTag || filterDateFrom || filterDateTo) && (
                <LiquidButton variant="destructive" size="sm" onClick={() => { setFilterPriority(''); setFilterAssignee(''); setFilterTag(''); setFilterDateFrom(''); setFilterDateTo(''); }}>✕ Clear</LiquidButton>
              )}
            </div>
          )}

          {/* ── Work Item Cards ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Loading work items...</div>
            ) : paged.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.3 }}>📋</div>
                No work items found
              </div>
            ) : paged.map(item => {
              const typeColor = TYPE_COLORS[item.type] || '#888';
              const statusColor = STATUS_COLORS[item.status] || '#888';
              const priorityColor = PRIORITY_COLORS[item.priority] || '#888';
              const isSelected = selected.has(item._id);
              return (
                <div key={item._id} onClick={() => setDetailItem(item)} style={{
                  display: 'flex', borderRadius: '10px', cursor: 'pointer',
                  background: isSelected ? 'rgba(99,102,241,0.06)' : 'var(--surface-secondary)',
                  border: `1px solid ${isSelected ? 'rgba(99,102,241,0.25)' : 'var(--border-color)'}`,
                  overflow: 'hidden', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'var(--border-medium)'; e.currentTarget.style.background = 'var(--surface-glass-hover)'; } }}
                  onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--surface-secondary)'; } }}
                >
                  {/* Type ribbon */}
                  <div style={{ width: '4px', flexShrink: 0, background: typeColor }} />

                  {/* Content */}
                  <div style={{ flex: 1, padding: '14px 16px', minWidth: 0 }}>
                    {/* Row 1: ID + Type + Priority + Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.02em' }}>WI-{item.workItemId}</span>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: priorityColor, flexShrink: 0 }} title={PRIORITY_LABELS[item.priority]} />
                        <Badge text={item.type} color={typeColor} small />
                        <Badge text={item.status} color={statusColor} small />
                      </div>
                      <div style={{ display: 'flex', gap: '2px', opacity: 0.4, transition: 'opacity 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}
                        onClick={e => e.stopPropagation()}>
                        <button onClick={() => setDetailItem(item)} style={{ ...btnIcon, padding: '4px 6px', fontSize: '11px' }} title="View">👁</button>
                        <button onClick={async (e) => { e.stopPropagation(); const res = await api.cloneWorkItem(item._id); if (res.success) fetchItems(); }} style={{ ...btnIcon, padding: '4px 6px', fontSize: '11px' }} title="Clone">📄</button>
                        <button onClick={async () => { if (confirm('Delete?')) { await api.deleteWorkItem(item._id); fetchItems(); } }} style={{ ...btnIcon, padding: '4px 6px', fontSize: '11px', color: '#ef4444' }} title="Delete">🗑</button>
                      </div>
                    </div>

                    {/* Row 2: Title */}
                    <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </div>

                    {/* Row 3: Meta line */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      {item.assignee && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '700' }}>
                            {item.assignee.charAt(0).toUpperCase()}
                          </span>
                          {item.assignee}
                        </span>
                      )}
                      {item.storyPoints != null && <span style={{ fontWeight: '600' }}>{item.storyPoints} pts</span>}
                      {item.effort != null && <span>{item.effort}h</span>}
                      {(item.tags || []).length > 0 && (
                        <span style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {item.tags.slice(0, 4).map((t, i) => (
                            <span key={i} style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', fontWeight: '500' }}>{t}</span>
                          ))}
                          {item.tags.length > 4 && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>+{item.tags.length - 4}</span>}
                        </span>
                      )}
                    </div>

                    {/* Checkbox overlay */}
                    <div style={{ position: 'absolute', top: '14px', right: '16px', display: 'none' }} onClick={e => e.stopPropagation()}>
                    </div>
                  </div>

                  {/* Selection checkbox */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', padding: '14px 0 14px 8px' }} onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(item._id)}
                      style={{ accentColor: '#6366f1', width: '15px', height: '15px', cursor: 'pointer' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Pagination ── */}
          {sorted.length > PAGE_SIZE && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', padding: '12px 0' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, sorted.length)}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
              </span>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ ...btnSmall, opacity: page <= 1 ? 0.3 : 1, padding: '6px 12px' }}>← Prev</button>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '0 8px', fontWeight: '600' }}>{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ ...btnSmall, opacity: page >= totalPages ? 0.3 : 1, padding: '6px 12px' }}>Next →</button>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'queries' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <LiquidButton variant="secondary" size="sm" onClick={() => setQueryChartVisible(v => !v)}>
              {queryChartVisible ? '📊 Hide Charts' : '📊 Show Charts'}
            </LiquidButton>
          </div>
          {queryChartVisible && queryChartData && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--surface-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>By Status</div>
                <div style={{ height: '160px' }}><Bar data={queryChartData.status} options={queryChartOptions} /></div>
              </div>
              <div style={{ background: 'var(--surface-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>By Type</div>
                <div style={{ display: 'flex', alignItems: 'center', height: '160px' }}>
                  <div style={{ width: '120px', height: '120px', flexShrink: 0 }}><Doughnut data={queryChartData.type} options={{ responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { display: false } } }} /></div>
                  <div style={{ marginLeft: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {queryChartData.type.labels.map((l, i) => (
                      <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: queryChartData.type.datasets[0].backgroundColor[i] }} />
                        {l} ({queryChartData.type.datasets[0].data[i]})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ background: 'var(--surface-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>By Priority</div>
                <div style={{ height: '160px' }}><Bar data={queryChartData.priority} options={queryChartOptions} /></div>
              </div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
            {queries.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No saved queries yet. Go to All Items, set filters, and save as a query.</div>
            )}
            {queries.map(q => (
              <div key={q._id} style={{
                background: 'var(--surface-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)',
                padding: '16px', cursor: 'pointer', transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                onClick={() => {
                  if (q.filters) {
                    setFilterType(q.filters.type || '');
                    setFilterStatus(q.filters.status || '');
                    setFilterPriority(q.filters.priority || '');
                    setFilterAssignee(q.filters.assignee || '');
                    setFilterTag(q.filters.tag || '');
                    setFilterDateFrom(q.filters.dateFrom || '');
                    setFilterDateTo(q.filters.dateTo || '');
                    setSearch(q.filters.search || '');
                  }
                  setTab('items');
                }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary, #f1f5f9)', marginBottom: '4px' }}>{q.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {q.filters?.type || 'All types'} · {q.filters?.status || 'All statuses'}
                      {q.filters?.assignee ? ` · ${q.filters.assignee}` : ''}
                      {q.filters?.priority ? ` · P${q.filters.priority}` : ''}
                      {q.filters?.search ? ` · "${q.filters.search}"` : ''}
                    </div>
                  </div>
                  <button onClick={async (e) => {
                    e.stopPropagation();
                    if (confirm('Delete query?')) { await api.deleteQuery(q._id); fetchQueries(); }
                  }} style={{ ...btnIcon, color: '#ef4444', flexShrink: 0 }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'templates' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <LiquidButton variant="default" size="sm" onClick={async () => {
              const name = prompt('Template name:');
              if (!name) return;
              await api.createTemplate({ projectId, name, type: 'Task', priority: 3, status: 'Backlog' });
              fetchTemplates();
            }}>+ New Template</LiquidButton>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {templates.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No templates yet. Create one to speed up work item creation.</div>
            )}
            {templates.map(t => (
              <div key={t._id} style={{ background: 'var(--surface-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary, #f1f5f9)' }}>{t.name}</div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={async () => {
                      const name = prompt('Rename template:', t.name);
                      if (name) { await api.updateTemplate(t._id, { name }); fetchTemplates(); }
                    }} style={{ ...btnIcon, fontSize: '12px' }}>✏️</button>
                    <button onClick={async () => { if (confirm('Delete template?')) { await api.deleteTemplate(t._id); fetchTemplates(); } }} style={{ ...btnIcon, color: '#ef4444' }}>🗑</button>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span>Type: {t.type}</span>
                  <span>Priority: {t.priority}</span>
                  <span>Status: {t.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'recycle' && (
        <div>
          <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
            Deleted work items are kept for 30 days. You can restore them or permanently delete.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
            {deletedItems.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Recycle bin is empty.</div>
            )}
            {deletedItems.map(d => (
              <div key={d._id} style={{ background: 'var(--surface-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '16px', opacity: 0.8 }}>
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary, #f1f5f9)', marginBottom: '4px' }}>{d.data?.title || 'Untitled'}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  WI-{d.data?.workItemId} · {d.data?.type} · Deleted {new Date(d.deletedAt).toLocaleDateString()}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <LiquidButton variant="default" size="sm" onClick={async () => { await api.restoreWorkItem(d._id); fetchDeleted(); fetchItems(); }}>♻️ Restore</LiquidButton>
                  <LiquidButton variant="destructive" size="sm" onClick={async () => { if (confirm('Permanently delete? This cannot be undone.')) { await api.permanentDeleteWorkItem(d._id); fetchDeleted(); } }}>Delete Forever</LiquidButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Work Item" wide>
        <WorkItemForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} submitLabel="Create Work Item" templates={templates} projectId={projectId} />
      </Modal>

      <Modal open={showSaveQuery} onClose={() => setShowSaveQuery(false)} title="Save Query">
        <div>
          <label style={labelStyle}>Query Name</label>
          <input value={queryName} onChange={e => setQueryName(e.target.value)} placeholder="e.g. My Open Bugs"
            style={{ ...inputStyle, marginBottom: '12px' }} />
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.6 }}>
            <div>This will save:</div>
            <div>Type: {filterType || 'All'} · Status: {filterStatus || 'All'} · Priority: {filterPriority ? PRIORITY_LABELS[filterPriority] : 'All'}</div>
            <div>Assignee: {filterAssignee || 'All'} · Tag: {filterTag || 'All'}</div>
            {(filterDateFrom || filterDateTo) && <div>Date: {filterDateFrom || 'any'} to {filterDateTo || 'any'}</div>}
            {search && <div>Search: "{search}"</div>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <LiquidButton variant="secondary" size="sm" onClick={() => setShowSaveQuery(false)}>Cancel</LiquidButton>
            <LiquidButton variant="default" size="sm" onClick={async () => {
              if (!queryName.trim()) return;
              await api.createQuery({ projectId, name: queryName.trim(), filters: { type: filterType, status: filterStatus, priority: filterPriority, assignee: filterAssignee, tag: filterTag, dateFrom: filterDateFrom, dateTo: filterDateTo, search } });
              setQueryName('');
              setShowSaveQuery(false);
              fetchQueries();
            }}>Save Query</LiquidButton>
          </div>
        </div>
      </Modal>

      {detailItem && <WorkItemDetail item={detailItem} onClose={() => { setDetailItem(null); fetchItems(); }} />}
    </div>
  );
}

function WorkItemDetail({ item, onClose }) {
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ ...item, tags: (item.tags || []).join(', ') });
  const [links, setLinks] = useState([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkTarget, setLinkTarget] = useState('');
  const [linkType, setLinkType] = useState('Related');
  const [linkComment, setLinkComment] = useState('');
  const [allItems, setAllItems] = useState([]);
  const [attachments, setAttachments] = useState(item.attachments || []);
  const [discussions, setDiscussions] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const fetchDiscussions = useCallback(async () => {
    try { const res = await api.getDiscussions(item._id); if (res.success) setDiscussions(res.data || []); } catch {}
  }, [item._id]);

  const fetchLinks = useCallback(async () => {
    try {
      const res = await api.getWorkItemLinks(item._id);
      if (res.success) setLinks(res.data || []);
    } catch (err) { console.error(err); }
  }, [item._id]);

  useEffect(() => { fetchLinks(); fetchDiscussions(); }, [fetchLinks, fetchDiscussions]);

  useEffect(() => {
    const checkFollow = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const res = await api.isFollowing(user.id || user._id, item._id);
        if (res.success) setIsFollowing(res.data);
      } catch {}
    };
    checkFollow();
  }, [item._id]);

  const handleToggleFollow = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (isFollowing) {
        await api.unfollowWorkItem({ userId: user.id || user._id, workItemId: item._id });
      } else {
        await api.followWorkItem({ userId: user.id || user._id, workItemId: item._id, projectId: item.projectId });
      }
      setIsFollowing(!isFollowing);
    } catch {}
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const mentions = [...newComment.matchAll(/@(\w+)/g)].map(m => m[1]);
    await api.createDiscussion({ workItemId: item._id, content: newComment, mentions });
    setNewComment('');
    fetchDiscussions();
  };

  const handleEditComment = async (id) => {
    if (!editCommentText.trim()) return;
    await api.updateDiscussion(id, { content: editCommentText });
    setEditingComment(null);
    setEditCommentText('');
    fetchDiscussions();
  };

  const handleDeleteComment = async (id) => {
    if (!confirm('Delete comment?')) return;
    await api.deleteDiscussion(id);
    fetchDiscussions();
  };

  const handleReaction = async (discussionId, emoji) => {
    await api.toggleReaction(discussionId, emoji, item._id);
    fetchDiscussions();
  };

  const loadAllItems = async () => {
    try {
      const res = await api.getWorkItems(item.projectId, {});
      if (res.success) setAllItems((res.data || []).filter(i => i._id !== item._id));
    } catch (err) { console.error(err); }
  };

  const handleSave = async () => {
    const payload = { ...form };
    payload.tags = typeof payload.tags === 'string' ? payload.tags.split(',').map(t => t.trim()).filter(Boolean) : payload.tags;
    payload.storyPoints = payload.storyPoints !== '' && payload.storyPoints !== undefined ? Number(payload.storyPoints) : undefined;
    payload.effort = payload.effort !== '' && payload.effort !== undefined ? Number(payload.effort) : undefined;
    payload.remainingWork = payload.remainingWork !== '' && payload.remainingWork !== undefined ? Number(payload.remainingWork) : undefined;
    payload.originalEstimate = payload.originalEstimate !== '' && payload.originalEstimate !== undefined ? Number(payload.originalEstimate) : undefined;
    payload.completedWork = payload.completedWork !== '' && payload.completedWork !== undefined ? Number(payload.completedWork) : undefined;
    await api.updateWorkItem(item._id, payload);
    setEdit(false);
    onClose();
  };

  const handleAddLink = async () => {
    if (!linkTarget) return;
    await api.createWorkItemLink({ sourceId: item._id, targetId: linkTarget, linkType, comment: linkComment });
    setLinkTarget(''); setLinkType('Related'); setLinkComment('');
    setShowLinkModal(false);
    fetchLinks();
  };

  const handleDeleteLink = async (id) => {
    await api.deleteWorkItemLink(id);
    fetchLinks();
  };

  const handleUploadAttachment = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.uploadWorkItemAttachment(item._id, file);
      if (res.success) setAttachments(res.data.attachments || []);
    } catch { /* ignore */ }
  };

  const handleDeleteAttachment = async (idx) => {
    try {
      const res = await api.deleteWorkItemAttachment(item._id, idx);
      if (res.success) setAttachments(res.data.attachments || []);
    } catch { /* ignore */ }
  };

  const handleSaveAsTemplate = async () => {
    const name = prompt('Template name:');
    if (!name) return;
    try {
      await api.createTemplate({
        projectId: item.projectId, name, type: item.type, priority: item.priority,
        severity: item.severity, status: 'Backlog', storyPoints: item.storyPoints,
        effort: item.effort, areaPath: item.areaPath, iterationPath: item.iterationPath,
        activity: item.activity, acceptanceCriteria: item.acceptanceCriteria,
        tags: item.tags || [], description: item.description,
      });
      alert('Template saved!');
    } catch { /* ignore */ }
  };

  const history = item.stateHistory || [];
  const displayForm = (k) => {
    if (k === 'tags') return typeof form.tags === 'string' ? form.tags : (form.tags || []).join(', ');
    return form[k] ?? '';
  };

  const FieldEdit = ({ label, field, type, options }) => (
    <div>
      <label style={labelStyle}>{label}</label>
      {edit ? (
        type === 'select' ? (
          <Select value={form[field]} onChange={v => set(field, field === 'priority' ? Number(v) : v)} options={options} style={{ height: '36px' }} />
        ) : type === 'textarea' ? (
          <RichTextEditor value={displayForm(field)} onChange={v => set(field, v)} placeholder={label} minHeight={80} />
        ) : (
          <input type={type || 'text'} value={displayForm(field)} onChange={e => set(field, e.target.value)} style={{ ...inputStyle, height: '36px' }} />
        )
      ) : (
        <div style={{ fontSize: '13px', color: 'var(--text-primary, #f1f5f9)', minHeight: '20px', whiteSpace: 'pre-wrap' }}>
          {field === 'priority' && <Badge text={`${form.priority} - ${PRIORITY_LABELS[form.priority] || form.priority}`} color={PRIORITY_COLORS[form.priority] || '#888'} small />}
          {field === 'status' && <Badge text={form.status} color={STATUS_COLORS[form.status] || '#888'} />}
          {field === 'type' && <Badge text={form.type} color={TYPE_COLORS[form.type] || '#888'} />}
          {field !== 'priority' && field !== 'status' && field !== 'type' && (displayForm(field) || <span style={{ color: 'var(--text-muted)' }}>—</span>)}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }} onClick={onClose} />
      <div style={{
        position: 'relative', width: '720px', maxWidth: '95vw', height: '100vh',
        background: 'var(--surface-elevated)',
        borderLeft: '1px solid var(--border-color)',
        boxShadow: '-16px 0 48px rgba(0,0,0,0.4)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'panelSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* ── Type color bar ── */}
        <div style={{ height: '3px', background: TYPE_COLORS[item.type] || '#888', flexShrink: 0 }} />

        {/* ── Header ── */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', background: 'var(--surface-tertiary)', padding: '3px 8px', borderRadius: '6px' }}>WI-{item.workItemId}</span>
              <Badge text={item.type} color={TYPE_COLORS[item.type] || '#888'} />
              <Badge text={item.status} color={STATUS_COLORS[item.status] || '#888'} />
              <Badge text={`${PRIORITY_LABELS[item.priority] || item.priority}`} color={PRIORITY_COLORS[item.priority] || '#888'} small />
            </div>
            <button onClick={onClose} style={{
              width: '30px', height: '30px', borderRadius: '8px', border: '1px solid var(--border-color)',
              background: 'var(--surface-secondary)', color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
              transition: 'all 0.15s', flexShrink: 0,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-bg)'; e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'var(--danger-border)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-secondary)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >×</button>
          </div>
          {edit ? (
            <input value={form.title} onChange={e => set('title', e.target.value)}
              style={{ ...inputStyle, fontSize: '17px', fontWeight: '600', padding: '8px 12px', letterSpacing: '-0.01em' }} />
          ) : (
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.3 }}>{item.title}</h2>
          )}
          {/* ── Action bar ── */}
          <div style={{ display: 'flex', gap: '4px', marginTop: '14px', flexWrap: 'wrap' }}>
            {edit ? (
              <>
                <LiquidButton variant="default" size="sm" onClick={handleSave}>Save changes</LiquidButton>
                <LiquidButton variant="secondary" size="sm" onClick={() => { setEdit(false); setForm({ ...item, tags: (item.tags || []).join(', ') }); }}>Cancel</LiquidButton>
              </>
            ) : (
              <>
                <LiquidButton variant="secondary" size="sm" onClick={() => setEdit(true)}>✏ Edit</LiquidButton>
                <LiquidButton variant="secondary" size="sm" onClick={handleSaveAsTemplate}>📋 Template</LiquidButton>
                <LiquidButton variant="secondary" size="sm" onClick={async () => { const res = await api.cloneWorkItem(item._id); if (res.success) { fetchItems(); alert('Cloned!'); } }}>📄 Clone</LiquidButton>
                <LiquidButton variant="secondary" size="sm" onClick={handleToggleFollow}>{isFollowing ? '🔕 Following' : '🔔 Follow'}</LiquidButton>
                <LiquidButton variant="destructive" size="sm" onClick={async () => { if (confirm('Delete?')) { await api.deleteWorkItem(item._id); onClose(); } }}>🗑 Delete</LiquidButton>
              </>
            )}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
          {/* Section: Details */}
          <div style={{ padding: '20px 0', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
              <FieldEdit label="Priority" field="priority" type="select" options={PRIORITIES.map(p => ({ value: p, label: `${p} - ${PRIORITY_LABELS[p]}` }))} />
              <FieldEdit label="Severity" field="severity" type="select" options={SEVERITIES.map(s => ({ value: s, label: s }))} />
              <FieldEdit label="Status" field="status" type="select" options={STATUSES.map(s => ({ value: s, label: s }))} />
              <FieldEdit label="Assignee" field="assignee" />
              <FieldEdit label="Story Points" field="storyPoints" type="number" />
              <FieldEdit label="Effort" field="effort" type="number" />
              <FieldEdit label="Remaining Work" field="remainingWork" type="number" />
              <FieldEdit label="Original Estimate" field="originalEstimate" type="number" />
              <FieldEdit label="Completed Work" field="completedWork" type="number" />
              <FieldEdit label="Activity" field="activity" type="select" options={ACTIVITIES.map(a => ({ value: a, label: a }))} />
              <FieldEdit label="Area Path" field="areaPath" />
              <FieldEdit label="Iteration Path" field="iterationPath" />
            </div>
          </div>

          {/* Section: Tags */}
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Tags</div>
            {edit ? (
              <input value={displayForm('tags')} onChange={e => set('tags', e.target.value)}
                placeholder="tag1, tag2, tag3" style={{ ...inputStyle, height: '36px' }} />
            ) : (
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {(item.tags || []).length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No tags yet</span>}
                {(item.tags || []).map((t, i) => (
                  <span key={i} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '6px', background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', fontWeight: '500' }}>{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Section: Description */}
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Description</div>
            <FieldEdit label="" field="description" type="textarea" />
          </div>

          {/* Section: Acceptance Criteria */}
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Acceptance Criteria</div>
            <FieldEdit label="" field="acceptanceCriteria" type="textarea" />
          </div>

          {/* Section: Attachments */}
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Attachments ({attachments.length})</div>
              <label style={{ ...btnPrimary, ...btnSmall, cursor: 'pointer', fontSize: '11px' }}>
                + Upload
                <input type="file" onChange={handleUploadAttachment} style={{ display: 'none' }} />
              </label>
            </div>
            {attachments.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '12px', background: 'var(--surface-secondary)', borderRadius: '8px', textAlign: 'center' }}>No attachments yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {attachments.map((att, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px',
                    background: 'var(--surface-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: '14px' }}>📎</span>
                      <a href={att.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#818cf8', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {att.originalName}
                      </a>
                      {att.size && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({(att.size / 1024).toFixed(1)} KB)</span>}
                    </div>
                    <button onClick={() => handleDeleteAttachment(idx)} style={{ ...btnIcon, color: '#ef4444', padding: '4px 6px' }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Links */}
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Links ({links.length})</div>
              <LiquidButton variant="default" size="sm" onClick={() => { setShowLinkModal(true); loadAllItems(); }}>+ Add Link</LiquidButton>
            </div>
            {links.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '12px', background: 'var(--surface-secondary)', borderRadius: '8px', textAlign: 'center' }}>No linked items</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {links.map(link => {
                  const target = link.targetId && typeof link.targetId === 'object' ? link.targetId : null;
                  return (
                    <div key={link._id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px',
                      background: 'var(--surface-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Badge text={link.linkType} color="#6366f1" small />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                          {target ? `WI-${target.workItemId}` : 'WI-?'}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{target?.title || 'Unknown'}</span>
                        {link.comment && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({link.comment})</span>}
                      </div>
                      <button onClick={() => handleDeleteLink(link._id)} style={{ ...btnIcon, color: '#ef4444', padding: '4px 6px' }}>×</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Discussion */}
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Discussion ({discussions.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {discussions.map(c => (
                <div key={c._id} style={{ padding: '12px', background: 'var(--surface-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff', fontWeight: '700' }}>
                        {(c.author || '?')[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>{c.author}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleString()}</span>
                      {c.editedAt && <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>(edited)</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button onClick={() => { setEditingComment(c._id); setEditCommentText(c.content); }} style={{ ...btnIcon, fontSize: '10px', padding: '3px 5px' }}>✏️</button>
                      <button onClick={() => handleDeleteComment(c._id)} style={{ ...btnIcon, color: '#ef4444', fontSize: '10px', padding: '3px 5px' }}>🗑</button>
                    </div>
                  </div>
                  {editingComment === c._id ? (
                    <div>
                      <textarea value={editCommentText} onChange={e => setEditCommentText(e.target.value)} style={{ ...inputStyle, minHeight: '60px', fontSize: '12px' }} />
                      <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                        <LiquidButton variant="default" size="sm" onClick={() => handleEditComment(c._id)}>Save</LiquidButton>
                        <button onClick={() => setEditingComment(null)} style={{ ...btnSmall, fontSize: '11px' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                      {c.content.split(/(@\w+)/g).map((part, i) => part.startsWith('@') ? <span key={i} style={{ color: '#818cf8', fontWeight: '600' }}>{part}</span> : part)}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '3px', marginTop: '8px' }}>
                    {['👍', '❤️', '😂', '🎉', '👀'].map(emoji => (
                      <button key={emoji} onClick={() => handleReaction(c._id, emoji)} style={{
                        padding: '3px 7px', borderRadius: '6px', border: '1px solid var(--border-color)',
                        background: (c.reactions || []).some(r => r.emoji === emoji) ? 'rgba(99,102,241,0.12)' : 'transparent',
                        cursor: 'pointer', fontSize: '12px', transition: 'all 0.15s',
                      }}>
                        {emoji} {(c.reactions || []).filter(r => r.emoji === emoji).length || ''}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment... Use @name to mention" style={{ ...inputStyle, minHeight: '56px', flex: 1, fontSize: '13px' }} />
              <LiquidButton variant="default" size="sm" onClick={handleAddComment} disabled={!newComment.trim()} style={{ alignSelf: 'flex-end' }}>Post</LiquidButton>
            </div>
          </div>

          {/* Section: History */}
          {(history.length > 0 || (item.fieldHistory || []).length > 0) && (
            <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>History ({history.length + (item.fieldHistory || []).length})</div>
              <div style={{ position: 'relative', paddingLeft: '20px' }}>
                <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '2px', background: 'rgba(99,102,241,0.15)' }} />
                {history.map((h, i) => (
                  <div key={`s-${i}`} style={{ position: 'relative', marginBottom: '12px', paddingLeft: '12px' }}>
                    <div style={{ position: 'absolute', left: '-16px', top: '6px', width: '10px', height: '10px', borderRadius: '50%', background: STATUS_COLORS[h.status] || '#6366f1', border: '2px solid var(--surface-elevated)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <Badge text={h.status} color={STATUS_COLORS[h.status] || '#888'} small />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {h.changedAt ? new Date(h.changedAt).toLocaleString() : 'Unknown date'}
                        {h.changedBy ? ` · ${h.changedBy}` : ''}
                      </span>
                    </div>
                  </div>
                ))}
                {(item.fieldHistory || []).slice().reverse().map((h, i) => (
                  <div key={`f-${i}`} style={{ position: 'relative', marginBottom: '12px', paddingLeft: '12px' }}>
                    <div style={{ position: 'absolute', left: '-16px', top: '6px', width: '10px', height: '10px', borderRadius: '50%', background: '#818cf8', border: '2px solid var(--surface-elevated)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-primary)' }}>{h.field}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {String(h.oldValue || '—')} → {String(h.newValue || '—')}
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {h.changedAt ? new Date(h.changedAt).toLocaleString() : ''} {h.changedBy ? `· ${h.changedBy}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer timestamps */}
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '16px 0 0', display: 'flex', gap: '16px' }}>
            <span>Created {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}</span>
            <span>Updated {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '—'}</span>
          </div>
        </div>

        <Modal open={showLinkModal} onClose={() => setShowLinkModal(false)} title="Add Link">
          <div>
            <label style={labelStyle}>Linked Work Item</label>
            <select value={linkTarget} onChange={e => setLinkTarget(e.target.value)}
              style={{ ...inputStyle, height: '38px', marginBottom: '12px' }}>
              <option value="">Select a work item...</option>
              {allItems.map(i => (
                <option key={i._id} value={i._id}>WI-{i.workItemId} — {i.title}</option>
              ))}
            </select>
            <label style={labelStyle}>Link Type</label>
            <Select value={linkType} onChange={setLinkType} options={LINK_TYPES} style={{ height: '38px', marginBottom: '12px' }} />
            <label style={labelStyle}>Comment (optional)</label>
            <input value={linkComment} onChange={e => setLinkComment(e.target.value)} style={{ ...inputStyle, height: '38px', marginBottom: '16px' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <LiquidButton variant="secondary" size="sm" onClick={() => setShowLinkModal(false)}>Cancel</LiquidButton>
              <LiquidButton variant="default" size="sm" onClick={handleAddLink}>Add Link</LiquidButton>
            </div>
          </div>
        </Modal>
      </div>
      <style>{`@keyframes panelSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </div>
  );
}
