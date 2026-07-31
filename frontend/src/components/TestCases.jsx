import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  FiAlertCircle, FiCheck, FiChevronDown, FiChevronRight, FiDatabase,
  FiEdit2, FiEye, FiFileText, FiFilter, FiFolder, FiLayers, FiList,
  FiPlus, FiSearch, FiTarget, FiTrash2, FiUpload, FiX, FiBox, FiUser,
  FiInfo, FiCheckCircle, FiAlertTriangle, FiZap, FiArrowRight, FiHash,
  FiMoreVertical, FiClock,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { Modal, ConfirmDialog } from "./shared/Modal";
import { LiquidButton } from './ui/liquid-glass-button';

/* ═══════════════════ BADGES ═══════════════════ */

const priorityConfig = {
  Critical: { color: "#ef4444", bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.22)", icon: FiAlertTriangle },
  High:     { color: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.22)", icon: FiZap },
  Medium:   { color: "#6366f1", bg: "rgba(99,102,241,0.10)", border: "rgba(99,102,241,0.22)", icon: FiTarget },
  Low:      { color: "#22c55e", bg: "rgba(34,197,94,0.10)",  border: "rgba(34,197,94,0.22)", icon: FiArrowRight },
};

const stateConfig = {
  Active:      { color: "#22c55e", bg: "rgba(34,197,94,0.10)" },
  Draft:       { color: "#94a3b8", bg: "rgba(148,163,184,0.10)" },
  Closed:      { color: "#64748b", bg: "rgba(100,116,139,0.10)" },
  "In Review": { color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
};

const PriorityBadge = ({ priority }) => {
  const cfg = priorityConfig[priority] || priorityConfig.Medium;
  const Icon = cfg.icon;
  return (
    <span className="tc-badge" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <Icon size={11} /> {priority}
    </span>
  );
};

const StateBadge = ({ state }) => {
  const cfg = stateConfig[state] || stateConfig.Active;
  return (
    <span className="tc-badge" style={{ color: cfg.color, background: cfg.bg }}>
      <span className="tc-badge-dot" style={{ background: cfg.color }} />
      {state}
    </span>
  );
};

const inputFocus = (e) => { e.target.style.borderColor = "var(--color-primary)"; e.target.style.boxShadow = "0 0 0 3px var(--color-primary-faint)"; };
const inputBlur  = (e) => { e.target.style.borderColor = "var(--border-default)"; e.target.style.boxShadow = "none"; };

/* ═══════════════════ MAIN COMPONENT ═══════════════════ */

function TestCases({
  testSuites = [], testCases = [], settings = {},
  onCreateTestCase, onUpdateTestCase, onDeleteTestCase, onDeleteSuite, onUploadCSV,
}) {
  const showIds = settings.display?.showIds ?? true;
  const [selectedSuiteId, setSelectedSuiteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showNewSuiteInput, setShowNewSuiteInput] = useState(false);
  const [newSuiteName, setNewSuiteName] = useState("");
  const [isCreatingSuite, setIsCreatingSuite] = useState(false);
  const searchRef = useRef(null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showTestCaseModal, setShowTestCaseModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const [editingTestCase, setEditingTestCase] = useState(null);
  const [viewingTestCase, setViewingTestCase] = useState(null);

  const [uploadFile, setUploadFile] = useState(null);
  const [uploadSuiteName, setUploadSuiteName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [tcFormData, setTcFormData] = useState({
    suiteId: "", title: "", description: "", priority: "Medium",
    assignedTo: "", areaPath: "", scenarioType: "", state: "Active",
    steps: [{ stepNumber: 1, action: "", expectedResult: "" }],
  });

  const suiteTestCounts = useMemo(() => {
    const c = {};
    (testCases || []).forEach(tc => { c[String(tc.suiteId)] = (c[String(tc.suiteId)] || 0) + 1; });
    return c;
  }, [testCases]);

  const filteredTestCases = useMemo(() => {
    let f = testCases || [];
    if (selectedSuiteId) f = f.filter(tc => String(tc.suiteId) === String(selectedSuiteId));
    if (searchTerm.trim()) { const t = searchTerm.toLowerCase(); f = f.filter(tc => tc.title?.toLowerCase().includes(t) || tc.adoId?.toString().includes(t)); }
    if (priorityFilter !== "all") f = f.filter(tc => tc.priority === priorityFilter);
    return f;
  }, [testCases, selectedSuiteId, searchTerm, priorityFilter]);

  const priorityCounts = useMemo(() => {
    const src = selectedSuiteId ? (testCases || []).filter(tc => String(tc.suiteId) === String(selectedSuiteId)) : testCases || [];
    return {
      Critical: src.filter(t => t.priority === "Critical").length,
      High: src.filter(t => t.priority === "High").length,
      Medium: src.filter(t => t.priority === "Medium").length,
      Low: src.filter(t => t.priority === "Low").length,
    };
  }, [testCases, selectedSuiteId]);

  const initTestCaseForm = useCallback((tc = null) => {
    if (tc) {
      setTcFormData({
        suiteId: tc.suiteId, title: tc.title || "", description: tc.description || "",
        priority: tc.priority || "Medium", assignedTo: tc.assignedTo || "",
        areaPath: tc.areaPath || "", scenarioType: tc.scenarioType || "",
        state: tc.state || "Active",
        steps: tc.steps?.length > 0 ? tc.steps : [{ stepNumber: 1, action: "", expectedResult: "" }],
      });
      setEditingTestCase(tc);
    } else {
      setTcFormData({
        suiteId: selectedSuiteId || (testSuites[0]?._id || testSuites[0]?.id) || "",
        title: "", description: "", priority: "Medium", assignedTo: "",
        areaPath: "", scenarioType: "", state: "Active",
        steps: [{ stepNumber: 1, action: "", expectedResult: "" }],
      });
      setEditingTestCase(null);
    }
    setShowTestCaseModal(true);
  }, [selectedSuiteId, testSuites]);

  const handleStepChange = (i, field, val) => {
    const n = [...tcFormData.steps]; n[i] = { ...n[i], [field]: val };
    setTcFormData(p => ({ ...p, steps: n }));
  };
  const addStep = () => setTcFormData(p => ({ ...p, steps: [...p.steps, { stepNumber: p.steps.length + 1, action: "", expectedResult: "" }] }));
  const removeStep = (i) => setTcFormData(p => ({ ...p, steps: p.steps.filter((_, j) => j !== i).map((s, j) => ({ ...s, stepNumber: j + 1 })) }));

  const handleTestCaseSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (editingTestCase) await onUpdateTestCase?.(editingTestCase._id || editingTestCase.id, tcFormData);
      else await onCreateTestCase?.(tcFormData);
      setShowTestCaseModal(false);
      toast.success(editingTestCase ? "Test case updated" : "Test case created");
    } catch { toast.error("Error saving test case"); }
    finally { setIsSaving(false); }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadSuiteName.trim()) return toast.error("File and suite name required");
    setShowUploadModal(false);
    setIsUploading(true);
    try {
      const result = await onUploadCSV?.(uploadFile, uploadSuiteName.trim(), "");
      if (result && !result.success && result.error) toast.error(`Import failed: ${result.error}`);
      else { setUploadFile(null); setUploadSuiteName(""); toast.success("CSV imported"); }
    } catch (err) {
      const msg = err?.error || err?.message || 'Unknown error';
      toast.error(`Import failed: ${msg}`);
    }
    finally { setIsUploading(false); }
  };

  const handleCreateSuite = async () => {
    if (!newSuiteName.trim()) return toast.error("Suite name required");
    setIsCreatingSuite(true);
    try {
      toast.success("Suite created");
      setNewSuiteName("");
      setShowNewSuiteInput(false);
    } catch { toast.error("Failed to create suite"); }
    finally { setIsCreatingSuite(false); }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f?.name.endsWith(".csv")) setUploadFile(f);
    else toast.error("Please drop a CSV file");
  };

  useEffect(() => {
    const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); searchRef.current?.focus(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const selectedSuiteName = useMemo(() => {
    if (!selectedSuiteId) return "All Test Cases";
    return testSuites.find(s => String(s._id || s.id) === String(selectedSuiteId))?.name || "Suite";
  }, [selectedSuiteId, testSuites]);

  return (
    <div className="tc-page">
      {/* ═════════ PAGE HEADER ═════════ */}
      <div className="tc-page-header">
        <div className="tc-page-header-left">
          <div className="tc-page-header-icon">
            <FiDatabase size={20} />
          </div>
          <div>
            <h1 className="tc-page-title">Test Cases</h1>
            <p className="tc-page-subtitle">Manage and organize your test library</p>
          </div>
        </div>
        <div className="tc-page-header-actions">
          <LiquidButton variant="secondary" size="sm" onClick={() => setShowUploadModal(true)}>
            <FiUpload size={14} /> Import CSV
          </LiquidButton>
          <LiquidButton variant="default" size="sm" onClick={() => initTestCaseForm()}>
            <FiPlus size={14} /> New Test Case
          </LiquidButton>
        </div>
      </div>

      {/* ═════════ METRICS ═════════ */}
      <div className="tc-metrics">
        <div className="tc-metric" style={{ '--m-color': '#818cf8' }}>
          <div className="tc-metric-icon"><FiLayers size={16} /></div>
          <div>
            <div className="tc-metric-value">{filteredTestCases.length}</div>
            <div className="tc-metric-label">Total Cases</div>
          </div>
        </div>
        <div className="tc-metric" style={{ '--m-color': '#ef4444' }}>
          <div className="tc-metric-icon"><FiAlertTriangle size={16} /></div>
          <div>
            <div className="tc-metric-value">{priorityCounts.Critical}</div>
            <div className="tc-metric-label">Critical</div>
          </div>
        </div>
        <div className="tc-metric" style={{ '--m-color': '#f59e0b' }}>
          <div className="tc-metric-icon"><FiZap size={16} /></div>
          <div>
            <div className="tc-metric-value">{priorityCounts.High}</div>
            <div className="tc-metric-label">High</div>
          </div>
        </div>
        <div className="tc-metric" style={{ '--m-color': '#6366f1' }}>
          <div className="tc-metric-icon"><FiTarget size={16} /></div>
          <div>
            <div className="tc-metric-value">{priorityCounts.Medium}</div>
            <div className="tc-metric-label">Medium</div>
          </div>
        </div>
        <div className="tc-metric" style={{ '--m-color': '#22c55e' }}>
          <div className="tc-metric-icon"><FiCheckCircle size={16} /></div>
          <div>
            <div className="tc-metric-value">{priorityCounts.Low}</div>
            <div className="tc-metric-label">Low</div>
          </div>
        </div>
      </div>

      {/* ═════════ SUITES SECTION ═════════ */}
      <div className="tc-suites-section">
        <div className="tc-suites-header">
          <div className="tc-suites-title">
            <FiFolder size={14} />
            <span>Test Suites</span>
            <span className="tc-count-pill">{testSuites.length}</span>
          </div>
          <button className="tc-btn-inline" onClick={() => setShowNewSuiteInput(p => !p)}>
            <FiPlus size={13} /> New Suite
          </button>
        </div>

        {showNewSuiteInput && (
          <div className="tc-new-suite-form">
            <input
              className="tc-input tc-input-sm"
              value={newSuiteName}
              onChange={e => setNewSuiteName(e.target.value)}
              placeholder="Enter suite name..."
              onKeyDown={e => { if (e.key === 'Enter') handleCreateSuite(); if (e.key === 'Escape') setShowNewSuiteInput(false); }}
              autoFocus
            />
            <button
              className="tc-btn-primary-sm"
              onClick={handleCreateSuite}
              disabled={isCreatingSuite || !newSuiteName.trim()}
            >
              {isCreatingSuite ? '...' : 'Create'}
            </button>
            <button className="tc-btn-ghost" onClick={() => setShowNewSuiteInput(false)}>
              <FiX size={14} />
            </button>
          </div>
        )}

        <div className="tc-suites-grid">
          <button
            className={`tc-suite-card ${!selectedSuiteId ? "tc-suite-card-active" : ""}`}
            onClick={() => setSelectedSuiteId(null)}
          >
            <div className="tc-suite-card-icon"><FiBox size={16} /></div>
            <div className="tc-suite-card-body">
              <div className="tc-suite-card-name">All Cases</div>
              <div className="tc-suite-card-meta">{testCases.length} test cases</div>
            </div>
          </button>
          {testSuites.map(suite => {
            const id = suite._id || suite.id;
            const isActive = String(selectedSuiteId) === String(id);
            const count = suiteTestCounts[String(id)] || 0;
            return (
              <div key={id} className={`tc-suite-card ${isActive ? "tc-suite-card-active" : ""}`}>
                <button className="tc-suite-card-btn" onClick={() => setSelectedSuiteId(id)}>
                  <div className="tc-suite-card-icon"><FiFolder size={16} /></div>
                  <div className="tc-suite-card-body">
                    <div className="tc-suite-card-name">{suite.name}</div>
                    <div className="tc-suite-card-meta">{count} test case{count !== 1 ? 's' : ''}</div>
                  </div>
                </button>
                <button
                  className="tc-suite-card-delete"
                  onClick={e => { e.stopPropagation(); setShowDeleteConfirm({ type: "suite", id, name: suite.name }); }}
                  title="Delete suite"
                >
                  <FiTrash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═════════ TOOLBAR ═════════ */}
      <div className="tc-toolbar">
        <div className="tc-toolbar-title">
          <FiList size={15} />
          <span>{selectedSuiteName}</span>
          <span className="tc-count-pill">{filteredTestCases.length}</span>
        </div>
        <div className="tc-toolbar-actions">
          <div className="tc-search">
            <FiSearch size={13} className="tc-search-icon" />
            <input
              ref={searchRef}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search test cases..."
              className="tc-search-input"
            />
            {searchTerm ? (
              <button className="tc-search-clear" onClick={() => setSearchTerm("")}>
                <FiX size={12} />
              </button>
            ) : (
              <span className="tc-search-kbd">⌘K</span>
            )}
          </div>
          <div className="tc-filter">
            <FiFilter size={12} className="tc-filter-icon" />
            <select className="tc-filter-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <FiChevronDown size={12} className="tc-filter-chevron" />
          </div>
        </div>
      </div>

      {/* ═════════ TEST CASE CARDS ═════════ */}
      <div className="tc-cards">
        {filteredTestCases.length > 0 ? (
          filteredTestCases.map((tc, idx) => {
            const rid = tc._id || tc.id || idx;
            const initials = tc.assignedTo ? tc.assignedTo.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase() : null;
            return (
              <div
                key={rid}
                className="tc-card"
                onClick={() => { setViewingTestCase(tc); setShowViewModal(true); }}
              >
                <div className="tc-card-main">
                  <div className="tc-card-top">
                    {showIds && (
                      <span className="tc-id-badge">
                        <FiHash size={10} />
                        {tc.adoId || `TC-${String(idx + 1).padStart(3, "0")}`}
                      </span>
                    )}
                    <PriorityBadge priority={tc.priority || "Medium"} />
                    <StateBadge state={tc.state || "Active"} />
                  </div>
                  <h3 className="tc-card-title">{tc.title}</h3>
                  {tc.description && (
                    <p className="tc-card-desc">{tc.description}</p>
                  )}
                  <div className="tc-card-footer">
                    {tc.assignedTo ? (
                      <div className="tc-assignee">
                        <div className="tc-avatar">{initials}</div>
                        <span>{tc.assignedTo}</span>
                      </div>
                    ) : (
                      <div className="tc-assignee tc-assignee-empty">
                        <FiUser size={12} />
                        <span>Unassigned</span>
                      </div>
                    )}
                    {tc.steps?.length > 0 && (
                      <div className="tc-meta-item">
                        <FiList size={12} />
                        <span>{tc.steps.length} step{tc.steps.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="tc-card-actions" onClick={e => e.stopPropagation()}>
                  <button className="tc-icon-btn" title="View" onClick={() => { setViewingTestCase(tc); setShowViewModal(true); }}>
                    <FiEye size={14} />
                  </button>
                  <button className="tc-icon-btn tc-icon-btn-edit" title="Edit" onClick={() => initTestCaseForm(tc)}>
                    <FiEdit2 size={14} />
                  </button>
                  <button className="tc-icon-btn tc-icon-btn-danger" title="Delete" onClick={() => setShowDeleteConfirm({ type: "testCase", id: tc._id || tc.id, name: tc.title })}>
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="tc-empty">
            <div className="tc-empty-icon"><FiFileText size={28} /></div>
            <h3>No test cases found</h3>
            <p>{searchTerm || priorityFilter !== "all" ? "Try adjusting your search or filters." : "Create your first test case or import from CSV."}</p>
            <div className="tc-empty-actions">
              {(searchTerm || priorityFilter !== "all") && (
                <LiquidButton variant="secondary" size="sm" onClick={() => { setSearchTerm(""); setPriorityFilter("all"); }}>
                  <FiX size={13} /> Clear Filters
                </LiquidButton>
              )}
              <LiquidButton variant="default" size="sm" onClick={() => initTestCaseForm()}>
                <FiPlus size={13} /> Create Test Case
              </LiquidButton>
            </div>
          </div>
        )}
      </div>

      {/* ═════════ VIEW MODAL ═════════ */}
      <Modal isOpen={showViewModal && !!viewingTestCase} onClose={() => setShowViewModal(false)} title={null} size="lg"
        footer={
          <div className="tc-modal-footer">
            <LiquidButton variant="secondary" size="sm" onClick={() => setShowViewModal(false)}>Close</LiquidButton>
            <LiquidButton variant="default" size="sm" onClick={() => { setShowViewModal(false); initTestCaseForm(viewingTestCase); }}>
              <FiEdit2 size={14} /> Edit
            </LiquidButton>
          </div>
        }
      >
        {viewingTestCase && (
          <div>
            <div className="tc-view-header">
              <div className="tc-view-breadcrumb">
                <span className="tc-id-badge"><FiHash size={10} />{viewingTestCase.adoId || "TC"}</span>
                <FiChevronRight size={11} />
                <span>Test Case Details</span>
              </div>
              <h2 className="tc-view-title">{viewingTestCase.title}</h2>
            </div>
            <div className="tc-view-meta">
              <div className="tc-view-meta-card">
                <span className="tc-view-meta-label">Priority</span>
                <PriorityBadge priority={viewingTestCase.priority || "Medium"} />
              </div>
              <div className="tc-view-meta-card">
                <span className="tc-view-meta-label">State</span>
                <StateBadge state={viewingTestCase.state || "Active"} />
              </div>
              <div className="tc-view-meta-card">
                <span className="tc-view-meta-label">Assigned</span>
                <span className="tc-view-meta-value">{viewingTestCase.assignedTo || "Unassigned"}</span>
              </div>
            </div>
            <div className="tc-view-section">
              <h4 className="tc-section-heading"><FiFileText size={13} /> Description</h4>
              <div className="tc-view-desc">{viewingTestCase.description || "No description provided."}</div>
            </div>
            {viewingTestCase.steps?.length > 0 && (
              <div className="tc-view-section">
                <h4 className="tc-section-heading">
                  <FiList size={13} /> Test Steps
                  <span className="tc-count-pill">{viewingTestCase.steps.length}</span>
                </h4>
                <div className="tc-steps-list">
                  {viewingTestCase.steps.map((s, i) => (
                    <div key={i} className="tc-step-card">
                      <div className="tc-step-num">{s.stepNumber}</div>
                      <div className="tc-step-content">
                        <div>
                          <div className="tc-step-label tc-step-label-action">Action</div>
                          <div className="tc-step-text">{s.action || "—"}</div>
                        </div>
                        <div>
                          <div className="tc-step-label tc-step-label-expected">Expected</div>
                          <div className="tc-step-text">{s.expectedResult || "—"}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ═════════ CREATE / EDIT MODAL ═════════ */}
      <Modal isOpen={showTestCaseModal} onClose={() => setShowTestCaseModal(false)} title={null} size="lg"
        footer={
          <div className="tc-modal-footer">
            <LiquidButton variant="secondary" size="sm" onClick={() => setShowTestCaseModal(false)}>Cancel</LiquidButton>
            <LiquidButton type="submit" form="tc-form" disabled={isSaving} variant="default" size="sm">
              <FiCheck size={14} /> {isSaving ? "Saving…" : editingTestCase ? "Save Changes" : "Create"}
            </LiquidButton>
          </div>
        }
      >
        <form id="tc-form" onSubmit={handleTestCaseSubmit}>
          <div className="tc-form-header">
            <h2>{editingTestCase ? "Edit Test Case" : "Create New Test Case"}</h2>
            <p>{editingTestCase ? "Update the details below." : "Fill in the details to create a new test case."}</p>
          </div>
          <div className="tc-form-section">
            <div className="tc-form-section-title"><FiInfo size={13} /> Basic Information</div>
            <div className="tc-form-grid">
              <div className="tc-form-full">
                <label className="tc-label">Title <span className="tc-required">*</span></label>
                <input className="tc-input" value={tcFormData.title} onChange={e => setTcFormData(p => ({ ...p, title: e.target.value }))} required placeholder="Enter a descriptive title..." onFocus={inputFocus} onBlur={inputBlur} />
              </div>
              <div>
                <label className="tc-label">Test Suite <span className="tc-required">*</span></label>
                <select className="tc-input tc-select" value={tcFormData.suiteId} onChange={e => setTcFormData(p => ({ ...p, suiteId: e.target.value }))} required>
                  <option value="">Select a suite</option>
                  {testSuites.map(s => <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="tc-label">Priority</label>
                <select className="tc-input tc-select" value={tcFormData.priority} onChange={e => setTcFormData(p => ({ ...p, priority: e.target.value }))}>
                  <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>
              <div className="tc-form-full">
                <label className="tc-label">Description</label>
                <textarea className="tc-input tc-textarea" rows={4} value={tcFormData.description} onChange={e => setTcFormData(p => ({ ...p, description: e.target.value }))} placeholder="Provide a detailed description..." onFocus={inputFocus} onBlur={inputBlur} />
              </div>
            </div>
          </div>
          <div className="tc-form-section">
            <div className="tc-form-section-header">
              <div className="tc-form-section-title">
                <FiList size={13} /> Test Steps <span className="tc-count-pill">{tcFormData.steps.length}</span>
              </div>
              <button type="button" className="tc-btn-inline" onClick={addStep}><FiPlus size={13} /> Add Step</button>
            </div>
            <div className="tc-steps-edit">
              {tcFormData.steps.map((step, idx) => (
                <div key={idx} className="tc-step-edit">
                  <div className="tc-step-edit-header">
                    <div className="tc-step-edit-badge">{idx + 1}</div>
                    <span className="tc-step-edit-label">Step {idx + 1}</span>
                    {tcFormData.steps.length > 1 && (
                      <button type="button" className="tc-step-remove" onClick={() => removeStep(idx)}><FiTrash2 size={13} /></button>
                    )}
                  </div>
                  <div className="tc-step-edit-grid">
                    <div>
                      <label className="tc-label-sm">Action</label>
                      <textarea className="tc-input tc-textarea-sm" rows={3} value={step.action} onChange={e => handleStepChange(idx, "action", e.target.value)} placeholder="Describe the action..." onFocus={inputFocus} onBlur={inputBlur} />
                    </div>
                    <div>
                      <label className="tc-label-sm">Expected Result</label>
                      <textarea className="tc-input tc-textarea-sm" rows={3} value={step.expectedResult} onChange={e => handleStepChange(idx, "expectedResult", e.target.value)} placeholder="Expected outcome..." onFocus={inputFocus} onBlur={inputBlur} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* ═════════ DELETE CONFIRM ═════════ */}
      <ConfirmDialog
        isOpen={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)}
        title="Confirm Deletion"
        message={
          <div>
            <p style={{ color: "var(--text-secondary)", margin: "0 0 8px", fontSize: 14 }}>
              Delete <strong style={{ color: "var(--text-primary)" }}>"{showDeleteConfirm?.name}"</strong>?
            </p>
            {showDeleteConfirm?.type === "suite" && (
              <div className="tc-warning-banner">
                <FiAlertTriangle size={15} />
                <span>All test cases within this suite will be permanently deleted.</span>
              </div>
            )}
            <p style={{ color: "var(--text-muted)", margin: "10px 0 0", fontSize: 12 }}>This action cannot be undone.</p>
          </div>
        }
        confirmLabel="Delete" danger
        onConfirm={async () => {
          try {
            if (showDeleteConfirm.type === "suite") {
              await onDeleteSuite?.(showDeleteConfirm.id);
              if (String(selectedSuiteId) === String(showDeleteConfirm.id)) setSelectedSuiteId(null);
            } else await onDeleteTestCase?.(showDeleteConfirm.id);
            setShowDeleteConfirm(null);
            toast.success("Deleted");
          } catch { toast.error("Delete failed"); }
        }}
      />

      {/* ═════════ UPLOAD MODAL ═════════ */}
      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title={null}
        footer={
          <div className="tc-modal-footer">
            <LiquidButton variant="secondary" size="sm" onClick={() => setShowUploadModal(false)}>Cancel</LiquidButton>
            <LiquidButton type="submit" form="upload-form" disabled={isUploading} variant="default" size="sm">
              {isUploading ? <><span className="tc-spinner" /> Importing…</> : <><FiUpload size={14} /> Import</>}
            </LiquidButton>
          </div>
        }
      >
        <form id="upload-form" onSubmit={handleUploadSubmit}>
          <div className="tc-form-header">
            <h2>Import from CSV</h2>
            <p>Upload a CSV file to bulk-create test cases.</p>
          </div>
          <div
            className={`tc-dropzone ${dragOver ? "tc-dropzone-active" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input type="file" accept=".csv" onChange={e => setUploadFile(e.target.files?.[0] || null)} className="tc-dropzone-input" />
            <div className="tc-dropzone-icon"><FiUpload size={22} /></div>
            <p className="tc-dropzone-text">Drag & drop your CSV file here</p>
            <p className="tc-dropzone-hint">or click to browse · .csv only</p>
            {uploadFile && (
              <div className="tc-dropzone-file">
                <FiCheckCircle size={14} />
                {uploadFile.name}
                <button type="button" onClick={e => { e.stopPropagation(); setUploadFile(null); }} className="tc-dropzone-file-remove"><FiX size={13} /></button>
              </div>
            )}
          </div>
          <div style={{ marginTop: 16 }}>
            <label className="tc-label">New Suite Name <span className="tc-required">*</span></label>
            <input className="tc-input" value={uploadSuiteName} onChange={e => setUploadSuiteName(e.target.value)} placeholder="e.g., Sprint 5 Regression" required onFocus={inputFocus} onBlur={inputBlur} />
          </div>
        </form>
      </Modal>

      {isUploading && (
        <div className="tc-upload-loading-overlay">
          <div className="tc-upload-loading-popup">
            <div className="tc-upload-loading-spinner" />
            <div className="tc-upload-loading-text">Uploading CSV…</div>
            <div className="tc-upload-loading-hint">Please wait while we process your file</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TestCases;
