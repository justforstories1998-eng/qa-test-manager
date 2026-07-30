import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api';
import RichTextEditor from './shared/RichTextEditor';
import './shared/chartSetup';
import { Doughnut, Bar } from 'react-chartjs-2';
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
      <div style={{ position: 'absolute', inset: 0, background: 'var(--surface-overlay)', backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'relative', width: wide ? '800px' : '520px', maxWidth: '95vw', maxHeight: '90vh',
        background: 'var(--surface-elevated)', borderRadius: '16px', border: '1px solid var(--border-color)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)', fontWeight: '600' }}>{title}</h3>
          <button onClick={onClose} style={{ ...btnIcon, fontSize: '18px', lineHeight: 1, padding: '4px 8px' }}>×</button>
        </div>
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
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
  const fields = [
    { key: 'title', label: 'Title', type: 'text', full: true, required: true },
    { key: 'type', label: 'Type', type: 'select', options: TYPES },
    { key: 'priority', label: 'Priority', type: 'select', options: PRIORITIES.map(p => ({ value: p, label: `${p} - ${PRIORITY_LABELS[p]}` })) },
    { key: 'severity', label: 'Severity', type: 'select', options: SEVERITIES },
    { key: 'status', label: 'Status', type: 'select', options: STATUSES },
    { key: 'assignee', label: 'Assignee', type: 'text' },
    { key: 'storyPoints', label: 'Story Points', type: 'number' },
    { key: 'effort', label: 'Effort', type: 'number' },
    { key: 'remainingWork', label: 'Remaining Work', type: 'number' },
    { key: 'originalEstimate', label: 'Original Estimate', type: 'number' },
    { key: 'completedWork', label: 'Completed Work', type: 'number' },
    { key: 'activity', label: 'Activity', type: 'select', options: ACTIVITIES },
    { key: 'areaPath', label: 'Area Path', type: 'text' },
    { key: 'iterationPath', label: 'Iteration Path', type: 'text' },
    { key: 'tags', label: 'Tags (comma-separated)', type: 'text', full: true },
  ];
  return (
    <div>
      {templates && templates.length > 0 && (
        <div style={{ marginBottom: '14px', padding: '10px 12px', background: 'var(--surface-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
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
          }} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-secondary)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
            <option value="">— Select a template —</option>
            {templates.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        {fields.map(f => (
          <div key={f.key} style={{ gridColumn: f.full ? '1 / -1' : undefined }}>
            <label style={labelStyle}>{f.label}</label>
            {f.type === 'select' ? (
              <Select value={form[f.key]} onChange={v => set(f.key, f.key === 'priority' ? Number(v) : v)}
                options={f.options} style={{ height: '38px' }} />
            ) : f.key === 'description' || f.key === 'acceptanceCriteria' ? (
              <RichTextEditor value={form[f.key]} onChange={v => set(f.key, v)} placeholder={f.label} minHeight={80} />
            ) : (
              <input type={f.type} value={form[f.key]} onChange={e => set(f.key, f.type === 'number' ? e.target.value : e.target.value)}
                style={{ ...inputStyle, height: '38px' }} />
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={labelStyle}>Description</label>
          <RichTextEditor value={form.description} onChange={v => set('description', v)} placeholder="Describe the work item..." minHeight={100} />
        </div>
        <div>
          <label style={labelStyle}>Acceptance Criteria</label>
          <RichTextEditor value={form.acceptanceCriteria} onChange={v => set('acceptanceCriteria', v)} placeholder="Define acceptance criteria..." minHeight={100} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
        <button onClick={onCancel} style={btnSecondary}>Cancel</button>
        <button onClick={() => {
          if (!form.title.trim()) return;
          const payload = { ...form };
          payload.storyPoints = payload.storyPoints !== '' ? Number(payload.storyPoints) : undefined;
          payload.effort = payload.effort !== '' ? Number(payload.effort) : undefined;
          payload.remainingWork = payload.remainingWork !== '' ? Number(payload.remainingWork) : undefined;
          payload.originalEstimate = payload.originalEstimate !== '' ? Number(payload.originalEstimate) : undefined;
          payload.completedWork = payload.completedWork !== '' ? Number(payload.completedWork) : undefined;
          payload.tags = typeof payload.tags === 'string' ? payload.tags.split(',').map(t => t.trim()).filter(Boolean) : payload.tags;
          onSubmit(payload);
        }} style={btnPrimary}>{submitLabel || 'Create'}</button>
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
      if (search) filters.search = search;
      const res = await api.getWorkItems(projectId, filters);
      if (res.success) setItems(res.data || []);
    } catch (err) {
      console.error('Failed to fetch work items', err);
    }
    setLoading(false);
  }, [projectId, filterType, filterStatus, search]);

  const fetchQueries = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await api.getQueries(projectId);
      if (res.success) setQueries(res.data || []);
    } catch (err) {
      console.error('Failed to fetch queries', err);
    }
  }, [projectId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { if (tab === 'queries') fetchQueries(); }, [tab, fetchQueries]);
  useEffect(() => { if (tab === 'templates') fetchTemplates(); }, [tab, fetchTemplates]);
  useEffect(() => { if (tab === 'recycle') fetchDeleted(); }, [tab, fetchDeleted]);

  const fetchTemplates = useCallback(async () => {
    if (!projectId) return;
    try { const res = await api.getTemplates(projectId); if (res.success) setTemplates(res.data || []); } catch {}
  }, [projectId]);

  const fetchDeleted = useCallback(async () => {
    if (!projectId) return;
    try { const res = await api.getRecycleBin(projectId); if (res.success) setDeletedItems(res.data || []); } catch {}
  }, [projectId]);

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

  useEffect(() => { setPage(1); }, [filterType, filterStatus, search]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

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

  const handleSortIcon = (key) => {
    if (sortKey !== key) return ' ↕';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  const colHeader = (key, label, w) => (
    <th key={key} onClick={() => toggleSort(key)} style={{
      padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700',
      color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
      cursor: 'pointer', userSelect: 'none', width: w, whiteSpace: 'nowrap',
      borderBottom: '1px solid var(--border-color)',
      background: sortKey === key ? 'var(--surface-interaction)' : 'transparent',
    }}>
      {label}{handleSortIcon(key)}
    </th>
  );

  const renderRow = (item) => (
    <tr key={item._id} onClick={() => setDetailItem(item)}
      style={{ cursor: 'pointer', background: selected.has(item._id) ? 'var(--surface-interaction)' : 'transparent', transition: 'background 0.15s' }}
      onMouseEnter={e => { if (!selected.has(item._id)) e.currentTarget.style.background = 'var(--surface-glass-hover)'; }}
      onMouseLeave={e => { if (!selected.has(item._id)) e.currentTarget.style.background = selected.has(item._id) ? 'var(--surface-interaction)' : 'transparent'; }}>
      <td style={tdStyle} onClick={e => e.stopPropagation()}>
        <input type="checkbox" checked={selected.has(item._id)} onChange={() => toggleSelect(item._id)}
          style={{ accentColor: '#6366f1', width: '15px', height: '15px', cursor: 'pointer' }} />
      </td>
      <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>WI-{item.workItemId}</span></td>
      <td style={{ ...tdStyle, maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '500' }}>{item.title}</td>
      <td style={tdStyle}><Badge text={item.type} color={TYPE_COLORS[item.type] || '#888'} /></td>
      <td style={tdStyle}>
        <Badge text={PRIORITY_LABELS[item.priority] || item.priority} color={PRIORITY_COLORS[item.priority] || '#888'} small />
      </td>
      <td style={tdStyle}><Badge text={item.status} color={STATUS_COLORS[item.status] || '#888'} small /></td>
      <td style={tdStyle}>{item.assignee || '—'}</td>
      <td style={tdStyle}>{item.storyPoints ?? '—'}</td>
      <td style={tdStyle}>{item.effort ?? '—'}</td>
      <td style={tdStyle}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {(item.tags || []).slice(0, 3).map((t, i) => (
            <span key={i} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>{t}</span>
          ))}
          {(item.tags || []).length > 3 && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>+{item.tags.length - 3}</span>}
        </div>
      </td>
      <td style={{ ...tdStyle, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
        <button onClick={() => setDetailItem(item)} style={{ ...btnIcon, marginRight: '4px' }} title="View">👁</button>
        <button onClick={async (e) => { e.stopPropagation(); const res = await api.cloneWorkItem(item._id); if (res.success) fetchItems(); }} style={{ ...btnIcon, marginRight: '4px' }} title="Clone">📄</button>
        <button onClick={async () => { if (confirm('Delete?')) { await api.deleteWorkItem(item._id); fetchItems(); } }} style={{ ...btnIcon, color: '#ef4444' }} title="Delete">🗑</button>
      </td>
    </tr>
  );

  return (
    <div style={{ padding: '0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-secondary)', borderRadius: '10px', padding: '4px', border: '1px solid var(--border-color)' }}>
          {[['items', 'All Items'], ['queries', 'Saved Queries'], ['templates', 'Templates'], ['recycle', 'Recycle Bin']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              ...btnSmall, borderRadius: '7px', border: 'none',
              background: tab === k ? 'linear-gradient(135deg, #6366f1, #7c3aed)' : 'transparent',
              color: tab === k ? '#fff' : 'var(--text-muted)',
            }}>{l}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {selected.size > 0 && (
            <>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selected.size} selected</span>
              <Select value="" onChange={v => { if (v) handleBulkStatus(v); }} options={[{ value: '', label: 'Status...' }, ...STATUSES.map(s => ({ value: s, label: s }))]} style={{ width: '120px', height: '34px', fontSize: '12px' }} />
              <Select value="" onChange={v => { if (v) handleBulkType(v); }} options={[{ value: '', label: 'Type...' }, ...TYPES.map(t => ({ value: t, label: t }))]} style={{ width: '120px', height: '34px', fontSize: '12px' }} />
              <button onClick={handleBulkDelete} style={{ ...btnDanger, ...btnSmall }}>🗑 Delete</button>
            </>
          )}
          {tab === 'queries' && (
            <button onClick={() => setShowSaveQuery(true)} style={{ ...btnSecondary, ...btnSmall }}>💾 Save Current Query</button>
          )}
          <button onClick={() => setShowCreate(true)} style={{ ...btnPrimary }}>+ New Work Item</button>
        </div>
      </div>

      {tab === 'items' && (
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 250px' }}>
              <input placeholder="Search work items..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ ...inputStyle, paddingLeft: '36px', height: '38px' }} />
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', opacity: 0.4 }}>🔍</span>
            </div>
            <Select value={filterType} onChange={setFilterType} options={[{ value: '', label: 'All Types' }, ...TYPES.map(t => ({ value: t, label: t }))]} style={{ width: '160px', height: '38px' }} />
            <Select value={filterStatus} onChange={setFilterStatus} options={[{ value: '', label: 'All Statuses' }, ...STATUSES.map(s => ({ value: s, label: s }))]} style={{ width: '160px', height: '38px' }} />
          </div>

          <div style={{ background: 'var(--surface-tertiary)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', width: '40px' }}>
                    <input type="checkbox" checked={paged.length > 0 && selected.size === paged.length} onChange={toggleSelectAll}
                      style={{ accentColor: '#6366f1', width: '15px', height: '15px', cursor: 'pointer' }} />
                  </th>
                  {colHeader('workItemId', 'ID', '80px')}
                  {colHeader('title', 'Title', 'auto')}
                  {colHeader('type', 'Type', '120px')}
                  {colHeader('priority', 'Priority', '90px')}
                  {colHeader('status', 'Status', '100px')}
                  {colHeader('assignee', 'Assignee', '120px')}
                  {colHeader('storyPoints', 'Points', '70px')}
                  {colHeader('effort', 'Effort', '70px')}
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)', width: '150px' }}>Tags</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)', width: '90px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="12" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan="12" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No work items found</td></tr>
                ) : paged.map(renderRow)}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, sorted.length)}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ ...btnSmall, opacity: page <= 1 ? 0.4 : 1 }}>← Prev</button>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '4px 8px' }}>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ ...btnSmall, opacity: page >= totalPages ? 0.4 : 1 }}>Next →</button>
            </div>
          </div>
        </>
      )}

      {tab === 'queries' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <button onClick={() => setQueryChartVisible(v => !v)} style={{ ...btnSecondary, ...btnSmall }}>
              {queryChartVisible ? '📊 Hide Charts' : '📊 Show Charts'}
            </button>
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
                    setSearch(q.filters.search || '');
                  }
                  setTab('items');
                }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary, #f1f5f9)', marginBottom: '4px' }}>{q.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {q.filters?.type || 'All types'} · {q.filters?.status || 'All statuses'}
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
            <button onClick={async () => {
              const name = prompt('Template name:');
              if (!name) return;
              await api.createTemplate({ projectId, name, type: 'Task', priority: 3, status: 'Backlog' });
              fetchTemplates();
            }} style={{ ...btnPrimary, ...btnSmall }}>+ New Template</button>
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
                  <button onClick={async () => { await api.restoreWorkItem(d._id); fetchDeleted(); fetchItems(); }} style={{ ...btnPrimary, ...btnSmall, fontSize: '11px' }}>♻️ Restore</button>
                  <button onClick={async () => { if (confirm('Permanently delete? This cannot be undone.')) { await api.permanentDeleteWorkItem(d._id); fetchDeleted(); } }} style={{ ...btnDanger, ...btnSmall, fontSize: '11px' }}>Delete Forever</button>
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
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            This will save: Type={filterType || 'All'}, Status={filterStatus || 'All'}, Search="{search || ''}"
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button onClick={() => setShowSaveQuery(false)} style={btnSecondary}>Cancel</button>
            <button onClick={async () => {
              if (!queryName.trim()) return;
              await api.createQuery({ projectId, name: queryName.trim(), filters: { type: filterType, status: filterStatus, search } });
              setQueryName('');
              setShowSaveQuery(false);
              fetchQueries();
            }} style={btnPrimary}>Save Query</button>
          </div>
        </div>
      </Modal>

      {detailItem && <WorkItemDetail item={detailItem} onClose={() => { setDetailItem(null); fetchItems(); }} />}
    </div>
  );
}

