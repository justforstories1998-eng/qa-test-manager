import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
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

import api from './api';

import { FiPlus, FiBriefcase, FiMenu } from 'react-icons/fi';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('token');
  });

  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const [testSuites, setTestSuites] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [testRuns, setTestRuns] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [settings, setSettings] = useState(null);
  const [appLogo, setAppLogo] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1100);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setProjects([]);
    setActiveProjectId(null);
    toast.info('Logged out successfully');
  };

  const handlePasswordChanged = (updatedUser) => {
    setUser(updatedUser);
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    api.getProjects().then(res => {
      if (res.success && res.data.length > 0) {
        setProjects(res.data);
        setActiveProjectId(res.data[0].id || res.data[0]._id);
      }
    }).catch(err => console.error("Project fetch error", err));

    api.getSettings().then(res => {
      if (res.success) {
        setSettings(res.data);
        setAppLogo(res.data.general?.logo);
      }
    }).catch(err => console.error("Settings fetch error", err));

    const handleResize = () => setSidebarCollapsed(window.innerWidth < 1100);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isAuthenticated]);

  const refreshData = useCallback(async () => {
    if (!activeProjectId) return;
    try {
      const [suites, cases, runs, stats] = await Promise.all([
        api.getTestSuites(activeProjectId),
        api.getTestCases(activeProjectId),
        api.getTestRuns(activeProjectId),
        api.getStatistics(activeProjectId)
      ]);
      if (suites.success) setTestSuites(suites.data);
      if (cases.success) setTestCases(cases.data);
      if (runs.success) setTestRuns(runs.data);
      if (stats.success) setStatistics(stats.data);
    } catch (e) {
      console.error("Data synchronization error:", e);
    }
  }, [activeProjectId]);

  useEffect(() => { refreshData(); }, [refreshData]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createProject({ name: newProjectName });
      if (res.success) {
        const newProj = res.data;
        setProjects(prev => [...prev, newProj]);
        setActiveProjectId(newProj.id || newProj._id);
        setShowProjectModal(false);
        setNewProjectName('');
        toast.success("New Project Created");
      }
    } catch (err) {
      toast.error("Error creating project");
    }
  };

  const handleUpdateSettings = async (category, data) => {
    try {
      const res = await api.updateSettings(category, data);
      if (res.success) {
        setSettings(res.data);
        if (category === 'general') setAppLogo(res.data.general?.logo);
        toast.success("Settings Updated");
      }
    } catch (err) {
      toast.error("Settings update failed");
    }
  };

  const handleCreateRun = async (data) => {
    try {
      const res = await api.createTestRun({ ...data, projectId: activeProjectId });
      if (res.success) {
        await refreshData();
        return res.data;
      }
    } catch (err) {
      toast.error("Launch failed");
      throw err;
    }
  };

  const handleUpdateExecutionResult = async (id, resultData) => {
    try {
      const res = await api.updateExecutionResult(id, resultData);
      if (res.success) {
        await refreshData();
        return res.data;
      }
    } catch (err) {
      console.error("Sync failure", err);
    }
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
    <div className={`app ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Navbar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        logo={appLogo}
        user={user}
        onLogout={handleLogout}
        isAdmin={user?.role === 'admin'}
        isMobileOpen={mobileMenuOpen}
        onToggleMobile={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      <main className="main-content">
        <div className="top-header">
          <div className="project-selector">
            <div className="project-dropdown">
              <FiBriefcase className="project-icon" />
              <select
                value={activeProjectId || ''}
                onChange={(e) => setActiveProjectId(e.target.value)}
                className="project-select"
              >
                {projects.map(p => (
                  <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            <button className="btn-icon-sm" onClick={() => setShowProjectModal(true)} title="Add Project">
              <FiPlus />
            </button>
          </div>
          <div className="header-right">
            <span>{activeProjectName}</span>
          </div>
        </div>

        {activeProjectId ? (
          <Routes>
            <Route path="/" element={<Dashboard statistics={statistics} testSuites={testSuites} testRuns={testRuns} onRefresh={refreshData} />} />
            <Route path="/test-cases" element={
              <TestCases
                testSuites={testSuites}
                testCases={testCases}
                onDeleteTestCase={id => api.deleteTestCase(id).then(refreshData)}
                onUploadCSV={(f, n) => api.uploadCSV(f, n, activeProjectId).then(refreshData)}
              />
            } />
            <Route path="/execution" element={
              <Execution
                testSuites={testSuites}
                testCases={testCases}
                testRuns={testRuns}
                onCreateTestRun={handleCreateRun}
                onDeleteTestRun={id => api.deleteTestRun(id).then(refreshData)}
                onUpdateExecutionResult={handleUpdateExecutionResult}
                onRefresh={refreshData}
              />
            } />
            <Route path="/bugs" element={<Bugs projectId={activeProjectId} user={user} />} />
            <Route path="/reports" element={
              <Reports
                testRuns={testRuns}
                projectId={activeProjectId}
                onGenerate={(runId, format) => api.generateReport(runId, format, activeProjectId)}
              />
            } />
            <Route path="/settings" element={<Settings settings={settings} onUpdateSettings={handleUpdateSettings} />} />
            {user?.role === 'admin' && (
              <Route path="/admin" element={<Admin projects={projects} />} />
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Initializing Environment...</p>
          </div>
        )}
      </main>

      {showProjectModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><h3>New Project</h3></div>
            <form onSubmit={handleCreateProject}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Project Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                    placeholder="Enter project name..."
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowProjectModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer position="bottom-right" theme="colored" autoClose={3000} />
    </div>
  );
}

export default App;
