import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  FiPlay, FiChevronLeft, FiChevronRight, FiCheckCircle, FiXCircle,
  FiAlertCircle, FiClock, FiList, FiPlus, FiX, FiFolder,
  FiHash, FiTarget, FiTrash2, FiMinusCircle, FiCpu, FiMessageSquare,
  FiExternalLink, FiFilter, FiAlertTriangle, FiZap, FiActivity,
  FiBarChart2, FiLayers, FiShield, FiTrendingUp, FiCalendar,
  FiUser, FiFlag, FiChevronDown, FiArrowRight, FiCheck,
  FiRefreshCw, FiBox, FiStar, FiBookOpen, FiCornerDownRight
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../api';
import { Modal, ConfirmDialog } from './shared/Modal';
import Badge from './shared/Badge';

/* ─────────────── helpers / micro-components ─────────────── */

const statusConfig = {
  passed:  { color: '#22c55e', bg: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.20)',   label: 'Passed',  icon: FiCheckCircle  },
  failed:  { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.20)',   label: 'Failed',  icon: FiXCircle      },
  blocked: { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.20)',  label: 'Blocked', icon: FiAlertCircle  },
  na:      { color: '#64748b', bg: 'rgba(100,116,139,0.10)', border: 'rgba(100,116,139,0.20)', label: 'N/A',     icon: FiMinusCircle  },
  notrun:  { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.15)', label: 'Not Run', icon: FiClock        },
};

const cleanStatus = (s) =>
  (s || 'notrun').toLowerCase().replace(/\s|\//g, '').replace('n/a', 'na');

const StatusPill = ({ status, size = 'sm' }) => {
  const key = cleanStatus(status);
  const cfg = statusConfig[key] || statusConfig.notrun;
  const Icon = cfg.icon;
  const pad = size === 'sm' ? '3px 9px' : '5px 13px';
  const fs  = size === 'sm' ? '11px'    : '13px';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: pad, borderRadius: 6, fontSize: fs, fontWeight: 600,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap', lineHeight: 1,
    }}>
      <Icon size={size === 'sm' ? 11 : 13} />
      {cfg.label}
    </span>
  );
};

