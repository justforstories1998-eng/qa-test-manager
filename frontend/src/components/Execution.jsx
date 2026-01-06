import React, { useState, useMemo, useEffect } from 'react';
import {
  FiPlay, FiChevronLeft, FiChevronRight, FiCheckCircle, FiXCircle, 
  FiAlertCircle, FiClock, FiList, FiPlus, FiX, FiCheckSquare, FiSquare, FiFilter
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../api';

function Execution({
  testSuites, testCases, testRuns, onCreateTestRun, onUpdateExecutionResult
}) {
  const [activeRunId, setActiveRunId] = useState(null);
  const [executionResults, setExecutionResults] = useState([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [viewMode, setViewMode] = useState('list');
  const [isSaving, setIsSaving] = useState(false);
  const [showNewRunModal, setShowNewRunModal] = useState(false);
  
  // New Run Form State
  const [newRunData, setNewRunData] = useState({ name: '', environment: 'QA', tester: '', description: '' });
  const [selectedCaseIds, setSelectedCaseIds] = useState([]);
  const [caseSearch, setCaseSearch] = useState('');

  const activeRun = useMemo(() => testRuns.find(r => (r._id === activeRunId || r.id === activeRunId)), [activeRunId, testRuns]);
  const currentTest = useMemo(() => executionResults[currentTestIndex], [executionResults, currentTestIndex]);

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
      }
    } catch (e) { toast.error("Error loading results"); }
  };

  const handleQuickStatus = async (status) => {
    if (!currentTest) return;
    setIsSaving(true);
    try {
      await onUpdateExecutionResult(currentTest._id || currentTest.id, { status, executedBy: 'QA Tester' });
      setExecutionResults(prev => prev.map((r, i) => i === currentTestIndex ? { ...r, status } : r));
      if (currentTestIndex < executionResults.length - 1) setCurrentTestIndex(p => p + 1);
      toast.success(`Marked as ${status}`);
    } catch (e) { toast.error("Failed to update status"); }
    finally { setIsSaving(false); }
  };

  const handleCreateRunSubmit = async () => {
    if (!newRunData.name) return toast.error("Run Name is required");
    if (selectedCaseIds.length === 0) return toast.error("Select at least one test case");
    try {
      await onCreateTestRun({ ...newRunData, testCaseIds: selectedCaseIds, totalTests: selectedCaseIds.length });
      setShowNewRunModal(false);
      setNewRunData({ name: '', environment: 'QA', tester: '', description: '' });
      setSelectedCaseIds([]);
      toast.success("Test Run Created!");
    } catch (e) { toast.error("Failed to create run"); }
  };

  const toggleSelection = (id) => {
    setSelectedCaseIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    const visibleIds = testCases.filter(tc => tc.title.toLowerCase().includes(caseSearch.toLowerCase())).map(tc => tc._id || tc.id);
    if (visibleIds.every(id => selectedCaseIds.includes(id))) {
      setSelectedCaseIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedCaseIds(prev => [...new Set([...prev, ...visibleIds])]);
    }
  };

  // Execution View
  if (viewMode === 'execution' && activeRun) {
    const tc = currentTest?.testCase;
    return (
      <div className="execution-view">
        <div className="execution-header">
          <div className="header-left">
            <button className="btn-icon-only" onClick={() => setViewMode('list')}><FiChevronLeft /></button>
            <div><h2>{activeRun.name}</h2><span className="subtitle">{activeRun.environment} • {activeRun.tester}</span></div>
          </div>
          <div className="progress-badge">{currentTestIndex + 1} / {executionResults.length}</div>
        </div>

        <div className="execution-content-responsive">
          <div className="test-list-wrapper">
            <div className="list-header">Queue</div>
            <div className="test-list-scroll">
              {executionResults.map((res, idx) => (
                <div key={idx} className={`test-list-item ${idx === currentTestIndex ? 'active' : ''} status-${res.status.toLowerCase().replace(' ', '')}`} onClick={() => setCurrentTestIndex(idx)}>
                  <span className="status-dot"></span>
                  <span className="test-title">{res.testCase?.title}</span>
                </div>
              ))}
            </div>
          </div>

          <main className="test-execution-panel">
            {tc ? (
              <>
                <div className="test-details-container">
                  <div className="test-header-card">
                    <span className="badge id">{tc.adoId || 'TC'}</span>
                    <h1 className="execution-title">{tc.title}</h1>
                    <p className="execution-desc">{tc.description}</p>
                  </div>
                  <div className="steps-container">
                    <h3><FiList /> Steps</h3>
                    {tc.steps?.map((s, i) => (
                      <div key={i} className="step-card-row">
                        <div className="step-num">{s.stepNumber}</div>
                        <div className="step-data">
                          <div className="step-col"><strong>Action:</strong> {s.action}</div>
                          <div className="step-col expected"><strong>Expected:</strong> {s.expectedResult}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="execution-footer-controls">
                  <button className="btn-control pass" onClick={() => handleQuickStatus('Passed')}><FiCheckCircle /> Pass</button>
                  <button className="btn-control fail" onClick={() => handleQuickStatus('Failed')}><FiXCircle /> Fail</button>
                  <button className="btn-control block" onClick={() => handleQuickStatus('Blocked')}><FiAlertCircle /> Block</button>
                  <button className="btn-control next" onClick={() => setCurrentTestIndex(p => Math.min(p + 1, executionResults.length - 1))}><FiChevronRight /></button>
                </div>
              </>
            ) : <div className="empty-state">Loading...</div>}
          </main>
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="execution-page">
      <div className="page-header responsive">
        <h2 className="section-title">Test Execution</h2>
        <button className="btn btn-primary" onClick={() => setShowNewRunModal(true)}><FiPlus /> New Run</button>
      </div>

      <div className="test-runs-grid">
        {testRuns.map(run => (
          <div key={run._id || run.id} className="test-run-card modern">
            <div className="card-top">
              <div className="run-icon"><FiPlay /></div>
              <div className="run-meta"><h3>{run.name}</h3><span>{run.environment}</span></div>
              <span className="status-pill">{run.status}</span>
            </div>
            <div className="card-stats">
              <div className="mini-stat"><span>Pass</span><strong>{run.passed}</strong></div>
              <div className="mini-stat"><span>Fail</span><strong>{run.failed}</strong></div>
              <div className="mini-stat"><span>Total</span><strong>{run.totalTests}</strong></div>
            </div>
            <button className="btn btn-secondary btn-block" onClick={() => { setActiveRunId(run._id || run.id); setViewMode('execution'); }}>Continue</button>
          </div>
        ))}
      </div>

      {showNewRunModal && (
        <div className="modal-overlay">
          <div className="modal modal-xlarge">
            <div className="modal-header"><h3>New Test Run</h3><button onClick={() => setShowNewRunModal(false)}><FiX /></button></div>
            <div className="modal-body-split">
              <div className="modal-sidebar">
                <div className="form-group"><label>Name</label><input type="text" value={newRunData.name} onChange={e => setNewRunData({...newRunData, name: e.target.value})} /></div>
                <div className="form-group"><label>Env</label><select value={newRunData.environment} onChange={e => setNewRunData({...newRunData, environment: e.target.value})}><option>QA</option><option>Staging</option></select></div>
                <div className="form-group"><label>Tester</label><input type="text" value={newRunData.tester} onChange={e => setNewRunData({...newRunData, tester: e.target.value})} /></div>
              </div>
              <div className="modal-content-area">
                <div className="selection-header">
                  <input type="text" className="search-input" placeholder="Search..." value={caseSearch} onChange={e => setCaseSearch(e.target.value)} />
                  <button className="btn-text" onClick={toggleAll}>Select All Visible</button>
                </div>
                <div className="case-selection-list">
                  {testCases.filter(tc => tc.title.toLowerCase().includes(caseSearch.toLowerCase())).map(tc => (
                    <div key={tc._id || tc.id} className={`select-item ${selectedCaseIds.includes(tc._id || tc.id) ? 'selected' : ''}`} onClick={() => toggleSelection(tc._id || tc.id)}>
                      {selectedCaseIds.includes(tc._id || tc.id) ? <FiCheckSquare className="icon-checked" /> : <FiSquare className="icon-unchecked" />}
                      <span className="case-title">{tc.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowNewRunModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateRunSubmit}>Create Run ({selectedCaseIds.length})</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Execution;