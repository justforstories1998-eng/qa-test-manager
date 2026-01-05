import React, { useState, useMemo } from 'react';
import {
  FiPlus,
  FiUpload,
  FiSearch,
  FiFilter,
  FiEdit2,
  FiTrash2,
  FiFolder,
  FiFileText,
  FiChevronDown,
  FiChevronRight,
  FiX,
  FiAlertCircle,
  FiUser,
  FiList,
  FiTarget,
  FiPlay,
  FiEye
} from 'react-icons/fi';
import { toast } from 'react-toastify';

function TestCases({
  testSuites,
  testCases,
  onCreateSuite,
  onUpdateSuite,
  onDeleteSuite,
  onCreateTestCase,
  onUpdateTestCase,
  onDeleteTestCase,
  onUploadCSV,
  onRefresh
}) {
  // ============================================
  // STATE
  // ============================================

  const [selectedSuiteId, setSelectedSuiteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [expandedSuites, setExpandedSuites] = useState({});
  
  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSuiteModal, setShowSuiteModal] = useState(false);
  const [showTestCaseModal, setShowTestCaseModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  // Form states
  const [editingSuite, setEditingSuite] = useState(null);
  const [editingTestCase, setEditingTestCase] = useState(null);
  const [viewingTestCase, setViewingTestCase] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadSuiteName, setUploadSuiteName] = useState('');
  const [uploadSuiteDescription, setUploadSuiteDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Test case form state for multi-line steps
  const [tcFormData, setTcFormData] = useState({
    suiteId: '',
    title: '',
    description: '',
    priority: 'Medium',
    assignedTo: '',
    areaPath: '',
    scenarioType: '',
    state: 'Active',
    steps: [{ stepNumber: 1, action: '', expectedResult: '' }]
  });

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const filteredTestCases = useMemo(() => {
    let filtered = testCases || [];

    if (selectedSuiteId) {
      filtered = filtered.filter(tc => tc.suiteId === selectedSuiteId);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tc =>
        tc.title?.toLowerCase().includes(term) ||
        tc.description?.toLowerCase().includes(term) ||
        tc.adoId?.toString().includes(term)
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
      counts[tc.suiteId] = (counts[tc.suiteId] || 0) + 1;
    });
    return counts;
  }, [testCases]);

  // ============================================
  // HANDLERS
  // ============================================

  const toggleSuiteExpand = (suiteId) => {
    setExpandedSuites(prev => ({ ...prev, [suiteId]: !prev[suiteId] }));
  };

  const handleSuiteSelect = (suiteId) => {
    setSelectedSuiteId(suiteId === selectedSuiteId ? null : suiteId);
  };

  // File Upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      setUploadFile(file);
      if (!uploadSuiteName) {
        setUploadSuiteName(file.name.replace('.csv', ''));
      }
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error('Please select a file');
      return;
    }
    if (!uploadSuiteName.trim()) {
      toast.error('Please enter a suite name');
      return;
    }

    setIsUploading(true);
    try {
      await onUploadCSV(uploadFile, uploadSuiteName, uploadSuiteDescription);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadSuiteName('');
      setUploadSuiteDescription('');
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Suite CRUD
  const handleSuiteSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const suiteData = {
      name: formData.get('name'),
      description: formData.get('description')
    };

    try {
      if (editingSuite) {
        await onUpdateSuite(editingSuite.id, suiteData);
      } else {
        await onCreateSuite(suiteData);
      }
      setShowSuiteModal(false);
      setEditingSuite(null);
    } catch (error) {
      console.error('Suite operation failed:', error);
    }
  };

  const handleDeleteSuite = async (suiteId) => {
    try {
      await onDeleteSuite(suiteId);
      setShowDeleteConfirm(null);
      if (selectedSuiteId === suiteId) {
        setSelectedSuiteId(null);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  // Test Case Form Handlers
  const initTestCaseForm = (testCase = null) => {
    if (testCase) {
      setTcFormData({
        suiteId: testCase.suiteId || selectedSuiteId || '',
        title: testCase.title || '',
        description: testCase.description || '',
        priority: testCase.priority || 'Medium',
        assignedTo: testCase.assignedTo || '',
        areaPath: testCase.areaPath || '',
        scenarioType: testCase.scenarioType || '',
        state: testCase.state || 'Active',
        steps: testCase.steps?.length > 0 
          ? testCase.steps.map((s, i) => ({
              stepNumber: s.stepNumber || i + 1,
              action: s.action || '',
              expectedResult: s.expectedResult || ''
            }))
          : [{ stepNumber: 1, action: '', expectedResult: '' }]
      });
      setEditingTestCase(testCase);
    } else {
      setTcFormData({
        suiteId: selectedSuiteId || '',
        title: '',
        description: '',
        priority: 'Medium',
        assignedTo: '',
        areaPath: '',
        scenarioType: '',
        state: 'Active',
        steps: [{ stepNumber: 1, action: '', expectedResult: '' }]
      });
      setEditingTestCase(null);
    }
    setShowTestCaseModal(true);
  };

  const handleStepChange = (index, field, value) => {
    setTcFormData(prev => {
      const newSteps = [...prev.steps];
      newSteps[index] = { ...newSteps[index], [field]: value };
      return { ...prev, steps: newSteps };
    });
  };

  const addStep = () => {
    setTcFormData(prev => ({
      ...prev,
      steps: [...prev.steps, { 
        stepNumber: prev.steps.length + 1, 
        action: '', 
        expectedResult: '' 
      }]
    }));
  };

  const removeStep = (index) => {
    if (tcFormData.steps.length <= 1) {
      toast.warning('At least one step is required');
      return;
    }
    setTcFormData(prev => {
      const newSteps = prev.steps.filter((_, i) => i !== index);
      // Re-number steps
      newSteps.forEach((step, i) => {
        step.stepNumber = i + 1;
      });
      return { ...prev, steps: newSteps };
    });
  };

  const handleTestCaseSubmit = async (e) => {
    e.preventDefault();
    
    if (!tcFormData.suiteId) {
      toast.error('Please select a test suite');
      return;
    }
    
    if (!tcFormData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    const testCaseData = {
      suiteId: tcFormData.suiteId,
      title: tcFormData.title.trim(),
      description: tcFormData.description.trim(),
      priority: tcFormData.priority,
      assignedTo: tcFormData.assignedTo.trim(),
      areaPath: tcFormData.areaPath.trim(),
      scenarioType: tcFormData.scenarioType.trim(),
      state: tcFormData.state,
      steps: tcFormData.steps.filter(s => s.action.trim() || s.expectedResult.trim()),
      status: editingTestCase?.status || 'Not Run'
    };

    try {
      if (editingTestCase) {
        await onUpdateTestCase(editingTestCase.id, testCaseData);
      } else {
        await onCreateTestCase(testCaseData);
      }
      setShowTestCaseModal(false);
      setEditingTestCase(null);
    } catch (error) {
      console.error('Test case operation failed:', error);
    }
  };

  const handleDeleteTestCase = async (testCaseId) => {
    try {
      await onDeleteTestCase(testCaseId);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const openViewTestCase = (testCase) => {
    setViewingTestCase(testCase);
    setShowViewModal(true);
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'priority-critical';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="test-cases-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <h2 className="section-title">Test Cases Management</h2>
          <p className="section-description">
            Organize, create, and manage your test cases and test suites
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => setShowUploadModal(true)}
          >
            <FiUpload size={16} />
            <span>Import CSV</span>
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => { setEditingSuite(null); setShowSuiteModal(true); }}
          >
            <FiFolder size={16} />
            <span>New Suite</span>
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => initTestCaseForm(null)}
          >
            <FiPlus size={16} />
            <span>New Test Case</span>
          </button>
        </div>
      </div>

      <div className="test-cases-layout">
        {/* Sidebar - Test Suites */}
        <aside className="suites-sidebar">
          <div className="sidebar-header">
            <h3>Test Suites</h3>
            <span className="suite-count">{testSuites?.length || 0}</span>
          </div>

          <div className="suites-list">
            <div 
              className={`suite-item ${!selectedSuiteId ? 'active' : ''}`}
              onClick={() => setSelectedSuiteId(null)}
            >
              <FiFileText size={18} />
              <span className="suite-name">All Test Cases</span>
              <span className="suite-test-count">{testCases?.length || 0}</span>
            </div>

            {testSuites?.map(suite => (
              <div key={suite.id} className="suite-item-wrapper">
                <div 
                  className={`suite-item ${selectedSuiteId === suite.id ? 'active' : ''}`}
                  onClick={() => handleSuiteSelect(suite.id)}
                >
                  <button 
                    className="expand-btn"
                    onClick={(e) => { e.stopPropagation(); toggleSuiteExpand(suite.id); }}
                  >
                    {expandedSuites[suite.id] ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                  </button>
                  <FiFolder size={18} />
                  <span className="suite-name" title={suite.name}>{suite.name}</span>
                  <span className="suite-test-count">{suiteTestCounts[suite.id] || 0}</span>
                </div>

                {expandedSuites[suite.id] && (
                  <div className="suite-actions">
                    <button 
                      className="action-btn"
                      onClick={() => { setEditingSuite(suite); setShowSuiteModal(true); }}
                      title="Edit Suite"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button 
                      className="action-btn danger"
                      onClick={() => setShowDeleteConfirm({ type: 'suite', id: suite.id, name: suite.name })}
                      title="Delete Suite"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {testSuites?.length === 0 && (
              <div className="empty-suites">
                <FiFolder size={32} />
                <p>No test suites yet</p>
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => setShowUploadModal(true)}
                >
                  Import CSV
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="test-cases-main">
          {/* Filters Bar */}
          <div className="filters-bar">
            <div className="search-box">
              <FiSearch size={18} />
              <input
                type="text"
                placeholder="Search test cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="clear-btn" onClick={() => setSearchTerm('')}>
                  <FiX size={16} />
                </button>
              )}
            </div>

            <div className="filter-group">
              <FiFilter size={16} />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="results-count">
              {filteredTestCases.length} test case{filteredTestCases.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Test Cases Table */}
          {filteredTestCases.length > 0 ? (
            <div className="table-container">
              <table className="data-table test-cases-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>ID</th>
                    <th>Title</th>
                    <th style={{ width: '80px' }}>Steps</th>
                    <th style={{ width: '100px' }}>Priority</th>
                    <th style={{ width: '120px' }}>Assigned To</th>
                    <th style={{ width: '120px' }}>Area Path</th>
                    <th style={{ width: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTestCases.map((tc, index) => (
                    <tr key={tc.id}>
                      <td className="id-cell">
                        {tc.adoId || `TC-${index + 1}`}
                      </td>
                      <td className="title-cell">
                        <div className="title-content">
                          <span className="title-text">{tc.title}</span>
                          {tc.scenarioType && (
                            <span className="scenario-tag">{tc.scenarioType}</span>
                          )}
                        </div>
                      </td>
                      <td className="steps-count-cell">
                        <span className="steps-badge">
                          {tc.steps?.length || 0} steps
                        </span>
                      </td>
                      <td>
                        <span className={`priority-badge ${getPriorityClass(tc.priority)}`}>
                          {tc.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="assignee-cell">
                        {tc.assignedTo ? (
                          <span className="assignee">
                            <FiUser size={14} />
                            {tc.assignedTo}
                          </span>
                        ) : (
                          <span className="unassigned">-</span>
                        )}
                      </td>
                      <td className="area-cell">
                        <span className="area-path" title={tc.areaPath}>
                          {tc.areaPath || '-'}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button
                          className="action-btn primary"
                          onClick={() => openViewTestCase(tc)}
                          title="View Test Case"
                        >
                          <FiEye size={16} />
                        </button>
                        <button
                          className="action-btn"
                          onClick={() => initTestCaseForm(tc)}
                          title="Edit Test Case"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          className="action-btn danger"
                          onClick={() => setShowDeleteConfirm({ type: 'testCase', id: tc.id, name: tc.title })}
                          title="Delete Test Case"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <FiFileText size={64} />
              <h3>No Test Cases Found</h3>
              <p>
                {searchTerm || priorityFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Import a CSV file or create a new test case'}
              </p>
              <div className="empty-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowUploadModal(true)}
                >
                  <FiUpload size={16} />
                  Import CSV
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Upload CSV Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Import Test Cases from CSV</h3>
              <button className="close-btn" onClick={() => setShowUploadModal(false)}>
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleUploadSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>CSV File</label>
                  <div className="file-upload-area">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      id="csv-file-input"
                    />
                    <label htmlFor="csv-file-input" className="file-upload-label">
                      <FiUpload size={32} />
                      <span>{uploadFile ? uploadFile.name : 'Click to select CSV file'}</span>
                      <small>Format: ID, Title, Test Step, Step Action, Step Expected, ...</small>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Test Suite Name *</label>
                  <input
                    type="text"
                    value={uploadSuiteName}
                    onChange={(e) => setUploadSuiteName(e.target.value)}
                    placeholder="Enter test suite name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={uploadSuiteDescription}
                    onChange={(e) => setUploadSuiteDescription(e.target.value)}
                    placeholder="Optional description"
                    rows={2}
                  />
                </div>

                <div className="info-box">
                  <FiAlertCircle size={18} />
                  <div>
                    <strong>Supported Format:</strong>
                    <p>ID, Work Item Type, Title, Test Step, Step Action, Step Expected, Area Path, Assigned To, State, Scenario Type</p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isUploading || !uploadFile}>
                  {isUploading ? 'Importing...' : 'Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suite Modal */}
      {showSuiteModal && (
        <div className="modal-overlay" onClick={() => setShowSuiteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSuite ? 'Edit Test Suite' : 'Create Test Suite'}</h3>
              <button className="close-btn" onClick={() => setShowSuiteModal(false)}>
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleSuiteSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Suite Name *</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingSuite?.name || ''}
                    placeholder="Enter suite name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingSuite?.description || ''}
                    placeholder="Enter description"
                    rows={3}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSuiteModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSuite ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Case Modal - Full Edit with Steps */}
      {showTestCaseModal && (
        <div className="modal-overlay" onClick={() => setShowTestCaseModal(false)}>
          <div className="modal modal-xlarge" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTestCase ? 'Edit Test Case' : 'Create Test Case'}</h3>
              <button className="close-btn" onClick={() => setShowTestCaseModal(false)}>
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleTestCaseSubmit}>
              <div className="modal-body modal-body-scroll">
                {/* Basic Info Section */}
                <div className="form-section">
                  <h4 className="form-section-title">Basic Information</h4>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Test Suite *</label>
                      <select
                        value={tcFormData.suiteId}
                        onChange={(e) => setTcFormData(prev => ({ ...prev, suiteId: e.target.value }))}
                        required
                      >
                        <option value="">Select a suite</option>
                        {testSuites?.map(suite => (
                          <option key={suite.id} value={suite.id}>{suite.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Priority</label>
                      <select
                        value={tcFormData.priority}
                        onChange={(e) => setTcFormData(prev => ({ ...prev, priority: e.target.value }))}
                      >
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Title *</label>
                    <input
                      type="text"
                      value={tcFormData.title}
                      onChange={(e) => setTcFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter test case title"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={tcFormData.description}
                      onChange={(e) => setTcFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter description"
                      rows={2}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Assigned To</label>
                      <input
                        type="text"
                        value={tcFormData.assignedTo}
                        onChange={(e) => setTcFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                        placeholder="Assignee name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Area Path</label>
                      <input
                        type="text"
                        value={tcFormData.areaPath}
                        onChange={(e) => setTcFormData(prev => ({ ...prev, areaPath: e.target.value }))}
                        placeholder="e.g., Project/Module"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Scenario Type</label>
                      <input
                        type="text"
                        value={tcFormData.scenarioType}
                        onChange={(e) => setTcFormData(prev => ({ ...prev, scenarioType: e.target.value }))}
                        placeholder="e.g., Positive, Negative"
                      />
                    </div>
                    <div className="form-group">
                      <label>State</label>
                      <select
                        value={tcFormData.state}
                        onChange={(e) => setTcFormData(prev => ({ ...prev, state: e.target.value }))}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Draft">Draft</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Test Steps Section */}
                <div className="form-section">
                  <div className="form-section-header">
                    <h4 className="form-section-title">
                      <FiList size={18} />
                      Test Steps
                    </h4>
                    <button type="button" className="btn btn-sm btn-secondary" onClick={addStep}>
                      <FiPlus size={14} />
                      Add Step
                    </button>
                  </div>

                  <div className="steps-editor">
                    {tcFormData.steps.map((step, index) => (
                      <div key={index} className="step-editor-card">
                        <div className="step-editor-header">
                          <span className="step-number-label">Step {index + 1}</span>
                          <button
                            type="button"
                            className="step-remove-btn"
                            onClick={() => removeStep(index)}
                            title="Remove step"
                          >
                            <FiX size={16} />
                          </button>
                        </div>
                        <div className="step-editor-body">
                          <div className="step-field">
                            <label>
                              <FiPlay size={14} />
                              Step Action
                            </label>
                            <textarea
                              value={step.action}
                              onChange={(e) => handleStepChange(index, 'action', e.target.value)}
                              placeholder="Describe the action to perform..."
                              rows={3}
                            />
                          </div>
                          <div className="step-field">
                            <label>
                              <FiTarget size={14} />
                              Expected Result
                            </label>
                            <textarea
                              value={step.expectedResult}
                              onChange={(e) => handleStepChange(index, 'expectedResult', e.target.value)}
                              placeholder="Describe the expected result..."
                              rows={3}
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
                  {editingTestCase ? 'Update Test Case' : 'Create Test Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Test Case Modal */}
      {showViewModal && viewingTestCase && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal modal-xlarge" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <FiEye size={20} />
                View Test Case
              </h3>
              <button className="close-btn" onClick={() => setShowViewModal(false)}>
                <FiX size={20} />
              </button>
            </div>
            <div className="modal-body modal-body-scroll">
              {/* Title Section */}
              <div className="view-section view-title-section">
                <div className="view-header-row">
                  <span className="view-id-badge">
                    {viewingTestCase.adoId || 'TC'}
                  </span>
                  <span className={`priority-badge ${getPriorityClass(viewingTestCase.priority)}`}>
                    {viewingTestCase.priority || 'Medium'}
                  </span>
                  {viewingTestCase.scenarioType && (
                    <span className="scenario-badge">{viewingTestCase.scenarioType}</span>
                  )}
                </div>
                <h2 className="view-title">{viewingTestCase.title}</h2>
                <div className="view-meta">
                  {viewingTestCase.assignedTo && (
                    <span><FiUser size={14} /> {viewingTestCase.assignedTo}</span>
                  )}
                  {viewingTestCase.areaPath && (
                    <span><FiFolder size={14} /> {viewingTestCase.areaPath}</span>
                  )}
                  {viewingTestCase.state && (
                    <span><FiAlertCircle size={14} /> {viewingTestCase.state}</span>
                  )}
                </div>
              </div>

              {/* Description */}
              {viewingTestCase.description && (
                <div className="view-section">
                  <h4>Description</h4>
                  <p className="view-content">{viewingTestCase.description}</p>
                </div>
              )}

              {/* Test Steps */}
              <div className="view-section">
                <h4>
                  <FiList size={16} />
                  Test Steps ({viewingTestCase.steps?.length || 0})
                </h4>
                {viewingTestCase.steps?.length > 0 ? (
                  <div className="view-steps-list">
                    {viewingTestCase.steps.map((step, index) => (
                      <div key={index} className="view-step-card">
                        <div className="view-step-header">
                          Step {step.stepNumber || index + 1}
                        </div>
                        <div className="view-step-body">
                          <div className="view-step-row">
                            <div className="view-step-label">
                              <FiPlay size={14} /> Action
                            </div>
                            <div className="view-step-content action">
                              {step.action || <em>No action specified</em>}
                            </div>
                          </div>
                          <div className="view-step-row">
                            <div className="view-step-label">
                              <FiTarget size={14} /> Expected Result
                            </div>
                            <div className="view-step-content expected">
                              {step.expectedResult || <em>No expected result specified</em>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No test steps defined</p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>
                Close
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => { 
                  setShowViewModal(false); 
                  initTestCaseForm(viewingTestCase); 
                }}
              >
                <FiEdit2 size={16} />
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button className="close-btn" onClick={() => setShowDeleteConfirm(null)}>
                <FiX size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-warning">
                <FiAlertCircle size={48} />
                <p>Are you sure you want to delete?</p>
                <strong>"{showDeleteConfirm.name}"</strong>
                {showDeleteConfirm.type === 'suite' && (
                  <p className="warning-text">All test cases in this suite will also be deleted!</p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => {
                  if (showDeleteConfirm.type === 'suite') {
                    handleDeleteSuite(showDeleteConfirm.id);
                  } else {
                    handleDeleteTestCase(showDeleteConfirm.id);
                  }
                }}
              >
                <FiTrash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TestCases;