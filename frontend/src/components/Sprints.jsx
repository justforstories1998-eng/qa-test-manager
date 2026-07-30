import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api';
import { toast } from 'react-toastify';
import { FiClock, FiPlus, FiCalendar, FiCheckCircle, FiEdit2, FiTrash2, FiX, FiUsers, FiBarChart2, FiTarget, FiSearch, FiFilter } from 'react-icons/fi';

const STATUS_STYLE = {
  Active: { color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  Completed: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  Planned: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
};

const SPRINT_STATUS = ['Planned', 'Active', 'Completed'];

const TABS = ['Planning', 'Taskboard', 'Task Breakdown', 'Capacity', 'Burndown', 'Burnup', 'CFD', 'Velocity'];

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
  const [cfdData, setCfdData] = useState([]);
  const [velocityData, setVelocityData] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [newMember, setNewMember] = useState({ assignee: '', capacityPerDay: 8, activities: '' });
  const [backlogItems, setBacklogItems] = useState([]);
  const [planningSearch, setPlanningSearch] = useState('');
  const [planningTypeFilter, setPlanningTypeFilter] = useState('');

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
      const [itemsRes, capRes, burndownRes, cfdRes] = await Promise.all([
        api.getWorkItems(projectId, { sprintId: sprint._id }),
        api.getSprintCapacity(sprint._id),
        api.getBurndown(sprint._id),
        api.getCfd(sprint._id),
      ]);
      if (itemsRes.success) setWorkItems(itemsRes.data);
      if (capRes.success) setCapacityData(capRes.data);
      if (burndownRes.success) setBurndownData(burndownRes.data);
      if (cfdRes.success) setCfdData(cfdRes.data);
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
    const loadBacklog = async () => {
      try {
        const res = await api.getWorkItems(projectId);
        if (res.success) setBacklogItems(res.data || []);
      } catch { /* ignore */ }
    };
    loadBacklog();
  }, [activeSprintDetail, loadSprintDetail, projectId]);

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
      color: 'var(--text-muted)',
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
      background: 'var(--surface-secondary)',
      border: '1px solid var(--border-color)',
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
      color: 'var(--text-muted)',
      marginTop: '4px',
      lineHeight: '1.4',
    },
    dateRange: {
      fontSize: '12px',
      color: 'var(--text-muted)',
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
      background: 'var(--surface-glass-hover)',
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
      color: 'var(--text-muted)',
    },
    buttonGroup: {
      display: 'flex',
      gap: '6px',
      marginTop: '12px',
    },
    actionBtn: {
      padding: '5px 12px',
      borderRadius: '6px',
      border: '1px solid var(--border-color)',
      background: 'var(--surface-tertiary)',
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
      background: 'var(--surface-overlay)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modal: {
      background: 'var(--surface-elevated)',
      border: '1px solid var(--border-color)',
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
      color: 'var(--text-primary)',
      margin: '0 0 20px 0',
    },
    formGroup: {
      marginBottom: '16px',
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '600',
      color: 'var(--text-primary)',
      marginBottom: '6px',
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      background: 'var(--surface-tertiary)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      color: 'var(--text-primary, #f1f5f9)',
      fontSize: '14px',
      outline: 'none',
      boxSizing: 'border-box',
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      background: 'var(--surface-tertiary)',
      border: '1px solid var(--border-color)',
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
      border: '1px solid var(--border-color)',
      background: 'var(--surface-tertiary)',
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
      color: 'var(--text-secondary)',
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
      background: 'var(--surface-secondary)',
      borderRadius: '10px',
      padding: '4px',
      width: 'fit-content',
    },
    tab: {
      padding: '8px 18px',
      borderRadius: '8px',
      border: 'none',
      background: 'transparent',
      color: 'var(--text-muted)',
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
      color: 'var(--text-muted)',
      borderBottom: '1px solid var(--border-color)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    td: {
      padding: '10px 14px',
      fontSize: '14px',
      color: 'var(--text-primary, #f1f5f9)',
      borderBottom: '1px solid var(--border-color)',
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
      background: 'var(--surface-tertiary)',
      border: '1px solid var(--border-color)',
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
      background: 'var(--surface-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: '10px',
    },
    summaryLabel: {
      fontSize: '12px',
      color: 'var(--text-muted)',
      marginBottom: '4px',
    },
    summaryValue: {
      fontSize: '22px',
      fontWeight: '700',
      color: 'var(--text-primary, #f1f5f9)',
    },
    chartContainer: {
      background: 'var(--surface-secondary)',
      border: '1px solid var(--border-color)',
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
      background: 'var(--surface-overlay)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1100,
    },
    confirmModal: {
      background: 'var(--surface-elevated)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      padding: '24px',
      width: '360px',
      textAlign: 'center',
    },
    confirmText: {
      fontSize: '15px',
      color: 'var(--text-primary)',
      marginBottom: '20px',
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: 'var(--text-muted)',
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
          e.currentTarget.style.borderColor = 'var(--border-color)';
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

  const handleAssignToSprint = async (itemId) => {
    if (!activeSprintDetail) return;
    try {
      await api.updateWorkItem(itemId, { sprintId: activeSprintDetail._id });
      const res = await api.getWorkItems(projectId, { sprintId: activeSprintDetail._id });
      if (res.success) setWorkItems(res.data);
      const allRes = await api.getWorkItems(projectId);
      if (allRes.success) setBacklogItems(allRes.data || []);
      toast.success('Item added to sprint');
    } catch { toast.error('Failed to add item'); }
  };

  const handleRemoveFromSprint = async (itemId) => {
    try {
      await api.updateWorkItem(itemId, { sprintId: null });
      const res = await api.getWorkItems(projectId, { sprintId: activeSprintDetail._id });
      if (res.success) setWorkItems(res.data);
      const allRes = await api.getWorkItems(projectId);
      if (allRes.success) setBacklogItems(allRes.data || []);
      toast.success('Item removed from sprint');
    } catch { toast.error('Failed to remove item'); }
  };

  const renderPlanning = () => {
    if (!activeSprintDetail) return null;
    const sprintItemIds = new Set(workItems.map(i => i._id));
    const backlogOnly = backlogItems.filter(i => !sprintItemIds.has(i._id));
    const filtered = backlogOnly.filter(i => {
      const matchSearch = !planningSearch || i.title.toLowerCase().includes(planningSearch.toLowerCase()) || (`WI-${i.workItemId}`).toLowerCase().includes(planningSearch.toLowerCase());
      const matchType = !planningTypeFilter || i.type === planningTypeFilter;
      return matchSearch && matchType;
    });
    const sprintPoints = workItems.reduce((s, i) => s + (i.storyPoints || 0), 0);
    const capacity = capacityData.reduce((s, c) => s + (c.capacityPerDay || 8) * 10, 0);
    return (
      <div style={{ display: 'flex', gap: 16, height: '100%' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>Backlog ({filtered.length} items, {filtered.reduce((s, i) => s + (i.storyPoints || 0), 0)} pts)</h3>
            <div style={{ flex: 1 }} />
            <div style={{ position: 'relative' }}>
              <input placeholder="Search..." value={planningSearch} onChange={e => setPlanningSearch(e.target.value)} style={{ padding: '6px 10px 6px 30px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-secondary)', color: 'var(--text-primary, #f1f5f9)', fontSize: 12, width: 160, outline: 'none' }} />
              <FiSearch size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
            <select value={planningTypeFilter} onChange={e => setPlanningTypeFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-secondary)', color: 'var(--text-primary, #f1f5f9)', fontSize: 12, outline: 'none', cursor: 'pointer' }}>
              <option value="">All Types</option>
              {['Epic', 'Feature', 'User Story', 'Task', 'Bug', 'Issue', 'Test Case'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No backlog items to add</div>}
            {filtered.map(item => (
              <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'var(--surface-secondary)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'border-color 0.15s' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', minWidth: 50 }}>WI-{item.workItemId}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary, #f1f5f9)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, background: 'rgba(99,102,241,0.12)', color: '#a5b4fc' }}>{item.type}</span>
                {item.storyPoints > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{item.storyPoints} pts</span>}
                <button onClick={() => handleAssignToSprint(item._id)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>+ Add</button>
              </div>
            ))}
          </div>
        </div>
        <div style={{ width: 260, flexShrink: 0 }}>
          <div style={{ padding: 16, borderRadius: 12, background: 'var(--surface-secondary)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>Sprint Summary</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Items', value: workItems.length },
                { label: 'Points', value: `${sprintPoints} pts` },
                { label: 'Capacity', value: capacity > 0 ? `${capacity} hrs` : 'Not set' },
                { label: 'Team', value: `${capacityData.length} members` },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary, #f1f5f9)' }}>{s.value}</span>
                </div>
              ))}
            </div>
            {capacity > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary, #f1f5f9)' }}>{Math.min(100, Math.round((sprintPoints / capacity) * 100))}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--border-color)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${Math.min(100, (sprintPoints / capacity) * 100)}%`, background: 'linear-gradient(90deg, #6366f1, #7c3aed)', transition: 'width 0.3s' }} />
                </div>
              </div>
            )}
            <h4 style={{ margin: '14px 0 8px', fontSize: 12, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>In Sprint ({workItems.length})</h4>
            <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {workItems.map(item => (
                <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, background: 'var(--surface-tertiary)', fontSize: 11 }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-muted)', minWidth: 40 }}>WI-{item.workItemId}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary, #f1f5f9)' }}>{item.title}</span>
                  <button onClick={() => handleRemoveFromSprint(item._id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2, fontSize: 12 }}>×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TASKBOARD_COLUMNS = ['To Do', 'In Progress', 'Done'];

  const renderTaskboard = () => {
    if (workItems.length === 0) {
      return (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📋</div>
          <p>No work items in this sprint yet.</p>
        </div>
      );
    }
    const handleDragStart = (e, item) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', item._id);
      e.currentTarget.style.opacity = '0.5';
    };
    const handleDragEnd = (e) => { e.currentTarget.style.opacity = '1'; };
    const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
    const handleDrop = async (e, newStatus) => {
      e.preventDefault();
      const itemId = e.dataTransfer.getData('text/plain');
      if (!itemId) return;
      try {
        await api.updateWorkItem(itemId, { status: newStatus });
        setWorkItems(prev => prev.map(i => i._id === itemId ? { ...i, status: newStatus } : i));
      } catch { /* ignore */ }
    };
    const parents = [...new Set(workItems.filter(i => i.parentId).map(i => i.parentId))];
    const parentItems = parents.map(id => workItems.find(i => i._id === id)).filter(Boolean);
    const orphans = workItems.filter(i => !i.parentId);
    const swimlanes = [...parentItems, ...orphans.filter(o => !parentItems.some(p => p._id !== o._id))];
    const seen = new Set();
    const uniqueSwimlanes = [];
    for (const s of swimlanes) { if (!seen.has(s._id)) { seen.add(s._id); uniqueSwimlanes.push(s); } }

    return (
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 12, minWidth: 700 }}>
          {TASKBOARD_COLUMNS.map(col => {
            const colItems = workItems.filter(i => i.status === col);
            return (
              <div key={col} onDragOver={handleDragOver} onDrop={e => handleDrop(e, col)} style={{ flex: 1, minWidth: 200, background: 'var(--surface-secondary)', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{col}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '2px 8px', borderRadius: 6 }}>{colItems.length}</span>
                </div>
                <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 80 }}>
                  {colItems.map(item => (
                    <div key={item._id} draggable onDragStart={e => handleDragStart(e, item)} onDragEnd={handleDragEnd} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'grab', transition: 'all 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{item.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                        <span style={{ padding: '1px 6px', borderRadius: 4, background: item.type === 'Bug' ? 'rgba(239,68,68,0.1)' : item.type === 'Task' ? 'rgba(251,191,36,0.1)' : 'rgba(99,102,241,0.1)', color: item.type === 'Bug' ? '#ef4444' : item.type === 'Task' ? '#f59e0b' : '#6366f1', fontWeight: 600 }}>{item.type}</span>
                        {item.storyPoints > 0 && <span>{item.storyPoints} SP</span>}
                        {item.assignee && <span style={{ marginLeft: 'auto' }}>{item.assignee}</span>}
                      </div>
                    </div>
                  ))}
                  {colItems.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px 12px', color: 'var(--text-muted)', fontSize: 12, border: '2px dashed var(--border-color)', borderRadius: 8 }}>Drop items here</div>
                  )}
                </div>
              </div>
            );
          })}
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
          <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
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
                  stroke="var(--border-color)"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="var(--text-muted)"
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
                fill="var(--text-muted)"
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
            stroke="var(--border-medium)"
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
              stroke="var(--border-color)"
              strokeWidth="2"
            >
              <title>{`${d.date}: ${d.remainingPoints} pts remaining`}</title>
            </circle>
          ))}

          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            fill="var(--text-muted)"
            fontSize="12"
          >
            Date
          </text>

          <text
            x={15}
            y={height / 2}
            textAnchor="middle"
            fill="var(--text-muted)"
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
            stroke="var(--border-color)"
            strokeWidth="1"
          />
          <line
            x1={padding.left}
            y1={padding.top + chartH}
            x2={padding.left + chartW}
            y2={padding.top + chartH}
            stroke="var(--border-color)"
            strokeWidth="1"
          />
        </svg>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '12px', fontSize: '12px' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-block', width: '20px', height: '2px', background: 'rgba(255,255,255,0.25)', marginRight: '6px', verticalAlign: 'middle', borderTop: '2px dashed rgba(255,255,255,0.25)' }} />
            Ideal
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-block', width: '20px', height: '3px', background: '#6366f1', marginRight: '6px', verticalAlign: 'middle', borderRadius: '2px' }} />
            Actual
          </span>
        </div>
      </div>
    );
  };

  const handleGenerateCFD = async () => {
    if (!activeSprintDetail) return;
    try {
      const res = await api.generateCFD(activeSprintDetail._id, projectId);
      if (res.success) setCfdData(res.data);
    } catch { /* ignore */ }
  };

  const renderBurnup = () => {
    if (burndownData.length === 0) {
      return (
        <div>
          <div style={styles.chartActions}>
            <button style={styles.addBtn} onClick={handleGenerateBurndown}>Generate Burnup</button>
          </div>
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📈</div>
            <p>No data. Click "Generate Burnup" to create it.</p>
          </div>
        </div>
      );
    }
    const width = 700, height = 350;
    const padding = { top: 30, right: 30, bottom: 50, left: 60 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const maxY = Math.max(...burndownData.map(d => d.totalPoints), 1);
    const maxX = burndownData.length - 1;
    const xScale = (i) => padding.left + (i / Math.max(1, maxX)) * chartW;
    const yScale = (v) => padding.top + chartH - (v / maxY) * chartH;
    const scopePath = burndownData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.totalPoints)}`).join(' ');
    const completedPath = burndownData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.completedPoints)}`).join(' ');
    return (
      <div>
        <div style={styles.chartActions}>
          <button style={styles.addBtn} onClick={handleGenerateBurndown}>Regenerate</button>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: width }}>
          {[0, 0.25, 0.5, 0.75, 1].map(f => (
            <g key={f}>
              <line x1={padding.left} y1={yScale(maxY * f)} x2={width - padding.right} y2={yScale(maxY * f)} stroke="var(--border-color)" strokeDasharray="4 4" />
              <text x={padding.left - 10} y={yScale(maxY * f) + 4} textAnchor="end" fill="var(--text-muted)" fontSize={10}>{Math.round(maxY * f)}</text>
            </g>
          ))}
          <path d={scopePath} fill="none" stroke="#f59e0b" strokeWidth={2.5} />
          <path d={completedPath} fill="none" stroke="#34d399" strokeWidth={2.5} />
          {burndownData.map((d, i) => (
            <g key={i}>
              <circle cx={xScale(i)} cy={yScale(d.totalPoints)} r={4} fill="#f59e0b" />
              <circle cx={xScale(i)} cy={yScale(d.completedPoints)} r={4} fill="#34d399" />
            </g>
          ))}
          {burndownData.filter((_, i) => i % Math.max(1, Math.floor(maxX / 8)) === 0 || i === maxX).map((d, i) => (
            <text key={i} x={xScale(burndownData.indexOf(d))} y={height - 10} textAnchor="middle" fill="var(--text-muted)" fontSize={9}>
              {new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </text>
          ))}
        </svg>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            <span style={{ display: 'inline-block', width: 20, height: 3, background: '#f59e0b', marginRight: 6, verticalAlign: 'middle', borderRadius: 2 }} />
            Scope (Total)
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            <span style={{ display: 'inline-block', width: 20, height: 3, background: '#34d399', marginRight: 6, verticalAlign: 'middle', borderRadius: 2 }} />
            Completed
          </span>
        </div>
      </div>
    );
  };

  const renderCFD = () => {
    if (cfdData.length === 0) {
      return (
        <div>
          <div style={styles.chartActions}>
            <button style={styles.addBtn} onClick={handleGenerateCFD}>Generate CFD</button>
          </div>
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📊</div>
            <p>No CFD data. Click "Generate CFD" to create it.</p>
          </div>
        </div>
      );
    }
    const width = 700, height = 350;
    const padding = { top: 30, right: 30, bottom: 50, left: 60 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const maxY = Math.max(...cfdData.map(d => d.totalCount), 1);
    const maxX = cfdData.length - 1;
    const xScale = (i) => padding.left + (i / Math.max(1, maxX)) * chartW;
    const yScale = (v) => padding.top + chartH - (v / maxY) * chartH;

    const layers = [
      { key: 'closedCount', color: '#34d399', label: 'Done' },
      { key: 'resolvedCount', color: '#a78bfa', label: 'Review' },
      { key: 'activeCount', color: '#fbbf24', label: 'In Progress' },
      { key: 'newCount', color: '#60a5fa', label: 'To Do' },
    ];

    return (
      <div>
        <div style={styles.chartActions}>
          <button style={styles.addBtn} onClick={handleGenerateCFD}>Regenerate</button>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: width }}>
          {[0, 0.25, 0.5, 0.75, 1].map(f => (
            <g key={f}>
              <line x1={padding.left} y1={yScale(maxY * f)} x2={width - padding.right} y2={yScale(maxY * f)} stroke="var(--border-color)" strokeDasharray="4 4" />
              <text x={padding.left - 10} y={yScale(maxY * f) + 4} textAnchor="end" fill="var(--text-muted)" fontSize={10}>{Math.round(maxY * f)}</text>
            </g>
          ))}
          {layers.map((layer, li) => {
            let cumulative = cfdData.map((d, i) => {
              let sum = 0;
              for (let j = li; j < layers.length; j++) sum += d[layers[j].key] || 0;
              return sum;
            });
            const path = cumulative.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(v)}`).join(' ');
            const areaPath = path + ` L ${xScale(maxX)} ${yScale(0)} L ${xScale(0)} ${yScale(0)} Z`;
            return (
              <g key={layer.key}>
                <path d={areaPath} fill={layer.color} fillOpacity={0.25} />
                <path d={path} fill="none" stroke={layer.color} strokeWidth={2} />
              </g>
            );
          })}
          {cfdData.filter((_, i) => i % Math.max(1, Math.floor(maxX / 8)) === 0 || i === maxX).map((d, i) => (
            <text key={i} x={xScale(cfdData.indexOf(d))} y={height - 10} textAnchor="middle" fill="var(--text-muted)" fontSize={9}>
              {new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </text>
          ))}
        </svg>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
          {layers.map(l => (
            <span key={l.key} style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              <span style={{ display: 'inline-block', width: 20, height: 3, background: l.color, marginRight: 6, verticalAlign: 'middle', borderRadius: 2 }} />
              {l.label}
            </span>
          ))}
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
                  stroke="var(--border-color)"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="var(--text-muted)"
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
                  fill="var(--text-primary)"
                  fontSize="12"
                  fontWeight="600"
                >
                  {d.velocity}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={height - padding.bottom + 16}
                  textAnchor="middle"
                  fill="var(--text-muted)"
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
            stroke="var(--border-color)"
            strokeWidth="1"
          />
          <line
            x1={padding.left}
            y1={padding.top + chartH}
            x2={padding.left + chartW}
            y2={padding.top + chartH}
            stroke="var(--border-color)"
            strokeWidth="1"
          />

          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            fill="var(--text-muted)"
            fontSize="12"
          >
            Sprint
          </text>
          <text
            x={15}
            y={height / 2}
            textAnchor="middle"
            fill="var(--text-muted)"
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

        {activeTab === 'Planning' && renderPlanning()}
        {activeTab === 'Taskboard' && renderTaskboard()}
        {activeTab === 'Task Breakdown' && renderTaskBreakdown()}
        {activeTab === 'Capacity' && renderCapacity()}
        {activeTab === 'Burndown' && renderBurndown()}
        {activeTab === 'Burnup' && renderBurnup()}
        {activeTab === 'CFD' && renderCFD()}
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
