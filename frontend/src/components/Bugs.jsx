import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiPlus, FiSearch, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import api from '../api';
import { toast } from 'react-toastify';

function Bugs({ projectId }) {
  const [bugs, setBugs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBug, setEditingBug] = useState(null);

  useEffect(() => { if (projectId) loadBugs(); }, [projectId]);

  const loadBugs = async () => {
    const res = await api.getBugs(projectId);
    if (res.success) setBugs(res.data);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    data.projectId = projectId;

    try {
      if (editingBug) {
        await api.updateBug(editingBug.id || editingBug._id, data);
        toast.success("Bug updated");
      } else {
        await api.createBug(data);
        toast.success("Bug reported");
      }
      setShowModal(false);
      loadBugs();
    } catch (e) { toast.error("Action failed"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this bug record?")) return;
    await api.deleteBug(id);
    loadBugs();
    toast.success("Record removed");
  };

  return (
    <div className="test-cases-page">
      <div className="page-header responsive">
        <div className="header-content">
          <h2 className="section-title">Bug Tracking</h2>
          <p className="section-description">Manage and track project defects</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingBug(null); setShowModal(true); }}><FiPlus /> Report Bug</button>
      </div>

      <div className="test-cases-main">
        <div className="filters-bar">
          <div className="search-box"><FiSearch /><input placeholder="Search bugs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{width: '120px'}}>Severity</th>
                <th>Bug Title</th>
                <th style={{width: '180px'}}>Status</th>
                <th>Assignee</th>
                <th style={{width: '120px'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bugs.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase())).map(bug => (
                <tr key={bug._id}>
                  <td><span className={`priority-badge priority-${(bug.severity || 'Medium').toLowerCase()}`}>{bug.severity}</span></td>
                  <td style={{fontWeight: 600}}>{bug.title}</td>
                  <td>
                    <span className={`status-badge ${(bug.status || 'Active').toLowerCase().replace(' ', '')}`}>
                      {bug.status}
                    </span>
                  </td>
                  <td>{bug.assignedTo || 'Unassigned'}</td>
                  <td className="actions-cell">
                    <div style={{display:'flex', gap:'8px'}}>
                      <button className="action-btn" onClick={() => { setEditingBug(bug); setShowModal(true); }}><FiEdit2 /></button>
                      <button className="action-btn danger" onClick={() => handleDelete(bug._id)}><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {bugs.length === 0 && <tr><td colSpan="5" className="text-center" style={{padding:'40px'}}>No bugs found for this project.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header"><h3>{editingBug ? 'Update Bug' : 'Report Bug'}</h3><button onClick={() => setShowModal(false)}><FiX /></button></div>
            <form onSubmit={handleSave}>
              <div className="modal-body modal-body-scroll">
                <div className="form-group"><label>Bug Title</label><input name="title" defaultValue={editingBug?.title} required placeholder="Short summary of the issue" /></div>
                <div className="form-group"><label>Steps to Reproduce / Description</label><textarea name="description" defaultValue={editingBug?.description} rows={5} placeholder="Provide details on how to trigger the bug..." /></div>
                <div className="form-row">
                  <div className="form-group"><label>Severity</label>
                    <select name="severity" defaultValue={editingBug?.severity || 'Medium'}>
                      <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Status</label>
                    <select name="status" defaultValue={editingBug?.status || 'Active'}>
                      <option>Active</option>
                      <option>Under development</option>
                      <option>In Progress</option>
                      <option>Resolved</option>
                      <option>Closed</option>
                    </select>
                  </div>
                </div>
                <div className="form-group"><label>Assign to Developer</label><input name="assignedTo" defaultValue={editingBug?.assignedTo} placeholder="Developer name" /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Bug Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default Bugs;