import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { setToastSettings } from './toast';
import { canAccessModule } from './permissions';
import './styles/main.css';

import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import TestCases from './components/TestCases';
import Execution from './components/Execution';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Bugs from './components/Bugs';
import Login from './components/Login';
import ChangePassword from './components/ChangePassword';
import Admin from './components/Admin';
import Board from './components/Board';
import WorkItems from './components/WorkItems';
import Boards from './components/Boards';
import Backlogs from './components/Backlogs';
import Sprints from './components/Sprints';

import api from './api';
import { FiPlus, FiBriefcase, FiX } from 'react-icons/fi';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [testSuites, setTestSuites] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [testRuns, setTestRuns] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [workItemStats, setWorkItemStats] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [settings, setSettings] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1100);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const handleLogin = (userData) => { setUser(userData); setIsAuthenticated(true); };
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null); setIsAuthenticated(false);
    setProjects([]); setActiveProjectId(null);
    toast.info('Logged out successfully');
  };
  const handlePasswordChanged = (updatedUser) => setUser(updatedUser);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.getProjects().then(res => {
      if (res.success && res.data.length > 0) {
        setProjects(res.data);
        setActiveProjectId(res.data[0].id || res.data[0]._id);
      }
    }).catch(err => console.error("Project fetch error", err));
    api.getSettings().then(res => { if (res.success) setSettings(res.data); }).catch(() => {});
    const handleResize = () => setSidebarCollapsed(window.innerWidth < 1100);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isAuthenticated]);

  useEffect(() => { setToastSettings(settings?.notifications); }, [settings?.notifications]);

  const refreshData = useCallback(async () => {
    if (!activeProjectId) return;
    try {
      const [suites, cases, runs, stats, wiStats, sprintsData] = await Promise.all([
        api.getTestSuites(activeProjectId), api.getTestCases(activeProjectId),
        api.getTestRuns(activeProjectId), api.getStatistics(activeProjectId),
        api.getWorkItemStats(activeProjectId), api.getSprints(activeProjectId),
      ]);
      if (suites.success) setTestSuites(suites.data);
      if (cases.success) setTestCases(cases.data);
      if (runs.success) setTestRuns(runs.data);
      if (stats.success) setStatistics(stats.data);
      if (wiStats.success) setWorkItemStats(wiStats.data);
      if (sprintsData.success) setSprints(sprintsData.data || []);
    } catch (e) { console.error("Data sync error:", e); }
  }, [activeProjectId]);

  useEffect(() => { refreshData(); }, [refreshData]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (isCreatingProject) return;
    setIsCreatingProject(true);
    try {
      const res = await api.createProject({ name: newProjectName });
      if (res.success) {
        const newProj = res.data;
        setProjects(prev => [...prev, newProj]);
        setActiveProjectId(newProj.id || newProj._id);
        setShowProjectModal(false); setNewProjectName('');
        toast.success("New Project Created");
      }
    } catch { toast.error("Error creating project"); }
    finally { setIsCreatingProject(false); }
  };

  const handleUpdateSettings = async (category, data) => {
    const res = await api.updateSettings(category, data);
    if (res.success) setSettings(res.data);
    else throw new Error(res.error || 'Settings update failed');
  };

  const handleCreateRun = async (data) => {
    try {
      const res = await api.createTestRun({ ...data, projectId: activeProjectId });
      if (res.success) { await refreshData(); return res.data; }
    } catch (err) { toast.error("Launch failed"); throw err; }
  };

  const handleUpdateExecutionResult = async (id, resultData) => {
    try {
      const res = await api.updateExecutionResult(id, resultData);
      if (res.success) { await refreshData(); return res.data; }
    } catch (err) { console.error("Sync failure", err); }
  };

  const activeProjectName = projects.find(p => (p.id || p._id) === activeProjectId)?.name || '';

  if (!isAuthenticated) {
    return (
      <div className="app">
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <ToastContainer position="bottom-right" theme="colored" autoClose={3000} />
      </div>
    );
  }

  if (user?.mustChangePassword) {
    return (
      <div className="app">
        <Routes>
          <Route path="*" element={<ChangePassword user={user} onPasswordChanged={handlePasswordChanged} />} />
        </Routes>
        <ToastContainer position="bottom-right" theme="colored" autoClose={3000} />
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Navbar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
        onLogout={handleLogout}
        isAdmin={user?.role === 'admin'}
        isMobileOpen={mobileMenuOpen}
        onToggleMobile={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      <div className={`app-content ${sidebarCollapsed ? 'app-content-collapsed' : ''}`}>
        <header className="header">
          <div className="header-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <FiBriefcase size={16} style={{ color: 'var(--text-muted)' }} />
              <select
                value={activeProjectId || ''}
                onChange={(e) => setActiveProjectId(e.target.value)}
                className="form-select"
                style={{ width: 'auto', minWidth: 180, padding: '0.375rem 2.5rem 0.375rem 0.75rem', fontSize: '0.8125rem' }}
              >
                {projects.map(p => (
                  <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>
                ))}
              </select>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowProjectModal(true)} title="Add Project">
                <FiPlus size={16} />
              </button>
            </div>
          </div>
          <div className="header-right">
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{activeProjectName}</span>
          </div>
        </header>

        <main className="main-content">
          {activeProjectId ? (
            <Routes>
              <Route path="/dashboard" element={<Dashboard statistics={statistics} testSuites={testSuites} testRuns={testRuns} workItemStats={workItemStats} sprints={sprints} onRefresh={refreshData} />} />
              <Route path="/test-cases" element={<TestCases testSuites={testSuites} testCases={testCases} settings={settings} onDeleteTestCase={id => api.deleteTestCase(id).then(res => { refreshData(); return res; })} onUploadCSV={(f, n, p) => api.uploadCSV(f, n, p || activeProjectId).then(res => { refreshData(); return res; })} />} />
              <Route path="/execution" element={<Execution testSuites={testSuites} testCases={testCases} testRuns={testRuns} settings={settings} onCreateTestRun={handleCreateRun} onDeleteTestRun={id => api.deleteTestRun(id).then(res => { refreshData(); return res; })} onUpdateExecutionResult={handleUpdateExecutionResult} onRefresh={refreshData} />} />
              <Route path="/bugs" element={<Bugs projectId={activeProjectId} user={user} />} />
              <Route path="/reports" element={<Reports testRuns={testRuns} settings={settings} projectId={activeProjectId} onGenerate={(runId, format) => api.generateReport(runId, format, activeProjectId)} />} />
              <Route path="/settings" element={<Settings settings={settings} onUpdateSettings={handleUpdateSettings} />} />
              <Route path="/admin" element={<Admin projects={projects} />} />
              <Route path="/board" element={<Board projectId={activeProjectId} />} />
              <Route path="/work-items" element={<WorkItems projectId={activeProjectId} />} />
              <Route path="/boards" element={<Boards projectId={activeProjectId} />} />
              <Route path="/backlogs" element={<Backlogs projectId={activeProjectId} />} />
              <Route path="/sprints" element={<Sprints projectId={activeProjectId} />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          ) : (
            <div className="loading-page">
              <div className="loading-spinner loading-spinner-lg" />
              <span>Initializing Environment...</span>
            </div>
          )}
        </main>
      </div>

      {showProjectModal && (
        <div className="modal-overlay" onClick={() => setShowProjectModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">New Project</h3>
              <button className="modal-close" onClick={() => setShowProjectModal(false)}><FiX size={16} /></button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Project Name</label>
                  <input type="text" className="form-input" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="Enter project name..." required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowProjectModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isCreatingProject}>
                  {isCreatingProject ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer position="bottom-right" theme="colored" autoClose={settings?.notifications?.duration || 3000} />
    </div>
  );
}

export default App;
