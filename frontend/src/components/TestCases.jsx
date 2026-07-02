import React, { useMemo, useState, useCallback, useRef } from "react";
import {
  FiAlertCircle,
  FiCheck,
  FiChevronDown,
  FiChevronRight,
  FiDatabase,
  FiEdit2,
  FiEye,
  FiFileText,
  FiFilter,
  FiFolder,
  FiFolderPlus,
  FiGrid,
  FiHash,
  FiLayers,
  FiList,
  FiMoreVertical,
  FiPlus,
  FiSearch,
  FiTarget,
  FiTrash2,
  FiUpload,
  FiX,
  FiBox,
  FiUser,
  FiActivity,
  FiClock,
  FiCopy,
  FiDownload,
  FiArrowRight,
  FiInfo,
  FiCheckCircle,
  FiAlertTriangle,
  FiZap,
  FiBookOpen,
  FiCommand,
  FiCornerDownRight,
  FiMaximize2,
  FiMinimize2,
  FiRefreshCw,
  FiSettings,
  FiSliders,
  FiTag,
  FiTerminal,
  FiToggleLeft,
  FiType,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { Modal, ConfirmDialog } from "./shared/Modal";
import Badge from "./shared/Badge";

/* ───────────────────────── helpers ───────────────────────── */

const priorityConfig = {
  Critical: {
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.25)",
    icon: FiAlertTriangle,
    label: "Critical",
    glow: "0 0 12px rgba(239,68,68,0.15)",
  },
  High: {
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.25)",
    icon: FiZap,
    label: "High",
    glow: "0 0 12px rgba(245,158,11,0.12)",
  },
  Medium: {
    color: "#6366f1",
    bg: "rgba(99,102,241,0.12)",
    border: "rgba(99,102,241,0.25)",
    icon: FiTarget,
    label: "Medium",
    glow: "0 0 12px rgba(99,102,241,0.12)",
  },
  Low: {
    color: "#22c55e",
    bg: "rgba(34,197,94,0.12)",
    border: "rgba(34,197,94,0.25)",
    icon: FiArrowRight,
    label: "Low",
    glow: "0 0 12px rgba(34,197,94,0.10)",
  },
};

const stateConfig = {
  Active: { color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  Draft: { color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  Closed: { color: "#64748b", bg: "rgba(100,116,139,0.12)" },
  "In Review": { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
};

const PriorityBadge = ({ priority }) => {
  const cfg = priorityConfig[priority] || priorityConfig.Medium;
  const Icon = cfg.icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "4px 10px 4px 8px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        letterSpacing: "0.2px",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={12} />
      {cfg.label}
    </span>
  );
};

const StateBadge = ({ state }) => {
  const cfg = stateConfig[state] || stateConfig.Active;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "3px 9px",
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        lineHeight: 1,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: cfg.color,
          flexShrink: 0,
        }}
      />
      {state}
    </span>
  );
};

const MetricPill = ({ icon: Icon, label, value, color = "#818cf8" }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "10px 16px",
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: "10px",
      minWidth: "120px",
    }}
  >
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: "8px",
        background: `${color}18`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon size={16} style={{ color }} />
    </div>
    <div>
      <div style={{ fontSize: "18px", fontWeight: 700, color: "#f1f5f9", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: "11px", color: "rgba(148,163,184,0.6)", marginTop: "2px" }}>{label}</div>
    </div>
  </div>
);

