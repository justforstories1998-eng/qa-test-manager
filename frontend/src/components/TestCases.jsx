import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  FiAlertCircle, FiCheck, FiChevronDown, FiChevronRight, FiDatabase,
  FiEdit2, FiEye, FiFileText, FiFilter, FiFolder, FiLayers, FiList,
  FiPlus, FiSearch, FiTarget, FiTrash2, FiUpload, FiX, FiBox, FiUser,
  FiInfo, FiCheckCircle, FiAlertTriangle, FiZap, FiArrowRight, FiHash,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { Modal, ConfirmDialog } from "./shared/Modal";

/* ═══════════════════ HELPERS & BADGES ═══════════════════ */

const priorityConfig = {
  Critical: { color: "#ef4444", bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.22)", icon: FiAlertTriangle },
  High:     { color: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.22)", icon: FiZap },
  Medium:   { color: "#6366f1", bg: "rgba(99,102,241,0.10)",  border: "rgba(99,102,241,0.22)", icon: FiTarget },
  Low:      { color: "#22c55e", bg: "rgba(34,197,94,0.10)",   border: "rgba(34,197,94,0.22)", icon: FiArrowRight },
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
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 10px 4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
      whiteSpace: "nowrap", lineHeight: 1,
    }}>
      <Icon size={12} /> {priority}
    </span>
  );
};

const StateBadge = ({ state }) => {
  const cfg = stateConfig[state] || stateConfig.Active;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 600,
      color: cfg.color, background: cfg.bg, lineHeight: 1,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
      {state}
    </span>
  );
};

const MetricPill = ({ icon: Icon, label, value, color = "#818cf8" }) => (
  <div className="tc-metric-pill">
    <div className="tc-metric-icon" style={{ background: `${color}15`, borderColor: `${color}25` }}>
      <Icon size={16} style={{ color }} />
    </div>
    <div>
      <div className="tc-metric-value">{value}</div>
      <div className="tc-metric-label">{label}</div>
    </div>
  </div>
);

/* shared input helpers */
const inputFocus = (e) => { e.target.style.borderColor = "var(--tc-accent)"; e.target.style.boxShadow = "0 0 0 3px var(--tc-accent-glow)"; };
const inputBlur  = (e) => { e.target.style.borderColor = "var(--tc-border)"; e.target.style.boxShadow = "none"; };

/* ═══════════════════ MAIN COMPONENT ═══════════════════ */