const MetricCard = ({ icon: Icon, label, value, color, accent }) => (
  <div style={{
    position: 'relative', padding: '18px 20px', borderRadius: 12,
    background: 'var(--surface-glass)', border: '1px solid var(--border-color)',
    overflow: 'hidden', transition: 'all 0.2s',
  }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}30`; e.currentTarget.style.background = 'var(--surface-glass-hover)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--surface-glass)'; }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, ${color}00)` }} />
    <div style={{
      width: 36, height: 36, borderRadius: 9, marginBottom: 12,
      background: `${color}15`, border: `1px solid ${color}20`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={17} style={{ color }} />
    </div>
    <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.5px' }}>{value}</div>
    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>{label}</div>
  </div>
);

const ProgressRing = ({ pct, size = 48, stroke = 4, color = '#6366f1' }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
        strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`} style={{ transition: 'stroke-dasharray 0.6s ease' }} />
    </svg>
  );
};

/* ─────────────── main component ─────────────── */

function Execution({
  testSuites = [], testCases = [], testRuns = [],
  onCreateTestRun, onDeleteTestRun, onUpdateExecutionResult, onRefresh,
}) {
  const [activeRunId,       setActiveRunId]       = useState(null);
  const [executionResults,  setExecutionResults]  = useState([]);
  const [currentTestIndex,  setCurrentTestIndex]  = useState(0);
  const [viewMode,          setViewMode]          = useState('list');
  const [isSaving,          setIsSaving]          = useState(false);
  const [showNewRunModal,   setShowNewRunModal]   = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showResultsModal,  setShowResultsModal]  = useState(null);
  const [showBugModal,      setShowBugModal]      = useState(false);
  const [comments,          setComments]          = useState('');
  const [newRunData,        setNewRunData]        = useState({ name: '', environment: 'QA', tester: '' });
  const [selectedSuiteId,   setSelectedSuiteId]  = useState(null);
  const [resultsFilter,     setResultsFilter]    = useState('All');
  const [hoveredRunId,      setHoveredRunId]     = useState(null);
  const [sidebarFilter,     setSidebarFilter]    = useState('all');

  /* derived */
  const activeRun = useMemo(
    () => testRuns.find(r => (r._id === activeRunId || r.id === activeRunId)),
    [activeRunId, testRuns],
  );
  const currentResult = executionResults[currentTestIndex];
  const tc            = currentResult?.testCase;
  const currentStatus = cleanStatus(currentResult?.status);

  const completedCount = executionResults.filter(r => cleanStatus(r.status) !== 'notrun').length;

  const filteredSidebarResults = useMemo(() => {
    if (sidebarFilter === 'all') return executionResults;
    return executionResults.filter(r => cleanStatus(r.status) === sidebarFilter);
  }, [executionResults, sidebarFilter]);

  const filteredResults = useMemo(() => {
    if (resultsFilter === 'All') return executionResults;
    return executionResults.filter(r => {
      const st = cleanStatus(r.status);
      if (resultsFilter === 'Passed')  return st === 'passed';
      if (resultsFilter === 'Failed')  return st === 'failed';
      if (resultsFilter === 'Blocked') return st === 'blocked';
      if (resultsFilter === 'N/A')     return st === 'na' || st === 'notrun';
      return true;
    });
  }, [executionResults, resultsFilter]);

  const globalStats = useMemo(() => testRuns.reduce((acc, run) => ({
    total:   acc.total   + (run.totalTests || 0),
    passed:  acc.passed  + (run.passed  || 0),
    failed:  acc.failed  + (run.failed  || 0),
    blocked: acc.blocked + (run.blocked || 0),
  }), { total: 0, passed: 0, failed: 0, blocked: 0 }), [testRuns]);

  const getProgress = (run) => {
    if (!run?.totalTests) return 0;
    const done = (run.passed || 0) + (run.failed || 0) + (run.blocked || 0) + (run.na || 0);
    return Math.round((done / run.totalTests) * 100);
  };

  /* data fetching */
  const loadResults = useCallback(async (runId) => {
    try {
      const res = await api.getExecutionResults(runId);
      if (res.success) {
        const merged = res.data.map(r => ({
          ...r,
          testCase: testCases.find(tc => String(tc._id || tc.id) === String(r.testCaseId)),
        }));
        const valid = merged.filter(r => r.testCase);
        if (merged.length > 0 && valid.length === 0) onRefresh?.();
        setExecutionResults(valid);
      }
    } catch (e) { console.error(e); }
  }, [testCases, onRefresh]);

  useEffect(() => { if (activeRunId) loadResults(activeRunId); }, [activeRunId, loadResults]);
  useEffect(() => { if (showResultsModal) loadResults(showResultsModal._id || showResultsModal.id); }, [showResultsModal, loadResults]);
  useEffect(() => {
    if (executionResults[currentTestIndex]) setComments(executionResults[currentTestIndex].comments || '');
  }, [currentTestIndex, executionResults]);

  /* actions */
  const handleQuickStatus = async (status) => {
    if (!currentResult) return;
    setIsSaving(true);
    try {
      const resultId = currentResult._id || currentResult.id;
      await onUpdateExecutionResult(resultId, { status, comments, executedBy: 'QA Tester' });
      const updated = [...executionResults];
      updated[currentTestIndex] = { ...updated[currentTestIndex], status, comments };
      setExecutionResults(updated);
      if (currentTestIndex < executionResults.length - 1) {
        setCurrentTestIndex(p => p + 1);
      } else {
        toast.success('🎉 All test cases completed!');
      }
    } catch { toast.error('Failed to save result'); }
    finally { setIsSaving(false); }
  };

  const handleRemoveCase = async () => {
    if (!currentResult) return;
    if (!window.confirm('Remove this test case from the current run?')) return;
    try {
      await api.deleteExecutionResult(currentResult._id || currentResult.id);
      const next = executionResults.filter((_, i) => i !== currentTestIndex);
      setExecutionResults(next);
      if (currentTestIndex >= next.length) setCurrentTestIndex(Math.max(0, next.length - 1));
      toast.success('Removed');
    } catch { toast.error('Failed'); }
  };

  const handleReportBug = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    formData.append('projectId', activeRun?.projectId);
    if (tc?._id || tc?.id) formData.append('testCaseId', tc._id || tc.id);
    try {
      const res = await api.createBug(formData);
      if (res.success) { toast.success('Bug reported'); setShowBugModal(false); }
    } catch { toast.error('Failed to report bug'); }
  };

  const handleCreateRun = async (e) => {
    e.preventDefault();
    if (!newRunData.name || !selectedSuiteId) return toast.error('Name and suite are required');
    const cases = testCases.filter(tc => String(tc.suiteId) === String(selectedSuiteId));
    try {
      const newRun = await onCreateTestRun({
        ...newRunData,
        testCaseIds: cases.map(tc => tc._id || tc.id),
        totalTests: cases.length,
      });
      if (newRun) {
        setShowNewRunModal(false);
        setActiveRunId(newRun._id || newRun.id);
        setCurrentTestIndex(0);
        setViewMode('execution');
        toast.success('Test run created');
      }
    } catch { toast.error('Failed to create run'); }
  };

  /* ═══════════════════ LIST VIEW ═══════════════════ */
  if (viewMode === 'list') {
    const passRate = globalStats.total > 0
      ? Math.round((globalStats.passed / globalStats.total) * 100) : 0;

    return (
      <div className="dg-page" style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%', overflow: 'auto' }}>

        {/* ── Header ── */}
        <div style={{ padding: '28px 32px 24px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 11,
                background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
                border: '1px solid rgba(99,102,241,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FiZap size={19} style={{ color: '#818cf8' }} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                  Execution
                </h1>
                <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-tertiary)' }}>
                  Manage and track test run progress
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowNewRunModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                border: 'none', color: '#fff', cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(99,102,241,0.3)', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.45)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(99,102,241,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <FiPlus size={15} /> New Test Run
            </button>
          </div>
        </div>

        <div style={{ padding: '24px 32px 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── Metric cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <MetricCard icon={FiTarget}       label="Total Tests" value={globalStats.total}   color="#818cf8" />
            <MetricCard icon={FiCheckCircle}  label="Passed"      value={globalStats.passed}  color="#22c55e" />
            <MetricCard icon={FiXCircle}      label="Failed"      value={globalStats.failed}  color="#ef4444" />
            <MetricCard icon={FiAlertCircle}  label="Blocked"     value={globalStats.blocked} color="#f59e0b" />
          </div>

          {/* ── Overall progress bar ── */}
          {globalStats.total > 0 && (
            <div style={{
              padding: '16px 20px', borderRadius: 12,
              background: 'var(--surface-glass)', border: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <FiShield size={18} style={{ color: '#818cf8' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Overall Pass Rate</span>
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    color: passRate >= 80 ? '#22c55e' : passRate >= 50 ? '#f59e0b' : '#ef4444',
                  }}>{passRate}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.04)', overflow: 'hidden', display: 'flex' }}>
                  {[
                    { val: globalStats.passed,  color: '#22c55e' },
                    { val: globalStats.failed,  color: '#ef4444' },
                    { val: globalStats.blocked, color: '#f59e0b' },
                  ].map((seg, i) => (
                    <div key={i} style={{
                      width: `${(seg.val / globalStats.total) * 100}%`,
                      background: seg.color, transition: 'width 0.6s ease',
                    }} />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                  {[
                    { label: 'Passed',  color: '#22c55e', val: globalStats.passed },
                    { label: 'Failed',  color: '#ef4444', val: globalStats.failed },
                    { label: 'Blocked', color: '#f59e0b', val: globalStats.blocked },
                  ].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
                      <span style={{ width: 6, height: 6, borderRadius: 2, background: l.color, flexShrink: 0 }} />
                      {l.label}: {l.val}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Run cards ── */}
          {testRuns.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '80px 40px', textAlign: 'center',
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20, marginBottom: 20,
                background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.08))',
                border: '1px solid rgba(99,102,241,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FiPlay size={30} style={{ color: 'rgba(129,140,248,0.4)' }} />
              </div>
              <h3 style={{ color: 'var(--text-primary)', margin: '0 0 8px', fontSize: 17, fontWeight: 600 }}>
                No Test Runs Yet
              </h3>
              <p style={{ color: 'var(--text-tertiary)', margin: '0 0 24px', fontSize: 14, maxWidth: 360, lineHeight: 1.6 }}>
                Create your first test run to begin tracking execution progress across your test suites.
              </p>
              <button
                onClick={() => setShowNewRunModal(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '10px 20px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                  background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                  border: 'none', color: '#fff', cursor: 'pointer',
                  boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
                }}
              >
                <FiPlus size={15} /> Create Test Run
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {testRuns.map((run) => {
                const runId   = run._id || run.id;
                const pct     = getProgress(run);
                const isHov   = hoveredRunId === runId;
                const passClr = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
                const statusLabel = run.status === 'In Progress' ? 'In Progress' : pct === 100 ? 'Completed' : 'Pending';
                const statusClr   = run.status === 'In Progress' ? '#f59e0b' : pct === 100 ? '#22c55e' : 'var(--text-muted)';

                return (
                  <div
                    key={runId}
                    style={{
                      borderRadius: 14, overflow: 'hidden',
                      background: 'var(--surface-glass)',
                      border: isHov ? '1px solid rgba(99,102,241,0.2)' : '1px solid var(--border-color)',
                      transition: 'all 0.2s', cursor: 'default',
                    }}
                    onMouseEnter={() => setHoveredRunId(runId)}
                    onMouseLeave={() => setHoveredRunId(null)}
                  >
                    {/* Card top accent */}
                    <div style={{ height: 3, background: `linear-gradient(90deg, ${passClr}80, ${passClr}00)` }} />

                    <div style={{ padding: 20 }}>
                      {/* Run header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                              color: statusClr, background: `${statusClr}15`,
                              textTransform: 'uppercase', letterSpacing: '0.6px',
                            }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusClr }} />
                              {statusLabel}
                            </span>
                            <span style={{
                              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                              color: 'rgba(129,140,248,0.8)',
                              background: 'rgba(99,102,241,0.1)',
                              textTransform: 'uppercase', letterSpacing: '0.6px',
                            }}>
                              {run.environment}
                            </span>
                          </div>
                          <h3 style={{
                            margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)',
                            lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {run.name}
                          </h3>
                          {run.tester && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, fontSize: 12, color: 'var(--text-muted)' }}>
                              <FiUser size={11} /> {run.tester}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                          <ProgressRing pct={pct} size={42} stroke={3} color={passClr} />
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(run); }}
                            title="Delete run"
                            style={{
                              background: 'none', border: 'none', color: 'var(--text-muted)',
                              cursor: 'pointer', padding: 5, borderRadius: 6, display: 'flex',
                              alignItems: 'center', transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Stats row */}
                      <div style={{
                        display: 'flex', gap: 0, marginBottom: 16,
                        background: 'var(--surface-secondary)', borderRadius: 8,
                        border: '1px solid var(--border-color)', overflow: 'hidden',
                      }}>
                        {[
                          { label: 'Pass',  value: run.passed  || 0, color: '#22c55e' },
                          { label: 'Fail',  value: run.failed  || 0, color: '#ef4444' },
                          { label: 'Block', value: run.blocked || 0, color: '#f59e0b' },
                          { label: 'N/A',   value: run.na      || 0, color: '#64748b' },
                        ].map((s, i, arr) => (
                          <div key={s.label} style={{
                            flex: 1, padding: '10px 8px', textAlign: 'center',
                            borderRight: i < arr.length - 1 ? '1px solid var(--border-color)' : 'none',
                          }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Progress bar */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                          <span>{run.totalTests || 0} total cases</span>
                          <span style={{ fontWeight: 600, color: passClr }}>{pct}%</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)', overflow: 'hidden', display: 'flex' }}>
                          <div style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${passClr}80, ${passClr})`, transition: 'width 0.5s ease', borderRadius: 3 }} />
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => { setActiveRunId(runId); setCurrentTestIndex(0); setViewMode('execution'); }}
                          style={{
                            flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            padding: '9px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                            background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                            border: 'none', color: '#fff', cursor: 'pointer',
                            boxShadow: '0 2px 10px rgba(99,102,241,0.25)', transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.4)'; }}
                          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(99,102,241,0.25)'; }}
                        >
                          <FiPlay size={13} /> {pct === 0 ? 'Start' : pct === 100 ? 'Review' : 'Continue'}
                        </button>
                        <button
                          onClick={() => setShowResultsModal(run)}
                          title="View results"
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            padding: '9px 12px', borderRadius: 8, fontSize: 13,
                            background: 'var(--surface-glass)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-glass-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-glass)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >
                          <FiBarChart2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── New Run Modal ── */}
        <Modal
          isOpen={showNewRunModal}
          onClose={() => setShowNewRunModal(false)}
          title={null}
          size="lg"
          footer={
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
              <button
                type="button"
                onClick={() => setShowNewRunModal(false)}
                style={{
                  padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 500,
                  background: 'var(--surface-glass)', border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                }}
              >Cancel</button>
              <button
                type="submit"
                form="new-run-form"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '9px 20px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                  background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                  border: 'none', color: '#fff', cursor: 'pointer',
                  boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
                }}
              >
                <FiPlay size={14} /> Create Run
              </button>
            </div>
          }
        >
          <form id="new-run-form" onSubmit={handleCreateRun}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>New Test Run</h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-tertiary)' }}>Configure your run parameters below.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Left column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Run Name', name: 'name', placeholder: 'e.g. Sprint 24 Regression', required: true, value: newRunData.name, onChange: v => setNewRunData(p => ({ ...p, name: v })) },
                  { label: 'Tester', name: 'tester', placeholder: 'Optional', required: false, value: newRunData.tester, onChange: v => setNewRunData(p => ({ ...p, tester: v })) },
                ].map(f => (
                  <div key={f.name}>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                      {f.label} {f.required && <span style={{ color: '#f87171' }}>*</span>}
                    </label>
                    <input
                      value={f.value}
                      onChange={e => f.onChange(e.target.value)}
                      placeholder={f.placeholder}
                      required={f.required}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 9,
                        border: '1px solid var(--border-color)', background: 'var(--surface-glass)',
                        color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                    Environment
                  </label>
                  <select
                    value={newRunData.environment}
                    onChange={e => setNewRunData(p => ({ ...p, environment: e.target.value }))}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 9,
                      border: '1px solid var(--border-color)', background: 'var(--surface-glass)',
                      color: 'var(--text-primary)', fontSize: 13, outline: 'none', cursor: 'pointer', boxSizing: 'border-box',
                    }}
                  >
                    {['QA', 'Staging', 'Production', 'Development'].map(env => (
                      <option key={env} value={env}>{env}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Suite picker */}
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Test Suite <span style={{ color: '#f87171' }}>*</span>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                  {testSuites.map(s => {
                    const sid = s._id || s.id;
                    const isSelected = selectedSuiteId === sid;
                    const count = testCases.filter(tc => String(tc.suiteId) === String(sid)).length;
                    return (
                      <button
                        key={sid} type="button"
                        onClick={() => setSelectedSuiteId(sid)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px', borderRadius: 9, textAlign: 'left', cursor: 'pointer',
                          background: isSelected ? 'rgba(99,102,241,0.1)' : 'var(--surface-glass)',
                          border: isSelected ? '1px solid rgba(99,102,241,0.3)' : '1px solid var(--border-color)',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{
                          width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                          background: isSelected ? 'rgba(99,102,241,0.15)' : 'var(--surface-secondary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <FiFolder size={14} style={{ color: isSelected ? '#818cf8' : 'var(--text-muted)' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: isSelected ? '#c7d2fe' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {s.name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                            {count} test case{count !== 1 ? 's' : ''}
                          </div>
                        </div>
                        {isSelected && <FiCheck size={14} style={{ color: '#818cf8', flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </form>
        </Modal>

        {/* Delete confirm */}
        <ConfirmDialog
          isOpen={!!showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(null)}
          title="Delete Test Run"
          message={
            <div>
              <p style={{ color: 'var(--text-secondary)', margin: '0 0 10px', fontSize: 14 }}>
                Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>"{showDeleteConfirm?.name}"</strong>?
              </p>
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px',
                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8,
              }}>
                <FiAlertTriangle size={14} style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }} />
                <span style={{ color: '#f87171', fontSize: 13, lineHeight: 1.5 }}>
                  All execution results will be permanently removed.
                </span>
              </div>
            </div>
          }
          confirmLabel="Delete Run"
          danger
          onConfirm={async () => {
            await onDeleteTestRun(showDeleteConfirm._id || showDeleteConfirm.id);
            setShowDeleteConfirm(null);
            toast.success('Test run deleted');
          }}
        />
      </div>
    );
  }

  /* ═══════════════════ EXECUTION VIEW ═══════════════════ */

  const overallPct = executionResults.length > 0
    ? Math.round((completedCount / executionResults.length) * 100) : 0;

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 9, boxSizing: 'border-box',
    border: '1px solid var(--border-color)', background: 'var(--surface-glass)',
    color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit', transition: 'all 0.2s',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-app)', overflow: 'hidden' }}>

      {/* ── Execution header ── */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 24px', height: 56, flexShrink: 0,
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--surface-secondary)',
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => setViewMode('list')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500,
              background: 'var(--surface-glass)', border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--surface-glass-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--surface-glass)'; }}
          >
            <FiChevronLeft size={14} /> Runs
          </button>
          <div style={{ width: 1, height: 20, background: 'var(--border-color)' }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {activeRun?.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 4,
                color: 'rgba(129,140,248,0.8)', background: 'rgba(99,102,241,0.1)',
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                {activeRun?.environment}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {completedCount} / {executionResults.length} completed
              </span>
            </div>
          </div>
        </div>

        {/* Center progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 180, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              width: `${overallPct}%`,
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              transition: 'width 0.4s ease',
            }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#818cf8', minWidth: 32 }}>{overallPct}%</span>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', padding: '5px 10px', borderRadius: 7, background: 'var(--surface-glass)', border: '1px solid var(--border-color)' }}>
            <FiHash size={12} />
            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {currentTestIndex + 1}
            </span>
            <span>/</span>
            <span>{executionResults.length}</span>
          </div>
          <button
            onClick={handleRemoveCase}
            title="Remove test from run"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '6px 10px', borderRadius: 7, fontSize: 12,
              background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.12)',
              color: 'rgba(248,113,113,0.6)', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(248,113,113,0.6)'; e.currentTarget.style.background = 'rgba(248,113,113,0.06)'; }}
          >
            <FiTrash2 size={13} />
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar queue */}
        <aside style={{
          width: 256, flexShrink: 0,
          borderRight: '1px solid var(--border-color)',
          background: 'var(--surface-secondary)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Sidebar header */}
          <div style={{
            padding: '12px 14px', borderBottom: '1px solid var(--border-color)',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                <FiList size={12} /> Queue
              </span>
              <span style={{
                background: 'rgba(99,102,241,0.12)', color: '#818cf8',
                padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700,
              }}>
                {executionResults.length}
              </span>
            </div>
            {/* Mini filter tabs */}
            <div style={{ display: 'flex', gap: 4 }}>
              {['all', 'notrun', 'passed', 'failed'].map(f => (
                <button
                  key={f}
                  onClick={() => setSidebarFilter(f)}
                  style={{
                    flex: 1, padding: '4px 0', borderRadius: 5, fontSize: 10, fontWeight: 600,
                    border: 'none', cursor: 'pointer', textTransform: 'capitalize',
                    background: sidebarFilter === f ? 'rgba(99,102,241,0.15)' : 'transparent',
                    color: sidebarFilter === f ? '#a5b4fc' : 'var(--text-muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  {f === 'notrun' ? '—' : f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Test list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
            {filteredSidebarResults.map((res, idx) => {
              const globalIdx = executionResults.indexOf(res);
              const isCurrent = globalIdx === currentTestIndex;
              const st = cleanStatus(res.status);
              const cfg = statusConfig[st] || statusConfig.notrun;
              return (
                <button
                  key={res._id || res.id || idx}
                  type="button"
                  onClick={() => setCurrentTestIndex(globalIdx)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                    padding: '9px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: isCurrent ? 'rgba(99,102,241,0.1)' : 'transparent',
                    transition: 'all 0.15s', marginBottom: 2,
                    outline: isCurrent ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                  }}
                  onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = 'var(--surface-glass-hover)'; }}
                  onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isCurrent ? 'rgba(99,102,241,0.15)' : `${cfg.color}12`,
                    border: `1px solid ${isCurrent ? 'rgba(99,102,241,0.2)' : cfg.border}`,
                    fontSize: 10, fontWeight: 700,
                    color: isCurrent ? '#818cf8' : cfg.color,
                  }}>
                    {globalIdx + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, fontWeight: isCurrent ? 500 : 400,
                      color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {res.testCase?.title || `Test Case ${globalIdx + 1}`}
                    </div>
                    <div style={{ marginTop: 2 }}>
                      <StatusPill status={res.status} size="xs" />
                    </div>
                  </div>
                  {isCurrent && <FiArrowRight size={12} style={{ color: '#818cf8', flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Main execution area ── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
            {tc ? (
              <>
                {/* Test case header */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{
                      fontFamily: 'monospace', fontSize: 11, padding: '3px 9px', borderRadius: 5,
                      background: 'var(--surface-glass)', border: '1px solid var(--border-color)',
                      color: 'var(--text-muted)',
                    }}>
                      {tc.adoId || `TC-${String(currentTestIndex + 1).padStart(3, '0')}`}
                    </span>
                    <StatusPill status={currentResult?.status} size="md" />
                    {tc.priority && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 5,
                        color: tc.priority === 'Critical' ? '#ef4444' : tc.priority === 'High' ? '#f59e0b' : '#818cf8',
                        background: tc.priority === 'Critical' ? 'rgba(239,68,68,0.1)' : tc.priority === 'High' ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)',
                        border: tc.priority === 'Critical' ? '1px solid rgba(239,68,68,0.2)' : tc.priority === 'High' ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(99,102,241,0.2)',
                      }}>
                        {tc.priority}
                      </span>
                    )}
                  </div>
                  <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, letterSpacing: '-0.3px' }}>
                    {tc.title}
                  </h2>
                  {tc.description && (
                    <p style={{ color: 'var(--text-tertiary)', margin: 0, fontSize: 14, lineHeight: 1.6 }}>
                      {tc.description}
                    </p>
                  )}
                </div>

                {/* Steps */}
                {tc.steps?.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
                    }}>
                      <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: 7 }}>
                        <FiList size={13} style={{ color: '#818cf8' }} />
                        Test Steps
                      </h3>
                      <span style={{
                        background: 'rgba(99,102,241,0.12)', color: '#818cf8',
                        padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                      }}>
                        {tc.steps.length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {tc.steps.map((s, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex', gap: 14, padding: '14px 16px',
                            background: 'var(--surface-glass)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 10, transition: 'all 0.15s',
                          }}
                        >
                          <div style={{
                            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
                            border: '1px solid rgba(99,102,241,0.15)',
                            color: '#a5b4fc', fontSize: 12, fontWeight: 700,
                          }}>
                            {s.stepNumber || i + 1}
                          </div>
                          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: 4 }}>
                                Action
                              </div>
                              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{s.action || '—'}</p>
                            </div>
                            <div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: 4 }}>
                                Expected Result
                              </div>
                              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{s.expectedResult || '—'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8,
                    fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.8px',
                  }}>
                    <FiMessageSquare size={13} style={{ color: '#818cf8' }} />
                    Tester Notes
                  </label>
                  <textarea
                    value={comments}
                    onChange={e => setComments(e.target.value)}
                    placeholder="Add observations, reproduction steps, or context…"
                    rows={4}
                    style={{
                      ...inputStyle, resize: 'vertical', lineHeight: 1.6,
                    }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
                <FiRefreshCw size={28} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite', opacity: 0.3 }} />
                <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>Loading test case…</p>
              </div>
            )}
          </div>

          {/* ── Action footer ── */}
          <footer style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 32px', flexShrink: 0,
            borderTop: '1px solid var(--border-color)',
            background: 'var(--surface-secondary)',
          }}>
            {/* Status buttons */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'Pass',    status: 'Passed',  color: '#22c55e', icon: FiCheckCircle },
                { label: 'Fail',    status: 'Failed',  color: '#ef4444', icon: FiXCircle    },
                { label: 'Block',   status: 'Blocked', color: '#f59e0b', icon: FiAlertCircle },
                { label: 'N/A',     status: 'N/A',     color: '#64748b', icon: FiMinusCircle },
              ].map(btn => {
                const Icon = btn.icon;
                return (
                  <button
                    key={btn.status}
                    onClick={() => handleQuickStatus(btn.status)}
                    disabled={isSaving}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      background: `${btn.color}12`, border: `1px solid ${btn.color}30`,
                      color: btn.color, cursor: isSaving ? 'not-allowed' : 'pointer',
                      opacity: isSaving ? 0.5 : 1, transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!isSaving) { e.currentTarget.style.background = `${btn.color}20`; e.currentTarget.style.borderColor = `${btn.color}50`; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${btn.color}12`; e.currentTarget.style.borderColor = `${btn.color}30`; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <Icon size={14} /> {btn.label}
                  </button>
                );
              })}
              <button
                onClick={() => setShowBugModal(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  color: '#f87171', cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.14)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <FiFlag size={14} /> Report Bug
              </button>
            </div>

            {/* Navigator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => setCurrentTestIndex(p => Math.max(0, p - 1))}
                disabled={currentTestIndex === 0}
                style={{
                  width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border-color)',
                  background: 'var(--surface-glass)',
                  color: currentTestIndex === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
                  cursor: currentTestIndex === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                }}
              >
                <FiChevronLeft size={16} />
              </button>
              <span style={{
                padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                background: 'var(--surface-glass)', border: '1px solid var(--border-color)',
                color: '#818cf8', minWidth: 56, textAlign: 'center',
              }}>
                {currentTestIndex + 1} / {executionResults.length}
              </span>
              <button
                onClick={() => setCurrentTestIndex(p => Math.min(p + 1, executionResults.length - 1))}
                disabled={currentTestIndex === executionResults.length - 1}
                style={{
                  width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border-color)',
                  background: 'var(--surface-glass)',
                  color: currentTestIndex === executionResults.length - 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                  cursor: currentTestIndex === executionResults.length - 1 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                }}
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </footer>
        </main>
      </div>

      {/* ── Results Modal ── */}
      <Modal
        isOpen={!!showResultsModal}
        onClose={() => { setShowResultsModal(null); setExecutionResults([]); }}
        title={null}
        size="lg"
      >
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            {showResultsModal?.name}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-tertiary)' }}>Execution results overview</p>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, padding: '6px', background: 'var(--surface-glass)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
          {['All', 'Passed', 'Failed', 'Blocked', 'N/A'].map(f => {
            const count = f === 'All' ? executionResults.length : executionResults.filter(r => {
              const st = cleanStatus(r.status);
              if (f === 'Passed')  return st === 'passed';
              if (f === 'Failed')  return st === 'failed';
              if (f === 'Blocked') return st === 'blocked';
              if (f === 'N/A')     return st === 'na' || st === 'notrun';
              return true;
            }).length;
            const isActive = resultsFilter === f;
            return (
              <button
                key={f}
                onClick={() => setResultsFilter(f)}
                style={{
                  flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  padding: '7px 10px', borderRadius: 7, fontSize: 12, fontWeight: isActive ? 600 : 500,
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: isActive ? '#a5b4fc' : 'var(--text-muted)',
                }}
              >
                {f}
                <span style={{
                  background: isActive ? 'rgba(99,102,241,0.2)' : 'var(--surface-secondary)',
                  color: isActive ? '#818cf8' : 'var(--text-muted)',
                  padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results table */}
        <div style={{ borderRadius: 10, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 13 }}>
            <thead>
              <tr>
                {['ID', 'Test Case', 'Status', 'Notes'].map((h, i) => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 600,
                    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px',
                    background: 'var(--surface-secondary)', borderBottom: '1px solid var(--border-color)',
                    width: i === 0 ? 80 : i === 2 ? 120 : undefined,
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((r, i) => (
                <tr
                  key={r._id || r.id || i}
                  style={{ background: i % 2 === 0 ? 'transparent' : 'var(--surface-secondary)' }}
                >
                  <td style={{ padding: '11px 16px', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface-glass)', padding: '2px 7px', borderRadius: 4 }}>
                      {r.testCase?.adoId || 'TC'}
                    </span>
                  </td>
                  <td style={{ padding: '11px 16px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {r.testCase?.title}
                  </td>
                  <td style={{ padding: '11px 16px', borderBottom: '1px solid var(--border-color)' }}>
                    <StatusPill status={r.status} />
                  </td>
                  <td style={{ padding: '11px 16px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: 12 }}>
                    {r.comments || <span style={{ opacity: 0.4, fontStyle: 'italic' }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* ── Bug Report Modal ── */}
      <Modal
        isOpen={showBugModal}
        onClose={() => setShowBugModal(false)}
        title={null}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              onClick={() => setShowBugModal(false)}
              style={{ padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 500, background: 'var(--surface-glass)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >Cancel</button>
            <button
              type="submit"
              form="bug-form"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                border: 'none', color: '#fff', cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(239,68,68,0.3)',
              }}
            >
              <FiFlag size={14} /> Submit Bug
            </button>
          </div>
        }
      >
        <form id="bug-form" onSubmit={handleReportBug}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FiFlag size={16} style={{ color: '#f87171' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Report Bug</h2>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  Linked to: {tc?.title}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                Title <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input
                name="title"
                defaultValue={`Bug: ${tc?.title}`}
                required
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                Steps to Reproduce
              </label>
              <textarea
                name="description"
                rows={4}
                defaultValue={tc?.steps?.map(s => `Step ${s.stepNumber}: ${s.action}`).join('\n')}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Severity</label>
                <select
                  name="severity"
                  style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
                >
                  {['Critical', 'High', 'Medium', 'Low'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Assignee</label>
                <input
                  name="assignedTo"
                  placeholder="Developer name"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default Execution;