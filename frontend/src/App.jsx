import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Initial Load
  useEffect(() => {
    api.getProjects().then(res => {
      if (res.success && res.data.length > 0) {
        setProjects(res.data);
        setActiveProjectId(res.data[0].id || res.data[0]._id);
      }
    });
    api.getSettings().then(res => res.success && setSettings(res.data));
  }, []);

  // Fetch Data on Project Change
  const refreshData = useCallback(async () => {
    if (!activeProjectId) return;
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
  }, [activeProjectId]);

  useEffect(() => { refreshData(); }, [refreshData]);

  // Project Handler
  const handleCreateProject = async (e) => {
    e.preventDefault();
    const res = await api.createProject({ name: newProjectName });
    if (res.success) {
      setProjects([...projects, res.data]);
      setActiveProjectId(res.data.id || res.data._id);
      setShowProjectModal(false);
      setNewProjectName('');
      toast.success("Project Created!");
    }
  };

  // Wrapped Handlers
  const handleUploadCSV = (file, name) => api.uploadCSV(file, name, activeProjectId).then(refreshData);
  const handleCreateSuite = (data) => api.createTestSuite({...data, projectId: activeProjectId}).then(refreshData);
  const handleCreateCase = (data) => api.createTestCase({...data, projectId: activeProjectId}).then(refreshData);
  const handleCreateRun = (data) => api.createTestRun({...data, projectId: activeProjectId}).then(refreshData);
  const handleDeleteSuite = (id) => api.deleteTestSuite(id).then(refreshData);
  const handleDeleteCase = (id) => api.deleteTestCase(id).then(refreshData);
  const handleDeleteRun = (id) => api.deleteTestRun(id).then(refreshData);
  const handleGenerateReport = (runId, format) => api.generateReport(runId, format, activeProjectId);

  const activeProjectName = projects.find(p => (p.id || p._id) === activeProjectId)?.name || 'Loading...';

  return (
    <div className={`app ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Navbar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <main className="main-content">
        <div className="top-header">
          <div className="project-selector">
            <div className="project-dropdown">
              <FiBriefcase className="project-icon" />
              <select value={activeProjectId || ''} onChange={(e) => setActiveProjectId(e.target.value)} className="project-select">
                {projects.map(p => <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>)}
              </select>
            </div>
            <button className="btn-icon-sm" onClick={() => setShowProjectModal(true)} title="New Project"><FiPlus /></button>
          </div>
          <div className="header-right"><span>{activeProjectName}</span></div>
        </div>

        {activeProjectId ? (
          <Routes>
            <Route path="/" element={<Dashboard statistics={statistics} testSuites={testSuites} testRuns={testRuns} onRefresh={refreshData} />} />
            <Route path="/test-cases" element={<TestCases testSuites={testSuites} testCases={testCases} onCreateSuite={handleCreateSuite} onDeleteSuite={handleDeleteSuite} onCreateTestCase={handleCreateCase} onUpdateTestCase={(id, d) => api.updateTestCase(id, d).then(refreshData)} onDeleteTestCase={handleDeleteCase} onUploadCSV={handleUploadCSV} />} />
            <Route path="/execution" element={<Execution testSuites={testSuites} testCases={testCases} testRuns={testRuns} onCreateTestRun={handleCreateRun} onDeleteTestRun={handleDeleteRun} onUpdateExecutionResult={(id, d) => api.updateExecutionResult(id, d).then(refreshData)} />} />
            <Route path="/reports" element={<Reports testRuns={testRuns} settings={settings} onGenerate={handleGenerateReport} projectId={activeProjectId} />} />
            <Route path="/settings" element={<Settings settings={settings} onUpdateSettings={(cat, d) => api.updateSettings(cat, d).then(res => setSettings(res.data))} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : <div className="loading-state"><p>Loading Projects...</p></div>}
      </main>

      {showProjectModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><h3>New Project</h3></div>
            <form onSubmit={handleCreateProject}>
              <div className="modal-body">
                <input type="text" placeholder="Project Name" className="form-input" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} required />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowProjectModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;