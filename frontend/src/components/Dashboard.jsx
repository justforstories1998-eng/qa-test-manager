import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiClock,
  FiTrendingUp,
  FiFolder,
  FiPlay,
  FiFileText,
  FiActivity,
  FiBarChart2, // Added missing import
  FiSettings    // Added missing import
} from 'react-icons/fi';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function Dashboard({ statistics, testSuites, testRuns, onRefresh }) {
  // ============================================
  // COMPUTED VALUES
  // ============================================

  const stats = useMemo(() => {
    if (!statistics) {
      return {
        totalTestCases: 0,
        totalTestRuns: 0,
        passRate: 0,
        statusCounts: { passed: 0, failed: 0, blocked: 0, notRun: 0 },
        priorityCounts: { critical: 0, high: 0, medium: 0, low: 0 }
      };
    }
    return statistics;
  }, [statistics]);

  const recentRuns = useMemo(() => {
    if (!testRuns) return [];
    return [...testRuns]
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
      .slice(0, 5);
  }, [testRuns]);

  const activeRuns = useMemo(() => {
    if (!testRuns) return 0;
    return testRuns.filter(r => r.status === 'In Progress').length;
  }, [testRuns]);

  // ============================================
  // CHART CONFIGURATIONS
  // ============================================

  // Status Distribution Doughnut Chart
  const statusChartData = {
    labels: ['Passed', 'Failed', 'Blocked', 'Not Run'],
    datasets: [{
      data: [
        stats.statusCounts.passed,
        stats.statusCounts.failed,
        stats.statusCounts.blocked,
        stats.statusCounts.notRun
      ],
      backgroundColor: [
        'rgba(22, 163, 74, 0.9)',
        'rgba(220, 38, 38, 0.9)',
        'rgba(217, 119, 6, 0.9)',
        'rgba(100, 116, 139, 0.9)'
      ],
      borderColor: [
        'rgba(22, 163, 74, 1)',
        'rgba(220, 38, 38, 1)',
        'rgba(217, 119, 6, 1)',
        'rgba(100, 116, 139, 1)'
      ],
      borderWidth: 2,
      hoverOffset: 10
    }]
  };

  const statusChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, family: "'Inter', sans-serif" }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        padding: 12,
        titleFont: { size: 14, family: "'Inter', sans-serif" },
        bodyFont: { size: 13, family: "'Inter', sans-serif" },
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
            return `${context.label}: ${context.raw} (${percentage}%)`;
          }
        }
      }
    }
  };

  // Priority Distribution Bar Chart
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
      backgroundColor: [
        'rgba(220, 38, 38, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(37, 99, 235, 0.8)',
        'rgba(34, 197, 94, 0.8)'
      ],
      borderColor: [
        'rgba(220, 38, 38, 1)',
        'rgba(249, 115, 22, 1)',
        'rgba(37, 99, 235, 1)',
        'rgba(34, 197, 94, 1)'
      ],
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false
    }]
  };

  const priorityChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        padding: 12,
        titleFont: { size: 14, family: "'Inter', sans-serif" },
        bodyFont: { size: 13, family: "'Inter', sans-serif" },
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 12, family: "'Inter', sans-serif" } }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: {
          font: { size: 12, family: "'Inter', sans-serif" },
          stepSize: 1
        }
      }
    }
  };

  // Test Runs Trend Line Chart (mock data based on recent runs)
  const trendChartData = useMemo(() => {
    const labels = recentRuns.map((_, i) => `Run ${recentRuns.length - i}`).reverse();
    const passRates = recentRuns.map(run => {
      const total = run.passed + run.failed + run.blocked;
      return total > 0 ? ((run.passed / total) * 100).toFixed(1) : 0;
    }).reverse();

    return {
      labels,
      datasets: [{
        label: 'Pass Rate %',
        data: passRates,
        fill: true,
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 3,
        pointBackgroundColor: 'rgba(37, 99, 235, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.4
      }]
    };
  }, [recentRuns]);

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        padding: 12,
        titleFont: { size: 14, family: "'Inter', sans-serif" },
        bodyFont: { size: 13, family: "'Inter', sans-serif" },
        cornerRadius: 8,
        callbacks: {
          label: (context) => `Pass Rate: ${context.raw}%`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, family: "'Inter', sans-serif" } }
      },
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: {
          font: { size: 11, family: "'Inter', sans-serif" },
          callback: (value) => `${value}%`
        }
      }
    }
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return <FiCheckCircle className="status-icon completed" />;
      case 'In Progress': return <FiPlay className="status-icon in-progress" />;
      case 'Failed': return <FiXCircle className="status-icon failed" />;
      default: return <FiClock className="status-icon pending" />;
    }
  };

  const getRunPassRate = (run) => {
    const total = run.passed + run.failed + run.blocked;
    if (total === 0) return 0;
    return ((run.passed / total) * 100).toFixed(0);
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="dashboard">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <h2 className="section-title">Dashboard Overview</h2>
          <p className="section-description">
            Monitor your QA testing progress and key metrics
          </p>
        </div>
        <button className="btn btn-secondary" onClick={onRefresh}>
          <FiRefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <FiFileText size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalTestCases}</span>
            <span className="stat-label">Total Test Cases</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <FiFolder size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{testSuites?.length || 0}</span>
            <span className="stat-label">Test Suites</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <FiPlay size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{activeRuns}</span>
            <span className="stat-label">Active Runs</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <FiTrendingUp size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.passRate}%</span>
            <span className="stat-label">Overall Pass Rate</span>
          </div>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="status-summary">
        <div className="status-card passed">
          <FiCheckCircle size={20} />
          <span className="status-count">{stats.statusCounts.passed}</span>
          <span className="status-label">Passed</span>
        </div>
        <div className="status-card failed">
          <FiXCircle size={20} />
          <span className="status-count">{stats.statusCounts.failed}</span>
          <span className="status-label">Failed</span>
        </div>
        <div className="status-card blocked">
          <FiAlertCircle size={20} />
          <span className="status-count">{stats.statusCounts.blocked}</span>
          <span className="status-label">Blocked</span>
        </div>
        <div className="status-card not-run">
          <FiClock size={20} />
          <span className="status-count">{stats.statusCounts.notRun}</span>
          <span className="status-label">Not Run</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Status Distribution Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <FiActivity size={18} />
              Execution Status
            </h3>
          </div>
          <div className="chart-body doughnut-chart">
            {stats.totalTestCases > 0 ? (
              <Doughnut data={statusChartData} options={statusChartOptions} />
            ) : (
              <div className="chart-empty">
                <FiActivity size={48} />
                <p>No execution data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Priority Distribution Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <FiBarChart2 size={18} />
              Priority Distribution
            </h3>
          </div>
          <div className="chart-body bar-chart">
            {stats.totalTestCases > 0 ? (
              <Bar data={priorityChartData} options={priorityChartOptions} />
            ) : (
              <div className="chart-empty">
                <FiBarChart2 size={48} />
                <p>No test cases available</p>
              </div>
            )}
          </div>
        </div>

        {/* Pass Rate Trend Chart */}
        <div className="chart-card wide">
          <div className="chart-header">
            <h3 className="chart-title">
              <FiTrendingUp size={18} />
              Pass Rate Trend
            </h3>
          </div>
          <div className="chart-body line-chart">
            {recentRuns.length > 0 ? (
              <Line data={trendChartData} options={trendChartOptions} />
            ) : (
              <div className="chart-empty">
                <FiTrendingUp size={48} />
                <p>No test runs available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Test Runs */}
      <div className="recent-runs-section">
        <div className="section-header">
          <h3 className="section-title">
            <FiPlay size={18} />
            Recent Test Runs
          </h3>
        </div>

        {recentRuns.length > 0 ? (
          <div className="runs-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Run Name</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Pass Rate</th>
                  <th>Started</th>
                  <th>Environment</th>
                </tr>
              </thead>
              <tbody>
                {recentRuns.map((run) => (
                  <tr key={run.id}>
                    <td className="run-name">
                      {getStatusIcon(run.status)}
                      <span>{run.name}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${run.status.toLowerCase().replace(' ', '-')}`}>
                        {run.status}
                      </span>
                    </td>
                    <td>
                      <div className="progress-cell">
                        <div className="progress-bar-mini">
                          <div 
                            className="progress-fill"
                            style={{ 
                              width: `${run.totalTests > 0 
                                ? ((run.passed + run.failed + run.blocked) / run.totalTests) * 100 
                                : 0}%` 
                            }}
                          ></div>
                        </div>
                        <span className="progress-text">
                          {run.passed + run.failed + run.blocked}/{run.totalTests}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`pass-rate ${getRunPassRate(run) >= 80 ? 'good' : getRunPassRate(run) >= 50 ? 'warning' : 'bad'}`}>
                        {getRunPassRate(run)}%
                      </span>
                    </td>
                    <td className="date-cell">{formatDate(run.startedAt)}</td>
                    <td>
                      <span className="environment-badge">
                        {run.environment || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <FiPlay size={48} />
            <h4>No Test Runs Yet</h4>
            <p>Create your first test run from the Execution page</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3 className="section-title">Quick Actions</h3>
        <div className="actions-grid">
          <a href="/test-cases" className="action-card">
            <FiFileText size={24} />
            <span>Import Test Cases</span>
          </a>
          <a href="/execution" className="action-card">
            <FiPlay size={24} />
            <span>Start New Run</span>
          </a>
          <a href="/reports" className="action-card">
            <FiBarChart2 size={24} />
            <span>Generate Report</span>
          </a>
          <a href="/settings" className="action-card">
            <FiSettings size={24} />
            <span>Configure Settings</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;