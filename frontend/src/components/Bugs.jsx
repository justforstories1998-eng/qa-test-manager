import React, { useState, useEffect, useMemo } from 'react';
import { 
  FiAlertTriangle, FiPlus, FiSearch, FiEdit2, FiTrash2, FiX, 
  FiPaperclip, FiEye, FiFilter, FiCheckCircle, FiClock, FiCode 
} from 'react-icons/fi';
import api from '../api';
import { toast } from 'react-toastify';

function Bugs({ projectId }) {
  const [bugs, setBugs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingBug, setEditingBug] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { if (projectId) loadBugs(); }, [projectId]);

  const loadBugs = async () => {
    try {
      const res = await api.getBugs(projectId);
      if (res.success) setBugs(res.data);
    } catch (e) { toast.error("Hardware Sync Error"); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 10 * 1024 * 1024) {
      toast.error("Telemetry exceeds 10MB limit");
      e.target.value = null;
      return;
    }
    setSelectedFile(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.target);
    formData.append('projectId', projectId);
    if (selectedFile) formData.append('attachment', selectedFile);

    try {
      if (editingBug) {
        await api.updateBug(editingBug.id || editingBug._id, formData);
        toast.success("Defect record updated");
      } else {
        await api.createBug(formData);
        toast.success("Defect successfully logged");
      }
      setShowModal(false);
      setSelectedFile(null);
      loadBugs();
    } catch (e) { toast.error("Logic Error: Failed to save"); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently purge this defect record?")) return;
    try {
      await api.deleteBug(id);
      loadBugs();
      toast.success("Record purged");
    } catch (e) { toast.error("Purge aborted"); }
  };

  const handleViewAttachment = (url) => {
    window.open(api.getFileUrl(url), '_blank');
  };

  // Filter Logic
  const filteredBugs = useMemo(() => {
    return bugs.filter(b => {
      const matchesSearch = b.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bugs, searchTerm, statusFilter]);

  const statusOptions = ['All', 'Active', 'Under development', 'In Progress', 'Resolved', 'Closed'];

  return (
    <div className="bugs-page">
      <div className="page-header responsive">
        <div className="header-content">
          <h2 className="section-title" style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            Defect Management
          </h2>
          <p className="section-description" style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
            Track, analyze and resolve project bugs
          </p>
        </div>
        <button 
          className="btn btn-primary btn-lg" 
          style={{
            borderRadius: '12px',
            padding: '14px 28px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }} 
          onClick={() => { setEditingBug(null); setSelectedFile(null); setShowModal(true); }}
        >
          <FiPlus style={{ marginRight: '8px' }} /> Report Defect
        </button>
      </div>

      {/* Modern Filter Tabs */}
      <div className="bug-filters-tabs">
        {statusOptions.map(opt => (
          <button 
            key={opt} 
            className={`bug-tab ${statusFilter === opt ? 'active' : ''}`}
            onClick={() => setStatusFilter(opt)}
          >
            {opt}
          </button>
        ))}
      </div>

      <div className="test-cases-main">
        <div className="filters-bar">
          <div className="search-box">
            <FiSearch style={{ fontSize: '18px', color: '#94a3b8' }} />
            <input 
              placeholder="Search mission defects..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              style={{ fontSize: '14px', fontWeight: '500' }}
            />
          </div>
          <div className="results-count" style={{marginLeft:'auto', fontWeight:'700', fontSize:'11px', color: '#94a3b8', letterSpacing: '0.05em'}}>
            {filteredBugs.length} DEFECTS FOUND
          </div>
        </div>

        <div className="table-container">
          <table className="data-table bugs-table">
            <thead>
              <tr>
                <th style={{width: '140px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', color: '#64748b'}}>SEVERITY</th>
                <th style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', color: '#64748b' }}>TITLE</th>
                <th style={{width: '180px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', color: '#64748b'}}>STATUS</th>
                <th style={{width: '140px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', color: '#64748b'}}>EVIDENCE</th>
                <th style={{width: '120px', textAlign: 'right', fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', color: '#64748b'}}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredBugs.map(bug => (
                <tr key={bug._id}>
                  <td>
                    <span className={`priority-badge ${(bug.severity || 'Medium').toLowerCase()}`}>
                      {bug.severity}
                    </span>
                  </td>
                  <td>
                    <div style={{fontWeight: 600, color: '#0f172a', fontSize: '14px', marginBottom: '6px', lineHeight: '1.4'}}>
                      {bug.title}
                    </div>
                    <div style={{fontSize: '12px', color: '#94a3b8', fontWeight: '500'}}>
                      Assigned to: <span style={{ color: '#64748b', fontWeight: '600' }}>{bug.assignedTo || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${(bug.status || 'Active').toLowerCase().replace(/\s+/g, '')}`}>
                      {bug.status}
                    </span>
                  </td>
                  <td>
                    {bug.attachment ? (
                      <button 
                        className="attachment-preview" 
                        style={{border:'none', cursor:'pointer', background: 'transparent'}} 
                        onClick={() => handleViewAttachment(bug.attachment)}
                      >
                        <FiEye style={{ fontSize: '16px' }} /> 
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>View File</span>
                      </button>
                    ) : <span style={{color: '#cbd5e1', fontSize: '12px', fontStyle: 'italic', fontWeight: '500'}}>No evidence</span>}
                  </td>
                  <td className="actions-cell">
                    <div style={{display:'flex', gap:'8px', justifyContent:'flex-end'}}>
                      <button className="action-btn" onClick={() => { setEditingBug(bug); setSelectedFile(null); setShowModal(true); }}>
                        <FiEdit2 />
                      </button>
                      <button className="action-btn danger" onClick={() => handleDelete(bug._id)}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBugs.length === 0 && (
                <tr>
                  <td colSpan="5" className="no-bugs-state">
                    <FiAlertTriangle size={56} style={{ color: '#cbd5e1', marginBottom: '20px' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                      No defects found
                    </h3>
                    <p style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '500' }}>
                      Change your filter or search criteria
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header">
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
                {editingBug ? 'Update Defect Log' : 'Report Project Defect'}
              </h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body modal-body-scroll">
                <div className="form-group">
                  <label>Defect Title</label>
                  <input name="title" defaultValue={editingBug?.title} required placeholder="Brief summary of the issue" />
                </div>
                <div className="form-group">
                  <label>Technical Description / Reproduction Steps</label>
                  <textarea 
                    name="description" 
                    defaultValue={editingBug?.description} 
                    rows={5} 
                    placeholder="Provide clear steps to reproduce the bug..."
                    style={{ lineHeight: '1.6' }}
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Severity Level</label>
                    <select name="severity" defaultValue={editingBug?.severity || 'Medium'}>
                      <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Current Status</label>
                    <select name="status" defaultValue={editingBug?.status || 'Active'}>
                      <option>Active</option>
                      <option>Under development</option>
                      <option>In Progress</option>
                      <option>Resolved</option>
                      <option>Closed</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Evidence Attachment (Image/Video/PDF - Max 10MB)</label>
                  <div className="file-upload-area">
                    <input type="file" onChange={handleFileChange} />
                    <div className="file-upload-label">
                      <FiPaperclip size={28} style={{marginBottom:'12px', color: '#6366f1'}} />
                      <span style={{fontWeight:'600', fontSize: '14px', color: '#334155'}}>
                        {selectedFile ? selectedFile.name : (editingBug?.attachment ? 'Change Evidence File' : 'Click to Upload Attachment')}
                      </span>
                      <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px', fontWeight: '500' }}>
                        Supports images, videos, and PDF documents
                      </span>
                    </div>
                  </div>
                  {editingBug?.attachment && !selectedFile && (
                    <div style={{marginTop: '14px', fontSize: '13px', color: '#6366f1', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px'}}>
                      <FiPaperclip size={14} />
                      Existing: {editingBug.attachment.originalName}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Assigned Developer</label>
                  <input name="assignedTo" defaultValue={editingBug?.assignedTo} placeholder="Enter name" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                   {isSaving ? "Synchronizing..." : "Commit Defect Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default Bugs;