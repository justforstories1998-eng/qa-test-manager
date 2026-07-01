import React, { useState, useMemo, useEffect } from 'react';
import {
  FiPlay, FiChevronLeft, FiChevronRight, FiCheckCircle, FiXCircle,
  FiAlertCircle, FiClock, FiList, FiPlus, FiX, FiFolder,
  FiHash, FiTarget, FiTrash2, FiMinusCircle, FiCpu, FiMessageSquare,
  FiExternalLink, FiFilter, FiAlertTriangle, FiZap
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../api';
import { Modal, ConfirmDialog } from './shared/Modal';
import Badge from './shared/Badge';

function Execution({
  testSuites = [],
  testCases = [],
  testRuns = [],
  onCreateTestRun,
  onDeleteTestRun,
  onUpdateExecutionResult,
  onRefresh
}) {
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
  // RENDER: LIST VIEW
  // ============================================
  if (viewMode === 'list') {
    return (
      <div className="dg-page">
        <div className="dg-page-header">
          <div>
            <h1 className="dg-page-title">
              <FiZap style={{ marginRight: 8 }} /> Execution Control
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
              Test orchestration &amp; quality metrics
            </p>
          </div>
          <button className="dg-btn dg-btn-primary" onClick={() => setShowNewRunModal(true)}>
            <FiPlus /> New Test Run
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <div className="dg-stat-card">
            <div className="dg-stat-icon"><FiTarget /></div>
            <div>
              <div className="dg-stat-value">{stats.total}</div>
              <div className="dg-stat-label">Total Tests</div>
            </div>
          </div>
          <div className="dg-stat-card">
            <div className="dg-stat-icon"><FiCheckCircle /></div>
            <div>
              <div className="dg-stat-value">{stats.passed}</div>
              <div className="dg-stat-label">Passed</div>
            </div>
          </div>
          <div className="dg-stat-card">
            <div className="dg-stat-icon"><FiXCircle /></div>
            <div>
              <div className="dg-stat-value">{stats.failed}</div>
              <div className="dg-stat-label">Failed</div>
            </div>
          </div>
          <div className="dg-stat-card">
            <div className="dg-stat-icon"><FiAlertCircle /></div>
            <div>
              <div className="dg-stat-value">{stats.blocked}</div>
              <div className="dg-stat-label">Blocked</div>
            </div>
          </div>
        </div>

        {/* Test Runs */}
        {testRuns.length === 0 ? (
          <div className="dg-empty">
            <FiPlay size={48} style={{ opacity: 0.3 }} />
            <h3>No Test Runs Yet</h3>
            <p>Create your first test run to begin tracking execution progress</p>
            <button className="dg-btn dg-btn-primary" onClick={() => setShowNewRunModal(true)}>
              <FiPlus /> Create Test Run
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {testRuns.map((run) => (
              <div key={run._id || run.id} style={{ padding: 20, background: '#fff', border: '1px solid #e7e8ed', borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FiPlay size={18} color="var(--dg-accent)" />
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>{run.name}</h3>
                      <Badge>{run.environment}</Badge>
                    </div>
                  </div>
                  <button
                    className="dg-btn dg-btn-ghost"
                    style={{ padding: '4px 8px', minWidth: 'auto' }}
                    onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(run); }}
                    aria-label="Delete run"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                    <span>Completion</span>
                    <span>{getProgressPercentage(run)}%</span>
                  </div>
                  <div className="dg-progress">
                    <div className="dg-progress-bar" style={{ width: `${getProgressPercentage(run)}%` }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 16, fontSize: '0.8rem' }}>
                  <span style={{ color: '#34d399' }}><FiCheckCircle /> {run.passed || 0} Pass</span>
                  <span style={{ color: '#f87171' }}><FiXCircle /> {run.failed || 0} Fail</span>
                  <span style={{ color: '#fbbf24' }}><FiAlertCircle /> {run.blocked || 0} Block</span>
                  <span style={{ color: 'var(--text-muted)' }}><FiMinusCircle /> {run.na || 0} N/A</span>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="dg-btn dg-btn-primary"
                    style={{ flex: 1 }}
                    onClick={() => { setActiveRunId(run._id || run.id); setViewMode('execution'); }}
                  >
                    <FiPlay /> Continue
                  </button>
                  <button
                    className="dg-btn dg-btn-secondary"
                    onClick={() => setShowResultsModal(run)}
                    aria-label="View results"
                  >
                    <FiExternalLink />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New Run Modal */}
        <Modal
          isOpen={showNewRunModal}
          onClose={() => setShowNewRunModal(false)}
          title="Launch New Mission"
          footer={
            <>
              <button className="dg-btn dg-btn-secondary" onClick={() => setShowNewRunModal(false)}>Cancel</button>
              <button className="dg-btn dg-btn-primary" onClick={handleCreateRunSubmit}>
                <FiPlay /> Launch Mission
              </button>
            </>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div className="dg-input-group">
                <label className="dg-input-label">Run Name</label>
                <input
                  type="text"
                  className="dg-input"
                  placeholder="e.g., Sprint 24 Regression"
                  value={newRunData.name}
                  onChange={e => setNewRunData({ ...newRunData, name: e.target.value })}
                />
              </div>
              <div className="dg-input-group">
                <label className="dg-input-label">Environment</label>
                <select
                  className="dg-select"
                  value={newRunData.environment}
                  onChange={e => setNewRunData({ ...newRunData, environment: e.target.value })}
                >
                  <option value="QA">QA Environment</option>
                  <option value="Staging">Staging Environment</option>
                  <option value="Production">Production</option>
                </select>
              </div>
              <div className="dg-input-group">
                <label className="dg-input-label">Tester (Optional)</label>
                <input
                  type="text"
                  className="dg-input"
                  placeholder="Enter tester name"
                  value={newRunData.tester}
                  onChange={e => setNewRunData({ ...newRunData, tester: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="dg-input-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <FiFolder /> Select Test Suite
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
                {testSuites.map(s => (
                  <div
                    key={s._id || s.id}
                    onClick={() => setSelectedSuiteId(s._id || s.id)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: selectedSuiteId === (s._id || s.id)
                        ? '1px solid var(--dg-accent)'
                        : '1px solid #e7e8ed',
                      background: selectedSuiteId === (s._id || s.id)
                        ? 'rgba(99,102,241,0.1)'
                        : '#f9fafb',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{s.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {testCases.filter(tc => String(tc.suiteId) === String(s._id || s.id)).length} test cases
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(null)}
          onConfirm={async () => {
            await onDeleteTestRun(showDeleteConfirm._id || showDeleteConfirm.id);
            setShowDeleteConfirm(null);
            toast.success("Purged");
          }}
          title="Abort Mission?"
          message={`Are you sure you want to delete "${showDeleteConfirm?.name}"? All execution results will be permanently removed.`}
          confirmLabel="Delete"
        />
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
    <div className="dg-page" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: 0 }}>
      {/* Header */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 24px',
        borderBottom: '1px solid #e7e8ed',
        background: '#ffffff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="dg-btn dg-btn-ghost" onClick={() => setViewMode('list')}>
            <FiChevronLeft /> Back
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{activeRun?.name}</h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
              <Badge>{activeRun?.environment}</Badge>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {completedCount} / {executionResults.length} completed
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="dg-btn dg-btn-ghost" onClick={handleRemoveCase} title="Remove from mission">
            <FiTrash2 />
          </button>
          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{currentTestIndex + 1}</span>
            <span> / {executionResults.length}</span>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar Queue */}
        <aside style={{
          width: 260, minWidth: 260,
          borderRight: '1px solid #e7e8ed',
          background: '#f5f5f9',
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid #e7e8ed',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <FiList /> Test Queue
            </span>
            <span className="dg-badge dg-badge-indigo">{executionResults.length}</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
            {executionResults.map((res, idx) => (
              <div
                key={res.id || res._id || idx}
                onClick={() => setCurrentTestIndex(idx)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  background: idx === currentTestIndex ? 'rgba(99,102,241,0.1)' : 'transparent',
                  border: idx === currentTestIndex ? '1px solid #e7e8ed' : '1px solid transparent',
                  marginBottom: 2, transition: 'all 0.15s'
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 600,
                  background: idx === currentTestIndex ? 'rgba(99,102,241,0.15)' : '#e7e8ed',
                  color: idx === currentTestIndex ? '#6366f1' : 'var(--text-secondary)'
                }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.8rem', color: 'var(--text-primary)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {res.testCase?.title}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {res.status || 'Not Run'}
                  </div>
                </div>
                {idx === currentTestIndex && <FiChevronRight size={14} color="var(--dg-accent)" />}
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            {tc ? (
              <>
                {/* Test Header */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiHash /> {tc.adoId || `TC-${currentTestIndex + 1}`}
                    </span>
                    <Badge>{executionResults[currentTestIndex]?.status || 'Not Run'}</Badge>
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{tc.title}</h2>
                  {tc.description && (
                    <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: '0.9rem' }}>{tc.description}</p>
                  )}
                </div>

                {/* Steps */}
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <FiList /> Test Steps
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                      ({tc.steps?.length || 0} steps)
                    </span>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {tc.steps?.map((s, i) => (
                      <div key={i} style={{ padding: 14, display: 'flex', gap: 12, background: '#fff', border: '1px solid #e7e8ed', borderRadius: 12 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'rgba(99,102,241,0.1)', color: '#6366f1',
                          fontSize: '0.8rem', fontWeight: 600
                        }}>
                          {s.stepNumber || i + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ marginBottom: 8 }}>
                            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Action</span>
                            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{s.action}</p>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Expected Result</span>
                            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.expectedResult}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="dg-input-group">
                  <label className="dg-input-label">
                    <FiMessageSquare style={{ marginRight: 4 }} /> Analyst Notes
                  </label>
                  <textarea
                    className="dg-textarea"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Add observations, defects, or additional context..."
                    rows={4}
                  />
                </div>
              </>
            ) : (
              <div className="dg-empty">
                <div className="dg-spinner" />
                <p>Initializing Stage...</p>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <footer style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 24px',
            borderTop: '1px solid #e7e8ed',
            background: '#ffffff'
          }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                className="dg-btn dg-btn-primary"
                onClick={() => handleQuickStatus('Passed')}
                disabled={isSaving}
                style={{ background: isSaving ? undefined : 'rgba(34,197,94,0.2)', borderColor: 'rgba(34,197,94,0.4)', color: '#22c55e' }}
              >
                <FiCheckCircle /> Pass
              </button>
              <button
                className="dg-btn dg-btn-primary"
                onClick={() => handleQuickStatus('Failed')}
                disabled={isSaving}
                style={{ background: isSaving ? undefined : 'rgba(239,68,68,0.2)', borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444' }}
              >
                <FiXCircle /> Fail
              </button>
              <button
                className="dg-btn dg-btn-primary"
                onClick={() => handleQuickStatus('Blocked')}
                disabled={isSaving}
                style={{ background: isSaving ? undefined : 'rgba(251,191,36,0.2)', borderColor: 'rgba(251,191,36,0.4)', color: '#f59e0b' }}
              >
                <FiAlertCircle /> Block
              </button>
              <button
                className="dg-btn dg-btn-secondary"
                onClick={() => handleQuickStatus('N/A')}
                disabled={isSaving}
              >
                <FiMinusCircle /> N/A
              </button>
              <button className="dg-btn dg-btn-danger" onClick={() => setShowBugModal(true)}>
                <FiAlertTriangle /> Report Bug
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                className="dg-btn dg-btn-ghost"
                onClick={() => setCurrentTestIndex(p => Math.max(0, p - 1))}
                disabled={currentTestIndex === 0}
              >
                <FiChevronLeft />
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', minWidth: 60, textAlign: 'center' }}>
                {currentTestIndex + 1} of {executionResults.length}
              </span>
              <button
                className="dg-btn dg-btn-ghost"
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
      <Modal
        isOpen={!!showResultsModal}
        onClose={() => { setShowResultsModal(null); setExecutionResults([]); }}
        title={`Mission Results: ${showResultsModal?.name || ''}`}
        size="lg"
      >
        <div style={{ marginBottom: 16, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['All', 'Passed', 'Failed', 'Blocked', 'N/A'].map(f => (
            <button
              key={f}
              className={`dg-btn ${resultsFilter === f ? 'dg-btn-primary' : 'dg-btn-ghost'}`}
              onClick={() => setResultsFilter(f)}
              style={{ padding: '4px 12px', fontSize: '0.8rem' }}
            >
              {f}
              {f !== 'All' && (
                <span style={{ marginLeft: 4, opacity: 0.6 }}>
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

        <div className="dg-table-wrapper">
          <table className="dg-table">
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
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.testCase?.adoId || 'TC'}</td>
                  <td>{r.testCase?.title}</td>
                  <td><Badge>{r.status || 'Not Run'}</Badge></td>
                  <td style={{ color: 'var(--text-muted)' }}>{r.comments || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Bug Report Modal */}
      <Modal
        isOpen={showBugModal}
        onClose={() => setShowBugModal(false)}
        title="Report Defect"
        footer={
          <>
            <button className="dg-btn dg-btn-secondary" onClick={() => setShowBugModal(false)}>Cancel</button>
            <button type="submit" form="bug-report-form" className="dg-btn dg-btn-danger">
              <FiAlertTriangle /> Commit Defect
            </button>
          </>
        }
      >
        <form id="bug-report-form" onSubmit={handleReportBug}>
          <div className="dg-input-group">
            <label className="dg-input-label">Bug Title</label>
            <input
              name="title"
              className="dg-input"
              defaultValue={`Defect: ${tc?.title}`}
              required
            />
          </div>
          <div className="dg-input-group">
            <label className="dg-input-label">Steps to Reproduce</label>
            <textarea
              name="description"
              className="dg-textarea"
              rows={4}
              defaultValue={tc?.steps?.map(s => `Step ${s.stepNumber}: ${s.action}`).join('\n')}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="dg-input-group">
              <label className="dg-input-label">Severity</label>
              <select name="severity" className="dg-select">
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <div className="dg-input-group">
              <label className="dg-input-label">Assignee</label>
              <input name="assignedTo" className="dg-input" placeholder="Developer name" />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Execution;
