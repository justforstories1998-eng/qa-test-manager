import React, { useState, useEffect } from 'react';
import {
  FiUsers, FiPlus, FiEdit2, FiTrash2, FiKey, FiBriefcase,
  FiMail, FiUser, FiX, FiSearch, FiCheck, FiAlertCircle
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../api';

function Admin({ projects }) {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');

  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'user'
  });

  const [assignForm, setAssignForm] = useState({
    projectId: '',
    userIds: []
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await api.getUsers();
      if (res.success) setUsers(res.data);
    } catch (err) {
      toast.error('Failed to load users');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.createUser(userForm);
      if (res.success) {
        toast.success(`User created successfully!${res.emailSent ? ' Welcome email sent.' : ''}`);
        if (res.tempPassword) {
          toast.info(`Temporary Password: ${res.tempPassword}`, { autoClose: 10000 });
        }
        setShowUserModal(false);
        setUserForm({ firstName: '', lastName: '', email: '', role: 'user' });
        loadUsers();
      }
    } catch (err) {
      toast.error(err.error || 'Failed to create user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.updateUser(selectedUser.id || selectedUser._id, userForm);
      if (res.success) {
        toast.success('User updated successfully');
        setShowUserModal(false);
        setSelectedUser(null);
        loadUsers();
      }
    } catch (err) {
      toast.error(err.error || 'Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.deleteUser(userId);
      toast.success('User deleted successfully');
      loadUsers();
    } catch (err) {
      toast.error(err.error || 'Failed to delete user');
    }
  };

  const handleResetPassword = async (userId) => {
    if (!window.confirm('Reset this user\'s password? A new temporary password will be generated.')) return;
    try {
      const res = await api.resetPassword(userId);
      if (res.success) {
        toast.success('Password reset successfully');
        if (res.tempPassword) {
          toast.info(`New Temporary Password: ${res.tempPassword}`, { autoClose: 10000 });
        }
      }
    } catch (err) {
      toast.error(err.error || 'Failed to reset password');
    }
  };

  const handleAssignProject = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.assignProject(assignForm.projectId, assignForm.userIds);
      if (res.success) {
        toast.success(res.message);
        setShowAssignModal(false);
        setAssignForm({ projectId: '', userIds: [] });
        loadUsers();
      }
    } catch (err) {
      toast.error(err.error || 'Failed to assign project');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleUserSelection = (userId) => {
    setAssignForm(prev => ({
      ...prev,
      userIds: prev.userIds.includes(userId)
        ? prev.userIds.filter(id => id !== userId)
        : [...prev.userIds, userId]
    }));
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  const filteredProjects = projects.filter(p => 
    p.name?.toLowerCase().includes(projectSearchQuery.toLowerCase())
  );

  return (
    <div className="admin-page">
      <div className="page-header responsive">
        <div className="header-content">
          <h2 className="section-title">Administration</h2>
          <p className="section-subtitle">Manage users and project assignments</p>
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <FiUsers size={16} /> User Management
        </button>
        <button 
          className={`admin-tab ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          <FiBriefcase size={16} /> Project Assignment
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="admin-content">
          <div className="admin-toolbar">
            <div className="search-box">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={() => { setSelectedUser(null); setUserForm({ firstName: '', lastName: '', email: '', role: 'user' }); setShowUserModal(true); }}>
              <FiPlus /> Add User
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Projects</th>
                  <th>Last Login</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id || user._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="user-avatar">
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600 }}>{user.firstName} {user.lastName}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role === 'admin' ? 'Administrator' : 'User'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-indicator ${user.isActive ? 'active' : 'inactive'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{user.assignedProjects?.length || 0} projects</td>
                    <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
                    <td className="actions-cell">
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          className="action-btn"
                          title="Edit User"
                          onClick={() => {
                            setSelectedUser(user);
                            setUserForm({
                              firstName: user.firstName,
                              lastName: user.lastName,
                              email: user.email,
                              role: user.role,
                              isActive: user.isActive
                            });
                            setShowUserModal(true);
                          }}
                        >
                          <FiEdit2 />
                        </button>
                        <button 
                          className="action-btn"
                          title="Reset Password"
                          onClick={() => handleResetPassword(user.id || user._id)}
                        >
                          <FiKey />
                        </button>
                        <button 
                          className="action-btn danger"
                          title="Delete User"
                          onClick={() => handleDeleteUser(user.id || user._id)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="admin-content">
          <div className="admin-toolbar">
            <div className="search-box">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search projects..."
                value={projectSearchQuery}
                onChange={(e) => setProjectSearchQuery(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={() => { setAssignForm({ projectId: projects[0]?._id || '', userIds: [] }); setShowAssignModal(true); }}>
              <FiBriefcase /> Assign Project
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Description</th>
                  <th>Assigned Users</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map(project => {
                  const projectUsers = users.filter(u => 
                    u.assignedProjects?.some(pId => (pId._id || pId) === (project._id || project.id))
                  );
                  return (
                    <tr key={project._id || project.id}>
                      <td style={{ fontWeight: 600 }}>{project.name}</td>
                      <td>{project.description || '-'}</td>
                      <td>
                        <div className="assigned-users-chips">
                          {projectUsers.length > 0 ? (
                            projectUsers.slice(0, 3).map(u => (
                              <span key={u._id} className="user-chip">
                                {u.firstName} {u.lastName}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>No users assigned</span>
                          )}
                          {projectUsers.length > 3 && (
                            <span className="user-chip more">+{projectUsers.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td>{new Date(project.createdAt).toLocaleDateString()}</td>
                      <td className="actions-cell">
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            setAssignForm({ projectId: project._id || project.id, userIds: [] });
                            setShowAssignModal(true);
                          }}
                        >
                          <FiPlus /> Assign Users
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{selectedUser ? 'Edit User' : 'Create New User'}</h3>
              <button onClick={() => { setShowUserModal(false); setSelectedUser(null); }}><FiX /></button>
            </div>
            <form onSubmit={selectedUser ? handleUpdateUser : handleCreateUser}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      type="text"
                      value={userForm.firstName}
                      onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                      required
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      value={userForm.lastName}
                      onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                      required
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    required
                    placeholder="Enter email address"
                    disabled={!!selectedUser}
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  >
                    <option value="user">User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                {selectedUser && (
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={userForm.isActive !== false}
                        onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
                      />
                      {' '}Account Active
                    </label>
                  </div>
                )}
                {!selectedUser && (
                  <div className="info-box">
                    <FiAlertCircle size={16} />
                    <span>A temporary password will be generated and emailed to the user. They must change it on first login.</span>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowUserModal(false); setSelectedUser(null); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : (selectedUser ? 'Update User' : 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header">
              <h3>Assign Project to Users</h3>
              <button onClick={() => setShowAssignModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleAssignProject}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Project *</label>
                  <select
                    value={assignForm.projectId}
                    onChange={(e) => setAssignForm({ ...assignForm, projectId: e.target.value })}
                    required
                  >
                    <option value="">Select a project...</option>
                    {projects.map(p => (
                      <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Select Users to Assign *</label>
                  <div className="user-selection-list">
                    {users.filter(u => u.role === 'user').map(user => (
                      <div 
                        key={user._id || user.id}
                        className={`user-selection-item ${assignForm.userIds.includes(user._id || user.id) ? 'selected' : ''}`}
                        onClick={() => toggleUserSelection(user._id || user.id)}
                      >
                        <div className="user-avatar-small">
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </div>
                        <div className="user-info">
                          <div className="user-name">{user.firstName} {user.lastName}</div>
                          <div className="user-email">{user.email}</div>
                        </div>
                        <div className="user-check">
                          {assignForm.userIds.includes(user._id || user.id) ? (
                            <FiCheck size={18} className="check-icon" />
                          ) : (
                            <div className="check-box"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {assignForm.userIds.length > 0 && (
                  <div className="info-box">
                    <FiMail size={16} />
                    <span>Email notifications will be sent to {assignForm.userIds.length} user(s) with project details.</span>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving || !assignForm.projectId || assignForm.userIds.length === 0}>
                  {isSaving ? 'Assigning...' : `Assign ${assignForm.userIds.length} User(s)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
