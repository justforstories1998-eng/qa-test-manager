import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/main.css';

// Components
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import TestCases from './components/TestCases';
import Execution from './components/Execution';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Bugs from './components/Bugs';

// API Service
import api from './api';

// Icons
import { FiPlus, FiBriefcase } from 'react-icons/fi';

function App() {
  // ============================================
  // GLOBAL STATE
  // ============================================
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

  // ============================================
  // INITIALIZATION
  // ============================================
  useEffect(() => {
    // 1. Load Projects
    api.getProjects().then(res => {
      if (res.success && res.data.length > 0) {
        setProjects(res.data);
        setActiveProjectId(res.data[0].id || res.data[0]._id);
      }
    }).catch(err => console.error("Project init failed", err));

    // 2. Load Settings & Logo
    api.getSettings().then(res => {
      if (res.success) {
        setSettings(res.data);
        setAppLogo(res.data.general?.logo);
      }
    }).catch(err => console.error("Settings init failed", err));

    // 3. Handle Responsive Sidebar
    const handleResize = () => setSidebarCollapsed(window.innerWidth < 1100);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ============================================
  // DATA SYNC LOGIC
  // ============================================
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
      console.error("Refresh sync error:", e);
    }
  }, [activeProjectId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // ============================================
  // EVENT HANDLERS
  // ============================================

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
        toast.success("New Project Initialized");
      }
    } catch (err) {
      toast.error("Failed to create project");
    }
  };

  const handleUpdateSettings = async (category, data) => {
    try {
      const res = await api.updateSettings(category, data);
      if (res.success) {
        setSettings(res.data);
        if (category === 'general') setAppLogo(res.data.general?.logo);
        toast.success("Configuration Updated");
      }
    } catch (err) {
      toast.error("Sync Error");
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
      toast.error("Failed to launch mission");
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
      console.error(err);
    }
  };

  // ============================================
  // RENDER
  // ============================================
  const activeProject = projects.find(p => (p.id || p._id) === activeProjectId);
  const activeProjectName = activeProject?.name || 'Select Project';

  return (
    <div className={`app ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Navbar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} logo={appLogo} />
      
      <main className="main-content">
        <div className="top-header">
          <div className="project-selector">
            <div className="project-dropdown">
              <FiBriefcase className="project-icon" />
              <select value={activeProjectId || ''} onChange={(e) => setActiveProjectId(e.target.value)} className="project-select">
                {projects.map(p => (
                  <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            <button className="btn-icon-sm" onClick={() => setShowProjectModal(true)}><FiPlus /></button>
          </div>
          <div className="header-right">
            <span>{activeProjectName}</span>
          </div>
        </div>

        {activeProjectId ? (
          <Routes>
            <Route path="/" element={<Dashboard statistics={statistics} testSuites={testSuites} testRuns={testRuns} onRefresh={refreshData} />} />
            <Route path="/test-cases" element={<TestCases testSuites={testSuites} testCases={testCases} onDeleteTestCase={id => api.deleteTestCase(id).then(refreshData)} onUploadCSV={(f, n) => api.uploadCSV(f, n, activeProjectId).then(refreshData)} />} />
            <Route path="/execution" element={<Execution testSuites={testSuites} testCases={testCases} testRuns={testRuns} onCreateTestRun={handleCreateRun} onDeleteTestRun={id => api.deleteTestRun(id).then(refreshData)} onUpdateExecutionResult={handleUpdateExecutionResult} onRefresh={refreshData} />} />
            <Route path="/bugs" element={<Bugs projectId={activeProjectId} />} />
            <Route path="/reports" element={<Reports testRuns={testRuns} projectId={activeProjectId} onGenerate={(runId, format) => api.generateReport(runId, format, activeProjectId)} />} />
            <Route path="/settings" element={<Settings settings={settings} onUpdateSettings={handleUpdateSettings} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : (
          <div className="loading-state">Initializing Project Workspace...</div>
        )}
      </main>

      {showProjectModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><h3>New Project</h3></div>
            <form onSubmit={handleCreateProject}>
              <div className="modal-body"><input type="text" className="form-group" style={{width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid #e2e8f0'}} value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="Project Name" required /></div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowProjectModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create</button></div>
            </form>
          </div>
        </div>
      )}
      
      {/* FIXED TOAST CONTAINER */}
      <ToastContainer autoClose={3000} hideProgressBar />
    </div>
  );
}

export default App;