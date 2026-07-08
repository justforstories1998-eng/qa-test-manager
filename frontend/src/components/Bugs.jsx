import React, { useState, useEffect, useMemo } from 'react';
import {
  FiAlertTriangle, FiPlus, FiSearch, FiEdit2, FiTrash2, FiX,
  FiPaperclip, FiUser, FiFileText, FiVideo, FiFlag, FiChevronRight,
  FiCheckCircle, FiArrowRight, FiExternalLink, FiUpload, FiTarget,
  FiZap, FiImage, FiMinusCircle,
} from 'react-icons/fi';
import api from '../api';
import { toast } from 'react-toastify';
import { Modal, ConfirmDialog } from './shared/Modal';

/* ══════════════ theme hook ══════════════ */
const useTheme = () => {
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'dark'
  );
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return theme;
};

/* ══════════════ badge configs ══════════════ */
const severityConfig = {
  Critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.22)', icon: FiAlertTriangle },
  High:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.22)', icon: FiZap },
  Medium:   { color: '#6366f1', bg: 'rgba(99,102,241,0.10)', border: 'rgba(99,102,241,0.22)', icon: FiTarget },
  Low:      { color: '#22c55e', bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.22)', icon: FiArrowRight },
};
const statusConfig = {
  Active:              { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.20)' },
  'Under development': { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.20)' },
  'In Progress':       { color: '#3b82f6', bg: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.20)' },
  Resolved:            { color: '#22c55e', bg: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.20)' },
  Closed:              { color: '#64748b', bg: 'rgba(100,116,139,0.10)', border: 'rgba(100,116,139,0.20)' },
};

const SeverityBadge = ({ severity, compact = false }) => {
  const cfg = severityConfig[severity] || severityConfig.Medium;
  const Icon = cfg.icon;
  return (
    <span className="bug-badge" style={{
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
      padding: compact ? '3px 7px 3px 6px' : '4px 10px 4px 8px',
      fontSize: compact ? 11 : 12,
    }}>
      <Icon size={compact ? 10 : 12} />
      {compact ? severity.charAt(0) : severity}
    </span>
  );
};

const StatusBadge = ({ status, compact = false }) => {
  const cfg = statusConfig[status] || statusConfig.Active;
  return (
    <span className="bug-badge" style={{
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
      padding: compact ? '3px 8px' : '4px 10px',
      fontSize: compact ? 11 : 12,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: cfg.color, flexShrink: 0,
      }} />
      {status}
    </span>
  );
};

const MetricCard = ({ icon: Icon, label, value, color }) => (
  <div className="bug-metric" style={{ '--metric-color': color }}>
    <div className="bug-metric-accent" style={{ background: `linear-gradient(90deg, ${color}, ${color}00)` }} />
    <div className="bug-metric-icon" style={{ background: `${color}15`, borderColor: `${color}25`, color }}>
      <Icon size={15} />
    </div>
    <div className="bug-metric-value">{value}</div>
    <div className="bug-metric-label">{label}</div>
  </div>
);

