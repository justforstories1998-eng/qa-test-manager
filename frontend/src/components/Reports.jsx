import React, { useState, useEffect } from 'react';
import { FiFileText, FiDownload, FiTrash2, FiRefreshCw, FiList } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../api';

function Reports({ testRuns, settings, onGenerate, projectId }) {
  const [reports, setReports] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportOptions, setReportOptions] = useState({ format: 'pdf' });

  // Load reports for this project whenever projectId changes
  useEffect(() => {
    if (projectId) loadReports();
  }, [projectId]);

  const loadReports = async () => {
    const res = await api.getReports(projectId);
    if (res.success) setReports(res.data);
  };

  const handleGenerate = async () => {
    if (!selectedRunId) return toast.warning("Select a run");
    setIsGenerating(true);
    try {
      // Pass projectId to backend
      const res = await onGenerate(selectedRunId, reportOptions.format);
      if (res.success) {
        toast.success("Generated!");
        setReports([res.data, ...reports]);
      }
    } catch { toast.error("Generation failed"); }
    finally { setIsGenerating(false); }
  };

  const handleDownload = async (report) => {
    try {
      await api.downloadReportFile(report._id || report.id, report.fileName);
      toast.success("Downloading...");
    } catch { toast.error("Download failed"); }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteReport(id);
      setReports(reports.filter(r => (r._id || r.id) !== id));
      toast.success("Deleted");
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="reports-page">
      <div className="page-header"><h2 className="section-title">Reports</h2></div>
      <div className="reports-layout">
        
        {/* Generation Panel */}
        <div className="generation-panel">
          <div className="panel-card">
            <div className="panel-header"><h3>Generate Report</h3></div>
            <div className="panel-body">
              <div className="form-group">
                <label>Select Test Run</label>
                <select 
                  value={selectedRunId} 
                  onChange={e => setSelectedRunId(e.target.value)} 
                  className="form-select"
                >
                  <option value="">-- Choose Run --</option>
                  {/* Filter runs passed from App.jsx (which are already filtered by Project) */}
                  {testRuns.map(r => (
                    <option key={r._id || r.id} value={r._id || r.id}>
                      {r.name} ({r.status})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Format</label>
                <div className="format-options">
                  <label className={`format-option ${reportOptions.format === 'pdf' ? 'active' : ''}`} onClick={() => setReportOptions({...reportOptions, format: 'pdf'})}>
                    <FiFileText /> PDF
                  </label>
                  <label className={`format-option ${reportOptions.format === 'word' ? 'active' : ''}`} onClick={() => setReportOptions({...reportOptions, format: 'word'})}>
                    <FiList /> Word
                  </label>
                </div>
              </div>

              <button className="btn btn-primary btn-block" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? <FiRefreshCw className="spin" /> : "Generate Report"}
              </button>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="reports-list-panel">
          <div className="table-container">
            <table className="data-table reports-table">
              <thead><tr><th>Name</th><th>Format</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {reports.length > 0 ? reports.map(rep => (
                  <tr key={rep._id || rep.id}>
                    <td className="report-name-cell">
                      <div className="report-info">
                        <span className="report-name">{rep.name}</span>
                      </div>
                    </td>
                    <td><span className={`format-badge ${rep.format}`}>{rep.format}</span></td>
                    <td>{new Date(rep.generatedAt).toLocaleDateString()}</td>
                    <td className="actions-cell">
                      <button className="action-btn primary" onClick={() => handleDownload(rep)}><FiDownload /></button>
                      <button className="action-btn danger" onClick={() => handleDelete(rep._id || rep.id)}><FiTrash2 /></button>
                    </td>
                  </tr>
                )) : <tr><td colSpan="4" className="text-center">No reports generated yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Reports;