const tdStyle = { padding: '12px 16px', borderBottom: '1px solid var(--border-color)' };

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

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const fetchLinks = useCallback(async () => {
    try {
      const res = await api.getWorkItemLinks(item._id);
      if (res.success) setLinks(res.data || []);
    } catch (err) { console.error(err); }
  }, [item._id]);

  useEffect(() => { fetchLinks(); fetchDiscussions(); }, [fetchLinks, fetchDiscussions]);

  const fetchDiscussions = useCallback(async () => {
    try { const res = await api.getDiscussions(item._id); if (res.success) setDiscussions(res.data || []); } catch {}
  }, [item._id]);

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
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} onClick={onClose} />
      <div style={{
        position: 'relative', width: '680px', maxWidth: '95vw', height: '100vh', background: '#1e1e2e',
        borderLeft: '1px solid var(--border-color)',
        boxShadow: '-10px 0 40px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>WI-{item.workItemId}</span>
              <Badge text={item.type} color={TYPE_COLORS[item.type] || '#888'} small />
              <Badge text={item.status} color={STATUS_COLORS[item.status] || '#888'} small />
            </div>
            {edit ? (
              <input value={form.title} onChange={e => set('title', e.target.value)}
                style={{ ...inputStyle, fontSize: '18px', fontWeight: '600', padding: '6px 10px', marginBottom: '4px' }} />
            ) : (
              <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary, #f1f5f9)', fontWeight: '600' }}>{item.title}</h2>
            )}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            {edit ? (
              <>
                <button onClick={handleSave} style={{ ...btnPrimary, ...btnSmall }}>Save</button>
                <button onClick={() => { setEdit(false); setForm({ ...item, tags: (item.tags || []).join(', ') }); }} style={btnSecondary}>Cancel</button>
              </>
            ) : (
              <>
                <button onClick={() => setEdit(true)} style={{ ...btnSecondary, ...btnSmall }}>✏ Edit</button>
                <button onClick={handleSaveAsTemplate} style={{ ...btnSecondary, ...btnSmall, fontSize: '11px' }}>📋 Save as Template</button>
                <button onClick={async () => {
                  const res = await api.cloneWorkItem(item._id);
                  if (res.success) { fetchItems(); alert('Work item cloned!'); }
                }} style={{ ...btnSecondary, ...btnSmall, fontSize: '11px' }}>📄 Clone</button>
                <button onClick={async () => { if (confirm('Delete?')) { await api.deleteWorkItem(item._id); onClose(); } }} style={{ ...btnDanger, ...btnSmall }}>🗑</button>
                <button onClick={onClose} style={{ ...btnIcon }}>×</button>
              </>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
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

          <div style={{ marginBottom: '16px' }}>
            <FieldEdit label="Description" field="description" type="textarea" />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <FieldEdit label="Acceptance Criteria" field="acceptanceCriteria" type="textarea" />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Tags</label>
            {edit ? (
              <input value={displayForm('tags')} onChange={e => set('tags', e.target.value)}
                placeholder="tag1, tag2, tag3" style={inputStyle} />
            ) : (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {(item.tags || []).length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No tags</span>}
                {(item.tags || []).map((t, i) => (
                  <span key={i} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '5px', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>{t}</span>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Attachments ({attachments.length})</label>
              <label style={{ ...btnPrimary, ...btnSmall, cursor: 'pointer' }}>
                + Upload
                <input type="file" onChange={handleUploadAttachment} style={{ display: 'none' }} />
              </label>
            </div>
            {attachments.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No attachments</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {attachments.map((att, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px',
                    background: 'var(--surface-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)',
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

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Links ({links.length})</label>
              <button onClick={() => { setShowLinkModal(true); loadAllItems(); }} style={{ ...btnPrimary, ...btnSmall }}>+ Add Link</button>
            </div>
            {links.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No linked items</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {links.map(link => {
                  const target = link.targetId && typeof link.targetId === 'object' ? link.targetId : null;
                  return (
                    <div key={link._id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px',
                      background: 'var(--surface-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Badge text={link.linkType} color="#6366f1" small />
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {target ? `WI-${target.workItemId}` : 'WI-?'}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--text-primary, #f1f5f9)' }}>{target?.title || 'Unknown'}</span>
                        {link.comment && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({link.comment})</span>}
                      </div>
                      <button onClick={() => handleDeleteLink(link._id)} style={{ ...btnIcon, color: '#ef4444', padding: '4px 6px' }}>×</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ ...labelStyle, marginBottom: '10px', display: 'block' }}>Discussion ({discussions.length})</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
              {discussions.map(c => (
                <div key={c._id} style={{ padding: '10px 12px', background: 'var(--surface-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff', fontWeight: '700' }}>
                        {(c.author || '?')[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary, #f1f5f9)' }}>{c.author}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleString()}</span>
                      {c.editedAt && <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>(edited)</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => { setEditingComment(c._id); setEditCommentText(c.content); }} style={{ ...btnIcon, fontSize: '10px', padding: '2px 4px' }}>✏️</button>
                      <button onClick={() => handleDeleteComment(c._id)} style={{ ...btnIcon, color: '#ef4444', fontSize: '10px', padding: '2px 4px' }}>🗑</button>
                    </div>
                  </div>
                  {editingComment === c._id ? (
                    <div>
                      <textarea value={editCommentText} onChange={e => setEditCommentText(e.target.value)} style={{ ...inputStyle, minHeight: '60px', fontSize: '12px' }} />
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                        <button onClick={() => handleEditComment(c._id)} style={{ ...btnPrimary, ...btnSmall, fontSize: '11px' }}>Save</button>
                        <button onClick={() => setEditingComment(null)} style={{ ...btnSmall, fontSize: '11px' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                      {c.content.split(/(@\w+)/g).map((part, i) => part.startsWith('@') ? <span key={i} style={{ color: '#818cf8', fontWeight: '600' }}>{part}</span> : part)}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                    {['👍', '❤️', '😂', '🎉', '👀'].map(emoji => (
                      <button key={emoji} onClick={() => handleReaction(c._id, emoji)} style={{ padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: (c.reactions || []).some(r => r.emoji === emoji) ? 'rgba(99,102,241,0.15)' : 'transparent', cursor: 'pointer', fontSize: '12px' }}>
                        {emoji} {(c.reactions || []).filter(r => r.emoji === emoji).length || ''}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment... Use @name to mention" style={{ ...inputStyle, minHeight: '60px', flex: 1, fontSize: '13px' }} />
              <button onClick={handleAddComment} disabled={!newComment.trim()} style={{ ...btnPrimary, alignSelf: 'flex-end', opacity: !newComment.trim() ? 0.5 : 1 }}>Post</button>
            </div>
          </div>

          {(history.length > 0 || (item.fieldHistory || []).length > 0) && (
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>History ({history.length + (item.fieldHistory || []).length} changes)</label>
              <div style={{ position: 'relative', paddingLeft: '20px' }}>
                <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '2px', background: 'rgba(99,102,241,0.2)' }} />
                {history.map((h, i) => (
                  <div key={`s-${i}`} style={{ position: 'relative', marginBottom: '12px', paddingLeft: '12px' }}>
                    <div style={{ position: 'absolute', left: '-16px', top: '6px', width: '10px', height: '10px', borderRadius: '50%', background: STATUS_COLORS[h.status] || '#6366f1', border: '2px solid #1e1e2e' }} />
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
                    <div style={{ position: 'absolute', left: '-16px', top: '6px', width: '10px', height: '10px', borderRadius: '50%', background: '#818cf8', border: '2px solid #1e1e2e' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-primary, #f1f5f9)' }}>{h.field}</span>
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

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
            Created: {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'} ·
            Updated: {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '—'}
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
              <button onClick={() => setShowLinkModal(false)} style={btnSecondary}>Cancel</button>
              <button onClick={handleAddLink} style={btnPrimary}>Add Link</button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
