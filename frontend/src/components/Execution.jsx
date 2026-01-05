import React, { useState, useMemo, useEffect } from 'react';
import {
  FiPlay,
  FiPlus,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiClock,
  FiChevronRight,
  FiChevronLeft,
  FiX,
  FiSave,
  FiTrash2,
  FiMessageSquare,
  FiUser,
  FiMonitor,
  FiHash,
  FiList,
  FiTarget,
  FiInfo,
  FiFolder
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../api';

function Execution({
  testSuites,
  testCases,
  testRuns,
  settings,
  onCreateTestRun,
  onUpdateTestRun,
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
  const [isLoading, setIsLoading] = useState(false);

  const [showNewRunModal, setShowNewRunModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const [currentStatus, setCurrentStatus] = useState('Not Run');
  const [currentComments, setCurrentComments] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const activeRun = useMemo(() => {
    if (!activeRunId || !testRuns) return null;
    return testRuns.find(r => r.id === activeRunId);
  }, [activeRunId, testRuns]);

  const currentTest = useMemo(() => {
    if (!executionResults || executionResults.length === 0) return null;
    return executionResults[currentTestIndex];
  }, [executionResults, currentTestIndex]);

  const executionProgress = useMemo(() => {
    if (!executionResults || executionResults.length === 0) {
      return { total: 0, completed: 0, passed: 0, failed: 0, blocked: 0, notRun: 0, percentage: 0 };
    }

    const counts = {
      total: executionResults.length,
      passed: executionResults.filter(r => r.status === 'Passed').length,
      failed: executionResults.filter(r => r.status === 'Failed').length,
      blocked: executionResults.filter(r => r.status === 'Blocked').length,
      notRun: executionResults.filter(r => r.status === 'Not Run').length
    };

    counts.completed = counts.passed + counts.failed + counts.blocked;
    counts.percentage = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;

    return counts;
  }, [executionResults]);

  const sortedTestRuns = useMemo(() => {
    if (!testRuns) return [];
    return [...testRuns].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
  }, [testRuns]);

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    if (activeRunId) {
      loadExecutionResults(activeRunId);
    }
  }, [activeRunId]);

  useEffect(() => {
    if (currentTest) {
      setCurrentStatus(currentTest.status || 'Not Run');
      setCurrentComments(currentTest.comments || '');
    }
  }, [currentTest]);

  // ============================================
  // API CALLS
  // ============================================

  const loadExecutionResults = async (runId) => {
    setIsLoading(true);
    try {
      const response = await api.getExecutionResults(runId);
      if (response.success) {
        const resultsWithTestCases = response.data.map(result => {
          const testCase = testCases.find(tc => tc.id === result.testCaseId);
          return { ...result, testCase };
        });
        setExecutionResults(resultsWithTestCases);
        setCurrentTestIndex(0);
      }
    } catch (error) {
      console.error('Failed to load execution results:', error);
      toast.error('Failed to load execution results');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleCreateTestRun = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const suiteId = formData.get('suiteId');
    const suiteTestCases = testCases.filter(tc => tc.suiteId === suiteId);

    if (suiteTestCases.length === 0) {
      toast.error('Selected suite has no test cases');
      return;
    }

    const runData = {
      name: formData.get('name'),
      suiteId,
      description: formData.get('description'),
      tester: formData.get('tester'),
      environment: formData.get('environment'),
      buildNumber: formData.get('buildNumber'),
      totalTests: suiteTestCases.length,
      testCaseIds: suiteTestCases.map(tc => tc.id)
    };

    try {
      const newRun = await onCreateTestRun(runData);
      setShowNewRunModal(false);
      setActiveRunId(newRun.id);
      setViewMode('execution');
    } catch (error) {
      console.error('Failed to create test run:', error);
    }
  };

  const handleSaveResult = async () => {
    if (!currentTest) return;

    const requireComments = settings?.execution?.requireCommentsOnFail && currentStatus === 'Failed';
    const requireBlockedComments = settings?.execution?.requireCommentsOnBlocked && currentStatus === 'Blocked';

    if ((requireComments || requireBlockedComments) && !currentComments.trim()) {
      toast.warning(`Comments are required for ${currentStatus.toLowerCase()} tests`);
      return;
    }

    setIsSaving(true);
    try {
      await onUpdateExecutionResult(currentTest.id, {
        status: currentStatus,
        comments: currentComments,
        executedBy: settings?.execution?.defaultTester || 'QA Tester'
      });

      setExecutionResults(prev => prev.map(r =>
        r.id === currentTest.id
          ? { ...r, status: currentStatus, comments: currentComments }
          : r
      ));

      toast.success('Result saved');

      const shouldAdvance =
        (currentStatus === 'Passed' && settings?.execution?.autoAdvanceOnPass) ||
        (currentStatus === 'Failed' && settings?.execution?.autoAdvanceOnFail);

      if (shouldAdvance && currentTestIndex < executionResults.length - 1) {
        setCurrentTestIndex(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to save result:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickStatus = async (status) => {
    setCurrentStatus(status);

    const requireComments =
      (settings?.execution?.requireCommentsOnFail && status === 'Failed') ||
      (settings?.execution?.requireCommentsOnBlocked && status === 'Blocked');

    if (!requireComments && currentTest) {
      setIsSaving(true);
      try {
        await onUpdateExecutionResult(currentTest.id, {
          status,
          comments: currentComments,
          executedBy: settings?.execution?.defaultTester || 'QA Tester'
        });

        setExecutionResults(prev => prev.map(r =>
          r.id === currentTest.id ? { ...r, status } : r
        ));

        if (currentTestIndex < executionResults.length - 1) {
          setTimeout(() => setCurrentTestIndex(prev => prev + 1), 300);
        }
      } catch (error) {
        console.error('Failed to save result:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCompleteRun = async () => {
    if (!activeRun) return;

    try {
      await onUpdateTestRun(activeRun.id, {
        status: 'Completed',
        completedAt: new Date().toISOString()
      });
      toast.success('Test run completed');
      setViewMode('list');
    } catch (error) {
      console.error('Failed to complete run:', error);
    }
  };

  const handleDeleteRun = async (runId) => {
    try {
      await onDeleteTestRun(runId);
      setShowDeleteConfirm(null);
      if (activeRunId === runId) {
        setActiveRunId(null);
        setViewMode('list');
      }
    } catch (error) {
      console.error('Failed to delete run:', error);
    }
  };

  const navigateTest = (direction) => {
    if (direction === 'prev' && currentTestIndex > 0) {
      setCurrentTestIndex(prev => prev - 1);
    } else if (direction === 'next' && currentTestIndex < executionResults.length - 1) {
      setCurrentTestIndex(prev => prev + 1);
    }
  };

  const jumpToTest = (index) => {
    setCurrentTestIndex(index);
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Passed': return <FiCheckCircle className="text-success" />;
      case 'Failed': return <FiXCircle className="text-danger" />;
      case 'Blocked': return <FiAlertCircle className="text-warning" />;
      default: return <FiClock className="text-secondary" />;
    }
  };

  const getRunStatusBadge = (run) => {
    const statusClass = run.status === 'Completed' ? 'completed' :
      run.status === 'In Progress' ? 'in-progress' : 'pending';
    return <span className={`status-badge ${statusClass}`}>{run.status}</span>;
  };

  // ============================================
  // RENDER - LIST VIEW
  // ============================================

  const renderListView = () => (
    <div className="execution-list-view">
      <div className="page-header">
        <div className="header-content">
          <h2 className="section-title">Test Execution</h2>
          <p className="section-description">
            Create and manage test runs, execute tests and track results
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowNewRunModal(true)}>
            <FiPlus size={16} />
            <span>New Test Run</span>
          </button>
        </div>
      </div>

      {sortedTestRuns.length > 0 ? (
        <div className="test-runs-grid">
          {sortedTestRuns.map(run => {
            const suite = testSuites.find(s => s.id === run.suiteId);
            
            return (
              <div key={run.id} className="test-run-card">
                <div className="run-card-header">
                  <h3 className="run-name">{run.name}</h3>
                  {getRunStatusBadge(run)}
                </div>

                <div className="run-card-meta">
                  <span className="meta-item">
                    <FiList size={14} />
                    {suite?.name || 'Unknown Suite'}
                  </span>
                  <span className="meta-item">
                    <FiMonitor size={14} />
                    {run.environment || 'N/A'}
                  </span>
                  <span className="meta-item">
                    <FiUser size={14} />
                    {run.tester || 'Unassigned'}
                  </span>
                </div>

                <div className="run-card-progress">
                  <div className="progress-header">
                    <span>Progress</span>
                    <span>{run.passed + run.failed + run.blocked}/{run.totalTests}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill passed" style={{ width: `${(run.passed / run.totalTests) * 100}%` }} />
                    <div className="progress-fill failed" style={{ width: `${(run.failed / run.totalTests) * 100}%` }} />
                    <div className="progress-fill blocked" style={{ width: `${(run.blocked / run.totalTests) * 100}%` }} />
                  </div>
                  <div className="progress-stats">
                    <span className="stat passed"><FiCheckCircle size={12} /> {run.passed}</span>
                    <span className="stat failed"><FiXCircle size={12} /> {run.failed}</span>
                    <span className="stat blocked"><FiAlertCircle size={12} /> {run.blocked}</span>
                    <span className="stat not-run"><FiClock size={12} /> {run.notRun}</span>
                  </div>
                </div>

                <div className="run-card-footer">
                  <span className="run-date">{formatDate(run.startedAt)}</span>
                  <div className="run-actions">
                    {run.status !== 'Completed' ? (
                      <button className="btn btn-sm btn-primary" onClick={() => { setActiveRunId(run.id); setViewMode('execution'); }}>
                        <FiPlay size={14} /> Continue
                      </button>
                    ) : (
                      <button className="btn btn-sm btn-secondary" onClick={() => { setActiveRunId(run.id); setViewMode('execution'); }}>
                        View Results
                      </button>
                    )}
                    <button className="btn btn-sm btn-danger" onClick={() => setShowDeleteConfirm({ id: run.id, name: run.name })}>
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <FiPlay size={64} />
          <h3>No Test Runs Yet</h3>
          <p>Create a new test run to start executing tests</p>
          <button className="btn btn-primary" onClick={() => setShowNewRunModal(true)}>
            <FiPlus size={16} /> Create First Test Run
          </button>
        </div>
      )}
    </div>
  );

  // ============================================
  // RENDER - EXECUTION VIEW
  // ============================================

  const renderExecutionView = () => {
    const testCase = currentTest?.testCase;
    const steps = testCase?.steps || [];

    return (
      <div className="execution-view">
        {/* Header */}
        <div className="execution-header">
          <div className="execution-header-left">
            <button className="btn btn-secondary btn-sm" onClick={() => setViewMode('list')}>
              <FiChevronLeft size={16} /> Back
            </button>
            <div className="run-info">
              <h2>{activeRun?.name}</h2>
              <span className="run-meta">{activeRun?.environment} • {activeRun?.tester || 'Unassigned'}</span>
            </div>
          </div>

          <div className="execution-header-right">
            <div className="execution-progress-compact">
              <div className="progress-ring">
                <svg viewBox="0 0 36 36">
                  <path className="progress-ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="progress-ring-fill" strokeDasharray={`${executionProgress.percentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span className="progress-percentage">{executionProgress.percentage}%</span>
              </div>
              <div className="progress-counts">
                <span className="count passed">{executionProgress.passed} Passed</span>
                <span className="count failed">{executionProgress.failed} Failed</span>
                <span className="count blocked">{executionProgress.blocked} Blocked</span>
              </div>
            </div>

            {activeRun?.status !== 'Completed' && (
              <button className="btn btn-success" onClick={handleCompleteRun} disabled={executionProgress.notRun === executionProgress.total}>
                <FiCheckCircle size={16} /> Complete Run
              </button>
            )}
          </div>
        </div>

        <div className="execution-content">
          {/* Test List Sidebar */}
          <aside className="test-list-sidebar">
            <div className="sidebar-header">
              <h3>Test Cases</h3>
              <span className="test-count">{currentTestIndex + 1} of {executionResults.length}</span>
            </div>
            <div className="test-list">
              {executionResults.map((result, index) => (
                <div
                  key={result.id}
                  className={`test-list-item ${index === currentTestIndex ? 'active' : ''}`}
                  onClick={() => jumpToTest(index)}
                >
                  <span className="test-status-icon">{getStatusIcon(result.status)}</span>
                  <span className="test-title">{result.testCase?.title || `Test ${index + 1}`}</span>
                </div>
              ))}
            </div>
          </aside>

          {/* Test Execution Panel */}
          <main className="test-execution-panel">
            {isLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading test cases...</p>
              </div>
            ) : currentTest && testCase ? (
              <>
                {/* Navigation */}
                <div className="test-navigation">
                  <button className="nav-btn" onClick={() => navigateTest('prev')} disabled={currentTestIndex === 0}>
                    <FiChevronLeft size={20} /> Previous
                  </button>
                  <span className="nav-indicator">Test {currentTestIndex + 1} of {executionResults.length}</span>
                  <button className="nav-btn" onClick={() => navigateTest('next')} disabled={currentTestIndex === executionResults.length - 1}>
                    Next <FiChevronRight size={20} />
                  </button>
                </div>

                {/* Test Details */}
                <div className="test-details-container">
                  {/* Title Section */}
                  <div className="test-title-section">
                    <div className="test-title-header">
                      <span className="test-id-badge">
                        <FiHash size={12} />
                        {testCase.adoId || `TC-${currentTestIndex + 1}`}
                      </span>
                      <span className={`priority-badge priority-${(testCase.priority || 'medium').toLowerCase()}`}>
                        {testCase.priority || 'Medium'}
                      </span>
                      {testCase.scenarioType && (
                        <span className="scenario-type-badge">{testCase.scenarioType}</span>
                      )}
                    </div>
                    <h2 className="test-title-text">{testCase.title}</h2>
                    <div className="test-meta-row">
                      {testCase.assignedTo && (
                        <span className="meta-tag"><FiUser size={12} /> {testCase.assignedTo}</span>
                      )}
                      {testCase.areaPath && (
                        <span className="meta-tag"><FiFolder size={12} /> {testCase.areaPath}</span>
                      )}
                      {testCase.state && (
                        <span className="meta-tag"><FiInfo size={12} /> {testCase.state}</span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {testCase.description && (
                    <div className="test-info-section">
                      <h4><FiInfo size={16} /> Description</h4>
                      <div className="info-content">{testCase.description}</div>
                    </div>
                  )}

                  {/* Test Steps */}
                  <div className="test-steps-section">
                    <h4><FiList size={16} /> Test Steps <span className="step-count">({steps.length} steps)</span></h4>
                    
                    {steps.length > 0 ? (
                      <div className="steps-container">
                        {steps.map((step, idx) => (
                          <div key={idx} className="step-item">
                            <div className="step-item-header">
                              <span className="step-number">Step {step.stepNumber || idx + 1}</span>
                            </div>
                            <div className="step-item-body">
                              <div className="step-action-box">
                                <div className="step-box-label">
                                  <FiPlay size={12} /> Action
                                </div>
                                <div className="step-box-content">
                                  {step.action || <em className="no-content">No action specified</em>}
                                </div>
                              </div>
                              <div className="step-expected-box">
                                <div className="step-box-label">
                                  <FiTarget size={12} /> Expected Result
                                </div>
                                <div className="step-box-content">
                                  {step.expectedResult || <em className="no-content">No expected result specified</em>}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-steps">
                        <FiInfo size={24} />
                        <p>No test steps defined for this test case</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Execution Controls */}
                <div className="execution-controls">
                  <h4>Set Result</h4>
                  <div className="status-buttons">
                    <button className={`status-btn passed ${currentStatus === 'Passed' ? 'active' : ''}`} onClick={() => handleQuickStatus('Passed')} disabled={isSaving}>
                      <FiCheckCircle size={20} /> Passed
                    </button>
                    <button className={`status-btn failed ${currentStatus === 'Failed' ? 'active' : ''}`} onClick={() => handleQuickStatus('Failed')} disabled={isSaving}>
                      <FiXCircle size={20} /> Failed
                    </button>
                    <button className={`status-btn blocked ${currentStatus === 'Blocked' ? 'active' : ''}`} onClick={() => handleQuickStatus('Blocked')} disabled={isSaving}>
                      <FiAlertCircle size={20} /> Blocked
                    </button>
                    <button className={`status-btn not-run ${currentStatus === 'Not Run' ? 'active' : ''}`} onClick={() => setCurrentStatus('Not Run')} disabled={isSaving}>
                      <FiClock size={20} /> Not Run
                    </button>
                  </div>

                  <div className="comments-section">
                    <label>
                      <FiMessageSquare size={16} /> Comments
                      {(currentStatus === 'Failed' || currentStatus === 'Blocked') && <span className="required">*</span>}
                    </label>
                    <textarea
                      value={currentComments}
                      onChange={(e) => setCurrentComments(e.target.value)}
                      placeholder="Add execution notes, defect links, or observations..."
                      rows={4}
                    />
                  </div>

                  <div className="control-actions">
                    <button className="btn btn-primary btn-lg" onClick={handleSaveResult} disabled={isSaving}>
                      {isSaving ? 'Saving...' : <><FiSave size={18} /> Save Result</>}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <FiAlertCircle size={48} />
                <p>No test case data available</p>
              </div>
            )}
          </main>
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="execution-page">
      {viewMode === 'list' ? renderListView() : renderExecutionView()}

      {/* New Run Modal */}
      {showNewRunModal && (
        <div className="modal-overlay" onClick={() => setShowNewRunModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Test Run</h3>
              <button className="close-btn" onClick={() => setShowNewRunModal(false)}><FiX size={20} /></button>
            </div>
            <form onSubmit={handleCreateTestRun}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Run Name *</label>
                  <input type="text" name="name" placeholder="e.g., Sprint 5 Regression" required />
                </div>
                <div className="form-group">
                  <label>Test Suite *</label>
                  <select name="suiteId" required>
                    <option value="">Select a test suite</option>
                    {testSuites?.map(suite => (
                      <option key={suite.id} value={suite.id}>
                        {suite.name} ({testCases?.filter(tc => tc.suiteId === suite.id).length || 0} tests)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Environment</label>
                    <select name="environment">
                      <option value="Development">Development</option>
                      <option value="QA">QA</option>
                      <option value="Staging">Staging</option>
                      <option value="UAT">UAT</option>
                      <option value="Production">Production</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Build Number</label>
                    <input type="text" name="buildNumber" placeholder="e.g., 1.2.3" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Tester</label>
                  <input type="text" name="tester" placeholder="Tester name" defaultValue={settings?.execution?.defaultTester || ''} />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea name="description" placeholder="Optional description" rows={3} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewRunModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><FiPlay size={16} /> Create & Start</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Test Run</h3>
              <button className="close-btn" onClick={() => setShowDeleteConfirm(null)}><FiX size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="delete-warning">
                <FiAlertCircle size={48} />
                <p>Delete this test run?</p>
                <strong>"{showDeleteConfirm.name}"</strong>
                <p className="warning-text">All execution results will be deleted.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDeleteRun(showDeleteConfirm.id)}>
                <FiTrash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Execution;