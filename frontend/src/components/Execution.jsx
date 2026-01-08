import React, { useState, useMemo, useEffect } from 'react';
import {
  FiPlay, FiChevronLeft, FiChevronRight, FiCheckCircle, FiXCircle, 
  FiAlertCircle, FiClock, FiList, FiPlus, FiX, FiCheckSquare, FiSquare, 
  FiFolder, FiHash, FiUser, FiTarget, FiTrash2, FiMinusCircle, FiCpu
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../api';

function Execution({
  testSuites, testCases, testRuns, onCreateTestRun, 
  onUpdateTestRun, onDeleteTestRun, onUpdateExecutionResult
}) {
  const [activeRunId, setActiveRunId] = useState(null);
  const [executionResults, setExecutionResults] = useState([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [viewMode, setViewMode] = useState('list');
  const [isSaving, setIsSaving] = useState(false);
  const [showNewRunModal, setShowNewRunModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  const [newRunData, setNewRunData] = useState({ name: '', environment: 'QA', tester: '', description: '' });
  const [selectedSuiteId, setSelectedSuiteId] = useState(null);

  const activeRun = useMemo(() => testRuns.find(r => (r._id === activeRunId || r.id === activeRunId)), [activeRunId, testRuns]);
  const currentTest = useMemo(() => executionResults[currentTestIndex], [executionResults, currentTestIndex]);

  const suiteCounts = useMemo(() => {
    const counts = {};
    testCases.forEach(tc => { const sId = String(tc.suiteId); counts[sId] = (counts[sId] || 0) + 1; });
    return counts;
  }, [testCases]);

  useEffect(() => { if (activeRunId) loadResults(activeRunId); }, [activeRunId]);

  const loadResults = async (runId) => {
    try {
      const res = await api.getExecutionResults(runId);
      if (res.success) {
        const merged = res.data.map(r => ({
          ...r,
          testCase: testCases.find(tc => String(tc._id || tc.id) === String(r.testCaseId))
        })).filter(r => r.testCase); 
        setExecutionResults(merged);
        setCurrentTestIndex(0);
      }
    } catch (e) { toast.error("Connection Interrupted"); }
  };

  const handleQuickStatus = async (status) => {
    if (!currentTest) return;
    setIsSaving(true);
    try {
      await onUpdateExecutionResult(currentTest._id || currentTest.id, { status, executedBy: 'QA Tester' });
      setExecutionResults(prev => prev.map((r, i) => i === currentTestIndex ? { ...r, status } : r));
      if (currentTestIndex < executionResults.length - 1) {
        setCurrentTestIndex(p => p + 1);
      } else {
        toast.success("Execution Cycle Finished!");
      }
    } catch (e) { toast.error("Failed to sync result"); }
    finally { setIsSaving(false); }
  };

  const handleCreateRunSubmit = async (e) => {
    e.preventDefault();
    if (!newRunData.name || !selectedSuiteId) return toast.error("Check input fields");
    const casesToRun = testCases.filter(tc => String(tc.suiteId) === String(selectedSuiteId));
    if (casesToRun.length === 0) return toast.error("No cases in suite");
    try {
      await onCreateTestRun({ ...newRunData, testCaseIds: casesToRun.map(tc => tc._id || tc.id), totalTests: casesToRun.length });
      setShowNewRunModal(false);
      toast.success(`Mission Initialized`);
    } catch (e) { toast.error("Launch Failed"); }
  };

  if (viewMode === 'execution' && activeRun) {
    const tc = currentTest?.testCase;
    return (
      <div className="execution-view">
        <div className="execution-header">
          <div className="header-left">
            <button className="btn btn-secondary btn-sm" onClick={() => setViewMode('list')}><FiChevronLeft /> Exit Mission</button>
            <div className="run-title-group">
              <h2>{activeRun.name}</h2>
              <span className="run-meta-info">{activeRun.environment} • {activeRun.tester || 'Lead'}</span>
            </div>
          </div>
          <div className="run-progress-status">
            TEST CASE {currentTestIndex + 1} OF {executionResults.length}
          </div>
        </div>

        <div className="execution-layout-container">
          <aside className="execution-sidebar">
            <div className="sidebar-list-header">Testing Sequence</div>
            <div className="execution-test-list">
              {executionResults.map((res, idx) => (
                <div key={idx} className={`test-nav-item ${idx === currentTestIndex ? 'active' : ''} status-${(res.status || 'notrun').toLowerCase().replace(' ', '').replace('/', '')}`} onClick={() => setCurrentTestIndex(idx)}>
                  <span className="status-indicator"></span>
                  <span className="test-nav-title">{res.testCase?.title}</span>
                </div>
              ))}
            </div>
          </aside>

          <main className="execution-main-content">
            {tc ? (
              <div className="test-execution-card">
                <div className="test-card-header">
                  <div className="test-id-pill"><FiCpu /> {tc.adoId || 'TC'}</div>
                  <h1 className="test-display-title">{tc.title}</h1>
                </div>

                <div className="test-steps-container">
                  {tc.steps?.map((s, i) => (
                    <div key={i} className="step-row-card">
                      <div className="step-badge">STEP {s.stepNumber}</div>
                      <div className="step-grid">
                        <div className="step-part"><label><FiPlay /> User Action</label><div className="step-text">{s.action}</div></div>
                        <div className="step-part expected"><label><FiTarget /> Expected Outcome</label><div className="step-text">{s.expectedResult}</div></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : <div className="loading-state">Calibrating Data...</div>}

            <div className="execution-action-bar">
              <div className="status-buttons-group">
                <button className="btn-status pass" onClick={() => handleQuickStatus('Passed')} disabled={isSaving}><FiCheckCircle /> Pass</button>
                <button className="btn-status fail" onClick={() => handleQuickStatus('Failed')} disabled={isSaving}><FiXCircle /> Fail</button>
                <button className="btn-status block" onClick={() => handleQuickStatus('Blocked')} disabled={isSaving}><FiAlertCircle /> Block</button>
                <button className="btn-status na" onClick={() => handleQuickStatus('N/A')} disabled={isSaving}>N/A</button>
              </div>
              <div className="nav-buttons-group">
                <button className="btn-nav" onClick={() => setCurrentTestIndex(p => Math.max(0, p - 1))} disabled={currentTestIndex === 0}><FiChevronLeft /></button>
                <button className="btn-nav" onClick={() => setCurrentTestIndex(p => Math.min(p + 1, executionResults.length - 1))} disabled={currentTestIndex === executionResults.length - 1}><FiChevronRight /></button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="execution-page">
      <div className="page-header responsive">
        <div className="header-content"><h2 className="section-title">Execution Control</h2><p className="section-description">Deploy and manage high-stability test cycles</p></div>
        <button className="btn btn-primary" onClick={() => setShowNewRunModal(true)}><FiPlus /> New Test Mission</button>
      </div>
      <div className="test-runs-grid">
        {testRuns.map(run => (
          <div key={run._id || run.id} className="test-run-card modern">
            <div className="card-top">
              <div className="run-icon"><FiPlay /></div>
              <div className="run-meta"><h3>{run.name}</h3><span>{run.environment}</span></div>
              <button className="btn-icon-sm danger" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(run); }}><FiTrash2 /></button>
            </div>
            <div className="card-stats">
              <div className="mini-stat"><span>Pass</span><strong style={{color:'#10b981'}}>{run.passed}</strong></div>
              <div className="mini-stat"><span>Fail</span><strong style={{color:'#f43f5e'}}>{run.failed}</strong></div>
              <div className="mini-stat"><span>Block</span><strong style={{color:'#f59e0b'}}>{run.blocked}</strong></div>
              <div className="mini-stat"><span>N/A</span><strong style={{color:'#64748b'}}>{run.na || 0}</strong></div>
            </div>
            <button className="btn btn-primary btn-block" style={{marginTop:'10px', background:'var(--bg-sidebar)', border:'none'}} onClick={() => { setActiveRunId(run._id || run.id); setViewMode('execution'); }}>Execute Mission</button>
          </div>
        ))}
      </div>

      {showNewRunModal && (
        <div className="modal-overlay">
          <div className="modal modal-xlarge">
            <div className="modal-header"><h3>Launch New Cycle</h3><button className="close-btn" onClick={() => setShowNewRunModal(false)}><FiX /></button></div>
            <div className="modal-body-split">
              <div className="modal-sidebar">
                <div className="form-group"><label>Mission Title</label><input type="text" value={newRunData.name} onChange={e => setNewRunData({...newRunData, name: e.target.value})} placeholder="V1.4 Regression" /></div>
                <div className="form-group"><label>Target Env</label><select value={newRunData.environment} onChange={e => setNewRunData({...newRunData, environment: e.target.value})}><option>QA</option><option>Staging</option><option>Production</option></select></div>
                <div className="form-group"><label>Lead Engineer</label><input type="text" value={newRunData.tester} onChange={e => setNewRunData({...newRunData, tester: e.target.value})} /></div>
              </div>
              <div className="modal-content-area">
                <div className="selection-header"><strong>Import Logic Repository</strong></div>
                <div className="case-selection-list">
                  {testSuites.map(suite => (
                    <div key={suite._id || suite.id} className={`select-item ${String(selectedSuiteId) === String(suite._id || suite.id) ? 'selected' : ''}`} onClick={() => setSelectedSuiteId(suite._id || suite.id)}>
                      {String(selectedSuiteId) === String(suite._id || suite.id) ? <FiCheckCircle color="#10b981" /> : <FiFolder />}
                      <span className="case-title">{suite.name}</span><span className="badge">{suiteCounts[String(suite._id || suite.id)] || 0} tests</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowNewRunModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreateRunSubmit}>Launch Mission</button></div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay"><div className="modal modal-small">
          <div className="modal-header"><h3>Decommission Run</h3></div>
          <div className="modal-body"><p>Are you sure you want to permanently delete <strong>{showDeleteConfirm.name}</strong> and all associated telemetry?</p></div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>Abort</button><button className="btn btn-danger" onClick={async () => { await onDeleteTestRun(showDeleteConfirm._id || showDeleteConfirm.id); setShowDeleteConfirm(null); toast.success("Mission Terminated"); }}>Confirm Deletion</button></div>
        </div></div>
      )}
    </div>
  );
}
export default Execution;