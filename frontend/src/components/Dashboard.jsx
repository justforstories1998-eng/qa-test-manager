import React, { useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { FiRefreshCw, FiCheckCircle, FiXCircle, FiAlertCircle, FiTrendingUp, FiFolder, FiPlay, FiFileText, FiMinusCircle } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function Dashboard({ statistics, testSuites, testRuns, onRefresh }) {
  const stats = useMemo(() => {
    const d = { totalTestCases: 0, totalTestRuns: 0, passRate: 0, statusCounts: { passed: 0, failed: 0, blocked: 0, na: 0, notRun: 0 }, priorityCounts: { critical: 0, high: 0, medium: 0, low: 0 } };
    if (!statistics) return d;
    return { ...d, ...statistics, statusCounts: { ...d.statusCounts, ...statistics.statusCounts }, priorityCounts: { ...d.priorityCounts, ...statistics.priorityCounts } };
  }, [statistics]);

  const recentRuns = useMemo(() => testRuns ? [...testRuns].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt)).slice(0, 5) : [], [testRuns]);
  const activeRuns = useMemo(() => testRuns ? testRuns.filter(r => r.status === 'In Progress').length : 0, [testRuns]);

  const statusChartData = {
    labels: ['Passed', 'Failed', 'Blocked', 'N/A', 'Not Run'],
    datasets: [{ data: [stats.statusCounts.passed, stats.statusCounts.failed, stats.statusCounts.blocked, stats.statusCounts.na, stats.statusCounts.notRun], backgroundColor: ['#10b981', '#f43f5e', '#f59e0b', '#94a3b8', 'rgba(100,116,139,0.3)'], borderWidth: 0, hoverOffset: 8 }]
  };

  const priorityChartData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [{ label: 'Test Cases', data: [stats.priorityCounts.critical, stats.priorityCounts.high, stats.priorityCounts.medium, stats.priorityCounts.low], backgroundColor: ['#ef4444', '#f97316', '#3b82f6', '#22c55e'], borderRadius: 6 }]
  };

  const trendChartData = {
    labels: recentRuns.map((_, i) => `Run ${recentRuns.length - i}`).reverse(),
    datasets: [{ label: 'Pass Rate %', data: recentRuns.map(r => { const t = (r.passed || 0) + (r.failed || 0) + (r.blocked || 0); return t > 0 ? ((r.passed / t) * 100).toFixed(0) : 0; }).reverse(), borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.08)', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#6366f1' }]
  };

  const chartOpts = (yMax) => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#a3acb9', font: { size: 11 } } },
      y: { beginAtZero: true, max: yMax, grid: { color: '#f1f4f9' }, ticks: { color: '#a3acb9', font: { size: 11 } } }
    }
  });

  return (
    <div className="dg-page">
      <div className="dg-page-header">
        <div>
          <h1 className="dg-page-title">Dashboard</h1>
          <p className="dg-page-subtitle">Project insights and test coverage metrics</p>
        </div>
        <button className="dg-btn dg-btn-secondary" onClick={onRefresh}><FiRefreshCw /> Refresh</button>
      </div>

      <div className="dg-stats-grid">
        <div className="dg-stat-card">
          <div className="dg-stat-icon indigo"><FiFileText size={20} /></div>
          <div className="dg-stat-info"><div className="dg-stat-value">{stats.totalTestCases}</div><div className="dg-stat-label">Total Cases</div></div>
        </div>
        <div className="dg-stat-card">
          <div className="dg-stat-icon purple"><FiFolder size={20} /></div>
          <div className="dg-stat-info"><div className="dg-stat-value">{testSuites?.length || 0}</div><div className="dg-stat-label">Test Suites</div></div>
        </div>
        <div className="dg-stat-card">
          <div className="dg-stat-icon amber"><FiPlay size={20} /></div>
          <div className="dg-stat-info"><div className="dg-stat-value">{activeRuns}</div><div className="dg-stat-label">Active Runs</div></div>
        </div>
        <div className="dg-stat-card">
          <div className="dg-stat-icon green"><FiTrendingUp size={20} /></div>
          <div className="dg-stat-info"><div className="dg-stat-value">{stats.passRate}%</div><div className="dg-stat-label">Pass Rate</div></div>
        </div>
      </div>

      <div className="dg-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        {[
          { icon: <FiCheckCircle size={18} />, label: 'Passed', value: stats.statusCounts.passed, color: 'green' },
          { icon: <FiXCircle size={18} />, label: 'Failed', value: stats.statusCounts.failed, color: 'red' },
          { icon: <FiAlertCircle size={18} />, label: 'Blocked', value: stats.statusCounts.blocked, color: 'amber' },
          { icon: <FiMinusCircle size={18} />, label: 'N/A', value: stats.statusCounts.na, color: 'gray' },
        ].map(s => (
          <div key={s.label} className="dg-stat-card" style={{ padding: 16 }}>
            <div className={`dg-stat-icon ${s.color}`}>{s.icon}</div>
            <div className="dg-stat-info"><div className="dg-stat-value" style={{ fontSize: 20 }}>{s.value}</div><div className="dg-stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="chart-card" style={{ height: 320 }}>
          <div className="chart-header">
            <h3 className="chart-title"><FiCheckCircle /> Execution Health</h3>
          </div>
          <div className="chart-body" style={{ height: 240 }}><Doughnut data={statusChartData} options={{ responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', color: '#6c7a89', font: { size: 11 } } } } }} /></div>
        </div>
        <div className="chart-card" style={{ height: 320 }}>
          <div className="chart-header">
            <h3 className="chart-title"><FiTrendingUp /> Priority Distribution</h3>
          </div>
          <div className="chart-body" style={{ height: 240 }}><Bar data={priorityChartData} options={chartOpts()} /></div>
        </div>
      </div>

      <div className="chart-card" style={{ height: 280 }}>
        <div className="chart-header">
          <h3 className="chart-title"><FiTrendingUp /> Reliability Trend</h3>
        </div>
        <div className="chart-body" style={{ height: 200 }}><Line data={trendChartData} options={{ ...chartOpts(100), plugins: { legend: { display: false } } }} /></div>
      </div>
    </div>
  );
}

export default Dashboard;
