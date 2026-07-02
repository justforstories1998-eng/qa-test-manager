import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FiAlertTriangle, FiPlus, FiSearch, FiEdit2, FiTrash2, FiX,
  FiPaperclip, FiEye, FiUser, FiInfo, FiFileText, FiClock, FiVideo,
  FiFlag, FiChevronRight, FiCheckCircle, FiAlertCircle, FiXCircle,
  FiFilter, FiArrowRight, FiExternalLink, FiUpload, FiShield,
  FiActivity, FiHash, FiBox, FiTarget, FiZap, FiLayers,
  FiCalendar, FiMessageSquare, FiImage, FiDownload, FiCornerDownRight,
  FiChevronDown, FiRefreshCw, FiMinusCircle
} from 'react-icons/fi';
import api from '../api';
import { toast } from 'react-toastify';
import { Modal, ConfirmDialog } from './shared/Modal';
import Badge from './shared/Badge';

/* ═══════════════ helpers & micro-components ═══════════════ */

const severityConfig = {
  Critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.20)', icon: FiAlertTriangle, glow: '0 0 12px rgba(239,68,68,0.15)' },
  High:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.20)', icon: FiZap,           glow: '0 0 12px rgba(245,158,11,0.12)' },
  Medium:   { color: '#6366f1', bg: 'rgba(99,102,241,0.10)',  border: 'rgba(99,102,241,0.20)', icon: FiTarget,        glow: '0 0 12px rgba(99,102,241,0.12)' },
  Low:      { color: '#22c55e', bg: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.20)', icon: FiArrowRight,    glow: '0 0 12px rgba(34,197,94,0.10)' },
};

const statusConfig = {
  Active:              { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.20)',   dot: '#ef4444' },
  'Under development': { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.20)',  dot: '#f59e0b' },
  'In Progress':       { color: '#3b82f6', bg: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.20)',  dot: '#3b82f6' },
  Resolved:            { color: '#22c55e', bg: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.20)',   dot: '#22c55e' },
  Closed:              { color: '#64748b', bg: 'rgba(100,116,139,0.10)', border: 'rgba(100,116,139,0.20)', dot: '#64748b' },
};

const SeverityBadge = ({ severity }) => {
  const cfg = severityConfig[severity] || severityConfig.Medium;
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px 4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap', lineHeight: 1,
    }}>
      <Icon size={12} />
      {severity}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig.Active;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap', lineHeight: 1,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
};

const MetricCard = ({ icon: Icon, label, value, color }) => (
  <div style={{
    position: 'relative', padding: '16px 18px', borderRadius: 12,
    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
    overflow: 'hidden', transition: 'all 0.2s', flex: 1, minWidth: 0,
  }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}30`; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, ${color}00)` }} />
    <div style={{
      width: 32, height: 32, borderRadius: 8, marginBottom: 10,
      background: `${color}15`, border: `1px solid ${color}20`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={15} style={{ color }} />
    </div>
    <div style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', lineHeight: 1, letterSpacing: '-0.5px' }}>{value}</div>
    <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', marginTop: 3, fontWeight: 500 }}>{label}</div>
  </div>
);

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 9, boxSizing: 'border-box',
  border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)',
  color: '#e2e8f0', fontSize: 14, outline: 'none', fontFamily: 'inherit',
  transition: 'all 0.2s',
};

const focusInput = (e) => { e.target.style.borderColor = 'rgba(99,102,241,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)'; };
const blurInput = (e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; };

/* ═══════════════ main component ═══════════════ */

