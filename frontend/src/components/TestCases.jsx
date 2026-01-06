import React, { useState, useMemo } from 'react';
import {
  FiPlus, FiUpload, FiSearch, FiFilter, FiEdit2, FiTrash2, 
  FiFolder, FiFileText, FiChevronDown, FiChevronRight, FiX, 
  FiAlertCircle, FiUser, FiList, FiTarget, FiPlay, FiEye
} from 'react-icons/fi';
import { toast } from 'react-toastify';

function TestCases({
  testSuites, testCases, onCreateSuite, onUpdateSuite, onDeleteSuite,
  onCreateTestCase, onUpdateTestCase, onDeleteTestCase, onUploadCSV, onRefresh
}) {
  // State
  const [selectedSuiteId, setSelectedSuiteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  // Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showTestCaseModal, setShowTestCaseModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  // Data State
  const [editingTestCase, setEditingTestCase] = useState(null);
  const [viewingTestCase, setViewingTestCase] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadSuiteName, setUploadSuiteName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Form State for Editing
  const [tcFormData, setTcFormData] = useState({
    suiteId: '', title: '', description: '', priority: 'Medium',
    assignedTo: '', areaPath: '', scenarioType: '', state: 'Active',
    steps: [{ stepNumber: 1, action: '', expectedResult: '' }]
  });

  // Filter Logic
  const filteredTestCases = useMemo(() => {
    let filtered = testCases || [];
    if (selectedSuiteId) {
      filtered = filtered.filter(tc => String(tc.suiteId) === String(selectedSuiteId));
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tc =>
        tc.title?.toLowerCase().includes(term) || tc.adoId?.toString().includes(term)
      );
    }
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(tc => tc.priority === priorityFilter);
    }
    return filtered;
  }, [testCases, selectedSuiteId, searchTerm, priorityFilter]);

  const suiteTestCounts = useMemo(() => {
    const counts = {};
    (testCases || []).forEach(tc => {
      const sId = String(tc.suiteId);
      counts[sId] = (counts[sId] || 0) + 1;
    });
    return counts;
  }, [testCases]);

  // Handlers
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadSuiteName) return toast.error("File and Suite Name required");
    setIsUploading(true);
    try {
      await onUploadCSV(uploadFile, uploadSuiteName, "");
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadSuiteName('');
    } catch (error) { console.error(error); }
    finally { setIsUploading(false); }
  };

  const initTestCaseForm = (testCase = null) => {
    if (testCase) {
      setTcFormData({
        suiteId: testCase.suiteId,
        title: testCase.title,
        description: testCase.description || '',
        priority: testCase.priority || 'Medium',
        assignedTo: testCase.assignedTo || '',
        areaPath: testCase.areaPath || '',
        scenarioType: testCase.scenarioType || '',
        state: testCase.state || 'Active',
        steps: testCase.steps?.length > 0 ? testCase.steps : [{ stepNumber: 1, action: '', expectedResult: '' }]
      });
      setEditingTestCase(testCase);
    } else {
      setTcFormData({
        suiteId: selectedSuiteId || (testSuites[0]?._id || testSuites[0]?.id) || '', 
        title: '', description: '', priority: 'Medium',
        assignedTo: '', areaPath: '', scenarioType: '', state: 'Active',
        steps: [{ stepNumber: 1, action: '', expectedResult: '' }]
      });
      setEditingTestCase(null);
    }
    setShowTestCaseModal(true);
  };

  const handleStepChange = (idx, field, value) => {
    const newSteps = [...tcFormData.steps];
    newSteps[idx][field] = value;
    setTcFormData({ ...tcFormData, steps: newSteps });
  };

  const addStep = () => {
    setTcFormData({
      ...tcFormData,
      steps: [...tcFormData.steps, { stepNumber: tcFormData.steps.length + 1, action: '', expectedResult: '' }]
    });
  };

  const removeStep = (idx) => {
    const newSteps = tcFormData.steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepNumber: i + 1 }));
    setTcFormData({ ...tcFormData, steps: newSteps });
  };

  const handleTestCaseSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTestCase) await onUpdateTestCase(editingTestCase._id || editingTestCase.id, tcFormData);
      else await onCreateTestCase(tcFormData);
      setShowTestCaseModal(false);
      toast.success("Saved successfully");
    } catch (err) { toast.error("Error saving test case"); }
  };

  return (
    <div className="test-cases-page">
      <div className="page-header">
        <div className="header-content">
          <h2 className="section-title">Test Cases Management</h2>
          <p className="section-description">Manage and organize your test library</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => setShowUploadModal(true)}><FiUpload /> Import CSV</button>
          <button className="btn btn-primary" onClick={() => initTestCaseForm()}><FiPlus /> New Test Case</button>
        </div>
      </div>

      <div className="test-cases-layout">
        <aside className="suites-sidebar">
          <div className="sidebar-header">
            <h3>Test Suites</h3>
            <span className="suite-count">{testSuites?.length || 0}</span>
          </div>
          <div className="suites-list">
            <div className={`suite-item ${!selectedSuiteId ? 'active' : ''}`} onClick={() => setSelectedSuiteId(null)}>
              <FiFileText /> <span className="suite-name">All Test Cases</span>
              <span className="suite-test-count">{testCases?.length || 0}</span>
            </div>
            {testSuites?.map(suite => (
              <div key={suite._id || suite.id} className={`suite-item ${String(selectedSuiteId) === String(suite._id || suite.id) ? 'active' : ''}`}>
                <div 
                  className="suite-info" 
                  onClick={() => setSelectedSuiteId(suite._id || suite.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, overflow: 'hidden' }}
                >
                  <FiFolder /> 
                  <span className="suite-name">{suite.name}</span>
                  <span className="suite-test-count">{suiteTestCounts[String(suite._id || suite.id)] || 0}</span>
                </div>
                <button 
                  className="suite-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation(); 
                    setShowDeleteConfirm({ type: 'suite', id: suite._id || suite.id, name: suite.name });
                  }}
                  title="Delete Suite"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </aside>

        <main className="test-cases-main">
          <div className="filters-bar">
            <div className="search-box">
              <FiSearch />
              <input type="text" placeholder="Search by title or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="filter-group">
              <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                <option value="all">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="results-count">{filteredTestCases.length} tests found</div>
          </div>

          <div className="table-container">
            {filteredTestCases.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{width: '100px'}}>ID</th>
                    <th>Title</th>
                    <th style={{width: '120px'}}>Priority</th>
                    <th style={{width: '150px'}}>Assigned To</th>
                    <th style={{width: '140px'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTestCases.map((tc, idx) => (
                    <tr key={tc._id || tc.id || idx}>
                      <td className="id-cell">{tc.adoId || 'TC'}</td>
                      <td className="title-cell"><span className="title-text">{tc.title}</span></td>
                      <td><span className={`priority-badge priority-${(tc.priority || 'medium').toLowerCase()}`}>{tc.priority}</span></td>
                      <td>{tc.assignedTo || '-'}</td>
                      <td className="actions-cell">
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button className="action-btn primary" onClick={() => {setViewingTestCase(tc); setShowViewModal(true);}} title="View"><FiEye /></button>
                          <button className="action-btn" onClick={() => initTestCaseForm(tc)} title="Edit"><FiEdit2 /></button>
                          <button className="action-btn danger" onClick={() => setShowDeleteConfirm({ type: 'testCase', id: tc._id || tc.id, name: tc.title })} title="Delete"><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <FiFileText size={48} />
                <h3>No test cases found</h3>
                <p>Try changing filters or import a CSV file</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* --- MODALS SECTION --- */}

      {/* 1. VIEW MODAL */}
      {showViewModal && viewingTestCase && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header">
              <h3>{viewingTestCase.title}</h3>
              <button className="close-btn" onClick={() => setShowViewModal(false)}><FiX /></button>
            </div>
            <div className="modal-body">
              <div className="view-section">
                <h4>Description</h4>
                <p>{viewingTestCase.description || "No description provided."}</p>
              </div>
              <div className="view-section">
                <h4>Steps</h4>
                {viewingTestCase.steps?.map((step, i) => (
                  <div key={i} className="step-item">
                    <div className="step-item-header"><span className="step-number">Step {step.stepNumber}</span></div>
                    <div className="step-item-body">
                      <div className="step-action-box"><strong>Action:</strong> {step.action}</div>
                      <div className="step-expected-box"><strong>Expected:</strong> {step.expectedResult}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
              <button className="btn btn-primary" onClick={() => { setShowViewModal(false); initTestCaseForm(viewingTestCase); }}>Edit</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. EDIT/CREATE MODAL */}
      {showTestCaseModal && (
        <div className="modal-overlay">
          <div className="modal modal-xlarge">
            <div className="modal-header">
              <h3>{editingTestCase ? 'Edit Test Case' : 'New Test Case'}</h3>
              <button className="close-btn" onClick={() => setShowTestCaseModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleTestCaseSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" value={tcFormData.title} onChange={e => setTcFormData({...tcFormData, title: e.target.value})} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Suite</label>
                    <select value={tcFormData.suiteId} onChange={e => setTcFormData({...tcFormData, suiteId: e.target.value})} required>
                      <option value="">Select Suite</option>
                      {testSuites.map(s => <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <select value={tcFormData.priority} onChange={e => setTcFormData({...tcFormData, priority: e.target.value})}>
                      <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
                    </select>
                  </div>
                </div>
                
                {/* Steps Editor */}
                <div className="form-section">
                  <div className="form-section-header">
                    <h4>Test Steps</h4>
                    <button type="button" className="btn btn-sm btn-secondary" onClick={addStep}><FiPlus /> Add Step</button>
                  </div>
                  {tcFormData.steps.map((step, idx) => (
                    <div key={idx} className="step-editor-card">
                      <div className="step-editor-header">
                        <span>Step {idx + 1}</span>
                        <button type="button" className="step-remove-btn" onClick={() => removeStep(idx)}><FiX /></button>
                      </div>
                      <div className="step-editor-body">
                        <textarea placeholder="Action" value={step.action} onChange={e => handleStepChange(idx, 'action', e.target.value)} />
                        <textarea placeholder="Expected Result" value={step.expectedResult} onChange={e => handleStepChange(idx, 'expectedResult', e.target.value)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTestCaseModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. DELETE CONFIRMATION */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal modal-small">
            <div className="modal-header"><h3>Confirm Delete</h3><button className="close-btn" onClick={() => setShowDeleteConfirm(null)}><FiX /></button></div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{showDeleteConfirm.name}</strong>?</p>
              {showDeleteConfirm.type === 'suite' && <p style={{color: 'red', marginTop: '10px', fontSize: '12px'}}>⚠️ This will delete ALL test cases in this suite!</p>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={async () => {
                if (showDeleteConfirm.type === 'suite') await onDeleteSuite(showDeleteConfirm.id);
                else await onDeleteTestCase(showDeleteConfirm.id);
                setShowDeleteConfirm(null);
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. IMPORT CSV MODAL */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><h3>Import ADO CSV</h3><button className="close-btn" onClick={() => setShowUploadModal(false)}><FiX /></button></div>
            <form onSubmit={handleUploadSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select CSV File</label>
                  <div className="file-upload-area">
                    <input type="file" accept=".csv" onChange={e => setUploadFile(e.target.files[0])} required />
                    <div className="file-upload-label">
                      <FiUpload size={24} />
                      <span>{uploadFile ? uploadFile.name : 'Click to Upload'}</span>
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label>New Suite Name</label>
                  <input type="text" placeholder="e.g., Sprint 5 Smoke Tests" value={uploadSuiteName} onChange={e => setUploadSuiteName(e.target.value)} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isUploading}>{isUploading ? 'Importing...' : 'Import'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default TestCases;