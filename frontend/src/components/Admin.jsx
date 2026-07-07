import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FiUsers, FiPlus, FiEdit2, FiTrash2, FiKey, FiBriefcase,
  FiMail, FiUser, FiX, FiSearch, FiCheck, FiAlertCircle,
  FiShield, FiChevronRight, FiEye, FiUserPlus, FiLock,
  FiCalendar, FiActivity, FiHash, FiInfo, FiCheckCircle,
  FiAlertTriangle, FiFolder, FiArrowRight, FiRefreshCw,
  FiToggleLeft, FiToggleRight, FiClock, FiExternalLink
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../api';
import { Modal, ConfirmDialog } from './shared/Modal';
import Badge from './shared/Badge';

/* ═══════════ micro-components ═══════════ */

const MetricCard = ({ icon: Icon, label, value, color }) => (
  <div style={{
    position: 'relative', padding: '16px 18px', borderRadius: 12,
    background: 'var(--card-bg)', border: '1px solid var(--card-border)',
    overflow: 'hidden', transition: 'all 0.2s', flex: 1, minWidth: 0,
  }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}40`; e.currentTarget.style.boxShadow = `0 4px 16px ${color}10`; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-border)'; e.currentTarget.style.boxShadow = 'none'; }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, ${color}00)` }} />
    <div style={{
      width: 32, height: 32, borderRadius: 8, marginBottom: 10,
      background: `${color}15`, border: `1px solid ${color}25`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={15} style={{ color }} />
    </div>
    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.5px' }}>{value}</div>
    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, fontWeight: 500 }}>{label}</div>
  </div>
);

const RoleBadge = ({ role }) => {
  const isAdmin = role === 'admin';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
      color: isAdmin ? '#a78bfa' : 'var(--accent-color)',
      background: isAdmin ? 'var(--badge-admin-bg)' : 'var(--badge-user-bg)',
      border: `1px solid ${isAdmin ? 'var(--badge-admin-border)' : 'var(--badge-user-border)'}`,
      whiteSpace: 'nowrap', lineHeight: 1, textTransform: 'capitalize',
    }}>
      {isAdmin ? <FiShield size={10} /> : <FiUser size={10} />}
      {role}
    </span>
  );
};

const StatusBadge = ({ active }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
    color: active ? '#22c55e' : '#94a3b8',
    background: active ? 'var(--badge-active-bg)' : 'var(--badge-inactive-bg)',
    border: `1px solid ${active ? 'var(--badge-active-border)' : 'var(--badge-inactive-border)'}`,
    whiteSpace: 'nowrap', lineHeight: 1,
  }}>
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? '#22c55e' : '#94a3b8', flexShrink: 0 }} />
    {active ? 'Active' : 'Inactive'}
  </span>
);

