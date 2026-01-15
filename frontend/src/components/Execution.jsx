import React, { useState, useMemo, useEffect } from 'react';
import {
  FiPlay, FiChevronLeft, FiChevronRight, FiCheckCircle, FiXCircle, 
  FiAlertCircle, FiClock, FiList, FiPlus, FiX, FiFolder, 
  FiHash, FiTarget, FiTrash2, FiMinusCircle, FiCpu, FiMessageSquare, 
  FiExternalLink, FiFilter, FiAlertTriangle, FiZap, FiLayers,
  FiActivity, FiShield, FiCommand, FiTrendingUp, FiAward,
  FiStar, FiGrid, FiMonitor, FiServer, FiDatabase
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

  const handleCreateTestRun = async (e) => {
    e.preventDefault();
    if (!selectedSuiteId) {
      toast.error("Please select a test suite");
      return;
    }
    if (!newRunData.name.trim()) {
      toast.error("Please enter a run name");
      return;
    }

    try {
      await onCreateTestRun({
        name: newRunData.name,
        environment: newRunData.environment,
        tester: newRunData.tester,
        testSuiteId: selectedSuiteId
      });
      setShowNewRunModal(false);
      setNewRunData({ name: '', environment: 'QA', tester: '' });
      setSelectedSuiteId(null);
      toast.success("Test run created successfully");
    } catch (err) {
      toast.error("Failed to create test run");
    }
  };

  const cleanStatus = (s) => (s || 'notrun').toLowerCase().replace(' ', '').replace('/', '');

  const getProgressPercentage = (run) => {
    const total = (run.passed || 0) + (run.failed || 0) + (run.blocked || 0) + (run.na || 0);
    const completed = (run.passed || 0) + (run.failed || 0);
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getCompletionStats = (run) => {
    const total = (run.passed || 0) + (run.failed || 0) + (run.blocked || 0) + (run.na || 0);
    const executed = (run.passed || 0) + (run.failed || 0) + (run.blocked || 0) + (run.na || 0);
    return { total, executed };
  };

  if (viewMode === 'execution' && activeRun) {
    const tc = currentTest?.testCase;
    const progress = executionResults.length > 0 ? Math.round(((currentTestIndex + 1) / executionResults.length) * 100) : 0;
    const completedCount = executionResults.filter(r => r.status && r.status !== 'Not Run').length;
    
    return (
      <div className="execution-view-ultra">
        {/* Animated Background */}
        <div className="exec-bg-effects">
          <div className="exec-gradient-orb orb-1"></div>
          <div className="exec-gradient-orb orb-2"></div>
          <div className="exec-gradient-orb orb-3"></div>
        </div>

        {/* Header */}
        <header className="exec-header-ultra">
          <div className="exec-header-left">
            <button className="btn-back-ultra" onClick={() => setViewMode('list')}>
              <div className="btn-back-icon">
                <FiChevronLeft />
              </div>
              <span>Back</span>
            </button>
            
            <div className="exec-run-info">
              <div className="run-icon-animated">
                <FiZap />
                <div className="icon-pulse"></div>
              </div>
              <div className="run-details">
                <h1>{activeRun.name}</h1>
                <div className="run-badges">
                  <span className="badge-environment">
                    <FiServer /> {activeRun.environment}
                  </span>
                  <span className="badge-progress">
                    <FiActivity /> {completedCount}/{executionResults.length} Executed
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="exec-header-right">
            <button className="btn-icon-ultra danger" onClick={handleRemoveCase} title="Remove Test">
              <FiTrash2 />
            </button>
            
            <div className="progress-display-ultra">
              <div className="progress-circle-container">
                <svg className="progress-circle" viewBox="0 0 100 100">
                  <circle className="progress-bg" cx="50" cy="50" r="42" />
                  <circle 
                    className="progress-fill" 
                    cx="50" cy="50" r="42" 
                    style={{ strokeDasharray: `${progress * 2.64} 264` }}
                  />
                </svg>
                <div className="progress-center">
                  <span className="progress-number">{currentTestIndex + 1}</span>
                  <span className="progress-divider">/</span>
                  <span className="progress-total">{executionResults.length}</span>
                </div>
              </div>
              <div className="progress-info">
                <span className="progress-label">Current Test</span>
                <span className="progress-percent">{progress}% Complete</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Layout */}
        <div className="exec-layout-ultra">
          {/* Sidebar */}
          <aside className="exec-sidebar-ultra">
            <div className="sidebar-header-ultra">
              <div className="sidebar-title">
                <FiList />
                <span>Test Queue</span>
              </div>
              <div className="queue-badge">{executionResults.length}</div>
            </div>
            
            <div className="test-queue-list">
              {executionResults.map((res, idx) => (
                <div 
                  key={idx} 
                  className={`queue-item ${idx === currentTestIndex ? 'active' : ''} status-${cleanStatus(res.status)}`}
                  onClick={() => setCurrentTestIndex(idx)}
                >
                  <div className="queue-item-number">
                    <span>{idx + 1}</span>
                    <div className="status-glow"></div>
                  </div>
                  <div className="queue-item-content">
                    <span className="queue-item-title">{res.testCase?.title}</span>
                    <span className="queue-item-status">{res.status || 'Pending'}</span>
                  </div>
                  {idx === currentTestIndex && (
                    <div className="active-marker">
                      <FiChevronRight />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <main className="exec-main-ultra">
            <div className="test-content-ultra">
              {tc ? (
                <>
                  {/* Test Header */}
                  <div className="test-header-ultra">
                    <div className="test-header-top">
                      <div className="test-id-ultra">
                        <FiHash />
                        <span>{tc.adoId || 'TC-000'}</span>
                      </div>
                      <div className={`status-indicator-ultra ${cleanStatus(currentTest?.status)}`}>
                        <span className="status-dot"></span>
                        <span>{currentTest?.status || 'Pending'}</span>
                      </div>
                    </div>
                    <h2 className="test-title-ultra">{tc.title}</h2>
                    {tc.description && (
                      <p className="test-desc-ultra">{tc.description}</p>
                    )}
                  </div>

                  {/* Test Steps */}
                  <div className="steps-section-ultra">
                    <div className="steps-header-ultra">
                      <div className="steps-title">
                        <FiCommand />
                        <span>Test Steps</span>
                      </div>
                      <div className="steps-count-badge">{tc.steps?.length || 0} Steps</div>
                    </div>

                    <div className="steps-list-ultra">
                      {tc.steps?.map((s, i) => (
                        <div key={i} className="step-card-ultra">
                          <div className="step-number-ultra">
                            <span>{s.stepNumber}</span>
                          </div>
                          <div className="step-body-ultra">
                            <div className="step-action-section">
                              <div className="step-label">
                                <FiPlay />
                                <span>Action</span>
                              </div>
                              <p className="step-text-ultra">{s.action}</p>
                            </div>
                            <div className="step-expected-section">
                              <div className="step-label">
                                <FiTarget />
                                <span>Expected Result</span>
                              </div>
                              <p className="step-text-ultra">{s.expectedResult}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="notes-section-ultra">
                    <div className="notes-header">
                      <FiMessageSquare />
                      <span>Execution Notes</span>
                    </div>
                    <textarea
                      className="notes-input-ultra"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Add your observations, notes, or any relevant details here..."
                    />
                  </div>
                </>
              ) : (
                <div className="loading-ultra">
                  <div className="loading-spinner-ultra"></div>
                  <span>Loading test data...</span>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="action-bar-ultra">
              <div className="status-actions-ultra">
                <button 
                  className={`status-btn-ultra pass ${isSaving ? 'saving' : ''}`}
                  onClick={() => handleQuickStatus('Passed')}
                  disabled={isSaving}
                >
                  <FiCheckCircle />
                  <span>Pass</span>
                  <div className="btn-shine"></div>
                </button>
                <button 
                  className={`status-btn-ultra fail ${isSaving ? 'saving' : ''}`}
                  onClick={() => handleQuickStatus('Failed')}
                  disabled={isSaving}
                >
                  <FiXCircle />
                  <span>Fail</span>
                  <div className="btn-shine"></div>
                </button>
                <button 
                  className={`status-btn-ultra block ${isSaving ? 'saving' : ''}`}
                  onClick={() => handleQuickStatus('Blocked')}
                  disabled={isSaving}
                >
                  <FiAlertCircle />
                  <span>Block</span>
                  <div className="btn-shine"></div>
                </button>
                <button 
                  className={`status-btn-ultra na ${isSaving ? 'saving' : ''}`}
                  onClick={() => handleQuickStatus('N/A')}
                  disabled={isSaving}
                >
                  <FiMinusCircle />
                  <span>N/A</span>
                  <div className="btn-shine"></div>
                </button>

                <div className="action-separator"></div>

                <button 
                  className="status-btn-ultra bug"
                  onClick={() => setShowBugModal(true)}
                >
                  <FiAlertTriangle />
                  <span>Report Bug</span>
                </button>
              </div>

              <div className="nav-actions-ultra">
                <button 
                  className="nav-btn-ultra"
                  onClick={() => setCurrentTestIndex(p => Math.max(0, p - 1))}
                  disabled={currentTestIndex === 0}
                >
                  <FiChevronLeft />
                </button>
                <div className="nav-counter">
                  <span className="current">{currentTestIndex + 1}</span>
                  <span className="separator">of</span>
                  <span className="total">{executionResults.length}</span>
                </div>
                <button 
                  className="nav-btn-ultra"
                  onClick={() => setCurrentTestIndex(p => Math.min(p + 1, executionResults.length - 1))}
                  disabled={currentTestIndex === executionResults.length - 1}
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          </main>
        </div>

        {/* Bug Modal */}
        {showBugModal && (
          <div className="modal-overlay-ultra">
            <div className="modal-ultra modal-lg">
              <div className="modal-header-ultra">
                <div className="modal-title-ultra">
                  <div className="modal-icon-ultra danger">
                    <FiAlertTriangle />
                  </div>
                  <div>
                    <h3>Report Bug</h3>
                    <p>for: {tc?.title}</p>
                  </div>
                </div>
                <button className="modal-close-ultra" onClick={() => setShowBugModal(false)}>
                  <FiX />
                </button>
              </div>
              <form onSubmit={handleReportBug}>
                <div className="modal-body-ultra">
                  <div className="form-group-ultra">
                    <label>Bug Title</label>
                    <input 
                      type="text"
                      name="title" 
                      defaultValue={`Bug in: ${tc?.title}`} 
                      required 
                      className="input-ultra"
                    />
                  </div>
                  <div className="form-group-ultra">
                    <label>Steps to Reproduce</label>
                    <textarea 
                      name="description" 
                      rows={5} 
                      defaultValue={tc?.steps?.map(s => `Step ${s.stepNumber}: ${s.action}`).join('\n')} 
                      className="textarea-ultra"
                    />
                  </div>
                  <div className="form-row-ultra">
                    <div className="form-group-ultra">
                      <label>Severity</label>
                      <select name="severity" className="select-ultra">
                        <option>Critical</option>
                        <option>High</option>
                        <option selected>Medium</option>
                        <option>Low</option>
                      </select>
                    </div>
                    <div className="form-group-ultra">
                      <label>Assignee</label>
                      <input 
                        type="text"
                        name="assignedTo" 
                        placeholder="Developer name" 
                        className="input-ultra"
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer-ultra">
                  <button type="button" className="btn-ultra secondary" onClick={() => setShowBugModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-ultra danger">
                    <FiAlertTriangle />
                    <span>Log Bug</span>
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
    <div className="execution-dashboard-ultra">
      {/* Background Effects */}
      <div className="dashboard-bg-effects">
        <div className="bg-gradient-1"></div>
        <div className="bg-gradient-2"></div>
        <div className="bg-grid"></div>
      </div>

      {/* Header */}
      <header className="dashboard-header-ultra">
        <div className="header-content-ultra">
          <div className="header-icon-ultra">
            <FiPlay />
            <div className="icon-ring"></div>
          </div>
          <div className="header-text-ultra">
            <h1>Execution Control</h1>
            <p>Manage and execute your test runs with precision</p>
          </div>
        </div>
        <button className="btn-create-ultra" onClick={() => setShowNewRunModal(true)}>
          <FiPlus />
          <span>New Test Run</span>
          <div className="btn-glow"></div>
        </button>
      </header>

      {/* Stats Overview */}
      <div className="stats-overview-ultra">
        <div className="stat-card-ultra">
          <div className="stat-icon-ultra blue">
            <FiFolder />
          </div>
          <div className="stat-info">
            <span className="stat-number">{testRuns.length}</span>
            <span className="stat-label">Total Runs</span>
          </div>
        </div>
        <div className="stat-card-ultra">
          <div className="stat-icon-ultra green">
            <FiCheckCircle />
          </div>
          <div className="stat-info">
            <span className="stat-number">{testRuns.reduce((acc, r) => acc + (r.passed || 0), 0)}</span>
            <span className="stat-label">Tests Passed</span>
          </div>
        </div>
        <div className="stat-card-ultra">
          <div className="stat-icon-ultra red">
            <FiXCircle />
          </div>
          <div className="stat-info">
            <span className="stat-number">{testRuns.reduce((acc, r) => acc + (r.failed || 0), 0)}</span>
            <span className="stat-label">Tests Failed</span>
          </div>
        </div>
        <div className="stat-card-ultra">
          <div className="stat-icon-ultra purple">
            <FiTrendingUp />
          </div>
          <div className="stat-info">
            <span className="stat-number">
              {testRuns.length > 0 ? Math.round(testRuns.reduce((acc, r) => acc + getProgressPercentage(r), 0) / testRuns.length) : 0}%
            </span>
            <span className="stat-label">Avg. Progress</span>
          </div>
        </div>
      </div>

      {/* Test Runs Grid */}
      {testRuns.length === 0 ? (
        <div className="empty-state-ultra">
          <div className="empty-illustration">
            <div className="empty-icon-ultra">
              <FiPlay />
            </div>
            <div className="empty-circles">
              <div className="circle c1"></div>
              <div className="circle c2"></div>
              <div className="circle c3"></div>
            </div>
          </div>
          <h3>No Test Runs Yet</h3>
          <p>Create your first test run to start executing tests and tracking results</p>
          <button className="btn-create-ultra" onClick={() => setShowNewRunModal(true)}>
            <FiPlus />
            <span>Create Test Run</span>
            <div className="btn-glow"></div>
          </button>
        </div>
      ) : (
        <div className="runs-grid-ultra">
          {testRuns.map((run, index) => {
            const progress = getProgressPercentage(run);
            const stats = getCompletionStats(run);
            return (
              <div 
                key={run._id || run.id} 
                className="run-card-ultra"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="card-glow"></div>
                
                <div className="card-header-ultra">
                  <div className="run-icon-ultra">
                    <FiPlay />
                    <div className="icon-pulse-ring"></div>
                  </div>
                  <div className="run-info-ultra">
                    <h3>{run.name}</h3>
                    <div className="run-tags">
                      <span className="tag environment">
                        <FiServer /> {run.environment}
                      </span>
                    </div>
                  </div>
                  <button 
                    className="btn-delete-ultra"
                    onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(run); }}
                  >
                    <FiTrash2 />
                  </button>
                </div>

                <div className="progress-section-ultra">
                  <div className="progress-header">
                    <span>Execution Progress</span>
                    <span className="progress-value">{progress}%</span>
                  </div>
                  <div className="progress-track-ultra">
                    <div 
                      className="progress-fill-ultra" 
                      style={{ width: `${progress}%` }}
                    >
                      <div className="progress-shine"></div>
                    </div>
                  </div>
                </div>

                <div className="stats-grid-ultra">
                  <div className="mini-stat passed">
                    <div className="mini-stat-icon">
                      <FiCheckCircle />
                    </div>
                    <div className="mini-stat-info">
                      <span className="mini-stat-value">{run.passed || 0}</span>
                      <span className="mini-stat-label">Passed</span>
                    </div>
                  </div>
                  <div className="mini-stat failed">
                    <div className="mini-stat-icon">
                      <FiXCircle />
                    </div>
                    <div className="mini-stat-info">
                      <span className="mini-stat-value">{run.failed || 0}</span>
                      <span className="mini-stat-label">Failed</span>
                    </div>
                  </div>
                  <div className="mini-stat blocked">
                    <div className="mini-stat-icon">
                      <FiAlertCircle />
                    </div>
                    <div className="mini-stat-info">
                      <span className="mini-stat-value">{run.blocked || 0}</span>
                      <span className="mini-stat-label">Blocked</span>
                    </div>
                  </div>
                  <div className="mini-stat na">
                    <div className="mini-stat-icon">
                      <FiMinusCircle />
                    </div>
                    <div className="mini-stat-info">
                      <span className="mini-stat-value">{run.na || 0}</span>
                      <span className="mini-stat-label">N/A</span>
                    </div>
                  </div>
                </div>

                <div className="card-actions-ultra">
                  <button 
                    className="btn-execute-ultra"
                    onClick={() => { setActiveRunId(run._id || run.id); setViewMode('execution'); }}
                  >
                    <FiPlay />
                    <span>Continue Execution</span>
                    <div className="btn-shine"></div>
                  </button>
                  <button 
                    className="btn-results-ultra"
                    onClick={() => setShowResultsModal(run)}
                  >
                    <FiExternalLink />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Test Run Modal - THIS WAS MISSING */}
      {showNewRunModal && (
        <div className="modal-overlay-ultra">
          <div className="modal-ultra modal-lg">
            <div className="modal-header-ultra">
              <div className="modal-title-ultra">
                <div className="modal-icon-ultra primary">
                  <FiPlay />
                </div>
                <div>
                  <h3>Create New Test Run</h3>
                  <p>Configure and start a new test execution</p>
                </div>
              </div>
              <button className="modal-close-ultra" onClick={() => {
                setShowNewRunModal(false);
                setNewRunData({ name: '', environment: 'QA', tester: '' });
                setSelectedSuiteId(null);
              }}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleCreateTestRun}>
              <div className="modal-body-ultra">
                <div className="form-group-ultra">
                  <label>Run Name *</label>
                  <input 
                    type="text"
                    value={newRunData.name}
                    onChange={(e) => setNewRunData({ ...newRunData, name: e.target.value })}
                    placeholder="e.g., Sprint 5 Regression Test"
                    required 
                    className="input-ultra"
                  />
                </div>
                
                <div className="form-group-ultra">
                  <label>Test Suite *</label>
                  <select 
                    value={selectedSuiteId || ''}
                    onChange={(e) => setSelectedSuiteId(e.target.value)}
                    required
                    className="select-ultra"
                  >
                    <option value="">Select a test suite...</option>
                    {testSuites.map(suite => (
                      <option key={suite._id || suite.id} value={suite._id || suite.id}>
                        {suite.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row-ultra">
                  <div className="form-group-ultra">
                    <label>Environment</label>
                    <select 
                      value={newRunData.environment}
                      onChange={(e) => setNewRunData({ ...newRunData, environment: e.target.value })}
                      className="select-ultra"
                    >
                      <option value="QA">QA</option>
                      <option value="Staging">Staging</option>
                      <option value="UAT">UAT</option>
                      <option value="Production">Production</option>
                      <option value="Development">Development</option>
                    </select>
                  </div>
                  <div className="form-group-ultra">
                    <label>Tester</label>
                    <input 
                      type="text"
                      value={newRunData.tester}
                      onChange={(e) => setNewRunData({ ...newRunData, tester: e.target.value })}
                      placeholder="Tester name" 
                      className="input-ultra"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer-ultra">
                <button 
                  type="button" 
                  className="btn-ultra secondary" 
                  onClick={() => {
                    setShowNewRunModal(false);
                    setNewRunData({ name: '', environment: 'QA', tester: '' });
                    setSelectedSuiteId(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-ultra primary">
                  <FiPlay />
                  <span>Create Test Run</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && (
        <div className="modal-overlay-ultra">
          <div className="modal-ultra modal-xl">
            <div className="modal-header-ultra">
              <div className="modal-title-ultra">
                <div className="modal-icon-ultra primary">
                  <FiList />
                </div>
                <div>
                  <h3>{showResultsModal.name}</h3>
                  <p>{showResultsModal.environment} Environment</p>
                </div>
              </div>
              <button className="modal-close-ultra" onClick={() => { setShowResultsModal(null); setExecutionResults([]); }}>
                <FiX />
              </button>
            </div>
            <div className="modal-body-ultra">
              <div className="filter-bar-ultra">
                <div className="filter-label">
                  <FiFilter />
                  <span>Filter Results</span>
                </div>
                <div className="filter-chips">
                  {['All', 'Passed', 'Failed', 'Blocked', 'N/A'].map(filter => (
                    <button 
                      key={filter}
                      className={`filter-chip ${filter.toLowerCase().replace('/', '')} ${resultsFilter === filter ? 'active' : ''}`}
                      onClick={() => setResultsFilter(filter)}
                    >
                      {filter}
                      {filter === 'All' && <span className="chip-count">{executionResults.length}</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="results-table-ultra">
                <table>
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
                      <tr key={i} className={`row-${cleanStatus(r.status)}`}>
                        <td>
                          <span className="id-badge-ultra">{r.testCase?.adoId || 'TC'}</span>
                        </td>
                        <td className="title-cell">{r.testCase?.title}</td>
                        <td>
                          <span className={`status-pill-ultra ${cleanStatus(r.status)}`}>
                            {r.status || 'Not Run'}
                          </span>
                        </td>
                        <td className="notes-cell">
                          {r.comments || <span className="no-notes">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer-ultra">
              <button className="btn-ultra primary" onClick={() => { setShowResultsModal(null); setExecutionResults([]); }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay-ultra">
          <div className="modal-ultra modal-sm">
            <div className="modal-header-ultra">
              <div className="modal-title-ultra">
                <div className="modal-icon-ultra danger">
                  <FiTrash2 />
                </div>
                <h3>Delete Test Run</h3>
              </div>
              <button className="modal-close-ultra" onClick={() => setShowDeleteConfirm(null)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body-ultra">
              <p className="confirm-message">
                Are you sure you want to delete <strong>{showDeleteConfirm.name}</strong>? 
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer-ultra">
              <button className="btn-ultra secondary" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </button>
              <button 
                className="btn-ultra danger"
                onClick={() => {
                  onDeleteTestRun(showDeleteConfirm._id || showDeleteConfirm.id);
                  setShowDeleteConfirm(null);
                }}
              >
                <FiTrash2 />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Execution;