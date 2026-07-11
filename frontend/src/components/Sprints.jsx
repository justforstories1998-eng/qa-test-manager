import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api';
import { toast } from 'react-toastify';
import { FiClock, FiPlus, FiCalendar, FiCheckCircle, FiEdit2, FiTrash2, FiX, FiUsers, FiBarChart2, FiTarget } from 'react-icons/fi';

const STATUS_STYLE = {
  Active: { color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  Completed: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  Planned: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
};

const SPRINT_STATUS = ['Planned', 'Active', 'Completed'];

const TABS = ['Task Breakdown', 'Capacity', 'Burndown', 'Velocity'];

export default function Sprints({ projectId }) {
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);
  const [activeSprintDetail, setActiveSprintDetail] = useState(null);
  const [activeTab, setActiveTab] = useState('Task Breakdown');
  const [workItems, setWorkItems] = useState([]);
  const [capacityData, setCapacityData] = useState([]);
  const [burndownData, setBurndownData] = useState([]);
  const [velocityData, setVelocityData] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [newMember, setNewMember] = useState({ assignee: '', capacityPerDay: 8, activities: '' });

  const loadSprints = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getSprints(projectId);
      if (res.success) setSprints(res.data);
    } catch (err) {
      console.error('Failed to load sprints:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadSprintDetail = useCallback(async (sprint) => {
    setActiveSprintDetail(sprint);
    setActiveTab('Task Breakdown');
    try {
      const [itemsRes, capRes, burndownRes] = await Promise.all([
        api.getWorkItems(projectId, { sprintId: sprint._id }),
        api.getSprintCapacity(sprint._id),
        api.getBurndown(sprint._id),
      ]);
      if (itemsRes.success) setWorkItems(itemsRes.data);
      if (capRes.success) setCapacityData(capRes.data);
      if (burndownRes.success) setBurndownData(burndownRes.data);
    } catch (err) {
      console.error('Failed to load sprint detail:', err);
    }
  }, [projectId]);

  const loadVelocity = useCallback(async () => {
    try {
      const res = await api.getVelocity(projectId);
      if (res.success) setVelocityData(res.data);
    } catch (err) {
      console.error('Failed to load velocity:', err);
    }
  }, [projectId]);

  useEffect(() => { loadSprints(); loadVelocity(); }, [loadSprints, loadVelocity]);

  useEffect(() => {
    if (activeSprintDetail) loadSprintDetail(activeSprintDetail);
  }, [activeSprintDetail, loadSprintDetail]);

  const handleCreateSprint = async (data) => {
    try {
      await api.createSprint({ ...data, projectId });
      setShowCreateModal(false);
      loadSprints();
    } catch (err) {
      console.error('Failed to create sprint:', err);
    }
  };

  const handleUpdateSprint = async (id, data) => {
    try {
      await api.updateSprint(id, data);
      setEditingSprint(null);
      loadSprints();
      if (activeSprintDetail && activeSprintDetail._id === id) {
        setActiveSprintDetail({ ...activeSprintDetail, ...data });
      }
    } catch (err) {
      console.error('Failed to update sprint:', err);
    }
  };

  const handleDeleteSprint = async (id) => {
    try {
      await api.deleteSprint(id);
      setConfirmDelete(null);
      if (activeSprintDetail && activeSprintDetail._id === id) {
        setActiveSprintDetail(null);
      }
      loadSprints();
    } catch (err) {
      console.error('Failed to delete sprint:', err);
    }
  };

  const handleStatusTransition = async (sprint, newStatus) => {
    try {
      await api.updateSprint(sprint._id, { status: newStatus });
      loadSprints();
      if (activeSprintDetail && activeSprintDetail._id === sprint._id) {
        setActiveSprintDetail({ ...sprint, status: newStatus });
      }
    } catch (err) {
      console.error('Failed to update sprint status:', err);
    }
  };

  const handleAddCapacity = async () => {
    if (!newMember.assignee.trim()) return;
    try {
      await api.upsertCapacity({
        sprintId: activeSprintDetail._id,
        projectId,
        assignee: newMember.assignee.trim(),
        capacityPerDay: Number(newMember.capacityPerDay),
        activities: newMember.activities.split(',').map(a => a.trim()).filter(Boolean),
      });
      setNewMember({ assignee: '', capacityPerDay: 8, activities: '' });
      const res = await api.getSprintCapacity(activeSprintDetail._id);
      if (res.success) setCapacityData(res.data);
    } catch (err) {
      console.error('Failed to add capacity:', err);
    }
  };

  const handleDeleteCapacity = async (id) => {
    try {
      await api.deleteCapacity(id);
      setCapacityData(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      console.error('Failed to delete capacity:', err);
    }
  };

  const handleGenerateBurndown = async () => {
    try {
      const res = await api.generateBurndown(activeSprintDetail._id, projectId);
      if (res.success) {
        const bdRes = await api.getBurndown(activeSprintDetail._id);
        if (bdRes.success) setBurndownData(bdRes.data);
      }
    } catch (err) {
      console.error('Failed to generate burndown:', err);
    }
  };

  const getSprintStats = (sprint) => {
    const sprintItems = sprint._workItems || [];
    const total = sprintItems.length;
    const completed = sprintItems.filter(i => i.status === 'Done' || i.status === 'Completed').length;
    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  };

  const getTotalCapacity = () => capacityData.reduce((sum, c) => {
    const days = Math.max(1, Math.ceil((new Date(activeSprintDetail.endDate) - new Date(activeSprintDetail.startDate)) / 86400000));
    return sum + (c.capacityPerDay * days);
  }, 0);

  const getTotalStoryPoints = () => workItems.reduce((sum, i) => sum + (i.storyPoints || 0), 0);

  const getNextStatus = (current) => {
    if (current === 'Planned') return 'Active';
    if (current === 'Active') return 'Completed';
    return null;
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const styles = {
    container: {
      padding: '24px',
      maxWidth: '1400px',
      margin: '0 auto',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: 'var(--text-primary, #f1f5f9)',
      margin: 0,
    },
    subtitle: {
      fontSize: '14px',
      color: 'rgba(255,255,255,0.5)',
      marginTop: '4px',
    },
    createBtn: {
      background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
      color: '#fff',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    sprintGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
      gap: '16px',
    },
    sprintCard: {
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
      borderRadius: '12px',
      padding: '20px',
      cursor: 'pointer',
      transition: 'border-color 0.2s, transform 0.2s',
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '12px',
    },
    sprintName: {
      fontSize: '16px',
      fontWeight: '600',
      color: 'var(--text-primary, #f1f5f9)',
      margin: 0,
    },
    sprintGoal: {
      fontSize: '13px',
      color: 'rgba(255,255,255,0.5)',
      marginTop: '4px',
      lineHeight: '1.4',
    },
    dateRange: {
      fontSize: '12px',
      color: 'rgba(255,255,255,0.4)',
      marginBottom: '12px',
    },
    badge: {
      padding: '3px 10px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      whiteSpace: 'nowrap',
    },
    progressBar: {
      height: '6px',
      background: 'rgba(255,255,255,0.06)',
      borderRadius: '3px',
      overflow: 'hidden',
      marginBottom: '8px',
    },
    progressFill: {
      height: '100%',
      borderRadius: '3px',
      transition: 'width 0.3s',
    },
    statRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statText: {
      fontSize: '12px',
      color: 'rgba(255,255,255,0.5)',
    },
    buttonGroup: {
      display: 'flex',
      gap: '6px',
      marginTop: '12px',
    },
    actionBtn: {
      padding: '5px 12px',
      borderRadius: '6px',
      border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
      background: 'rgba(255,255,255,0.05)',
      color: 'var(--text-primary, #f1f5f9)',
      fontSize: '12px',
      cursor: 'pointer',
    },
    dangerBtn: {
      padding: '5px 12px',
      borderRadius: '6px',
      border: '1px solid rgba(239,68,68,0.3)',
      background: 'rgba(239,68,68,0.1)',
      color: '#ef4444',
      fontSize: '12px',
      cursor: 'pointer',
    },
    modalOverlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modal: {
      background: '#1e1e2e',
      border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
      borderRadius: '16px',
      padding: '28px',
      width: '480px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      overflow: 'auto',
    },
    modalTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: 'var(--text-primary, #f1f5f9)',
      margin: '0 0 20px 0',
    },
    formGroup: {
      marginBottom: '16px',
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '600',
      color: 'rgba(255,255,255,0.7)',
      marginBottom: '6px',
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
      borderRadius: '8px',
      color: 'var(--text-primary, #f1f5f9)',
      fontSize: '14px',
      outline: 'none',
      boxSizing: 'border-box',
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
      borderRadius: '8px',
      color: 'var(--text-primary, #f1f5f9)',
      fontSize: '14px',
      outline: 'none',
      boxSizing: 'border-box',
    },
    modalActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
      marginTop: '24px',
    },
    cancelBtn: {
      padding: '8px 16px',
      borderRadius: '8px',
      border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
      background: 'rgba(255,255,255,0.05)',
      color: 'var(--text-primary, #f1f5f9)',
      fontSize: '14px',
      cursor: 'pointer',
    },
    saveBtn: {
      padding: '8px 16px',
      borderRadius: '8px',
      border: 'none',
      background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
      color: '#fff',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
    },
    detailContainer: {
      padding: '24px',
      maxWidth: '1400px',
      margin: '0 auto',
    },
    backBtn: {
      background: 'none',
      border: 'none',
      color: 'rgba(255,255,255,0.6)',
      fontSize: '14px',
      cursor: 'pointer',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    detailHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '24px',
    },
    tabsContainer: {
      display: 'flex',
      gap: '4px',
      marginBottom: '24px',
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '10px',
      padding: '4px',
      width: 'fit-content',
    },
    tab: {
      padding: '8px 18px',
      borderRadius: '8px',
      border: 'none',
      background: 'transparent',
      color: 'rgba(255,255,255,0.5)',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    tabActive: {
      background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
      color: '#fff',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    th: {
      textAlign: 'left',
      padding: '10px 14px',
      fontSize: '12px',
      fontWeight: '600',
      color: 'rgba(255,255,255,0.5)',
      borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    td: {
      padding: '10px 14px',
      fontSize: '14px',
      color: 'var(--text-primary, #f1f5f9)',
      borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))',
    },
    addRow: {
      display: 'flex',
      gap: '10px',
      marginBottom: '16px',
      alignItems: 'flex-end',
    },
    addInput: {
      flex: 1,
      padding: '8px 10px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
      borderRadius: '6px',
      color: 'var(--text-primary, #f1f5f9)',
      fontSize: '13px',
      outline: 'none',
    },
    addBtn: {
      padding: '8px 14px',
      borderRadius: '6px',
      border: 'none',
      background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
      color: '#fff',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
    },
    removeBtn: {
      padding: '4px 10px',
      borderRadius: '4px',
      border: '1px solid rgba(239,68,68,0.3)',
      background: 'rgba(239,68,68,0.1)',
      color: '#ef4444',
      fontSize: '12px',
      cursor: 'pointer',
    },
    summaryRow: {
      display: 'flex',
      gap: '24px',
      marginBottom: '20px',
    },
    summaryCard: {
      flex: 1,
      padding: '16px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
      borderRadius: '10px',
    },
    summaryLabel: {
      fontSize: '12px',
      color: 'rgba(255,255,255,0.5)',
      marginBottom: '4px',
    },
    summaryValue: {
      fontSize: '22px',
      fontWeight: '700',
      color: 'var(--text-primary, #f1f5f9)',
    },
    chartContainer: {
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
      borderRadius: '12px',
      padding: '24px',
      marginTop: '16px',
    },
    chartTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: 'var(--text-primary, #f1f5f9)',
      marginBottom: '16px',
    },
    chartActions: {
      display: 'flex',
      gap: '10px',
      marginBottom: '16px',
    },
    confirmOverlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1100,
    },
    confirmModal: {
      background: '#1e1e2e',
      border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
      borderRadius: '12px',
      padding: '24px',
      width: '360px',
      textAlign: 'center',
    },
    confirmText: {
      fontSize: '15px',
      color: 'var(--text-primary, #f1f5f9)',
      marginBottom: '20px',
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: 'rgba(255,255,255,0.4)',
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '12px',
    },
  };

  const renderSprintCard = (sprint) => {
    const stats = { total: workItems.length || 0, completed: 0, percentage: 0 };
    const st = STATUS_STYLE[sprint.status] || STATUS_STYLE.Planned;
    const next = getNextStatus(sprint.status);

    return (
      <div
        key={sprint._id}
        style={styles.sprintCard}
        onClick={() => loadSprintDetail(sprint)}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-color, rgba(255,255,255,0.06))';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={styles.cardHeader}>
          <div>
            <h3 style={styles.sprintName}>{sprint.name}</h3>
            {sprint.goal && <p style={styles.sprintGoal}>{sprint.goal}</p>}
          </div>
          <span style={{ ...styles.badge, color: st.color, background: st.bg }}>
            {sprint.status}
          </span>
        </div>
        <div style={styles.dateRange}>
          {formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}
        </div>
        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${stats.percentage}%`,
              background: st.color,
            }}
          />
        </div>
        <div style={styles.statRow}>
          <span style={styles.statText}>{stats.completed}/{stats.total} items</span>
          <span style={styles.statText}>{stats.percentage}%</span>
        </div>
        <div style={styles.buttonGroup} onClick={(e) => e.stopPropagation()}>
          {next && (
            <button
              style={styles.actionBtn}
              onClick={() => handleStatusTransition(sprint, next)}
            >
              Move to {next}
            </button>
          )}
          <button
            style={styles.actionBtn}
            onClick={() => setEditingSprint(sprint)}
          >
            Edit
          </button>
          <button
            style={styles.dangerBtn}
            onClick={() => setConfirmDelete(sprint._id)}
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  const renderCreateModal = () => {
    const [form, setForm] = useState({
      name: '',
      goal: '',
      startDate: '',
      endDate: '',
      capacity: 40,
      status: 'Planned',
    });

    const handleSubmit = () => handleCreateSprint(form);

    return (
      <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          <h2 style={styles.modalTitle}>Create Sprint</h2>
          <div style={styles.formGroup}>
            <label style={styles.label}>Sprint Name</label>
            <input
              style={styles.input}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Sprint 1"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Goal</label>
            <input
              style={styles.input}
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
              placeholder="What do you want to achieve?"
            />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ ...styles.formGroup, flex: 1 }}>
              <label style={styles.label}>Start Date</label>
              <input
                style={styles.input}
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div style={{ ...styles.formGroup, flex: 1 }}>
              <label style={styles.label}>End Date</label>
              <input
                style={styles.input}
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ ...styles.formGroup, flex: 1 }}>
              <label style={styles.label}>Capacity (hours)</label>
              <input
                style={styles.input}
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
              />
            </div>
            <div style={{ ...styles.formGroup, flex: 1 }}>
              <label style={styles.label}>Status</label>
              <select
                style={styles.select}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {SPRINT_STATUS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={styles.modalActions}>
            <button style={styles.cancelBtn} onClick={() => setShowCreateModal(false)}>Cancel</button>
            <button
              style={styles.saveBtn}
              onClick={handleSubmit}
              disabled={!form.name || !form.startDate || !form.endDate}
            >
              Create Sprint
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEditModal = () => {
    if (!editingSprint) return null;
    const [form, setForm] = useState({ ...editingSprint });

    const handleSubmit = () => handleUpdateSprint(editingSprint._id, form);

    return (
      <div style={styles.modalOverlay} onClick={() => setEditingSprint(null)}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          <h2 style={styles.modalTitle}>Edit Sprint</h2>
          <div style={styles.formGroup}>
            <label style={styles.label}>Sprint Name</label>
            <input
              style={styles.input}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Goal</label>
            <input
              style={styles.input}
              value={form.goal || ''}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ ...styles.formGroup, flex: 1 }}>
              <label style={styles.label}>Start Date</label>
              <input
                style={styles.input}
                type="date"
                value={form.startDate ? form.startDate.substring(0, 10) : ''}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div style={{ ...styles.formGroup, flex: 1 }}>
              <label style={styles.label}>End Date</label>
              <input
                style={styles.input}
                type="date"
                value={form.endDate ? form.endDate.substring(0, 10) : ''}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ ...styles.formGroup, flex: 1 }}>
              <label style={styles.label}>Capacity (hours)</label>
              <input
                style={styles.input}
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
              />
            </div>
            <div style={{ ...styles.formGroup, flex: 1 }}>
              <label style={styles.label}>Status</label>
              <select
                style={styles.select}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {SPRINT_STATUS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={styles.modalActions}>
            <button style={styles.cancelBtn} onClick={() => setEditingSprint(null)}>Cancel</button>
            <button style={styles.saveBtn} onClick={handleSubmit}>Save Changes</button>
          </div>
        </div>
      </div>
    );
  };

  const renderTaskBreakdown = () => {
    if (workItems.length === 0) {
      return (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📋</div>
          <p>No work items in this sprint yet.</p>
        </div>
      );
    }
    return (
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Task</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Story Points</th>
            <th style={styles.th}>Assignee</th>
            <th style={styles.th}>Effort (h)</th>
          </tr>
        </thead>
        <tbody>
          {workItems.map((item) => (
            <tr key={item._id}>
              <td style={styles.td}>{item.title}</td>
              <td style={styles.td}>
                <span style={{
                  ...styles.badge,
                  color: item.status === 'Done' ? '#34d399' : item.status === 'In Progress' ? '#fbbf24' : '#94a3b8',
                  background: item.status === 'Done' ? 'rgba(52,211,153,0.1)' : item.status === 'In Progress' ? 'rgba(251,191,36,0.1)' : 'rgba(148,163,184,0.1)',
                }}>
                  {item.status}
                </span>
              </td>
              <td style={styles.td}>{item.storyPoints || '-'}</td>
              <td style={styles.td}>{item.assignee || 'Unassigned'}</td>
              <td style={styles.td}>{item.effort || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderCapacity = () => {
    const totalCapacity = getTotalCapacity();
    const totalPoints = getTotalStoryPoints();
    const sprintDays = Math.max(1, Math.ceil(
      (new Date(activeSprintDetail.endDate) - new Date(activeSprintDetail.startDate)) / 86400000
    ));

    return (
      <div>
        <div style={styles.summaryRow}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Team Capacity</div>
            <div style={styles.summaryValue}>{totalCapacity}h</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Story Points</div>
            <div style={styles.summaryValue}>{totalPoints}</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Sprint Duration</div>
            <div style={styles.summaryValue}>{sprintDays} days</div>
          </div>
        </div>
        <div style={styles.addRow}>
          <input
            style={{ ...styles.addInput, flex: 2 }}
            placeholder="Assignee name"
            value={newMember.assignee}
            onChange={(e) => setNewMember({ ...newMember, assignee: e.target.value })}
          />
          <input
            style={{ ...styles.addInput, flex: 1 }}
            type="number"
            placeholder="Hours/day"
            value={newMember.capacityPerDay}
            onChange={(e) => setNewMember({ ...newMember, capacityPerDay: e.target.value })}
          />
          <input
            style={{ ...styles.addInput, flex: 2 }}
            placeholder="Activities (comma separated)"
            value={newMember.activities}
            onChange={(e) => setNewMember({ ...newMember, activities: e.target.value })}
          />
          <button style={styles.addBtn} onClick={handleAddCapacity}>Add</button>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Member</th>
              <th style={styles.th}>Capacity/Day</th>
              <th style={styles.th}>Total Hours</th>
              <th style={styles.th}>Activities</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {capacityData.map((cap) => (
              <tr key={cap._id}>
                <td style={styles.td}>{cap.assignee}</td>
                <td style={styles.td}>{cap.capacityPerDay}h</td>
                <td style={styles.td}>{cap.capacityPerDay * sprintDays}h</td>
                <td style={styles.td}>{(cap.activities || []).join(', ')}</td>
                <td style={styles.td}>
                  <button style={styles.removeBtn} onClick={() => handleDeleteCapacity(cap._id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {capacityData.length > 0 && (
          <div style={{ marginTop: '12px', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
            Total: {capacityData.reduce((sum, c) => sum + c.capacityPerDay, 0)}h/day
            ({capacityData.reduce((sum, c) => sum + c.capacityPerDay, 0) * sprintDays}h total)
          </div>
        )}
      </div>
    );
  };

  const renderBurndown = () => {
    const svgRef = useRef(null);
    const width = 700;
    const height = 350;
    const padding = { top: 30, right: 30, bottom: 50, left: 60 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    if (burndownData.length === 0) {
      return (
        <div>
          <div style={styles.chartActions}>
            <button style={styles.addBtn} onClick={handleGenerateBurndown}>Generate Burndown</button>
          </div>
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📉</div>
            <p>No burndown data. Click "Generate Burndown" to create it.</p>
          </div>
        </div>
      );
    }

    const maxY = Math.max(...burndownData.map(d => d.totalPoints), 1);
    const maxX = burndownData.length - 1;
    const xScale = (i) => padding.left + (i / Math.max(1, maxX)) * chartW;
    const yScale = (v) => padding.top + chartH - (v / maxY) * chartH;

    const idealPath = `M ${xScale(0)} ${yScale(burndownData[0]?.totalPoints || 0)} L ${xScale(maxX)} ${yScale(0)}`;
    const actualPath = burndownData.map((d, i) =>
      `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.remainingPoints)}`
    ).join(' ');

    const gridLines = 5;

    return (
      <div style={styles.chartContainer}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={styles.chartTitle}>Sprint Burndown</h3>
          <button style={styles.addBtn} onClick={handleGenerateBurndown}>Regenerate</button>
        </div>
        <svg width={width} height={height} style={{ display: 'block', margin: '0 auto' }}>
          <defs>
            <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>

          {Array.from({ length: gridLines + 1 }).map((_, i) => {
            const y = padding.top + (i / gridLines) * chartH;
            const val = Math.round(maxY - (i / gridLines) * maxY);
            return (
              <g key={`grid-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartW}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="rgba(255,255,255,0.4)"
                  fontSize="11"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {burndownData.map((d, i) => {
            const show = maxX <= 10 || i % Math.ceil(maxX / 10) === 0 || i === maxX;
            if (!show) return null;
            const dateLabel = new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return (
              <text
                key={`xlabel-${i}`}
                x={xScale(i)}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                fill="rgba(255,255,255,0.4)"
                fontSize="11"
              >
                {dateLabel}
              </text>
            );
          })}

          <path
            d={`${actualPath} L ${xScale(maxX)} ${yScale(0)} L ${xScale(0)} ${yScale(0)} Z`}
            fill="url(#actualGrad)"
          />

          <path
            d={idealPath}
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="2"
            strokeDasharray="6,4"
          />

          <path
            d={actualPath}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {burndownData.map((d, i) => (
            <circle
              key={`dot-${i}`}
              cx={xScale(i)}
              cy={yScale(d.remainingPoints)}
              r="4"
              fill="#6366f1"
              stroke="#1e1e2e"
              strokeWidth="2"
            >
              <title>{`${d.date}: ${d.remainingPoints} pts remaining`}</title>
            </circle>
          ))}

          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            fill="rgba(255,255,255,0.4)"
            fontSize="12"
          >
            Date
          </text>

          <text
            x={15}
            y={height / 2}
            textAnchor="middle"
            fill="rgba(255,255,255,0.4)"
            fontSize="12"
            transform={`rotate(-90, 15, ${height / 2})`}
          >
            Story Points
          </text>

          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + chartH}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
          <line
            x1={padding.left}
            y1={padding.top + chartH}
            x2={padding.left + chartW}
            y2={padding.top + chartH}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        </svg>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '12px', fontSize: '12px' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>
            <span style={{ display: 'inline-block', width: '20px', height: '2px', background: 'rgba(255,255,255,0.25)', marginRight: '6px', verticalAlign: 'middle', borderTop: '2px dashed rgba(255,255,255,0.25)' }} />
            Ideal
          </span>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>
            <span style={{ display: 'inline-block', width: '20px', height: '3px', background: '#6366f1', marginRight: '6px', verticalAlign: 'middle', borderRadius: '2px' }} />
            Actual
          </span>
        </div>
      </div>
    );
  };

  const renderVelocity = () => {
    const width = 700;
    const height = 300;
    const padding = { top: 30, right: 30, bottom: 60, left: 60 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const data = velocityData.slice(-6);

    if (data.length === 0) {
      return (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📊</div>
          <p>No velocity data available yet.</p>
        </div>
      );
    }

    const maxVelocity = Math.max(...data.map(d => d.velocity), 1);
    const barWidth = Math.min(60, (chartW / data.length) * 0.6);
    const barGap = (chartW - barWidth * data.length) / (data.length + 1);

    return (
      <div style={styles.chartContainer}>
        <h3 style={styles.chartTitle}>Sprint Velocity</h3>
        <svg width={width} height={height} style={{ display: 'block', margin: '0 auto' }}>
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>

          {Array.from({ length: 5 }).map((_, i) => {
            const y = padding.top + (i / 4) * chartH;
            const val = Math.round(maxVelocity - (i / 4) * maxVelocity);
            return (
              <g key={`vgrid-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartW}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="rgba(255,255,255,0.4)"
                  fontSize="11"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {data.map((d, i) => {
            const x = padding.left + barGap + i * (barWidth + barGap);
            const barH = (d.velocity / maxVelocity) * chartH;
            const y = padding.top + chartH - barH;
            const label = d.sprintName.length > 8 ? d.sprintName.substring(0, 8) + '…' : d.sprintName;

            return (
              <g key={`bar-${i}`}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  fill="url(#barGrad)"
                  rx="4"
                  ry="4"
                >
                  <title>{`${d.sprintName}: ${d.velocity} velocity`}</title>
                </rect>
                <text
                  x={x + barWidth / 2}
                  y={y - 8}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.7)"
                  fontSize="12"
                  fontWeight="600"
                >
                  {d.velocity}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={height - padding.bottom + 16}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.4)"
                  fontSize="11"
                >
                  {label}
                </text>
                {d.startDate && (
                  <text
                    x={x + barWidth / 2}
                    y={height - padding.bottom + 30}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.25)"
                    fontSize="9"
                  >
                    {new Date(d.startDate).toLocaleDateString('en-US', { month: 'short' })}
                  </text>
                )}
              </g>
            );
          })}

          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + chartH}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
          <line
            x1={padding.left}
            y1={padding.top + chartH}
            x2={padding.left + chartW}
            y2={padding.top + chartH}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />

          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            fill="rgba(255,255,255,0.4)"
            fontSize="12"
          >
            Sprint
          </text>
          <text
            x={15}
            y={height / 2}
            textAnchor="middle"
            fill="rgba(255,255,255,0.4)"
            fontSize="12"
            transform={`rotate(-90, 15, ${height / 2})`}
          >
            Velocity
          </text>
        </svg>
      </div>
    );
  };

  const renderDetailView = () => {
    if (!activeSprintDetail) return null;

    const st = STATUS_STYLE[activeSprintDetail.status] || STATUS_STYLE.Planned;

    return (
      <div style={styles.detailContainer}>
        <button style={styles.backBtn} onClick={() => setActiveSprintDetail(null)}>
          ← Back to Sprints
        </button>
        <div style={styles.detailHeader}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <h2 style={{ ...styles.title, margin: 0 }}>{activeSprintDetail.name}</h2>
              <span style={{ ...styles.badge, color: st.color, background: st.bg }}>
                {activeSprintDetail.status}
              </span>
            </div>
            {activeSprintDetail.goal && (
              <p style={{ ...styles.sprintGoal, margin: '4px 0 0 0' }}>{activeSprintDetail.goal}</p>
            )}
            <div style={styles.dateRange}>
              {formatDate(activeSprintDetail.startDate)} — {formatDate(activeSprintDetail.endDate)}
            </div>
          </div>
        </div>

        <div style={styles.summaryRow}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Work Items</div>
            <div style={styles.summaryValue}>{workItems.length}</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Story Points</div>
            <div style={styles.summaryValue}>{getTotalStoryPoints()}</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Team Members</div>
            <div style={styles.summaryValue}>{capacityData.length}</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Velocity</div>
            <div style={styles.summaryValue}>{activeSprintDetail.velocity || '-'}</div>
          </div>
        </div>

        <div style={styles.tabsContainer}>
          {TABS.map(tab => (
            <button
              key={tab}
              style={{
                ...styles.tab,
                ...(activeTab === tab ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Task Breakdown' && renderTaskBreakdown()}
        {activeTab === 'Capacity' && renderCapacity()}
        {activeTab === 'Burndown' && renderBurndown()}
        {activeTab === 'Velocity' && renderVelocity()}
      </div>
    );
  };

  if (activeSprintDetail) {
    return (
      <div style={styles.container}>
        {renderDetailView()}
        {renderEditModal()}
        {confirmDelete && (
          <div style={styles.confirmOverlay} onClick={() => setConfirmDelete(null)}>
            <div style={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
              <p style={styles.confirmText}>Are you sure you want to delete this sprint?</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button style={styles.cancelBtn} onClick={() => setConfirmDelete(null)}>Cancel</button>
                <button
                  style={{ ...styles.saveBtn, background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                  onClick={() => handleDeleteSprint(confirmDelete)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Sprints</h1>
          <p style={styles.subtitle}>{sprints.length} sprint{sprints.length !== 1 ? 's' : ''}</p>
        </div>
        <button style={styles.createBtn} onClick={() => setShowCreateModal(true)}>
          + New Sprint
        </button>
      </div>

      {loading ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>⏳</div>
          <p>Loading sprints...</p>
        </div>
      ) : sprints.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🏃</div>
          <p>No sprints yet. Create one to get started!</p>
        </div>
      ) : (
        <div style={styles.sprintGrid}>
          {sprints.map(sprint => renderSprintCard(sprint))}
        </div>
      )}

      {showCreateModal && renderCreateModal()}
      {renderEditModal()}

      {confirmDelete && (
        <div style={styles.confirmOverlay} onClick={() => setConfirmDelete(null)}>
          <div style={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <p style={styles.confirmText}>Are you sure you want to delete this sprint?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button style={styles.cancelBtn} onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button
                style={{ ...styles.saveBtn, background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                onClick={() => handleDeleteSprint(confirmDelete)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