/* shared input style factory */
const inputStyles = {
  base: {
    width: '100%', padding: '10px 14px', borderRadius: 9, boxSizing: 'border-box',
    border: '1px solid var(--input-border)',
    background: 'var(--input-bg)',
    color: 'var(--text-primary)',
    fontSize: 14, outline: 'none', fontFamily: 'inherit', transition: 'all 0.2s',
  },
  focus: (e) => { e.target.style.borderColor = 'var(--accent-color)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; },
  blur: (e) => { e.target.style.borderColor = 'var(--input-border)'; e.target.style.boxShadow = 'none'; },
};

/* ═══════════ main component ═══════════ */

function Admin({ projects = [] }) {
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
  const [hoveredRow, setHoveredRow] = useState(null);

  const [userForm, setUserForm] = useState({ firstName: '', lastName: '', email: '', role: 'user', isActive: true });
  const [assignForm, setAssignForm] = useState({ projectId: '', userIds: [] });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const res = await api.getUsers();
      if (res.success) setUsers(res.data);
    } catch { toast.error('Failed to load users'); }
  };

  /* ── CRUD ── */
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.createUser(userForm);
      if (res.success) {
        toast.success(`User created${res.emailSent ? ' — welcome email sent' : ''}`);
        if (res.tempPassword) toast.info(`Temp password: ${res.tempPassword}`, { autoClose: 10000 });
        setShowUserModal(false);
        setUserForm({ firstName: '', lastName: '', email: '', role: 'user', isActive: true });
        loadUsers();
      }
    } catch (err) { toast.error(err.error || 'Failed to create user'); }
    finally { setIsSaving(false); }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.updateUser(selectedUser.id || selectedUser._id, userForm);
      if (res.success) {
        toast.success('User updated');
        setShowUserModal(false);
        setSelectedUser(null);
        loadUsers();
      }
    } catch (err) { toast.error(err.error || 'Failed to update'); }
    finally { setIsSaving(false); }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.deleteUser(userId);
      toast.success('User deleted');
      setConfirmDelete(null);
      loadUsers();
    } catch (err) { toast.error(err.error || 'Failed to delete'); }
  };

  const handleResetPassword = async (userId) => {
    try {
      const res = await api.resetPassword(userId);
      if (res.success) {
        toast.success('Password reset');
        setConfirmReset(null);
        if (res.tempPassword) toast.info(`New temp password: ${res.tempPassword}`, { autoClose: 10000 });
      }
    } catch (err) { toast.error(err.error || 'Failed to reset'); }
  };

  const handleAssignProject = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.assignProject(assignForm.projectId, assignForm.userIds);
      if (res.success) {
        toast.success(res.message || 'Project assigned');
        setShowAssignModal(false);
        setAssignForm({ projectId: '', userIds: [] });
        loadUsers();
      }
    } catch (err) { toast.error(err.error || 'Failed to assign'); }
    finally { setIsSaving(false); }
  };

  const toggleUserSelection = (userId) => {
    setAssignForm(prev => ({
      ...prev,
      userIds: prev.userIds.includes(userId)
        ? prev.userIds.filter(id => id !== userId)
        : [...prev.userIds, userId],
    }));
  };

  /* ── derived ── */
  const filteredUsers = useMemo(() =>
    users.filter(u => {
      const q = searchQuery.toLowerCase();
      return u.firstName?.toLowerCase().includes(q) || u.lastName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    }),
  [users, searchQuery]);

  const filteredProjects = useMemo(() =>
    projects.filter(p => p.name?.toLowerCase().includes(projectSearchQuery.toLowerCase())),
  [projects, projectSearchQuery]);

  const metrics = useMemo(() => ({
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    active: users.filter(u => u.isActive !== false).length,
    projects: projects.length,
  }), [users, projects]);

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <div className="dg-page admin-page" style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%', overflow: 'auto' }}>

      {/* ── Header ── */}
      <div style={{ padding: '28px 32px 24px', borderBottom: '1px solid var(--card-border)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11,
              background: 'var(--accent-badge-bg)',
              border: '1px solid var(--accent-badge-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FiShield size={19} style={{ color: 'var(--accent-color)' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                Administration
              </h1>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                Manage users, roles, and project assignments
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 32px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Metrics ── */}
        <div style={{ display: 'flex', gap: 14 }}>
          <MetricCard icon={FiUsers}     label="Total Users"   value={metrics.total}    color="#818cf8" />
          <MetricCard icon={FiShield}    label="Admins"        value={metrics.admins}    color="#a78bfa" />
          <MetricCard icon={FiActivity}  label="Active Users"  value={metrics.active}    color="#22c55e" />
          <MetricCard icon={FiBriefcase} label="Projects"      value={metrics.projects}  color="#f59e0b" />
        </div>

        {/* ── Tabs ── */}
        <div style={{
          display: 'flex', gap: 4, padding: 4, borderRadius: 10,
          background: 'var(--tab-bg)', border: '1px solid var(--card-border)',
        }}>
          {[
            { key: 'users', label: 'User Management', icon: FiUsers, count: users.length },
            { key: 'projects', label: 'Project Assignment', icon: FiBriefcase, count: projects.length },
          ].map(tab => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '10px 16px', borderRadius: 7, fontSize: 13, fontWeight: isActive ? 600 : 500,
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  background: isActive ? 'var(--tab-active-bg)' : 'transparent',
                  color: isActive ? 'var(--accent-color)' : 'var(--text-muted)',
                  boxShadow: isActive ? 'var(--tab-active-shadow)' : 'none',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--tab-hover-bg)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon size={14} />
                {tab.label}
                <span style={{
                  padding: '1px 7px', borderRadius: 5, fontSize: 10, fontWeight: 700,
                  background: isActive ? 'var(--accent-glow)' : 'var(--badge-count-bg)',
                  color: isActive ? 'var(--accent-color)' : 'var(--text-muted)',
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ════════════ USERS TAB ════════════ */}
        {activeTab === 'users' && (
          <>
            {/* Toolbar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 16px', borderRadius: 10,
              background: 'var(--card-bg)', border: '1px solid var(--card-border)',
            }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
                <FiSearch size={14} style={{
                  position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search users…"
                  style={{ ...inputStyles.base, paddingLeft: 34 }}
                  onFocus={inputStyles.focus}
                  onBlur={inputStyles.blur}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'var(--badge-count-bg)', border: 'none',
                      color: 'var(--text-muted)', cursor: 'pointer',
                      padding: '2px 5px', borderRadius: 4, display: 'flex',
                    }}
                  >
                    <FiX size={12} />
                  </button>
                )}
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontSize: 12, color: 'var(--text-muted)', padding: '6px 12px', borderRadius: 6,
                  background: 'var(--tab-bg)', border: '1px solid var(--card-border)',
                }}>
                  <span style={{ color: 'var(--accent-color)', fontWeight: 600 }}>{filteredUsers.length}</span> results
                </span>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setUserForm({ firstName: '', lastName: '', email: '', role: 'user', isActive: true });
                    setShowUserModal(true);
                  }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                    background: 'var(--btn-primary-bg)', border: 'none', color: '#fff', cursor: 'pointer',
                    boxShadow: 'var(--btn-primary-shadow)', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--btn-primary-hover-shadow)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--btn-primary-shadow)'; }}
                >
                  <FiUserPlus size={15} /> Add User
                </button>
              </div>
            </div>

            {/* Users table */}
            <div style={{ borderRadius: 12, border: '1px solid var(--card-border)', overflow: 'hidden' }}>
              {filteredUsers.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 13 }}>
                  <thead>
                    <tr>
                      {['User', 'Email', 'Role', 'Status', 'Projects', 'Last Login', ''].map((h, i) => (
                        <th key={i} style={{
                          padding: '11px 16px', textAlign: h ? 'left' : 'right',
                          fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
                          textTransform: 'uppercase', letterSpacing: '0.8px',
                          borderBottom: '1px solid var(--card-border)',
                          background: 'var(--table-header-bg)', position: 'sticky', top: 0, zIndex: 5,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, idx) => {
                      const uid = u._id || u.id;
                      const isHovered = hoveredRow === uid;
                      return (
                        <tr
                          key={uid}
                          onMouseEnter={() => setHoveredRow(uid)}
                          onMouseLeave={() => setHoveredRow(null)}
                          style={{
                            background: isHovered ? 'var(--table-row-hover)' : 'transparent',
                            transition: 'background 0.15s',
                          }}
                        >
                          <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--table-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                                background: 'var(--avatar-bg)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 12, fontWeight: 700, color: 'var(--accent-color)',
                              }}>
                                {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                              </div>
                              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                {u.firstName} {u.lastName}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--table-border)', color: 'var(--text-secondary)', fontSize: 13 }}>
                            {u.email}
                          </td>
                          <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--table-border)' }}>
                            <RoleBadge role={u.role} />
                          </td>
                          <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--table-border)' }}>
                            <StatusBadge active={u.isActive !== false} />
                          </td>
                          <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--table-border)', color: 'var(--text-secondary)', fontSize: 12 }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600,
                              background: 'var(--badge-count-bg)', color: 'var(--text-muted)',
                            }}>
                              {u.assignedProjects?.length || 0}
                            </span>
                          </td>
                          <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--table-border)', color: 'var(--text-muted)', fontSize: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <FiClock size={11} />
                              {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                            </div>
                          </td>
                          <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--table-border)', textAlign: 'right' }}>
                            <div style={{
                              display: 'flex', gap: 4, justifyContent: 'flex-end',
                              opacity: isHovered ? 1 : 0, transition: 'opacity 0.15s',
                            }}>
                              {[
                                { icon: FiEdit2, title: 'Edit', color: 'var(--accent-color)', hoverBg: 'var(--accent-glow)', onClick: () => { setSelectedUser(u); setUserForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, role: u.role, isActive: u.isActive }); setShowUserModal(true); } },
                                { icon: FiKey, title: 'Reset Password', color: '#f59e0b', hoverBg: 'rgba(245,158,11,0.08)', onClick: () => setConfirmReset(u) },
                                { icon: FiTrash2, title: 'Delete', color: '#ef4444', hoverBg: 'rgba(239,68,68,0.08)', onClick: () => setConfirmDelete(u) },
                              ].map((btn, i) => {
                                const Icon = btn.icon;
                                return (
                                  <button
                                    key={i}
                                    title={btn.title}
                                    onClick={btn.onClick}
                                    style={{
                                      background: 'var(--btn-ghost-bg)', border: '1px solid var(--btn-ghost-border)',
                                      borderRadius: 6, padding: '5px 7px', cursor: 'pointer',
                                      color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                                      transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.color = btn.color; e.currentTarget.style.borderColor = `${btn.color}40`; e.currentTarget.style.background = btn.hoverBg; }}
                                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--btn-ghost-border)'; e.currentTarget.style.background = 'var(--btn-ghost-bg)'; }}
                                  >
                                    <Icon size={13} />
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '60px 40px', textAlign: 'center',
                }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 18, marginBottom: 16,
                    background: 'var(--accent-badge-bg)', border: '1px solid var(--accent-badge-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FiUsers size={28} style={{ color: 'var(--accent-color)', opacity: 0.5 }} />
                  </div>
                  <h3 style={{ color: 'var(--text-secondary)', margin: '0 0 6px', fontSize: 15, fontWeight: 600 }}>No users found</h3>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 13 }}>
                    {searchQuery ? 'Try a different search term.' : 'Add your first team member to get started.'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ════════════ PROJECTS TAB ════════════ */}
        {activeTab === 'projects' && (
          <>
            {/* Toolbar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 16px', borderRadius: 10,
              background: 'var(--card-bg)', border: '1px solid var(--card-border)',
            }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
                <FiSearch size={14} style={{
                  position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                  value={projectSearchQuery}
                  onChange={e => setProjectSearchQuery(e.target.value)}
                  placeholder="Search projects…"
                  style={{ ...inputStyles.base, paddingLeft: 34 }}
                  onFocus={inputStyles.focus}
                  onBlur={inputStyles.blur}
                />
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <button
                  onClick={() => { setAssignForm({ projectId: projects[0]?._id || '', userIds: [] }); setShowAssignModal(true); }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                    background: 'var(--btn-primary-bg)', border: 'none', color: '#fff', cursor: 'pointer',
                    boxShadow: 'var(--btn-primary-shadow)', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <FiBriefcase size={14} /> Assign Project
                </button>
              </div>
            </div>

            {/* Projects table */}
            <div style={{ borderRadius: 12, border: '1px solid var(--card-border)', overflow: 'hidden' }}>
              {filteredProjects.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 13 }}>
                  <thead>
                    <tr>
                      {['Project', 'Description', 'Assigned Users', 'Created', ''].map((h, i) => (
                        <th key={i} style={{
                          padding: '11px 16px', textAlign: h ? 'left' : 'right',
                          fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
                          textTransform: 'uppercase', letterSpacing: '0.8px',
                          borderBottom: '1px solid var(--card-border)',
                          background: 'var(--table-header-bg)',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project, idx) => {
                      const pid = project._id || project.id;
                      const isHovered = hoveredRow === pid;
                      const projectUsers = users.filter(u =>
                        u.assignedProjects?.some(pId => (pId._id || pId) === pid)
                      );
                      return (
                        <tr
                          key={pid}
                          onMouseEnter={() => setHoveredRow(pid)}
                          onMouseLeave={() => setHoveredRow(null)}
                          style={{
                            background: isHovered ? 'var(--table-row-hover)' : 'transparent',
                            transition: 'background 0.15s',
                          }}
                        >
                          <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--table-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                background: 'var(--avatar-bg)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <FiFolder size={14} style={{ color: 'var(--accent-color)' }} />
                              </div>
                              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{project.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--table-border)', color: 'var(--text-muted)', fontSize: 12, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {project.description || '—'}
                          </td>
                          <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--table-border)' }}>
                            {projectUsers.length > 0 ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                                {/* Avatar stack */}
                                <div style={{ display: 'flex', marginRight: 4 }}>
                                  {projectUsers.slice(0, 4).map((u, i) => (
                                    <div key={u._id || u.id} style={{
                                      width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                                      background: 'var(--avatar-bg)',
                                      border: '2px solid var(--card-bg)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: 9, fontWeight: 700, color: 'var(--accent-color)',
                                      marginLeft: i > 0 ? -8 : 0, zIndex: 4 - i,
                                    }}>
                                      {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                                    </div>
                                  ))}
                                  {projectUsers.length > 4 && (
                                    <div style={{
                                      width: 26, height: 26, borderRadius: 7,
                                      background: 'var(--badge-count-bg)',
                                      border: '2px solid var(--card-bg)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: 9, fontWeight: 700, color: 'var(--text-muted)',
                                      marginLeft: -8,
                                    }}>
                                      +{projectUsers.length - 4}
                                    </div>
                                  )}
                                </div>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                  {projectUsers.length} member{projectUsers.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: 11, fontStyle: 'italic' }}>No members</span>
                            )}
                          </td>
                          <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--table-border)', color: 'var(--text-muted)', fontSize: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <FiCalendar size={11} />
                              {new Date(project.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--table-border)', textAlign: 'right' }}>
                            <button
                              onClick={() => { setAssignForm({ projectId: pid, userIds: [] }); setShowAssignModal(true); }}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                                background: 'var(--accent-glow)', border: '1px solid var(--accent-badge-border)',
                                color: 'var(--accent-color)', cursor: 'pointer', transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-badge-bg)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-glow)'; }}
                            >
                              <FiUserPlus size={12} /> Assign
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '60px 40px', textAlign: 'center',
                }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 18, marginBottom: 16,
                    background: 'var(--accent-badge-bg)', border: '1px solid var(--accent-badge-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FiBriefcase size={28} style={{ color: 'var(--accent-color)', opacity: 0.5 }} />
                  </div>
                  <h3 style={{ color: 'var(--text-secondary)', margin: '0 0 6px', fontSize: 15, fontWeight: 600 }}>No projects found</h3>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 13 }}>
                    {projectSearchQuery ? 'Try a different search term.' : 'No projects available.'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ═══════════ USER MODAL ═══════════ */}
      <Modal
        isOpen={showUserModal}
        onClose={() => { setShowUserModal(false); setSelectedUser(null); }}
        title={null}
        size="md"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              onClick={() => { setShowUserModal(false); setSelectedUser(null); }}
              style={{
                padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 500,
                background: 'var(--btn-ghost-bg)', border: '1px solid var(--btn-ghost-border)',
                color: 'var(--text-secondary)', cursor: 'pointer',
              }}
            >Cancel</button>
            <button
              type="submit" form="user-form" disabled={isSaving}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 20px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                background: isSaving ? 'var(--btn-disabled-bg)' : 'var(--btn-primary-bg)',
                border: 'none', color: '#fff', cursor: isSaving ? 'not-allowed' : 'pointer',
                boxShadow: isSaving ? 'none' : 'var(--btn-primary-shadow)',
              }}
            >
              {isSaving ? (
                <><span className="admin-spinner" /> Saving…</>
              ) : (
                <><FiCheck size={14} /> {selectedUser ? 'Update User' : 'Create User'}</>
              )}
            </button>
          </div>
        }
      >
        <form id="user-form" onSubmit={selectedUser ? handleUpdateUser : handleCreateUser}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: 'var(--accent-badge-bg)', border: '1px solid var(--accent-badge-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {selectedUser ? <FiEdit2 size={16} style={{ color: 'var(--accent-color)' }} /> : <FiUserPlus size={16} style={{ color: 'var(--accent-color)' }} />}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedUser ? 'Edit User' : 'Create New User'}
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  {selectedUser ? 'Update account details.' : 'Add a new team member to the system.'}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                  First Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={userForm.firstName}
                  onChange={e => setUserForm(p => ({ ...p, firstName: e.target.value }))}
                  required placeholder="First name"
                  style={inputStyles.base}
                  onFocus={inputStyles.focus} onBlur={inputStyles.blur}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Last Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={userForm.lastName}
                  onChange={e => setUserForm(p => ({ ...p, lastName: e.target.value }))}
                  required placeholder="Last name"
                  style={inputStyles.base}
                  onFocus={inputStyles.focus} onBlur={inputStyles.blur}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                Email <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email"
                value={userForm.email}
                onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))}
                required placeholder="email@example.com"
                disabled={!!selectedUser}
                style={{ ...inputStyles.base, ...(selectedUser ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
                onFocus={inputStyles.focus} onBlur={inputStyles.blur}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                Role
              </label>
              <select
                value={userForm.role}
                onChange={e => setUserForm(p => ({ ...p, role: e.target.value }))}
                style={{ ...inputStyles.base, cursor: 'pointer', appearance: 'none' }}
              >
                <option value="user">User</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            {selectedUser && (
              <div
                onClick={() => setUserForm(p => ({ ...p, isActive: !p.isActive }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 9, cursor: 'pointer',
                  background: 'var(--tab-bg)', border: '1px solid var(--card-border)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-color)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-border)'; }}
              >
                {userForm.isActive !== false ? (
                  <FiToggleRight size={22} style={{ color: '#22c55e', flexShrink: 0 }} />
                ) : (
                  <FiToggleLeft size={22} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Account Status</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                    {userForm.isActive !== false ? 'Active — user can log in' : 'Inactive — access disabled'}
                  </div>
                </div>
              </div>
            )}

            {!selectedUser && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 14px', borderRadius: 9,
                background: 'var(--accent-glow)', border: '1px solid var(--accent-badge-border)',
              }}>
                <FiInfo size={14} style={{ color: 'var(--accent-color)', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  A temporary password will be generated and emailed to the user. They must change it on first login.
                </span>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* ═══════════ ASSIGN PROJECT MODAL ═══════════ */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={null}
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              onClick={() => setShowAssignModal(false)}
              style={{
                padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 500,
                background: 'var(--btn-ghost-bg)', border: '1px solid var(--btn-ghost-border)',
                color: 'var(--text-secondary)', cursor: 'pointer',
              }}
            >Cancel</button>
            <button
              onClick={handleAssignProject}
              disabled={isSaving || !assignForm.projectId || assignForm.userIds.length === 0}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 20px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                background: (!assignForm.projectId || assignForm.userIds.length === 0) ? 'var(--btn-disabled-bg)' : 'var(--btn-primary-bg)',
                border: 'none', color: '#fff',
                cursor: (!assignForm.projectId || assignForm.userIds.length === 0) ? 'not-allowed' : 'pointer',
                opacity: (!assignForm.projectId || assignForm.userIds.length === 0) ? 0.5 : 1,
                boxShadow: 'var(--btn-primary-shadow)',
              }}
            >
              <FiCheck size={14} /> Assign {assignForm.userIds.length} User{assignForm.userIds.length !== 1 ? 's' : ''}
            </button>
          </div>
        }
      >
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FiBriefcase size={16} style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Assign Project</h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Select a project and choose team members.</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
              Project <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={assignForm.projectId}
              onChange={e => setAssignForm(p => ({ ...p, projectId: e.target.value }))}
              required
              style={{ ...inputStyles.base, cursor: 'pointer', appearance: 'none' }}
            >
              <option value="">Select a project…</option>
              {projects.map(p => (
                <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
              Team Members <span style={{ color: '#ef4444' }}>*</span>
              {assignForm.userIds.length > 0 && (
                <span style={{
                  marginLeft: 8, padding: '1px 7px', borderRadius: 5, fontSize: 10, fontWeight: 700,
                  background: 'var(--accent-glow)', color: 'var(--accent-color)',
                }}>
                  {assignForm.userIds.length} selected
                </span>
              )}
            </label>
            <div style={{
              maxHeight: 260, overflowY: 'auto', borderRadius: 10,
              border: '1px solid var(--card-border)', background: 'var(--tab-bg)',
            }}>
              {users.filter(u => u.role === 'user').map(u => {
                const uid = u._id || u.id;
                const isSelected = assignForm.userIds.includes(uid);
                return (
                  <div
                    key={uid}
                    onClick={() => toggleUserSelection(uid)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', cursor: 'pointer',
                      borderBottom: '1px solid var(--table-border)',
                      background: isSelected ? 'var(--accent-glow)' : 'transparent',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--table-row-hover)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      background: 'var(--avatar-bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: 'var(--accent-color)',
                    }}>
                      {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{u.firstName} {u.lastName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                    </div>
                    <div style={{
                      width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isSelected ? 'var(--accent-color)' : 'transparent',
                      border: isSelected ? 'none' : '2px solid var(--card-border)',
                      transition: 'all 0.15s',
                    }}>
                      {isSelected && <FiCheck size={13} style={{ color: '#fff' }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {assignForm.userIds.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '10px 14px', borderRadius: 9,
              background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)',
            }}>
              <FiMail size={14} style={{ color: '#3b82f6', flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Email notifications will be sent to {assignForm.userIds.length} user{assignForm.userIds.length !== 1 ? 's' : ''} with project access details.
              </span>
            </div>
          )}
        </div>
      </Modal>

      {/* ═══════════ CONFIRM DIALOGS ═══════════ */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete User"
        message={
          <div>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 10px', fontSize: 14 }}>
              Delete <strong style={{ color: 'var(--text-primary)' }}>{confirmDelete?.firstName} {confirmDelete?.lastName}</strong>?
            </p>
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px',
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8,
            }}>
              <FiAlertTriangle size={14} style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }} />
              <span style={{ color: '#f87171', fontSize: 13, lineHeight: 1.5 }}>
                This action cannot be undone. All associated data will be permanently removed.
              </span>
            </div>
          </div>
        }
        confirmLabel="Delete User"
        danger
        onConfirm={() => handleDeleteUser(confirmDelete?.id || confirmDelete?._id)}
      />

      <ConfirmDialog
        isOpen={!!confirmReset}
        onClose={() => setConfirmReset(null)}
        title="Reset Password"
        message={
          <div>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 10px', fontSize: 14 }}>
              Reset the password for <strong style={{ color: 'var(--text-primary)' }}>{confirmReset?.firstName} {confirmReset?.lastName}</strong>?
            </p>
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px',
              background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8,
            }}>
              <FiKey size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
              <span style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}>
                A new temporary password will be generated and emailed to the user.
              </span>
            </div>
          </div>
        }
        confirmLabel="Reset Password"
        danger={false}
        onConfirm={() => handleResetPassword(confirmReset?.id || confirmReset?._id)}
      />

      {/* ── Theme-aware CSS variables ── */}
      <style>{`
        .admin-page {
          /* ── Semantic tokens that flip with theme ── */
          --card-bg: rgba(255,255,255,0.02);
          --card-border: rgba(255,255,255,0.06);
          --tab-bg: rgba(255,255,255,0.02);
          --tab-active-bg: rgba(99,102,241,0.12);
          --tab-active-shadow: 0 1px 3px rgba(0,0,0,0.1);
          --tab-hover-bg: rgba(255,255,255,0.04);
          --table-header-bg: rgba(255,255,255,0.02);
          --table-border: rgba(255,255,255,0.04);
          --table-row-hover: rgba(99,102,241,0.04);
          --input-bg: rgba(255,255,255,0.03);
          --input-border: rgba(255,255,255,0.08);
          --text-primary: #f1f5f9;
          --text-secondary: rgba(203,213,225,0.8);
          --text-muted: rgba(148,163,184,0.5);
          --accent-color: #818cf8;
          --accent-glow: rgba(99,102,241,0.08);
          --accent-badge-bg: rgba(99,102,241,0.12);
          --accent-badge-border: rgba(99,102,241,0.2);
          --avatar-bg: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1));
          --badge-admin-bg: rgba(167,139,250,0.12);
          --badge-admin-border: rgba(167,139,250,0.25);
          --badge-user-bg: rgba(99,102,241,0.12);
          --badge-user-border: rgba(99,102,241,0.25);
          --badge-active-bg: rgba(34,197,94,0.1);
          --badge-active-border: rgba(34,197,94,0.2);
          --badge-inactive-bg: rgba(148,163,184,0.08);
          --badge-inactive-border: rgba(148,163,184,0.15);
          --badge-count-bg: rgba(255,255,255,0.05);
          --btn-primary-bg: linear-gradient(135deg, #6366f1, #7c3aed);
          --btn-primary-shadow: 0 2px 12px rgba(99,102,241,0.3);
          --btn-primary-hover-shadow: 0 4px 20px rgba(99,102,241,0.45);
          --btn-disabled-bg: rgba(99,102,241,0.4);
          --btn-ghost-bg: rgba(255,255,255,0.04);
          --btn-ghost-border: rgba(255,255,255,0.06);
        }

        [data-theme="light"] .admin-page {
          --card-bg: #ffffff;
          --card-border: #e2e8f0;
          --tab-bg: #f8fafc;
          --tab-active-bg: #ffffff;
          --tab-active-shadow: 0 1px 4px rgba(0,0,0,0.06);
          --tab-hover-bg: #f1f5f9;
          --table-header-bg: #f8fafc;
          --table-border: #f1f5f9;
          --table-row-hover: rgba(99,102,241,0.04);
          --input-bg: #ffffff;
          --input-border: #e2e8f0;
          --text-primary: #0f172a;
          --text-secondary: #475569;
          --text-muted: #94a3b8;
          --accent-color: #6366f1;
          --accent-glow: rgba(99,102,241,0.06);
          --accent-badge-bg: rgba(99,102,241,0.08);
          --accent-badge-border: rgba(99,102,241,0.15);
          --avatar-bg: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.08));
          --badge-admin-bg: rgba(167,139,250,0.08);
          --badge-admin-border: rgba(167,139,250,0.2);
          --badge-user-bg: rgba(99,102,241,0.08);
          --badge-user-border: rgba(99,102,241,0.18);
          --badge-active-bg: rgba(34,197,94,0.08);
          --badge-active-border: rgba(34,197,94,0.15);
          --badge-inactive-bg: rgba(148,163,184,0.06);
          --badge-inactive-border: rgba(148,163,184,0.12);
          --badge-count-bg: #f1f5f9;
          --btn-primary-bg: linear-gradient(135deg, #6366f1, #7c3aed);
          --btn-primary-shadow: 0 2px 10px rgba(99,102,241,0.2);
          --btn-primary-hover-shadow: 0 4px 16px rgba(99,102,241,0.3);
          --btn-disabled-bg: #c7d2fe;
          --btn-ghost-bg: #f8fafc;
          --btn-ghost-border: #e2e8f0;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .admin-spinner {
          display: inline-block;
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default Admin;