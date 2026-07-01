import React, { useState, useEffect, useMemo } from 'react';
import {
  FiAlertTriangle, FiPlus, FiSearch, FiEdit2, FiTrash2, FiX,
  FiPaperclip, FiEye, FiUser, FiInfo, FiFileText, FiClock, FiVideo
} from 'react-icons/fi';
import api from '../api';
import { toast } from 'react-toastify';
import { Modal, ConfirmDialog } from './shared/Modal';
import Badge from './shared/Badge';

function Bugs({ projectId, user }) {
  const [bugs, setBugs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingBug, setEditingBug] = useState(null);
  const [viewingBug, setViewingBug] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [assignedToQuery, setAssignedToQuery] = useState('');
  const [assignedToResults, setAssignedToResults] = useState([]);
  const [showAssignedDropdown, setShowAssignedDropdown] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');

  useEffect(() => { if (projectId) loadBugs(); }, [projectId]);

  const loadBugs = async () => {
    try {
      const res = await api.getBugs(projectId);
      if (res.success) setBugs(res.data);
    } catch (e) { toast.error("Sync Error"); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 50 * 1024 * 1024) {
      toast.error("File exceeds 50MB limit");
      e.target.value = null;
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (file && !allowedTypes.includes(file.type)) {
      toast.error("File type not supported. Allowed: JPG, PNG, PDF, MP4, MOV, AVI, WebM, DOCX");
      e.target.value = null;
      return;
    }

    setSelectedFile(file);
  };

  const handleAssigneeSearch = async (query) => {
    setAssignedToQuery(query);
    if (query.length >= 2) {
      try {
        const res = await api.searchUsers(query);
        if (res.success) {
          setAssignedToResults(res.data);
          setShowAssignedDropdown(true);
        }
      } catch (err) {
        console.error('User search error:', err);
      }
    } else {
      setAssignedToResults([]);
      setShowAssignedDropdown(false);
    }
  };

  const selectAssignee = (user) => {
    setSelectedAssignee(`${user.firstName} ${user.lastName}`);
    setAssignedToQuery(`${user.firstName} ${user.lastName}`);
    setShowAssignedDropdown(false);
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
        toast.success("Updated");
      } else {
        await api.createBug(formData);
        toast.success("Reported");
      }
      setShowModal(false);
      setSelectedFile(null);
      setSelectedAssignee('');
      setAssignedToQuery('');
      loadBugs();
    } catch (e) { toast.error("Failed to save"); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete record?")) return;
    await api.deleteBug(id);
    loadBugs();
    toast.success("Deleted");
  };

  const filteredBugs = useMemo(() => {
    return bugs.filter(b => {
      const matchesSearch = b.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bugs, searchTerm, statusFilter]);

  const getSafeUrl = (bug) => {
    if (bug.attachments && bug.attachments.length > 0) {
      return bug.attachments[0].url;
    }
    if (!bug.attachment) return null;
    return typeof bug.attachment === 'string' ? bug.attachment : bug.attachment.url;
  };

  const isVideoFile = (mimeType) => {
    return mimeType && (mimeType.startsWith('video/') || ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'].includes(mimeType));
  };

  const getFileIcon = (bug) => {
    if (bug.attachments && bug.attachments.length > 0) {
      return isVideoFile(bug.attachments[0].mimeType) ? <FiVideo /> : <FiFileText />;
    }
    if (bug.attachment?.mimeType) {
      return isVideoFile(bug.attachment.mimeType) ? <FiVideo /> : <FiFileText />;
    }
    return <FiFileText />;
  };

  const tabOptions = ['All', 'Active', 'Under development', 'In Progress', 'Resolved', 'Closed'];

  return (
    <div className="dg-page">
      {/* Header */}
      <div className="dg-page-header">
        <div>
          <h2 className="dg-page-title">Defect Management</h2>
          <p style={{ color: '#6c7a89', margin: 0, fontSize: '14px' }}>
            Track, assign, and resolve defects across your projects.
          </p>
        </div>
        <button
          className="dg-btn dg-btn-primary"
          onClick={() => {
            setEditingBug(null);
            setSelectedFile(null);
            setSelectedAssignee('');
            setAssignedToQuery('');
            setShowModal(true);
          }}
        >
          <FiPlus style={{ marginRight: 6 }} /> Report Defect
        </button>
      </div>

      {/* Status Tabs */}
      <div className="dg-tabs" style={{ marginBottom: '16px' }}>
        {tabOptions.map(opt => (
          <button
            key={opt}
            className={`dg-tab ${statusFilter === opt ? 'active' : ''}`}
            onClick={() => setStatusFilter(opt)}
          >
            {opt}
            {opt !== 'All' && (
              <span style={{
                marginLeft: '6px', fontSize: '11px',
                background: statusFilter === opt ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.04)',
                padding: '1px 7px', borderRadius: '10px',
              }}>
                {bugs.filter(b => b.status === opt).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', marginBottom: '16px', background: '#ffffff', border: '1px solid #e7e8ed', borderRadius: '10px' }}>
        <div className="dg-search" style={{ flex: 1 }}>
          <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c7a89', fontSize: '15px' }} />
          <input
            className="dg-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search defects by title…"
            type="text"
            style={{ paddingLeft: '36px', background: '#f5f5f9' }}
          />
          {searchTerm && (
            <button
              type="button"
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6c7a89', cursor: 'pointer', padding: '2px' }}
              onClick={() => setSearchTerm("")}
            >
              <FiX />
            </button>
          )}
        </div>
        <div style={{ color: '#6c7a89', fontSize: '13px', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#6366f1', fontWeight: 600 }}>{filteredBugs.length}</span> defects
        </div>
      </div>

      {/* Bugs Table */}
      <div style={{ padding: 0, overflow: 'hidden', background: '#ffffff', border: '1px solid #e7e8ed', borderRadius: '10px' }}>
        {filteredBugs.length ? (
          <div className="dg-table-wrapper">
            <table className="dg-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Severity</th>
                  <th>Title</th>
                  <th style={{ width: '150px' }}>Assigned To</th>
                  <th style={{ width: '150px' }}>Status</th>
                  <th style={{ width: '120px' }}>Evidence</th>
                  <th style={{ width: '100px' }}>Created By</th>
                  <th style={{ width: '150px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBugs.map(bug => {
                  const fileUrl = getSafeUrl(bug);
                  return (
                    <tr key={bug._id || bug.id}>
                      <td><Badge>{bug.severity || 'Medium'}</Badge></td>
                      <td style={{ fontWeight: 600, color: '#2b2c41' }}>{bug.title}</td>
                      <td>
                        {bug.assignedTo ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#6c7a89', fontSize: '13px' }}>
                            <FiUser size={13} style={{ color: '#6366f1' }} /> {bug.assignedTo}
                          </span>
                        ) : (
                          <span style={{ color: '#a3acb9', fontSize: '12px' }}>Unassigned</span>
                        )}
                      </td>
                      <td><Badge>{bug.status || 'Active'}</Badge></td>
                      <td>
                        {fileUrl ? (
                          <a
                            href={api.getFileUrl(fileUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px',
                              color: '#6366f1', textDecoration: 'none', fontSize: '13px',
                            }}
                          >
                            {getFileIcon(bug)} View
                          </a>
                        ) : (
                          <span style={{ color: '#a3acb9', fontSize: '12px' }}>No file</span>
                        )}
                      </td>
                      <td style={{ fontSize: '12px', color: '#6c7a89' }}>
                        {bug.createdBy?.firstName ? `${bug.createdBy.firstName} ${bug.createdBy.lastName}` : '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            className="dg-btn dg-btn-ghost"
                            style={{ padding: '6px 8px' }}
                            onClick={() => { setViewingBug(bug); setShowViewModal(true); }}
                          >
                            <FiEye size={15} />
                          </button>
                          <button
                            className="dg-btn dg-btn-ghost"
                            style={{ padding: '6px 8px' }}
                            onClick={() => {
                              setEditingBug(bug);
                              setSelectedFile(null);
                              setSelectedAssignee(bug.assignedTo || '');
                              setAssignedToQuery(bug.assignedTo || '');
                              setShowModal(true);
                            }}
                          >
                            <FiEdit2 size={15} />
                          </button>
                          <button
                            className="dg-btn dg-btn-danger"
                            style={{ padding: '6px 8px' }}
                            onClick={() => handleDelete(bug._id || bug.id)}
                          >
                            <FiTrash2 size={15} />
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
          <div className="dg-empty" style={{ padding: '60px 20px' }}>
            <FiAlertTriangle size={48} style={{ color: '#a3acb9', marginBottom: '16px' }} />
            <h3 style={{ color: '#6c7a89', margin: '0 0 8px 0', fontSize: '16px' }}>No defects found</h3>
            <p style={{ color: '#a3acb9', margin: 0, fontSize: '13px' }}>
              {searchTerm ? 'Try a different search term.' : 'No defects reported yet.'}
            </p>
          </div>
        )}
      </div>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal && !!viewingBug}
        onClose={() => setShowViewModal(false)}
        title="Defect Detail"
        size="lg"
        footer={
          <button className="dg-btn dg-btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
        }
      >
        {viewingBug && (
          <>
            <h2 style={{ color: '#2b2c41', margin: '0 0 14px 0', fontSize: '18px', fontWeight: 600 }}>
              {viewingBug.title}
            </h2>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <Badge>{viewingBug.status}</Badge>
              <Badge>{viewingBug.severity}</Badge>
              {viewingBug.assignedTo && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#6c7a89', fontSize: '13px' }}>
                  <FiUser size={13} style={{ color: '#6366f1' }} /> {viewingBug.assignedTo}
                </span>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#6366f1', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Description</h4>
              <p style={{
                whiteSpace: 'pre-wrap', background: '#f5f5f9',
                border: '1px solid #e7e8ed', padding: '16px',
                borderRadius: '8px', color: '#2b2c41', fontSize: '14px', lineHeight: 1.6,
                margin: 0,
              }}>
                {viewingBug.description}
              </p>
            </div>

            {getSafeUrl(viewingBug) && (
              <div>
                <h4 style={{ color: '#6366f1', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Evidence</h4>
                {isVideoFile(viewingBug.attachment?.mimeType || viewingBug.attachments?.[0]?.mimeType) ? (
                  <div style={{
                    border: '1px solid #e7e8ed', borderRadius: '10px',
                    overflow: 'hidden',
                  }}>
                    <video
                      controls
                      style={{ width: '100%', maxHeight: '400px', background: '#f5f5f9', display: 'block' }}
                      src={api.getFileUrl(getSafeUrl(viewingBug))}
                    >
                      Your browser does not support video playback.
                    </video>
                    <div style={{ padding: '10px 14px', background: '#f5f5f9' }}>
                      <div style={{ fontWeight: 600, color: '#2b2c41', fontSize: '13px' }}>
                        {viewingBug.attachment?.originalName || viewingBug.attachments?.[0]?.originalName || 'Video Evidence'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <a
                    href={api.getFileUrl(getSafeUrl(viewingBug))}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '14px', padding: '18px',
                      border: '1px solid #e7e8ed', borderRadius: '10px',
                      textDecoration: 'none', color: 'inherit', background: '#f5f5f9',
                    }}
                  >
                    <FiFileText size={24} style={{ color: '#6366f1' }} />
                    <div>
                      <div style={{ fontWeight: 600, color: '#2b2c41', fontSize: '14px' }}>
                        {viewingBug.attachment?.originalName || viewingBug.attachments?.[0]?.originalName || 'View Evidence'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#a3acb9' }}>Open in new tab</div>
                    </div>
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingBug ? 'Update Bug' : 'Report Bug'}
        size="lg"
        footer={
          <>
            <button type="button" className="dg-btn dg-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" form="bug-form" className="dg-btn dg-btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <form id="bug-form" onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="dg-input-group">
              <label className="dg-input-label">
                Title <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input
                className="dg-input"
                name="title"
                defaultValue={editingBug?.title}
                required
                placeholder="Brief description of the defect…"
              />
            </div>

            <div className="dg-input-group">
              <label className="dg-input-label">Description</label>
              <textarea
                className="dg-textarea"
                name="description"
                defaultValue={editingBug?.description}
                rows={5}
                placeholder="Detailed steps to reproduce…"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="dg-input-group">
                <label className="dg-input-label">Severity</label>
                <select className="dg-select" name="severity" defaultValue={editingBug?.severity || 'Medium'}>
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
              <div className="dg-input-group">
                <label className="dg-input-label">Status</label>
                <select className="dg-select" name="status" defaultValue={editingBug?.status || 'Active'}>
                  <option>Active</option>
                  <option>Under development</option>
                  <option>In Progress</option>
                  <option>Resolved</option>
                  <option>Closed</option>
                </select>
              </div>
            </div>

            <div className="dg-input-group" style={{ position: 'relative' }}>
              <label className="dg-input-label">Assigned To</label>
              <input
                className="dg-input"
                type="text"
                value={assignedToQuery}
                onChange={(e) => handleAssigneeSearch(e.target.value)}
                onFocus={() => assignedToResults.length > 0 && setShowAssignedDropdown(true)}
                onBlur={() => setTimeout(() => setShowAssignedDropdown(false), 200)}
                placeholder="Search by name or email…"
              />
              <input type="hidden" name="assignedTo" value={selectedAssignee} />
              {showAssignedDropdown && assignedToResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: '#ffffff', backdropFilter: 'blur(20px)',
                  border: '1px solid #e7e8ed', borderRadius: '8px',
                  marginTop: '4px', maxHeight: '200px', overflowY: 'auto',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}>
                  {assignedToResults.map(u => (
                    <div
                      key={u._id || u.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 14px', cursor: 'pointer',
                        borderBottom: '1px solid #e7e8ed',
                        transition: 'background 0.15s',
                      }}
                      onMouseDown={() => selectAssignee(u)}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: 'rgba(99,102,241,0.12)', color: '#6366f1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 700, flexShrink: 0,
                      }}>
                        {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ color: '#2b2c41', fontSize: '13px', fontWeight: 500 }}>{u.firstName} {u.lastName}</div>
                        <div style={{ color: '#a3acb9', fontSize: '12px' }}>{u.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="dg-input-group">
              <label className="dg-input-label">Attachment (Max 50MB)</label>
              <div style={{
                border: '2px dashed #e7e8ed', borderRadius: '10px',
                padding: '20px', textAlign: 'center', position: 'relative',
                background: '#f5f5f9', minHeight: '80px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.pdf,.mp4,.mov,.avi,.webm,.docx"
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                />
                {selectedFile && isVideoFile(selectedFile.type) ? <FiVideo size={20} style={{ color: '#a3acb9', marginBottom: '6px' }} /> : <FiPaperclip size={20} style={{ color: '#a3acb9', marginBottom: '6px' }} />}
                <span style={{ color: selectedFile ? '#6366f1' : '#6c7a89', fontSize: '13px' }}>
                  {selectedFile ? selectedFile.name : 'Upload Image, Video (max 50MB), or Document'}
                </span>
              </div>
            </div>

            {user && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 14px', background: 'rgba(99,102,241,0.08)',
                borderRadius: '8px', color: '#6c7a89', fontSize: '13px',
              }}>
                <FiInfo size={15} style={{ color: '#6366f1', flexShrink: 0 }} />
                Reported by: <span style={{ color: '#2b2c41' }}>{user.firstName} {user.lastName}</span>
              </div>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Bugs;
