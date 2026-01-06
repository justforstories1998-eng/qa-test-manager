import React, { useState, useEffect, useMemo } from 'react';
import { FiFileText, FiDownload, FiTrash2, FiRefreshCw, FiList } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../api';

function Reports({ testRuns, settings, projectId }) {
  const [reports, setReports] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportOptions, setReportOptions] = useState({ format: 'pdf' });

  useEffect(() => { if (projectId) loadReports(); }, [projectId]);

  const loadReports = async () => {
    const res = await api.getReports(projectId);
    if (res.success) setReports(res.data);
  };

  const handleGenerate = async () => {
    if (!selectedRunId) return toast.warning("Select a run");
    setIsGenerating(true);
    try {
      const res = await api.generateReport(selectedRunId, reportOptions.format, projectId);
      if (res.success) {
        toast.success("Generated!");
        setReports([res.data, ...reports]);
      }
    } catch { toast.error("Generation failed"); }
    finally { setIsGenerating(false); }
  };

  // ... (Rest of component render logic, simplified here for brevity but assumes standard layout)
  // Ensure you use the filtered 'testRuns' passed from App.jsx which are already project-specific.
  
  return (
    <div className="reports-page">
      <div className="page-header"><h2 className="section-title">Reports</h2></div>
      <div className="reports-layout">
        <div className="generation-panel">
          <div className="panel-card">
            <div className="panel-header"><h3>Generate Report</h3></div>
            <div className="panel-body">
              <div className="form-group">
                <label>Test Run</label>
                <select onChange={e => setSelectedRunId(e.target.value)} className="form-select">
                  <option value="">Select Run</option>
                  {testRuns.filter(r => r.status === 'Completed').map(r => <option key={r.id || r._id} value={r.id || r._id}>{r.name}</option>)}
                </select>
              </div>
              <button className="btn btn-primary btn-block" onClick={handleGenerate} disabled={isGenerating}>Generate</button>
            </div>
          </div>
        </div>
        <div className="reports-list-panel">
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Format</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {reports.map(rep => (
                  <tr key={rep._id || rep.id}>
                    <td>{rep.name}</td><td>{rep.format}</td><td>{new Date(rep.generatedAt).toLocaleDateString()}</td>
                    <td><button className="action-btn danger"><FiTrash2 /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Reports;