function TestCases({
  testSuites = [], testCases = [], settings = {},
  onCreateTestCase, onUpdateTestCase, onDeleteTestCase, onDeleteSuite, onUploadCSV,
}) {
  const showIds = settings.display?.showIds ?? true;
  const [selectedSuiteId, setSelectedSuiteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);
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

  /* ── derived data ── */
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
    return { Critical: src.filter(t => t.priority === "Critical").length, High: src.filter(t => t.priority === "High").length, Medium: src.filter(t => t.priority === "Medium").length, Low: src.filter(t => t.priority === "Low").length };
  }, [testCases, selectedSuiteId]);

  const selectedSuiteName = useMemo(() => {
    if (!selectedSuiteId) return "All Test Cases";
    return testSuites.find(s => String(s._id || s.id) === String(selectedSuiteId))?.name || "Suite";
  }, [selectedSuiteId, testSuites]);

  /* ── form ── */
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
    setIsUploading(true);
    try {
      const result = await onUploadCSV?.(uploadFile, uploadSuiteName.trim(), "");
      if (result && !result.success && result.error) {
        toast.error(`Import failed: ${result.error}`);
      } else {
        setShowUploadModal(false); setUploadFile(null); setUploadSuiteName("");
        toast.success("CSV imported");
      }
    } catch (err) {
      console.error('CSV Upload error:', err);
      const msg = err?.error || err?.message || JSON.stringify(err) || 'Unknown error';
      toast.error(`Import failed: ${msg}`);
    }
    finally { setIsUploading(false); }
  };

  const handleCreateSuite = async () => {
    if (!newSuiteName.trim()) return toast.error("Suite name required");
    setIsCreatingSuite(true);
    try {
      const res = await api.createTestSuite({ name: newSuiteName.trim(), projectId: testSuites[0]?.projectId || '' });
      if (res.success) {
        toast.success("Suite created");
        setNewSuiteName("");
        setShowNewSuiteInput(false);
        window.location.reload();
      }
    } catch { toast.error("Failed to create suite"); }
    finally { setIsCreatingSuite(false); }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f?.name.endsWith(".csv")) setUploadFile(f);
    else toast.error("Please drop a CSV file");
  };

  /* ── keyboard shortcut ── */
  useEffect(() => {
    const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); searchRef.current?.focus(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <div className="tc-page">
      {/* ──── HEADER ──── */}
      <div className="tc-header">
        <div className="tc-header-left">
          <div className="tc-header-icon">
            <FiDatabase size={18} />
          </div>
          <div>
            <h1 className="tc-title">Test Cases</h1>
            <p className="tc-subtitle">Manage and organize your test library</p>
          </div>
        </div>
        <div className="tc-header-actions">
          <button className="tc-btn tc-btn-secondary" onClick={() => setShowUploadModal(true)}>
            <FiUpload size={15} /> Import CSV
          </button>
          <button className="tc-btn tc-btn-primary" onClick={() => initTestCaseForm()}>
            <FiPlus size={15} /> New Test Case
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="tc-metrics-row">
        <MetricPill icon={FiLayers} label="Total Cases" value={filteredTestCases.length} color="#818cf8" />
        <MetricPill icon={FiAlertTriangle} label="Critical" value={priorityCounts.Critical} color="#ef4444" />
        <MetricPill icon={FiZap} label="High" value={priorityCounts.High} color="#f59e0b" />
        <MetricPill icon={FiTarget} label="Medium" value={priorityCounts.Medium} color="#6366f1" />
        <MetricPill icon={FiCheckCircle} label="Low" value={priorityCounts.Low} color="#22c55e" />
      </div>

      {/* ──── BODY ──── */}
      <div className="tc-body">
        {/* ── SIDEBAR ── */}
        <aside className={`tc-sidebar ${sidebarCollapsed ? "tc-sidebar-collapsed" : ""}`}>
          <div className="tc-sidebar-header">
            {!sidebarCollapsed && (
              <div className="tc-sidebar-title">
                <FiFolder size={13} /> Suites
                <span className="tc-sidebar-count">{testSuites.length}</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 4 }}>
              {!sidebarCollapsed && (
                <button
                  className="tc-sidebar-toggle"
                  onClick={() => setShowNewSuiteInput(p => !p)}
                  title="New Suite"
                  style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: '1px solid var(--tc-border)', background: showNewSuiteInput ? 'var(--tc-accent-bg)' : 'transparent', color: showNewSuiteInput ? 'var(--tc-accent)' : 'var(--tc-text-secondary)', cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  <FiPlus size={14} />
                </button>
              )}
              <button className="tc-sidebar-toggle" onClick={() => setSidebarCollapsed(p => !p)}>
                {sidebarCollapsed ? <FiChevronRight size={15} /> : <FiChevronDown size={15} />}
              </button>
            </div>
          </div>

          {showNewSuiteInput && !sidebarCollapsed && (
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--tc-border)' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  className="tc-input"
                  value={newSuiteName}
                  onChange={e => setNewSuiteName(e.target.value)}
                  placeholder="Suite name..."
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateSuite(); if (e.key === 'Escape') setShowNewSuiteInput(false); }}
                  autoFocus
                  style={{ flex: 1, padding: '6px 10px', fontSize: 12, borderRadius: 6 }}
                />
                <button
                  onClick={handleCreateSuite}
                  disabled={isCreatingSuite || !newSuiteName.trim()}
                  style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: isCreatingSuite || !newSuiteName.trim() ? 0.5 : 1 }}
                >
                  {isCreatingSuite ? '...' : 'Add'}
                </button>
              </div>
            </div>
          )}

          <div className="tc-sidebar-list">
            {/* All Cases */}
            <button
              className={`tc-suite-btn ${!selectedSuiteId ? "tc-suite-active" : ""}`}
              onClick={() => setSelectedSuiteId(null)}
              title="All Test Cases"
            >
              {!selectedSuiteId && <div className="tc-suite-indicator" />}
              <FiBox size={15} />
              {!sidebarCollapsed && (
                <>
                  <span className="tc-suite-name">All Cases</span>
                  <span className="tc-suite-count">{testCases.length}</span>
                </>
              )}
            </button>

            {!sidebarCollapsed && <div className="tc-sidebar-divider" />}

            {testSuites.map(suite => {
              const id = suite._id || suite.id;
              const isActive = String(selectedSuiteId) === String(id);
              return (
                <div key={id} className="tc-suite-row">
                  <button
                    className={`tc-suite-btn ${isActive ? "tc-suite-active" : ""}`}
                    onClick={() => setSelectedSuiteId(id)}
                    title={suite.name}
                  >
                    {isActive && <div className="tc-suite-indicator" />}
                    <FiFolder size={14} />
                    {!sidebarCollapsed && (
                      <>
                        <span className="tc-suite-name">{suite.name}</span>
                        <span className="tc-suite-count">{suiteTestCounts[String(id)] || 0}</span>
                      </>
                    )}
                  </button>
                  {!sidebarCollapsed && (
                    <button
                      className="tc-suite-delete"
                      onClick={e => { e.stopPropagation(); setShowDeleteConfirm({ type: "suite", id, name: suite.name }); }}
                      title="Delete suite"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="tc-main">
          {/* Toolbar */}
          <div className="tc-toolbar">
            <div className="tc-breadcrumb">
              <FiDatabase size={13} />
              <span>Repository</span>
              <FiChevronRight size={12} />
              <span className="tc-breadcrumb-active">{selectedSuiteName}</span>
            </div>

            <div className="tc-search-wrapper">
              <FiSearch size={14} className="tc-search-icon" />
              <input
                ref={searchRef}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search cases…"
                className="tc-search-input"
              />
              {searchTerm ? (
                <button className="tc-search-clear" onClick={() => setSearchTerm("")}>
                  <FiX size={12} />
                </button>
              ) : (
                <span className="tc-search-shortcut">⌘K</span>
              )}
            </div>

            <div className="tc-filter-wrapper">
              <FiFilter size={13} className="tc-filter-icon" style={{ color: priorityFilter !== "all" ? "var(--tc-accent)" : undefined }} />
              <select className="tc-filter-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                <option value="all">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <FiChevronDown size={13} className="tc-filter-chevron" />
            </div>

            <div className="tc-result-count">
              <span className="tc-result-num">{filteredTestCases.length}</span> results
            </div>
          </div>

          {/* Table */}
          <div className="tc-table-area">
            {filteredTestCases.length > 0 ? (
              <table className="tc-table">
                <thead>
                  <tr>
                    {showIds && <th style={{ width: 100 }}>ID</th>}
                    <th>Title</th>
                    <th style={{ width: 120 }}>Priority</th>
                    <th style={{ width: 110 }}>State</th>
                    <th style={{ width: 160 }}>Assigned To</th>
                    <th style={{ width: 80 }} />
                  </tr>
                </thead>
                <tbody>
                  {filteredTestCases.map((tc, idx) => {
                    const rid = tc._id || tc.id || idx;
                    const isH = hoveredRow === rid;
                    return (
                      <tr
                        key={rid}
                        className={isH ? "tc-row-hover" : ""}
                        onMouseEnter={() => setHoveredRow(rid)}
                        onMouseLeave={() => setHoveredRow(null)}
                        onClick={() => { setViewingTestCase(tc); setShowViewModal(true); }}
                      >
                        {showIds && (
                        <td>
                          <span className="tc-id-badge">
                            {tc.adoId || `TC-${String(idx + 1).padStart(3, "0")}`}
                          </span>
                        </td>
                        )}
                        <td className="tc-title-cell">{tc.title}</td>
                        <td><PriorityBadge priority={tc.priority || "Medium"} /></td>
                        <td><StateBadge state={tc.state || "Active"} /></td>
                        <td>
                          {tc.assignedTo ? (
                            <div className="tc-assignee">
                              <div className="tc-avatar-sm">
                                {tc.assignedTo.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()}
                              </div>
                              <span>{tc.assignedTo}</span>
                            </div>
                          ) : (
                            <span className="tc-unassigned">Unassigned</span>
                          )}
                        </td>
                        <td>
                          <div className="tc-row-actions" style={{ opacity: isH ? 1 : 0 }} onClick={e => e.stopPropagation()}>
                            <button className="tc-action-btn tc-action-edit" title="Edit" onClick={() => initTestCaseForm(tc)}>
                              <FiEdit2 size={13} />
                            </button>
                            <button className="tc-action-btn tc-action-delete" title="Delete" onClick={() => setShowDeleteConfirm({ type: "testCase", id: tc._id || tc.id, name: tc.title })}>
                              <FiTrash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="tc-empty">
                <div className="tc-empty-icon"><FiFileText size={32} /></div>
                <h3>No test cases found</h3>
                <p>{searchTerm || priorityFilter !== "all" ? "Try adjusting your search or filters." : "Create your first test case or import from CSV."}</p>
                <div className="tc-empty-actions">
                  {(searchTerm || priorityFilter !== "all") && (
                    <button className="tc-btn tc-btn-secondary" onClick={() => { setSearchTerm(""); setPriorityFilter("all"); }}>
                      <FiX size={14} /> Clear Filters
                    </button>
                  )}
                  <button className="tc-btn tc-btn-primary" onClick={() => initTestCaseForm()}>
                    <FiPlus size={14} /> Create Test Case
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ══════════ VIEW MODAL ══════════ */}
      <Modal isOpen={showViewModal && !!viewingTestCase} onClose={() => setShowViewModal(false)} title={null} size="lg"
        footer={
          <div className="tc-modal-footer">
            <button className="tc-btn tc-btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
            <button className="tc-btn tc-btn-primary" onClick={() => { setShowViewModal(false); initTestCaseForm(viewingTestCase); }}>
              <FiEdit2 size={14} /> Edit
            </button>
          </div>
        }
      >
        {viewingTestCase && (
          <div>
            <div className="tc-view-header">
              <div className="tc-view-breadcrumb">
                <span className="tc-id-badge">{viewingTestCase.adoId || "TC"}</span>
                <FiChevronRight size={12} />
                <span>Test Case Details</span>
              </div>
              <h2 className="tc-view-title">{viewingTestCase.title}</h2>
            </div>

            <div className="tc-view-meta">
              {[
                { label: "Priority", content: <PriorityBadge priority={viewingTestCase.priority || "Medium"} /> },
                { label: "State", content: <StateBadge state={viewingTestCase.state || "Active"} /> },
                { label: "Assigned", content: <span className="tc-view-meta-value">{viewingTestCase.assignedTo || "Unassigned"}</span> },
              ].map(m => (
                <div key={m.label} className="tc-view-meta-card">
                  <span className="tc-view-meta-label">{m.label}</span>
                  {m.content}
                </div>
              ))}
            </div>

            <div className="tc-view-section">
              <h4 className="tc-section-heading"><FiFileText size={13} /> Description</h4>
              <div className="tc-view-desc">{viewingTestCase.description || "No description provided."}</div>
            </div>

            {viewingTestCase.steps?.length > 0 && (
              <div className="tc-view-section">
                <h4 className="tc-section-heading">
                  <FiList size={13} /> Test Steps
                  <span className="tc-step-count">{viewingTestCase.steps.length}</span>
                </h4>
                <div className="tc-steps-list">
                  {viewingTestCase.steps.map((s, i) => (
                    <div key={i} className="tc-step-card">
                      <div className="tc-step-num">{s.stepNumber}</div>
                      <div className="tc-step-content">
                        <div><div className="tc-step-label tc-step-label-action">Action</div><div className="tc-step-text">{s.action || "—"}</div></div>
                        <div><div className="tc-step-label tc-step-label-expected">Expected</div><div className="tc-step-text">{s.expectedResult || "—"}</div></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ══════════ CREATE / EDIT MODAL ══════════ */}
      <Modal isOpen={showTestCaseModal} onClose={() => setShowTestCaseModal(false)} title={null} size="lg"
        footer={
          <div className="tc-modal-footer">
            <button className="tc-btn tc-btn-secondary" onClick={() => setShowTestCaseModal(false)}>Cancel</button>
            <button type="submit" form="tc-form" disabled={isSaving} className={`tc-btn tc-btn-primary ${isSaving ? "tc-btn-disabled" : ""}`}>
              <FiCheck size={14} /> {isSaving ? "Saving…" : editingTestCase ? "Save Changes" : "Create Test Case"}
            </button>
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
                <input className="tc-input" value={tcFormData.title} onChange={e => setTcFormData(p => ({ ...p, title: e.target.value }))} required placeholder="Enter a descriptive title…" onFocus={inputFocus} onBlur={inputBlur} />
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
                <textarea className="tc-input tc-textarea" rows={4} value={tcFormData.description} onChange={e => setTcFormData(p => ({ ...p, description: e.target.value }))} placeholder="Provide a detailed description…" onFocus={inputFocus} onBlur={inputBlur} />
              </div>
            </div>
          </div>

          <div className="tc-form-section">
            <div className="tc-form-section-header">
              <div className="tc-form-section-title">
                <FiList size={13} /> Test Steps <span className="tc-step-count">{tcFormData.steps.length}</span>
              </div>
              <button type="button" className="tc-btn-add-step" onClick={addStep}><FiPlus size={13} /> Add Step</button>
            </div>
            <div className="tc-steps-edit-list">
              {tcFormData.steps.map((step, idx) => (
                <div key={idx} className="tc-step-edit-card">
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
                      <textarea className="tc-input tc-textarea-sm" rows={3} value={step.action} onChange={e => handleStepChange(idx, "action", e.target.value)} placeholder="Describe the action…" onFocus={inputFocus} onBlur={inputBlur} />
                    </div>
                    <div>
                      <label className="tc-label-sm">Expected Result</label>
                      <textarea className="tc-input tc-textarea-sm" rows={3} value={step.expectedResult} onChange={e => handleStepChange(idx, "expectedResult", e.target.value)} placeholder="Expected outcome…" onFocus={inputFocus} onBlur={inputBlur} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* ══════════ DELETE CONFIRM ══════════ */}
      <ConfirmDialog
        isOpen={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)}
        title="Confirm Deletion"
        message={
          <div>
            <p style={{ color: "var(--tc-text-secondary)", margin: "0 0 8px", fontSize: 14 }}>
              Delete <strong style={{ color: "var(--tc-text)" }}>"{showDeleteConfirm?.name}"</strong>?
            </p>
            {showDeleteConfirm?.type === "suite" && (
              <div className="tc-warning-banner">
                <FiAlertTriangle size={15} />
                <span>All test cases within this suite will be permanently deleted.</span>
              </div>
            )}
            <p style={{ color: "var(--tc-text-muted)", margin: "10px 0 0", fontSize: 12 }}>This action cannot be undone.</p>
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

      {/* ══════════ UPLOAD MODAL ══════════ */}
      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title={null}
        footer={
          <div className="tc-modal-footer">
            <button className="tc-btn tc-btn-secondary" onClick={() => setShowUploadModal(false)}>Cancel</button>
            <button type="submit" form="upload-form" disabled={isUploading} className={`tc-btn tc-btn-primary ${isUploading ? "tc-btn-disabled" : ""}`}>
              {isUploading ? (<><span className="tc-spinner" /> Importing…</>) : (<><FiUpload size={14} /> Import</>)}
            </button>
          </div>
        }
      >
        <form id="upload-form" onSubmit={handleUploadSubmit}>
          <div className="tc-form-header">
            <h2>Import from CSV</h2>
            <p>Upload a CSV file to bulk-create test cases.</p>
          </div>

          <div
            className={`tc-dropzone ${dragOver ? "tc-dropzone-active" : ""} ${uploadFile ? "tc-dropzone-has-file" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input type="file" accept=".csv" onChange={e => setUploadFile(e.target.files?.[0] || null)} required className="tc-dropzone-input" />
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

      {/* ── STYLES ── */}
      <style>{`
        /* ═══════ THEME TOKENS ═══════ */
        .tc-page {
          --tc-accent: #6366f1;
          --tc-accent-light: #818cf8;
          --tc-accent-glow: rgba(99,102,241,0.08);
          --tc-accent-bg: rgba(99,102,241,0.12);
          --tc-accent-border: rgba(99,102,241,0.2);
          display: flex; flex-direction: column; height: 100%; gap: 0;
        }

        /* ── Dark mode (default) ── */
        .tc-page {
          --tc-bg: transparent;
          --tc-surface: rgba(255,255,255,0.02);
          --tc-surface-hover: rgba(255,255,255,0.04);
          --tc-surface-input: rgba(255,255,255,0.03);
          --tc-border: rgba(255,255,255,0.06);
          --tc-border-hover: rgba(255,255,255,0.1);
          --tc-text: #f1f5f9;
          --tc-text-secondary: rgba(203,213,225,0.8);
          --tc-text-muted: rgba(148,163,184,0.5);
          --tc-row-hover: rgba(99,102,241,0.04);
          --tc-sidebar-bg: rgba(255,255,255,0.01);
          --tc-danger: #f87171;
        }

        /* ── Light mode ── */
        [data-theme="light"] .tc-page {
          --tc-surface: #ffffff;
          --tc-surface-hover: #f8fafc;
          --tc-surface-input: #ffffff;
          --tc-border: #e2e8f0;
          --tc-border-hover: #cbd5e1;
          --tc-text: #0f172a;
          --tc-text-secondary: #475569;
          --tc-text-muted: #94a3b8;
          --tc-row-hover: rgba(99,102,241,0.04);
          --tc-sidebar-bg: #f8fafc;
          --tc-danger: #ef4444;
          --tc-accent-glow: rgba(99,102,241,0.06);
        }

        /* ═══════ HEADER ═══════ */
        .tc-header {
          padding: 28px 32px 24px;
          border-bottom: 1px solid var(--tc-border);
          display: flex; align-items: flex-start; justify-content: space-between; gap: 20px;
          flex-wrap: wrap;
        }
        .tc-header-left { display: flex; align-items: center; gap: 10px; }
        .tc-header-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: var(--tc-accent-bg); border: 1px solid var(--tc-accent-border);
          display: flex; align-items: center; justify-content: center;
          color: var(--tc-accent-light);
        }
        .tc-title { margin: 0; font-size: 22px; font-weight: 700; color: var(--tc-text); letter-spacing: -0.3px; line-height: 1.2; }
        .tc-subtitle { margin: 0; font-size: 13px; color: var(--tc-text-muted); }
        .tc-header-actions { display: flex; gap: 10px; flex-shrink: 0; }

        /* ═══════ METRICS ═══════ */
        .tc-metrics-row { display: flex; gap: 12px; padding: 0 32px 20px; flex-wrap: wrap; }
        .tc-metric-pill {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 16px; border-radius: 10px;
          background: var(--tc-surface); border: 1px solid var(--tc-border);
          min-width: 120px; transition: all 0.15s;
        }
        .tc-metric-pill:hover { border-color: var(--tc-border-hover); }
        .tc-metric-icon {
          width: 34px; height: 34px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          border: 1px solid transparent;
        }
        .tc-metric-value { font-size: 18px; font-weight: 700; color: var(--tc-text); line-height: 1.1; }
        .tc-metric-label { font-size: 11px; color: var(--tc-text-muted); margin-top: 2px; }

        /* ═══════ BODY LAYOUT ═══════ */
        .tc-body { display: flex; flex: 1; min-height: 0; overflow: hidden; }

        /* ═══════ SIDEBAR ═══════ */
        .tc-sidebar {
          width: 264px; flex-shrink: 0; display: flex; flex-direction: column;
          border-right: 1px solid var(--tc-border); background: var(--tc-sidebar-bg);
          transition: width 0.25s cubic-bezier(0.4,0,0.2,1); overflow: hidden;
        }
        .tc-sidebar-collapsed { width: 56px; }
        .tc-sidebar-header {
          padding: 14px 16px; border-bottom: 1px solid var(--tc-border);
          display: flex; align-items: center; justify-content: space-between; min-height: 48px;
        }
        .tc-sidebar-collapsed .tc-sidebar-header { padding: 14px 10px; justify-content: center; }
        .tc-sidebar-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 600; color: var(--tc-text-muted);
          text-transform: uppercase; letter-spacing: 1px;
        }
        .tc-sidebar-count {
          background: var(--tc-accent-bg); color: var(--tc-accent-light);
          padding: 1px 7px; border-radius: 4px; font-size: 10px; font-weight: 700;
        }
        .tc-sidebar-toggle {
          background: none; border: none; color: var(--tc-text-muted); cursor: pointer;
          padding: 4px; border-radius: 6px; display: flex; transition: color 0.15s;
        }
        .tc-sidebar-toggle:hover { color: var(--tc-text-secondary); }
        .tc-sidebar-list { flex: 1; overflow-y: auto; padding: 8px 10px; }
        .tc-sidebar-collapsed .tc-sidebar-list { padding: 8px 6px; }
        .tc-sidebar-divider { height: 1px; background: var(--tc-border); margin: 8px 12px; }

        .tc-suite-row { display: flex; align-items: center; gap: 2px; margin-bottom: 2px; position: relative; }
        .tc-suite-btn {
          width: 100%; display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 8px; border: 1px solid transparent;
          cursor: pointer; font-size: 13px; font-weight: 500;
          color: var(--tc-text-secondary); background: transparent;
          transition: all 0.2s; position: relative; text-align: left;
        }
        .tc-sidebar-collapsed .tc-suite-btn { justify-content: center; gap: 0; padding: 10px 0; }
        .tc-suite-btn:hover { background: var(--tc-surface-hover); }
        .tc-suite-active {
          color: var(--text-active, #111827) !important; font-weight: 600 !important;
          background: var(--tc-accent-bg) !important;
          border-color: var(--tc-accent-border) !important;
        }
        .tc-suite-indicator {
          position: absolute; left: 0; top: 20%; bottom: 20%; width: 3px;
          border-radius: 0 3px 3px 0; background: linear-gradient(180deg, #6366f1, #8b5cf6);
        }
        .tc-suite-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .tc-suite-count {
          font-size: 11px; font-weight: 700; color: var(--tc-text-muted);
          background: var(--tc-surface-hover); padding: 2px 7px; border-radius: 4px; flex-shrink: 0;
        }
        .tc-suite-delete {
          background: none; border: none; color: var(--tc-text-muted); cursor: pointer;
          padding: 6px; border-radius: 6px; display: flex; opacity: 0.5; transition: all 0.15s; flex-shrink: 0;
        }
        .tc-suite-delete:hover { color: var(--tc-danger); background: rgba(248,113,113,0.08); opacity: 1; }

        /* ═══════ MAIN ═══════ */
        .tc-main { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }

        /* ── Toolbar ── */
        .tc-toolbar {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 24px; border-bottom: 1px solid var(--tc-border);
          background: var(--tc-sidebar-bg);
        }
        .tc-breadcrumb {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; color: var(--tc-text-muted); margin-right: auto;
        }
        .tc-breadcrumb-active { color: var(--tc-text); font-weight: 500; }

        .tc-search-wrapper { position: relative; width: 260px; }
        .tc-search-icon {
          position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
          color: var(--tc-text-muted); pointer-events: none;
        }
        .tc-search-input {
          width: 100%; padding: 8px 60px 8px 32px; border-radius: 8px;
          border: 1px solid var(--tc-border); background: var(--tc-surface-input);
          color: var(--tc-text); font-size: 13px; outline: none; transition: all 0.2s;
          box-sizing: border-box;
        }
        .tc-search-input:focus {
          border-color: var(--tc-accent); box-shadow: 0 0 0 3px var(--tc-accent-glow);
          background: var(--tc-surface);
        }
        .tc-search-clear {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          background: var(--tc-surface-hover); border: none; color: var(--tc-text-muted);
          cursor: pointer; padding: 2px 5px; border-radius: 4px; display: flex;
        }
        .tc-search-shortcut {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          font-size: 10px; color: var(--tc-text-muted); background: var(--tc-surface-hover);
          padding: 2px 6px; border-radius: 4px; border: 1px solid var(--tc-border);
          font-family: monospace; font-weight: 600;
        }

        .tc-filter-wrapper { position: relative; }
        .tc-filter-icon {
          position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
          color: var(--tc-text-muted); pointer-events: none; z-index: 1;
        }
        .tc-filter-select {
          padding: 8px 30px 8px 30px; border-radius: 8px;
          border: 1px solid var(--tc-border); background: var(--tc-surface-input);
          color: var(--tc-text); font-size: 13px; cursor: pointer; outline: none;
          appearance: none; min-width: 140px;
        }
        .tc-filter-chevron {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          color: var(--tc-text-muted); pointer-events: none;
        }

        .tc-result-count {
          font-size: 12px; color: var(--tc-text-muted); white-space: nowrap;
          padding: 6px 12px; border-radius: 6px;
          background: var(--tc-surface); border: 1px solid var(--tc-border);
        }
        .tc-result-num { color: var(--tc-accent-light); font-weight: 600; }

        /* ═══════ TABLE ═══════ */
        .tc-table-area { flex: 1; overflow: auto; }
        .tc-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
        .tc-table thead th {
          padding: 11px 16px; text-align: left; font-size: 10px; font-weight: 600;
          color: var(--tc-text-muted); text-transform: uppercase; letter-spacing: 0.8px;
          border-bottom: 1px solid var(--tc-border); background: var(--tc-sidebar-bg);
          position: sticky; top: 0; z-index: 5;
        }
        .tc-table tbody td {
          padding: 13px 16px; border-bottom: 1px solid var(--tc-border);
        }
        .tc-table tbody tr { transition: background 0.12s; cursor: pointer; }
        .tc-row-hover { background: var(--tc-row-hover) !important; }

        .tc-id-badge {
          font-family: 'JetBrains Mono', monospace; font-size: 12px;
          color: var(--tc-text-muted); background: var(--tc-surface);
          padding: 3px 8px; border-radius: 5px; border: 1px solid var(--tc-border);
        }
        .tc-title-cell { font-weight: 500; color: var(--tc-text); max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .tc-assignee { display: flex; align-items: center; gap: 8px; }
        .tc-avatar-sm {
          width: 26px; height: 26px; border-radius: 8px; flex-shrink: 0;
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2));
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; color: var(--tc-accent-light);
        }
        .tc-assignee span { color: var(--tc-text-secondary); font-size: 13px; }
        .tc-unassigned { color: var(--tc-text-muted); font-size: 12px; font-style: italic; }

        .tc-row-actions { display: flex; gap: 4px; justify-content: flex-end; transition: opacity 0.15s; }
        .tc-action-btn {
          background: var(--tc-surface); border: 1px solid var(--tc-border);
          border-radius: 6px; padding: 5px 7px; cursor: pointer;
          color: var(--tc-text-muted); display: flex; align-items: center; transition: all 0.15s;
        }
        .tc-action-edit:hover { color: var(--tc-accent); border-color: var(--tc-accent-border); background: var(--tc-accent-glow); }
        .tc-action-delete:hover { color: var(--tc-danger); border-color: rgba(248,113,113,0.3); background: rgba(248,113,113,0.06); }

        /* ── Empty ── */
        .tc-empty { display: flex; flex-direction: column; align-items: center; padding: 80px 40px; text-align: center; }
        .tc-empty-icon {
          width: 72px; height: 72px; border-radius: 20px; margin-bottom: 20px;
          background: var(--tc-accent-bg); border: 1px solid var(--tc-accent-border);
          display: flex; align-items: center; justify-content: center;
          color: var(--tc-accent-light); opacity: 0.5;
        }
        .tc-empty h3 { color: var(--tc-text); margin: 0 0 8px; font-size: 16px; font-weight: 600; }
        .tc-empty p { color: var(--tc-text-muted); margin: 0 0 24px; font-size: 14px; max-width: 360px; line-height: 1.6; }
        .tc-empty-actions { display: flex; gap: 10px; }

        /* ═══════ BUTTONS ═══════ */
        .tc-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 16px; border-radius: 9px; font-size: 13px;
          cursor: pointer; transition: all 0.2s; border: none; font-weight: 500;
        }
        .tc-btn-primary {
          background: linear-gradient(135deg, #6366f1, #7c3aed);
          color: #fff; font-weight: 600;
          box-shadow: 0 2px 12px rgba(99,102,241,0.3);
        }
        .tc-btn-primary:hover { box-shadow: 0 4px 20px rgba(99,102,241,0.45); transform: translateY(-1px); }
        .tc-btn-secondary {
          background: var(--tc-surface); border: 1px solid var(--tc-border);
          color: var(--tc-text-secondary);
        }
        .tc-btn-secondary:hover { background: var(--tc-surface-hover); border-color: var(--tc-border-hover); }
        .tc-btn-disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; box-shadow: none !important; }

        /* ═══════ MODAL INTERNALS ═══════ */
        .tc-modal-footer { display: flex; gap: 8px; justify-content: flex-end; width: 100%; }
        .tc-form-header h2 { margin: 0; font-size: 18px; font-weight: 700; color: var(--tc-text); }
        .tc-form-header p { margin: 4px 0 0; font-size: 13px; color: var(--tc-text-muted); }
        .tc-form-header { margin-bottom: 24px; }

        .tc-form-section { margin-bottom: 24px; }
        .tc-form-section-title {
          display: flex; align-items: center; gap: 7px; margin-bottom: 14px;
          font-size: 11px; font-weight: 600; color: var(--tc-text-muted);
          text-transform: uppercase; letter-spacing: 0.8px;
        }
        .tc-form-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .tc-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .tc-form-full { grid-column: 1 / -1; }

        .tc-label { display: block; margin-bottom: 6px; font-size: 12px; font-weight: 500; color: var(--tc-text-secondary); }
        .tc-label-sm { display: block; margin-bottom: 5px; font-size: 11px; font-weight: 500; color: var(--tc-text-muted); }
        .tc-required { color: #ef4444; }
        .tc-input {
          width: 100%; padding: 10px 14px; border-radius: 9px; box-sizing: border-box;
          border: 1px solid var(--tc-border); background: var(--tc-surface-input);
          color: var(--tc-text); font-size: 14px; outline: none; font-family: inherit;
          transition: all 0.2s;
        }
        .tc-select { cursor: pointer; font-size: 13px; }
        .tc-textarea { resize: vertical; line-height: 1.6; }
        .tc-textarea-sm { resize: vertical; line-height: 1.5; font-size: 13px; padding: 9px 12px; border-radius: 8px; }

        .tc-btn-add-step {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 12px; border-radius: 7px; font-size: 12px; font-weight: 500;
          background: var(--tc-accent-bg); border: 1px solid var(--tc-accent-border);
          color: var(--tc-accent-light); cursor: pointer; transition: all 0.15s;
        }
        .tc-btn-add-step:hover { background: rgba(99,102,241,0.18); }

        .tc-steps-edit-list { display: flex; flex-direction: column; gap: 10px; }
        .tc-step-edit-card {
          padding: 14px 16px; background: var(--tc-surface);
          border: 1px solid var(--tc-border); border-radius: 10px;
        }
        .tc-step-edit-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        .tc-step-edit-badge {
          width: 26px; height: 26px; border-radius: 7px;
          background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1));
          border: 1px solid rgba(99,102,241,0.15);
          color: var(--tc-accent-light); display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700;
        }
        .tc-step-edit-label { font-size: 12px; color: var(--tc-text-muted); font-weight: 500; flex: 1; }
        .tc-step-remove {
          background: none; border: none; color: var(--tc-text-muted); cursor: pointer;
          padding: 4px; border-radius: 5px; display: flex; transition: all 0.15s;
        }
        .tc-step-remove:hover { color: var(--tc-danger); background: rgba(248,113,113,0.08); }
        .tc-step-edit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        /* ── View modal ── */
        .tc-view-header { margin-bottom: 24px; }
        .tc-view-breadcrumb { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-size: 12px; color: var(--tc-text-muted); }
        .tc-view-title { margin: 0; font-size: 20px; font-weight: 700; color: var(--tc-text); line-height: 1.3; letter-spacing: -0.3px; }
        .tc-view-meta { display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; }
        .tc-view-meta-card {
          display: flex; align-items: center; gap: 8px; padding: 8px 14px;
          background: var(--tc-surface); border: 1px solid var(--tc-border); border-radius: 8px;
        }
        .tc-view-meta-label { font-size: 10px; color: var(--tc-text-muted); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
        .tc-view-meta-value { font-size: 13px; color: var(--tc-text); font-weight: 500; }
        .tc-view-section { margin-bottom: 24px; }
        .tc-section-heading {
          display: flex; align-items: center; gap: 7px; margin: 0 0 10px;
          font-size: 12px; font-weight: 600; color: var(--tc-text-muted);
          text-transform: uppercase; letter-spacing: 0.8px;
        }
        .tc-section-heading svg { color: var(--tc-accent-light); }
        .tc-step-count {
          background: var(--tc-accent-bg); color: var(--tc-accent-light);
          padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 700;
        }
        .tc-view-desc {
          padding: 16px; background: var(--tc-surface);
          border: 1px solid var(--tc-border); border-radius: 10px;
          color: var(--tc-text-secondary); font-size: 14px; line-height: 1.7; white-space: pre-wrap;
        }
        .tc-steps-list { display: flex; flex-direction: column; gap: 8px; }
        .tc-step-card {
          display: flex; gap: 14px; padding: 14px 16px;
          background: var(--tc-surface); border: 1px solid var(--tc-border); border-radius: 10px;
        }
        .tc-step-num {
          width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
          background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1));
          border: 1px solid rgba(99,102,241,0.15);
          color: var(--tc-accent-light); display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700;
        }
        .tc-step-content { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .tc-step-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 4px; }
        .tc-step-label-action { color: var(--tc-accent-light); opacity: 0.6; }
        .tc-step-label-expected { color: #22c55e; opacity: 0.5; }
        .tc-step-text { color: var(--tc-text-secondary); font-size: 13px; line-height: 1.5; }

        /* ── Dropzone ── */
        .tc-dropzone {
          border: 2px dashed var(--tc-border); border-radius: 12px;
          padding: 40px 20px; text-align: center; position: relative;
          background: var(--tc-surface); transition: all 0.2s; margin-bottom: 16px;
        }
        .tc-dropzone-active { border-color: var(--tc-accent) !important; background: var(--tc-accent-glow) !important; }
        .tc-dropzone-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
        .tc-dropzone-icon {
          width: 48px; height: 48px; border-radius: 14px;
          background: var(--tc-accent-bg); border: 1px solid var(--tc-accent-border);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 14px; color: var(--tc-accent-light);
        }
        .tc-dropzone-text { color: var(--tc-text-secondary); margin: 0 0 4px; font-size: 14px; font-weight: 500; }
        .tc-dropzone-hint { color: var(--tc-text-muted); margin: 0; font-size: 12px; }
        .tc-dropzone-file {
          margin-top: 16px; display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 14px; border-radius: 8px;
          background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.15);
          color: #4ade80; font-size: 13px; font-weight: 500;
        }
        .tc-dropzone-file-remove {
          background: none; border: none; color: var(--tc-text-muted); cursor: pointer;
          padding: 2px; margin-left: 4px; display: flex;
        }

        /* ── Warning ── */
        .tc-warning-banner {
          display: flex; align-items: flex-start; gap: 8px;
          padding: 10px 14px; background: rgba(245,158,11,0.08);
          border: 1px solid rgba(245,158,11,0.15); border-radius: 8px; margin-top: 10px;
          color: #fbbf24; font-size: 13px; line-height: 1.5;
        }
        .tc-warning-banner svg { flex-shrink: 0; margin-top: 1px; }

        /* ── Spinner ── */
        .tc-spinner {
          display: inline-block; width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
          border-radius: 50%; animation: tc-spin 0.8s linear infinite;
        }
        @keyframes tc-spin { to { transform: rotate(360deg); } }

        /* ── Scrollbar ── */
        .tc-sidebar-list::-webkit-scrollbar { width: 3px; }
        .tc-sidebar-list::-webkit-scrollbar-track { background: transparent; }
        .tc-sidebar-list::-webkit-scrollbar-thumb { background: var(--tc-border); border-radius: 3px; }
        .tc-table-area::-webkit-scrollbar { width: 4px; }
        .tc-table-area::-webkit-scrollbar-track { background: transparent; }
        .tc-table-area::-webkit-scrollbar-thumb { background: var(--tc-border); border-radius: 4px; }
      `}</style>
    </div>
  );
}

export default TestCases;