/* ─────────────────────── component ──────────────────────── */

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [activeContextMenu, setActiveContextMenu] = useState(null);
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
  const [dragOver, setDragOver] = useState(false);

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
      filtered = filtered.filter((tc) => String(tc.suiteId) === String(selectedSuiteId));
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (tc) => tc.title?.toLowerCase().includes(term) || tc.adoId?.toString().includes(term)
      );
    }
    if (priorityFilter !== "all") {
      filtered = filtered.filter((tc) => tc.priority === priorityFilter);
    }
    return filtered;
  }, [testCases, selectedSuiteId, searchTerm, priorityFilter]);

  const priorityCounts = useMemo(() => {
    const source = selectedSuiteId
      ? (testCases || []).filter((tc) => String(tc.suiteId) === String(selectedSuiteId))
      : testCases || [];
    return {
      Critical: source.filter((t) => t.priority === "Critical").length,
      High: source.filter((t) => t.priority === "High").length,
      Medium: source.filter((t) => t.priority === "Medium").length,
      Low: source.filter((t) => t.priority === "Low").length,
    };
  }, [testCases, selectedSuiteId]);

  const selectedSuiteName = useMemo(() => {
    if (!selectedSuiteId) return "All Test Cases";
    const s = testSuites.find((s) => String(s._id || s.id) === String(selectedSuiteId));
    return s?.name || "Unknown Suite";
  }, [selectedSuiteId, testSuites]);

  /* ── form logic ── */

  const initTestCaseForm = useCallback(
    (testCase = null) => {
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
        const fallbackSuiteId = selectedSuiteId || (testSuites[0]?._id || testSuites[0]?.id) || "";
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
    },
    [selectedSuiteId, testSuites]
  );

  const handleStepChange = (idx, field, value) => {
    const next = [...tcFormData.steps];
    next[idx] = { ...next[idx], [field]: value };
    setTcFormData((p) => ({ ...p, steps: next }));
  };

  const addStep = () => {
    setTcFormData((p) => ({
      ...p,
      steps: [...p.steps, { stepNumber: p.steps.length + 1, action: "", expectedResult: "" }],
    }));
  };

  const removeStep = (idx) => {
    const next = tcFormData.steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepNumber: i + 1 }));
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
      toast.success(editingTestCase ? "Test case updated successfully" : "Test case created successfully");
    } catch {
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
      toast.success("CSV imported successfully");
    } catch {
      toast.error("Import failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.name.endsWith(".csv")) setUploadFile(file);
    else toast.error("Please drop a valid CSV file");
  };

  /* ── keyboard shortcut hint ── */
  React.useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ─────────────────────── render ───────────────────────── */

  return (
    <div className="dg-page" style={{ display: "flex", flexDirection: "column", gap: 0, height: "100%" }}>
      {/* ──────── Page Header ──────── */}
      <div
        style={{
          padding: "28px 32px 24px",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(99,102,241,0.15)",
                }}
              >
                <FiDatabase size={18} style={{ color: "#818cf8" }} />
              </div>
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.3px",
                    lineHeight: 1.2,
                  }}
                >
                  Test Cases
                </h1>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-tertiary)" }}>
                  Manage and organize your test library
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            <button
              className="dg-btn dg-btn-secondary"
              onClick={() => setShowUploadModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "9px 16px",
                borderRadius: "9px",
                fontSize: "13px",
                fontWeight: 500,
                background: "var(--surface-glass)",
                border: "1px solid var(--border-color)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--surface-glass-hover)";
                e.currentTarget.style.borderColor = "var(--border-medium)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--surface-glass)";
                e.currentTarget.style.borderColor = "var(--border-color)";
              }}
            >
              <FiUpload size={15} /> Import CSV
            </button>
            <button
              className="dg-btn dg-btn-primary"
              onClick={() => initTestCaseForm()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "9px 18px",
                borderRadius: "9px",
                fontSize: "13px",
                fontWeight: 600,
                background: "linear-gradient(135deg, #6366f1, #7c3aed)",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                boxShadow: "0 2px 12px rgba(99,102,241,0.3)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.45)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 12px rgba(99,102,241,0.3)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <FiPlus size={15} /> New Test Case
            </button>
          </div>
        </div>

        {/* Metric pills */}
        <div style={{ display: "flex", gap: "12px", marginTop: "20px", flexWrap: "wrap" }}>
          <MetricPill icon={FiLayers} label="Total Cases" value={filteredTestCases.length} color="#818cf8" />
          <MetricPill icon={FiAlertTriangle} label="Critical" value={priorityCounts.Critical} color="#ef4444" />
          <MetricPill icon={FiZap} label="High" value={priorityCounts.High} color="#f59e0b" />
          <MetricPill icon={FiTarget} label="Medium" value={priorityCounts.Medium} color="#6366f1" />
          <MetricPill icon={FiCheckCircle} label="Low" value={priorityCounts.Low} color="#22c55e" />
        </div>
      </div>

      {/* ──────── Main Body ──────── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
        {/* ──── Sidebar ──── */}
        <aside
          style={{
            width: sidebarCollapsed ? "56px" : "264px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid var(--border-color)",
            background: "var(--surface-secondary)",
            transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
            overflow: "hidden",
          }}
        >
          {/* Sidebar header */}
          <div
            style={{
              padding: sidebarCollapsed ? "14px 10px" : "14px 16px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: sidebarCollapsed ? "center" : "space-between",
              minHeight: "48px",
            }}
          >
            {!sidebarCollapsed && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                <FiFolder size={13} />
                Suites
                <span
                  style={{
                    background: "rgba(99,102,241,0.15)",
                    color: "#818cf8",
                    padding: "1px 7px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: 700,
                  }}
                >
                  {testSuites.length}
                </span>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed((p) => !p)}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <FiChevronRight size={16} /> : <FiChevronDown size={16} />}
            </button>
          </div>

          {/* Suite list */}
          <div style={{ flex: 1, overflowY: "auto", padding: sidebarCollapsed ? "8px 6px" : "8px 10px" }}>
            {/* All cases */}
            <button
              type="button"
              onClick={() => setSelectedSuiteId(null)}
              title="All Test Cases"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: sidebarCollapsed ? "0" : "10px",
                justifyContent: sidebarCollapsed ? "center" : "flex-start",
                padding: sidebarCollapsed ? "10px 0" : "9px 12px",
                borderRadius: "8px",
                border: !selectedSuiteId ? "1px solid rgba(99,102,241,0.15)" : "1px solid transparent",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: !selectedSuiteId ? 600 : 500,
                color: !selectedSuiteId ? "var(--text-on-dark)" : "var(--text-secondary)",
                background: !selectedSuiteId
                  ? "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))"
                  : "transparent",
                transition: "all 0.2s",
                marginBottom: "4px",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (selectedSuiteId) e.currentTarget.style.background = "var(--surface-glass-hover)";
              }}
              onMouseLeave={(e) => {
                if (selectedSuiteId) e.currentTarget.style.background = "transparent";
              }}
            >
              {!selectedSuiteId && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "20%",
                    bottom: "20%",
                    width: "3px",
                    borderRadius: "0 3px 3px 0",
                    background: "linear-gradient(180deg, #6366f1, #8b5cf6)",
                  }}
                />
              )}
              <FiBox size={15} />
              {!sidebarCollapsed && (
                <>
                  <span style={{ flex: 1, textAlign: "left" }}>All Cases</span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      background: "rgba(255,255,255,0.05)",
                      padding: "2px 7px",
                      borderRadius: "4px",
                    }}
                  >
                    {testCases.length}
                  </span>
                </>
              )}
            </button>

            {/* Divider */}
            {!sidebarCollapsed && (
              <div
                style={{
                  height: "1px",
                  background: "var(--border-color)",
                  margin: "8px 12px",
                }}
              />
            )}

            {testSuites.map((suite) => {
              const id = suite._id || suite.id;
              const isActive = String(selectedSuiteId) === String(id);
              const count = suiteTestCounts[String(id)] || 0;
              return (
                <div
                  key={id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                    marginBottom: "2px",
                    position: "relative",
                  }}
                >
                  {isActive && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "20%",
                        bottom: "20%",
                        width: "3px",
                        borderRadius: "0 3px 3px 0",
                        background: "linear-gradient(180deg, #6366f1, #8b5cf6)",
                      }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedSuiteId(id)}
                    title={suite.name}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: sidebarCollapsed ? "0" : "10px",
                      justifyContent: sidebarCollapsed ? "center" : "flex-start",
                      padding: sidebarCollapsed ? "9px 0" : "9px 12px",
                      borderRadius: "8px",
                      border: isActive
                        ? "1px solid rgba(99,102,241,0.15)"
                        : "1px solid transparent",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "var(--text-on-dark)" : "var(--text-secondary)",
                      background: isActive
                        ? "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))"
                        : "transparent",
                      transition: "all 0.2s",
                      overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = "var(--surface-glass-hover)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <FiFolder size={14} style={{ flexShrink: 0 }} />
                    {!sidebarCollapsed && (
                      <>
                        <span
                          style={{
                            flex: 1,
                            textAlign: "left",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {suite.name}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "var(--text-muted)",
                            background: "rgba(255,255,255,0.05)",
                            padding: "2px 7px",
                            borderRadius: "4px",
                            flexShrink: 0,
                          }}
                        >
                          {count}
                        </span>
                      </>
                    )}
                  </button>
                  {!sidebarCollapsed && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm({ type: "suite", id, name: suite.name });
                      }}
                      title="Delete suite"
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        padding: "6px",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s",
                        flexShrink: 0,
                        opacity: 0.6,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#f87171";
                        e.currentTarget.style.background = "rgba(248,113,113,0.08)";
                        e.currentTarget.style.opacity = "1";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--text-muted)";
                        e.currentTarget.style.background = "none";
                        e.currentTarget.style.opacity = "0.6";
                      }}
                    >
                      <FiTrash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ──── Main Content ──── */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
          {/* Toolbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 24px",
              borderBottom: "1px solid var(--border-color)",
              background: "var(--surface-secondary)",
            }}
          >
            {/* Breadcrumb */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                color: "var(--text-muted)",
                marginRight: "auto",
              }}
            >
              <FiDatabase size={13} />
              <span>Repository</span>
              <FiChevronRight size={12} />
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{selectedSuiteName}</span>
            </div>

            {/* Search */}
            <div
              style={{
                position: "relative",
                width: "280px",
              }}
            >
              <FiSearch
                size={14}
                style={{
                  position: "absolute",
                  left: "11px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                }}
              />
              <input
                ref={searchRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search cases…"
                type="text"
                style={{
                  width: "100%",
                  padding: "8px 70px 8px 32px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  background: "var(--surface-glass)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  outline: "none",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(99,102,241,0.4)";
                  e.target.style.background = "var(--surface-glass-hover)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.08)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border-color)";
                  e.target.style.background = "var(--surface-glass)";
                  e.target.style.boxShadow = "none";
                }}
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(255,255,255,0.06)",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "2px 5px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                  }}
                >
                  <FiX size={12} />
                </button>
              ) : (
                <span
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    background: "rgba(255,255,255,0.04)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    border: "1px solid var(--border-color)",
                    fontFamily: "monospace",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                  }}
                >
                  ⌘K
                </span>
              )}
            </div>

            {/* Priority filter */}
            <div style={{ position: "relative" }}>
              <FiFilter
                size={13}
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: priorityFilter !== "all" ? "#818cf8" : "var(--text-muted)",
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                style={{
                  padding: "8px 30px 8px 30px",
                  borderRadius: "8px",
                  border:
                    priorityFilter !== "all"
                      ? "1px solid rgba(99,102,241,0.3)"
                      : "1px solid var(--border-color)",
                  background:
                    priorityFilter !== "all"
                      ? "rgba(99,102,241,0.08)"
                      : "var(--surface-glass)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  cursor: "pointer",
                  outline: "none",
                  appearance: "none",
                  minWidth: "140px",
                }}
              >
                <option value="all">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <FiChevronDown
                size={13}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                }}
              />
            </div>

            {/* Result count */}
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                whiteSpace: "nowrap",
                padding: "6px 12px",
                borderRadius: "6px",
                background: "var(--surface-glass)",
                border: "1px solid var(--border-color)",
              }}
            >
              <span style={{ color: "#818cf8", fontWeight: 600 }}>{filteredTestCases.length}</span> results
            </div>
          </div>

          {/* ──── Table ──── */}
          <div style={{ flex: 1, overflow: "auto" }}>
            {filteredTestCases.length ? (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  fontSize: "13px",
                }}
              >
                <thead>
                  <tr>
                    {[
                      { label: "ID", width: "100px", align: "left" },
                      { label: "Title", width: undefined, align: "left" },
                      { label: "Priority", width: "120px", align: "left" },
                      { label: "State", width: "110px", align: "left" },
                      { label: "Assigned To", width: "160px", align: "left" },
                      { label: "", width: "80px", align: "right" },
                    ].map((col, i) => (
                      <th
                        key={i}
                        style={{
                          padding: "11px 16px",
                          textAlign: col.align,
                          width: col.width,
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.8px",
                          borderBottom: "1px solid var(--border-color)",
                          background: "var(--surface-secondary)",
                          position: "sticky",
                          top: 0,
                          zIndex: 5,
                          backdropFilter: "blur(12px)",
                        }}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTestCases.map((tc, idx) => {
                    const isHovered = hoveredRow === (tc._id || tc.id || idx);
                    return (
                      <tr
                        key={tc._id || tc.id || idx}
                        onMouseEnter={() => setHoveredRow(tc._id || tc.id || idx)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{
                          background: isHovered ? "rgba(99,102,241,0.04)" : "transparent",
                          transition: "background 0.15s",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          setViewingTestCase(tc);
                          setShowViewModal(true);
                        }}
                      >
                        <td
                          style={{
                            padding: "13px 16px",
                            borderBottom: "1px solid var(--border-color)",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "12px",
                              color: "var(--text-muted)",
                              background: "var(--surface-glass)",
                              padding: "3px 8px",
                              borderRadius: "5px",
                              border: "1px solid var(--border-color)",
                            }}
                          >
                            {tc.adoId || `TC-${String(idx + 1).padStart(3, "0")}`}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "13px 16px",
                            borderBottom: "1px solid var(--border-color)",
                            fontWeight: 500,
                            color: "var(--text-primary)",
                            maxWidth: "400px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {tc.title}
                        </td>
                        <td
                          style={{
                            padding: "13px 16px",
                            borderBottom: "1px solid var(--border-color)",
                          }}
                        >
                          <PriorityBadge priority={tc.priority || "Medium"} />
                        </td>
                        <td
                          style={{
                            padding: "13px 16px",
                            borderBottom: "1px solid var(--border-color)",
                          }}
                        >
                          <StateBadge state={tc.state || "Active"} />
                        </td>
                        <td
                          style={{
                            padding: "13px 16px",
                            borderBottom: "1px solid var(--border-color)",
                          }}
                        >
                          {tc.assignedTo ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div
                                style={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: "8px",
                                  background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  color: "#a5b4fc",
                                  flexShrink: 0,
                                }}
                              >
                                {tc.assignedTo
                                  .split(" ")
                                  .map((w) => w[0])
                                  .join("")
                                  .substring(0, 2)
                                  .toUpperCase()}
                              </div>
                              <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                                {tc.assignedTo}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: "12px", fontStyle: "italic" }}>
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td
                          style={{
                            padding: "13px 16px",
                            borderBottom: "1px solid var(--border-color)",
                            textAlign: "right",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: "4px",
                              justifyContent: "flex-end",
                              opacity: isHovered ? 1 : 0,
                              transition: "opacity 0.15s",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              title="Edit"
                              onClick={() => initTestCaseForm(tc)}
                              style={{
                                background: "var(--surface-glass)",
                                border: "1px solid var(--border-color)",
                                borderRadius: "6px",
                                padding: "5px 7px",
                                cursor: "pointer",
                                color: "var(--text-muted)",
                                display: "flex",
                                alignItems: "center",
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = "#818cf8";
                                e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)";
                                e.currentTarget.style.background = "rgba(99,102,241,0.08)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = "var(--text-muted)";
                                e.currentTarget.style.borderColor = "var(--border-color)";
                                e.currentTarget.style.background = "var(--surface-glass)";
                              }}
                            >
                              <FiEdit2 size={13} />
                            </button>
                            <button
                              type="button"
                              title="Delete"
                              onClick={() =>
                                setShowDeleteConfirm({
                                  type: "testCase",
                                  id: tc._id || tc.id,
                                  name: tc.title,
                                })
                              }
                              style={{
                                background: "var(--surface-glass)",
                                border: "1px solid var(--border-color)",
                                borderRadius: "6px",
                                padding: "5px 7px",
                                cursor: "pointer",
                                color: "var(--text-muted)",
                                display: "flex",
                                alignItems: "center",
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = "#f87171";
                                e.currentTarget.style.borderColor = "rgba(248,113,113,0.3)";
                                e.currentTarget.style.background = "rgba(248,113,113,0.08)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = "var(--text-muted)";
                                e.currentTarget.style.borderColor = "var(--border-color)";
                                e.currentTarget.style.background = "var(--surface-glass)";
                              }}
                            >
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
              /* ── Empty state ── */
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "80px 40px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "20px",
                    background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.08))",
                    border: "1px solid rgba(99,102,241,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "20px",
                  }}
                >
                  <FiFileText size={32} style={{ color: "rgba(129,140,248,0.4)" }} />
                </div>
                <h3
                  style={{
                    color: "var(--text-primary)",
                    margin: "0 0 8px",
                    fontSize: "16px",
                    fontWeight: 600,
                  }}
                >
                  No test cases found
                </h3>
                <p
                  style={{
                    color: "var(--text-tertiary)",
                    margin: "0 0 24px",
                    fontSize: "14px",
                    maxWidth: "360px",
                    lineHeight: 1.6,
                  }}
                >
                  {searchTerm || priorityFilter !== "all"
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "Get started by creating your first test case or importing from CSV."}
                </p>
                <div style={{ display: "flex", gap: "10px" }}>
                  {(searchTerm || priorityFilter !== "all") && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setPriorityFilter("all");
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "9px 16px",
                        borderRadius: "9px",
                        fontSize: "13px",
                        fontWeight: 500,
                        background: "var(--surface-glass)",
                        border: "1px solid var(--border-color)",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                      }}
                    >
                      <FiX size={14} /> Clear Filters
                    </button>
                  )}
                  <button
                    onClick={() => initTestCaseForm()}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "9px 18px",
                      borderRadius: "9px",
                      fontSize: "13px",
                      fontWeight: 600,
                      background: "linear-gradient(135deg, #6366f1, #7c3aed)",
                      border: "none",
                      color: "#fff",
                      cursor: "pointer",
                      boxShadow: "0 2px 12px rgba(99,102,241,0.3)",
                    }}
                  >
                    <FiPlus size={14} /> Create Test Case
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ══════════ VIEW MODAL ══════════ */}
      <Modal
        isOpen={showViewModal && !!viewingTestCase}
        onClose={() => setShowViewModal(false)}
        title={null}
        size="lg"
        footer={
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", width: "100%" }}>
            <button
              onClick={() => setShowViewModal(false)}
              style={{
                padding: "9px 16px",
                borderRadius: "9px",
                fontSize: "13px",
                fontWeight: 500,
                background: "var(--surface-glass)",
                border: "1px solid var(--border-color)",
                color: "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              Close
            </button>
            <button
              onClick={() => {
                setShowViewModal(false);
                initTestCaseForm(viewingTestCase);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 18px",
                borderRadius: "9px",
                fontSize: "13px",
                fontWeight: 600,
                background: "linear-gradient(135deg, #6366f1, #7c3aed)",
                border: "none",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              <FiEdit2 size={14} /> Edit
            </button>
          </div>
        }
      >
        {viewingTestCase && (
          <div>
            {/* Header area */}
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "10px",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                }}
              >
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    background: "var(--surface-glass)",
                    padding: "3px 8px",
                    borderRadius: "5px",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  {viewingTestCase.adoId || "TC"}
                </span>
                <FiChevronRight size={12} />
                <span>Test Case Details</span>
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  lineHeight: 1.3,
                  letterSpacing: "-0.3px",
                }}
              >
                {viewingTestCase.title}
              </h2>
            </div>

            {/* Meta badges */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "24px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 14px",
                  background: "var(--surface-glass)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    fontWeight: 600,
                  }}
                >
                  Priority
                </span>
                <PriorityBadge priority={viewingTestCase.priority || "Medium"} />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 14px",
                  background: "var(--surface-glass)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    fontWeight: 600,
                  }}
                >
                  State
                </span>
                <StateBadge state={viewingTestCase.state || "Active"} />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 14px",
                  background: "var(--surface-glass)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    fontWeight: 600,
                  }}
                >
                  Assigned
                </span>
                <span style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 500 }}>
                  {viewingTestCase.assignedTo || "Unassigned"}
                </span>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: "24px" }}>
              <h4
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  margin: "0 0 10px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                }}
              >
                <FiFileText size={13} style={{ color: "#818cf8" }} />
                Description
              </h4>
              <div
                style={{
                  padding: "16px",
                  background: "var(--surface-glass)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                  color: "var(--text-secondary)",
                  fontSize: "14px",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}
              >
                {viewingTestCase.description || "No description provided."}
              </div>
            </div>

            {/* Steps */}
            {viewingTestCase.steps?.length > 0 && (
              <div>
                <h4
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    margin: "0 0 14px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                  }}
                >
                  <FiList size={13} style={{ color: "#818cf8" }} />
                  Test Steps
                  <span
                    style={{
                      background: "rgba(99,102,241,0.12)",
                      color: "#818cf8",
                      padding: "2px 7px",
                      borderRadius: "4px",
                      fontSize: "10px",
                      fontWeight: 700,
                    }}
                  >
                    {viewingTestCase.steps.length}
                  </span>
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {viewingTestCase.steps.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: "14px",
                        padding: "14px 16px",
                        background: "var(--surface-glass)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "10px",
                        transition: "all 0.15s",
                      }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "8px",
                          background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))",
                          border: "1px solid rgba(99,102,241,0.15)",
                          color: "#a5b4fc",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {s.stepNumber}
                      </div>
                      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div>
                          <div
                            style={{
                              fontSize: "10px",
                              color: "var(--text-muted)",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              fontWeight: 600,
                              marginBottom: "4px",
                            }}
                          >
                            Action
                          </div>
                          <div style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.5 }}>
                            {s.action || "—"}
                          </div>
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: "10px",
                              color: "var(--text-muted)",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              fontWeight: 600,
                              marginBottom: "4px",
                            }}
                          >
                            Expected Result
                          </div>
                          <div style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.5 }}>
                            {s.expectedResult || "—"}
                          </div>
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

      {/* ══════════ CREATE / EDIT MODAL ══════════ */}
      <Modal
        isOpen={showTestCaseModal}
        onClose={() => setShowTestCaseModal(false)}
        title={null}
        size="lg"
        footer={
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", width: "100%" }}>
            <button
              type="button"
              onClick={() => setShowTestCaseModal(false)}
              style={{
                padding: "9px 16px",
                borderRadius: "9px",
                fontSize: "13px",
                fontWeight: 500,
                background: "var(--surface-glass)",
                border: "1px solid var(--border-color)",
                color: "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="tc-form"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 20px",
                borderRadius: "9px",
                fontSize: "13px",
                fontWeight: 600,
                background: "linear-gradient(135deg, #6366f1, #7c3aed)",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                boxShadow: "0 2px 12px rgba(99,102,241,0.3)",
              }}
            >
              <FiCheck size={14} />
              {editingTestCase ? "Save Changes" : "Create Test Case"}
            </button>
          </div>
        }
      >
        <form id="tc-form" onSubmit={handleTestCaseSubmit}>
          {/* Form title */}
          <div style={{ marginBottom: "24px" }}>
            <h2
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.3px",
              }}
            >
              {editingTestCase ? "Edit Test Case" : "Create New Test Case"}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-tertiary)" }}>
              {editingTestCase ? "Update the test case details below." : "Fill in the details to create a new test case."}
            </p>
          </div>

          {/* Section: Basic Info */}
          <div style={{ marginBottom: "28px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                marginBottom: "16px",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}
            >
              <FiInfo size={13} />
              Basic Information
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              {/* Title */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                  }}
                >
                  Title <span style={{ color: "#f87171" }}>*</span>
                </label>
                <input
                  value={tcFormData.title}
                  onChange={(e) => setTcFormData((p) => ({ ...p, title: e.target.value }))}
                  required
                  placeholder="Enter a descriptive title…"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "9px",
                    border: "1px solid var(--border-color)",
                    background: "var(--surface-glass)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.2s",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(99,102,241,0.4)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border-color)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Suite */}
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                  }}
                >
                  Test Suite <span style={{ color: "#f87171" }}>*</span>
                </label>
                <select
                  value={tcFormData.suiteId}
                  onChange={(e) => setTcFormData((p) => ({ ...p, suiteId: e.target.value }))}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "9px",
                    border: "1px solid var(--border-color)",
                    background: "var(--surface-glass)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    outline: "none",
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Select a suite</option>
                  {testSuites.map((s) => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                  }}
                >
                  Priority
                </label>
                <select
                  value={tcFormData.priority}
                  onChange={(e) => setTcFormData((p) => ({ ...p, priority: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "9px",
                    border: "1px solid var(--border-color)",
                    background: "var(--surface-glass)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    outline: "none",
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                >
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>

              {/* Description */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                  }}
                >
                  Description
                </label>
                <textarea
                  rows={4}
                  value={tcFormData.description}
                  onChange={(e) => setTcFormData((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Provide a detailed description…"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "9px",
                    border: "1px solid var(--border-color)",
                    background: "var(--surface-glass)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                    lineHeight: 1.6,
                    transition: "all 0.2s",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(99,102,241,0.4)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border-color)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section: Steps */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                }}
              >
                <FiList size={13} />
                Test Steps
                <span
                  style={{
                    background: "rgba(99,102,241,0.12)",
                    color: "#818cf8",
                    padding: "2px 7px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: 700,
                  }}
                >
                  {tcFormData.steps.length}
                </span>
              </div>
              <button
                type="button"
                onClick={addStep}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "6px 12px",
                  borderRadius: "7px",
                  fontSize: "12px",
                  fontWeight: 500,
                  background: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  color: "#a5b4fc",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(99,102,241,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(99,102,241,0.1)";
                }}
              >
                <FiPlus size={13} /> Add Step
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {tcFormData.steps.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "14px 16px",
                    background: "var(--surface-glass)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: "7px",
                          background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))",
                          border: "1px solid rgba(99,102,241,0.15)",
                          color: "#a5b4fc",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
                        Step {idx + 1}
                      </span>
                    </div>
                    {tcFormData.steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(idx)}
                        title="Remove step"
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          padding: "4px",
                          borderRadius: "5px",
                          display: "flex",
                          alignItems: "center",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#f87171";
                          e.currentTarget.style.background = "rgba(248,113,113,0.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "var(--text-muted)";
                          e.currentTarget.style.background = "none";
                        }}
                      >
                        <FiTrash2 size={13} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "5px",
                          fontSize: "11px",
                          fontWeight: 500,
                          color: "var(--text-muted)",
                        }}
                      >
                        Action
                      </label>
                      <textarea
                        rows={3}
                        value={step.action}
                        onChange={(e) => handleStepChange(idx, "action", e.target.value)}
                        placeholder="Describe the action…"
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          borderRadius: "8px",
                          border: "1px solid var(--border-color)",
                          background: "var(--surface-glass)",
                          color: "var(--text-primary)",
                          fontSize: "13px",
                          outline: "none",
                          resize: "vertical",
                          fontFamily: "inherit",
                          lineHeight: 1.5,
                          transition: "all 0.2s",
                          boxSizing: "border-box",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = "rgba(99,102,241,0.35)";
                          e.target.style.boxShadow = "0 0 0 2px rgba(99,102,241,0.06)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "var(--border-color)";
                          e.target.style.boxShadow = "none";
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "5px",
                          fontSize: "11px",
                          fontWeight: 500,
                          color: "var(--text-muted)",
                        }}
                      >
                        Expected Result
                      </label>
                      <textarea
                        rows={3}
                        value={step.expectedResult}
                        onChange={(e) => handleStepChange(idx, "expectedResult", e.target.value)}
                        placeholder="Describe the expected outcome…"
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          borderRadius: "8px",
                          border: "1px solid var(--border-color)",
                          background: "var(--surface-glass)",
                          color: "var(--text-primary)",
                          fontSize: "13px",
                          outline: "none",
                          resize: "vertical",
                          fontFamily: "inherit",
                          lineHeight: 1.5,
                          transition: "all 0.2s",
                          boxSizing: "border-box",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = "rgba(99,102,241,0.35)";
                          e.target.style.boxShadow = "0 0 0 2px rgba(99,102,241,0.06)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "var(--border-color)";
                          e.target.style.boxShadow = "none";
                        }}
                      />
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
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Confirm Deletion"
        message={
          <div>
            <p style={{ color: "var(--text-secondary)", margin: "0 0 8px", fontSize: "14px" }}>
              Are you sure you want to delete{" "}
              <strong style={{ color: "var(--text-primary)" }}>"{showDeleteConfirm?.name}"</strong>?
            </p>
            {showDeleteConfirm?.type === "suite" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  padding: "10px 14px",
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.15)",
                  borderRadius: "8px",
                  marginTop: "10px",
                }}
              >
                <FiAlertTriangle size={15} style={{ color: "#fbbf24", flexShrink: 0, marginTop: "1px" }} />
                <span style={{ color: "#fbbf24", fontSize: "13px", lineHeight: 1.5 }}>
                  This will permanently delete all test cases within this suite.
                </span>
              </div>
            )}
            <p style={{ color: "var(--text-muted)", margin: "10px 0 0", fontSize: "12px" }}>
              This action cannot be undone.
            </p>
          </div>
        }
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          try {
            if (showDeleteConfirm.type === "suite") {
              await onDeleteSuite?.(showDeleteConfirm.id);
              if (String(selectedSuiteId) === String(showDeleteConfirm.id)) setSelectedSuiteId(null);
            } else {
              await onDeleteTestCase?.(showDeleteConfirm.id);
            }
            setShowDeleteConfirm(null);
            toast.success("Deleted successfully");
          } catch {
            toast.error("Delete failed");
          }
        }}
      />

      {/* ══════════ UPLOAD MODAL ══════════ */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title={null}
        footer={
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", width: "100%" }}>
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              style={{
                padding: "9px 16px",
                borderRadius: "9px",
                fontSize: "13px",
                fontWeight: 500,
                background: "var(--surface-glass)",
                border: "1px solid var(--border-color)",
                color: "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="upload-form"
              disabled={isUploading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 20px",
                borderRadius: "9px",
                fontSize: "13px",
                fontWeight: 600,
                background: isUploading
                  ? "rgba(99,102,241,0.5)"
                  : "linear-gradient(135deg, #6366f1, #7c3aed)",
                border: "none",
                color: "#fff",
                cursor: isUploading ? "not-allowed" : "pointer",
                boxShadow: isUploading ? "none" : "0 2px 12px rgba(99,102,241,0.3)",
              }}
            >
              {isUploading ? (
                <>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  Importing…
                </>
              ) : (
                <>
                  <FiUpload size={14} /> Import
                </>
              )}
            </button>
          </div>
        }
      >
        <form id="upload-form" onSubmit={handleUploadSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
              Import from CSV
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-tertiary)" }}>
              Upload a CSV file to bulk-create test cases.
            </p>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragOver ? "rgba(99,102,241,0.5)" : "var(--border-color)"}`,
              borderRadius: "12px",
              padding: "40px 20px",
              textAlign: "center",
              position: "relative",
              background: dragOver ? "rgba(99,102,241,0.04)" : "var(--surface-glass)",
              transition: "all 0.2s",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "14px",
                background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))",
                border: "1px solid rgba(99,102,241,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              <FiUpload size={22} style={{ color: "#818cf8" }} />
            </div>
            <p style={{ color: "var(--text-secondary)", margin: "0 0 4px", fontSize: "14px", fontWeight: 500 }}>
              Drag & drop your CSV file here
            </p>
            <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "12px" }}>
              or click to browse · Supported: .csv
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              required
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
            />
            {uploadFile && (
              <div
                style={{
                  marginTop: "16px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 14px",
                  background: "rgba(34,197,94,0.08)",
                  border: "1px solid rgba(34,197,94,0.15)",
                  borderRadius: "8px",
                  color: "#4ade80",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                <FiCheckCircle size={14} />
                {uploadFile.name}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadFile(null);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "2px",
                    marginLeft: "4px",
                    display: "flex",
                  }}
                >
                  <FiX size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Suite name */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--text-secondary)",
              }}
            >
              New Suite Name <span style={{ color: "#f87171" }}>*</span>
            </label>
            <input
              value={uploadSuiteName}
              onChange={(e) => setUploadSuiteName(e.target.value)}
              placeholder="e.g., Sprint 5 Regression Tests"
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "9px",
                border: "1px solid var(--border-color)",
                background: "var(--surface-glass)",
                color: "var(--text-primary)",
                fontSize: "14px",
                outline: "none",
                transition: "all 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(99,102,241,0.4)";
                e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.08)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border-color)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>
        </form>
      </Modal>

      {/* Spinner keyframes */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default TestCases;