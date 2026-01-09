import React, { useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { FiRefreshCw, FiCheckCircle, FiXCircle, FiAlertCircle, FiTrendingUp, FiFolder, FiPlay, FiFileText, FiMinusCircle } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function Dashboard({ statistics, testSuites, testRuns, onRefresh }) {
  
  // ROBUST DATA INITIALIZATION
  const stats = useMemo(() => {
    const defaults = {
      totalTestCases: 0,
      totalTestRuns: 0,
      passRate: 0,
      statusCounts: { passed: 0, failed: 0, blocked: 0, na: 0, notRun: 0 },
      priorityCounts: { critical: 0, high: 0, medium: 0, low: 0 }
    };

    if (!statistics) return defaults;

    return {
      ...defaults,
      ...statistics,
      statusCounts: { ...defaults.statusCounts, ...statistics.statusCounts },
      priorityCounts: { ...defaults.priorityCounts, ...statistics.priorityCounts }
    };
  }, [statistics]);

  const recentRuns = useMemo(() => 
    testRuns ? [...testRuns].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt)).slice(0, 5) : []
  , [testRuns]);

  const activeRuns = useMemo(() => 
    testRuns ? testRuns.filter(r => r.status === 'In Progress').length : 0
  , [testRuns]);

  // Chart Data
  const statusChartData = {
    labels: ['Passed', 'Failed', 'Blocked', 'N/A', 'Not Run'],
    datasets: [{
      data: [
        stats.statusCounts.passed, 
        stats.statusCounts.failed, 
        stats.statusCounts.blocked, 
        stats.statusCounts.na, 
        stats.statusCounts.notRun
      ],
      backgroundColor: ['#10b981', '#f43f5e', '#f59e0b', '#94a3b8', '#e2e8f0'],
      borderWidth: 0,
      hoverOffset: 15
    }]
  };

  const priorityChartData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [{
      label: 'Test Cases',
      data: [
        stats.priorityCounts.critical, 
        stats.priorityCounts.high, 
        stats.priorityCounts.medium, 
        stats.priorityCounts.low
      ],
      backgroundColor: ['#ef4444', '#f97316', '#3b82f6', '#22c55e'],
      borderRadius: 8
    }]
  };

  const trendChartData = {
    labels: recentRuns.map((_, i) => `Run ${recentRuns.length - i}`).reverse(),
    datasets: [{
      label: 'Pass Rate %',
      data: recentRuns.map(r => {
        const total = (r.passed || 0) + (r.failed || 0) + (r.blocked || 0);
        return total > 0 ? ((r.passed / total) * 100).toFixed(0) : 0;
      }).reverse(),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 6,
      pointBackgroundColor: '#6366f1'
    }]
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <div className="header-content">
          <h2 className="section-title">Project Insights</h2>
          <p className="section-description">Real-time health metrics and test coverage</p>
        </div>
        <button className="btn btn-secondary" onClick={onRefresh}><FiRefreshCw /> Sync Data</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><FiFileText /></div>
          <div className="stat-content"><span className="stat-value">{stats.totalTestCases}</span><span className="stat-label">Total Cases</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><FiFolder /></div>
          <div className="stat-content"><span className="stat-value">{testSuites?.length || 0}</span><span className="stat-label">Suites</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><FiPlay /></div>
          <div className="stat-content"><span className="stat-value">{activeRuns}</span><span className="stat-label">Active Runs</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FiTrendingUp /></div>
          <div className="stat-content"><span className="stat-value">{stats.passRate}%</span><span className="stat-label">Stability</span></div>
        </div>
      </div>

      <div className="status-summary">
        <div className="status-card passed"><FiCheckCircle color="#10b981" size={20} /> <div><span className="stat-value">{stats.statusCounts.passed}</span><span className="stat-label">Passed</span></div></div>
        <div className="status-card failed"><FiXCircle color="#f43f5e" size={20} /> <div><span className="stat-value">{stats.statusCounts.failed}</span><span className="stat-label">Failed</span></div></div>
        <div className="status-card blocked"><FiAlertCircle color="#f59e0b" size={20} /> <div><span className="stat-value">{stats.statusCounts.blocked}</span><span className="stat-label">Blocked</span></div></div>
        <div className="status-card not-run"><FiMinusCircle color="#94a3b8" size={20} /> <div><span className="stat-value">{stats.statusCounts.na}</span><span className="stat-label">N/A</span></div></div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header"><h3>Execution Health</h3></div>
          <div className="chart-body" style={{height: '300px'}}>
            <Doughnut data={statusChartData} options={{ responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>
        
        <div className="chart-card">
          <div className="chart-header"><h3>Priority Distribution</h3></div>
          <div className="chart-body" style={{height: '300px'}}>
            <Bar data={priorityChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>

        <div className="chart-card wide">
          <div className="chart-header"><h3>Reliability Trend</h3></div>
          <div className="chart-body" style={{height: '250px'}}>
            <Line data={trendChartData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;