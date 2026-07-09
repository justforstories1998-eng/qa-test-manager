import React, { useState, useEffect, useMemo } from 'react';
import {
  FiFileText, FiDownload, FiTrash2, FiRefreshCw, FiZap,
  FiCalendar, FiClock, FiCheckCircle, FiAlertTriangle, FiTrendingUp,
  FiPieChart, FiFile, FiArchive, FiStar, FiShield, FiSearch, FiX,
  FiPlay, FiHash, FiActivity, FiChevronRight, FiInbox, FiFilter,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../api';
import { ConfirmDialog } from './shared/Modal';

/* ══════════════ theme detection ══════════════ */
const useTheme = () => {
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'dark'
  );
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return theme;
};

/* ══════════════ format badges ══════════════ */
const formatConfig = {
  pdf:  { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)',  icon: FiFileText, label: 'PDF' },
  word: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', icon: FiFile,     label: 'DOCX' },
};

const FormatBadge = ({ format }) => {
  const cfg = formatConfig[format] || formatConfig.pdf;
  const Icon = cfg.icon;
  return (
    <span className="rep-badge" style={{
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
    }}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
};

const MetricCard = ({ icon: Icon, label, value, color }) => (
  <div className="rep-metric" style={{ '--metric-color': color }}>
    <div className="rep-metric-accent" style={{ background: `linear-gradient(90deg, ${color}, ${color}00)` }} />
    <div className="rep-metric-icon" style={{ background: `${color}15`, borderColor: `${color}25`, color }}>
      <Icon size={15} />
    </div>
    <div className="rep-metric-value">{value}</div>
    <div className="rep-metric-label">{label}</div>
  </div>
);

/* ══════════════ main ══════════════ */
function Reports({ testRuns = [], settings, projectId }) {
  const theme = useTheme();
  const [reports, setReports] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [format, setFormat] = useState(settings?.export?.defaultFormat || 'pdf');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFormat, setFilterFormat] = useState('all');
  const [hoveredRow, setHoveredRow] = useState(null);

  useEffect(() => {
    if (projectId) loadReports();
  }, [projectId]);

  const loadReports = async () => {
    try {
      const res = await api.getReports(projectId);
      if (res.success) setReports(res.data);
    } catch { toast.error('Failed to load reports'); }
  };

  const handleGenerate = async () => {
    if (!selectedRunId) return toast.warning('Please select a report scope');
    setIsGenerating(true);
    try {
      const res = await api.generateReport(selectedRunId, format, projectId);
      if (res.success) {
        toast.success('Report generated');
        setReports([res.data, ...reports]);
      }
    } catch { toast.error('Generation failed'); }
    finally { setIsGenerating(false); }
  };

  const handleDownload = async (report) => {
    try {
      await api.downloadReportFile(report._id || report.id, report.fileName);
      toast.success('Downloading…');
    } catch { toast.error('Download failed'); }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteReport(id);
      setReports(reports.filter(r => (r._id || r.id) !== id));
      toast.success('Report deleted');
      setShowDeleteConfirm(null);
    } catch { toast.error('Delete failed'); }
  };

  /* derived */
  const filteredReports = useMemo(() => reports.filter(r => {
    const matchesSearch = !searchTerm.trim() || r.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFormat = filterFormat === 'all' || r.format === filterFormat;
    return matchesSearch && matchesFormat;
  }), [reports, searchTerm, filterFormat]);

  const stats = useMemo(() => ({
    total: reports.length,
    pdf: reports.filter(r => r.format === 'pdf').length,
    word: reports.filter(r => r.format === 'word').length,
    recent: reports.filter(r => {
      const days = (Date.now() - new Date(r.generatedAt)) / (1000 * 60 * 60 * 24);
      return days <= 7;
    }).length,
  }), [reports]);

  const selectedRun = useMemo(() => {
    if (!selectedRunId || selectedRunId === 'ALL_PROJECT_RUNS') return null;
    return testRuns.find(r => (r._id || r.id) === selectedRunId);
  }, [selectedRunId, testRuns]);

  return (
    <div className="rep-page">
      {/* ── Header ── */}
      <div className="rep-header">
        <div className="rep-header-left">
          <div className="rep-header-icon">
            <FiPieChart size={19} />
          </div>
          <div>
            <h1 className="rep-title">Reports & Analytics</h1>
            <p className="rep-subtitle">Generate comprehensive test reports with insights</p>
          </div>
        </div>
      </div>

      <div className="rep-body">
        {/* ── Metrics row ── */}
        <div className="rep-metrics-row">
          <MetricCard icon={FiArchive} label="Total Reports" value={stats.total} color="#818cf8" />
          <MetricCard icon={FiFileText} label="PDF Reports" value={stats.pdf} color="#ef4444" />
          <MetricCard icon={FiFile} label="Word Reports" value={stats.word} color="#3b82f6" />
          <MetricCard icon={FiClock} label="Last 7 Days" value={stats.recent} color="#22c55e" />
          <MetricCard icon={FiPlay} label="Test Runs" value={testRuns.length} color="#a78bfa" />
        </div>

        {/* ── Two-column layout ── */}
        <div className="rep-layout">
          {/* LEFT: Generation panel */}
          <div className="rep-left-panel">
            {/* Create Report Card */}
            <div className="rep-card">
              <div className="rep-card-header">
                <div className="rep-card-header-icon">
                  <FiZap size={17} />
                </div>
                <div>
                  <h3 className="rep-card-title">Create New Report</h3>
                  <p className="rep-card-subtitle">Configure and generate a report</p>
                </div>
              </div>

              <div className="rep-card-body">
                {/* Scope */}
                <div className="rep-field">
                  <label className="rep-label">
                    <FiArchive size={12} /> Report Scope
                  </label>
                  <select
                    className="rep-input rep-select"
                    value={selectedRunId}
                    onChange={e => setSelectedRunId(e.target.value)}
                  >
                    <option value="">Select scope…</option>
                    <option value="ALL_PROJECT_RUNS">Project Overview (All Runs)</option>
                    <optgroup label="Individual Test Runs">
                      {testRuns.map(r => (
                        <option key={r._id || r.id} value={r._id || r.id}>
                          {r.name} · {r.status}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  {selectedRunId && (
                    <div className="rep-field-hint rep-field-hint-success">
                      <FiCheckCircle size={12} />
                      {selectedRunId === 'ALL_PROJECT_RUNS' ? 'All project runs will be included' : `Run: ${selectedRun?.name || 'Selected'}`}
                    </div>
                  )}
                </div>

                {/* Format */}
                <div className="rep-field">
                  <label className="rep-label">
                    <FiFileText size={12} /> Output Format
                  </label>
                  <div className="rep-format-grid">
                    {[
                      { id: 'pdf',  icon: FiFileText, label: 'PDF', hint: 'Best for sharing' },
                      { id: 'word', icon: FiFile,     label: 'Word', hint: 'Editable DOCX' },
                    ].map(f => {
                      const Icon = f.icon;
                      const active = format === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFormat(f.id)}
                          className={`rep-format-card ${active ? 'rep-format-card-active' : ''}`}
                        >
                          <div className="rep-format-icon">
                            <Icon size={16} />
                          </div>
                          <div className="rep-format-content">
                            <div className="rep-format-label">{f.label}</div>
                            <div className="rep-format-hint">{f.hint}</div>
                          </div>
                          {active && (
                            <div className="rep-format-check">
                              <FiCheckCircle size={13} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Generate button */}
                <button
                  className={`rep-btn rep-btn-primary rep-btn-full ${(isGenerating || !selectedRunId) ? 'rep-btn-disabled' : ''}`}
                  onClick={handleGenerate}
                  disabled={isGenerating || !selectedRunId}
                >
                  {isGenerating ? (
                    <><span className="rep-spinner" /> Generating…</>
                  ) : (
                    <><FiZap size={14} /> Generate Report</>
                  )}
                </button>
              </div>
            </div>

            {/* AI Insights card */}
            <div className="rep-card rep-card-ai">
              <div className="rep-ai-header">
                <div className="rep-ai-badge">
                  <FiStar size={11} /> AI-Powered
                </div>
                <h4 className="rep-ai-title">Intelligent Analysis</h4>
                <p className="rep-ai-desc">Every report includes AI-generated insights for smarter decisions</p>
              </div>
              <div className="rep-ai-features">
                {[
                  { icon: FiTrendingUp, label: 'Executive Summary', desc: 'Key findings & metrics' },
                  { icon: FiAlertTriangle, label: 'Risk Assessment', desc: 'Identified risk factors' },
                  { icon: FiShield, label: 'Release Readiness', desc: 'Go/no-go recommendation' },
                ].map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <div key={i} className="rep-ai-feature">
                      <div className="rep-ai-feature-icon">
                        <Icon size={13} />
                      </div>
                      <div>
                        <div className="rep-ai-feature-label">{f.label}</div>
                        <div className="rep-ai-feature-desc">{f.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Info card */}
            <div className="rep-card rep-card-info">
              <div className="rep-info-header">
                <FiClock size={13} />
                <span>Report History</span>
              </div>
              <ul className="rep-info-list">
                <li><FiCheckCircle size={11} /> Retained for 90 days</li>
                <li><FiCheckCircle size={11} /> Download in original format</li>
                <li><FiCheckCircle size={11} /> Secure & versioned storage</li>
              </ul>
            </div>
          </div>

          {/* RIGHT: Reports list */}
          <div className="rep-right-panel">
            {/* Toolbar */}
            <div className="rep-toolbar">
              <div className="rep-toolbar-title">
                <FiArchive size={14} />
                <span>Generated Reports</span>
                <span className="rep-count-chip">{filteredReports.length}</span>
              </div>
              <div className="rep-toolbar-actions">
                <div className="rep-search-wrap">
                  <FiSearch size={13} className="rep-search-icon" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search reports…"
                    className="rep-search-input"
                  />
                  {searchTerm && (
                    <button className="rep-search-clear" onClick={() => setSearchTerm('')}>
                      <FiX size={11} />
                    </button>
                  )}
                </div>
                <select
                  className="rep-filter-select"
                  value={filterFormat}
                  onChange={e => setFilterFormat(e.target.value)}
                >
                  <option value="all">All formats</option>
                  <option value="pdf">PDF only</option>
                  <option value="word">Word only</option>
                </select>
                <button className="rep-refresh-btn" onClick={loadReports} title="Refresh">
                  <FiRefreshCw size={13} />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="rep-table-wrap">
              {filteredReports.length > 0 ? (
                <table className="rep-table">
                  <colgroup>
                    <col />
                    <col style={{ width: '90px' }} />
                    <col style={{ width: '150px' }} />
                    <col style={{ width: '90px' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Report</th>
                      <th>Format</th>
                      <th>Generated</th>
                      <th style={{ textAlign: 'right' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map(rep => {
                      const rid = rep._id || rep.id;
                      const isHovered = hoveredRow === rid;
                      const cfg = formatConfig[rep.format] || formatConfig.pdf;
                      const FormatIcon = cfg.icon;
                      const date = new Date(rep.generatedAt);
                      return (
                        <tr
                          key={rid}
                          className={isHovered ? 'rep-row-hover' : ''}
                          onMouseEnter={() => setHoveredRow(rid)}
                          onMouseLeave={() => setHoveredRow(null)}
                        >
                          <td>
                            <div className="rep-row-report">
                              <div className="rep-row-icon" style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}>
                                <FormatIcon size={16} />
                              </div>
                              <div className="rep-row-info">
                                <div className="rep-row-name">{rep.name}</div>
                                <div className="rep-row-meta">
                                  <FiHash size={9} />
                                  <span className="rep-row-id">{rid.slice(-8)}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <FormatBadge format={rep.format} />
                          </td>
                          <td>
                            <div className="rep-row-date">
                              <FiCalendar size={11} />
                              <div>
                                <div>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                <div className="rep-row-time">{date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className={`rep-row-actions ${isHovered ? 'visible' : ''}`}>
                              <button
                                className="rep-action-btn rep-action-download"
                                onClick={() => handleDownload(rep)}
                                title="Download"
                              >
                                <FiDownload size={13} />
                              </button>
                              <button
                                className="rep-action-btn rep-action-delete"
                                onClick={() => setShowDeleteConfirm(rep)}
                                title="Delete"
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
                <div className="rep-empty">
                  <div className="rep-empty-icon">
                    <FiInbox size={28} />
                  </div>
                  <h3>{searchTerm || filterFormat !== 'all' ? 'No matching reports' : 'No reports yet'}</h3>
                  <p>
                    {searchTerm || filterFormat !== 'all'
                      ? 'Try adjusting your search or filter.'
                      : 'Generate your first report from the panel on the left.'}
                  </p>
                  {(searchTerm || filterFormat !== 'all') && (
                    <button
                      className="rep-btn rep-btn-secondary"
                      onClick={() => { setSearchTerm(''); setFilterFormat('all'); }}
                    >
                      <FiX size={13} /> Clear Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={() => handleDelete(showDeleteConfirm?._id || showDeleteConfirm?.id)}
        title="Delete Report"
        message={
          <div>
            <p style={{ color: 'var(--rep-text-secondary)', margin: '0 0 10px', fontSize: 14 }}>
              Delete <strong style={{ color: 'var(--rep-text)' }}>"{showDeleteConfirm?.name}"</strong>?
            </p>
            <div className="rep-warning-banner">
              <FiAlertTriangle size={14} />
              <span>This action cannot be undone. The file will be permanently removed.</span>
            </div>
          </div>
        }
        confirmLabel="Delete Report"
        danger
      />

      {/* ═══════════ THEME-AWARE STYLES ═══════════ */}
      <style>{`
        /* ── Dark tokens (default) ── */
        .rep-page {
          --rep-bg: transparent;
          --rep-card: rgba(255,255,255,0.02);
          --rep-card-hover: rgba(255,255,255,0.04);
          --rep-card-elevated: rgba(255,255,255,0.03);
          --rep-border: rgba(255,255,255,0.06);
          --rep-border-hover: rgba(255,255,255,0.1);
          --rep-input-bg: rgba(255,255,255,0.03);
          --rep-text: #f1f5f9;
          --rep-text-secondary: rgba(203,213,225,0.85);
          --rep-text-muted: rgba(148,163,184,0.55);
          --rep-text-faint: rgba(148,163,184,0.35);
          --rep-accent: #818cf8;
          --rep-accent-strong: #6366f1;
          --rep-accent-bg: rgba(99,102,241,0.12);
          --rep-accent-border: rgba(99,102,241,0.22);
          --rep-accent-glow: rgba(99,102,241,0.08);
          --rep-success: #4ade80;
          --rep-warning: #fbbf24;
          --rep-danger: #f87171;
          --rep-danger-bg: rgba(248,113,113,0.08);
          --rep-danger-border: rgba(248,113,113,0.15);
          --rep-hover-bg: rgba(99,102,241,0.06);
        }

        /* ── Light overrides ── */
        [data-theme="light"] .rep-page {
          --rep-card: #ffffff;
          --rep-card-hover: #fafbfd;
          --rep-card-elevated: #ffffff;
          --rep-border: #e5e7eb;
          --rep-border-hover: #d1d5db;
          --rep-input-bg: #ffffff;
          --rep-text: #0f172a;
          --rep-text-secondary: #475569;
          --rep-text-muted: #94a3b8;
          --rep-text-faint: #cbd5e1;
          --rep-accent: #6366f1;
          --rep-accent-strong: #4f46e5;
          --rep-accent-bg: rgba(99,102,241,0.08);
          --rep-accent-border: rgba(99,102,241,0.2);
          --rep-accent-glow: rgba(99,102,241,0.06);
          --rep-success: #16a34a;
          --rep-warning: #d97706;
          --rep-danger: #dc2626;
          --rep-danger-bg: rgba(239,68,68,0.06);
          --rep-danger-border: rgba(239,68,68,0.15);
          --rep-hover-bg: rgba(99,102,241,0.04);
        }

        /* ── Page layout ── */
        .rep-page {
          display: flex; flex-direction: column;
          height: 100%; overflow: auto;
          background: var(--rep-bg);
        }

        /* ── Header ── */
        .rep-header {
          padding: 28px 32px 24px;
          border-bottom: 1px solid var(--rep-border);
          display: flex; align-items: flex-start; justify-content: space-between; gap: 20px;
          flex-shrink: 0;
        }
        .rep-header-left { display: flex; align-items: center; gap: 12px; }
        .rep-header-icon {
          width: 40px; height: 40px; border-radius: 11px;
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2));
          border: 1px solid var(--rep-accent-border);
          color: var(--rep-accent);
          display: flex; align-items: center; justify-content: center;
        }
        .rep-title {
          margin: 0; font-size: 22px; font-weight: 700;
          color: var(--rep-text); letter-spacing: -0.3px; line-height: 1.2;
        }
        .rep-subtitle {
          margin: 3px 0 0; font-size: 13px; color: var(--rep-text-muted);
        }

        /* ── Body ── */
        .rep-body {
          padding: 24px 32px 32px;
          display: flex; flex-direction: column; gap: 20px;
        }

        /* ── Metrics ── */
        .rep-metrics-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
        }
        .rep-metric {
          position: relative;
          padding: 14px 16px; border-radius: 11px;
          background: var(--rep-card); border: 1px solid var(--rep-border);
          overflow: hidden; transition: all 0.2s;
        }
        .rep-metric:hover {
          border-color: var(--metric-color)40;
          background: var(--rep-card-hover);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px -6px var(--metric-color)25;
        }
        .rep-metric-accent {
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
        }
        .rep-metric-icon {
          width: 30px; height: 30px; border-radius: 8px; margin-bottom: 10px;
          border: 1px solid;
          display: flex; align-items: center; justify-content: center;
        }
        .rep-metric-value {
          font-size: 22px; font-weight: 700; color: var(--rep-text);
          line-height: 1; letter-spacing: -0.5px;
        }
        .rep-metric-label {
          font-size: 11px; color: var(--rep-text-muted);
          margin-top: 3px; font-weight: 500;
        }

        /* ── Two-column layout ── */
        .rep-layout {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 20px;
          min-height: 0;
        }

        /* ── Left panel ── */
        .rep-left-panel {
          display: flex; flex-direction: column; gap: 14px;
        }

        /* ── Card ── */
        .rep-card {
          background: var(--rep-card);
          border: 1px solid var(--rep-border);
          border-radius: 12px;
          overflow: hidden;
        }
        .rep-card-header {
          display: flex; align-items: center; gap: 12px;
          padding: 16px 18px;
          border-bottom: 1px solid var(--rep-border);
        }
        .rep-card-header-icon {
          width: 34px; height: 34px; border-radius: 9px;
          background: var(--rep-accent-bg); border: 1px solid var(--rep-accent-border);
          color: var(--rep-accent);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .rep-card-title {
          margin: 0; font-size: 14px; font-weight: 600; color: var(--rep-text);
        }
        .rep-card-subtitle {
          margin: 2px 0 0; font-size: 12px; color: var(--rep-text-muted);
        }
        .rep-card-body {
          padding: 18px;
          display: flex; flex-direction: column; gap: 16px;
        }

        /* ── Fields ── */
        .rep-field { display: flex; flex-direction: column; gap: 6px; }
        .rep-label {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 600;
          color: var(--rep-text-secondary);
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .rep-label svg { color: var(--rep-text-muted); }
        .rep-input {
          width: 100%; padding: 10px 12px; border-radius: 8px;
          border: 1px solid var(--rep-border);
          background: var(--rep-input-bg); color: var(--rep-text);
          font-size: 13px; outline: none; font-family: inherit;
          transition: all 0.15s; box-sizing: border-box;
        }
        .rep-input:focus {
          border-color: var(--rep-accent);
          box-shadow: 0 0 0 3px var(--rep-accent-glow);
        }
        .rep-select { cursor: pointer; appearance: none; }

        .rep-field-hint {
          display: flex; align-items: center; gap: 5px;
          margin-top: 4px; font-size: 11px;
        }
        .rep-field-hint-success { color: var(--rep-success); }

        /* ── Format cards ── */
        .rep-format-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
        }
        .rep-format-card {
          position: relative;
          display: flex; align-items: center; gap: 10px;
          padding: 11px 12px; border-radius: 9px;
          background: var(--rep-input-bg);
          border: 1.5px solid var(--rep-border);
          cursor: pointer; transition: all 0.15s;
          font-family: inherit; text-align: left;
        }
        .rep-format-card:hover {
          border-color: var(--rep-border-hover);
          background: var(--rep-card-hover);
        }
        .rep-format-card-active {
          border-color: var(--rep-accent) !important;
          background: var(--rep-accent-glow) !important;
        }
        .rep-format-icon {
          width: 30px; height: 30px; border-radius: 7px; flex-shrink: 0;
          background: var(--rep-accent-bg); color: var(--rep-accent);
          display: flex; align-items: center; justify-content: center;
        }
        .rep-format-content { flex: 1; min-width: 0; }
        .rep-format-label {
          font-size: 13px; font-weight: 600; color: var(--rep-text);
        }
        .rep-format-hint {
          font-size: 10px; color: var(--rep-text-muted); margin-top: 1px;
        }
        .rep-format-check {
          color: var(--rep-accent); flex-shrink: 0;
        }

        /* ── Buttons ── */
        .rep-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 7px;
          padding: 9px 16px; border-radius: 9px;
          font-size: 13px; font-weight: 500; font-family: inherit;
          border: none; cursor: pointer; transition: all 0.15s;
        }
        .rep-btn-full { width: 100%; padding: 11px 16px; }
        .rep-btn-primary {
          background: linear-gradient(135deg, #6366f1, #7c3aed);
          color: #fff; font-weight: 600;
          box-shadow: 0 2px 12px rgba(99,102,241,0.3);
        }
        .rep-btn-primary:hover:not(.rep-btn-disabled) {
          box-shadow: 0 4px 20px rgba(99,102,241,0.45);
          transform: translateY(-1px);
        }
        .rep-btn-secondary {
          background: var(--rep-card); border: 1px solid var(--rep-border);
          color: var(--rep-text-secondary);
        }
        .rep-btn-secondary:hover {
          background: var(--rep-card-hover);
          border-color: var(--rep-border-hover);
          color: var(--rep-text);
        }
        .rep-btn-disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }

        .rep-spinner {
          width: 13px; height: 13px;
          border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
          border-radius: 50%; animation: repSpin 0.75s linear infinite;
        }
        @keyframes repSpin { to { transform: rotate(360deg); } }

        /* ── AI Card ── */
        .rep-card-ai {
          background: linear-gradient(135deg, rgba(251,191,36,0.04), rgba(99,102,241,0.03));
          border-color: rgba(251,191,36,0.15);
        }
        [data-theme="light"] .rep-card-ai {
          background: linear-gradient(135deg, rgba(251,191,36,0.05), rgba(99,102,241,0.03));
        }
        .rep-ai-header {
          padding: 16px 18px 12px;
        }
        .rep-ai-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 9px; border-radius: 5px;
          background: rgba(251,191,36,0.12); color: var(--rep-warning);
          border: 1px solid rgba(251,191,36,0.2);
          font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.5px;
          margin-bottom: 10px;
        }
        .rep-ai-title {
          margin: 0; font-size: 14px; font-weight: 600; color: var(--rep-text);
        }
        .rep-ai-desc {
          margin: 3px 0 0; font-size: 12px; color: var(--rep-text-muted);
          line-height: 1.5;
        }
        .rep-ai-features {
          padding: 0 12px 12px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .rep-ai-feature {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px; border-radius: 8px;
          transition: background 0.15s;
        }
        .rep-ai-feature:hover { background: var(--rep-hover-bg); }
        .rep-ai-feature-icon {
          width: 28px; height: 28px; border-radius: 7px;
          background: var(--rep-accent-bg); color: var(--rep-accent);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .rep-ai-feature-label {
          font-size: 12px; font-weight: 500; color: var(--rep-text);
        }
        .rep-ai-feature-desc {
          font-size: 10px; color: var(--rep-text-muted); margin-top: 1px;
        }

        /* ── Info card ── */
        .rep-card-info { padding: 14px 18px; }
        .rep-info-header {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 600; color: var(--rep-text);
          margin-bottom: 8px;
        }
        .rep-info-header svg { color: var(--rep-text-muted); }
        .rep-info-list {
          margin: 0; padding: 0; list-style: none;
          display: flex; flex-direction: column; gap: 6px;
        }
        .rep-info-list li {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; color: var(--rep-text-muted);
        }
        .rep-info-list svg { color: var(--rep-success); flex-shrink: 0; }

        /* ── Right panel ── */
        .rep-right-panel {
          background: var(--rep-card);
          border: 1px solid var(--rep-border);
          border-radius: 12px;
          display: flex; flex-direction: column;
          overflow: hidden;
          min-height: 500px;
        }

        /* ── Toolbar ── */
        .rep-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid var(--rep-border);
          gap: 12px; flex-wrap: wrap;
        }
        .rep-toolbar-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 600; color: var(--rep-text);
        }
        .rep-toolbar-title svg { color: var(--rep-text-muted); }
        .rep-count-chip {
          padding: 2px 8px; border-radius: 5px;
          background: var(--rep-accent-bg); color: var(--rep-accent);
          font-size: 11px; font-weight: 700;
        }
        .rep-toolbar-actions {
          display: flex; align-items: center; gap: 8px;
        }
        .rep-search-wrap {
          position: relative; width: 200px;
        }
        .rep-search-icon {
          position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
          color: var(--rep-text-muted); pointer-events: none;
        }
        .rep-search-input {
          width: 100%; padding: 7px 28px 7px 30px;
          border-radius: 7px; border: 1px solid var(--rep-border);
          background: var(--rep-input-bg); color: var(--rep-text);
          font-size: 12px; outline: none; font-family: inherit;
          transition: all 0.15s; box-sizing: border-box;
        }
        .rep-search-input:focus {
          border-color: var(--rep-accent);
          box-shadow: 0 0 0 3px var(--rep-accent-glow);
        }
        .rep-search-clear {
          position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
          background: var(--rep-border); border: none; color: var(--rep-text-muted);
          cursor: pointer; padding: 2px 4px; border-radius: 4px;
          display: flex; align-items: center;
        }
        .rep-filter-select {
          padding: 7px 12px; border-radius: 7px;
          border: 1px solid var(--rep-border);
          background: var(--rep-input-bg); color: var(--rep-text);
          font-size: 12px; cursor: pointer; font-family: inherit;
          outline: none;
        }
        .rep-refresh-btn {
          width: 30px; height: 30px; border-radius: 7px;
          background: var(--rep-input-bg); border: 1px solid var(--rep-border);
          color: var(--rep-text-muted); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .rep-refresh-btn:hover {
          color: var(--rep-accent); border-color: var(--rep-accent-border);
          background: var(--rep-accent-glow);
        }

        /* ── Table ── */
        .rep-table-wrap { flex: 1; overflow: auto; }
        .rep-table {
          width: 100%; border-collapse: separate; border-spacing: 0;
          font-size: 13px; table-layout: fixed;
        }
        .rep-table th {
          padding: 10px 16px; text-align: left;
          font-size: 10px; font-weight: 600;
          color: var(--rep-text-muted); text-transform: uppercase; letter-spacing: 0.8px;
          border-bottom: 1px solid var(--rep-border);
          background: var(--rep-card-elevated);
          position: sticky; top: 0; z-index: 5;
        }
        .rep-table td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--rep-border);
          vertical-align: middle;
          overflow: hidden;
        }
        .rep-table tbody tr {
          transition: background 0.15s;
        }
        .rep-row-hover { background: var(--rep-hover-bg) !important; }
        .rep-table tbody tr:last-child td { border-bottom: none; }

        .rep-row-report {
          display: flex; align-items: center; gap: 10px; min-width: 0;
        }
        .rep-row-icon {
          width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
          border: 1px solid;
          display: flex; align-items: center; justify-content: center;
        }
        .rep-row-info { min-width: 0; flex: 1; }
        .rep-row-name {
          font-size: 13px; font-weight: 500; color: var(--rep-text);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .rep-row-meta {
          display: flex; align-items: center; gap: 4px; margin-top: 2px;
          font-size: 10px; color: var(--rep-text-muted);
        }
        .rep-row-id { font-family: monospace; }
        .rep-row-date {
          display: flex; align-items: center; gap: 8px;
          color: var(--rep-text-secondary); font-size: 12px;
        }
        .rep-row-date svg { color: var(--rep-text-muted); flex-shrink: 0; }
        .rep-row-time {
          font-size: 10px; color: var(--rep-text-muted); margin-top: 1px;
        }

        .rep-row-actions {
          display: flex; gap: 4px; justify-content: flex-end;
          opacity: 0; transition: opacity 0.15s;
        }
        .rep-row-actions.visible { opacity: 1; }
        .rep-action-btn {
          background: var(--rep-input-bg); border: 1px solid var(--rep-border);
          border-radius: 6px; padding: 5px 7px; cursor: pointer;
          color: var(--rep-text-muted);
          display: flex; align-items: center; transition: all 0.15s;
        }
        .rep-action-download:hover {
          color: var(--rep-accent); border-color: var(--rep-accent-border);
          background: var(--rep-accent-glow);
        }
        .rep-action-delete:hover {
          color: var(--rep-danger); border-color: var(--rep-danger-border);
          background: var(--rep-danger-bg);
        }

        /* ── Badge ── */
        .rep-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 8px; border-radius: 5px;
          font-size: 11px; font-weight: 600;
          white-space: nowrap; line-height: 1;
        }

        /* ── Empty ── */
        .rep-empty {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 60px 40px; text-align: center;
        }
        .rep-empty-icon {
          width: 64px; height: 64px; border-radius: 16px; margin-bottom: 16px;
          background: var(--rep-accent-bg); border: 1px solid var(--rep-accent-border);
          color: var(--rep-accent); opacity: 0.6;
          display: flex; align-items: center; justify-content: center;
        }
        .rep-empty h3 {
          color: var(--rep-text); margin: 0 0 6px;
          font-size: 15px; font-weight: 600;
        }
        .rep-empty p {
          color: var(--rep-text-muted); margin: 0 0 20px;
          font-size: 13px; max-width: 320px; line-height: 1.6;
        }

        /* ── Warning banner ── */
        .rep-warning-banner {
          display: flex; align-items: flex-start; gap: 8px;
          padding: 10px 14px; border-radius: 8px;
          background: var(--rep-danger-bg); border: 1px solid var(--rep-danger-border);
        }
        .rep-warning-banner svg {
          color: var(--rep-danger); flex-shrink: 0; margin-top: 1px;
        }
        .rep-warning-banner span {
          color: var(--rep-danger); font-size: 13px; line-height: 1.5;
        }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .rep-layout { grid-template-columns: 1fr; }
          .rep-metrics-row { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 700px) {
          .rep-body { padding: 16px 20px; }
          .rep-header { padding: 20px; }
          .rep-metrics-row { grid-template-columns: repeat(2, 1fr); }
          .rep-toolbar { flex-direction: column; align-items: stretch; }
          .rep-toolbar-actions { justify-content: space-between; }
          .rep-search-wrap { flex: 1; }
        }
      `}</style>
    </div>
  );
}

export default Reports;
