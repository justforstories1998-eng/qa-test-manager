import React, { useState, useEffect, useMemo } from 'react';
import {
  FiAlertTriangle, FiPlus, FiSearch, FiEdit2, FiTrash2, FiX,
  FiPaperclip, FiEye, FiUser, FiInfo, FiFileText, FiClock
} from 'react-icons/fi';
import api from '../api';
import { toast } from 'react-toastify';

function Bugs({ projectId }) {
  const [bugs, setBugs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingBug, setEditingBug] = useState(null);
  const [viewingBug, setViewingBug] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { if (projectId) loadBugs(); }, [projectId]);

  const loadBugs = async () => {
    try {
      const res = await api.getBugs(projectId);
      if (res.success) setBugs(res.data);
    } catch (e) { toast.error("Sync Error"); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 10 * 1024 * 1024) {
      toast.error("File exceeds 10MB limit");
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
        toast.success("Updated");
      } else {
        await api.createBug(formData);
        toast.success("Reported");
      }
      setShowModal(false);
      setSelectedFile(null);
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

  // SAFE URL RESOLVER
  const getSafeUrl = (bug) => {
    if (!bug.attachment) return null;
    return typeof bug.attachment === 'string' ? bug.attachment : bug.attachment.url;
  };

  return (
    <div className="bugs-page">
      <div className="page-header responsive">
        <div className="header-content">
          <h2 className="section-title">Defect Management</h2>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingBug(null); setSelectedFile(null); setShowModal(true); }}>
          <FiPlus /> Report Defect
        </button>
      </div>

      <div className="bug-filters-tabs">
        {['All', 'Active', 'Under development', 'In Progress', 'Resolved', 'Closed'].map(opt => (
          <button key={opt} className={`bug-tab ${statusFilter === opt ? 'active' : ''}`} onClick={() => setStatusFilter(opt)}>{opt}</button>
        ))}
      </div>

      <div className="test-cases-main">
        <div className="table-container">
          <table className="data-table bugs-table">
            <thead>
              <tr>
                <th style={{width: '120px'}}>Severity</th>
                <th>Title</th>
                <th style={{width: '150px'}}>Status</th>
                <th style={{width: '120px'}}>Evidence</th>
                <th style={{width: '150px', textAlign: 'right'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBugs.map(bug => {
                const fileUrl = getSafeUrl(bug);
                return (
                  <tr key={bug._id || bug.id}>
                    <td><span className={`priority-badge ${(bug.severity || 'Medium').toLowerCase()}`}>{bug.severity}</span></td>
                    <td><div style={{fontWeight: 700}}>{bug.title}</div></td>
                    <td><span className={`status-badge ${(bug.status || 'Active').toLowerCase().replace(/\s+/g, '')}`}>{bug.status}</span></td>
                    <td>
                      {fileUrl ? (
                        <a
                          href={api.getFileUrl(fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="attachment-preview"
                          style={{textDecoration:'none', border:'none', cursor:'pointer', display: 'flex', alignItems: 'center', gap: '5px'}}
                        >
                          <FiEye /> View
                        </a>
                      ) : <span style={{color: '#cbd5e1', fontSize: '11px'}}>No file</span>}
                    </td>
                    <td className="actions-cell">
                      <div style={{display:'flex', gap:'8px', justifyContent:'flex-end'}}>
                        <button className="action-btn" onClick={() => { setViewingBug(bug); setShowViewModal(true); }}><FiEye /></button>
                        <button className="action-btn" onClick={() => { setEditingBug(bug); setSelectedFile(null); setShowModal(true); }}><FiEdit2 /></button>
                        <button className="action-btn danger" onClick={() => handleDelete(bug._id || bug.id)}><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW MODAL */}
      {showViewModal && viewingBug && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header"><h3>Defect Detail</h3><button onClick={() => setShowViewModal(false)}><FiX /></button></div>
            <div className="modal-body modal-body-scroll">
              <h2 style={{marginBottom:'10px'}}>{viewingBug.title}</h2>
              <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
                 <span className={`status-badge ${viewingBug.status?.toLowerCase().replace(/\s+/g, '')}`}>{viewingBug.status}</span>
                 <span className="priority-badge">{viewingBug.severity}</span>
              </div>
              <p style={{whiteSpace:'pre-wrap', background:'#f8fafc', padding:'15px', borderRadius:'8px'}}>{viewingBug.description}</p>

              {getSafeUrl(viewingBug) && (
                <div style={{marginTop:'20px'}}>
                   <a
                    href={api.getFileUrl(getSafeUrl(viewingBug))}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{display:'flex', alignItems:'center', gap:'15px', padding:'20px', border:'1px solid #e2e8f0', borderRadius:'12px', textDecoration:'none', color:'inherit', background: '#fff'}}
                   >
                     <FiFileText size={24} color="#6366f1" />
                     <div>
                       <div style={{fontWeight:'700'}}>{viewingBug.attachment?.originalName || 'View Evidence'}</div>
                       <div style={{fontSize:'12px', color:'#94a3b8'}}>Open in new tab</div>
                     </div>
                   </a>
                </div>
              )}
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>Close</button></div>
          </div>
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header"><h3>{editingBug ? 'Update' : 'Report'} Bug</h3><button onClick={() => setShowModal(false)}><FiX /></button></div>
            <form onSubmit={handleSave}>
              <div className="modal-body modal-body-scroll">
                <div className="form-group"><label>Title</label><input name="title" defaultValue={editingBug?.title} required /></div>
                <div className="form-group"><label>Description</label><textarea name="description" defaultValue={editingBug?.description} rows={5} /></div>
                <div className="form-row">
                   <div className="form-group"><label>Severity</label><select name="severity" defaultValue={editingBug?.severity || 'Medium'}><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></div>
                   <div className="form-group"><label>Status</label><select name="status" defaultValue={editingBug?.status || 'Active'}><option>Active</option><option>Under development</option><option>In Progress</option><option>Resolved</option><option>Closed</option></select></div>
                </div>
                <div className="form-group">
                  <label>Attachment (Max 10MB)</label>
                  <div className="file-upload-area" style={{height:'100px'}}><input type="file" onChange={handleFileChange} /><div className="file-upload-label"><FiPaperclip /><span>{selectedFile ? selectedFile.name : 'Upload File'}</span></div></div>
                </div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={isSaving}>Save</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default Bugs;