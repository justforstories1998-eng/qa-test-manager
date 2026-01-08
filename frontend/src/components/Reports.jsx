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

  return (
    <div className="reports-page">
      <div className="page-header">
        <div className="header-content">
          <h2 className="section-title">Reports & Analytics</h2>
          <p className="section-description">Generate comprehensive test reports with AI-powered insights</p>
        </div>
      </div>
      
      <div className="reports-layout">
        
        {/* Left Panel: Generation Form */}
        <div className="generation-panel">
          <div className="panel-card">
            <div className="panel-header">Create New Report</div>
            <div className="panel-body">
              <div className="form-group">
                <label>REPORT SCOPE</label>
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
                <label>OUTPUT FORMAT</label>
                <div className="format-options">
                  <div 
                    className={`format-option ${reportOptions.format === 'pdf' ? 'active' : ''}`}
                    onClick={() => setReportOptions({ format: 'pdf' })}
                  >
                    <FiFileText /> <span>PDF</span>
                  </div>
                  <div 
                    className={`format-option ${reportOptions.format === 'word' ? 'active' : ''}`}
                    onClick={() => setReportOptions({ format: 'word' })}
                  >
                    <FiList /> <span>Word (DOCX)</span>
                  </div>
                </div>
              </div>

              {/* GENERATE BUTTON */}
              <button 
                className="btn btn-primary btn-block" 
                onClick={handleGenerate} 
                disabled={isGenerating}
                style={{ marginTop: '10px' }}
              >
                {isGenerating ? <><FiRefreshCw className="spin" /> Generating...</> : "Generate Report"}
              </button>
            </div>
          </div>
          
          {/* AI Banner */}
          <div className="panel-card ai-panel">
            <div className="panel-body">
              <div className="ai-description">
                <div className="ai-title"><FiZap /> AI-Powered Analysis</div>
                <span>Reports include intelligent executive summaries, risk assessment, and release recommendations.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Reports List */}
        <div className="reports-list-panel">
          <div className="table-container">
            <table className="data-table reports-table">
              <thead>
                <tr>
                  <th>Report Name</th>
                  <th>Format</th>
                  <th>Generated</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.length > 0 ? (
                  reports.map(rep => (
                    <tr key={rep._id || rep.id}>
                      <td><span className="report-name">{rep.name}</span></td>
                      <td><span className={`format-badge ${rep.format}`}>{rep.format.toUpperCase()}</span></td>
                      <td>{new Date(rep.generatedAt).toLocaleDateString()}</td>
                      <td className="actions-cell">
                        <div>
                          <button className="action-btn" onClick={() => handleDownload(rep)} title="Download"><FiDownload /></button>
                          <button className="action-btn danger" onClick={() => handleDelete(rep._id || rep.id)} title="Delete"><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" className="text-center" style={{padding: '40px', color: '#94a3b8'}}>No reports generated yet.</td></tr>
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