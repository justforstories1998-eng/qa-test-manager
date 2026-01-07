import React, { useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { FiRefreshCw, FiCheckCircle, FiXCircle, FiAlertCircle, FiClock, FiTrendingUp, FiFolder, FiPlay, FiFileText, FiActivity, FiBarChart2, FiMinusCircle } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function Dashboard({ statistics, testSuites, testRuns, onRefresh }) {
  const stats = useMemo(() => statistics || { totalTestCases: 0, totalTestRuns: 0, passRate: 0, statusCounts: { passed: 0, failed: 0, blocked: 0, na: 0, notRun: 0 }, priorityCounts: { critical: 0, high: 0, medium: 0, low: 0 } }, [statistics]);
  const recentRuns = useMemo(() => testRuns ? [...testRuns].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt)).slice(0, 5) : [], [testRuns]);
  const activeRuns = useMemo(() => testRuns ? testRuns.filter(r => r.status === 'In Progress').length : 0, [testRuns]);

  const statusChartData = {
    labels: ['Passed', 'Failed', 'Blocked', 'N/A', 'Not Run'],
    datasets: [{
      data: [stats.statusCounts.passed, stats.statusCounts.failed, stats.statusCounts.blocked, stats.statusCounts.na || 0, stats.statusCounts.notRun],
      backgroundColor: ['rgba(22, 163, 74, 0.9)', 'rgba(220, 38, 38, 0.9)', 'rgba(217, 119, 6, 0.9)', 'rgba(148, 163, 184, 0.9)', 'rgba(100, 116, 139, 0.9)'],
      borderWidth: 0
    }]
  };

  const statusChartOptions = { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } } };
  
  // ... (Priority and Trend chart logic remains same as before) ...
  const priorityChartData = { labels: ['Critical', 'High', 'Medium', 'Low'], datasets: [{ label: 'Cases', data: [stats.priorityCounts.critical, stats.priorityCounts.high, stats.priorityCounts.medium, stats.priorityCounts.low], backgroundColor: ['#ef4444', '#f97316', '#3b82f6', '#22c55e'], borderRadius: 6 }] };
  const priorityChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } };
  const trendChartData = { labels: recentRuns.map((_, i) => `Run ${recentRuns.length - i}`).reverse(), datasets: [{ label: 'Pass Rate %', data: recentRuns.map(r => r.passed + r.failed > 0 ? ((r.passed / (r.passed + r.failed + r.blocked + (r.na || 0))) * 100).toFixed(0) : 0).reverse(), borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)', fill: true, tension: 0.4 }] };
  const trendChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100 } } };

  return (
    <div className="dashboard">
      <div className="page-header">
        <div className="header-content"><h2 className="section-title">Dashboard</h2></div>
        <button className="btn btn-secondary" onClick={onRefresh}><FiRefreshCw /> Refresh</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon blue"><FiFileText /></div><div className="stat-content"><span className="stat-value">{stats.totalTestCases}</span><span className="stat-label">Total Cases</span></div></div>
        <div className="stat-card"><div className="stat-icon purple"><FiFolder /></div><div className="stat-content"><span className="stat-value">{testSuites?.length || 0}</span><span className="stat-label">Suites</span></div></div>
        <div className="stat-card"><div className="stat-icon orange"><FiPlay /></div><div className="stat-content"><span className="stat-value">{activeRuns}</span><span className="stat-label">Active Runs</span></div></div>
        <div className="stat-card"><div className="stat-icon green"><FiTrendingUp /></div><div className="stat-content"><span className="stat-value">{stats.passRate}%</span><span className="stat-label">Pass Rate</span></div></div>
      </div>

      <div className="status-summary">
        <div className="status-card passed"><FiCheckCircle color="#16a34a" /> <span className="stat-value">{stats.statusCounts.passed}</span> <span className="stat-label">Passed</span></div>
        <div className="status-card failed"><FiXCircle color="#dc2626" /> <span className="stat-value">{stats.statusCounts.failed}</span> <span className="stat-label">Failed</span></div>
        <div className="status-card blocked"><FiAlertCircle color="#d97706" /> <span className="stat-value">{stats.statusCounts.blocked}</span> <span className="stat-label">Blocked</span></div>
        <div className="status-card not-run"><FiMinusCircle color="#94a3b8" /> <span className="stat-value">{stats.statusCounts.na || 0}</span> <span className="stat-label">N/A</span></div>
      </div>

      <div className="charts-grid">
        <div className="chart-card"><div className="chart-header"><h3>Execution Status</h3></div><div className="chart-body doughnut-chart"><Doughnut data={statusChartData} options={statusChartOptions} /></div></div>
        <div className="chart-card"><div className="chart-header"><h3>Priority Breakdown</h3></div><div className="chart-body bar-chart"><Bar data={priorityChartData} options={priorityChartOptions} /></div></div>
        <div className="chart-card wide"><div className="chart-header"><h3>Pass Rate Trend</h3></div><div className="chart-body line-chart"><Line data={trendChartData} options={trendChartOptions} /></div></div>
      </div>
    </div>
  );
}
export default Dashboard;