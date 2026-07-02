import React, { useState, useEffect } from 'react';
import {
  FiFileText, FiDownload, FiTrash2, FiRefreshCw, FiList, FiZap,
  FiCalendar, FiClock, FiCheckCircle, FiAlertTriangle, FiTrendingUp,
  FiPieChart, FiFile, FiArchive, FiStar, FiShield, FiChevronDown
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../api';
import { Modal, ConfirmDialog } from './shared/Modal';
import Badge from './shared/Badge';

function Reports({ testRuns, settings, projectId }) {
  const [reports, setReports] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportOptions, setReportOptions] = useState({ format: 'pdf' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    if (projectId) loadReports();
  }, [projectId]);

  const loadReports = async () => {
    try {
      const res = await api.getReports(projectId);
      if (res.success) setReports(res.data);
    } catch { toast.error("Failed to load reports"); }
  };

  const handleGenerate = async () => {
    if (!selectedRunId) return toast.warning("Please select a report scope");
    setIsGenerating(true);
    try {
      const res = await api.generateReport(selectedRunId, reportOptions.format, projectId);
      if (res.success) {
        toast.success("Report Generated!");
        setReports([res.data, ...reports]);
      }
    } catch { toast.error("Generation Failed"); }
    finally { setIsGenerating(false); }
  };

  const handleDownload = async (report) => {
    try {
      await api.downloadReportFile(report._id || report.id, report.fileName);
      toast.success("Downloading...");
    } catch { toast.error("Download Failed. File may be missing."); }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteReport(id);
      setReports(reports.filter(r => (r._id || r.id) !== id));
      toast.success("Deleted");
      setShowDeleteConfirm(null);
    } catch { toast.error("Delete Failed"); }
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'pdf': return <FiFileText />;
      case 'word': return <FiFile />;
      default: return <FiFileText />;
    }
  };

  return (
    <div className="dg-page">
      {/* Page Header */}
      <div className="dg-page-header">
        <div>
          <h1 className="dg-page-title">
            <FiPieChart style={{ marginRight: 8 }} /> Reports &amp; Analytics
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            Generate comprehensive test reports with AI-powered insights
          </p>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div className="dg-stat-card" style={{ padding: '8px 16px' }}>
            <div className="dg-stat-value" style={{ fontSize: '1.1rem' }}>{reports.length}</div>
            <div className="dg-stat-label">Reports</div>
          </div>
          <div className="dg-stat-card" style={{ padding: '8px 16px' }}>
            <div className="dg-stat-value" style={{ fontSize: '1.1rem' }}>{testRuns?.length || 0}</div>
            <div className="dg-stat-label">Test Runs</div>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, flex: 1, minHeight: 0 }}>

        {/* Left Panel: Generation Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
          {/* Create Report Card */}
          <div className="dg-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(99,102,241,0.12)', color: '#6366f1'
              }}>
                <FiZap />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>Create New Report</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Configure and generate</span>
              </div>
            </div>

            {/* Scope Selector */}
            <div className="dg-input-group">
              <label className="dg-input-label">
                <FiArchive style={{ marginRight: 4 }} /> Report Scope
              </label>
              <select
                className="dg-select"
                value={selectedRunId}
                onChange={e => setSelectedRunId(e.target.value)}
              >
                <option value="">Select Test Run or Project Overview</option>
                <option value="ALL_PROJECT_RUNS">Project Overview (All Runs)</option>
                <optgroup label="Individual Test Runs">
                  {testRuns.map(r => (
                    <option key={r._id || r.id} value={r._id || r.id}>
                      {r.name} ({r.status})
                    </option>
                  ))}
                </optgroup>
              </select>
              {selectedRunId && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: '0.75rem', color: '#34d399' }}>
                  <FiCheckCircle /> Scope selected
                </div>
              )}
            </div>

            {/* Format Selector */}
            <div className="dg-input-group">
              <label className="dg-input-label">
                <FiFileText style={{ marginRight: 4 }} /> Output Format
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div
                  onClick={() => setReportOptions({ format: 'pdf' })}
                  style={{
                    padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                    border: reportOptions.format === 'pdf'
                      ? '1px solid var(--dg-accent)'
                      : '1px solid var(--border-color)',
                      background: reportOptions.format === 'pdf'
                        ? 'rgba(99,102,241,0.12)'
                        : 'var(--surface-secondary)',
                    display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s'
                  }}
                >
                  <FiFileText size={18} color={reportOptions.format === 'pdf' ? '#6366f1' : 'var(--text-muted)'} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>PDF</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Best for sharing</div>
                  </div>
                  {reportOptions.format === 'pdf' && (
                    <FiCheckCircle size={14} color="var(--dg-accent)" style={{ marginLeft: 'auto' }} />
                  )}
                </div>
                <div
                  onClick={() => setReportOptions({ format: 'word' })}
                  style={{
                    padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                    border: reportOptions.format === 'word'
                      ? '1px solid var(--dg-accent)'
                      : '1px solid var(--border-color)',
                      background: reportOptions.format === 'word'
                        ? 'rgba(99,102,241,0.12)'
                        : 'var(--surface-secondary)',
                    display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s'
                  }}
                >
                  <FiList size={18} color={reportOptions.format === 'word' ? '#6366f1' : 'var(--text-muted)'} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>Word</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Editable DOCX</div>
                  </div>
                  {reportOptions.format === 'word' && (
                    <FiCheckCircle size={14} color="var(--dg-accent)" style={{ marginLeft: 'auto' }} />
                  )}
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              className="dg-btn dg-btn-primary"
              onClick={handleGenerate}
              disabled={isGenerating || !selectedRunId}
              style={{ width: '100%', marginTop: 8, padding: '10px 0' }}
            >
              {isGenerating ? (
                <>
                  <span className="dg-spinner" style={{ width: 16, height: 16 }} />
                  Generating Report...
                </>
              ) : (
                <>
                  <FiZap /> Generate Report
                </>
              )}
            </button>
          </div>

          {/* AI Features Card */}
          <div className="dg-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <FiStar size={14} color="#fbbf24" />
              <span className="dg-badge dg-badge-amber">AI-Powered</span>
            </div>
            <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', color: 'var(--text-primary)' }}>Intelligent Analysis</h4>
            <p style={{ margin: '0 0 14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Reports include AI-generated insights for better decision making
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: <FiTrendingUp />, label: 'Executive Summary' },
                { icon: <FiAlertTriangle />, label: 'Risk Assessment' },
                { icon: <FiShield />, label: 'Release Readiness' }
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 6,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--surface-interaction)', color: '#6366f1', fontSize: '0.8rem'
                  }}>
                    {f.icon}
                  </div>
                  {f.label}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="dg-card" style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(239,68,68,0.1)', color: '#f87171'
                }}>
                  <FiFileText />
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {reports.filter(r => r.format === 'pdf').length}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PDF Reports</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(59,130,246,0.1)', color: '#60a5fa'
                }}>
                  <FiFile />
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {reports.filter(r => r.format === 'word').length}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Word Reports</div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="dg-card" style={{ padding: 20 }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiClock size={14} /> Report History
            </h4>
            <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Your generated reports are stored securely and can be downloaded anytime.
            </p>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
              <li>Reports are retained for 90 days</li>
              <li>Download in original format</li>
              <li>Share via secure links</li>
            </ul>
          </div>
        </div>

        {/* Right Panel: Reports List */}
        <div className="dg-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiArchive size={16} color="var(--text-muted)" />
              <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Generated Reports</h3>
              <span className="dg-badge dg-badge-indigo">{reports.length}</span>
            </div>
            <button className="dg-btn dg-btn-ghost" onClick={loadReports} style={{ padding: '4px 10px' }}>
              <FiRefreshCw size={14} /> Refresh
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {reports.length > 0 ? (
              <div className="dg-table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                <table className="dg-table">
                  <thead>
                    <tr>
                      <th>Report Name</th>
                      <th style={{ width: 120 }}>Format</th>
                      <th style={{ width: 150 }}>Generated</th>
                      <th style={{ width: 120, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(rep => (
                      <tr key={rep._id || rep.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 8,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: 'var(--surface-interaction)', color: '#6366f1'
                            }}>
                              {getFormatIcon(rep.format)}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{rep.name}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                ID: {(rep._id || rep.id).slice(-8)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge variant={rep.format === 'pdf' ? 'red' : 'indigo'}>
                            {rep.format.toUpperCase()}
                          </Badge>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <FiCalendar style={{ marginRight: 4, verticalAlign: 'middle' }} />
                          {new Date(rep.generatedAt).toLocaleDateString()}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button
                              className="dg-btn dg-btn-ghost"
                              onClick={() => handleDownload(rep)}
                              title="Download"
                              style={{ padding: '4px 8px', minWidth: 'auto' }}
                            >
                              <FiDownload size={14} />
                            </button>
                            <button
                              className="dg-btn dg-btn-ghost"
                              onClick={() => setShowDeleteConfirm(rep)}
                              title="Delete"
                              style={{ padding: '4px 8px', minWidth: 'auto', color: '#f87171' }}
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="dg-empty">
                <FiFileText size={48} style={{ opacity: 0.3 }} />
                <h3>No reports generated yet</h3>
                <p>Create your first report by selecting a test run and clicking generate</p>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)'
                }}>
                  <FiZap size={14} />
                  <span>Reports include AI-powered insights and recommendations</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={() => handleDelete(showDeleteConfirm?._id || showDeleteConfirm?.id)}
        title="Delete Report"
        message={`Are you sure you want to delete "${showDeleteConfirm?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}

export default Reports;
