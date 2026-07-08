import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  FiRefreshCw, FiCheckCircle, FiXCircle, FiAlertCircle, FiTrendingUp,
  FiFolder, FiPlay, FiFileText, FiMinusCircle, FiActivity, FiClock,
  FiArrowUpRight, FiArrowDownRight, FiShield, FiLayers, FiBarChart2,
  FiPieChart, FiCalendar, FiChevronRight, FiInbox,
} from 'react-icons/fi';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
);

/* ═══════════════════ theme detection ═══════════════════ */
const useTheme = () => {
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'dark'
  );

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.attributeName === 'data-theme') {
          setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return theme;
};

/* ═══════════════════ chart colors ═══════════════════ */
const STATUS_COLORS = {
  passed: '#22c55e',
  failed: '#ef4444',
  blocked: '#f59e0b',
  na: '#64748b',
  notRun: '#94a3b8',
};

const PRIORITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#6366f1',
  low: '#22c55e',
};

/* ═══════════════════ sub-components ═══════════════════ */

const AnimatedNumber = ({ value, suffix = '', duration = 900 }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = typeof value === 'number' ? value : parseInt(value) || 0;
    if (target === 0) return setDisplay(0);
    let start = 0;
    const step = Math.max(1, Math.ceil(target / (duration / 16)));
    const interval = setInterval(() => {
      start += step;
      if (start >= target) { setDisplay(target); clearInterval(interval); }
      else setDisplay(start);
    }, 16);
    return () => clearInterval(interval);
  }, [value, duration]);
  return <>{display}{suffix}</>;
};

