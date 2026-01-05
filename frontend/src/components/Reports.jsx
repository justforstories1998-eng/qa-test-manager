import React, { useState, useEffect, useMemo } from 'react';
import {
  FiFileText,
  FiDownload,
  FiTrash2,
  FiRefreshCw,
  FiFile,
  FiCpu,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiClock,
  FiCalendar,
  FiUser,
  FiMonitor,
  FiX,
  FiZap,
  FiBarChart2,
  FiList,
  FiLoader
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../api';

function Reports({ testRuns, settings, onRefresh }) {
  // ============================================
  // STATE
  // ============================================

  const [reports, setReports] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [reportOptions, setReportOptions] = useState({
    format: 'pdf',
    includePassedTests: true,
    includeFailedTests: true,
    includeBlockedTests: true,
    includeNotRunTests: true,
    includeComments: true,
    includeCharts: true
  });

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    loadReports();
  }, []);

  // ============================================
  // API CALLS
  // ============================================

  const loadReports = async () => {
    setIsLoadingReports(true);
    try {
      const response = await api.getReports();
      if (response.success) {
        setReports(response.data);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setIsLoadingReports(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedRunId) {
      toast.warning('Please select a test run');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.generateReport(selectedRunId, reportOptions.format, {
        includePassedTests: reportOptions.includePassedTests,
        includeFailedTests: reportOptions.includeFailedTests,
        includeBlockedTests: reportOptions.includeBlockedTests,
        includeNotRunTests: reportOptions.includeNotRunTests,
        includeComments: reportOptions.includeComments,
        includeCharts: reportOptions.includeCharts
      });

      if (response.success) {
        toast.success(response.message || 'Report generated successfully');
        setReports(prev => [response.data, ...prev]);
        setShowGenerateModal(false);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = async (report) => {
    try {
      const result = await api.downloadReportFile(report.id, report.fileName);
      if (result.success) {
        toast.success('Download started');
      } else {
        toast.error('Download failed');
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download report');
    }
  };

  const handleDeleteReport = async (reportId) => {
    try {
      const response = await api.deleteReport(reportId);
      if (response.success) {
        setReports(prev => prev.filter(r => r.id !== reportId));
        toast.success('Report deleted');
        setShowDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Failed to delete report:', error);
      toast.error('Failed to delete report');
    }
  };

  const handleAIAnalysis = async () => {
    if (!selectedRunId) {
      toast.warning('Please select a test run');
      return;
    }

    if (!settings?.grokAI?.enabled) {
      toast.warning('Grok AI is not enabled. Please configure it in Settings.');
      return;
    }

    setIsAnalyzing(true);
    setAiAnalysis(null);

    try {
      const response = await api.analyzeWithGrok(selectedRunId);
      if (response.success) {
        setAiAnalysis(response.data);
        setShowAnalysisModal(true);
        toast.success('AI analysis completed');
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
      toast.error(error.error || 'AI analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const completedRuns = useMemo(() => {
    return testRuns?.filter(r => r.status === 'Completed') || [];
  }, [testRuns]);

  const selectedRun = useMemo(() => {
    if (!selectedRunId || !testRuns) return null;
    return testRuns.find(r => r.id === selectedRunId);
  }, [selectedRunId, testRuns]);

  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => 
      new Date(b.generatedAt) - new Date(a.generatedAt)
    );
  }, [reports]);

  // ============================================
  // RENDER HELPERS
  // ============================================

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRunPassRate = (run) => {
    const total = run.passed + run.failed + run.blocked;
    if (total === 0) return 0;
    return Math.round((run.passed / total) * 100);
  };

  const getFormatIcon = (format) => {
    switch (format?.toLowerCase()) {
      case 'pdf': return <FiFile className="format-icon pdf" />;
      case 'word':
      case 'docx': return <FiFileText className="format-icon word" />;
      default: return <FiFile className="format-icon" />;
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="reports-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <h2 className="section-title">Reports & Analytics</h2>
          <p className="section-description">
            Generate professional QA reports and AI-powered analysis
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={loadReports}
            disabled={isLoadingReports}
          >
            <FiRefreshCw size={16} className={isLoadingReports ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="reports-layout">
        {/* Report Generation Panel */}
        <div className="generation-panel">
          <div className="panel-card">
            <div className="panel-header">
              <h3>
                <FiFileText size={20} />
                Generate Report
              </h3>
            </div>
            <div className="panel-body">
              {/* Test Run Selection */}
              <div className="form-group">
                <label>Select Test Run</label>
                <select
                  value={selectedRunId || ''}
                  onChange={(e) => setSelectedRunId(e.target.value || null)}
                  className="form-select"
                >
                  <option value="">Choose a completed test run</option>
                  {completedRuns.map(run => (
                    <option key={run.id} value={run.id}>
                      {run.name} ({getRunPassRate(run)}% pass rate)
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Run Preview */}
              {selectedRun && (
                <div className="run-preview">
                  <h4>{selectedRun.name}</h4>
                  <div className="preview-stats">
                    <div className="stat-item">
                      <FiMonitor size={14} />
                      <span>{selectedRun.environment || 'N/A'}</span>
                    </div>
                    <div className="stat-item">
                      <FiUser size={14} />
                      <span>{selectedRun.tester || 'Unassigned'}</span>
                    </div>
                    <div className="stat-item">
                      <FiCalendar size={14} />
                      <span>{formatDate(selectedRun.completedAt)}</span>
                    </div>
                  </div>
                  <div className="preview-results">
                    <span className="result passed">
                      <FiCheckCircle size={14} />
                      {selectedRun.passed} Passed
                    </span>
                    <span className="result failed">
                      <FiXCircle size={14} />
                      {selectedRun.failed} Failed
                    </span>
                    <span className="result blocked">
                      <FiAlertCircle size={14} />
                      {selectedRun.blocked} Blocked
                    </span>
                    <span className="result not-run">
                      <FiClock size={14} />
                      {selectedRun.notRun} Not Run
                    </span>
                  </div>
                </div>
              )}

              {/* Report Format Selection */}
              <div className="form-group">
                <label>Report Format</label>
                <div className="format-options">
                  <label className={`format-option ${reportOptions.format === 'pdf' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="format"
                      value="pdf"
                      checked={reportOptions.format === 'pdf'}
                      onChange={() => setReportOptions(prev => ({ ...prev, format: 'pdf' }))}
                    />
                    <FiFile size={24} />
                    <span>PDF</span>
                  </label>
                  <label className={`format-option ${reportOptions.format === 'word' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="format"
                      value="word"
                      checked={reportOptions.format === 'word'}
                      onChange={() => setReportOptions(prev => ({ ...prev, format: 'word' }))}
                    />
                    <FiFileText size={24} />
                    <span>Word</span>
                  </label>
                </div>
              </div>

              {/* Report Options */}
              <div className="form-group">
                <label>Include in Report</label>
                <div className="checkbox-group">
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={reportOptions.includePassedTests}
                      onChange={(e) => setReportOptions(prev => ({
                        ...prev,
                        includePassedTests: e.target.checked
                      }))}
                    />
                    <span>Passed Tests</span>
                  </label>
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={reportOptions.includeFailedTests}
                      onChange={(e) => setReportOptions(prev => ({
                        ...prev,
                        includeFailedTests: e.target.checked
                      }))}
                    />
                    <span>Failed Tests</span>
                  </label>
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={reportOptions.includeBlockedTests}
                      onChange={(e) => setReportOptions(prev => ({
                        ...prev,
                        includeBlockedTests: e.target.checked
                      }))}
                    />
                    <span>Blocked Tests</span>
                  </label>
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={reportOptions.includeComments}
                      onChange={(e) => setReportOptions(prev => ({
                        ...prev,
                        includeComments: e.target.checked
                      }))}
                    />
                    <span>Comments</span>
                  </label>
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={reportOptions.includeCharts}
                      onChange={(e) => setReportOptions(prev => ({
                        ...prev,
                        includeCharts: e.target.checked
                      }))}
                    />
                    <span>Charts & Graphs</span>
                  </label>
                </div>
              </div>

              {/* Generate Button */}
              <button
                className="btn btn-primary btn-block"
                onClick={handleGenerateReport}
                disabled={!selectedRunId || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <FiLoader size={16} className="spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FiFileText size={16} />
                    Generate Report
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Analysis Panel */}
          <div className="panel-card ai-panel">
            <div className="panel-header">
              <h3>
                <FiCpu size={20} />
                AI Analysis
                <span className="ai-badge">Grok</span>
              </h3>
            </div>
            <div className="panel-body">
              <p className="ai-description">
                Get intelligent insights, risk assessment, and recommendations
                powered by Grok AI.
              </p>

              {!settings?.grokAI?.enabled && (
                <div className="ai-warning">
                  <FiAlertCircle size={18} />
                  <span>Grok AI is not enabled. Configure it in Settings.</span>
                </div>
              )}

              <button
                className="btn btn-ai btn-block"
                onClick={handleAIAnalysis}
                disabled={!selectedRunId || isAnalyzing || !settings?.grokAI?.enabled}
              >
                {isAnalyzing ? (
                  <>
                    <FiLoader size={16} className="spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FiZap size={16} />
                    Analyze with AI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="reports-list-panel">
          <div className="panel-card">
            <div className="panel-header">
              <h3>
                <FiList size={20} />
                Generated Reports
              </h3>
              <span className="report-count">{reports.length} reports</span>
            </div>
            <div className="panel-body">
              {isLoadingReports ? (
                <div className="loading-state">
                  <FiLoader size={32} className="spin" />
                  <p>Loading reports...</p>
                </div>
              ) : sortedReports.length > 0 ? (
                <div className="reports-table-container">
                  <table className="data-table reports-table">
                    <thead>
                      <tr>
                        <th>Report Name</th>
                        <th>Format</th>
                        <th>Generated</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedReports.map(report => {
                        const run = testRuns?.find(r => r.id === report.runId);
                        return (
                          <tr key={report.id}>
                            <td className="report-name-cell">
                              {getFormatIcon(report.format)}
                              <div className="report-info">
                                <span className="report-name">{report.name}</span>
                                <span className="report-run">
                                  {run?.name || 'Unknown Run'}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className={`format-badge ${report.format}`}>
                                {report.format?.toUpperCase()}
                              </span>
                            </td>
                            <td className="date-cell">
                              {formatDate(report.generatedAt)}
                            </td>
                            <td className="actions-cell">
                              <button
                                className="action-btn primary"
                                onClick={() => handleDownloadReport(report)}
                                title="Download Report"
                              >
                                <FiDownload size={16} />
                              </button>
                              <button
                                className="action-btn danger"
                                onClick={() => setShowDeleteConfirm(report)}
                                title="Delete Report"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <FiFileText size={48} />
                  <h4>No Reports Generated</h4>
                  <p>Select a test run and generate your first report</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis Modal */}
      {showAnalysisModal && aiAnalysis && (
        <div className="modal-overlay" onClick={() => setShowAnalysisModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <FiCpu size={20} />
                AI Analysis Results
              </h3>
              <button className="close-btn" onClick={() => setShowAnalysisModal(false)}>
                <FiX size={20} />
              </button>
            </div>
            <div className="modal-body ai-analysis-content">
              {aiAnalysis.sections ? (
                <div className="analysis-sections">
                  {aiAnalysis.sections.executiveSummary && (
                    <div className="analysis-section">
                      <h4>
                        <FiBarChart2 size={18} />
                        Executive Summary
                      </h4>
                      <div className="section-content">
                        {aiAnalysis.sections.executiveSummary}
                      </div>
                    </div>
                  )}

                  {aiAnalysis.sections.keyFindings && (
                    <div className="analysis-section">
                      <h4>
                        <FiList size={18} />
                        Key Findings
                      </h4>
                      <div className="section-content">
                        {aiAnalysis.sections.keyFindings}
                      </div>
                    </div>
                  )}

                  {aiAnalysis.sections.riskAssessment && (
                    <div className="analysis-section">
                      <h4>
                        <FiAlertCircle size={18} />
                        Risk Assessment
                      </h4>
                      <div className="section-content">
                        {aiAnalysis.sections.riskAssessment}
                      </div>
                    </div>
                  )}

                  {aiAnalysis.sections.recommendations && (
                    <div className="analysis-section">
                      <h4>
                        <FiCheckCircle size={18} />
                        Recommendations
                      </h4>
                      <div className="section-content">
                        {aiAnalysis.sections.recommendations}
                      </div>
                    </div>
                  )}

                  {aiAnalysis.sections.releaseReadiness && (
                    <div className="analysis-section">
                      <h4>
                        <FiZap size={18} />
                        Release Readiness
                      </h4>
                      <div className="section-content">
                        {aiAnalysis.sections.releaseReadiness}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="raw-analysis">
                  <pre>{aiAnalysis.rawAnalysis}</pre>
                </div>
              )}

              <div className="analysis-footer">
                <span className="generated-at">
                  <FiClock size={14} />
                  Generated: {formatDate(aiAnalysis.generatedAt)}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowAnalysisModal(false)}
              >
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  navigator.clipboard.writeText(aiAnalysis.rawAnalysis || JSON.stringify(aiAnalysis.sections, null, 2));
                  toast.success('Analysis copied to clipboard');
                }}
              >
                Copy to Clipboard
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
              <h3>Delete Report</h3>
              <button className="close-btn" onClick={() => setShowDeleteConfirm(null)}>
                <FiX size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-warning">
                <FiAlertCircle size={48} />
                <p>Are you sure you want to delete this report?</p>
                <strong>"{showDeleteConfirm.name}"</strong>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteReport(showDeleteConfirm.id)}
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

export default Reports;