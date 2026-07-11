import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api';

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
const btnSecondary = { ...btnBase, background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary, #f1f5f9)', border: '1px solid var(--border-color, rgba(255,255,255,0.06))' };
const btnDanger = { ...btnBase, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' };
const btnSmall = { ...btnBase, padding: '4px 10px', fontSize: '12px' };
const btnIcon = { ...btnSmall, padding: '6px 8px', background: 'transparent', border: '1px solid var(--border-color, rgba(255,255,255,0.06))' };

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
  background: 'rgba(0,0,0,0.2)',
  color: 'var(--text-primary, #f1f5f9)',
  fontSize: '13px',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle = {
  fontSize: '12px',
  fontWeight: '600',
  color: 'rgba(255,255,255,0.6)',
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
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'relative', width: wide ? '800px' : '520px', maxWidth: '95vw', maxHeight: '90vh',
        background: '#1e1e2e', borderRadius: '16px', border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary, #f1f5f9)', fontWeight: '600' }}>{title}</h3>
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

function WorkItemForm({ initial, onSubmit, onCancel, submitLabel }) {
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        {fields.map(f => (
          <div key={f.key} style={{ gridColumn: f.full ? '1 / -1' : undefined }}>
            <label style={labelStyle}>{f.label}</label>
            {f.type === 'select' ? (
              <Select value={form[f.key]} onChange={v => set(f.key, f.key === 'priority' ? Number(v) : v)}
                options={f.options} style={{ height: '38px' }} />
            ) : f.key === 'description' || f.key === 'acceptanceCriteria' ? (
              <textarea value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
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
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="Describe the work item..." />
        </div>
        <div>
          <label style={labelStyle}>Acceptance Criteria</label>
          <textarea value={form.acceptanceCriteria} onChange={e => set('acceptanceCriteria', e.target.value)}
            style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="Define acceptance criteria..." />
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
    for (const id of selected) { await api.deleteWorkItem(id); }
    setSelected(new Set());
    fetchItems();
  };

  const handleBulkStatus = async (status) => {
    for (const id of selected) { await api.updateWorkItem(id, { status }); }
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
      color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em',
      cursor: 'pointer', userSelect: 'none', width: w, whiteSpace: 'nowrap',
      borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))',
      background: sortKey === key ? 'rgba(99,102,241,0.1)' : 'transparent',
    }}>
      {label}{handleSortIcon(key)}
    </th>
  );

  const renderRow = (item) => (
    <tr key={item._id} onClick={() => setDetailItem(item)}
      style={{ cursor: 'pointer', background: selected.has(item._id) ? 'rgba(99,102,241,0.1)' : 'transparent', transition: 'background 0.15s' }}
      onMouseEnter={e => { if (!selected.has(item._id)) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseLeave={e => { if (!selected.has(item._id)) e.currentTarget.style.background = selected.has(item._id) ? 'rgba(99,102,241,0.1)' : 'transparent'; }}>
      <td style={tdStyle} onClick={e => e.stopPropagation()}>
        <input type="checkbox" checked={selected.has(item._id)} onChange={() => toggleSelect(item._id)}
          style={{ accentColor: '#6366f1', width: '15px', height: '15px', cursor: 'pointer' }} />
      </td>
      <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>WI-{item.workItemId}</span></td>
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
          {(item.tags || []).length > 3 && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>+{item.tags.length - 3}</span>}
        </div>
      </td>
      <td style={{ ...tdStyle, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
        <button onClick={() => setDetailItem(item)} style={{ ...btnIcon, marginRight: '4px' }} title="View">👁</button>
        <button onClick={async () => { if (confirm('Delete?')) { await api.deleteWorkItem(item._id); fetchItems(); } }} style={{ ...btnIcon, color: '#ef4444' }} title="Delete">🗑</button>
      </td>
    </tr>
  );

  return (
    <div style={{ padding: '0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '4px', border: '1px solid var(--border-color, rgba(255,255,255,0.06))' }}>
          {[['items', 'All Items'], ['queries', 'Saved Queries']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              ...btnSmall, borderRadius: '7px', border: 'none',
              background: tab === k ? 'linear-gradient(135deg, #6366f1, #7c3aed)' : 'transparent',
              color: tab === k ? '#fff' : 'rgba(255,255,255,0.5)',
            }}>{l}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {selected.size > 0 && (
            <>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{selected.size} selected</span>
              <Select value="" onChange={v => { if (v) handleBulkStatus(v); }} options={[{ value: '', label: 'Set Status...' }, ...STATUSES.map(s => ({ value: s, label: s }))]} style={{ width: '130px', height: '34px', fontSize: '12px' }} />
              <button onClick={handleBulkDelete} style={{ ...btnDanger, ...btnSmall }}>Delete Selected</button>
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

          <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '12px', border: '1px solid var(--border-color, rgba(255,255,255,0.06))', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))', width: '40px' }}>
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
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))', width: '150px' }}>Tags</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))', width: '90px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="12" style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Loading...</td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan="12" style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No work items found</td></tr>
                ) : paged.map(renderRow)}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, sorted.length)}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ ...btnSmall, opacity: page <= 1 ? 0.4 : 1 }}>← Prev</button>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', padding: '4px 8px' }}>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ ...btnSmall, opacity: page >= totalPages ? 0.4 : 1 }}>Next →</button>
            </div>
          </div>
        </>
      )}

      {tab === 'queries' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
          {queries.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No saved queries yet. Go to All Items, set filters, and save as a query.</div>
          )}
          {queries.map(q => (
            <div key={q._id} style={{
              background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
              padding: '16px', cursor: 'pointer', transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color, rgba(255,255,255,0.06))'}
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
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
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
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Work Item" wide>
        <WorkItemForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} submitLabel="Create Work Item" />
      </Modal>

      <Modal open={showSaveQuery} onClose={() => setShowSaveQuery(false)} title="Save Query">
        <div>
          <label style={labelStyle}>Query Name</label>
          <input value={queryName} onChange={e => setQueryName(e.target.value)} placeholder="e.g. My Open Bugs"
            style={{ ...inputStyle, marginBottom: '12px' }} />
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>
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

const tdStyle = { padding: '12px 16px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.04))' };

function WorkItemDetail({ item, onClose }) {
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ ...item, tags: (item.tags || []).join(', ') });
  const [links, setLinks] = useState([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkTarget, setLinkTarget] = useState('');
  const [linkType, setLinkType] = useState('Related');
  const [linkComment, setLinkComment] = useState('');
  const [allItems, setAllItems] = useState([]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const fetchLinks = useCallback(async () => {
    try {
      const res = await api.getWorkItemLinks(item._id);
      if (res.success) setLinks(res.data || []);
    } catch (err) { console.error(err); }
  }, [item._id]);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

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
          <textarea value={displayForm(field)} onChange={e => set(field, e.target.value)}
            style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} />
        ) : (
          <input type={type || 'text'} value={displayForm(field)} onChange={e => set(field, e.target.value)} style={{ ...inputStyle, height: '36px' }} />
        )
      ) : (
        <div style={{ fontSize: '13px', color: 'var(--text-primary, #f1f5f9)', minHeight: '20px', whiteSpace: 'pre-wrap' }}>
          {field === 'priority' && <Badge text={`${form.priority} - ${PRIORITY_LABELS[form.priority] || form.priority}`} color={PRIORITY_COLORS[form.priority] || '#888'} small />}
          {field === 'status' && <Badge text={form.status} color={STATUS_COLORS[form.status] || '#888'} />}
          {field === 'type' && <Badge text={form.type} color={TYPE_COLORS[form.type] || '#888'} />}
          {field !== 'priority' && field !== 'status' && field !== 'type' && (displayForm(field) || <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>)}
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
        borderLeft: '1px solid var(--border-color, rgba(255,255,255,0.06))',
        boxShadow: '-10px 0 40px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>WI-{item.workItemId}</span>
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
                {(item.tags || []).length === 0 && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>No tags</span>}
                {(item.tags || []).map((t, i) => (
                  <span key={i} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '5px', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>{t}</span>
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
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>No linked items</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {links.map(link => {
                  const target = link.targetId && typeof link.targetId === 'object' ? link.targetId : null;
                  return (
                    <div key={link._id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px',
                      background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid var(--border-color, rgba(255,255,255,0.04))',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Badge text={link.linkType} color="#6366f1" small />
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
                          {target ? `WI-${target.workItemId}` : 'WI-?'}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--text-primary, #f1f5f9)' }}>{target?.title || 'Unknown'}</span>
                        {link.comment && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>({link.comment})</span>}
                      </div>
                      <button onClick={() => handleDeleteLink(link._id)} style={{ ...btnIcon, color: '#ef4444', padding: '4px 6px' }}>×</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {history.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>State History</label>
              <div style={{ position: 'relative', paddingLeft: '20px' }}>
                <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '2px', background: 'rgba(99,102,241,0.2)' }} />
                {history.map((h, i) => (
                  <div key={i} style={{ position: 'relative', marginBottom: '12px', paddingLeft: '12px' }}>
                    <div style={{ position: 'absolute', left: '-16px', top: '6px', width: '10px', height: '10px', borderRadius: '50%', background: STATUS_COLORS[h.status] || '#6366f1', border: '2px solid #1e1e2e' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <Badge text={h.status} color={STATUS_COLORS[h.status] || '#888'} small />
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                        {h.changedAt ? new Date(h.changedAt).toLocaleString() : 'Unknown date'}
                        {h.changedBy ? ` · ${h.changedBy}` : ''}
                      </span>
                    </div>
                    {h.note && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{h.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', borderTop: '1px solid var(--border-color, rgba(255,255,255,0.06))', paddingTop: '12px' }}>
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