/* ══════════════ main component ══════════════ */
function Bugs({ projectId, user }) {
  const theme = useTheme();
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

  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const validateFile = (file) => {
    if (!file) return false;
    if (file.size > 50 * 1024 * 1024) { toast.error('File exceeds 50MB'); return false; }
    if (!allowedTypes.includes(file.type)) { toast.error('Unsupported file type'); return false; }
    return true;
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && validateFile(file)) setSelectedFile(file);
    else { e.target.value = null; setSelectedFile(null); }
  };
  const handleFileDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && validateFile(file)) setSelectedFile(file);
    else toast.error('Invalid file');
  };

  const isVideoFile = (m) => m && m.startsWith('video/');
  const getSafeUrl = (bug) => {
    if (bug.attachments?.length > 0) return bug.attachments[0].url;
    if (!bug.attachment) return null;
    return typeof bug.attachment === 'string' ? bug.attachment : bug.attachment.url;
  };
  const getFileMimeType = (bug) => bug.attachments?.length > 0 ? bug.attachments[0].mimeType : bug.attachment?.mimeType;
  const getFileName = (bug) => bug.attachments?.length > 0 ? bug.attachments[0].originalName : bug.attachment?.originalName;

  const handleAssigneeSearch = async (query) => {
    setAssignedToQuery(query);
    if (query.length >= 2) {
      try {
        const res = await api.searchUsers(query);
        if (res.success) { setAssignedToResults(res.data); setShowAssignedDropdown(true); }
      } catch { }
    } else { setAssignedToResults([]); setShowAssignedDropdown(false); }
  };
  const selectAssignee = (u) => {
    const name = `${u.firstName} ${u.lastName}`;
    setSelectedAssignee(name); setAssignedToQuery(name); setShowAssignedDropdown(false);
  };

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
      setShowModal(false); setSelectedFile(null);
      setSelectedAssignee(''); setAssignedToQuery('');
      loadBugs();
    } catch { toast.error('Failed to save'); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteBug(id);
      loadBugs(); setShowDeleteConfirm(null);
      toast.success('Bug deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const filteredBugs = useMemo(() => bugs.filter(b => {
    const matchSearch = !searchTerm.trim() || b.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'All' || b.status === statusFilter;
    return matchSearch && matchStatus;
  }), [bugs, searchTerm, statusFilter]);

  const statusCounts = useMemo(() => {
    const c = {}; bugs.forEach(b => { c[b.status] = (c[b.status] || 0) + 1; });
    return c;
  }, [bugs]);
  const severityCounts = useMemo(() => {
    const c = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    bugs.forEach(b => { if (c.hasOwnProperty(b.severity)) c[b.severity]++; });
    return c;
  }, [bugs]);

  const tabOptions = ['All', 'Active', 'Under development', 'In Progress', 'Resolved', 'Closed'];

  return (
    <div className="bug-page">
      {/* ── Header ── */}
      <div className="bug-header">
        <div className="bug-header-left">
          <div className="bug-header-icon">
            <FiFlag size={19} />
          </div>
          <div>
            <h1 className="bug-title">Bug Tracker</h1>
            <p className="bug-subtitle">Track, assign, and resolve defects across your project</p>
          </div>
        </div>
        <button
          className="bug-btn bug-btn-primary"
          onClick={() => {
            setEditingBug(null); setSelectedFile(null);
            setSelectedAssignee(''); setAssignedToQuery('');
            setShowModal(true);
          }}
        >
          <FiPlus size={15} /> Report Bug
        </button>
      </div>

      <div className="bug-body">
        {/* ── Metrics ── */}
        <div className="bug-metrics-row">
          <MetricCard icon={FiFlag} label="Total Bugs" value={bugs.length} color="#818cf8" />
          <MetricCard icon={FiAlertTriangle} label="Critical" value={severityCounts.Critical} color="#ef4444" />
          <MetricCard icon={FiZap} label="High" value={severityCounts.High} color="#f59e0b" />
          <MetricCard icon={FiCheckCircle} label="Resolved" value={statusCounts.Resolved || 0} color="#22c55e" />
          <MetricCard icon={FiMinusCircle} label="Closed" value={statusCounts.Closed || 0} color="#64748b" />
        </div>

        {/* ── Status tabs ── */}
        <div className="bug-tabs">
          {tabOptions.map(opt => {
            const isActive = statusFilter === opt;
            const count = opt === 'All' ? bugs.length : (statusCounts[opt] || 0);
            return (
              <button
                key={opt}
                className={`bug-tab ${isActive ? 'bug-tab-active' : ''}`}
                onClick={() => setStatusFilter(opt)}
              >
                {opt}
                <span className={`bug-tab-count ${isActive ? 'bug-tab-count-active' : ''}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* ── Search bar ── */}
        <div className="bug-search-row">
          <div className="bug-search-wrap">
            <FiSearch size={14} className="bug-search-icon" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search bugs by title…"
              type="text"
              className="bug-input bug-search-input"
            />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm('')} className="bug-search-clear">
                <FiX size={12} />
              </button>
            )}
          </div>
          <div className="bug-result-count">
            <span>{filteredBugs.length}</span> results
          </div>
        </div>

        {/* ── Table ── */}
        {filteredBugs.length > 0 ? (
          <div className="bug-table-wrap">
            <table className="bug-table">
              <colgroup>
                <col style={{ width: '96px' }} />
                <col />
                <col style={{ width: '130px' }} />
                <col style={{ width: '160px' }} />
                <col style={{ width: '80px' }} />
                <col style={{ width: '80px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Assigned</th>
                  <th style={{ textAlign: 'center' }}>File</th>
                  <th style={{ textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredBugs.map((bug) => {
                  const bugId = bug._id || bug.id;
                  const isHovered = hoveredRow === bugId;
                  const fileUrl = getSafeUrl(bug);
                  const mime = getFileMimeType(bug);
                  return (
                    <tr
                      key={bugId}
                      className={isHovered ? 'bug-row-hover' : ''}
                      onMouseEnter={() => setHoveredRow(bugId)}
                      onMouseLeave={() => setHoveredRow(null)}
                      onClick={() => { setViewingBug(bug); setShowViewModal(true); }}
                    >
                      <td>
                        <SeverityBadge severity={bug.severity || 'Medium'} />
                      </td>
                      <td className="bug-title-cell">
                        <div className="bug-title-text">{bug.title}</div>
                        {bug.createdBy?.firstName && (
                          <div className="bug-title-meta">
                            by {bug.createdBy.firstName} {bug.createdBy.lastName}
                          </div>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={bug.status || 'Active'} />
                      </td>
                      <td>
                        {bug.assignedTo ? (
                          <div className="bug-assignee-cell">
                            <div className="bug-avatar">
                              {bug.assignedTo.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <span className="bug-assignee-name">{bug.assignedTo}</span>
                          </div>
                        ) : (
                          <span className="bug-unassigned">Unassigned</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {fileUrl ? (
                          <a
                            href={api.getFileUrl(fileUrl)}
                            target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="bug-file-link"
                            title="View attachment"
                          >
                            {isVideoFile(mime) ? <FiVideo size={13} /> : <FiImage size={13} />}
                          </a>
                        ) : (
                          <span className="bug-file-none">—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className={`bug-row-actions ${isHovered ? 'visible' : ''}`} onClick={e => e.stopPropagation()}>
                          <button
                            title="Edit"
                            className="bug-action-btn"
                            onClick={() => {
                              setEditingBug(bug); setSelectedFile(null);
                              setSelectedAssignee(bug.assignedTo || '');
                              setAssignedToQuery(bug.assignedTo || '');
                              setShowModal(true);
                            }}
                          >
                            <FiEdit2 size={13} />
                          </button>
                          <button
                            title="Delete"
                            className="bug-action-btn bug-action-btn-danger"
                            onClick={() => setShowDeleteConfirm(bug)}
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
          <div className="bug-empty">
            <div className="bug-empty-icon">
              <FiFlag size={30} />
            </div>
            <h3>No bugs found</h3>
            <p>{searchTerm || statusFilter !== 'All'
              ? 'Try adjusting your search or filter criteria.'
              : 'No defects have been reported yet. Click below to report one.'}
            </p>
            <div className="bug-empty-actions">
              {(searchTerm || statusFilter !== 'All') && (
                <button className="bug-btn bug-btn-secondary" onClick={() => { setSearchTerm(''); setStatusFilter('All'); }}>
                  <FiX size={14} /> Clear Filters
                </button>
              )}
              <button
                className="bug-btn bug-btn-primary"
                onClick={() => { setEditingBug(null); setSelectedFile(null); setSelectedAssignee(''); setAssignedToQuery(''); setShowModal(true); }}
              >
                <FiPlus size={14} /> Report Bug
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════ VIEW MODAL ═══════════ */}
      <Modal
        isOpen={showViewModal && !!viewingBug}
        onClose={() => setShowViewModal(false)}
        title={null}
        size="lg"
        footer={
          <div className="bug-modal-footer">
            <button className="bug-btn bug-btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
            <button
              className="bug-btn bug-btn-primary-purple"
              onClick={() => {
                setShowViewModal(false);
                setEditingBug(viewingBug); setSelectedFile(null);
                setSelectedAssignee(viewingBug.assignedTo || '');
                setAssignedToQuery(viewingBug.assignedTo || '');
                setShowModal(true);
              }}
            >
              <FiEdit2 size={14} /> Edit
            </button>
          </div>
        }
      >
        {viewingBug && (
          <div>
            <div className="bug-view-header">
              <div className="bug-breadcrumb">
                <span className="bug-code">BUG-{String(bugs.indexOf(viewingBug) + 1).padStart(3, '0')}</span>
                <FiChevronRight size={12} />
                <span>Bug Details</span>
              </div>
              <h2 className="bug-view-title">{viewingBug.title}</h2>
              <div className="bug-view-meta">
                <div className="bug-meta-card">
                  <span className="bug-meta-label">Severity</span>
                  <SeverityBadge severity={viewingBug.severity || 'Medium'} />
                </div>
                <div className="bug-meta-card">
                  <span className="bug-meta-label">Status</span>
                  <StatusBadge status={viewingBug.status || 'Active'} />
                </div>
                {viewingBug.assignedTo && (
                  <div className="bug-meta-card">
                    <span className="bug-meta-label">Assigned</span>
                    <span className="bug-meta-value">{viewingBug.assignedTo}</span>
                  </div>
                )}
                {viewingBug.createdBy?.firstName && (
                  <div className="bug-meta-card">
                    <span className="bug-meta-label">Reporter</span>
                    <span className="bug-meta-value">
                      {viewingBug.createdBy.firstName} {viewingBug.createdBy.lastName}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bug-view-section">
              <h4 className="bug-section-heading">
                <FiFileText size={13} /> Description
              </h4>
              <div className="bug-description">
                {viewingBug.description || 'No description provided.'}
              </div>
            </div>

            {getSafeUrl(viewingBug) && (
              <div className="bug-view-section">
                <h4 className="bug-section-heading">
                  <FiPaperclip size={13} /> Evidence
                </h4>
                {isVideoFile(getFileMimeType(viewingBug)) ? (
                  <div className="bug-video-wrap">
                    <video controls className="bug-video" src={api.getFileUrl(getSafeUrl(viewingBug))} />
                    <div className="bug-video-info">
                      <div className="bug-video-info-left">
                        <FiVideo size={14} />
                        <span>{getFileName(viewingBug) || 'Video Evidence'}</span>
                      </div>
                      <a
                        href={api.getFileUrl(getSafeUrl(viewingBug))}
                        target="_blank" rel="noopener noreferrer"
                        className="bug-video-link"
                      >
                        <FiExternalLink size={12} /> Open
                      </a>
                    </div>
                  </div>
                ) : (
                  <a
                    href={api.getFileUrl(getSafeUrl(viewingBug))}
                    target="_blank" rel="noopener noreferrer"
                    className="bug-file-card"
                  >
                    <div className="bug-file-icon">
                      <FiFileText size={18} />
                    </div>
                    <div className="bug-file-info">
                      <div className="bug-file-name">{getFileName(viewingBug) || 'View Attachment'}</div>
                      <div className="bug-file-hint">Open in new tab</div>
                    </div>
                    <FiExternalLink size={16} className="bug-file-external" />
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
          <div className="bug-modal-footer">
            <button className="bug-btn bug-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button
              type="submit" form="bug-form" disabled={isSaving}
              className={`bug-btn bug-btn-primary ${isSaving ? 'bug-btn-disabled' : ''}`}
            >
              {isSaving ? (
                <><span className="bug-spinner" /> Saving…</>
              ) : (
                <><FiFlag size={14} /> {editingBug ? 'Update Bug' : 'Submit Bug'}</>
              )}
            </button>
          </div>
        }
      >
        <form id="bug-form" onSubmit={handleSave}>
          <div className="bug-form-header">
            <div className="bug-form-header-icon">
              <FiFlag size={16} />
            </div>
            <div>
              <h2>{editingBug ? 'Update Bug' : 'Report New Bug'}</h2>
              <p>{editingBug ? 'Modify the details below.' : 'Fill in the details to log a new defect.'}</p>
            </div>
          </div>

          <div className="bug-form-fields">
            <div>
              <label className="bug-label">Title <span className="bug-required">*</span></label>
              <input
                name="title"
                defaultValue={editingBug?.title}
                required
                placeholder="Brief description of the defect…"
                className="bug-input"
              />
            </div>

            <div>
              <label className="bug-label">Description</label>
              <textarea
                name="description"
                defaultValue={editingBug?.description}
                rows={5}
                placeholder="Detailed steps to reproduce the issue…"
                className="bug-input bug-textarea"
              />
            </div>

            <div className="bug-form-grid-2">
              <div>
                <label className="bug-label">Severity</label>
                <select name="severity" defaultValue={editingBug?.severity || 'Medium'} className="bug-input bug-select">
                  {['Critical', 'High', 'Medium', 'Low'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="bug-label">Status</label>
                <select name="status" defaultValue={editingBug?.status || 'Active'} className="bug-input bug-select">
                  {['Active', 'Under development', 'In Progress', 'Resolved', 'Closed'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <label className="bug-label">Assigned To</label>
              <div style={{ position: 'relative' }}>
                <FiUser size={14} className="bug-input-icon" />
                <input
                  type="text"
                  value={assignedToQuery}
                  onChange={e => handleAssigneeSearch(e.target.value)}
                  onFocus={() => assignedToResults.length > 0 && setShowAssignedDropdown(true)}
                  onBlur={() => setTimeout(() => setShowAssignedDropdown(false), 200)}
                  placeholder="Search by name or email…"
                  className="bug-input"
                  style={{ paddingLeft: 34 }}
                />
              </div>
              <input type="hidden" name="assignedTo" value={selectedAssignee} />

              {showAssignedDropdown && assignedToResults.length > 0 && (
                <div className="bug-dropdown">
                  {assignedToResults.map(u => (
                    <div
                      key={u._id || u.id}
                      onMouseDown={() => selectAssignee(u)}
                      className="bug-dropdown-item"
                    >
                      <div className="bug-avatar-lg">
                        {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                      </div>
                      <div>
                        <div className="bug-dropdown-name">{u.firstName} {u.lastName}</div>
                        <div className="bug-dropdown-email">{u.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="bug-label">
                Attachment <span className="bug-label-hint">Max 50MB</span>
              </label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                className={`bug-dropzone ${dragOver ? 'bug-dropzone-active' : ''}`}
              >
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.pdf,.mp4,.mov,.avi,.webm,.docx"
                  className="bug-dropzone-input"
                />
                {selectedFile ? (
                  <div className="bug-dropzone-selected">
                    <div className="bug-dropzone-check">
                      <FiCheckCircle size={18} />
                    </div>
                    <div className="bug-dropzone-file">
                      {isVideoFile(selectedFile.type) ? <FiVideo size={14} /> : <FiImage size={14} />}
                      {selectedFile.name}
                      <button type="button" onClick={e => { e.stopPropagation(); setSelectedFile(null); }} className="bug-dropzone-remove">
                        <FiX size={13} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="bug-dropzone-icon">
                      <FiUpload size={18} />
                    </div>
                    <p className="bug-dropzone-title">Drag & drop or click to upload</p>
                    <p className="bug-dropzone-hint">JPG, PNG, PDF, MP4, MOV, WebM, DOCX</p>
                  </>
                )}
              </div>
            </div>

            {user && (
              <div className="bug-reporter-card">
                <div className="bug-avatar-lg">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </div>
                <div>
                  <div className="bug-reporter-label">Reported by</div>
                  <div className="bug-reporter-name">{user.firstName} {user.lastName}</div>
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
            <p style={{ color: 'var(--bug-text-secondary)', margin: '0 0 10px', fontSize: 14 }}>
              Delete <strong style={{ color: 'var(--bug-text)' }}>"{showDeleteConfirm?.title}"</strong>?
            </p>
            <div className="bug-warning-banner">
              <FiAlertTriangle size={14} />
              <span>This action cannot be undone.</span>
            </div>
          </div>
        }
        confirmLabel="Delete Bug"
        danger
        onConfirm={() => handleDelete(showDeleteConfirm._id || showDeleteConfirm.id)}
      />

      {/* ═══════ Theme-aware styles ═══════ */}
      <style>{`
        /* ── Dark tokens (default) ── */
        .bug-page {
          --bug-bg: transparent;
          --bug-card: rgba(255,255,255,0.02);
          --bug-card-hover: rgba(255,255,255,0.04);
          --bug-card-elevated: rgba(255,255,255,0.03);
          --bug-border: rgba(255,255,255,0.06);
          --bug-border-hover: rgba(255,255,255,0.1);
          --bug-input-bg: rgba(255,255,255,0.03);
          --bug-text: #f1f5f9;
          --bug-text-secondary: rgba(203,213,225,0.85);
          --bug-text-muted: rgba(148,163,184,0.55);
          --bug-text-faint: rgba(148,163,184,0.35);
          --bug-accent: #818cf8;
          --bug-accent-strong: #6366f1;
          --bug-accent-bg: rgba(99,102,241,0.12);
          --bug-accent-border: rgba(99,102,241,0.2);
          --bug-accent-glow: rgba(99,102,241,0.08);
          --bug-danger: #f87171;
          --bug-danger-bg: rgba(248,113,113,0.08);
          --bug-danger-border: rgba(248,113,113,0.15);
          --bug-hover-bg: rgba(99,102,241,0.06);
        }

        /* ── Light overrides ── */
        [data-theme="light"] .bug-page {
          --bug-card: #ffffff;
          --bug-card-hover: #fafbfd;
          --bug-card-elevated: #ffffff;
          --bug-border: #e5e7eb;
          --bug-border-hover: #d1d5db;
          --bug-input-bg: #ffffff;
          --bug-text: #0f172a;
          --bug-text-secondary: #475569;
          --bug-text-muted: #94a3b8;
          --bug-text-faint: #cbd5e1;
          --bug-accent: #6366f1;
          --bug-accent-strong: #4f46e5;
          --bug-accent-bg: rgba(99,102,241,0.08);
          --bug-accent-border: rgba(99,102,241,0.18);
          --bug-accent-glow: rgba(99,102,241,0.06);
          --bug-danger: #ef4444;
          --bug-danger-bg: rgba(239,68,68,0.06);
          --bug-danger-border: rgba(239,68,68,0.15);
          --bug-hover-bg: rgba(99,102,241,0.04);
        }

        /* ── Page layout ── */
        .bug-page {
          display: flex; flex-direction: column;
          height: 100%; overflow: auto;
          background: var(--bug-bg);
        }

        /* ── Header ── */
        .bug-header {
          padding: 28px 32px 24px;
          border-bottom: 1px solid var(--bug-border);
          display: flex; align-items: flex-start; justify-content: space-between; gap: 20px;
          flex-wrap: wrap;
        }
        .bug-header-left { display: flex; align-items: center; gap: 12px; }
        .bug-header-icon {
          width: 40px; height: 40px; border-radius: 11px;
          background: linear-gradient(135deg, rgba(239,68,68,0.15), rgba(245,158,11,0.15));
          border: 1px solid rgba(239,68,68,0.15);
          color: #f87171;
          display: flex; align-items: center; justify-content: center;
        }
        .bug-title {
          margin: 0; font-size: 22px; font-weight: 700;
          color: var(--bug-text); letter-spacing: -0.3px; line-height: 1.2;
        }
        .bug-subtitle {
          margin: 3px 0 0; font-size: 13px; color: var(--bug-text-muted);
        }

        /* ── Body ── */
        .bug-body {
          padding: 24px 32px 32px;
          display: flex; flex-direction: column; gap: 18px;
        }

        /* ── Metrics ── */
        .bug-metrics-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
        }
        .bug-metric {
          position: relative;
          padding: 14px 16px; border-radius: 11px;
          background: var(--bug-card); border: 1px solid var(--bug-border);
          overflow: hidden; transition: all 0.2s;
        }
        .bug-metric:hover {
          border-color: var(--metric-color)40;
          background: var(--bug-card-hover);
        }
        .bug-metric-accent {
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
        }
        .bug-metric-icon {
          width: 30px; height: 30px; border-radius: 8px; margin-bottom: 10px;
          border: 1px solid;
          display: flex; align-items: center; justify-content: center;
        }
        .bug-metric-value {
          font-size: 22px; font-weight: 700; color: var(--bug-text);
          line-height: 1; letter-spacing: -0.5px;
        }
        .bug-metric-label {
          font-size: 11px; color: var(--bug-text-muted);
          margin-top: 3px; font-weight: 500;
        }

        /* ── Tabs ── */
        .bug-tabs {
          display: flex; gap: 3px; padding: 4px; border-radius: 10px;
          background: var(--bug-card); border: 1px solid var(--bug-border);
          overflow-x: auto;
        }
        .bug-tab {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 13px; border-radius: 7px;
          font-size: 12px; font-weight: 500; font-family: inherit;
          border: none; cursor: pointer;
          background: transparent; color: var(--bug-text-muted);
          transition: all 0.15s; white-space: nowrap;
        }
        .bug-tab:hover { background: var(--bug-card-hover); color: var(--bug-text-secondary); }
        .bug-tab-active {
          background: var(--bug-accent-bg) !important;
          color: var(--bug-accent) !important;
          font-weight: 600 !important;
        }
        .bug-tab-count {
          padding: 1px 7px; border-radius: 4px;
          font-size: 10px; font-weight: 700;
          background: var(--bug-border); color: var(--bug-text-faint);
        }
        .bug-tab-count-active {
          background: rgba(99,102,241,0.2) !important;
          color: var(--bug-accent) !important;
        }

        /* ── Search row ── */
        .bug-search-row {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px; border-radius: 10px;
          background: var(--bug-card); border: 1px solid var(--bug-border);
        }
        .bug-search-wrap { position: relative; flex: 1; }
        .bug-search-icon {
          position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
          color: var(--bug-text-muted); pointer-events: none;
        }
        .bug-search-input {
          padding-left: 34px !important; padding-right: 34px !important;
        }
        .bug-search-clear {
          position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
          background: var(--bug-border); border: none;
          color: var(--bug-text-muted); cursor: pointer;
          padding: 3px 5px; border-radius: 4px;
          display: flex; align-items: center;
        }
        .bug-result-count {
          font-size: 12px; color: var(--bug-text-muted); white-space: nowrap;
          padding: 6px 12px; border-radius: 6px;
          background: var(--bug-input-bg); border: 1px solid var(--bug-border);
        }
        .bug-result-count span { color: var(--bug-accent); font-weight: 600; }

        /* ── Inputs ── */
        .bug-input {
          width: 100%; padding: 10px 14px; border-radius: 9px;
          border: 1px solid var(--bug-border);
          background: var(--bug-input-bg); color: var(--bug-text);
          font-size: 14px; outline: none; font-family: inherit;
          transition: all 0.15s; box-sizing: border-box;
        }
        .bug-input:focus {
          border-color: var(--bug-accent);
          box-shadow: 0 0 0 3px var(--bug-accent-glow);
        }
        .bug-select { cursor: pointer; appearance: none; }
        .bug-textarea { resize: vertical; line-height: 1.6; }

        /* ── Table ── */
        .bug-table-wrap {
          border-radius: 12px; overflow: hidden;
          border: 1px solid var(--bug-border);
          background: var(--bug-card);
        }
        .bug-table {
          width: 100%; border-collapse: separate; border-spacing: 0;
          font-size: 13px; table-layout: fixed;
        }
        .bug-table th {
          padding: 11px 14px; text-align: left;
          font-size: 10px; font-weight: 600;
          color: var(--bug-text-muted); text-transform: uppercase; letter-spacing: 0.8px;
          border-bottom: 1px solid var(--bug-border);
          background: var(--bug-card-elevated);
          position: sticky; top: 0; z-index: 5;
        }
        .bug-table td {
          padding: 12px 14px;
          border-bottom: 1px solid var(--bug-border);
          vertical-align: middle;
          overflow: hidden;
        }
        .bug-table tbody tr {
          transition: background 0.15s; cursor: pointer;
        }
        .bug-row-hover { background: var(--bug-hover-bg) !important; }
        .bug-table tbody tr:last-child td { border-bottom: none; }

        .bug-title-cell { min-width: 0; }
        .bug-title-text {
          font-weight: 500; color: var(--bug-text);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .bug-title-meta {
          font-size: 11px; color: var(--bug-text-muted); margin-top: 2px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        .bug-assignee-cell { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .bug-avatar {
          width: 24px; height: 24px; border-radius: 7px;
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2));
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; color: var(--bug-accent);
          flex-shrink: 0;
        }
        .bug-avatar-lg {
          width: 30px; height: 30px; border-radius: 8px;
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2));
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: var(--bug-accent);
          flex-shrink: 0;
        }
        .bug-assignee-name {
          color: var(--bug-text-secondary); font-size: 13px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .bug-unassigned {
          color: var(--bug-text-faint); font-size: 12px; font-style: italic;
        }

        .bug-file-link {
          display: inline-flex; align-items: center; justify-content: center;
          width: 26px; height: 26px; border-radius: 6px;
          color: var(--bug-accent); background: var(--bug-accent-bg);
          border: 1px solid var(--bug-accent-border);
          text-decoration: none; transition: all 0.15s;
        }
        .bug-file-link:hover {
          background: rgba(99,102,241,0.18);
          transform: scale(1.05);
        }
        .bug-file-none { color: var(--bug-text-faint); font-size: 11px; }

        .bug-row-actions {
          display: flex; gap: 4px; justify-content: flex-end;
          opacity: 0; transition: opacity 0.15s;
        }
        .bug-row-actions.visible { opacity: 1; }
        .bug-action-btn {
          background: var(--bug-input-bg); border: 1px solid var(--bug-border);
          border-radius: 6px; padding: 5px 7px; cursor: pointer;
          color: var(--bug-text-muted);
          display: flex; align-items: center; transition: all 0.15s;
        }
        .bug-action-btn:hover {
          color: var(--bug-accent); border-color: var(--bug-accent-border);
          background: var(--bug-accent-glow);
        }
        .bug-action-btn-danger:hover {
          color: var(--bug-danger); border-color: var(--bug-danger-border);
          background: var(--bug-danger-bg);
        }

        /* ── Badge shared ── */
        .bug-badge {
          display: inline-flex; align-items: center; gap: 5px;
          border-radius: 6px; font-weight: 600;
          white-space: nowrap; line-height: 1;
        }

        /* ── Empty ── */
        .bug-empty {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 60px 40px; text-align: center;
          border-radius: 12px;
          background: var(--bug-card); border: 1px solid var(--bug-border);
        }
        .bug-empty-icon {
          width: 66px; height: 66px; border-radius: 18px; margin-bottom: 16px;
          background: linear-gradient(135deg, rgba(239,68,68,0.1), rgba(245,158,11,0.08));
          border: 1px solid rgba(239,68,68,0.12);
          color: var(--bug-danger); opacity: 0.5;
          display: flex; align-items: center; justify-content: center;
        }
        .bug-empty h3 {
          color: var(--bug-text); margin: 0 0 6px;
          font-size: 15px; font-weight: 600;
        }
        .bug-empty p {
          color: var(--bug-text-muted); margin: 0 0 20px;
          font-size: 13px; max-width: 340px; line-height: 1.6;
        }
        .bug-empty-actions { display: flex; gap: 8px; }

        /* ── Buttons ── */
        .bug-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 16px; border-radius: 9px;
          font-size: 13px; font-weight: 500; font-family: inherit;
          border: none; cursor: pointer; transition: all 0.15s;
        }
        .bug-btn-primary {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #fff; font-weight: 600;
          box-shadow: 0 2px 12px rgba(239,68,68,0.3);
        }
        .bug-btn-primary:hover:not(.bug-btn-disabled) {
          box-shadow: 0 4px 20px rgba(239,68,68,0.45);
          transform: translateY(-1px);
        }
        .bug-btn-primary-purple {
          background: linear-gradient(135deg, #6366f1, #7c3aed);
          color: #fff; font-weight: 600;
        }
        .bug-btn-primary-purple:hover {
          box-shadow: 0 4px 16px rgba(99,102,241,0.4);
          transform: translateY(-1px);
        }
        .bug-btn-secondary {
          background: var(--bug-card); border: 1px solid var(--bug-border);
          color: var(--bug-text-secondary);
        }
        .bug-btn-secondary:hover {
          background: var(--bug-card-hover);
          border-color: var(--bug-border-hover);
          color: var(--bug-text);
        }
        .bug-btn-disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }

        .bug-spinner {
          width: 13px; height: 13px;
          border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
          border-radius: 50%; animation: bugSpin 0.8s linear infinite;
        }
        @keyframes bugSpin { to { transform: rotate(360deg); } }

        /* ── Modal footers ── */
        .bug-modal-footer { display: flex; gap: 8px; justify-content: flex-end; width: 100%; }

        /* ── View modal ── */
        .bug-view-header { margin-bottom: 24px; }
        .bug-breadcrumb {
          display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
          font-size: 12px; color: var(--bug-text-muted);
        }
        .bug-code {
          font-family: monospace; padding: 3px 9px; border-radius: 5px;
          background: var(--bug-card-elevated); border: 1px solid var(--bug-border);
          color: var(--bug-text-muted);
        }
        .bug-view-title {
          margin: 0 0 12px; font-size: 20px; font-weight: 700;
          color: var(--bug-text); line-height: 1.3; letter-spacing: -0.3px;
        }
        .bug-view-meta { display: flex; gap: 10px; flex-wrap: wrap; }
        .bug-meta-card {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 14px; border-radius: 8px;
          background: var(--bug-card); border: 1px solid var(--bug-border);
        }
        .bug-meta-label {
          font-size: 10px; color: var(--bug-text-muted);
          text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;
        }
        .bug-meta-value { font-size: 13px; color: var(--bug-text); font-weight: 500; }

        .bug-view-section { margin-bottom: 24px; }
        .bug-view-section:last-child { margin-bottom: 0; }
        .bug-section-heading {
          display: flex; align-items: center; gap: 7px; margin: 0 0 10px;
          font-size: 12px; font-weight: 600; color: var(--bug-text-muted);
          text-transform: uppercase; letter-spacing: 0.8px;
        }
        .bug-section-heading svg { color: var(--bug-accent); }
        .bug-description {
          padding: 16px; border-radius: 10px;
          background: var(--bug-card); border: 1px solid var(--bug-border);
          color: var(--bug-text-secondary); font-size: 14px; line-height: 1.7;
          white-space: pre-wrap;
        }

        /* ── Video/File ── */
        .bug-video-wrap {
          border-radius: 10px; overflow: hidden;
          border: 1px solid var(--bug-border);
        }
        .bug-video {
          width: 100%; max-height: 400px; background: #000; display: block;
        }
        .bug-video-info {
          padding: 10px 14px; background: var(--bug-card);
          border-top: 1px solid var(--bug-border);
          display: flex; align-items: center; justify-content: space-between;
        }
        .bug-video-info-left {
          display: flex; align-items: center; gap: 8px;
          color: var(--bug-text); font-size: 13px; font-weight: 500;
        }
        .bug-video-info-left svg { color: var(--bug-accent); }
        .bug-video-link {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 12px; color: var(--bug-accent); text-decoration: none;
        }
        .bug-file-card {
          display: flex; align-items: center; gap: 14px; padding: 16px;
          border: 1px solid var(--bug-border); border-radius: 10px;
          text-decoration: none; background: var(--bug-card);
          transition: all 0.15s;
        }
        .bug-file-card:hover {
          background: var(--bug-card-hover);
          border-color: var(--bug-accent-border);
        }
        .bug-file-icon {
          width: 42px; height: 42px; border-radius: 10px;
          background: var(--bug-accent-bg);
          border: 1px solid var(--bug-accent-border);
          color: var(--bug-accent);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .bug-file-info { flex: 1; }
        .bug-file-name { font-size: 14px; font-weight: 500; color: var(--bug-text); }
        .bug-file-hint { font-size: 12px; color: var(--bug-text-muted); margin-top: 2px; }
        .bug-file-external { color: var(--bug-text-faint); flex-shrink: 0; }

        /* ── Form modal ── */
        .bug-form-header {
          display: flex; align-items: center; gap: 10px; margin-bottom: 24px;
        }
        .bug-form-header-icon {
          width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
          color: var(--bug-danger);
          display: flex; align-items: center; justify-content: center;
        }
        .bug-form-header h2 {
          margin: 0; font-size: 18px; font-weight: 700; color: var(--bug-text);
        }
        .bug-form-header p {
          margin: 2px 0 0; font-size: 12px; color: var(--bug-text-muted);
        }

        .bug-form-fields { display: flex; flex-direction: column; gap: 16px; }
        .bug-form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .bug-label {
          display: block; margin-bottom: 6px;
          font-size: 12px; font-weight: 500; color: var(--bug-text-secondary);
        }
        .bug-label-hint { color: var(--bug-text-faint); font-weight: 400; margin-left: 4px; }
        .bug-required { color: var(--bug-danger); }
        .bug-input-icon {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
          color: var(--bug-text-muted); pointer-events: none;
        }

        /* ── Dropdown ── */
        .bug-dropdown {
          position: absolute; top: 100%; left: 0; right: 0; z-index: 50;
          margin-top: 4px; border-radius: 10px; overflow: hidden;
          background: var(--bug-card-elevated); backdrop-filter: blur(20px);
          border: 1px solid var(--bug-border);
          box-shadow: 0 12px 40px rgba(0,0,0,0.2);
          max-height: 200px; overflow-y: auto;
        }
        [data-theme="light"] .bug-dropdown {
          box-shadow: 0 12px 40px rgba(0,0,0,0.08);
        }
        .bug-dropdown-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; cursor: pointer;
          border-bottom: 1px solid var(--bug-border);
          transition: background 0.15s;
        }
        .bug-dropdown-item:hover { background: var(--bug-hover-bg); }
        .bug-dropdown-name { font-size: 13px; font-weight: 500; color: var(--bug-text); }
        .bug-dropdown-email { font-size: 11px; color: var(--bug-text-muted); }

        /* ── Dropzone ── */
        .bug-dropzone {
          border: 2px dashed var(--bug-border); border-radius: 12px;
          padding: 28px 20px; text-align: center; position: relative;
          background: var(--bug-card); transition: all 0.2s;
        }
        .bug-dropzone-active {
          border-color: var(--bug-accent) !important;
          background: var(--bug-accent-glow) !important;
        }
        .bug-dropzone-input {
          position: absolute; inset: 0; opacity: 0; cursor: pointer;
        }
        .bug-dropzone-icon {
          width: 42px; height: 42px; border-radius: 10px; margin: 0 auto 10px;
          background: var(--bug-accent-bg);
          border: 1px solid var(--bug-accent-border);
          color: var(--bug-accent);
          display: flex; align-items: center; justify-content: center;
        }
        .bug-dropzone-title {
          color: var(--bug-text-secondary); margin: 0 0 3px;
          font-size: 13px; font-weight: 500;
        }
        .bug-dropzone-hint {
          color: var(--bug-text-muted); margin: 0; font-size: 11px;
        }
        .bug-dropzone-selected {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
        }
        .bug-dropzone-check {
          width: 42px; height: 42px; border-radius: 10px;
          background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2);
          color: #22c55e;
          display: flex; align-items: center; justify-content: center;
        }
        .bug-dropzone-file {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 14px; border-radius: 8px;
          background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.15);
          color: #22c55e; font-size: 13px; font-weight: 500;
        }
        .bug-dropzone-remove {
          background: none; border: none; color: var(--bug-text-muted);
          cursor: pointer; padding: 2px; margin-left: 4px; display: flex;
        }

        /* ── Reporter card ── */
        .bug-reporter-card {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 9px;
          background: var(--bug-accent-glow); border: 1px solid var(--bug-accent-border);
        }
        .bug-reporter-label { font-size: 12px; color: var(--bug-text-muted); }
        .bug-reporter-name { font-size: 13px; color: var(--bug-text); font-weight: 500; }

        /* ── Warning banner ── */
        .bug-warning-banner {
          display: flex; align-items: flex-start; gap: 8px;
          padding: 10px 14px; border-radius: 8px;
          background: var(--bug-danger-bg); border: 1px solid var(--bug-danger-border);
        }
        .bug-warning-banner svg {
          color: var(--bug-danger); flex-shrink: 0; margin-top: 1px;
        }
        .bug-warning-banner span {
          color: var(--bug-danger); font-size: 13px; line-height: 1.5;
        }

        /* ── Responsive ── */
        @media (max-width: 1200px) {
          .bug-metrics-row { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 900px) {
          .bug-body { padding: 20px; }
          .bug-header { padding: 20px; }
          .bug-metrics-row { grid-template-columns: repeat(2, 1fr); }
          .bug-table { min-width: 700px; }
        }
        @media (max-width: 640px) {
          .bug-form-grid-2 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

export default Bugs;