function Bugs({ projectId, user }) {
  const [bugs, setBugs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [editingBug, setEditingBug] = useState(null);
  const [viewingBug, setViewingBug] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const [assignedToQuery, setAssignedToQuery] = useState('');
  const [assignedToResults, setAssignedToResults] = useState([]);
  const [showAssignedDropdown, setShowAssignedDropdown] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');

  useEffect(() => { if (projectId) loadBugs(); }, [projectId]);

  const loadBugs = async () => {
    try {
      const res = await api.getBugs(projectId);
      if (res.success) setBugs(res.data);
    } catch { toast.error('Failed to load bugs'); }
  };

  /* ── file handling ── */
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  const validateFile = (file) => {
    if (!file) return false;
    if (file.size > 50 * 1024 * 1024) { toast.error('File exceeds 50MB limit'); return false; }
    if (!allowedTypes.includes(file.type)) { toast.error('Unsupported file type'); return false; }
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && validateFile(file)) setSelectedFile(file);
    else { e.target.value = null; setSelectedFile(null); }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && validateFile(file)) setSelectedFile(file);
    else toast.error('Invalid file');
  };

  const isVideoFile = (mimeType) => mimeType && mimeType.startsWith('video/');

  const getSafeUrl = (bug) => {
    if (bug.attachments?.length > 0) return bug.attachments[0].url;
    if (!bug.attachment) return null;
    return typeof bug.attachment === 'string' ? bug.attachment : bug.attachment.url;
  };

  const getFileMimeType = (bug) => {
    if (bug.attachments?.length > 0) return bug.attachments[0].mimeType;
    return bug.attachment?.mimeType;
  };

  const getFileName = (bug) => {
    if (bug.attachments?.length > 0) return bug.attachments[0].originalName;
    return bug.attachment?.originalName;
  };

  /* ── assignee search ── */
  const handleAssigneeSearch = async (query) => {
    setAssignedToQuery(query);
    if (query.length >= 2) {
      try {
        const res = await api.searchUsers(query);
        if (res.success) { setAssignedToResults(res.data); setShowAssignedDropdown(true); }
      } catch (err) { console.error(err); }
    } else { setAssignedToResults([]); setShowAssignedDropdown(false); }
  };

  const selectAssignee = (u) => {
    const name = `${u.firstName} ${u.lastName}`;
    setSelectedAssignee(name);
    setAssignedToQuery(name);
    setShowAssignedDropdown(false);
  };

  /* ── save / delete ── */
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.target);
    formData.append('projectId', projectId);
    if (user?.id) formData.append('createdBy', user.id);
    if (selectedFile) formData.append('attachment', selectedFile);
    try {
      if (editingBug) {
        await api.updateBug(editingBug.id || editingBug._id, formData);
        toast.success('Bug updated');
      } else {
        await api.createBug(formData);
        toast.success('Bug reported');
      }
      setShowModal(false);
      setSelectedFile(null);
      setSelectedAssignee('');
      setAssignedToQuery('');
      loadBugs();
    } catch { toast.error('Failed to save'); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteBug(id);
      loadBugs();
      setShowDeleteConfirm(null);
      toast.success('Bug deleted');
    } catch { toast.error('Failed to delete'); }
  };

  /* ── derived data ── */
  const filteredBugs = useMemo(() => {
    return bugs.filter(b => {
      const matchSearch = !searchTerm.trim() || b.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'All' || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [bugs, searchTerm, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = {};
    bugs.forEach(b => { counts[b.status] = (counts[b.status] || 0) + 1; });
    return counts;
  }, [bugs]);

  const severityCounts = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    bugs.forEach(b => { if (counts.hasOwnProperty(b.severity)) counts[b.severity]++; });
    return counts;
  }, [bugs]);

  const tabOptions = ['All', 'Active', 'Under development', 'In Progress', 'Resolved', 'Closed'];

  /* ═══════════════════ render ═══════════════════ */
  return (
    <div className="dg-page" style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%', overflow: 'auto' }}>

      {/* ── Header ── */}
      <div style={{ padding: '28px 32px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11,
              background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(245,158,11,0.15))',
              border: '1px solid rgba(239,68,68,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FiFlag size={19} style={{ color: '#f87171' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                Bug Tracker
              </h1>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'rgba(148,163,184,0.5)' }}>
                Track, assign, and resolve defects across your project
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingBug(null); setSelectedFile(null);
              setSelectedAssignee(''); setAssignedToQuery('');
              setShowModal(true);
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600,
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              border: 'none', color: '#fff', cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(239,68,68,0.3)', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(239,68,68,0.45)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(239,68,68,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <FiPlus size={15} /> Report Bug
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 32px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Metric cards ── */}
        <div style={{ display: 'flex', gap: 14 }}>
          <MetricCard icon={FiFlag}           label="Total Bugs"   value={bugs.length}             color="#818cf8" />
          <MetricCard icon={FiAlertTriangle}  label="Critical"     value={severityCounts.Critical} color="#ef4444" />
          <MetricCard icon={FiZap}            label="High"         value={severityCounts.High}     color="#f59e0b" />
          <MetricCard icon={FiCheckCircle}    label="Resolved"     value={statusCounts.Resolved || 0} color="#22c55e" />
          <MetricCard icon={FiMinusCircle}    label="Closed"       value={statusCounts.Closed || 0}   color="#64748b" />
        </div>

        {/* ── Status tabs ── */}
        <div style={{
          display: 'flex', gap: 4, padding: 4, borderRadius: 10,
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
        }}>
          {tabOptions.map(opt => {
            const isActive = statusFilter === opt;
            const count = opt === 'All' ? bugs.length : (statusCounts[opt] || 0);
            return (
              <button
                key={opt}
                onClick={() => setStatusFilter(opt)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 7, fontSize: 12, fontWeight: isActive ? 600 : 500,
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                  background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: isActive ? '#a5b4fc' : 'rgba(148,163,184,0.5)',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                {opt}
                <span style={{
                  background: isActive ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                  color: isActive ? '#818cf8' : 'rgba(148,163,184,0.4)',
                  padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Search bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 16px', borderRadius: 10,
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <FiSearch size={14} style={{
              position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
              color: 'rgba(148,163,184,0.4)', pointerEvents: 'none',
            }} />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search bugs by title…"
              type="text"
              style={{
                ...inputStyle, paddingLeft: 34, paddingRight: searchTerm ? 34 : 14,
              }}
              onFocus={focusInput}
              onBlur={blurInput}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.06)', border: 'none',
                  color: 'rgba(148,163,184,0.6)', cursor: 'pointer',
                  padding: '2px 5px', borderRadius: 4, fontSize: 11,
                  display: 'flex', alignItems: 'center',
                }}
              >
                <FiX size={12} />
              </button>
            )}
          </div>
          <div style={{
            fontSize: 12, color: 'rgba(148,163,184,0.4)', whiteSpace: 'nowrap',
            padding: '6px 12px', borderRadius: 6,
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
          }}>
            <span style={{ color: '#818cf8', fontWeight: 600 }}>{filteredBugs.length}</span> results
          </div>
        </div>

        {/* ── Table ── */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {filteredBugs.length > 0 ? (
            <div style={{ overflow: 'auto', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 13 }}>
                <thead>
                  <tr>
                    {[
                      { label: 'Severity', width: '110px' },
                      { label: 'Title' },
                      { label: 'Status', width: '150px' },
                      { label: 'Assigned To', width: '160px' },
                      { label: 'Evidence', width: '100px' },
                      { label: 'Reporter', width: '120px' },
                      { label: '', width: '90px' },
                    ].map((col, i) => (
                      <th key={i} style={{
                        padding: '11px 16px', textAlign: col.label ? 'left' : 'right',
                        width: col.width, fontSize: 10, fontWeight: 600,
                        color: 'rgba(148,163,184,0.4)', textTransform: 'uppercase',
                        letterSpacing: '0.8px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: 'rgba(255,255,255,0.01)', position: 'sticky', top: 0, zIndex: 5,
                        backdropFilter: 'blur(12px)',
                      }}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredBugs.map((bug, idx) => {
                    const bugId = bug._id || bug.id;
                    const isHovered = hoveredRow === bugId;
                    const fileUrl = getSafeUrl(bug);
                    const mime = getFileMimeType(bug);
                    return (
                      <tr
                        key={bugId}
                        onMouseEnter={() => setHoveredRow(bugId)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{
                          background: isHovered ? 'rgba(99,102,241,0.04)' : 'transparent',
                          transition: 'background 0.15s', cursor: 'pointer',
                        }}
                        onClick={() => { setViewingBug(bug); setShowViewModal(true); }}
                      >
                        <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <SeverityBadge severity={bug.severity || 'Medium'} />
                        </td>
                        <td style={{
                          padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                          fontWeight: 500, color: '#e2e8f0',
                          maxWidth: 350, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {bug.title}
                        </td>
                        <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <StatusBadge status={bug.status || 'Active'} />
                        </td>
                        <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          {bug.assignedTo ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                width: 26, height: 26, borderRadius: 8,
                                background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, fontWeight: 700, color: '#a5b4fc', flexShrink: 0,
                              }}>
                                {bug.assignedTo.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                              </div>
                              <span style={{ color: 'rgba(203,213,225,0.8)', fontSize: 13 }}>{bug.assignedTo}</span>
                            </div>
                          ) : (
                            <span style={{ color: 'rgba(148,163,184,0.3)', fontSize: 12, fontStyle: 'italic' }}>Unassigned</span>
                          )}
                        </td>
                        <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          {fileUrl ? (
                            <a
                              href={api.getFileUrl(fileUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 500,
                                color: '#818cf8', background: 'rgba(99,102,241,0.08)',
                                border: '1px solid rgba(99,102,241,0.15)',
                                textDecoration: 'none', transition: 'all 0.15s',
                              }}
                            >
                              {isVideoFile(mime) ? <FiVideo size={11} /> : <FiImage size={11} />}
                              View
                            </a>
                          ) : (
                            <span style={{ color: 'rgba(148,163,184,0.25)', fontSize: 11 }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 12, color: 'rgba(148,163,184,0.5)' }}>
                          {bug.createdBy?.firstName
                            ? `${bug.createdBy.firstName} ${bug.createdBy.lastName}`
                            : <span style={{ opacity: 0.4 }}>—</span>}
                        </td>
                        <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)', textAlign: 'right' }}>
                          <div
                            style={{
                              display: 'flex', gap: 4, justifyContent: 'flex-end',
                              opacity: isHovered ? 1 : 0, transition: 'opacity 0.15s',
                            }}
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              title="Edit"
                              onClick={() => {
                                setEditingBug(bug); setSelectedFile(null);
                                setSelectedAssignee(bug.assignedTo || '');
                                setAssignedToQuery(bug.assignedTo || '');
                                setShowModal(true);
                              }}
                              style={{
                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 6, padding: '5px 7px', cursor: 'pointer',
                                color: 'rgba(148,163,184,0.6)', display: 'flex', alignItems: 'center',
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#818cf8'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(148,163,184,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                            >
                              <FiEdit2 size={13} />
                            </button>
                            <button
                              title="Delete"
                              onClick={() => setShowDeleteConfirm(bug)}
                              style={{
                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 6, padding: '5px 7px', cursor: 'pointer',
                                color: 'rgba(148,163,184,0.6)', display: 'flex', alignItems: 'center',
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(148,163,184,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                            >
                              <FiTrash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Empty state */
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '80px 40px', textAlign: 'center',
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20, marginBottom: 20,
                background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(245,158,11,0.08))',
                border: '1px solid rgba(239,68,68,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FiFlag size={30} style={{ color: 'rgba(248,113,113,0.4)' }} />
              </div>
              <h3 style={{ color: 'rgba(226,232,240,0.8)', margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>
                No bugs found
              </h3>
              <p style={{ color: 'rgba(148,163,184,0.4)', margin: '0 0 24px', fontSize: 14, maxWidth: 360, lineHeight: 1.6 }}>
                {searchTerm || statusFilter !== 'All'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No defects have been reported yet. Click below to report one.'}
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                {(searchTerm || statusFilter !== 'All') && (
                  <button
                    onClick={() => { setSearchTerm(''); setStatusFilter('All'); }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 500,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      color: '#cbd5e1', cursor: 'pointer',
                    }}
                  >
                    <FiX size={14} /> Clear Filters
                  </button>
                )}
                <button
                  onClick={() => { setEditingBug(null); setSelectedFile(null); setSelectedAssignee(''); setAssignedToQuery(''); setShowModal(true); }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    border: 'none', color: '#fff', cursor: 'pointer',
                    boxShadow: '0 2px 12px rgba(239,68,68,0.3)',
                  }}
                >
                  <FiPlus size={14} /> Report Bug
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ VIEW MODAL ═══════════ */}
      <Modal
        isOpen={showViewModal && !!viewingBug}
        onClose={() => setShowViewModal(false)}
        title={null}
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
            <button
              onClick={() => setShowViewModal(false)}
              style={{
                padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 500,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#cbd5e1', cursor: 'pointer',
              }}
            >Close</button>
            <button
              onClick={() => {
                setShowViewModal(false);
                setEditingBug(viewingBug); setSelectedFile(null);
                setSelectedAssignee(viewingBug.assignedTo || '');
                setAssignedToQuery(viewingBug.assignedTo || '');
                setShowModal(true);
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                border: 'none', color: '#fff', cursor: 'pointer',
              }}
            >
              <FiEdit2 size={14} /> Edit
            </button>
          </div>
        }
      >
        {viewingBug && (
          <div>
            {/* Bug title & meta */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{
                  fontFamily: 'monospace', fontSize: 11, padding: '3px 9px', borderRadius: 5,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(148,163,184,0.5)',
                }}>
                  BUG-{String(bugs.indexOf(viewingBug) + 1).padStart(3, '0')}
                </span>
                <FiChevronRight size={12} style={{ color: 'rgba(148,163,184,0.3)' }} />
                <span style={{ fontSize: 12, color: 'rgba(148,163,184,0.5)' }}>Bug Details</span>
              </div>
              <h2 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.3, letterSpacing: '-0.3px' }}>
                {viewingBug.title}
              </h2>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8,
                }}>
                  <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Severity</span>
                  <SeverityBadge severity={viewingBug.severity || 'Medium'} />
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8,
                }}>
                  <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Status</span>
                  <StatusBadge status={viewingBug.status || 'Active'} />
                </div>
                {viewingBug.assignedTo && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8,
                  }}>
                    <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Assigned</span>
                    <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{viewingBug.assignedTo}</span>
                  </div>
                )}
                {viewingBug.createdBy?.firstName && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8,
                  }}>
                    <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Reporter</span>
                    <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>
                      {viewingBug.createdBy.firstName} {viewingBug.createdBy.lastName}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{
                display: 'flex', alignItems: 'center', gap: 7, margin: '0 0 10px',
                fontSize: 12, fontWeight: 600, color: 'rgba(148,163,184,0.5)',
                textTransform: 'uppercase', letterSpacing: '0.8px',
              }}>
                <FiFileText size={13} style={{ color: '#818cf8' }} />
                Description
              </h4>
              <div style={{
                padding: 16, background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10,
                color: 'rgba(203,213,225,0.8)', fontSize: 14, lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
              }}>
                {viewingBug.description || 'No description provided.'}
              </div>
            </div>

            {/* Evidence */}
            {getSafeUrl(viewingBug) && (
              <div>
                <h4 style={{
                  display: 'flex', alignItems: 'center', gap: 7, margin: '0 0 10px',
                  fontSize: 12, fontWeight: 600, color: 'rgba(148,163,184,0.5)',
                  textTransform: 'uppercase', letterSpacing: '0.8px',
                }}>
                  <FiPaperclip size={13} style={{ color: '#818cf8' }} />
                  Evidence
                </h4>
                {isVideoFile(getFileMimeType(viewingBug)) ? (
                  <div style={{
                    borderRadius: 10, overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <video
                      controls
                      style={{ width: '100%', maxHeight: 400, background: '#000', display: 'block' }}
                      src={api.getFileUrl(getSafeUrl(viewingBug))}
                    />
                    <div style={{
                      padding: '10px 14px', background: 'rgba(255,255,255,0.02)',
                      borderTop: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FiVideo size={14} style={{ color: '#818cf8' }} />
                        <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>
                          {getFileName(viewingBug) || 'Video Evidence'}
                        </span>
                      </div>
                      <a
                        href={api.getFileUrl(getSafeUrl(viewingBug))}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          fontSize: 12, color: '#818cf8', textDecoration: 'none',
                        }}
                      >
                        <FiExternalLink size={12} /> Open
                      </a>
                    </div>
                  </div>
                ) : (
                  <a
                    href={api.getFileUrl(getSafeUrl(viewingBug))}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: 16,
                      border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10,
                      textDecoration: 'none', background: 'rgba(255,255,255,0.02)',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
                  >
                    <div style={{
                      width: 42, height: 42, borderRadius: 10,
                      background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <FiFileText size={18} style={{ color: '#818cf8' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#e2e8f0' }}>
                        {getFileName(viewingBug) || 'View Attachment'}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.4)', marginTop: 2 }}>
                        Open in new tab
                      </div>
                    </div>
                    <FiExternalLink size={16} style={{ color: 'rgba(148,163,184,0.3)', flexShrink: 0 }} />
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ═══════════ CREATE / EDIT MODAL ═══════════ */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={null}
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              style={{
                padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 500,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#cbd5e1', cursor: 'pointer',
              }}
            >Cancel</button>
            <button
              type="submit"
              form="bug-form"
              disabled={isSaving}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 20px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                background: isSaving ? 'rgba(239,68,68,0.5)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                border: 'none', color: '#fff',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                boxShadow: isSaving ? 'none' : '0 2px 12px rgba(239,68,68,0.3)',
              }}
            >
              {isSaving ? (
                <>
                  <span style={{
                    width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Saving…
                </>
              ) : (
                <>
                  <FiFlag size={14} /> {editingBug ? 'Update Bug' : 'Submit Bug'}
                </>
              )}
            </button>
          </div>
        }
      >
        <form id="bug-form" onSubmit={handleSave}>
          {/* Form header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FiFlag size={16} style={{ color: '#f87171' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>
                  {editingBug ? 'Update Bug' : 'Report New Bug'}
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(148,163,184,0.5)' }}>
                  {editingBug ? 'Modify the details below.' : 'Fill in the details to log a new defect.'}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Title */}
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500, color: 'rgba(203,213,225,0.7)' }}>
                Title <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input
                name="title"
                defaultValue={editingBug?.title}
                required
                placeholder="Brief description of the defect…"
                style={inputStyle}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500, color: 'rgba(203,213,225,0.7)' }}>
                Description
              </label>
              <textarea
                name="description"
                defaultValue={editingBug?.description}
                rows={5}
                placeholder="Detailed steps to reproduce the issue…"
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>

            {/* Severity + Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500, color: 'rgba(203,213,225,0.7)' }}>
                  Severity
                </label>
                <select
                  name="severity"
                  defaultValue={editingBug?.severity || 'Medium'}
                  style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
                >
                  {['Critical', 'High', 'Medium', 'Low'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500, color: 'rgba(203,213,225,0.7)' }}>
                  Status
                </label>
                <select
                  name="status"
                  defaultValue={editingBug?.status || 'Active'}
                  style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
                >
                  {['Active', 'Under development', 'In Progress', 'Resolved', 'Closed'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Assignee */}
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500, color: 'rgba(203,213,225,0.7)' }}>
                Assigned To
              </label>
              <div style={{ position: 'relative' }}>
                <FiUser size={14} style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'rgba(148,163,184,0.4)', pointerEvents: 'none',
                }} />
                <input
                  type="text"
                  value={assignedToQuery}
                  onChange={e => handleAssigneeSearch(e.target.value)}
                  onFocus={() => assignedToResults.length > 0 && setShowAssignedDropdown(true)}
                  onBlur={() => setTimeout(() => setShowAssignedDropdown(false), 200)}
                  placeholder="Search by name or email…"
                  style={{ ...inputStyle, paddingLeft: 34 }}
                />
              </div>
              <input type="hidden" name="assignedTo" value={selectedAssignee} />

              {/* Dropdown */}
              {showAssignedDropdown && assignedToResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  marginTop: 4, borderRadius: 10, overflow: 'hidden',
                  background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.4)', maxHeight: 200, overflowY: 'auto',
                }}>
                  {assignedToResults.map(u => (
                    <div
                      key={u._id || u.id}
                      onMouseDown={() => selectAssignee(u)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 14px', cursor: 'pointer',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{
                        width: 30, height: 30, borderRadius: 8,
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: '#a5b4fc', flexShrink: 0,
                      }}>
                        {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>
                          {u.firstName} {u.lastName}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.4)' }}>{u.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* File upload */}
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500, color: 'rgba(203,213,225,0.7)' }}>
                Attachment
                <span style={{ color: 'rgba(148,163,184,0.3)', fontWeight: 400, marginLeft: 4 }}>Max 50MB</span>
              </label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                style={{
                  border: `2px dashed ${dragOver ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 12, padding: '28px 20px', textAlign: 'center',
                  position: 'relative',
                  background: dragOver ? 'rgba(99,102,241,0.04)' : 'rgba(255,255,255,0.01)',
                  transition: 'all 0.2s',
                }}
              >
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.pdf,.mp4,.mov,.avi,.webm,.docx"
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                />
                {selectedFile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 10,
                      background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FiCheckCircle size={18} style={{ color: '#4ade80' }} />
                    </div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '6px 14px', borderRadius: 8,
                      background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)',
                      color: '#4ade80', fontSize: 13, fontWeight: 500,
                    }}>
                      {isVideoFile(selectedFile.type) ? <FiVideo size={14} /> : <FiImage size={14} />}
                      {selectedFile.name}
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setSelectedFile(null); }}
                        style={{
                          background: 'none', border: 'none', color: 'rgba(148,163,184,0.5)',
                          cursor: 'pointer', padding: 2, marginLeft: 4, display: 'flex',
                        }}
                      >
                        <FiX size={13} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{
                      width: 42, height: 42, borderRadius: 10, margin: '0 auto 10px',
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
                      border: '1px solid rgba(99,102,241,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FiUpload size={18} style={{ color: '#818cf8' }} />
                    </div>
                    <p style={{ color: 'rgba(203,213,225,0.6)', margin: '0 0 3px', fontSize: 13, fontWeight: 500 }}>
                      Drag & drop or click to upload
                    </p>
                    <p style={{ color: 'rgba(148,163,184,0.3)', margin: 0, fontSize: 11 }}>
                      JPG, PNG, PDF, MP4, MOV, WebM, DOCX
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Reporter info */}
            {user && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 9,
                background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: 'rgba(99,102,241,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: '#a5b4fc', flexShrink: 0,
                }}>
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.5)' }}>Reported by</div>
                  <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>
                    {user.firstName} {user.lastName}
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* ═══════════ DELETE CONFIRM ═══════════ */}
      <ConfirmDialog
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Delete Bug"
        message={
          <div>
            <p style={{ color: 'rgba(203,213,225,0.8)', margin: '0 0 10px', fontSize: 14 }}>
              Are you sure you want to delete <strong style={{ color: '#f1f5f9' }}>"{showDeleteConfirm?.title}"</strong>?
            </p>
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px',
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
              borderRadius: 8,
            }}>
              <FiAlertTriangle size={14} style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }} />
              <span style={{ color: '#f87171', fontSize: 13, lineHeight: 1.5 }}>
                This action cannot be undone. All associated data will be permanently removed.
              </span>
            </div>
          </div>
        }
        confirmLabel="Delete Bug"
        danger
        onConfirm={() => handleDelete(showDeleteConfirm._id || showDeleteConfirm.id)}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default Bugs;