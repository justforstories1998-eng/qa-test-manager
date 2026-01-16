import React, { useState, useMemo, useEffect } from 'react';
import {
  FiPlay, FiChevronLeft, FiChevronRight, FiCheckCircle, FiXCircle, 
  FiAlertCircle, FiClock, FiList, FiPlus, FiX, FiFolder, 
  FiHash, FiTarget, FiTrash2, FiMinusCircle, FiCpu, FiMessageSquare, 
  FiExternalLink, FiFilter, FiAlertTriangle, FiZap
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../api';

function Execution({
  testSuites = [],
  testCases = [],
  testRuns = [],
  onCreateTestRun, 
  onDeleteTestRun, 
  onUpdateExecutionResult, 
  onRefresh 
}) {
  // ============================================
  // STATE
  // ============================================
  const [activeRunId, setActiveRunId] = useState(null);
  const [executionResults, setExecutionResults] = useState([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [viewMode, setViewMode] = useState('list'); 
  const [isSaving, setIsSaving] = useState(false);
  
  const [showNewRunModal, setShowNewRunModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(null);
  const [showBugModal, setShowBugModal] = useState(false);
  
  const [comments, setComments] = useState('');
  const [newRunData, setNewRunData] = useState({ name: '', environment: 'QA', tester: '' });
  const [selectedSuiteId, setSelectedSuiteId] = useState(null);
  const [resultsFilter, setResultsFilter] = useState('All');

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const activeRun = useMemo(() => 
    testRuns.find(r => (r._id === activeRunId || r.id === activeRunId)), 
    [activeRunId, testRuns]
  );

  const currentTest = useMemo(() => executionResults[currentTestIndex], [executionResults, currentTestIndex]);

  const cleanStatus = (s) => (s || 'notrun').toLowerCase().replace(' ', '').replace('/', '');

  const filteredResults = useMemo(() => {
    if (resultsFilter === 'All') return executionResults;
    return executionResults.filter(r => {
      const status = cleanStatus(r.status);
      if (resultsFilter === 'Passed') return status === 'passed';
      if (resultsFilter === 'Failed') return status === 'failed';
      if (resultsFilter === 'Blocked') return status === 'blocked';
      if (resultsFilter === 'N/A') return status === 'na' || status === 'notrun';
      return true;
    });
  }, [executionResults, resultsFilter]);

  const getProgressPercentage = (run) => {
    if (!run || !run.totalTests) return 0;
    const completed = (run.passed || 0) + (run.failed || 0) + (run.blocked || 0) + (run.na || 0);
    return Math.round((completed / run.totalTests) * 100);
  };

  const getTotalStats = () => {
    return testRuns.reduce((acc, run) => ({
      total: acc.total + (run.totalTests || 0),
      passed: acc.passed + (run.passed || 0),
      failed: acc.failed + (run.failed || 0),
      blocked: acc.blocked + (run.blocked || 0)
    }), { total: 0, passed: 0, failed: 0, blocked: 0 });
  };

  const stats = getTotalStats();

  // ============================================
  // DATA LOADING
  // ============================================
  const loadResults = async (runId) => {
    try {
      const res = await api.getExecutionResults(runId);
      if (res.success) {
        const merged = res.data.map(r => {
          const foundCase = testCases.find(tc => 
            String(tc._id || tc.id) === String(r.testCaseId)
          );
          return { ...r, testCase: foundCase };
        });

        const validResults = merged.filter(r => r.testCase);
        if (merged.length > 0 && validResults.length === 0) {
            if (onRefresh) onRefresh(); 
        }
        setExecutionResults(validResults);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (activeRunId) loadResults(activeRunId); }, [activeRunId, testCases]);
  useEffect(() => { if (showResultsModal) loadResults(showResultsModal._id || showResultsModal.id); }, [showResultsModal]);
  useEffect(() => { if (executionResults[currentTestIndex]) setComments(executionResults[currentTestIndex].comments || ''); }, [currentTestIndex, executionResults]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleQuickStatus = async (status) => {
    const current = executionResults[currentTestIndex];
    if (!current) return;
    setIsSaving(true);
    try {
      const resultId = current._id || current.id;
      await onUpdateExecutionResult(resultId, { status, comments, executedBy: 'QA Tester' });
      const updated = [...executionResults];
      updated[currentTestIndex] = { ...updated[currentTestIndex], status, comments };
      setExecutionResults(updated);
      if (currentTestIndex < executionResults.length - 1) setCurrentTestIndex(p => p + 1);
      else toast.success("Mission Protocol Complete");
    } catch (e) { toast.error("Sync Failed"); }
    finally { setIsSaving(false); }
  };

  const handleRemoveCase = async () => {
    const current = executionResults[currentTestIndex];
    if (!current) return;
    if (!window.confirm("Remove this specific unit from the current mission?")) return;
    try {
      await api.deleteExecutionResult(current._id || current.id);
      const newResults = executionResults.filter((_, i) => i !== currentTestIndex);
      setExecutionResults(newResults);
      if (currentTestIndex >= newResults.length) setCurrentTestIndex(Math.max(0, newResults.length - 1));
      toast.success("Unit Purged");
    } catch (e) { toast.error("Action Failed"); }
  };

  const handleReportBug = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    formData.append('projectId', activeRun.projectId);
    if (currentTest?.testCase?._id || currentTest?.testCase?.id) {
        formData.append('testCaseId', currentTest.testCase._id || currentTest.testCase.id);
    }

    try {
      const res = await api.createBug(formData);
      if (res.success) {
        toast.success("Defect Logged Successfully");
        setShowBugModal(false);
      }
    } catch (err) { toast.error("Failed to log defect"); }
  };

  const handleCreateRunSubmit = async (e) => {
    e.preventDefault();
    if (!newRunData.name || !selectedSuiteId) return toast.error("Parameters required");
    const cases = testCases.filter(tc => String(tc.suiteId) === String(selectedSuiteId));
    try {
      const newRun = await onCreateTestRun({ ...newRunData, testCaseIds: cases.map(tc => tc._id || tc.id), totalTests: cases.length });
      if (newRun) {
        setShowNewRunModal(false);
        setActiveRunId(newRun._id || newRun.id);
        setViewMode('execution');
      }
    } catch (e) { toast.error("Launch aborted"); }
  };

  // ============================================
  // RENDER: DASHBOARD VIEW
  // ============================================
  if (viewMode === 'list') {
    return (
      <div className="exec-dashboard">
        {/* Ambient Background Effects */}
        <div className="ambient-backdrop">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
          <div className="grid-pattern"></div>
        </div>

        {/* Header */}
        <header className="dashboard-header">
          <div className="header-brand">
            <div className="brand-icon-wrapper">
              <FiZap />
              <span className="pulse-ring"></span>
            </div>
            <div className="brand-content">
              <h1>Execution Control</h1>
              <p>Test orchestration & quality metrics</p>
            </div>
          </div>
          <button className="btn-primary-glow" onClick={() => setShowNewRunModal(true)}>
            <FiPlus />
            <span>New Test Run</span>
            <div className="btn-shine"></div>
          </button>
        </header>

        {/* Stats Overview */}
        <section className="stats-overview">
          <div className="stat-card stat-total">
            <div className="stat-icon"><FiTarget /></div>
            <div className="stat-data">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Total Tests</span>
            </div>
            <div className="stat-glow"></div>
          </div>
          <div className="stat-card stat-passed">
            <div className="stat-icon"><FiCheckCircle /></div>
            <div className="stat-data">
              <span className="stat-number">{stats.passed}</span>
              <span className="stat-label">Passed</span>
            </div>
            <div className="stat-glow"></div>
          </div>
          <div className="stat-card stat-failed">
            <div className="stat-icon"><FiXCircle /></div>
            <div className="stat-data">
              <span className="stat-number">{stats.failed}</span>
              <span className="stat-label">Failed</span>
            </div>
            <div className="stat-glow"></div>
          </div>
          <div className="stat-card stat-blocked">
            <div className="stat-icon"><FiAlertCircle /></div>
            <div className="stat-data">
              <span className="stat-number">{stats.blocked}</span>
              <span className="stat-label">Blocked</span>
            </div>
            <div className="stat-glow"></div>
          </div>
        </section>

        {/* Test Runs Grid */}
        <section className="runs-section">
          {testRuns.length === 0 ? (
            <div className="empty-state">
              <div className="empty-visual">
                <div className="empty-icon"><FiPlay /></div>
                <div className="ripple-rings">
                  <span></span><span></span><span></span>
                </div>
              </div>
              <h3>No Test Runs Yet</h3>
              <p>Create your first test run to begin tracking execution progress</p>
              <button className="btn-primary-glow" onClick={() => setShowNewRunModal(true)}>
                <FiPlus />
                <span>Create Test Run</span>
                <div className="btn-shine"></div>
              </button>
            </div>
          ) : (
            <div className="runs-grid">
              {testRuns.map((run, idx) => (
                <article 
                  key={run._id || run.id} 
                  className="run-card"
                  style={{ animationDelay: `${idx * 0.08}s` }}
                >
                  <div className="card-shimmer"></div>
                  
                  <header className="run-card-header">
                    <div className="run-identity">
                      <div className="run-icon"><FiPlay /></div>
                      <div className="run-info">
                        <h3>{run.name}</h3>
                        <span className="env-badge">{run.environment}</span>
                      </div>
                    </div>
                    <button 
                      className="btn-icon-danger"
                      onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(run); }}
                      aria-label="Delete run"
                    >
                      <FiTrash2 />
                    </button>
                  </header>

                  <div className="progress-container">
                    <div className="progress-header">
                      <span>Completion</span>
                      <span className="progress-percent">{getProgressPercentage(run)}%</span>
                    </div>
                    <div className="progress-track">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${getProgressPercentage(run)}%` }}
                      >
                        <div className="progress-shimmer"></div>
                      </div>
                    </div>
                  </div>

                  <div className="metrics-row">
                    <div className="metric passed">
                      <FiCheckCircle />
                      <span className="metric-val">{run.passed || 0}</span>
                      <span className="metric-lbl">Pass</span>
                    </div>
                    <div className="metric failed">
                      <FiXCircle />
                      <span className="metric-val">{run.failed || 0}</span>
                      <span className="metric-lbl">Fail</span>
                    </div>
                    <div className="metric blocked">
                      <FiAlertCircle />
                      <span className="metric-val">{run.blocked || 0}</span>
                      <span className="metric-lbl">Block</span>
                    </div>
                    <div className="metric na">
                      <FiMinusCircle />
                      <span className="metric-val">{run.na || 0}</span>
                      <span className="metric-lbl">N/A</span>
                    </div>
                  </div>

                  <footer className="run-card-actions">
                    <button 
                      className="btn-execute"
                      onClick={() => { setActiveRunId(run._id || run.id); setViewMode('execution'); }}
                    >
                      <FiPlay />
                      <span>Continue</span>
                    </button>
                    <button 
                      className="btn-results"
                      onClick={() => setShowResultsModal(run)}
                      aria-label="View results"
                    >
                      <FiExternalLink />
                    </button>
                  </footer>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* New Run Modal */}
        {showNewRunModal && (
          <div className="modal-backdrop" onClick={() => setShowNewRunModal(false)}>
            <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
              <header className="modal-header">
                <div className="modal-title">
                  <div className="modal-icon primary"><FiPlay /></div>
                  <div>
                    <h3>Launch New Mission</h3>
                    <p>Configure your test execution parameters</p>
                  </div>
                </div>
                <button className="btn-close" onClick={() => setShowNewRunModal(false)}>
                  <FiX />
                </button>
              </header>
              
              <div className="modal-body">
                <div className="form-split">
                  <div className="form-sidebar">
                    <div className="form-field">
                      <label>Run Name</label>
                      <input 
                        type="text" 
                        className="input-field"
                        placeholder="e.g., Sprint 24 Regression"
                        value={newRunData.name} 
                        onChange={e => setNewRunData({...newRunData, name: e.target.value})} 
                      />
                    </div>
                    <div className="form-field">
                      <label>Environment</label>
                      <select 
                        className="select-field"
                        value={newRunData.environment} 
                        onChange={e => setNewRunData({...newRunData, environment: e.target.value})}
                      >
                        <option value="QA">QA Environment</option>
                        <option value="Staging">Staging Environment</option>
                        <option value="Production">Production</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Tester (Optional)</label>
                      <input 
                        type="text" 
                        className="input-field"
                        placeholder="Enter tester name"
                        value={newRunData.tester} 
                        onChange={e => setNewRunData({...newRunData, tester: e.target.value})} 
                      />
                    </div>
                  </div>
                  
                  <div className="form-main">
                    <div className="selection-title">
                      <FiFolder />
                      <span>Select Test Suite</span>
                    </div>
                    <div className="suite-list">
                      {testSuites.map(s => (
                        <div 
                          key={s._id || s.id} 
                          className={`suite-option ${selectedSuiteId === (s._id || s.id) ? 'selected' : ''}`} 
                          onClick={() => setSelectedSuiteId(s._id || s.id)}
                        >
                          <div className="radio-indicator">
                            <span className="radio-dot"></span>
                          </div>
                          <div className="suite-details">
                            <span className="suite-name">{s.name}</span>
                            <span className="suite-count">
                              {testCases.filter(tc => String(tc.suiteId) === String(s._id || s.id)).length} test cases
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <footer className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowNewRunModal(false)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleCreateRunSubmit}>
                  <FiPlay />
                  <span>Launch Mission</span>
                </button>
              </footer>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(null)}>
            <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
              <header className="modal-header">
                <div className="modal-title">
                  <div className="modal-icon danger"><FiTrash2 /></div>
                  <div>
                    <h3>Abort Mission?</h3>
                    <p>This action cannot be undone</p>
                  </div>
                </div>
                <button className="btn-close" onClick={() => setShowDeleteConfirm(null)}>
                  <FiX />
                </button>
              </header>
              <div className="modal-body">
                <p className="confirm-message">
                  Are you sure you want to delete <strong>{showDeleteConfirm.name}</strong>? 
                  All execution results will be permanently removed.
                </p>
              </div>
              <footer className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowDeleteConfirm(null)}>
                  Cancel
                </button>
                <button 
                  className="btn-danger"
                  onClick={async () => { 
                    await onDeleteTestRun(showDeleteConfirm._id || showDeleteConfirm.id); 
                    setShowDeleteConfirm(null); 
                    toast.success("Purged"); 
                  }}
                >
                  <FiTrash2 />
                  <span>Delete</span>
                </button>
              </footer>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // RENDER: EXECUTION VIEW
  // ============================================
  const tc = executionResults[currentTestIndex]?.testCase;
  const currentStatus = cleanStatus(executionResults[currentTestIndex]?.status);
  const completedCount = executionResults.filter(r => cleanStatus(r.status) !== 'notrun').length;

  return (
    <div className="exec-stage">
      {/* Background Effects */}
      <div className="stage-backdrop">
        <div className="stage-orb orb-1"></div>
        <div className="stage-orb orb-2"></div>
        <div className="stage-orb orb-3"></div>
      </div>

      {/* Header */}
      <header className="stage-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => setViewMode('list')}>
            <FiChevronLeft />
            <span>Back</span>
          </button>
          <div className="run-identity-header">
            <div className="run-icon-animated">
              <FiPlay />
              <span className="icon-pulse"></span>
            </div>
            <div className="run-meta">
              <h1>{activeRun?.name}</h1>
              <div className="run-badges">
                <span className="badge-env">{activeRun?.environment}</span>
                <span className="badge-progress">{completedCount} / {executionResults.length} completed</span>
              </div>
            </div>
          </div>
        </div>

        <div className="header-right">
          <button 
            className="btn-icon-danger" 
            onClick={handleRemoveCase} 
            title="Remove from mission"
          >
            <FiTrash2 />
          </button>
          <div className="progress-ring-wrapper">
            <svg className="progress-ring" viewBox="0 0 64 64">
              <defs>
                <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <circle className="ring-bg" cx="32" cy="32" r="26" />
              <circle 
                className="ring-fill" 
                cx="32" cy="32" r="26"
                strokeDasharray={`${(completedCount / executionResults.length) * 163.36} 163.36`}
              />
            </svg>
            <div className="ring-label">
              <span className="ring-current">{currentTestIndex + 1}</span>
              <span className="ring-sep">/</span>
              <span className="ring-total">{executionResults.length}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="stage-layout">
        {/* Sidebar Queue */}
        <aside className="stage-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-title">
              <FiList />
              <span>Test Queue</span>
            </div>
            <span className="queue-badge">{executionResults.length}</span>
          </div>
          <div className="queue-list">
            {executionResults.map((res, idx) => (
              <div 
                key={res.id || res._id || idx} 
                className={`queue-item ${idx === currentTestIndex ? 'active' : ''} status-${cleanStatus(res.status)}`}
                onClick={() => setCurrentTestIndex(idx)}
              >
                <div className="queue-number">
                  <span>{idx + 1}</span>
                  <div className="status-dot"></div>
                </div>
                <div className="queue-info">
                  <span className="queue-title">{res.testCase?.title}</span>
                  <span className="queue-status">{res.status || 'Not Run'}</span>
                </div>
                {idx === currentTestIndex && (
                  <div className="active-marker"><FiChevronRight /></div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="stage-main">
          <div className="test-content">
            {tc ? (
              <>
                {/* Test Header */}
                <header className="test-header">
                  <div className="test-meta">
                    <span className="test-id">
                      <FiHash />
                      {tc.adoId || `TC-${currentTestIndex + 1}`}
                    </span>
                    <span className={`status-indicator ${currentStatus}`}>
                      <span className="status-dot-lg"></span>
                      {executionResults[currentTestIndex]?.status || 'Not Run'}
                    </span>
                  </div>
                  <h2 className="test-title">{tc.title}</h2>
                  {tc.description && (
                    <p className="test-description">{tc.description}</p>
                  )}
                </header>

                {/* Steps */}
                <section className="steps-section">
                  <div className="section-header">
                    <h3><FiList /> Test Steps</h3>
                    <span className="step-count">{tc.steps?.length || 0} steps</span>
                  </div>
                  <div className="steps-list">
                    {tc.steps?.map((s, i) => (
                      <div key={i} className="step-card">
                        <div className="step-number">{s.stepNumber || i + 1}</div>
                        <div className="step-body">
                          <div className="step-action">
                            <label>Action</label>
                            <p>{s.action}</p>
                          </div>
                          <div className="step-expected">
                            <label>Expected Result</label>
                            <p>{s.expectedResult}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Notes */}
                <section className="notes-section">
                  <label className="notes-label">
                    <FiMessageSquare />
                    Analyst Notes
                  </label>
                  <textarea 
                    className="notes-input"
                    value={comments} 
                    onChange={(e) => setComments(e.target.value)} 
                    placeholder="Add observations, defects, or additional context..."
                  />
                </section>
              </>
            ) : (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <span>Initializing Stage...</span>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <footer className="action-bar">
            <div className="status-actions">
              <button 
                className={`status-btn pass ${isSaving ? 'saving' : ''}`}
                onClick={() => handleQuickStatus('Passed')}
                disabled={isSaving}
              >
                <FiCheckCircle />
                <span>Pass</span>
              </button>
              <button 
                className={`status-btn fail ${isSaving ? 'saving' : ''}`}
                onClick={() => handleQuickStatus('Failed')}
                disabled={isSaving}
              >
                <FiXCircle />
                <span>Fail</span>
              </button>
              <button 
                className={`status-btn block ${isSaving ? 'saving' : ''}`}
                onClick={() => handleQuickStatus('Blocked')}
                disabled={isSaving}
              >
                <FiAlertCircle />
                <span>Block</span>
              </button>
              <button 
                className={`status-btn na ${isSaving ? 'saving' : ''}`}
                onClick={() => handleQuickStatus('N/A')}
                disabled={isSaving}
              >
                <FiMinusCircle />
                <span>N/A</span>
              </button>
              <div className="action-divider"></div>
              <button 
                className="status-btn bug"
                onClick={() => setShowBugModal(true)}
              >
                <FiAlertTriangle />
                <span>Report Bug</span>
              </button>
            </div>

            <div className="nav-actions">
              <button 
                className="nav-btn"
                onClick={() => setCurrentTestIndex(p => Math.max(0, p - 1))} 
                disabled={currentTestIndex === 0}
              >
                <FiChevronLeft />
              </button>
              <div className="nav-counter">
                <span className="nav-current">{currentTestIndex + 1}</span>
                <span className="nav-sep">of</span>
                <span className="nav-total">{executionResults.length}</span>
              </div>
              <button 
                className="nav-btn"
                onClick={() => setCurrentTestIndex(p => Math.min(p + 1, executionResults.length - 1))} 
                disabled={currentTestIndex === executionResults.length - 1}
              >
                <FiChevronRight />
              </button>
            </div>
          </footer>
        </main>
      </div>

      {/* Results Modal */}
      {showResultsModal && (
        <div className="modal-backdrop" onClick={() => { setShowResultsModal(null); setExecutionResults([]); }}>
          <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
            <header className="modal-header">
              <div className="modal-title">
                <div className="modal-icon primary"><FiList /></div>
                <div>
                  <h3>Mission Results: {showResultsModal.name}</h3>
                  <p>Execution summary and details</p>
                </div>
              </div>
              <button className="btn-close" onClick={() => { setShowResultsModal(null); setExecutionResults([]); }}>
                <FiX />
              </button>
            </header>
            
            <div className="modal-body">
              <div className="filter-bar">
                <div className="filter-label">
                  <FiFilter />
                  <span>Filter by status</span>
                </div>
                <div className="filter-chips">
                  {['All', 'Passed', 'Failed', 'Blocked', 'N/A'].map(f => (
                    <button 
                      key={f} 
                      className={`filter-chip ${resultsFilter === f ? 'active' : ''} ${f.toLowerCase().replace('/', '')}`}
                      onClick={() => setResultsFilter(f)}
                    >
                      {f}
                      {f !== 'All' && (
                        <span className="chip-count">
                          {executionResults.filter(r => {
                            const st = cleanStatus(r.status);
                            if (f === 'Passed') return st === 'passed';
                            if (f === 'Failed') return st === 'failed';
                            if (f === 'Blocked') return st === 'blocked';
                            if (f === 'N/A') return st === 'na' || st === 'notrun';
                            return true;
                          }).length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="results-table-wrapper">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Test Case</th>
                      <th>Status</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((r, i) => (
                      <tr key={r.id || r._id || i}>
                        <td><span className="id-pill">{r.testCase?.adoId || 'TC'}</span></td>
                        <td className="title-cell">{r.testCase?.title}</td>
                        <td>
                          <span className={`status-pill ${cleanStatus(r.status)}`}>
                            {r.status || 'Not Run'}
                          </span>
                        </td>
                        <td className="notes-cell">
                          {r.comments || <span className="empty-notes">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bug Report Modal */}
      {showBugModal && (
        <div className="modal-backdrop" onClick={() => setShowBugModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <header className="modal-header">
              <div className="modal-title">
                <div className="modal-icon danger"><FiAlertTriangle /></div>
                <div>
                  <h3>Report Defect</h3>
                  <p>{tc?.title}</p>
                </div>
              </div>
              <button className="btn-close" onClick={() => setShowBugModal(false)}>
                <FiX />
              </button>
            </header>
            <form onSubmit={handleReportBug}>
              <div className="modal-body modal-body-scroll">
                <div className="form-field">
                  <label>Bug Title</label>
                  <input 
                    name="title" 
                    className="input-field"
                    defaultValue={`Defect: ${tc?.title}`} 
                    required 
                  />
                </div>
                <div className="form-field">
                  <label>Steps to Reproduce</label>
                  <textarea 
                    name="description" 
                    className="textarea-field"
                    rows={6} 
                    defaultValue={tc?.steps?.map(s => `Step ${s.stepNumber}: ${s.action}`).join('\n')} 
                  />
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label>Severity</label>
                    <select name="severity" className="select-field">
                      <option>Critical</option>
                      <option>High</option>
                      <option selected>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Assignee</label>
                    <input 
                      name="assignedTo" 
                      className="input-field"
                      placeholder="Developer name" 
                    />
                  </div>
                </div>
              </div>
              <footer className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowBugModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-danger">
                  <FiAlertTriangle />
                  <span>Commit Defect</span>
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Execution;