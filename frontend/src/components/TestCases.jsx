import React, { useState, useMemo } from 'react';
import {
  FiPlus, FiUpload, FiSearch, FiFilter, FiEdit2, FiTrash2, 
  FiFolder, FiFileText, FiChevronDown, FiChevronRight, FiX, 
  FiAlertCircle, FiUser, FiList, FiTarget, FiPlay, FiEye,
  FiLayers, FiDatabase, FiCheck
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
      {/* Ambient Background */}
      <div className="page-ambient">
        <div className="ambient-gradient ambient-gradient-1"></div>
        <div className="ambient-gradient ambient-gradient-2"></div>
      </div>

      <div className="page-content">
        <div className="page-header">
          <div className="header-content">
            <div className="header-badge">
              <FiDatabase className="badge-icon" />
              <span>Test Repository</span>
            </div>
            <h2 className="section-title">Test Cases Management</h2>
            <p className="section-description">Manage and organize your test library</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary btn-with-icon" onClick={() => setShowUploadModal(true)}>
              <span className="btn-icon-wrapper">
                <FiUpload />
              </span>
              <span>Import CSV</span>
            </button>
            <button className="btn btn-primary btn-with-icon" onClick={() => initTestCaseForm()}>
              <span className="btn-icon-wrapper">
                <FiPlus />
              </span>
              <span>New Test Case</span>
            </button>
          </div>
        </div>

        <div className="test-cases-layout">
          <aside className="suites-sidebar">
            <div className="sidebar-header">
              <div className="sidebar-title-group">
                <FiLayers className="sidebar-icon" />
                <h3>Test Suites</h3>
              </div>
              <span className="suite-count-badge">{testSuites?.length || 0}</span>
            </div>
            <div className="suites-list">
              <div 
                className={`suite-item ${!selectedSuiteId ? 'active' : ''}`} 
                onClick={() => setSelectedSuiteId(null)}
              >
                <div className="suite-icon-wrapper all">
                  <FiFileText />
                </div>
                <span className="suite-name">All Test Cases</span>
                <span className="suite-test-count">{testCases?.length || 0}</span>
              </div>
              
              {testSuites?.map(suite => (
                <div 
                  key={suite._id || suite.id} 
                  className={`suite-item ${String(selectedSuiteId) === String(suite._id || suite.id) ? 'active' : ''}`}
                >
                  <div 
                    className="suite-info" 
                    onClick={() => setSelectedSuiteId(suite._id || suite.id)}
                  >
                    <div className="suite-icon-wrapper">
                      <FiFolder />
                    </div>
                    <span className="suite-name">{suite.name}</span>
                    <span className="suite-test-count">
                      {suiteTestCounts[String(suite._id || suite.id)] || 0}
                    </span>
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
                <FiSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search by title or ID..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
                {searchTerm && (
                  <button className="search-clear" onClick={() => setSearchTerm('')}>
                    <FiX size={14} />
                  </button>
                )}
              </div>
              <div className="filter-group">
                <div className="filter-select-wrapper">
                  <FiFilter className="filter-icon" />
                  <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                    <option value="all">All Priorities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                  <FiChevronDown className="select-arrow" />
                </div>
              </div>
              <div className="results-count">
                <span className="results-number">{filteredTestCases.length}</span>
                <span className="results-label">tests found</span>
              </div>
            </div>

            <div className="table-container">
              {filteredTestCases.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{width: '100px'}}>
                        <span className="th-content">ID</span>
                      </th>
                      <th>
                        <span className="th-content">Title</span>
                      </th>
                      <th style={{width: '120px'}}>
                        <span className="th-content">Priority</span>
                      </th>
                      <th style={{width: '150px'}}>
                        <span className="th-content">Assigned To</span>
                      </th>
                      <th style={{width: '140px'}}>
                        <span className="th-content">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTestCases.map((tc, idx) => (
                      <tr key={tc._id || tc.id || idx} className="table-row">
                        <td className="id-cell">
                          <span className="id-badge">{tc.adoId || 'TC'}</span>
                        </td>
                        <td className="title-cell">
                          <span className="title-text">{tc.title}</span>
                        </td>
                        <td>
                          <span className={`priority-badge priority-${(tc.priority || 'medium').toLowerCase()}`}>
                            <span className="priority-dot"></span>
                            {tc.priority}
                          </span>
                        </td>
                        <td className="assignee-cell">
                          {tc.assignedTo ? (
                            <div className="assignee-wrapper">
                              <div className="assignee-avatar">
                                {tc.assignedTo.charAt(0).toUpperCase()}
                              </div>
                              <span className="assignee-name">{tc.assignedTo}</span>
                            </div>
                          ) : (
                            <span className="no-assignee">Unassigned</span>
                          )}
                        </td>
                        <td className="actions-cell">
                          <div className="actions-group">
                            <button 
                              className="action-btn action-btn-view" 
                              onClick={() => {setViewingTestCase(tc); setShowViewModal(true);}} 
                              title="View"
                            >
                              <FiEye />
                            </button>
                            <button 
                              className="action-btn action-btn-edit" 
                              onClick={() => initTestCaseForm(tc)} 
                              title="Edit"
                            >
                              <FiEdit2 />
                            </button>
                            <button 
                              className="action-btn action-btn-delete" 
                              onClick={() => setShowDeleteConfirm({ type: 'testCase', id: tc._id || tc.id, name: tc.title })} 
                              title="Delete"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <FiFileText />
                  </div>
                  <h3>No test cases found</h3>
                  <p>Try changing filters or import a CSV file</p>
                  <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
                    <FiUpload /> Import Test Cases
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* --- MODALS SECTION --- */}

      {/* 1. VIEW MODAL */}
      {showViewModal && viewingTestCase && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-badge">Test Case</span>
                <h3>{viewingTestCase.title}</h3>
              </div>
              <button className="close-btn" onClick={() => setShowViewModal(false)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="view-meta-grid">
                <div className="view-meta-item">
                  <span className="meta-label">Priority</span>
                  <span className={`priority-badge priority-${(viewingTestCase.priority || 'medium').toLowerCase()}`}>
                    <span className="priority-dot"></span>
                    {viewingTestCase.priority}
                  </span>
                </div>
                <div className="view-meta-item">
                  <span className="meta-label">Assigned To</span>
                  <span className="meta-value">{viewingTestCase.assignedTo || 'Unassigned'}</span>
                </div>
                <div className="view-meta-item">
                  <span className="meta-label">State</span>
                  <span className="state-badge">{viewingTestCase.state || 'Active'}</span>
                </div>
              </div>
              
              <div className="view-section">
                <h4>
                  <FiFileText className="section-icon" />
                  Description
                </h4>
                <div className="view-content-box">
                  <p>{viewingTestCase.description || "No description provided."}</p>
                </div>
              </div>
              
              <div className="view-section">
                <h4>
                  <FiList className="section-icon" />
                  Test Steps
                </h4>
                <div className="steps-list">
                  {viewingTestCase.steps?.map((step, i) => (
                    <div key={i} className="step-item">
                      <div className="step-number-badge">
                        <span>{step.stepNumber}</span>
                      </div>
                      <div className="step-content">
                        <div className="step-action">
                          <span className="step-label">Action</span>
                          <p>{step.action}</p>
                        </div>
                        <div className="step-expected">
                          <span className="step-label">Expected Result</span>
                          <p>{step.expectedResult}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => { setShowViewModal(false); initTestCaseForm(viewingTestCase); }}>
                <FiEdit2 /> Edit Test Case
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. EDIT/CREATE MODAL */}
      {showTestCaseModal && (
        <div className="modal-overlay" onClick={() => setShowTestCaseModal(false)}>
          <div className="modal modal-xlarge" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-badge">{editingTestCase ? 'Edit' : 'Create'}</span>
                <h3>{editingTestCase ? 'Edit Test Case' : 'New Test Case'}</h3>
              </div>
              <button className="close-btn" onClick={() => setShowTestCaseModal(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleTestCaseSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">
                    <FiFileText className="label-icon" />
                    Title
                  </label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="Enter test case title..."
                    value={tcFormData.title} 
                    onChange={e => setTcFormData({...tcFormData, title: e.target.value})} 
                    required 
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      <FiFolder className="label-icon" />
                      Suite
                    </label>
                    <div className="select-wrapper">
                      <select 
                        className="form-select"
                        value={tcFormData.suiteId} 
                        onChange={e => setTcFormData({...tcFormData, suiteId: e.target.value})} 
                        required
                      >
                        <option value="">Select Suite</option>
                        {testSuites.map(s => (
                          <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>
                        ))}
                      </select>
                      <FiChevronDown className="select-arrow" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      <FiTarget className="label-icon" />
                      Priority
                    </label>
                    <div className="select-wrapper">
                      <select 
                        className="form-select"
                        value={tcFormData.priority} 
                        onChange={e => setTcFormData({...tcFormData, priority: e.target.value})}
                      >
                        <option>Critical</option>
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                      </select>
                      <FiChevronDown className="select-arrow" />
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea 
                    className="form-textarea"
                    placeholder="Enter test case description..."
                    value={tcFormData.description}
                    onChange={e => setTcFormData({...tcFormData, description: e.target.value})}
                    rows={3}
                  />
                </div>
                
                {/* Steps Editor */}
                <div className="form-section">
                  <div className="form-section-header">
                    <h4>
                      <FiList className="section-icon" />
                      Test Steps
                    </h4>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={addStep}>
                      <FiPlus /> Add Step
                    </button>
                  </div>
                  <div className="steps-editor">
                    {tcFormData.steps.map((step, idx) => (
                      <div key={idx} className="step-editor-card">
                        <div className="step-editor-header">
                          <div className="step-number-indicator">
                            <span>Step {idx + 1}</span>
                          </div>
                          {tcFormData.steps.length > 1 && (
                            <button 
                              type="button" 
                              className="step-remove-btn" 
                              onClick={() => removeStep(idx)}
                            >
                              <FiX />
                            </button>
                          )}
                        </div>
                        <div className="step-editor-body">
                          <div className="step-field">
                            <label>Action</label>
                            <textarea 
                              placeholder="Describe the action to perform..." 
                              value={step.action} 
                              onChange={e => handleStepChange(idx, 'action', e.target.value)} 
                            />
                          </div>
                          <div className="step-field">
                            <label>Expected Result</label>
                            <textarea 
                              placeholder="Describe the expected outcome..." 
                              value={step.expectedResult} 
                              onChange={e => handleStepChange(idx, 'expectedResult', e.target.value)} 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTestCaseModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <FiCheck /> Save Test Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. DELETE CONFIRMATION */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal modal-small modal-danger" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button className="close-btn" onClick={() => setShowDeleteConfirm(null)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-warning-icon">
                <FiAlertCircle />
              </div>
              <p className="delete-message">
                Are you sure you want to delete <strong>{showDeleteConfirm.name}</strong>?
              </p>
              {showDeleteConfirm.type === 'suite' && (
                <div className="delete-warning-box">
                  <FiAlertCircle />
                  <span>This will delete ALL test cases in this suite!</span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={async () => {
                if (showDeleteConfirm.type === 'suite') await onDeleteSuite(showDeleteConfirm.id);
                else await onDeleteTestCase(showDeleteConfirm.id);
                setShowDeleteConfirm(null);
              }}>
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. IMPORT CSV MODAL */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-badge">Import</span>
                <h3>Import ADO CSV</h3>
              </div>
              <button className="close-btn" onClick={() => setShowUploadModal(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleUploadSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select CSV File</label>
                  <div className={`file-upload-area ${uploadFile ? 'has-file' : ''}`}>
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={e => setUploadFile(e.target.files[0])} 
                      required 
                    />
                    <div className="file-upload-content">
                      <div className="file-upload-icon">
                        {uploadFile ? <FiCheck /> : <FiUpload />}
                      </div>
                      <div className="file-upload-text">
                        <span className="file-upload-primary">
                          {uploadFile ? uploadFile.name : 'Click to upload or drag and drop'}
                        </span>
                        <span className="file-upload-secondary">
                          {uploadFile ? 'Click to change file' : 'CSV files only'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <FiFolder className="label-icon" />
                    New Suite Name
                  </label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="e.g., Sprint 5 Smoke Tests" 
                    value={uploadSuiteName} 
                    onChange={e => setUploadSuiteName(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <span className="btn-spinner"></span>
                      Importing...
                    </>
                  ) : (
                    <>
                      <FiUpload /> Import
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TestCases;