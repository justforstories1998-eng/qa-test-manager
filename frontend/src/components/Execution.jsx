import React, { useState, useMemo, useEffect } from 'react';
import {
  FiPlay, FiChevronLeft, FiChevronRight, FiCheckCircle, FiXCircle, 
  FiAlertCircle, FiClock, FiList, FiPlus, FiX, FiFolder, 
  FiHash, FiTarget, FiTrash2, FiMinusCircle, FiCpu, FiMessageSquare, 
  FiExternalLink, FiFilter, FiAlertTriangle, FiZap, FiLayers,
  FiActivity, FiShield, FiCommand
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../api';

function Execution({
  testSuites, testCases, testRuns, onCreateTestRun, 
  onDeleteTestRun, onUpdateExecutionResult
}) {
  const [activeRunId, setActiveRunId] = useState(null);
  const [executionResults, setExecutionResults] = useState([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [viewMode, setViewMode] = useState('list'); 
  const [isSaving, setIsSaving] = useState(false);
  
  // Modals
  const [showNewRunModal, setShowNewRunModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(null);
  const [showBugModal, setShowBugModal] = useState(false);
  
  // States
  const [comments, setComments] = useState('');
  const [newRunData, setNewRunData] = useState({ name: '', environment: 'QA', tester: '' });
  const [selectedSuiteId, setSelectedSuiteId] = useState(null);
  const [resultsFilter, setResultsFilter] = useState('All');

  const activeRun = useMemo(() => 
    testRuns.find(r => (r._id === activeRunId || r.id === activeRunId)), 
    [activeRunId, testRuns]
  );

  const currentTest = useMemo(() => executionResults[currentTestIndex], [executionResults, currentTestIndex]);

  const filteredResults = useMemo(() => {
    if (resultsFilter === 'All') return executionResults;
    return executionResults.filter(r => r.status === resultsFilter);
  }, [executionResults, resultsFilter]);

  useEffect(() => { if (activeRunId) loadResults(activeRunId); }, [activeRunId]);
  useEffect(() => { if (showResultsModal) loadResults(showResultsModal._id || showResultsModal.id); }, [showResultsModal]);
  useEffect(() => { if (currentTest) setComments(currentTest.comments || ''); }, [currentTestIndex, executionResults]);

  const loadResults = async (runId) => {
    try {
      const res = await api.getExecutionResults(runId);
      if (res.success) {
        const merged = res.data.map(r => ({
          ...r,
          testCase: testCases.find(tc => String(tc._id || tc.id) === String(r.testCaseId))
        })).filter(r => r.testCase); 
        setExecutionResults(merged);
      }
    } catch (e) { toast.error("Error loading mission data"); }
  };

  const handleQuickStatus = async (status) => {
    if (!currentTest) return;
    setIsSaving(true);
    try {
      const resultId = currentTest._id || currentTest.id;
      await onUpdateExecutionResult(resultId, { status, comments, executedBy: 'QA Tester' });
      setExecutionResults(prev => prev.map((r, i) => i === currentTestIndex ? { ...r, status, comments } : r));
      if (currentTestIndex < executionResults.length - 1) setCurrentTestIndex(p => p + 1);
      else toast.success("Mission Protocol Complete");
    } catch (e) { toast.error("Sync Protocol Failed"); }
    finally { setIsSaving(false); }
  };

  const handleRemoveCase = async () => {
    if (!currentTest) return;
    if (!window.confirm("Remove this specific unit?")) return;
    try {
      await api.deleteExecutionResult(currentTest._id || currentTest.id);
      const newResults = executionResults.filter((_, i) => i !== currentTestIndex);
      setExecutionResults(newResults);
      if (currentTestIndex >= newResults.length) setCurrentTestIndex(Math.max(0, newResults.length - 1));
      toast.success("Purged");
    } catch (e) { toast.error("Failed"); }
  };

  const handleReportBug = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const bugData = Object.fromEntries(formData);
    bugData.projectId = activeRun.projectId;
    bugData.testCaseId = currentTest.testCaseId;

    try {
      const res = await api.createBug(bugData);
      if (res.success) {
        toast.success("Bug reported successfully");
        setShowBugModal(false);
      }
    } catch (err) { toast.error("Failed to report bug"); }
  };

  const cleanStatus = (s) => (s || 'notrun').toLowerCase().replace(' ', '').replace('/', '');

  const getProgressPercentage = (run) => {
    const total = (run.passed || 0) + (run.failed || 0) + (run.blocked || 0) + (run.na || 0);
    const completed = (run.passed || 0) + (run.failed || 0);
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  if (viewMode === 'execution' && activeRun) {
    const tc = currentTest?.testCase;
    const progress = executionResults.length > 0 ? Math.round(((currentTestIndex + 1) / executionResults.length) * 100) : 0;
    
    return (
      <div className="execution-view">
        <div className="execution-header">
          <div className="header-left">
            <button className="btn-back-premium" onClick={() => setViewMode('list')}>
              <FiChevronLeft />
              <span>Dashboard</span>
            </button>
            <div className="header-divider"></div>
            <div className="run-title-group">
              <div className="run-title-icon">
                <FiZap />
              </div>
              <div className="run-title-content">
                <h2>{activeRun.name}</h2>
                <div className="run-meta-badges">
                  <span className="meta-badge environment">
                    <FiLayers /> {activeRun.environment}
                  </span>
                  <span className="meta-badge progress-badge">
                    <FiActivity /> {progress}% Complete
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="header-right">
            <button className="btn-icon-premium danger" onClick={handleRemoveCase} title="Remove Case">
              <FiTrash2 />
            </button>
            <div className="run-progress-indicator">
              <div className="progress-ring">
                <svg viewBox="0 0 36 36">
                  <path className="progress-ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="progress-ring-fill" strokeDasharray={`${progress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span className="progress-text">{currentTestIndex + 1}</span>
              </div>
              <div className="progress-label">
                <span className="progress-current">Unit {currentTestIndex + 1}</span>
                <span className="progress-total">of {executionResults.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="execution-layout-container">
          <aside className="execution-sidebar">
            <div className="sidebar-header">
              <div className="sidebar-title">
                <FiList />
                <span>Test Queue</span>
              </div>
              <span className="queue-count">{executionResults.length}</span>
            </div>
            <div className="execution-test-list">
              {executionResults.map((res, idx) => (
                <div 
                  key={idx} 
                  className={`test-nav-item ${idx === currentTestIndex ? 'active' : ''} status-${cleanStatus(res.status)}`} 
                  onClick={() => setCurrentTestIndex(idx)}
                >
                  <div className="nav-item-indicator">
                    <span className="status-dot"></span>
                    <span className="nav-index">{idx + 1}</span>
                  </div>
                  <div className="nav-item-content">
                    <span className="test-nav-title">{res.testCase?.title}</span>
                    <span className="test-nav-status">{res.status || 'Not Run'}</span>
                  </div>
                  {idx === currentTestIndex && <div className="active-indicator"></div>}
                </div>
              ))}
            </div>
          </aside>

          <main className="execution-main-content">
            <div className="test-execution-card">
              {tc ? (
                <>
                  <div className="test-card-header">
                    <div className="header-top-row">
                      <div className="test-id-pill">
                        <FiHash />
                        <span>{tc.adoId || 'TC-000'}</span>
                      </div>
                      <div className={`current-status-badge ${cleanStatus(currentTest?.status)}`}>
                        {currentTest?.status || 'Pending'}
                      </div>
                    </div>
                    <h1 className="test-display-title">{tc.title}</h1>
                    {tc.description && (
                      <p className="test-description">{tc.description}</p>
                    )}
                  </div>
                  
                  <div className="test-steps-container">
                    <div className="steps-header">
                      <FiCommand />
                      <span>Test Steps</span>
                      <span className="steps-count">{tc.steps?.length || 0} steps</span>
                    </div>
                    {tc.steps?.map((s, i) => (
                      <div key={i} className="step-row-card">
                        <div className="step-number-badge">
                          <span>{s.stepNumber}</span>
                        </div>
                        <div className="step-content">
                          <div className="step-section action">
                            <label>
                              <FiPlay />
                              Action
                            </label>
                            <div className="step-text">{s.action}</div>
                          </div>
                          <div className="step-section expected">
                            <label>
                              <FiTarget />
                              Expected Result
                            </label>
                            <div className="step-text">{s.expectedResult}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="execution-comments-area">
                    <label>
                      <FiMessageSquare />
                      <span>Analyst Notes</span>
                    </label>
                    <textarea 
                      value={comments} 
                      onChange={(e) => setComments(e.target.value)} 
                      placeholder="Enter observations, notes, or additional context here..." 
                    />
                  </div>
                </>
              ) : (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <span>Initializing Test Data...</span>
                </div>
              )}
            </div>

            <div className="execution-action-bar">
              <div className="status-buttons-group">
                <button 
                  className={`btn-status pass ${isSaving ? 'saving' : ''}`} 
                  onClick={() => handleQuickStatus('Passed')}
                  disabled={isSaving}
                >
                  <FiCheckCircle />
                  <span>Pass</span>
                </button>
                <button 
                  className={`btn-status fail ${isSaving ? 'saving' : ''}`} 
                  onClick={() => handleQuickStatus('Failed')}
                  disabled={isSaving}
                >
                  <FiXCircle />
                  <span>Fail</span>
                </button>
                <button 
                  className={`btn-status block ${isSaving ? 'saving' : ''}`} 
                  onClick={() => handleQuickStatus('Blocked')}
                  disabled={isSaving}
                >
                  <FiAlertCircle />
                  <span>Block</span>
                </button>
                <button 
                  className={`btn-status na ${isSaving ? 'saving' : ''}`} 
                  onClick={() => handleQuickStatus('N/A')}
                  disabled={isSaving}
                >
                  <FiMinusCircle />
                  <span>N/A</span>
                </button>
                
                <div className="action-divider"></div>
                
                <button 
                  className="btn-status bug" 
                  onClick={() => setShowBugModal(true)}
                >
                  <FiAlertTriangle />
                  <span>Report Bug</span>
                </button>
              </div>
              
              <div className="navigation-controls">
                <button 
                  className="btn-nav" 
                  onClick={() => setCurrentTestIndex(p => Math.max(0, p - 1))} 
                  disabled={currentTestIndex === 0}
                >
                  <FiChevronLeft />
                </button>
                <div className="nav-indicator">
                  {currentTestIndex + 1} / {executionResults.length}
                </div>
                <button 
                  className="btn-nav" 
                  onClick={() => setCurrentTestIndex(p => Math.min(p + 1, executionResults.length - 1))} 
                  disabled={currentTestIndex === executionResults.length - 1}
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          </main>
        </div>

        {/* Bug Report Modal */}
        {showBugModal && (
          <div className="modal-overlay">
            <div className="modal modal-large">
              <div className="modal-header">
                <div className="modal-title-group">
                  <div className="modal-icon bug">
                    <FiAlertTriangle />
                  </div>
                  <div>
                    <h3>Report Bug</h3>
                    <p className="modal-subtitle">for: {tc?.title}</p>
                  </div>
                </div>
                <button className="close-btn" onClick={() => setShowBugModal(false)}>
                  <FiX />
                </button>
              </div>
              <form onSubmit={handleReportBug}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Bug Title</label>
                    <input 
                      name="title" 
                      defaultValue={`Bug in: ${tc?.title}`} 
                      required 
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Steps to Reproduce</label>
                    <textarea 
                      name="description" 
                      rows={5} 
                      defaultValue={tc?.steps?.map(s => `Step ${s.stepNumber}: ${s.action}`).join('\n')} 
                      className="form-textarea"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Severity</label>
                      <select name="severity" className="form-select">
                        <option>Critical</option>
                        <option>High</option>
                        <option selected>Medium</option>
                        <option>Low</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Assignee</label>
                      <input 
                        name="assignedTo" 
                        placeholder="Developer name" 
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowBugModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger">
                    <FiAlertTriangle />
                    Confirm & Log Bug
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="execution-page">
      <div className="page-header-premium">
        <div className="header-content">
          <div className="header-icon">
            <FiPlay />
          </div>
          <div className="header-text">
            <h2 className="section-title">Execution Control</h2>
            <p className="section-subtitle">Manage and execute test runs across environments</p>
          </div>
        </div>
        <button className="btn btn-primary-premium" onClick={() => setShowNewRunModal(true)}>
          <FiPlus />
          <span>New Test Run</span>
        </button>
      </div>

      {testRuns.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <FiPlay />
          </div>
          <h3>No Test Runs Yet</h3>
          <p>Create your first test run to begin executing tests</p>
          <button className="btn btn-primary-premium" onClick={() => setShowNewRunModal(true)}>
            <FiPlus />
            <span>Create Test Run</span>
          </button>
        </div>
      ) : (
        <div className="test-runs-grid">
          {testRuns.map(run => {
            const progress = getProgressPercentage(run);
            return (
              <div key={run._id || run.id} className="test-run-card-premium">
                <div className="card-header">
                  <div className="card-title-group">
                    <div className="run-icon-premium">
                      <FiPlay />
                    </div>
                    <div className="run-info">
                      <h3>{run.name}</h3>
                      <span className="environment-badge">{run.environment}</span>
                    </div>
                  </div>
                  <button 
                    className="btn-icon-premium danger" 
                    onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(run); }}
                  >
                    <FiTrash2 />
                  </button>
                </div>

                <div className="card-progress">
                  <div className="progress-header">
                    <span>Progress</span>
                    <span className="progress-percentage">{progress}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>

                <div className="card-stats-premium">
                  <div className="stat-item passed">
                    <div className="stat-icon"><FiCheckCircle /></div>
                    <div className="stat-content">
                      <span className="stat-value">{run.passed || 0}</span>
                      <span className="stat-label">Passed</span>
                    </div>
                  </div>
                  <div className="stat-item failed">
                    <div className="stat-icon"><FiXCircle /></div>
                    <div className="stat-content">
                      <span className="stat-value">{run.failed || 0}</span>
                      <span className="stat-label">Failed</span>
                    </div>
                  </div>
                  <div className="stat-item blocked">
                    <div className="stat-icon"><FiAlertCircle /></div>
                    <div className="stat-content">
                      <span className="stat-value">{run.blocked || 0}</span>
                      <span className="stat-label">Blocked</span>
                    </div>
                  </div>
                  <div className="stat-item na">
                    <div className="stat-icon"><FiMinusCircle /></div>
                    <div className="stat-content">
                      <span className="stat-value">{run.na || 0}</span>
                      <span className="stat-label">N/A</span>
                    </div>
                  </div>
                </div>

                <div className="card-actions">
                  <button 
                    className="btn-execute" 
                    onClick={() => { setActiveRunId(run._id || run.id); setViewMode('execution'); }}
                  >
                    <FiPlay />
                    <span>Continue Execution</span>
                  </button>
                  <button 
                    className="btn-results" 
                    onClick={() => setShowResultsModal(run)} 
                    title="View Results"
                  >
                    <FiExternalLink />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && (
        <div className="modal-overlay">
          <div className="modal modal-xlarge">
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon results">
                  <FiList />
                </div>
                <div>
                  <h3>{showResultsModal.name}</h3>
                  <p className="modal-subtitle">{showResultsModal.environment} Environment</p>
                </div>
              </div>
              <button className="close-btn" onClick={() => { setShowResultsModal(null); setExecutionResults([]); }}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="results-filter-bar">
                <div className="filter-label">
                  <FiFilter />
                  <span>Filter by Status</span>
                </div>
                <div className="filter-buttons">
                  <button 
                    className={`filter-tag ${resultsFilter === 'All' ? 'active' : ''}`} 
                    onClick={() => setResultsFilter('All')}
                  >
                    All
                    <span className="filter-count">{executionResults.length}</span>
                  </button>
                  <button 
                    className={`filter-tag passed ${resultsFilter === 'Passed' ? 'active' : ''}`} 
                    onClick={() => setResultsFilter('Passed')}
                  >
                    Passed
                  </button>
                  <button 
                    className={`filter-tag failed ${resultsFilter === 'Failed' ? 'active' : ''}`} 
                    onClick={() => setResultsFilter('Failed')}
                  >
                    Failed
                  </button>
                  <button 
                    className={`filter-tag blocked ${resultsFilter === 'Blocked' ? 'active' : ''}`} 
                    onClick={() => setResultsFilter('Blocked')}
                  >
                    Blocked
                  </button>
                  <button 
                    className={`filter-tag na ${resultsFilter === 'N/A' ? 'active' : ''}`} 
                    onClick={() => setResultsFilter('N/A')}
                  >
                    N/A
                  </button>
                </div>
              </div>
              <div className="table-container">
                <table className="data-table-premium">
                  <thead>
                    <tr>
                      <th className="col-id">ID</th>
                      <th className="col-title">Test Case</th>
                      <th className="col-status">Status</th>
                      <th className="col-notes">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((r, i) => (
                      <tr key={i} className={`status-row-${cleanStatus(r.status)}`}>
                        <td>
                          <span className="id-badge">{r.testCase?.adoId || 'TC'}</span>
                        </td>
                        <td className="title-cell">{r.testCase?.title}</td>
                        <td>
                          <span className={`status-badge-premium ${cleanStatus(r.status)}`}>
                            {r.status || 'Not Run'}
                          </span>
                        </td>
                        <td className="notes-cell">
                          {r.comments || <span className="no-notes">No notes</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-primary-premium" 
                onClick={() => { setShowResultsModal(null); setExecutionResults([]); }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal modal-small">
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon danger">
                  <FiTrash2 />
                </div>
                <h3>Delete Test Run</h3>
              </div>
              <button className="close-btn" onClick={() => setShowDeleteConfirm(null)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <p className="confirm-text">
                Are you sure you want to delete <strong>{showDeleteConfirm.name}</strong>? 
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={() => {
                  onDeleteTestRun(showDeleteConfirm._id || showDeleteConfirm.id);
                  setShowDeleteConfirm(null);
                }}
              >
                <FiTrash2 />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Execution;