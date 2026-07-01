import React, { useState, useEffect } from 'react';
import {
  FiUsers, FiPlus, FiEdit2, FiTrash2, FiKey, FiBriefcase,
  FiMail, FiUser, FiX, FiSearch, FiCheck, FiAlertCircle
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../api';
import { Modal, ConfirmDialog } from './shared/Modal';
import Badge from './shared/Badge';

function Admin({ projects }) {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmReset, setConfirmReset] = useState(null);

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
    try {
      await api.deleteUser(userId);
      toast.success('User deleted successfully');
      setConfirmDelete(null);
      loadUsers();
    } catch (err) {
      toast.error(err.error || 'Failed to delete user');
    }
  };

  const handleResetPassword = async (userId) => {
    try {
      const res = await api.resetPassword(userId);
      if (res.success) {
        toast.success('Password reset successfully');
        setConfirmReset(null);
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
    <div className="dg-page">
      <div className="dg-page-header">
        <div>
          <h2 className="dg-page-title">Administration</h2>
          <p style={{ color: '#a3acb9', margin: '4px 0 0 0', fontSize: '14px' }}>Manage users and project assignments</p>
        </div>
      </div>

      <div className="dg-tabs" style={{ marginBottom: '24px' }}>
        <button 
          className={`dg-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <FiUsers size={16} /> User Management
        </button>
        <button 
          className={`dg-tab ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          <FiBriefcase size={16} /> Project Assignment
        </button>
      </div>

      {activeTab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
            <div className="dg-search" style={{ flex: 1, maxWidth: '400px' }}>
              <FiSearch size={16} style={{ color: '#a3acb9', position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '38px' }}
              />
            </div>
            <button className="dg-btn dg-btn-primary" onClick={() => { setSelectedUser(null); setUserForm({ firstName: '', lastName: '', email: '', role: 'user' }); setShowUserModal(true); }}>
              <FiPlus size={16} /> Add User
            </button>
          </div>

          <div className="dg-table-wrapper">
            <table className="dg-table">
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
                        <div style={{ 
                          width: '34px', height: '34px', borderRadius: '10px', 
                          background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: 600, color: 'var(--dg-accent)'
                        }}>
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--dg-text)' }}>{user.firstName} {user.lastName}</span>
                      </div>
                    </td>
                    <td style={{ color: '#6c7a89' }}>{user.email}</td>
                    <td>
                      <Badge>{user.role}</Badge>
                    </td>
                    <td>
                      <Badge variant={user.isActive ? 'Active' : 'Inactive'}>{user.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td style={{ color: '#6c7a89' }}>{user.assignedProjects?.length || 0} projects</td>
                    <td style={{ color: '#a3acb9' }}>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button 
                          className="dg-btn dg-btn-ghost"
                          title="Edit User"
                          style={{ padding: '6px', minWidth: 'auto' }}
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
                          <FiEdit2 size={15} />
                        </button>
                        <button 
                          className="dg-btn dg-btn-ghost"
                          title="Reset Password"
                          style={{ padding: '6px', minWidth: 'auto', color: '#f59e0b' }}
                          onClick={() => setConfirmReset(user)}
                        >
                          <FiKey size={15} />
                        </button>
                        <button 
                          className="dg-btn dg-btn-ghost"
                          title="Delete User"
                          style={{ padding: '6px', minWidth: 'auto', color: '#ef4444' }}
                          onClick={() => setConfirmDelete(user)}
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="7">
                      <div className="dg-empty" style={{ padding: '40px 20px' }}>
                        <FiUsers size={40} style={{ color: '#a3acb9' }} />
                        <p>No users found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
            <div className="dg-search" style={{ flex: 1, maxWidth: '400px' }}>
              <FiSearch size={16} style={{ color: '#a3acb9', position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search projects..."
                value={projectSearchQuery}
                onChange={(e) => setProjectSearchQuery(e.target.value)}
                style={{ paddingLeft: '38px' }}
              />
            </div>
            <button className="dg-btn dg-btn-primary" onClick={() => { setAssignForm({ projectId: projects[0]?._id || '', userIds: [] }); setShowAssignModal(true); }}>
              <FiBriefcase size={16} /> Assign Project
            </button>
          </div>

          <div className="dg-table-wrapper">
            <table className="dg-table">
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
                      <td style={{ fontWeight: 600, color: 'var(--dg-text)' }}>{project.name}</td>
                      <td style={{ color: '#6c7a89' }}>{project.description || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {projectUsers.length > 0 ? (
                            projectUsers.slice(0, 3).map(u => (
                              <span key={u._id} className="dg-badge dg-badge-indigo" style={{ fontSize: '11px' }}>
                                {u.firstName} {u.lastName}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: '#a3acb9', fontSize: '12px' }}>No users assigned</span>
                          )}
                          {projectUsers.length > 3 && (
                            <span className="dg-badge dg-badge-gray" style={{ fontSize: '11px' }}>+{projectUsers.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td style={{ color: '#a3acb9' }}>{new Date(project.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button 
                          className="dg-btn dg-btn-secondary"
                          style={{ padding: '5px 12px', fontSize: '12px' }}
                          onClick={() => {
                            setAssignForm({ projectId: project._id || project.id, userIds: [] });
                            setShowAssignModal(true);
                          }}
                        >
                          <FiPlus size={14} /> Assign Users
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredProjects.length === 0 && (
                  <tr>
                    <td colSpan="5">
                      <div className="dg-empty" style={{ padding: '40px 20px' }}>
                        <FiBriefcase size={40} style={{ color: '#a3acb9' }} />
                        <p>No projects found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Create/Edit Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => { setShowUserModal(false); setSelectedUser(null); }}
        title={selectedUser ? 'Edit User' : 'Create New User'}
        footer={
          <>
            <button className="dg-btn dg-btn-secondary" onClick={() => { setShowUserModal(false); setSelectedUser(null); }}>
              Cancel
            </button>
            <button className="dg-btn dg-btn-primary" onClick={selectedUser ? handleUpdateUser : handleCreateUser} disabled={isSaving}>
              {isSaving ? 'Saving...' : (selectedUser ? 'Update User' : 'Create User')}
            </button>
          </>
        }
      >
        <form onSubmit={selectedUser ? handleUpdateUser : handleCreateUser}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="dg-input-group">
              <label className="dg-input-label">First Name *</label>
              <input
                type="text"
                className="dg-input"
                value={userForm.firstName}
                onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                required
                placeholder="Enter first name"
              />
            </div>
            <div className="dg-input-group">
              <label className="dg-input-label">Last Name *</label>
              <input
                type="text"
                className="dg-input"
                value={userForm.lastName}
                onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                required
                placeholder="Enter last name"
              />
            </div>
          </div>
          <div className="dg-input-group" style={{ marginBottom: '16px' }}>
            <label className="dg-input-label">Email Address *</label>
            <input
              type="email"
              className="dg-input"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              required
              placeholder="Enter email address"
              disabled={!!selectedUser}
            />
          </div>
          <div className="dg-input-group" style={{ marginBottom: '16px' }}>
            <label className="dg-input-label">Role</label>
            <select
              className="dg-select"
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
            >
              <option value="user">User</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          {selectedUser && (
            <div className="dg-input-group" style={{ marginBottom: '16px' }}>
              <label className="dg-toggle" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={userForm.isActive !== false}
                  onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
                />
                <span className="dg-toggle-slider"></span>
                <span className="dg-input-label" style={{ margin: 0 }}>Account Active</span>
              </label>
            </div>
          )}
          {!selectedUser && (
            <div style={{ 
              padding: '12px 16px', borderRadius: '10px', 
              background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)',
              display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#6c7a89'
            }}>
              <FiAlertCircle size={16} style={{ color: 'var(--dg-accent)', flexShrink: 0, marginTop: '2px' }} />
              <span>A temporary password will be generated and emailed to the user. They must change it on first login.</span>
            </div>
          )}
        </form>
      </Modal>

      {/* Project Assignment Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Project to Users"
        size="lg"
        footer={
          <>
            <button className="dg-btn dg-btn-secondary" onClick={() => setShowAssignModal(false)}>
              Cancel
            </button>
            <button 
              className="dg-btn dg-btn-primary" 
              onClick={handleAssignProject} 
              disabled={isSaving || !assignForm.projectId || assignForm.userIds.length === 0}
            >
              {isSaving ? 'Assigning...' : `Assign ${assignForm.userIds.length} User(s)`}
            </button>
          </>
        }
      >
        <form onSubmit={handleAssignProject}>
          <div className="dg-input-group" style={{ marginBottom: '20px' }}>
            <label className="dg-input-label">Select Project *</label>
            <select
              className="dg-select"
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
          <div className="dg-input-group">
            <label className="dg-input-label">Select Users to Assign *</label>
            <div style={{ 
              maxHeight: '300px', overflowY: 'auto', borderRadius: '10px', 
              border: '1px solid #e7e8ed', background: '#f5f5f9'
            }}>
              {users.filter(u => u.role === 'user').map(user => (
                <div 
                  key={user._id || user.id}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                    cursor: 'pointer', borderBottom: '1px solid #e7e8ed',
                    background: assignForm.userIds.includes(user._id || user.id) ? 'rgba(139,92,246,0.06)' : 'transparent',
                    transition: 'all 0.15s'
                  }}
                  onClick={() => toggleUserSelection(user._id || user.id)}
                >
                  <div style={{ 
                    width: '32px', height: '32px', borderRadius: '8px', 
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 600, color: 'var(--dg-accent)', flexShrink: 0
                  }}>
                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--dg-text)', fontSize: '13px' }}>{user.firstName} {user.lastName}</div>
                    <div style={{ color: '#a3acb9', fontSize: '12px' }}>{user.email}</div>
                  </div>
                  <div>
                    {assignForm.userIds.includes(user._id || user.id) ? (
                      <div style={{ 
                        width: '22px', height: '22px', borderRadius: '6px', 
                        background: 'var(--dg-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <FiCheck size={14} style={{ color: '#fff' }} />
                      </div>
                    ) : (
                      <div style={{ 
                        width: '22px', height: '22px', borderRadius: '6px', 
                        border: '2px solid #e7e8ed'
                      }}></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {assignForm.userIds.length > 0 && (
            <div style={{ 
              marginTop: '14px', padding: '12px 16px', borderRadius: '10px', 
              background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)',
              display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#6c7a89'
            }}>
              <FiMail size={16} style={{ color: '#3b82f6' }} />
              <span>Email notifications will be sent to {assignForm.userIds.length} user(s) with project details.</span>
            </div>
          )}
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => handleDeleteUser(confirmDelete?.id || confirmDelete?._id)}
        title="Delete User"
        message={`Are you sure you want to delete ${confirmDelete?.firstName} ${confirmDelete?.lastName}? This action cannot be undone.`}
        confirmLabel="Delete"
        danger={true}
      />

      {/* Confirm Reset Password Dialog */}
      <ConfirmDialog
        isOpen={!!confirmReset}
        onClose={() => setConfirmReset(null)}
        onConfirm={() => handleResetPassword(confirmReset?.id || confirmReset?._id)}
        title="Reset Password"
        message={`Reset ${confirmReset?.firstName} ${confirmReset?.lastName}'s password? A new temporary password will be generated and emailed to them.`}
        confirmLabel="Reset Password"
        danger={false}
      />
    </div>
  );
}

export default Admin;
