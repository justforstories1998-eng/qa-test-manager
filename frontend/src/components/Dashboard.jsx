import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import './shared/chartSetup';
import {
  FiRefreshCw, FiCheckCircle, FiXCircle, FiAlertCircle, FiTrendingUp,
  FiFolder, FiPlay, FiFileText, FiMinusCircle, FiActivity, FiClock,
  FiArrowUpRight, FiArrowDownRight, FiShield, FiLayers, FiBarChart2,
  FiPieChart, FiCalendar, FiChevronRight, FiInbox,
} from 'react-icons/fi';
import { LiquidButton } from './ui/liquid-glass-button';

const useTheme = () => {
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'dark');
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

const STATUS_COLORS = { passed: '#10b981', failed: '#ef4444', blocked: '#f59e0b', na: '#64748b', notRun: '#94a3b8' };
const PRIORITY_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#6366f1', low: '#10b981' };

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

function Dashboard({ statistics, testSuites, testRuns, workItemStats, sprints, onRefresh }) {
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

  const stats = useMemo(() => {
    const d = { totalTestCases: 0, totalTestRuns: 0, passRate: 0, statusCounts: { passed: 0, failed: 0, blocked: 0, na: 0, notRun: 0 }, priorityCounts: { critical: 0, high: 0, medium: 0, low: 0 } };
    if (!statistics) return d;
    return { ...d, ...statistics, statusCounts: { ...d.statusCounts, ...statistics.statusCounts }, priorityCounts: { ...d.priorityCounts, ...statistics.priorityCounts } };
  }, [statistics]);

  const recentRuns = useMemo(() => testRuns ? [...testRuns].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt)).slice(0, 6) : [], [testRuns]);
  const activeRuns = useMemo(() => testRuns?.filter(r => r.status === 'In Progress').length || 0, [testRuns]);
  const trendData = useMemo(() => recentRuns.map(r => { const t = (r.passed || 0) + (r.failed || 0) + (r.blocked || 0); return t > 0 ? Math.round((r.passed / t) * 100) : 0; }).reverse(), [recentRuns]);
  const totalExecuted = stats.statusCounts.passed + stats.statusCounts.failed + stats.statusCounts.blocked + stats.statusCounts.na;
  const executionRate = stats.totalTestCases > 0 ? Math.round((totalExecuted / stats.totalTestCases) * 100) : 0;

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
        titleFont: { size: 12, weight: '600' }, bodyFont: { size: 12 },
        displayColors: true, boxPadding: 4,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: isDark ? 'rgba(148,163,184,0.5)' : '#94a3b8', font: { size: 11 } }, border: { display: false } },
      y: { beginAtZero: true, ...(yMax ? { max: yMax } : {}), grid: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }, ticks: { color: isDark ? 'rgba(148,163,184,0.5)' : '#94a3b8', font: { size: 11 } }, border: { display: false } },
    },
  }), [isDark]);

  const wiStatusData = useMemo(() => {
    if (!workItemStats?.statusCounts) return null;
    const labels = Object.keys(workItemStats.statusCounts);
    const values = Object.values(workItemStats.statusCounts);
    const colors = labels.map(s => { if (s === 'Done' || s === 'Closed') return '#10b981'; if (s === 'In Progress') return '#f59e0b'; if (s === 'Code Review') return '#8b5cf6'; if (s === 'Backlog') return '#64748b'; return '#818cf8'; });
    return { labels, datasets: [{ label: 'Work Items', data: values, backgroundColor: colors.map(c => `${c}30`), borderColor: colors, borderWidth: 1.5, borderRadius: 6, barPercentage: 0.6 }] };
  }, [workItemStats]);

  const wiTypeData = useMemo(() => {
    if (!workItemStats?.typeCounts) return null;
    const typeColors = { Epic: '#ef4444', Feature: '#8b5cf6', 'User Story': '#818cf8', Task: '#f59e0b', Bug: '#10b981', 'Test Case': '#06b6d4', Issue: '#f97316' };
    const labels = Object.keys(workItemStats.typeCounts);
    const values = Object.values(workItemStats.typeCounts);
    const colors = labels.map(l => typeColors[l] || '#64748b');
    return { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0, hoverOffset: 6, spacing: 2 }] };
  }, [workItemStats]);

  const wiTypeDoughnutOptions = useMemo(() => ({ responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { display: false }, tooltip: chartOptions().plugins.tooltip } }), [chartOptions]);

  const assigneeChartData = useMemo(() => {
    if (!workItemStats?.assigneeCounts) return null;
    const sorted = Object.entries(workItemStats.assigneeCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return { labels: sorted.map(([name]) => name), datasets: [{ label: 'Work Items', data: sorted.map(([, count]) => count), backgroundColor: 'rgba(129,140,248,0.3)', borderColor: '#818cf8', borderWidth: 1.5, borderRadius: 6, barPercentage: 0.6 }] };
  }, [workItemStats]);

  const statusChartData = {
    labels: ['Passed', 'Failed', 'Blocked', 'N/A', 'Not Run'],
    datasets: [{ data: [stats.statusCounts.passed, stats.statusCounts.failed, stats.statusCounts.blocked, stats.statusCounts.na, stats.statusCounts.notRun], backgroundColor: [STATUS_COLORS.passed, STATUS_COLORS.failed, STATUS_COLORS.blocked, STATUS_COLORS.na, isDark ? 'rgba(148,163,184,0.25)' : 'rgba(148,163,184,0.35)'], borderWidth: 0, hoverOffset: 6, spacing: 2 }],
  };

  const priorityChartData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [{ label: 'Test Cases', data: [stats.priorityCounts.critical, stats.priorityCounts.high, stats.priorityCounts.medium, stats.priorityCounts.low], backgroundColor: [`${PRIORITY_COLORS.critical}30`, `${PRIORITY_COLORS.high}30`, `${PRIORITY_COLORS.medium}30`, `${PRIORITY_COLORS.low}30`], borderColor: [PRIORITY_COLORS.critical, PRIORITY_COLORS.high, PRIORITY_COLORS.medium, PRIORITY_COLORS.low], borderWidth: 1.5, borderRadius: 8, borderSkipped: false, barPercentage: 0.55 }],
  };

  const trendChartData = {
    labels: recentRuns.map((_, i) => `Run ${recentRuns.length - i}`).reverse(),
    datasets: [{ label: 'Pass Rate', data: trendData, borderColor: '#818cf8', backgroundColor: 'rgba(129,140,248,0.10)', fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6, pointBackgroundColor: '#818cf8', pointBorderColor: isDark ? '#0f172a' : '#ffffff', pointBorderWidth: 2, borderWidth: 2 }],
  };

  const doughnutOptions = useMemo(() => ({ responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { display: false }, tooltip: chartOptions().plugins.tooltip } }), [chartOptions]);

  return (
    <div className="dash-page">
      <div className="dash-header">
        <div className="dash-header-left">
          <div className="dash-header-icon"><FiActivity size={19} /></div>
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="dash-subtitle">{greeting} — here's your project overview</p>
          </div>
        </div>
        <div className="dash-header-actions">
          <div className="dash-date-pill">
            <FiCalendar size={13} />
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <LiquidButton variant="secondary" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <FiRefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </LiquidButton>
        </div>
      </div>

      <div className="dash-body">
        <div className="dashboard-stats">
          {[
            { icon: FiFileText, label: 'Total Test Cases', value: stats.totalTestCases, color: '#818cf8', spark: trendData },
            { icon: FiFolder, label: 'Test Suites', value: testSuites?.length || 0, color: '#a78bfa', spark: null },
            { icon: FiPlay, label: 'Active Runs', value: activeRuns, color: '#f59e0b', spark: null },
            { icon: FiTrendingUp, label: 'Pass Rate', value: stats.passRate, suffix: '%', color: stats.passRate >= 80 ? '#10b981' : stats.passRate >= 50 ? '#f59e0b' : '#ef4444', spark: trendData },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="stat-card" style={{ '--stat-accent': item.color }}>
                <div className="stat-card-header">
                  <div className="stat-card-icon" style={{ background: `${item.color}15`, color: item.color }}><Icon size={18} /></div>
                  {item.spark && item.spark.length >= 2 && <SparkLine data={item.spark} color={item.color} />}
                </div>
                <div className="stat-card-value"><AnimatedNumber value={item.value} suffix={item.suffix || ''} /></div>
                <div className="stat-card-label">{item.label}</div>
              </div>
            );
          })}
        </div>

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
                <div className="dash-status-icon" style={{ background: `${item.color}15`, color: item.color }}><Icon size={16} /></div>
                <div className="dash-status-content">
                  <div className="dash-status-top">
                    <span className="dash-status-value">{item.value}</span>
                    <span className="stat-card-trend" style={{ color: item.color }}>{pct}%</span>
                  </div>
                  <div className="dash-status-label">{item.label}</div>
                  <div className="execution-progress"><div className="execution-progress-bar" style={{ width: `${pct}%`, background: item.color }} /></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="dash-coverage-card">
          <div className="stat-card-icon" style={{ background: 'var(--color-primary-faint)', color: 'var(--color-primary)' }}><FiShield size={17} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>Execution Coverage</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary)' }}>{executionRate}%</span>
            </div>
            <div className="execution-progress" style={{ height: 10, borderRadius: 5 }}>
              {[{ value: stats.statusCounts.passed, color: STATUS_COLORS.passed }, { value: stats.statusCounts.failed, color: STATUS_COLORS.failed }, { value: stats.statusCounts.blocked, color: STATUS_COLORS.blocked }, { value: stats.statusCounts.na, color: STATUS_COLORS.na }].map((seg, i) => {
                const total = stats.totalTestCases || 1;
                const w = (seg.value / total) * 100;
                return <div key={i} style={{ width: `${w}%`, height: '100%', background: seg.color, transition: 'width 0.6s ease' }} />;
              })}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
              {[{ label: 'Passed', color: STATUS_COLORS.passed }, { label: 'Failed', color: STATUS_COLORS.failed }, { label: 'Blocked', color: STATUS_COLORS.blocked }, { label: 'Remaining', color: STATUS_COLORS.notRun }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: 2, background: l.color, flexShrink: 0 }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-charts">
          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="chart-card-title"><FiPieChart size={15} style={{ color: 'var(--color-primary)' }} /> Execution Health</h3>
              <span className="badge badge-neutral">All Time</span>
            </div>
            <div className="dash-doughnut-body">
              <div className="dash-doughnut-wrap">
                <Doughnut data={statusChartData} options={doughnutOptions} />
                <div className="dash-doughnut-center">
                  <div className="dash-doughnut-value">{stats.passRate}%</div>
                  <div className="dash-doughnut-caption">pass rate</div>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[{ label: 'Passed', value: stats.statusCounts.passed, color: STATUS_COLORS.passed }, { label: 'Failed', value: stats.statusCounts.failed, color: STATUS_COLORS.failed }, { label: 'Blocked', value: stats.statusCounts.blocked, color: STATUS_COLORS.blocked }, { label: 'N/A', value: stats.statusCounts.na, color: STATUS_COLORS.na }, { label: 'Not Run', value: stats.statusCounts.notRun, color: STATUS_COLORS.notRun }].map(item => {
                  const total = totalExecuted + stats.statusCounts.notRun;
                  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                  return (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', minWidth: 24, textAlign: 'right' }}>{item.value}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 36, textAlign: 'right' }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="chart-card-title"><FiBarChart2 size={15} style={{ color: 'var(--color-primary)' }} /> Priority Distribution</h3>
              <span className="badge badge-neutral">{stats.totalTestCases} total</span>
            </div>
            <div className="chart-container" style={{ height: 200 }}><Bar data={priorityChartData} options={chartOptions()} /></div>
          </div>
        </div>

        <div className="dashboard-charts">
          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="chart-card-title"><FiTrendingUp size={15} style={{ color: 'var(--color-primary)' }} /> Reliability Trend</h3>
              {trendData.length >= 2 && (() => { const delta = trendData[trendData.length - 1] - trendData[trendData.length - 2]; const up = delta >= 0; return (<span className={`stat-card-trend ${up ? 'up' : 'down'}`}>{up ? <FiArrowUpRight size={14} /> : <FiArrowDownRight size={14} />}{Math.abs(delta)}%</span>); })()}
            </div>
            <div className="chart-container" style={{ height: 200 }}><Line data={trendChartData} options={chartOptions(100)} /></div>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="chart-card-title"><FiPlay size={15} style={{ color: 'var(--color-primary)' }} /> Recent Runs</h3>
              <span className="badge badge-primary">{testRuns?.length || 0} total</span>
            </div>
            <div style={{ padding: '8px 0' }}>
              {recentRuns.length > 0 ? recentRuns.slice(0, 5).map((run, i) => {
                const total = (run.passed || 0) + (run.failed || 0) + (run.blocked || 0);
                const pct = total > 0 ? Math.round((run.passed / total) * 100) : 0;
                const isInProgress = run.status === 'In Progress';
                const statusColor = isInProgress ? '#f59e0b' : pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
                return (
                  <div key={run._id || run.id || i} className="activity-item" style={{ padding: '12px 20px', cursor: 'pointer' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 'var(--radius)', background: `${statusColor}15`, color: statusColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isInProgress ? <FiPlay size={13} /> : <FiCheckCircle size={13} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{run.name || `Run #${recentRuns.length - i}`}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiClock size={10} />
                        {run.startedAt ? new Date(run.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                        <span style={{ opacity: 0.4 }}>·</span>
                        {total} cases
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {isInProgress ? <span className="badge badge-warning">Running</span> : <span style={{ color: statusColor, fontWeight: 700, fontSize: '0.875rem' }}>{pct}%</span>}
                    </div>
                    <FiChevronRight size={14} style={{ color: 'var(--text-muted)', opacity: 0.4, flexShrink: 0 }} />
                  </div>
                );
              }) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                  <FiInbox size={26} style={{ opacity: 0.3, marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
                  No test runs yet
                </div>
              )}
            </div>
          </div>
        </div>

        {testSuites && testSuites.length > 0 && (
          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="chart-card-title"><FiLayers size={15} style={{ color: 'var(--color-primary)' }} /> Test Suites Overview</h3>
              <span className="badge badge-primary">{testSuites.length} suites</span>
            </div>
            <div style={{ padding: '4px 0 8px' }}>
              {testSuites.slice(0, 6).map((suite, i) => {
                const count = suite.testCaseCount || 0;
                const maxCount = Math.max(...testSuites.map(s => s.testCaseCount || 0), 1);
                const barPct = (count / maxCount) * 100;
                return (
                  <div key={suite._id || suite.id || i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 20px', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', transition: 'background 0.15s' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 'var(--radius)', background: 'var(--color-primary-faint)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FiFolder size={14} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{suite.name}</div>
                      <div className="execution-progress"><div className="execution-progress-bar" style={{ width: `${barPct}%`, background: 'var(--color-primary)' }} /></div>
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', minWidth: 40, textAlign: 'right' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {workItemStats && workItemStats.total > 0 && (
          <>
            <div className="dashboard-stats">
              {[
                { icon: FiLayers, label: 'Total Work Items', value: workItemStats.total, color: '#818cf8' },
                { icon: FiCheckCircle, label: 'Story Points Completed', value: workItemStats.completedStoryPoints, color: '#10b981' },
                { icon: FiClock, label: 'Remaining Points', value: workItemStats.totalStoryPoints - workItemStats.completedStoryPoints, color: '#f59e0b' },
                { icon: FiActivity, label: 'Completion Rate', value: workItemStats.totalStoryPoints > 0 ? Math.round((workItemStats.completedStoryPoints / workItemStats.totalStoryPoints) * 100) : 0, suffix: '%', color: '#a78bfa' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="stat-card" style={{ '--stat-accent': item.color }}>
                    <div className="stat-card-header">
                      <div className="stat-card-icon" style={{ background: `${item.color}15`, color: item.color }}><Icon size={18} /></div>
                    </div>
                    <div className="stat-card-value"><AnimatedNumber value={item.value} suffix={item.suffix || ''} /></div>
                    <div className="stat-card-label">{item.label}</div>
                  </div>
                );
              })}
            </div>

            <div className="dashboard-charts">
              {wiStatusData && (
                <div className="chart-card">
                  <div className="chart-card-header">
                    <h3 className="chart-card-title"><FiBarChart2 size={15} style={{ color: 'var(--color-primary)' }} /> Work Item Status</h3>
                    <span className="badge badge-neutral">{workItemStats.total} items</span>
                  </div>
                  <div className="chart-container" style={{ height: 200 }}><Bar data={wiStatusData} options={chartOptions()} /></div>
                </div>
              )}
              {wiTypeData && (
                <div className="chart-card">
                  <div className="chart-card-header">
                    <h3 className="chart-card-title"><FiPieChart size={15} style={{ color: 'var(--color-primary)' }} /> Work Item Types</h3>
                  </div>
                  <div className="dash-doughnut-body">
                    <div className="dash-doughnut-wrap">
                      <Doughnut data={wiTypeData} options={wiTypeDoughnutOptions} />
                      <div className="dash-doughnut-center">
                        <div className="dash-doughnut-value">{workItemStats.total}</div>
                        <div className="dash-doughnut-caption">total</div>
                      </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {wiTypeData.labels.map((label, i) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: wiTypeData.datasets[0].backgroundColor[i], flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{label}</span>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', minWidth: 24, textAlign: 'right' }}>{wiTypeData.datasets[0].data[i]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {assigneeChartData && assigneeChartData.labels.length > 0 && (
              <div className="chart-card">
                <div className="chart-card-header">
                  <h3 className="chart-card-title"><FiTrendingUp size={15} style={{ color: 'var(--color-primary)' }} /> Work Items by Assignee</h3>
                </div>
                <div className="chart-container" style={{ height: 180 }}><Bar data={assigneeChartData} options={chartOptions()} /></div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .dash-page { display: flex; flex-direction: column; }
        .dash-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; flex-wrap: wrap; margin-bottom: var(--space-6); }
        .dash-header-left { display: flex; align-items: center; gap: 12px; }
        .dash-header-icon { width: 40px; height: 40px; border-radius: var(--radius-md); background: var(--color-primary-faint); color: var(--color-primary); display: flex; align-items: center; justify-content: center; }
        .dash-subtitle { margin: 0; font-size: 0.8125rem; color: var(--text-tertiary); }
        .dash-header-actions { display: flex; align-items: center; gap: 10px; }
        .dash-date-pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: var(--radius); background: var(--bg-card); border: 1px solid var(--border-default); font-size: 0.75rem; color: var(--text-muted); }
        .dash-body { display: flex; flex-direction: column; gap: 20px; }
        .dash-status-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
        .dash-status-card { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: var(--radius-md); background: var(--bg-card); border: 1px solid var(--border-default); transition: all 0.15s; }
        .dash-status-card:hover { border-color: var(--status-color); }
        .dash-status-icon { width: 34px; height: 34px; border-radius: var(--radius); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .dash-status-content { flex: 1; min-width: 0; }
        .dash-status-top { display: flex; align-items: baseline; justify-content: space-between; gap: 6px; }
        .dash-status-value { font-size: 1.125rem; font-weight: 700; color: var(--text-primary); line-height: 1; }
        .dash-status-label { font-size: 0.6875rem; color: var(--text-muted); margin-top: 3px; font-weight: 500; }
        .dash-coverage-card { display: flex; align-items: center; gap: 16px; padding: 16px 20px; border-radius: var(--radius-lg); background: var(--bg-card); border: 1px solid var(--border-default); }
        .dash-doughnut-body { padding: 16px 20px 20px; display: flex; gap: 20px; align-items: center; }
        .dash-doughnut-wrap { position: relative; width: 160px; height: 160px; flex-shrink: 0; }
        .dash-doughnut-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -55%); text-align: center; pointer-events: none; }
        .dash-doughnut-value { font-size: 1.625rem; font-weight: 700; color: var(--text-primary); line-height: 1; }
        .dash-doughnut-caption { font-size: 0.6875rem; color: var(--text-muted); margin-top: 2px; }
        @media (max-width: 1100px) { .dash-status-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 640px) { .dash-status-grid { grid-template-columns: repeat(2, 1fr); } .dash-doughnut-body { flex-direction: column; } }
      `}</style>
    </div>
  );
}

export default Dashboard;
