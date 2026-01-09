import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/main.css';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import TestCases from './components/TestCases';
import Execution from './components/Execution';
import Reports from './components/Reports';
import Settings from './components/Settings';
import api from './api';
import { FiPlus, FiBriefcase } from 'react-icons/fi';

function App() {
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

  useEffect(() => {
    api.getProjects().then(res => {
      if (res.success && res.data.length > 0) {
        setProjects(res.data);
        setActiveProjectId(res.data[0].id || res.data[0]._id);
      }
    });
    api.getSettings().then(res => {
      if (res.success) { setSettings(res.data); setAppLogo(res.data.general?.logo); }
    });
    const handleResize = () => setSidebarCollapsed(window.innerWidth < 1100);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const refreshData = useCallback(async () => {
    if (!activeProjectId) return;
    const [suites, cases, runs, stats] = await Promise.all([
      api.getTestSuites(activeProjectId), api.getTestCases(activeProjectId),
      api.getTestRuns(activeProjectId), api.getStatistics(activeProjectId)
    ]);
    if (suites.success) setTestSuites(suites.data);
    if (cases.success) setTestCases(cases.data);
    if (runs.success) setTestRuns(runs.data);
    if (stats.success) setStatistics(stats.data);
  }, [activeProjectId]);

  useEffect(() => { refreshData(); }, [refreshData]);

  const handleUpdateSettings = async (category, data) => {
    const res = await api.updateSettings(category, data);
    if (res.success) { setSettings(res.data); if (category === 'general') setAppLogo(res.data.general?.logo); }
  };

  const activeProjectName = projects.find(p => (p.id || p._id) === activeProjectId)?.name || 'Select Project';

  return (
    <div className={`app ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Navbar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} logo={appLogo} />
      <main className="main-content">
        <div className="top-header">
          <div className="project-selector">
            <div className="project-dropdown"><FiBriefcase className="project-icon" /><select value={activeProjectId || ''} onChange={e => setActiveProjectId(e.target.value)} className="project-select">
              {projects.map(p => <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>)}
            </select></div>
            <button className="btn-icon-sm" onClick={() => setShowProjectModal(true)}><FiPlus /></button>
          </div>
          <div className="header-right"><span>{activeProjectName}</span></div>
        </div>
        {activeProjectId ? (
          <Routes>
            <Route path="/" element={<Dashboard statistics={statistics} testSuites={testSuites} testRuns={testRuns} onRefresh={refreshData} />} />
            <Route path="/test-cases" element={<TestCases testSuites={testSuites} testCases={testCases} onDeleteTestCase={id => api.deleteTestCase(id).then(refreshData)} onUploadCSV={(f, n) => api.uploadCSV(f, n, activeProjectId).then(refreshData)} />} />
            <Route path="/execution" element={<Execution testSuites={testSuites} testCases={testCases} testRuns={testRuns} onCreateTestRun={d => api.createTestRun({...d, projectId: activeProjectId}).then(refreshData)} onDeleteTestRun={id => api.deleteTestRun(id).then(refreshData)} onUpdateExecutionResult={(id, d) => api.updateExecutionResult(id, d).then(refreshData)} />} />
            <Route path="/reports" element={<Reports testRuns={testRuns} projectId={activeProjectId} onGenerate={(runId, format) => api.generateReport(runId, format, activeProjectId)} />} />
            <Route path="/settings" element={<Settings settings={settings} onUpdateSettings={handleUpdateSettings} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : <div className="loading-state">Initializing...</div>}
      </main>
      {showProjectModal && (
        <div className="modal-overlay"><div className="modal"><div className="modal-header"><h3>New Project</h3></div><form onSubmit={async e => { e.preventDefault(); const res = await api.createProject({ name: newProjectName }); if (res.success) { setProjects([...projects, res.data]); setActiveProjectId(res.data.id); setShowProjectModal(false); setNewProjectName(''); } }}><div className="modal-body"><input type="text" className="form-group" style={{width:'100%', padding:'10px'}} value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="Project Name" required /></div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowProjectModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create</button></div></form></div></div>
      )}
      <ToastContainer position="bottom-right" theme="colored" />
    </div>
  );
}
export default App;