const SparkLine = ({ data = [], color = '#818cf8', width = 80, height = 28 }) => {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data) || 1;
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`);
  const id = `spark-${color.replace(/[^\w]/g, '')}`;
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={`0,${height} ${points.join(' ')} ${width},${height}`} fill={`url(#${id})`} stroke="none" />
      <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const StatusDot = ({ color, size = 8 }) => (
  <span style={{
    width: size, height: size, borderRadius: '50%', background: color,
    flexShrink: 0, boxShadow: `0 0 6px ${color}60`,
  }} />
);

/* ═══════════════════ main component ═══════════════════ */

function Dashboard({ statistics, testSuites, testRuns, onRefresh }) {
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('');
  const theme = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await onRefresh?.(); }
    finally { setTimeout(() => setRefreshing(false), 600); }
  }, [onRefresh]);

  /* ── derived data ── */
  const stats = useMemo(() => {
    const d = {
      totalTestCases: 0, totalTestRuns: 0, passRate: 0,
      statusCounts: { passed: 0, failed: 0, blocked: 0, na: 0, notRun: 0 },
      priorityCounts: { critical: 0, high: 0, medium: 0, low: 0 },
    };
    if (!statistics) return d;
    return {
      ...d, ...statistics,
      statusCounts: { ...d.statusCounts, ...statistics.statusCounts },
      priorityCounts: { ...d.priorityCounts, ...statistics.priorityCounts },
    };
  }, [statistics]);

  const recentRuns = useMemo(
    () => testRuns ? [...testRuns].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt)).slice(0, 6) : [],
    [testRuns]
  );

  const activeRuns = useMemo(
    () => testRuns?.filter(r => r.status === 'In Progress').length || 0,
    [testRuns]
  );

  const trendData = useMemo(
    () => recentRuns.map(r => {
      const t = (r.passed || 0) + (r.failed || 0) + (r.blocked || 0);
      return t > 0 ? Math.round((r.passed / t) * 100) : 0;
    }).reverse(),
    [recentRuns]
  );

  const totalExecuted = stats.statusCounts.passed + stats.statusCounts.failed + stats.statusCounts.blocked + stats.statusCounts.na;
  const executionRate = stats.totalTestCases > 0 ? Math.round((totalExecuted / stats.totalTestCases) * 100) : 0;

  /* ── chart data ── */
  const statusChartData = {
    labels: ['Passed', 'Failed', 'Blocked', 'N/A', 'Not Run'],
    datasets: [{
      data: [
        stats.statusCounts.passed, stats.statusCounts.failed,
        stats.statusCounts.blocked, stats.statusCounts.na, stats.statusCounts.notRun,
      ],
      backgroundColor: [
        STATUS_COLORS.passed, STATUS_COLORS.failed, STATUS_COLORS.blocked,
        STATUS_COLORS.na, isDark ? 'rgba(148,163,184,0.25)' : 'rgba(148,163,184,0.35)',
      ],
      borderWidth: 0, hoverOffset: 6, spacing: 2,
    }],
  };

  const priorityChartData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [{
      label: 'Test Cases',
      data: [
        stats.priorityCounts.critical, stats.priorityCounts.high,
        stats.priorityCounts.medium, stats.priorityCounts.low,
      ],
      backgroundColor: [
        `${PRIORITY_COLORS.critical}30`, `${PRIORITY_COLORS.high}30`,
        `${PRIORITY_COLORS.medium}30`, `${PRIORITY_COLORS.low}30`,
      ],
      borderColor: [
        PRIORITY_COLORS.critical, PRIORITY_COLORS.high,
        PRIORITY_COLORS.medium, PRIORITY_COLORS.low,
      ],
      borderWidth: 1.5, borderRadius: 8, borderSkipped: false, barPercentage: 0.55,
    }],
  };

  const trendChartData = {
    labels: recentRuns.map((_, i) => `Run ${recentRuns.length - i}`).reverse(),
    datasets: [{
      label: 'Pass Rate',
      data: trendData,
      borderColor: '#818cf8',
      backgroundColor: 'rgba(129,140,248,0.10)',
      fill: true, tension: 0.4,
      pointRadius: 4, pointHoverRadius: 6,
      pointBackgroundColor: '#818cf8',
      pointBorderColor: isDark ? '#0f172a' : '#ffffff',
      pointBorderWidth: 2, borderWidth: 2,
    }],
  };

  /* ── chart options (theme-aware) ── */
  const chartOptions = useCallback((yMax) => ({
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.98)',
        titleColor: isDark ? '#f1f5f9' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#475569',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        borderWidth: 1, padding: 10, cornerRadius: 8,
        titleFont: { size: 12, weight: '600' },
        bodyFont: { size: 12 },
        displayColors: true, boxPadding: 4,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: isDark ? 'rgba(148,163,184,0.5)' : '#94a3b8', font: { size: 11 } },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        ...(yMax ? { max: yMax } : {}),
        grid: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
        ticks: { color: isDark ? 'rgba(148,163,184,0.5)' : '#94a3b8', font: { size: 11 } },
        border: { display: false },
      },
    },
  }), [isDark]);

  const doughnutOptions = useMemo(() => ({
    responsive: true, maintainAspectRatio: false, cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: chartOptions().plugins.tooltip,
    },
  }), [chartOptions]);

  /* ═════════════════ render ═════════════════ */
  return (
    <div className="dash-page">
      {/* ══════ HEADER ══════ */}
      <div className="dash-header">
        <div className="dash-header-left">
          <div className="dash-header-icon">
            <FiActivity size={19} />
          </div>
          <div>
            <h1 className="dash-title">Dashboard</h1>
            <p className="dash-subtitle">{greeting} — here's your project overview</p>
          </div>
        </div>

        <div className="dash-header-actions">
          <div className="dash-date-pill">
            <FiCalendar size={13} />
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <button
            className={`dash-refresh-btn ${refreshing ? 'dash-refresh-loading' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <FiRefreshCw size={14} className={refreshing ? 'dash-spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ══════ BODY ══════ */}
      <div className="dash-body">
        {/* Primary stat cards */}
        <div className="dash-stats-grid">
          {[
            { icon: FiFileText, label: 'Total Test Cases', value: stats.totalTestCases, color: '#818cf8', spark: trendData },
            { icon: FiFolder, label: 'Test Suites', value: testSuites?.length || 0, color: '#a78bfa', spark: null },
            { icon: FiPlay, label: 'Active Runs', value: activeRuns, color: '#f59e0b', spark: null },
            {
              icon: FiTrendingUp, label: 'Pass Rate', value: stats.passRate, suffix: '%',
              color: stats.passRate >= 80 ? '#22c55e' : stats.passRate >= 50 ? '#f59e0b' : '#ef4444',
              spark: trendData,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="dash-stat-card" style={{ '--card-accent': item.color }}>
                <div className="dash-stat-accent" style={{ background: `linear-gradient(90deg, ${item.color}, ${item.color}00)` }} />
                <div className="dash-stat-icon" style={{ background: `${item.color}15`, borderColor: `${item.color}25` }}>
                  <Icon size={18} style={{ color: item.color }} />
                </div>
                <div className="dash-stat-value">
                  <AnimatedNumber value={item.value} suffix={item.suffix || ''} />
                </div>
                <div className="dash-stat-label">{item.label}</div>
                {item.spark && item.spark.length >= 2 && (
                  <div className="dash-stat-spark">
                    <SparkLine data={item.spark} color={item.color} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Status breakdown */}
        <div className="dash-status-grid">
          {[
            { icon: FiCheckCircle, label: 'Passed', value: stats.statusCounts.passed, color: STATUS_COLORS.passed },
            { icon: FiXCircle, label: 'Failed', value: stats.statusCounts.failed, color: STATUS_COLORS.failed },
            { icon: FiAlertCircle, label: 'Blocked', value: stats.statusCounts.blocked, color: STATUS_COLORS.blocked },
            { icon: FiMinusCircle, label: 'N/A', value: stats.statusCounts.na, color: STATUS_COLORS.na },
            { icon: FiClock, label: 'Not Run', value: stats.statusCounts.notRun, color: STATUS_COLORS.notRun },
          ].map((item) => {
            const Icon = item.icon;
            const total = totalExecuted + stats.statusCounts.notRun;
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.label} className="dash-status-card" style={{ '--status-color': item.color }}>
                <div className="dash-status-icon" style={{ background: `${item.color}15`, color: item.color }}>
                  <Icon size={16} />
                </div>
                <div className="dash-status-content">
                  <div className="dash-status-top">
                    <span className="dash-status-value">{item.value}</span>
                    <span className="dash-status-pct" style={{ color: item.color }}>{pct}%</span>
                  </div>
                  <div className="dash-status-label">{item.label}</div>
                  <div className="dash-progress">
                    <div className="dash-progress-fill" style={{ width: `${pct}%`, background: item.color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Execution Coverage */}
        <div className="dash-coverage-card">
          <div className="dash-coverage-icon">
            <FiShield size={17} />
          </div>
          <div className="dash-coverage-content">
            <div className="dash-coverage-header">
              <span className="dash-coverage-title">Execution Coverage</span>
              <span className="dash-coverage-pct">{executionRate}%</span>
            </div>
            <div className="dash-coverage-bar">
              {[
                { value: stats.statusCounts.passed, color: STATUS_COLORS.passed },
                { value: stats.statusCounts.failed, color: STATUS_COLORS.failed },
                { value: stats.statusCounts.blocked, color: STATUS_COLORS.blocked },
                { value: stats.statusCounts.na, color: STATUS_COLORS.na },
              ].map((seg, i) => {
                const total = stats.totalTestCases || 1;
                const w = (seg.value / total) * 100;
                return <div key={i} className="dash-coverage-seg" style={{ width: `${w}%`, background: seg.color }} />;
              })}
            </div>
            <div className="dash-coverage-legend">
              {[
                { label: 'Passed', color: STATUS_COLORS.passed },
                { label: 'Failed', color: STATUS_COLORS.failed },
                { label: 'Blocked', color: STATUS_COLORS.blocked },
                { label: 'Remaining', color: STATUS_COLORS.notRun },
              ].map(l => (
                <div key={l.label} className="dash-legend-item">
                  <span className="dash-legend-dot" style={{ background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts row 1 */}
        <div className="dash-charts-grid">
          {/* Doughnut */}
          <div className="dash-chart-card">
            <div className="dash-chart-header">
              <h3 className="dash-chart-title">
                <FiPieChart size={15} /> Execution Health
              </h3>
              <span className="dash-chip">All Time</span>
            </div>
            <div className="dash-doughnut-body">
              <div className="dash-doughnut-wrap">
                <Doughnut data={statusChartData} options={doughnutOptions} />
                <div className="dash-doughnut-center">
                  <div className="dash-doughnut-value">{stats.passRate}%</div>
                  <div className="dash-doughnut-caption">pass rate</div>
                </div>
              </div>
              <div className="dash-legend-list">
                {[
                  { label: 'Passed', value: stats.statusCounts.passed, color: STATUS_COLORS.passed },
                  { label: 'Failed', value: stats.statusCounts.failed, color: STATUS_COLORS.failed },
                  { label: 'Blocked', value: stats.statusCounts.blocked, color: STATUS_COLORS.blocked },
                  { label: 'N/A', value: stats.statusCounts.na, color: STATUS_COLORS.na },
                  { label: 'Not Run', value: stats.statusCounts.notRun, color: STATUS_COLORS.notRun },
                ].map(item => {
                  const total = totalExecuted + stats.statusCounts.notRun;
                  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                  return (
                    <div key={item.label} className="dash-legend-row">
                      <StatusDot color={item.color} />
                      <span className="dash-legend-label">{item.label}</span>
                      <span className="dash-legend-value">{item.value}</span>
                      <span className="dash-legend-pct">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bar */}
          <div className="dash-chart-card">
            <div className="dash-chart-header">
              <h3 className="dash-chart-title">
                <FiBarChart2 size={15} /> Priority Distribution
              </h3>
              <span className="dash-chip">{stats.totalTestCases} total</span>
            </div>
            <div className="dash-chart-body" style={{ height: 200 }}>
              <Bar data={priorityChartData} options={chartOptions()} />
            </div>
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="dash-charts-grid">
          {/* Trend line */}
          <div className="dash-chart-card">
            <div className="dash-chart-header">
              <h3 className="dash-chart-title">
                <FiTrendingUp size={15} /> Reliability Trend
              </h3>
              {trendData.length >= 2 && (() => {
                const delta = trendData[trendData.length - 1] - trendData[trendData.length - 2];
                const up = delta >= 0;
                return (
                  <div className="dash-trend-badge" style={{ color: up ? '#22c55e' : '#ef4444' }}>
                    {up ? <FiArrowUpRight size={14} /> : <FiArrowDownRight size={14} />}
                    {Math.abs(delta)}%
                  </div>
                );
              })()}
            </div>
            <div className="dash-chart-body" style={{ height: 200 }}>
              <Line data={trendChartData} options={chartOptions(100)} />
            </div>
          </div>

          {/* Recent runs */}
          <div className="dash-chart-card">
            <div className="dash-chart-header">
              <h3 className="dash-chart-title">
                <FiPlay size={15} /> Recent Runs
              </h3>
              <span className="dash-chip dash-chip-accent">{testRuns?.length || 0} total</span>
            </div>
            <div className="dash-runs-list">
              {recentRuns.length > 0 ? (
                recentRuns.slice(0, 5).map((run, i) => {
                  const total = (run.passed || 0) + (run.failed || 0) + (run.blocked || 0);
                  const pct = total > 0 ? Math.round((run.passed / total) * 100) : 0;
                  const isInProgress = run.status === 'In Progress';
                  const statusColor = isInProgress ? '#f59e0b' : pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
                  return (
                    <div key={run._id || run.id || i} className="dash-run-row">
                      <div className="dash-run-icon" style={{ background: `${statusColor}12`, borderColor: `${statusColor}25`, color: statusColor }}>
                        {isInProgress ? <FiPlay size={13} /> : <FiCheckCircle size={13} />}
                      </div>
                      <div className="dash-run-info">
                        <div className="dash-run-name">{run.name || `Run #${recentRuns.length - i}`}</div>
                        <div className="dash-run-meta">
                          <FiClock size={10} />
                          {run.startedAt ? new Date(run.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                          <span className="dash-run-dot">·</span>
                          {total} cases
                        </div>
                      </div>
                      <div className="dash-run-status">
                        {isInProgress ? (
                          <span className="dash-run-pill" style={{ background: `${statusColor}15`, color: statusColor }}>Running</span>
                        ) : (
                          <span style={{ color: statusColor, fontWeight: 700, fontSize: 14 }}>{pct}%</span>
                        )}
                      </div>
                      <FiChevronRight size={14} className="dash-run-chevron" />
                    </div>
                  );
                })
              ) : (
                <div className="dash-empty">
                  <FiInbox size={26} />
                  <div>No test runs yet</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Suites overview */}
        {testSuites && testSuites.length > 0 && (
          <div className="dash-chart-card">
            <div className="dash-chart-header">
              <h3 className="dash-chart-title">
                <FiLayers size={15} /> Test Suites Overview
              </h3>
              <span className="dash-chip dash-chip-accent">{testSuites.length} suites</span>
            </div>
            <div className="dash-suites-list">
              {testSuites.slice(0, 6).map((suite, i) => {
                const suiteId = suite._id || suite.id;
                const count = suite.testCaseCount || 0;
                const maxCount = Math.max(...testSuites.map(s => s.testCaseCount || 0), 1);
                const barPct = (count / maxCount) * 100;
                return (
                  <div key={suiteId || i} className="dash-suite-row">
                    <div className="dash-suite-icon">
                      <FiFolder size={14} />
                    </div>
                    <div className="dash-suite-info">
                      <div className="dash-suite-name">{suite.name}</div>
                      <div className="dash-progress">
                        <div className="dash-suite-fill" style={{ width: `${barPct}%` }} />
                      </div>
                    </div>
                    <span className="dash-suite-count">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ═══════ THEME-AWARE STYLES ═══════ */}
      <style>{`
        /* ── Default (dark) tokens ── */
        .dash-page {
          --d-bg: transparent;
          --d-card: rgba(255,255,255,0.02);
          --d-card-hover: rgba(255,255,255,0.04);
          --d-card-elevated: rgba(255,255,255,0.03);
          --d-border: rgba(255,255,255,0.06);
          --d-border-hover: rgba(255,255,255,0.1);
          --d-track: rgba(255,255,255,0.05);
          --d-text: #f1f5f9;
          --d-text-secondary: rgba(203,213,225,0.85);
          --d-text-muted: rgba(148,163,184,0.5);
          --d-accent: #818cf8;
          --d-accent-strong: #6366f1;
          --d-accent-bg: rgba(99,102,241,0.12);
          --d-accent-border: rgba(99,102,241,0.2);
          --d-accent-glow: rgba(129,140,248,0.15);
          --d-hover-bg: rgba(99,102,241,0.06);
        }

        /* ── Light overrides ── */
        [data-theme="light"] .dash-page {
          --d-card: #ffffff;
          --d-card-hover: #fafbfd;
          --d-card-elevated: #ffffff;
          --d-border: #e5e7eb;
          --d-border-hover: #d1d5db;
          --d-track: #f1f5f9;
          --d-text: #0f172a;
          --d-text-secondary: #475569;
          --d-text-muted: #94a3b8;
          --d-accent: #6366f1;
          --d-accent-strong: #4f46e5;
          --d-accent-bg: rgba(99,102,241,0.08);
          --d-accent-border: rgba(99,102,241,0.18);
          --d-accent-glow: rgba(99,102,241,0.15);
          --d-hover-bg: rgba(99,102,241,0.04);
        }

        /* ── Page layout ── */
        .dash-page {
          display: flex; flex-direction: column;
          height: 100%; overflow: auto;
          background: var(--d-bg);
        }

        /* ── Header ── */
        .dash-header {
          padding: 28px 32px 24px;
          border-bottom: 1px solid var(--d-border);
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 20px; flex-wrap: wrap;
        }
        .dash-header-left {
          display: flex; align-items: center; gap: 12px;
        }
        .dash-header-icon {
          width: 40px; height: 40px; border-radius: 11px;
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2));
          border: 1px solid var(--d-accent-border);
          display: flex; align-items: center; justify-content: center;
          color: var(--d-accent);
        }
        .dash-title {
          margin: 0; font-size: 24px; font-weight: 700;
          color: var(--d-text); letter-spacing: -0.4px; line-height: 1.2;
        }
        .dash-subtitle {
          margin: 3px 0 0; font-size: 14px; color: var(--d-text-muted);
        }
        .dash-header-actions {
          display: flex; align-items: center; gap: 10px;
        }
        .dash-date-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 12px; border-radius: 8px;
          background: var(--d-card); border: 1px solid var(--d-border);
          font-size: 12px; color: var(--d-text-muted);
        }
        .dash-refresh-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 16px; border-radius: 9px;
          font-size: 13px; font-weight: 500;
          background: var(--d-card); border: 1px solid var(--d-border);
          color: var(--d-text-secondary); cursor: pointer;
          transition: all 0.2s; font-family: inherit;
        }
        .dash-refresh-btn:hover:not(:disabled) {
          background: var(--d-card-hover);
          border-color: var(--d-border-hover);
          color: var(--d-text);
        }
        .dash-refresh-loading { opacity: 0.6; cursor: not-allowed; }
        .dash-spin { animation: dashSpin 0.8s linear infinite; }
        @keyframes dashSpin { to { transform: rotate(360deg); } }

        /* ── Body ── */
        .dash-body {
          padding: 24px 32px 40px;
          display: flex; flex-direction: column; gap: 20px;
        }

        /* ── Primary stat cards ── */
        .dash-stats-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
        }
        .dash-stat-card {
          position: relative; padding: 20px; border-radius: 14px;
          background: var(--d-card); border: 1px solid var(--d-border);
          overflow: hidden; transition: all 0.2s;
        }
        .dash-stat-card:hover {
          border-color: var(--card-accent, var(--d-accent))40;
          background: var(--d-card-hover);
          transform: translateY(-1px);
          box-shadow: 0 8px 24px -10px var(--card-accent, var(--d-accent))25;
        }
        .dash-stat-accent {
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
        }
        .dash-stat-icon {
          width: 40px; height: 40px; border-radius: 10px;
          border: 1px solid transparent;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px;
        }
        .dash-stat-value {
          font-size: 28px; font-weight: 700; color: var(--d-text);
          line-height: 1.1; letter-spacing: -0.5px;
        }
        .dash-stat-label {
          font-size: 12px; color: var(--d-text-muted);
          margin-top: 4px; font-weight: 500;
        }
        .dash-stat-spark {
          position: absolute; bottom: 16px; right: 16px; opacity: 0.75;
        }

        /* ── Status breakdown ── */
        .dash-status-grid {
          display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px;
        }
        .dash-status-card {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 16px; border-radius: 10px;
          background: var(--d-card); border: 1px solid var(--d-border);
          transition: all 0.15s;
        }
        .dash-status-card:hover {
          background: var(--d-card-hover);
          border-color: var(--status-color)30;
        }
        .dash-status-icon {
          width: 34px; height: 34px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .dash-status-content { flex: 1; min-width: 0; }
        .dash-status-top {
          display: flex; align-items: baseline; justify-content: space-between; gap: 6px;
        }
        .dash-status-value {
          font-size: 18px; font-weight: 700; color: var(--d-text); line-height: 1;
        }
        .dash-status-pct {
          font-size: 11px; font-weight: 600; opacity: 0.85;
        }
        .dash-status-label {
          font-size: 11px; color: var(--d-text-muted); margin-top: 3px; font-weight: 500;
        }
        .dash-progress {
          height: 6px; border-radius: 3px; background: var(--d-track);
          overflow: hidden; margin-top: 6px;
        }
        .dash-progress-fill {
          height: 100%; border-radius: 3px; transition: width 0.6s ease;
        }

        /* ── Execution coverage ── */
        .dash-coverage-card {
          display: flex; align-items: center; gap: 16px;
          padding: 16px 20px; border-radius: 12px;
          background: var(--d-card); border: 1px solid var(--d-border);
        }
        .dash-coverage-icon {
          width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
          background: var(--d-accent-bg); border: 1px solid var(--d-accent-border);
          color: var(--d-accent);
          display: flex; align-items: center; justify-content: center;
        }
        .dash-coverage-content { flex: 1; min-width: 0; }
        .dash-coverage-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 8px;
        }
        .dash-coverage-title { font-size: 13px; font-weight: 500; color: var(--d-text); }
        .dash-coverage-pct { font-size: 13px; font-weight: 700; color: var(--d-accent); }
        .dash-coverage-bar {
          height: 10px; border-radius: 5px; background: var(--d-track);
          overflow: hidden; display: flex;
        }
        .dash-coverage-seg { transition: width 0.6s ease; }
        .dash-coverage-legend {
          display: flex; gap: 16px; margin-top: 6px; flex-wrap: wrap;
        }
        .dash-legend-item {
          display: flex; align-items: center; gap: 5px;
          font-size: 10px; color: var(--d-text-muted);
        }
        .dash-legend-dot {
          width: 6px; height: 6px; border-radius: 2px; flex-shrink: 0;
        }

        /* ── Chart cards ── */
        .dash-charts-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
        }
        .dash-chart-card {
          border-radius: 14px;
          background: var(--d-card); border: 1px solid var(--d-border);
          overflow: hidden;
        }
        .dash-chart-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 20px 0;
        }
        .dash-chart-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 600; color: var(--d-text); margin: 0;
        }
        .dash-chart-title svg { color: var(--d-accent); }
        .dash-chart-body { padding: 16px 20px 20px; }
        .dash-chip {
          font-size: 11px; color: var(--d-text-muted);
          padding: 3px 8px; border-radius: 5px;
          background: var(--d-track); border: 1px solid var(--d-border);
        }
        .dash-chip-accent {
          background: var(--d-accent-bg); color: var(--d-accent);
          border-color: transparent; font-weight: 600;
        }
        .dash-trend-badge {
          display: flex; align-items: center; gap: 4px;
          font-size: 12px; font-weight: 600;
        }

        /* ── Doughnut body ── */
        .dash-doughnut-body {
          padding: 16px 20px 20px;
          display: flex; gap: 20px; align-items: center;
        }
        .dash-doughnut-wrap {
          position: relative; width: 160px; height: 160px; flex-shrink: 0;
        }
        .dash-doughnut-center {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -55%);
          text-align: center; pointer-events: none;
        }
        .dash-doughnut-value {
          font-size: 26px; font-weight: 700; color: var(--d-text); line-height: 1;
        }
        .dash-doughnut-caption {
          font-size: 11px; color: var(--d-text-muted); margin-top: 2px;
        }
        .dash-legend-list {
          flex: 1; display: flex; flex-direction: column; gap: 2px;
        }
        .dash-legend-row {
          display: flex; align-items: center; gap: 10px; padding: 6px 0;
        }
        .dash-legend-label {
          flex: 1; font-size: 12px; color: var(--d-text-secondary);
        }
        .dash-legend-value {
          font-size: 13px; font-weight: 600; color: var(--d-text);
          min-width: 24px; text-align: right;
        }
        .dash-legend-pct {
          font-size: 11px; color: var(--d-text-muted);
          min-width: 36px; text-align: right;
        }

        /* ── Recent runs ── */
        .dash-runs-list { padding: 8px 0; }
        .dash-run-row {
          display: flex; align-items: center; gap: 14px;
          padding: 13px 20px; border-bottom: 1px solid var(--d-border);
          transition: background 0.15s; cursor: pointer;
        }
        .dash-run-row:last-child { border-bottom: none; }
        .dash-run-row:hover { background: var(--d-hover-bg); }
        .dash-run-icon {
          width: 32px; height: 32px; border-radius: 8px;
          border: 1px solid transparent;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .dash-run-info { flex: 1; min-width: 0; }
        .dash-run-name {
          font-size: 13px; font-weight: 500; color: var(--d-text);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .dash-run-meta {
          font-size: 11px; color: var(--d-text-muted); margin-top: 2px;
          display: flex; align-items: center; gap: 6px;
        }
        .dash-run-dot { opacity: 0.4; }
        .dash-run-status { text-align: right; flex-shrink: 0; }
        .dash-run-pill {
          font-size: 11px; font-weight: 600;
          padding: 3px 8px; border-radius: 5px;
        }
        .dash-run-chevron {
          color: var(--d-text-muted); opacity: 0.4; flex-shrink: 0;
        }

        /* ── Suites overview ── */
        .dash-suites-list { padding: 4px 0 8px; }
        .dash-suite-row {
          display: flex; align-items: center; gap: 14px;
          padding: 11px 20px;
          border-bottom: 1px solid var(--d-border);
          transition: background 0.15s; cursor: pointer;
        }
        .dash-suite-row:last-child { border-bottom: none; }
        .dash-suite-row:hover { background: var(--d-hover-bg); }
        .dash-suite-icon {
          width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
          background: var(--d-accent-bg); border: 1px solid var(--d-accent-border);
          color: var(--d-accent);
          display: flex; align-items: center; justify-content: center;
        }
        .dash-suite-info { flex: 1; min-width: 0; }
        .dash-suite-name {
          font-size: 13px; font-weight: 500; color: var(--d-text);
          margin-bottom: 6px; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }
        .dash-suite-fill {
          height: 100%; border-radius: 3px;
          background: linear-gradient(90deg, rgba(99,102,241,0.55), rgba(129,140,248,0.35));
          transition: width 0.6s ease;
        }
        .dash-suite-count {
          font-size: 13px; font-weight: 600;
          color: var(--d-text-secondary);
          min-width: 40px; text-align: right;
        }

        /* ── Empty state ── */
        .dash-empty {
          padding: 40px 20px; text-align: center;
          color: var(--d-text-muted); font-size: 13px;
        }
        .dash-empty svg {
          color: var(--d-text-muted); opacity: 0.3;
          margin-bottom: 10px;
        }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .dash-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .dash-status-grid { grid-template-columns: repeat(3, 1fr); }
          .dash-charts-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .dash-header { padding: 20px 16px; }
          .dash-body { padding: 16px; gap: 16px; }
          .dash-status-grid { grid-template-columns: repeat(2, 1fr); }
          .dash-doughnut-body { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
