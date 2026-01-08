import React, { useState, useEffect } from 'react';
import { FiFileText, FiDownload, FiTrash2, FiRefreshCw, FiList, FiZap } from 'react-icons/fi';
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
    } catch { toast.error("Download Failed"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this report?")) return;
    try {
      await api.deleteReport(id);
      setReports(reports.filter(r => (r._id || r.id) !== id));
      toast.success("Deleted");
    } catch { toast.error("Delete Failed"); }
  };

  return (
    <div className="reports-page">
      <div className="reports-header">
        <h1>Reports & Analytics</h1>
        <p>Generate comprehensive test reports with AI-powered insights</p>
      </div>
      
      <div className="reports-layout">
        
        {/* Left Panel: Generation Form */}
        <div className="generation-panel">
          <div className="panel-card">
            <div className="panel-header">
              <div className="panel-header-icon">
                <FiFileText size={18} />
              </div>
              <h3>Create New Report</h3>
            </div>
            <div className="panel-body">
              <div className="form-group">
                <label>Report Scope</label>
                <select 
                  value={selectedRunId} 
                  onChange={e => setSelectedRunId(e.target.value)} 
                  className="form-select"
                >
                  <option value="">-- Select Test Run or Project Overview --</option>
                  <option value="ALL_PROJECT_RUNS" style={{fontWeight: 'bold', color: '#4f46e5'}}>📊 Project Overview (All Runs)</option>
                  <optgroup label="Individual Test Runs">
                    {testRuns.map(r => (
                      <option key={r._id || r.id} value={r._id || r.id}>
                        {r.name} ({r.status})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
              
              <div className="form-group">
                <label>Output Format</label>
                <div className="format-options">
                  <div 
                    className={`format-option pdf ${reportOptions.format === 'pdf' ? 'active' : ''}`}
                    onClick={() => setReportOptions({ format: 'pdf' })}
                  >
                    <div className="format-icon">
                      <FiFileText size={20} />
                    </div>
                    <span>PDF</span>
                  </div>
                  <div 
                    className={`format-option word ${reportOptions.format === 'word' ? 'active' : ''}`}
                    onClick={() => setReportOptions({ format: 'word' })}
                  >
                    <div className="format-icon">
                      <FiList size={20} />
                    </div>
                    <span>Word</span>
                  </div>
                </div>
              </div>

              <button 
                className="btn-generate" 
                onClick={handleGenerate} 
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <FiRefreshCw className="spin" size={16} /> 
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <FiFileText size={16} />
                    <span>Generate Report</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* AI Banner */}
          <div className="panel-card ai-panel">
            <div className="panel-body">
              <div className="ai-icon">
                <FiZap size={20} />
              </div>
              <div className="ai-content">
                <strong className="ai-title">✨ AI-Powered Analysis</strong>
                <p className="ai-description">
                  Reports include intelligent executive summaries, risk assessment, and release recommendations powered by advanced AI.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Reports List */}
        <div className="reports-list-panel">
          <div className="list-panel-header">
            <h2>Generated Reports</h2>
          </div>
          
          <div className="table-container">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Report Name</th>
                  <th>Format</th>
                  <th>Generated Date</th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.length > 0 ? (
                  reports.map(rep => (
                    <tr key={rep._id || rep.id}>
                      <td>
                        <div className="report-name">
                          <div className={`report-icon ${rep.format}`}>
                            <FiFileText size={16} />
                          </div>
                          <span>{rep.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`format-badge ${rep.format}`}>
                          {rep.format.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="report-date">
                          {new Date(rep.generatedAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                          <span className="report-time">
                            {new Date(rep.generatedAt).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="actions-cell">
                        <div className="action-buttons">
                          <button 
                            className="btn-action download" 
                            onClick={() => handleDownload(rep)} 
                            title="Download"
                          >
                            <FiDownload size={16} />
                          </button>
                          <button 
                            className="btn-action delete" 
                            onClick={() => handleDelete(rep._id || rep.id)} 
                            title="Delete"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">
                      <div className="reports-empty">
                        <div className="empty-icon">
                          <FiFileText size={32} />
                        </div>
                        <h3>No Reports Yet</h3>
                        <p>Generate your first report by selecting a test run and clicking "Generate Report"</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Reports;