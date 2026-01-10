import React, { useState, useEffect } from 'react';
import { 
  FiFileText, FiDownload, FiTrash2, FiRefreshCw, FiList, FiZap, 
  FiCalendar, FiClock, FiCheckCircle, FiAlertTriangle, FiTrendingUp,
  FiPieChart, FiFile, FiArchive, FiStar, FiShield, FiChevronDown
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../api';

function Reports({ testRuns, settings, projectId }) {
  const [reports, setReports] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportOptions, setReportOptions] = useState({ format: 'pdf' });

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
    if (!window.confirm("Delete this report?")) return;
    try {
      await api.deleteReport(id);
      setReports(reports.filter(r => (r._id || r.id) !== id));
      toast.success("Deleted");
    } catch { toast.error("Delete Failed"); }
  };

  const getFormatIcon = (format) => {
    switch(format) {
      case 'pdf': return <FiFileText />;
      case 'word': return <FiFile />;
      default: return <FiFileText />;
    }
  };

  return (
    <div className="reports-page">
      {/* Ambient Background */}
      <div className="reports-ambient">
        <div className="ambient-orb ambient-orb-1"></div>
        <div className="ambient-orb ambient-orb-2"></div>
        <div className="ambient-orb ambient-orb-3"></div>
      </div>

      {/* Main Scrollable Content */}
      <div className="reports-scroll-container">
        <div className="reports-content">
          <div className="page-header">
            <div className="header-content">
              <div className="header-badge">
                <FiPieChart className="badge-icon" />
                <span>Analytics Hub</span>
              </div>
              <h2 className="section-title">Reports & Analytics</h2>
              <p className="section-description">Generate comprehensive test reports with AI-powered insights</p>
            </div>
            <div className="header-stats">
              <div className="header-stat">
                <span className="header-stat-value">{reports.length}</span>
                <span className="header-stat-label">Reports</span>
              </div>
              <div className="header-stat">
                <span className="header-stat-value">{testRuns?.length || 0}</span>
                <span className="header-stat-label">Test Runs</span>
              </div>
            </div>
          </div>
          
          <div className="reports-layout">
            
            {/* Left Panel: Generation Form - Scrollable */}
            <div className="generation-panel">
              <div className="generation-panel-scroll">
                <div className="panel-card generation-card">
                  <div className="panel-header">
                    <div className="panel-header-content">
                      <div className="panel-icon">
                        <FiZap />
                      </div>
                      <div className="panel-title-group">
                        <h3>Create New Report</h3>
                        <span className="panel-subtitle">Configure and generate</span>
                      </div>
                    </div>
                  </div>
                  <div className="panel-body">
                    <div className="form-group">
                      <label className="form-label">
                        <FiArchive className="label-icon" />
                        Report Scope
                      </label>
                      <div className="select-wrapper premium-select">
                        <select 
                          value={selectedRunId} 
                          onChange={e => setSelectedRunId(e.target.value)} 
                          className="form-select"
                        >
                          <option value="">Select Test Run or Project Overview</option>
                          <option value="ALL_PROJECT_RUNS" className="option-highlight">
                            📊 Project Overview (All Runs)
                          </option>
                          <optgroup label="Individual Test Runs">
                            {testRuns.map(r => (
                              <option key={r._id || r.id} value={r._id || r.id}>
                                {r.name} ({r.status})
                              </option>
                            ))}
                          </optgroup>
                        </select>
                        <div className="select-arrow">
                          <FiChevronDown />
                        </div>
                      </div>
                      {selectedRunId && (
                        <div className="selection-indicator">
                          <FiCheckCircle />
                          <span>Scope selected</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">
                        <FiFileText className="label-icon" />
                        Output Format
                      </label>
                      <div className="format-options">
                        <div 
                          className={`format-option ${reportOptions.format === 'pdf' ? 'active' : ''}`}
                          onClick={() => setReportOptions({ format: 'pdf' })}
                        >
                          <div className="format-option-icon">
                            <FiFileText />
                          </div>
                          <div className="format-option-content">
                            <span className="format-option-title">PDF</span>
                            <span className="format-option-desc">Best for sharing</span>
                          </div>
                          {reportOptions.format === 'pdf' && (
                            <div className="format-check">
                              <FiCheckCircle />
                            </div>
                          )}
                        </div>
                        <div 
                          className={`format-option ${reportOptions.format === 'word' ? 'active' : ''}`}
                          onClick={() => setReportOptions({ format: 'word' })}
                        >
                          <div className="format-option-icon">
                            <FiList />
                          </div>
                          <div className="format-option-content">
                            <span className="format-option-title">Word</span>
                            <span className="format-option-desc">Editable DOCX</span>
                          </div>
                          {reportOptions.format === 'word' && (
                            <div className="format-check">
                              <FiCheckCircle />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* GENERATE BUTTON */}
                    <button 
                      className={`btn btn-primary btn-generate ${isGenerating ? 'generating' : ''}`}
                      onClick={handleGenerate} 
                      disabled={isGenerating || !selectedRunId}
                    >
                      {isGenerating ? (
                        <>
                          <span className="btn-spinner"></span>
                          <span>Generating Report...</span>
                        </>
                      ) : (
                        <>
                          <FiZap className="btn-icon" />
                          <span>Generate Report</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* AI Features Panel */}
                <div className="panel-card ai-panel">
                  <div className="ai-panel-glow"></div>
                  <div className="panel-body">
                    <div className="ai-header">
                      <div className="ai-badge">
                        <FiStar />
                        <span>AI-Powered</span>
                      </div>
                    </div>
                    <div className="ai-content">
                      <h4>Intelligent Analysis</h4>
                      <p>Reports include AI-generated insights for better decision making</p>
                    </div>
                    <div className="ai-features">
                      <div className="ai-feature">
                        <div className="ai-feature-icon">
                          <FiTrendingUp />
                        </div>
                        <span>Executive Summary</span>
                      </div>
                      <div className="ai-feature">
                        <div className="ai-feature-icon">
                          <FiAlertTriangle />
                        </div>
                        <span>Risk Assessment</span>
                      </div>
                      <div className="ai-feature">
                        <div className="ai-feature-icon">
                          <FiShield />
                        </div>
                        <span>Release Readiness</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="panel-card stats-panel">
                  <div className="panel-body">
                    <div className="quick-stats">
                      <div className="quick-stat">
                        <div className="quick-stat-icon pdf">
                          <FiFileText />
                        </div>
                        <div className="quick-stat-info">
                          <span className="quick-stat-value">
                            {reports.filter(r => r.format === 'pdf').length}
                          </span>
                          <span className="quick-stat-label">PDF Reports</span>
                        </div>
                      </div>
                      <div className="quick-stat">
                        <div className="quick-stat-icon word">
                          <FiFile />
                        </div>
                        <div className="quick-stat-info">
                          <span className="quick-stat-value">
                            {reports.filter(r => r.format === 'word').length}
                          </span>
                          <span className="quick-stat-label">Word Reports</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Info Card for more scroll content */}
                <div className="panel-card info-panel">
                  <div className="panel-body">
                    <div className="info-content">
                      <h4>
                        <FiClock className="info-icon" />
                        Report History
                      </h4>
                      <p>Your generated reports are stored securely and can be downloaded anytime.</p>
                      <ul className="info-list">
                        <li>Reports are retained for 90 days</li>
                        <li>Download in original format</li>
                        <li>Share via secure links</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Reports List - Scrollable */}
            <div className="reports-list-panel">
              <div className="reports-list-header">
                <div className="reports-list-title">
                  <FiArchive className="title-icon" />
                  <h3>Generated Reports</h3>
                  <span className="reports-count-badge">{reports.length}</span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={loadReports}>
                  <FiRefreshCw />
                  <span>Refresh</span>
                </button>
              </div>
              
              <div className="table-scroll-container">
                <div className="table-container">
                  {reports.length > 0 ? (
                    <table className="data-table reports-table">
                      <thead>
                        <tr>
                          <th>
                            <span className="th-content">Report Name</span>
                          </th>
                          <th style={{width: '120px'}}>
                            <span className="th-content">Format</span>
                          </th>
                          <th style={{width: '150px'}}>
                            <span className="th-content">Generated</span>
                          </th>
                          <th style={{width: '120px', textAlign: 'right'}}>
                            <span className="th-content">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map(rep => (
                          <tr key={rep._id || rep.id} className="report-row">
                            <td>
                              <div className="report-name-cell">
                                <div className="report-icon">
                                  {getFormatIcon(rep.format)}
                                </div>
                                <div className="report-info">
                                  <span className="report-name">{rep.name}</span>
                                  <span className="report-id">ID: {(rep._id || rep.id).slice(-8)}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`format-badge format-${rep.format}`}>
                                {getFormatIcon(rep.format)}
                                <span>{rep.format.toUpperCase()}</span>
                              </span>
                            </td>
                            <td>
                              <div className="date-cell">
                                <FiCalendar className="date-icon" />
                                <span>{new Date(rep.generatedAt).toLocaleDateString()}</span>
                              </div>
                            </td>
                            <td className="actions-cell">
                              <div className="actions-group">
                                <button 
                                  className="action-btn action-btn-download" 
                                  onClick={() => handleDownload(rep)} 
                                  title="Download"
                                >
                                  <FiDownload />
                                </button>
                                <button 
                                  className="action-btn action-btn-delete" 
                                  onClick={() => handleDelete(rep._id || rep.id)} 
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
                      <div className="empty-state-illustration">
                        <div className="empty-state-icon">
                          <FiFileText />
                        </div>
                        <div className="empty-state-decoration">
                          <div className="decoration-dot"></div>
                          <div className="decoration-dot"></div>
                          <div className="decoration-dot"></div>
                        </div>
                      </div>
                      <h3>No reports generated yet</h3>
                      <p>Create your first report by selecting a test run and clicking generate</p>
                      <div className="empty-state-hint">
                        <FiZap />
                        <span>Reports include AI-powered insights and recommendations</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;