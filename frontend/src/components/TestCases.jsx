import React, { useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCheck,
  FiChevronDown,
  FiDatabase,
  FiEdit2,
  FiEye,
  FiFileText,
  FiFilter,
  FiFolder,
  FiLayers,
  FiList,
  FiPlus,
  FiSearch,
  FiTarget,
  FiTrash2,
  FiUpload,
  FiX,
  FiBox,
  FiUser,
  FiActivity,
} from "react-icons/fi";
import { toast } from "react-toastify";

function TestCases({
  testSuites = [],
  testCases = [],
  onCreateTestCase,
  onUpdateTestCase,
  onDeleteTestCase,
  onDeleteSuite,
  onUploadCSV,
}) {
  const [selectedSuiteId, setSelectedSuiteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showTestCaseModal, setShowTestCaseModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const [editingTestCase, setEditingTestCase] = useState(null);
  const [viewingTestCase, setViewingTestCase] = useState(null);

  const [uploadFile, setUploadFile] = useState(null);
  const [uploadSuiteName, setUploadSuiteName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [tcFormData, setTcFormData] = useState({
    suiteId: "",
    title: "",
    description: "",
    priority: "Medium",
    assignedTo: "",
    areaPath: "",
    scenarioType: "",
    state: "Active",
    steps: [{ stepNumber: 1, action: "", expectedResult: "" }],
  });

  const suiteTestCounts = useMemo(() => {
    const counts = {};
    (testCases || []).forEach((tc) => {
      const sId = String(tc.suiteId);
      counts[sId] = (counts[sId] || 0) + 1;
    });
    return counts;
  }, [testCases]);

  const filteredTestCases = useMemo(() => {
    let filtered = testCases || [];

    if (selectedSuiteId) {
      filtered = filtered.filter(
        (tc) => String(tc.suiteId) === String(selectedSuiteId)
      );
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (tc) =>
          tc.title?.toLowerCase().includes(term) ||
          tc.adoId?.toString().includes(term)
      );
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((tc) => tc.priority === priorityFilter);
    }

    return filtered;
  }, [testCases, selectedSuiteId, searchTerm, priorityFilter]);

  const initTestCaseForm = (testCase = null) => {
    if (testCase) {
      setTcFormData({
        suiteId: testCase.suiteId,
        title: testCase.title || "",
        description: testCase.description || "",
        priority: testCase.priority || "Medium",
        assignedTo: testCase.assignedTo || "",
        areaPath: testCase.areaPath || "",
        scenarioType: testCase.scenarioType || "",
        state: testCase.state || "Active",
        steps:
          testCase.steps?.length > 0
            ? testCase.steps
            : [{ stepNumber: 1, action: "", expectedResult: "" }],
      });
      setEditingTestCase(testCase);
    } else {
      const fallbackSuiteId =
        selectedSuiteId || (testSuites[0]?._id || testSuites[0]?.id) || "";
      setTcFormData({
        suiteId: fallbackSuiteId,
        title: "",
        description: "",
        priority: "Medium",
        assignedTo: "",
        areaPath: "",
        scenarioType: "",
        state: "Active",
        steps: [{ stepNumber: 1, action: "", expectedResult: "" }],
      });
      setEditingTestCase(null);
    }
    setShowTestCaseModal(true);
  };

  const handleStepChange = (idx, field, value) => {
    const next = [...tcFormData.steps];
    next[idx] = { ...next[idx], [field]: value };
    setTcFormData((p) => ({ ...p, steps: next }));
  };

  const addStep = () => {
    setTcFormData((p) => ({
      ...p,
      steps: [
        ...p.steps,
        { stepNumber: p.steps.length + 1, action: "", expectedResult: "" },
      ],
    }));
  };

  const removeStep = (idx) => {
    const next = tcFormData.steps
      .filter((_, i) => i !== idx)
      .map((s, i) => ({ ...s, stepNumber: i + 1 }));
    setTcFormData((p) => ({ ...p, steps: next }));
  };

  const handleTestCaseSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTestCase) {
        await onUpdateTestCase?.(editingTestCase._id || editingTestCase.id, tcFormData);
      } else {
        await onCreateTestCase?.(tcFormData);
      }
      setShowTestCaseModal(false);
      toast.success("Saved successfully");
    } catch (err) {
      toast.error("Error saving test case");
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadSuiteName.trim()) {
      toast.error("File and Suite Name required");
      return;
    }
    setIsUploading(true);
    try {
      await onUploadCSV?.(uploadFile, uploadSuiteName.trim(), "");
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadSuiteName("");
      toast.success("Imported successfully");
    } catch (error) {
      toast.error("Import failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="test-cases-page">
      {/* Ambient Background Effects */}
      <div className="ambient-glow ambient-glow-1" />
      <div className="ambient-glow ambient-glow-2" />
      <div className="ambient-glow ambient-glow-3" />
      
      <div className="page-content">
        <div className="page-header">
          <div className="header-left">
            <div className="header-badge">
              <div className="header-badge-icon">
                <FiDatabase />
              </div>
              <span>Test Repository</span>
            </div>
            <h2>Test Cases</h2>
            <p>Search, filter, and manage your test library with precision.</p>
          </div>

          <div className="header-actions">
            <button className="btn btn-secondary btn-glass" onClick={() => setShowUploadModal(true)}>
              <FiUpload /> Import CSV
            </button>
            <button className="btn btn-primary btn-glow" onClick={() => initTestCaseForm()}>
              <FiPlus /> New Test Case
            </button>
          </div>
        </div>

        <div className="test-cases-layout">
          <aside className="suites-sidebar">
            <div className="sidebar-head">
              <div className="sidebar-title">
                <div className="sidebar-title-icon">
                  <FiLayers />
                </div>
                <span>Test Suites</span>
              </div>
              <span className="count-pill">{testSuites.length}</span>
            </div>

            <div className="suites-list">
              <button
                type="button"
                className={`suite-item ${!selectedSuiteId ? "active" : ""}`}
                onClick={() => setSelectedSuiteId(null)}
              >
                <span className="suite-icon">
                  <FiBox />
                </span>
                <span className="suite-name">All Test Cases</span>
                <span className="suite-count">{testCases.length}</span>
              </button>

              {testSuites.map((suite) => {
                const id = suite._id || suite.id;
                return (
                  <div className="suite-row" key={id}>
                    <button
                      type="button"
                      className={`suite-item ${String(selectedSuiteId) === String(id) ? "active" : ""}`}
                      onClick={() => setSelectedSuiteId(id)}
                    >
                      <span className="suite-icon">
                        <FiFolder />
                      </span>
                      <span className="suite-name">{suite.name}</span>
                      <span className="suite-count">{suiteTestCounts[String(id)] || 0}</span>
                    </button>

                    <button
                      type="button"
                      className="icon-btn icon-btn-danger"
                      title="Delete Suite"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm({ type: "suite", id, name: suite.name });
                      }}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                );
              })}
            </div>
          </aside>

          <main className="test-cases-main">
            <div className="filters-bar">
              <div className="search-box">
                <FiSearch className="search-icon" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title or ID…"
                  type="text"
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="search-clear"
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search"
                    title="Clear"
                  >
                    <FiX />
                  </button>
                )}
              </div>

              <div className="select-wrap">
                <FiFilter className="select-icon" />
                <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                  <option value="all">All Priorities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <FiChevronDown className="select-arrow" />
              </div>

              <div className="results-pill">
                <span className="results-num">{filteredTestCases.length}</span>
                <span className="results-label">results found</span>
              </div>
            </div>

            <div className="table-container">
              {filteredTestCases.length ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: 120 }}>ID</th>
                      <th>Title</th>
                      <th style={{ width: 140 }}>Priority</th>
                      <th style={{ width: 180 }}>Assigned To</th>
                      <th style={{ width: 160, textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTestCases.map((tc, idx) => (
                      <tr key={tc._id || tc.id || idx}>
                        <td>
                          <span className="id-badge">{tc.adoId || "TC"}</span>
                        </td>
                        <td className="title-cell">
                          <span className="title-text">{tc.title}</span>
                        </td>
                        <td>
                          <span className={`priority priority-${String(tc.priority || "Medium").toLowerCase()}`}>
                            <span className="priority-dot" />
                            {tc.priority || "Medium"}
                          </span>
                        </td>
                        <td>
                          {tc.assignedTo ? (
                            <span className="assigned-badge">
                              <FiUser className="assigned-icon" />
                              {tc.assignedTo}
                            </span>
                          ) : (
                            <span className="muted">Unassigned</span>
                          )}
                        </td>
                        <td className="actions">
                          <div className="actions-group">
                            <button
                              type="button"
                              className="icon-btn"
                              title="View Details"
                              onClick={() => {
                                setViewingTestCase(tc);
                                setShowViewModal(true);
                              }}
                            >
                              <FiEye />
                            </button>
                            <button
                              type="button"
                              className="icon-btn"
                              title="Edit Test Case"
                              onClick={() => initTestCaseForm(tc)}
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              type="button"
                              className="icon-btn icon-btn-danger"
                              title="Delete Test Case"
                              onClick={() =>
                                setShowDeleteConfirm({
                                  type: "testCase",
                                  id: tc._id || tc.id,
                                  name: tc.title,
                                })
                              }
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
                <div className="empty">
                  <div className="empty-icon">
                    <FiFileText />
                  </div>
                  <h3>No test cases found</h3>
                  <p>Try adjusting your filters or import a CSV file to get started.</p>
                  <button className="btn btn-secondary btn-glass" onClick={() => setShowUploadModal(true)}>
                    <FiUpload /> Import CSV
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && viewingTestCase && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-head-content">
                <div className="modal-badge">
                  <FiFileText />
                  Test Case
                </div>
                <h3>{viewingTestCase.title}</h3>
              </div>
              <button className="icon-btn modal-close" onClick={() => setShowViewModal(false)} title="Close">
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <div className="meta-grid">
                <div className="meta-item">
                  <span className="meta-label">
                    <FiTarget />
                    Priority
                  </span>
                  <span className={`priority priority-${String(viewingTestCase.priority || "Medium").toLowerCase()}`}>
                    <span className="priority-dot" />
                    {viewingTestCase.priority || "Medium"}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">
                    <FiUser />
                    Assigned To
                  </span>
                  <span className="meta-value">{viewingTestCase.assignedTo || "Unassigned"}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">
                    <FiActivity />
                    State
                  </span>
                  <span className="state-pill">{viewingTestCase.state || "Active"}</span>
                </div>
              </div>

              <div className="section">
                <h4>
                  <FiFileText />
                  Description
                </h4>
                <div className="content-box">
                  {viewingTestCase.description || "No description provided."}
                </div>
              </div>

              <div className="section">
                <h4>
                  <FiList />
                  Test Steps
                </h4>
                <div className="steps-view">
                  {(viewingTestCase.steps || []).map((s, i) => (
                    <div className="step-view-item" key={i}>
                      <div className="step-view-num">{s.stepNumber}</div>
                      <div className="step-view-content">
                        <div className="step-view-section">
                          <span className="step-view-label">Action</span>
                          <div className="step-view-box">{s.action || "—"}</div>
                        </div>
                        <div className="step-view-section">
                          <span className="step-view-label">Expected Result</span>
                          <div className="step-view-box">{s.expectedResult || "—"}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-foot">
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
                <FiEdit2 /> Edit Test Case
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showTestCaseModal && (
        <div className="modal-overlay" onClick={() => setShowTestCaseModal(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-head-content">
                <div className="modal-badge">
                  {editingTestCase ? <FiEdit2 /> : <FiPlus />}
                  {editingTestCase ? "Edit" : "Create"}
                </div>
                <h3>{editingTestCase ? "Edit Test Case" : "Create New Test Case"}</h3>
              </div>
              <button className="icon-btn modal-close" onClick={() => setShowTestCaseModal(false)} title="Close">
                <FiX />
              </button>
            </div>

            <form onSubmit={handleTestCaseSubmit}>
              <div className="modal-body">
                <div className="form-section">
                  <h5 className="form-section-title">Basic Information</h5>
                  <div className="form-grid">
                    <label className="field field-wide">
                      <span>Title <span className="required">*</span></span>
                      <input
                        value={tcFormData.title}
                        onChange={(e) => setTcFormData((p) => ({ ...p, title: e.target.value }))}
                        required
                        placeholder="Enter a descriptive title…"
                      />
                    </label>

                    <label className="field">
                      <span>Test Suite <span className="required">*</span></span>
                      <div className="select-field">
                        <select
                          value={tcFormData.suiteId}
                          onChange={(e) => setTcFormData((p) => ({ ...p, suiteId: e.target.value }))}
                          required
                        >
                          <option value="">Select a suite</option>
                          {testSuites.map((s) => (
                            <option key={s._id || s.id} value={s._id || s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <FiChevronDown className="select-field-arrow" />
                      </div>
                    </label>

                    <label className="field">
                      <span>Priority</span>
                      <div className="select-field">
                        <select
                          value={tcFormData.priority}
                          onChange={(e) => setTcFormData((p) => ({ ...p, priority: e.target.value }))}
                        >
                          <option>Critical</option>
                          <option>High</option>
                          <option>Medium</option>
                          <option>Low</option>
                        </select>
                        <FiChevronDown className="select-field-arrow" />
                      </div>
                    </label>

                    <label className="field field-wide">
                      <span>Description</span>
                      <textarea
                        rows={4}
                        value={tcFormData.description}
                        onChange={(e) => setTcFormData((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Provide a detailed description of the test case…"
                      />
                    </label>
                  </div>
                </div>

                <div className="form-section">
                  <div className="steps-editor-head">
                    <h5 className="form-section-title">Test Steps</h5>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addStep}>
                      <FiPlus /> Add Step
                    </button>
                  </div>

                  <div className="steps-editor-list">
                    {tcFormData.steps.map((step, idx) => (
                      <div className="step-card" key={idx}>
                        <div className="step-card-head">
                          <div className="step-card-num">Step {idx + 1}</div>
                          {tcFormData.steps.length > 1 && (
                            <button
                              type="button"
                              className="icon-btn icon-btn-sm icon-btn-danger"
                              onClick={() => removeStep(idx)}
                              title="Remove Step"
                            >
                              <FiX />
                            </button>
                          )}
                        </div>

                        <div className="step-card-body">
                          <label className="field">
                            <span>Action</span>
                            <textarea
                              rows={3}
                              value={step.action}
                              onChange={(e) => handleStepChange(idx, "action", e.target.value)}
                              placeholder="Describe the action to perform…"
                            />
                          </label>
                          <label className="field">
                            <span>Expected Result</span>
                            <textarea
                              rows={3}
                              value={step.expectedResult}
                              onChange={(e) => handleStepChange(idx, "expectedResult", e.target.value)}
                              placeholder="Describe the expected outcome…"
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-foot">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTestCaseModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-glow">
                  <FiCheck /> {editingTestCase ? "Save Changes" : "Create Test Case"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal modal-sm modal-danger" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-head-content">
                <h3>Confirm Deletion</h3>
              </div>
              <button className="icon-btn modal-close" onClick={() => setShowDeleteConfirm(null)} title="Close">
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <div className="danger-alert">
                <div className="danger-alert-icon">
                  <FiAlertCircle />
                </div>
                <div className="danger-alert-content">
                  <p>
                    Are you sure you want to delete <strong>"{showDeleteConfirm.name}"</strong>?
                  </p>
                  {showDeleteConfirm.type === "suite" && (
                    <p className="danger-alert-warning">
                      This action will permanently delete all test cases within this suite.
                    </p>
                  )}
                  <p className="danger-alert-note">This action cannot be undone.</p>
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  try {
                    if (showDeleteConfirm.type === "suite") {
                      await onDeleteSuite?.(showDeleteConfirm.id);
                    } else {
                      await onDeleteTestCase?.(showDeleteConfirm.id);
                    }
                    setShowDeleteConfirm(null);
                    toast.success("Deleted successfully");
                  } catch (e) {
                    toast.error("Delete failed");
                  }
                }}
              >
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-head-content">
                <div className="modal-badge">
                  <FiUpload />
                  Import
                </div>
                <h3>Import Test Cases from CSV</h3>
              </div>
              <button className="icon-btn modal-close" onClick={() => setShowUploadModal(false)} title="Close">
                <FiX />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit}>
              <div className="modal-body">
                <div className="upload-dropzone">
                  <div className="upload-dropzone-icon">
                    <FiUpload />
                  </div>
                  <div className="upload-dropzone-text">
                    <p>Select a CSV file to import</p>
                    <span>Supported format: .csv</span>
                  </div>
                  <input 
                    type="file" 
                    accept=".csv" 
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)} 
                    required 
                    className="upload-dropzone-input"
                  />
                  {uploadFile && (
                    <div className="upload-file-selected">
                      <FiFileText />
                      <span>{uploadFile.name}</span>
                    </div>
                  )}
                </div>

                <label className="field">
                  <span>New Suite Name <span className="required">*</span></span>
                  <input
                    value={uploadSuiteName}
                    onChange={(e) => setUploadSuiteName(e.target.value)}
                    placeholder="e.g., Sprint 5 Regression Tests"
                    required
                  />
                </label>
              </div>

              <div className="modal-foot">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-glow" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <span className="btn-spinner" />
                      Importing…
                    </>
                  ) : (
                    <>
                      <FiUpload /> Import CSV
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
