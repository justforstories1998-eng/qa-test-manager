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
import { Modal, ConfirmDialog } from "./shared/Modal";
import Badge from "./shared/Badge";

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
    <div className="dg-page">
      <div className="dg-page-header">
        <div className="header-left">
          <div className="dg-badge dg-badge-indigo" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <FiDatabase size={14} /> Test Repository
          </div>
          <h2 className="dg-page-title">Test Cases</h2>
          <p style={{ color: 'rgba(203,213,225,0.6)', margin: 0, fontSize: '14px' }}>
            Search, filter, and manage your test library with precision.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="dg-btn dg-btn-secondary" onClick={() => setShowUploadModal(true)}>
            <FiUpload style={{ marginRight: 6 }} /> Import CSV
          </button>
          <button className="dg-btn dg-btn-primary" onClick={() => initTestCaseForm()}>
            <FiPlus style={{ marginRight: 6 }} /> New Test Case
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', minHeight: 0 }}>
        {/* Suites Sidebar */}
        <aside style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', padding: 0, background: '#fff', border: '1px solid #e7e8ed', borderRadius: 12 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e7e8ed', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#e2e8f0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <FiLayers size={15} /> Test Suites
            </div>
            <span className="dg-badge dg-badge-gray">{testSuites.length}</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            <button
              type="button"
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: 500,
                background: !selectedSuiteId ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: !selectedSuiteId ? '#a5b4fc' : 'var(--text-tertiary)',
                transition: 'all 0.2s',
              }}
              onClick={() => setSelectedSuiteId(null)}
            >
              <FiBox size={15} />
              <span style={{ flex: 1, textAlign: 'left' }}>All Test Cases</span>
              <span className="dg-badge dg-badge-gray" style={{ fontSize: '11px' }}>{testCases.length}</span>
            </button>

            {testSuites.map((suite) => {
              const id = suite._id || suite.id;
              const isActive = String(selectedSuiteId) === String(id);
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <button
                    type="button"
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                      fontSize: '13px', fontWeight: 500,
                      background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                      color: isActive ? '#a5b4fc' : 'var(--text-tertiary)',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => setSelectedSuiteId(id)}
                  >
                    <FiFolder size={15} />
                    <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{suite.name}</span>
                    <span className="dg-badge dg-badge-gray" style={{ fontSize: '11px' }}>{suiteTestCounts[String(id)] || 0}</span>
                  </button>
                  <button
                    type="button"
                    className="dg-btn dg-btn-ghost"
                    style={{ padding: '6px', color: '#f87171', flexShrink: 0 }}
                    title="Delete Suite"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm({ type: "suite", id, name: suite.name });
                    }}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#fff', border: '1px solid #e7e8ed', borderRadius: 12 }}>
            <div className="dg-search" style={{ flex: 1 }}>
              <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '15px' }} />
              <input
                className="dg-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title or ID…"
                type="text"
                style={{ paddingLeft: '36px', background: 'rgba(255,255,255,0.03)' }}
              />
              {searchTerm && (
                <button
                  type="button"
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                  title="Clear"
                >
                  <FiX />
                </button>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <FiFilter style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '14px', pointerEvents: 'none' }} />
              <select
                className="dg-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                style={{ paddingLeft: '34px', minWidth: '160px' }}
              >
                <option value="all">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div style={{ color: 'var(--text-tertiary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
              <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{filteredTestCases.length}</span> results
            </div>
          </div>

          {/* Table */}
          <div style={{ flex: 1, padding: 0, overflow: 'hidden', background: '#fff', border: '1px solid #e7e8ed', borderRadius: 12 }}>
            {filteredTestCases.length ? (
              <div className="dg-table-wrapper">
                <table className="dg-table">
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
                          <span className="dg-badge dg-badge-gray" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                            {tc.adoId || "TC"}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500, color: '#e2e8f0' }}>{tc.title}</td>
                        <td>
                          <Badge>{tc.priority || "Medium"}</Badge>
                        </td>
                        <td>
                          {tc.assignedTo ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                              <FiUser size={13} style={{ color: '#818cf8' }} />
                              {tc.assignedTo}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Unassigned</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="dg-btn dg-btn-ghost"
                              style={{ padding: '6px 8px' }}
                              title="View Details"
                              onClick={() => {
                                setViewingTestCase(tc);
                                setShowViewModal(true);
                              }}
                            >
                              <FiEye size={15} />
                            </button>
                            <button
                              type="button"
                              className="dg-btn dg-btn-ghost"
                              style={{ padding: '6px 8px' }}
                              title="Edit Test Case"
                              onClick={() => initTestCaseForm(tc)}
                            >
                              <FiEdit2 size={15} />
                            </button>
                            <button
                              type="button"
                              className="dg-btn dg-btn-danger"
                              style={{ padding: '6px 8px' }}
                              title="Delete Test Case"
                              onClick={() =>
                                setShowDeleteConfirm({
                                  type: "testCase",
                                  id: tc._id || tc.id,
                                  name: tc.title,
                                })
                              }
                            >
                              <FiTrash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="dg-empty" style={{ padding: '60px 20px' }}>
                <FiFileText size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }} />
                <h3 style={{ color: 'var(--text-tertiary)', margin: '0 0 8px 0', fontSize: '16px' }}>No test cases found</h3>
                <p style={{ color: 'var(--text-muted)', margin: '0 0 20px 0', fontSize: '13px' }}>
                  Try adjusting your filters or import a CSV file to get started.
                </p>
                <button className="dg-btn dg-btn-secondary" onClick={() => setShowUploadModal(true)}>
                  <FiUpload style={{ marginRight: 6 }} /> Import CSV
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal && !!viewingTestCase}
        onClose={() => setShowViewModal(false)}
        title={viewingTestCase?.title || 'Test Case Details'}
        size="lg"
        footer={
          <>
            <button className="dg-btn dg-btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
            <button
              className="dg-btn dg-btn-primary"
              onClick={() => {
                setShowViewModal(false);
                initTestCaseForm(viewingTestCase);
              }}
            >
              <FiEdit2 style={{ marginRight: 6 }} /> Edit Test Case
            </button>
          </>
        }
      >
        {viewingTestCase && (
          <>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiTarget size={14} style={{ color: '#818cf8' }} />
                <span style={{ color: 'var(--text-tertiary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Priority:</span>
                <Badge>{viewingTestCase.priority || "Medium"}</Badge>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiUser size={14} style={{ color: '#818cf8' }} />
                <span style={{ color: 'var(--text-tertiary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned:</span>
                <span style={{ color: 'var(--text-on-dark)', fontSize: '13px' }}>{viewingTestCase.assignedTo || "Unassigned"}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiActivity size={14} style={{ color: '#818cf8' }} />
                <span style={{ color: 'var(--text-tertiary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>State:</span>
                <Badge variant="cyan">{viewingTestCase.state || "Active"}</Badge>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: 'var(--text-on-dark)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiFileText size={14} style={{ color: '#818cf8' }} /> Description
              </h4>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '16px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {viewingTestCase.description || "No description provided."}
              </div>
            </div>

            <div>
              <h4 style={{ color: 'var(--text-on-dark)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiList size={14} style={{ color: '#818cf8' }} /> Test Steps
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(viewingTestCase.steps || []).map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(99,102,241,0.2)', color: '#a5b4fc',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 700,
                    }}>
                      {s.stepNumber}
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Action</span>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', lineHeight: 1.5 }}>{s.action || "—"}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Expected Result</span>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', lineHeight: 1.5 }}>{s.expectedResult || "—"}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showTestCaseModal}
        onClose={() => setShowTestCaseModal(false)}
        title={editingTestCase ? "Edit Test Case" : "Create New Test Case"}
        size="lg"
        footer={
          <>
            <button type="button" className="dg-btn dg-btn-secondary" onClick={() => setShowTestCaseModal(false)}>Cancel</button>
            <button type="submit" form="tc-form" className="dg-btn dg-btn-primary">
              <FiCheck style={{ marginRight: 6 }} /> {editingTestCase ? "Save Changes" : "Create Test Case"}
            </button>
          </>
        }
      >
        <form id="tc-form" onSubmit={handleTestCaseSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <h5 style={{ color: '#a5b4fc', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>Basic Information</h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="dg-input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="dg-input-label">
                  Title <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  className="dg-input"
                  value={tcFormData.title}
                  onChange={(e) => setTcFormData((p) => ({ ...p, title: e.target.value }))}
                  required
                  placeholder="Enter a descriptive title…"
                />
              </div>

              <div className="dg-input-group">
                <label className="dg-input-label">
                  Test Suite <span style={{ color: '#f87171' }}>*</span>
                </label>
                <select
                  className="dg-select"
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
              </div>

              <div className="dg-input-group">
                <label className="dg-input-label">Priority</label>
                <select
                  className="dg-select"
                  value={tcFormData.priority}
                  onChange={(e) => setTcFormData((p) => ({ ...p, priority: e.target.value }))}
                >
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>

              <div className="dg-input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="dg-input-label">Description</label>
                <textarea
                  className="dg-textarea"
                  rows={4}
                  value={tcFormData.description}
                  onChange={(e) => setTcFormData((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Provide a detailed description of the test case…"
                />
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h5 style={{ color: '#a5b4fc', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Test Steps</h5>
              <button type="button" className="dg-btn dg-btn-secondary" style={{ fontSize: '12px', padding: '5px 10px' }} onClick={addStep}>
                <FiPlus style={{ marginRight: 4 }} /> Add Step
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tcFormData.steps.map((step, idx) => (
                <div key={idx} style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px', padding: '14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{
                      background: 'rgba(99,102,241,0.2)', color: '#a5b4fc',
                      padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                    }}>
                      Step {idx + 1}
                    </span>
                    {tcFormData.steps.length > 1 && (
                      <button
                        type="button"
                        className="dg-btn dg-btn-danger"
                        style={{ padding: '4px 6px' }}
                        onClick={() => removeStep(idx)}
                        title="Remove Step"
                      >
                        <FiX size={14} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="dg-input-group">
                      <label className="dg-input-label">Action</label>
                      <textarea
                        className="dg-textarea"
                        rows={3}
                        value={step.action}
                        onChange={(e) => handleStepChange(idx, "action", e.target.value)}
                        placeholder="Describe the action to perform…"
                      />
                    </div>
                    <div className="dg-input-group">
                      <label className="dg-input-label">Expected Result</label>
                      <textarea
                        className="dg-textarea"
                        rows={3}
                        value={step.expectedResult}
                        onChange={(e) => handleStepChange(idx, "expectedResult", e.target.value)}
                        placeholder="Describe the expected outcome…"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Confirm Deletion"
        message={
          <>
            Are you sure you want to delete <strong style={{ color: '#e2e8f0' }}>"{showDeleteConfirm?.name}"</strong>?
            {showDeleteConfirm?.type === "suite" && (
              <p style={{ color: '#fbbf24', margin: '8px 0 0 0', fontSize: '13px' }}>
                This action will permanently delete all test cases within this suite.
              </p>
            )}
            <p style={{ color: 'var(--text-muted)', margin: '8px 0 0 0', fontSize: '12px' }}>This action cannot be undone.</p>
          </>
        }
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
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
      />

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Import Test Cases from CSV"
        footer={
          <>
            <button type="button" className="dg-btn dg-btn-secondary" onClick={() => setShowUploadModal(false)}>Cancel</button>
            <button type="submit" form="upload-form" className="dg-btn dg-btn-primary" disabled={isUploading}>
              {isUploading ? (
                <>
                  <span className="dg-spinner" /> Importing…
                </>
              ) : (
                <>
                  <FiUpload style={{ marginRight: 6 }} /> Import CSV
                </>
              )}
            </button>
          </>
        }
      >
        <form id="upload-form" onSubmit={handleUploadSubmit}>
          <div style={{
            border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px',
            padding: '32px 20px', textAlign: 'center', position: 'relative',
            background: 'rgba(255,255,255,0.02)',
            marginBottom: '16px',
          }}>
            <FiUpload size={32} style={{ color: 'var(--text-tertiary)', marginBottom: '10px' }} />
            <p style={{ color: 'var(--text-tertiary)', margin: '0 0 4px 0', fontSize: '14px' }}>Select a CSV file to import</p>
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Supported format: .csv</span>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              required
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
            />
            {uploadFile && (
              <div style={{
                marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'rgba(99,102,241,0.1)', padding: '8px 14px', borderRadius: '8px',
                color: '#a5b4fc', fontSize: '13px',
              }}>
                <FiFileText /> {uploadFile.name}
              </div>
            )}
          </div>

          <div className="dg-input-group">
            <label className="dg-input-label">
              New Suite Name <span style={{ color: '#f87171' }}>*</span>
            </label>
            <input
              className="dg-input"
              value={uploadSuiteName}
              onChange={(e) => setUploadSuiteName(e.target.value)}
              placeholder="e.g., Sprint 5 Regression Tests"
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default TestCases;
