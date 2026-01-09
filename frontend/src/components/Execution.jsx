import React, { useState, useMemo, useEffect } from 'react';
import {
  FiPlay, FiChevronLeft, FiChevronRight, FiCheckCircle, FiXCircle, 
  FiAlertCircle, FiClock, FiList, FiPlus, FiX, FiFolder, 
  FiHash, FiTarget, FiTrash2, FiMinusCircle, FiCpu, FiMessageSquare, FiExternalLink, FiFilter
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
  const [showNewRunModal, setShowNewRunModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(null);
  const [comments, setComments] = useState('');
  const [newRunData, setNewRunData] = useState({ name: '', environment: 'QA', tester: '' });
  const [selectedSuiteId, setSelectedSuiteId] = useState(null);
  const [resultsFilter, setResultsFilter] = useState('All');

  const activeRun = useMemo(() => 
    testRuns.find(r => (r._id === activeRunId || r.id === activeRunId)), 
    [activeRunId, testRuns]
  );

  const currentTest = useMemo(() => executionResults[currentTestIndex], [executionResults, currentTestIndex]);

  // Effect 1: Load results for Active Execution
  useEffect(() => { if (activeRunId) loadResults(activeRunId); }, [activeRunId]);
  
  // Effect 2: Load results specifically for the Results Modal (FIX)
  useEffect(() => { 
    if (showResultsModal) loadResults(showResultsModal._id || showResultsModal.id); 
  }, [showResultsModal]);

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
    } catch (e) { toast.error("Hardware Sync Error"); }
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

  const filteredResults = useMemo(() => {
    if (resultsFilter === 'All') return executionResults;
    return executionResults.filter(r => r.status === resultsFilter);
  }, [executionResults, resultsFilter]);

  const cleanStatus = (s) => (s || 'notrun').toLowerCase().replace(' ', '').replace('/', '');

  return (
    <div className="execution-page">
      {viewMode === 'list' ? (
        <>
          <div className="page-header responsive"><h2 className="section-title">Execution Control</h2><button className="btn btn-primary" onClick={() => setShowNewRunModal(true)} style={{borderRadius: '50px'}}><FiPlus /> New Test Run</button></div>
          <div className="test-runs-grid">
            {testRuns.map(run => (
              <div key={run._id || run.id} className="test-run-card modern">
                <div className="card-top">
                  <div style={{display:'flex', alignItems:'center', gap:'12px'}}><div className="run-icon"><FiPlay /></div><div><h3>{run.name}</h3><span style={{fontSize:'12px', color:'#94a3b8'}}>{run.environment}</span></div></div>
                  <button className="btn-icon-sm danger" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(run); }}><FiTrash2 /></button>
                </div>
                <div className="card-stats">
                  <div className="mini-stat"><span>Pass</span><strong style={{color:'#10b981'}}>{run.passed}</strong></div>
                  <div className="mini-stat"><span>Fail</span><strong style={{color:'#ef4444'}}>{run.failed}</strong></div>
                  <div className="mini-stat"><span>Block</span><strong style={{color:'#f59e0b'}}>{run.blocked}</strong></div>
                  <div className="mini-stat"><span>N/A</span><strong style={{color:'#64748b'}}>{run.na || 0}</strong></div>
                </div>
                <div style={{display:'flex', gap:'8px'}}>
                   <button className="btn btn-secondary" style={{flex: 1, borderRadius:'12px', height:'48px'}} onClick={() => { setActiveRunId(run._id || run.id); setViewMode('execution'); }}>{run.status === 'Completed' ? 'Re-Execute' : 'Continue'}</button>
                   <button className="btn btn-secondary" style={{padding:'12px', borderRadius:'12px'}} onClick={() => setShowResultsModal(run)} title="Detailed Tabulation"><FiExternalLink /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="execution-view">
          <div className="execution-header">
            <div className="header-left">
              <button className="btn btn-secondary btn-sm" onClick={() => setViewMode('list')}><FiChevronLeft /> Back to Dashboard</button>
              <div className="run-title-group"><h2>{activeRun?.name}</h2><span className="run-meta-info">{activeRun?.environment} Stage</span></div>
            </div>
            <div className="run-progress-status">UNIT {currentTestIndex + 1} OF {executionResults.length}</div>
          </div>
          <div className="execution-layout-container">
            <aside className="execution-sidebar"><div className="sidebar-list-header">Queue</div><div className="execution-test-list">
                {executionResults.map((res, idx) => (
                  <div key={idx} className={`test-nav-item ${idx === currentTestIndex ? 'active' : ''} status-${cleanStatus(res.status)}`} onClick={() => setCurrentTestIndex(idx)}>
                    <span className="status-indicator"></span><span className="test-nav-title">{res.testCase?.title}</span>
                  </div>
                ))}
              </div></aside>
            <main className="execution-main-content">
              <div className="test-execution-card">
                {currentTest?.testCase ? (
                  <>
                    <div className="test-card-header"><div className="test-id-pill"><FiHash /> {currentTest.testCase.adoId || 'TC'}</div><h1 className="test-display-title">{currentTest.testCase.title}</h1></div>
                    <div className="test-steps-container">
                      {currentTest.testCase.steps?.map((s, i) => (
                        <div key={i} className="step-row-card">
                          <div className="step-badge">PROTOCOL STEP {s.stepNumber}</div>
                          <div className="step-grid"><div className="step-part"><label>Action</label><div className="step-text">{s.action}</div></div><div className="step-part"><label>Expected</label><div className="step-text">{s.expectedResult}</div></div></div>
                        </div>
                      ))}
                    </div>
                    <div className="execution-comments-area"><label><FiMessageSquare /> Analyst Notes</label><textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Enter observations here..." /></div>
                  </>
                ) : <div className="loading-state">Initialising Stage...</div>}
              </div>
              <div className="execution-action-bar">
                <div className="status-buttons-group">
                  <button className="btn-status pass" onClick={() => handleQuickStatus('Passed')}>Pass</button>
                  <button className="btn-status fail" onClick={() => handleQuickStatus('Failed')}>Fail</button>
                  <button className="btn-status block" onClick={() => handleQuickStatus('Blocked')}>Block</button>
                  <button className="btn-status na" onClick={() => handleQuickStatus('N/A')}>N/A</button>
                </div>
                <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                  <button className="btn-icon-sm danger" onClick={handleRemoveCase} title="Remove Case"><FiTrash2 /></button>
                  <button className="btn btn-secondary" onClick={() => setCurrentTestIndex(p => Math.max(0, p - 1))} disabled={currentTestIndex === 0}><FiChevronLeft /></button>
                  <button className="btn btn-secondary" onClick={() => setCurrentTestIndex(p => Math.min(p+1, executionResults.length-1))} disabled={currentTestIndex === executionResults.length - 1}><FiChevronRight /></button>
                </div>
              </div>
            </main>
          </div>
        </div>
      )}

      {/* Results Tabulation Modal (FIXED) */}
      {showResultsModal && (
        <div className="modal-overlay">
          <div className="modal modal-xlarge">
            <div className="modal-header">
              <div><h3 style={{margin:0}}>Results: {showResultsModal.name}</h3><span style={{fontSize:'12px', color:'#64748b'}}>{showResultsModal.environment}</span></div>
              <button className="close-btn" onClick={() => { setShowResultsModal(null); setExecutionResults([]); }}><FiX /></button>
            </div>
            <div className="modal-body">
              <div className="results-filter-bar">
                <button className={`filter-tag ${resultsFilter === 'All' ? 'active' : ''}`} onClick={() => setResultsFilter('All')}>All</button>
                <button className={`filter-tag passed ${resultsFilter === 'Passed' ? 'active' : ''}`} onClick={() => setResultsFilter('Passed')}>Passed</button>
                <button className={`filter-tag failed ${resultsFilter === 'Failed' ? 'active' : ''}`} onClick={() => setResultsFilter('Failed')}>Failed</button>
                <button className={`filter-tag blocked ${resultsFilter === 'Blocked' ? 'active' : ''}`} onClick={() => setResultsFilter('Blocked')}>Blocked</button>
                <button className={`filter-tag na ${resultsFilter === 'N/A' ? 'active' : ''}`} onClick={() => setResultsFilter('N/A')}>N/A</button>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th style={{width:'80px'}}>ID</th><th>Test Case Title</th><th style={{width:'100px'}}>Status</th><th>Analyst Notes</th></tr></thead>
                  <tbody>
                    {filteredResults.map((r, i) => (
                      <tr key={i}>
                        <td><span className="id-cell">{r.testCase?.adoId || 'TC'}</span></td>
                        <td style={{fontWeight:500, width:'400px'}}>{r.testCase?.title}</td>
                        <td><span className={`status-badge ${cleanStatus(r.status)}`}>{r.status}</span></td>
                        <td style={{fontSize:'13px', color:'#475569'}}>{r.comments || <em style={{color:'#94a3b8'}}>No notes added</em>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-primary" onClick={() => { setShowResultsModal(null); setExecutionResults([]); }}>Close</button></div>
          </div>
        </div>
      )}
      
      {/* New Run & Delete Confirm Modals same as before */}
      {showNewRunModal && (
        <div className="modal-overlay">
          <div className="modal modal-xlarge">
            <div className="modal-header"><h3>Launch New Mission</h3><button className="close-btn" onClick={() => setShowNewRunModal(false)}><FiX /></button></div>
            <div className="modal-body-split">
              <div className="modal-sidebar">
                <div className="form-group"><label>Title</label><input type="text" value={newRunData.name} onChange={e => setNewRunData({...newRunData, name: e.target.value})} placeholder="V1.4 Build" /></div>
                <div className="form-group"><label>Target Env</label><select value={newRunData.environment} onChange={e => setNewRunData({...newRunData, environment: e.target.value})}><option>QA</option><option>Staging</option><option>Production</option></select></div>
              </div>
              <div className="modal-content-area">
                <div className="selection-header">Import Suite Repository</div>
                <div className="case-selection-list">
                  {testSuites.map(suite => (
                    <div key={suite._id || suite.id} className={`select-item ${String(selectedSuiteId) === String(suite._id || suite.id) ? 'selected' : ''}`} onClick={() => setSelectedSuiteId(suite._id || suite.id)}>
                      <span>{suite.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowNewRunModal(false)}>Cancel</button><button className="btn btn-primary" onClick={async (e) => {
              const cases = testCases.filter(tc => String(tc.suiteId) === String(selectedSuiteId));
              await onCreateTestRun({ ...newRunData, testCaseIds: cases.map(tc => tc._id || tc.id), totalTests: cases.length });
              setShowNewRunModal(false);
            }}>Launch</button></div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay"><div className="modal modal-small">
          <div className="modal-header"><h3>Abort Mission?</h3></div>
          <div className="modal-body"><p>Delete <strong>{showDeleteConfirm.name}</strong> telemetry?</p></div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>Cancel</button><button className="btn btn-danger" onClick={async () => { await onDeleteTestRun(showDeleteConfirm._id || showDeleteConfirm.id); setShowDeleteConfirm(null); toast.success("Deleted"); }}>Abort</button></div>
        </div></div>
      )}
    </div>
  );
}

export default Execution;