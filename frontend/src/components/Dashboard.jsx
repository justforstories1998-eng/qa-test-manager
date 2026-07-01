import React, { useMemo, useState, useEffect, useCallback } from 'react';
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
  Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiTrendingUp,
  FiTrendingDown,
  FiFolder,
  FiPlay,
  FiFileText,
  FiMinusCircle,
  FiActivity,
  FiClock,
  FiArrowUpRight,
  FiArrowDownRight,
  FiZap,
  FiShield,
  FiTarget,
  FiLayers,
  FiBarChart2,
  FiPieChart,
  FiCalendar,
  FiChevronRight,
  FiMoreHorizontal,
  FiExternalLink,
  FiUser,
  FiHash,
  FiBox,
} from 'react-icons/fi';

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

/* ═══════════ chart theme for dark backgrounds ═══════════ */

const chartColors = {
  passed: '#22c55e',
  failed: '#ef4444',
  blocked: '#f59e0b',
  na: '#64748b',
  notRun: 'rgba(100,116,139,0.25)',
  critical: '#ef4444',
  high: '#f97316',
  medium: '#6366f1',
  low: '#22c55e',
  accent: '#818cf8',
  accentFaded: 'rgba(129,140,248,0.10)',
  grid: 'rgba(255,255,255,0.04)',
  tick: 'rgba(148,163,184,0.45)',
};

/* ═══════════ sub-components ═══════════ */

const AnimatedNumber = ({ value, suffix = '', duration = 900 }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = typeof value === 'number' ? value : parseInt(value) || 0;
    if (target === 0) {
      setDisplay(0);
      return;
    }
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const interval = setInterval(() => {
      start += step;
      if (start >= target) {
        setDisplay(target);
        clearInterval(interval);
      } else {
        setDisplay(start);
      }
    }, 16);
    return () => clearInterval(interval);
  }, [value, duration]);
  return (
    <>
      {display}
      {suffix}
    </>
  );
};

const SparkLine = ({ data = [], color = '#818cf8', width = 80, height = 28 }) => {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data) || 1;
  const range = max - min || 1;
  const points = data.map(
    (v, i) =>
      `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`
  );
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={`0,${height} ${points.join(' ')} ${width},${height}`}
        fill={`url(#spark-${color.replace('#', '')})`}
        stroke="none"
      />
    </svg>
  );
};

const StatusDot = ({ color, size = 8 }) => (
  <span
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      flexShrink: 0,
      boxShadow: `0 0 6px ${color}60`,
    }}
  />
);

/* ═══════════ main component ═══════════ */

function Dashboard({ statistics, testSuites, testRuns, onRefresh }) {
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  }, [onRefresh]);

  /* ── derived data ── */

  const stats = useMemo(() => {
    const d = {
      totalTestCases: 0,
      totalTestRuns: 0,
      passRate: 0,
      statusCounts: { passed: 0, failed: 0, blocked: 0, na: 0, notRun: 0 },
      priorityCounts: { critical: 0, high: 0, medium: 0, low: 0 },
    };
    if (!statistics) return d;
    return {
      ...d,
      ...statistics,
      statusCounts: { ...d.statusCounts, ...statistics.statusCounts },
      priorityCounts: { ...d.priorityCounts, ...statistics.priorityCounts },
    };
  }, [statistics]);

  const recentRuns = useMemo(
    () =>
      testRuns
        ? [...testRuns]
            .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
            .slice(0, 6)
        : [],
    [testRuns]
  );

  const activeRuns = useMemo(
    () => (testRuns ? testRuns.filter((r) => r.status === 'In Progress').length : 0),
    [testRuns]
  );

  const trendData = useMemo(
    () =>
      recentRuns
        .map((r) => {
          const t = (r.passed || 0) + (r.failed || 0) + (r.blocked || 0);
          return t > 0 ? Math.round((r.passed / t) * 100) : 0;
        })
        .reverse(),
    [recentRuns]
  );

  const totalExecuted =
    stats.statusCounts.passed +
    stats.statusCounts.failed +
    stats.statusCounts.blocked +
    stats.statusCounts.na;

  const executionRate =
    stats.totalTestCases > 0 ? Math.round((totalExecuted / stats.totalTestCases) * 100) : 0;

  /* ── chart data ── */

  const statusChartData = {
    labels: ['Passed', 'Failed', 'Blocked', 'N/A', 'Not Run'],
    datasets: [
      {
        data: [
          stats.statusCounts.passed,
          stats.statusCounts.failed,
          stats.statusCounts.blocked,
          stats.statusCounts.na,
          stats.statusCounts.notRun,
        ],
        backgroundColor: [
          chartColors.passed,
          chartColors.failed,
          chartColors.blocked,
          chartColors.na,
          chartColors.notRun,
        ],
        borderWidth: 0,
        hoverOffset: 6,
        spacing: 2,
      },
    ],
  };

  const priorityChartData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [
      {
        label: 'Test Cases',
        data: [
          stats.priorityCounts.critical,
          stats.priorityCounts.high,
          stats.priorityCounts.medium,
          stats.priorityCounts.low,
        ],
        backgroundColor: [
          chartColors.critical + '30',
          chartColors.high + '30',
          chartColors.medium + '30',
          chartColors.low + '30',
        ],
        borderColor: [
          chartColors.critical,
          chartColors.high,
          chartColors.medium,
          chartColors.low,
        ],
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.55,
      },
    ],
  };

  const trendChartData = {
    labels: recentRuns
      .map((_, i) => `Run ${recentRuns.length - i}`)
      .reverse(),
    datasets: [
      {
        label: 'Pass Rate',
        data: trendData,
        borderColor: chartColors.accent,
        backgroundColor: chartColors.accentFaded,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: chartColors.accent,
        pointBorderColor: 'rgba(15,23,42,0.8)',
        pointBorderWidth: 2,
        borderWidth: 2,
      },
    ],
  };

  const darkChartOptions = (yMax) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        titleFont: { size: 12, weight: '600' },
        bodyFont: { size: 12 },
        displayColors: true,
        boxPadding: 4,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: chartColors.tick, font: { size: 11 } },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        ...(yMax ? { max: yMax } : {}),
        grid: { color: chartColors.grid },
        ticks: { color: chartColors.tick, font: { size: 11 } },
        border: { display: false },
      },
    },
  });

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        displayColors: true,
        boxPadding: 4,
      },
    },
  };

  /* ── styles ── */

  const s = {
    page: {
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      height: '100%',
      overflow: 'auto',
    },
    header: {
      padding: '28px 32px 24px',
      borderBottom: '1px solid var(--border-color)',
    },
    headerTop: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 20,
    },
    title: {
      margin: 0,
      fontSize: '24px',
      fontWeight: 700,
      color: 'var(--text-primary)',
      letterSpacing: '-0.4px',
      lineHeight: 1.2,
    },
    subtitle: {
      margin: '4px 0 0',
      fontSize: '14px',
      color: 'var(--text-tertiary)',
      fontWeight: 400,
    },
    refreshBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      padding: '9px 16px',
      borderRadius: '9px',
      fontSize: '13px',
      fontWeight: 500,
      background: 'var(--surface-glass)',
      border: '1px solid var(--border-color)',
      color: 'var(--text-secondary)',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    body: {
      padding: '24px 32px 40px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    },
    /* ── stat cards ── */
    statsRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '16px',
    },
    statCard: (accentColor) => ({
      position: 'relative',
      padding: '20px',
      borderRadius: '14px',
      background: 'var(--surface-glass)',
      border: '1px solid var(--border-color)',
      overflow: 'hidden',
      transition: 'all 0.2s',
      cursor: 'default',
    }),
    statAccent: (color) => ({
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '2px',
      background: `linear-gradient(90deg, ${color}, ${color}00)`,
    }),
    statIconWrap: (color) => ({
      width: 40,
      height: 40,
      borderRadius: '10px',
      background: `${color}15`,
      border: `1px solid ${color}20`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '14px',
    }),
    statValue: {
      fontSize: '28px',
      fontWeight: 700,
      color: 'var(--text-primary)',
      lineHeight: 1.1,
      letterSpacing: '-0.5px',
    },
    statLabel: {
      fontSize: '12px',
      color: 'var(--text-muted)',
      marginTop: '4px',
      fontWeight: 500,
    },
    statSpark: {
      position: 'absolute',
      bottom: 16,
      right: 16,
      opacity: 0.7,
    },
    /* ── status row ── */
    statusRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '12px',
    },
    statusCard: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 16px',
      borderRadius: '10px',
      background: 'var(--surface-glass)',
      border: '1px solid var(--border-color)',
      transition: 'all 0.15s',
    },
    /* ── chart cards ── */
    chartGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
    },
    chartCard: {
      borderRadius: '14px',
      background: 'var(--surface-glass)',
      border: '1px solid var(--border-color)',
      overflow: 'hidden',
    },
    chartHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '18px 20px 0',
    },
    chartTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '13px',
      fontWeight: 600,
      color: 'var(--text-primary)',
      margin: 0,
    },
    chartBody: {
      padding: '16px 20px 20px',
    },
    /* ── recent runs ── */
    runCard: {
      borderRadius: '14px',
      background: 'var(--surface-glass)',
      border: '1px solid var(--border-color)',
      overflow: 'hidden',
    },
    runRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      padding: '13px 20px',
      borderBottom: '1px solid var(--border-color)',
      transition: 'background 0.15s',
      cursor: 'pointer',
    },
    /* ── progress bar ── */
    progressOuter: {
      height: '6px',
      borderRadius: '3px',
      background: 'rgba(255,255,255,0.04)',
      overflow: 'hidden',
      flex: 1,
    },
    progressInner: (pct, color) => ({
      height: '100%',
      borderRadius: '3px',
      width: `${pct}%`,
      background: color,
      transition: 'width 0.6s ease',
    }),
  };

  /* ── helper: doughnut center label ── */
  const DoughnutCenter = ({ value, label }) => (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -55%)',
        textAlign: 'center',
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
        {value}%
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
        {label}
      </div>
    </div>
  );

  /* ── helper: legend items ── */
  const LegendItem = ({ color, label, value, total }) => {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '6px 0',
        }}
      >
        <StatusDot color={color} />
        <span style={{ flex: 1, fontSize: '12px', color: 'var(--text-secondary)' }}>
          {label}
        </span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', minWidth: '24px', textAlign: 'right' }}>
          {value}
        </span>
        <span
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            minWidth: '36px',
            textAlign: 'right',
          }}
        >
          {pct}%
        </span>
      </div>
    );
  };

  /* ═════════════════ render ═════════════════ */

  return (
    <div className="dg-page" style={s.page}>
      {/* ──────── Header ──────── */}
      <div style={s.header}>
        <div style={s.headerTop}>
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '6px',
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '10px',
                  background:
                    'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
                  border: '1px solid rgba(99,102,241,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FiActivity size={19} style={{ color: '#818cf8' }} />
              </div>
              <div>
                <h1 style={s.title}>Dashboard</h1>
                <p style={s.subtitle}>{greeting} — here's your project overview</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '8px',
                background: 'var(--surface-glass)',
                border: '1px solid var(--border-color)',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}
            >
              <FiCalendar size={13} />
              {new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
            <button
              style={{
                ...s.refreshBtn,
                ...(refreshing ? { opacity: 0.6, pointerEvents: 'none' } : {}),
              }}
              onClick={handleRefresh}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-glass-hover)';
                e.currentTarget.style.borderColor = 'var(--border-medium)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--surface-glass)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <FiRefreshCw
                size={14}
                style={{
                  transition: 'transform 0.6s',
                  transform: refreshing ? 'rotate(360deg)' : 'rotate(0)',
                }}
              />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* ──────── Body ──────── */}
      <div style={s.body}>
        {/* ── Primary stat cards ── */}
        <div style={s.statsRow}>
          {[
            {
              icon: FiFileText,
              label: 'Total Test Cases',
              value: stats.totalTestCases,
              color: '#818cf8',
              spark: trendData,
            },
            {
              icon: FiFolder,
              label: 'Test Suites',
              value: testSuites?.length || 0,
              color: '#a78bfa',
              spark: null,
            },
            {
              icon: FiPlay,
              label: 'Active Runs',
              value: activeRuns,
              color: '#f59e0b',
              spark: null,
            },
            {
              icon: FiTrendingUp,
              label: 'Pass Rate',
              value: stats.passRate,
              suffix: '%',
              color: stats.passRate >= 80 ? '#22c55e' : stats.passRate >= 50 ? '#f59e0b' : '#ef4444',
              spark: trendData,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                style={s.statCard(item.color)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${item.color}30`;
                  e.currentTarget.style.background = 'var(--surface-glass-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = 'var(--surface-glass)';
                }}
              >
                <div style={s.statAccent(item.color)} />
                <div style={s.statIconWrap(item.color)}>
                  <Icon size={18} style={{ color: item.color }} />
                </div>
                <div style={s.statValue}>
                  <AnimatedNumber value={item.value} suffix={item.suffix || ''} />
                </div>
                <div style={s.statLabel}>{item.label}</div>
                {item.spark && item.spark.length >= 2 && (
                  <div style={s.statSpark}>
                    <SparkLine data={item.spark} color={item.color} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Status breakdown row ── */}
        <div style={s.statusRow}>
          {[
            {
              icon: FiCheckCircle,
              label: 'Passed',
              value: stats.statusCounts.passed,
              color: chartColors.passed,
            },
            {
              icon: FiXCircle,
              label: 'Failed',
              value: stats.statusCounts.failed,
              color: chartColors.failed,
            },
            {
              icon: FiAlertCircle,
              label: 'Blocked',
              value: stats.statusCounts.blocked,
              color: chartColors.blocked,
            },
            {
              icon: FiMinusCircle,
              label: 'N/A',
              value: stats.statusCounts.na,
              color: chartColors.na,
            },
            {
              icon: FiClock,
              label: 'Not Run',
              value: stats.statusCounts.notRun,
              color: 'var(--text-muted)',
            },
          ].map((item) => {
            const Icon = item.icon;
            const pct =
              totalExecuted + stats.statusCounts.notRun > 0
                ? Math.round(
                    (item.value / (totalExecuted + stats.statusCounts.notRun)) * 100
                  )
                : 0;
            return (
              <div
                key={item.label}
                style={s.statusCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface-glass-hover)';
                  e.currentTarget.style.borderColor = `${item.color}25`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--surface-glass)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '8px',
                    background: `${item.color}12`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={16} style={{ color: item.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '6px',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        lineHeight: 1,
                      }}
                    >
                      {item.value}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: item.color,
                        opacity: 0.8,
                      }}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      marginTop: '3px',
                      fontWeight: 500,
                    }}
                  >
                    {item.label}
                  </div>
                  {/* micro progress */}
                  <div style={{ ...s.progressOuter, marginTop: '6px' }}>
                    <div style={s.progressInner(pct, item.color)} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Execution Coverage bar ── */}
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '12px',
            background: 'var(--surface-glass)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '9px',
              background: 'rgba(129,140,248,0.12)',
              border: '1px solid rgba(129,140,248,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FiShield size={17} style={{ color: '#818cf8' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                Execution Coverage
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#818cf8' }}>
                {executionRate}%
              </span>
            </div>
            {/* Stacked bar */}
            <div
              style={{
                height: '10px',
                borderRadius: '5px',
                background: 'rgba(255,255,255,0.04)',
                overflow: 'hidden',
                display: 'flex',
              }}
            >
              {[
                { value: stats.statusCounts.passed, color: chartColors.passed },
                { value: stats.statusCounts.failed, color: chartColors.failed },
                { value: stats.statusCounts.blocked, color: chartColors.blocked },
                { value: stats.statusCounts.na, color: chartColors.na },
              ].map((seg, i) => {
                const total = stats.totalTestCases || 1;
                const w = (seg.value / total) * 100;
                return (
                  <div
                    key={i}
                    style={{
                      width: `${w}%`,
                      background: seg.color,
                      transition: 'width 0.6s ease',
                    }}
                  />
                );
              })}
            </div>
            <div
              style={{
                display: 'flex',
                gap: '16px',
                marginTop: '6px',
              }}
            >
              {[
                { label: 'Passed', color: chartColors.passed },
                { label: 'Failed', color: chartColors.failed },
                { label: 'Blocked', color: chartColors.blocked },
                { label: 'Remaining', color: 'rgba(100,116,139,0.4)' },
              ].map((l) => (
                <div
                  key={l.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '2px',
                      background: l.color,
                      flexShrink: 0,
                    }}
                  />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Charts row ── */}
        <div style={s.chartGrid}>
          {/* Doughnut */}
          <div style={s.chartCard}>
            <div style={s.chartHeader}>
              <h3 style={s.chartTitle}>
                <FiPieChart size={15} style={{ color: '#818cf8' }} />
                Execution Health
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  padding: '3px 8px',
                  borderRadius: '5px',
                  background: 'var(--surface-secondary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                All Time
              </span>
            </div>
            <div style={{ ...s.chartBody, display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '160px', height: '160px', flexShrink: 0 }}>
                <Doughnut data={statusChartData} options={doughnutOptions} />
                <DoughnutCenter value={stats.passRate} label="pass rate" />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {[
                  { label: 'Passed', value: stats.statusCounts.passed, color: chartColors.passed },
                  { label: 'Failed', value: stats.statusCounts.failed, color: chartColors.failed },
                  { label: 'Blocked', value: stats.statusCounts.blocked, color: chartColors.blocked },
                  { label: 'N/A', value: stats.statusCounts.na, color: chartColors.na },
                  { label: 'Not Run', value: stats.statusCounts.notRun, color: chartColors.notRun },
                ].map((item) => (
                  <LegendItem
                    key={item.label}
                    color={item.color}
                    label={item.label}
                    value={item.value}
                    total={totalExecuted + stats.statusCounts.notRun}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Bar */}
          <div style={s.chartCard}>
            <div style={s.chartHeader}>
              <h3 style={s.chartTitle}>
                <FiBarChart2 size={15} style={{ color: '#818cf8' }} />
                Priority Distribution
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  padding: '3px 8px',
                  borderRadius: '5px',
                  background: 'var(--surface-secondary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                {stats.totalTestCases} total
              </span>
            </div>
            <div style={{ ...s.chartBody, height: '200px' }}>
              <Bar data={priorityChartData} options={darkChartOptions()} />
            </div>
          </div>
        </div>

        {/* ── Trend + Recent Runs row ── */}
        <div style={s.chartGrid}>
          {/* Trend line */}
          <div style={s.chartCard}>
            <div style={s.chartHeader}>
              <h3 style={s.chartTitle}>
                <FiTrendingUp size={15} style={{ color: '#818cf8' }} />
                Reliability Trend
              </h3>
              {trendData.length >= 2 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color:
                      trendData[trendData.length - 1] >= trendData[trendData.length - 2]
                        ? '#22c55e'
                        : '#ef4444',
                  }}
                >
                  {trendData[trendData.length - 1] >= trendData[trendData.length - 2] ? (
                    <FiArrowUpRight size={14} />
                  ) : (
                    <FiArrowDownRight size={14} />
                  )}
                  {Math.abs(
                    trendData[trendData.length - 1] - trendData[trendData.length - 2]
                  )}
                  %
                </div>
              )}
            </div>
            <div style={{ ...s.chartBody, height: '200px' }}>
              <Line
                data={trendChartData}
                options={{
                  ...darkChartOptions(100),
                  plugins: { ...darkChartOptions(100).plugins, legend: { display: false } },
                }}
              />
            </div>
          </div>

          {/* Recent runs */}
          <div style={s.runCard}>
            <div style={s.chartHeader}>
              <h3 style={s.chartTitle}>
                <FiPlay size={15} style={{ color: '#818cf8' }} />
                Recent Runs
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  background: 'rgba(99,102,241,0.12)',
                  color: '#818cf8',
                  padding: '3px 8px',
                  borderRadius: '5px',
                  fontWeight: 600,
                }}
              >
                {testRuns?.length || 0} total
              </span>
            </div>
            <div style={{ padding: '8px 0' }}>
              {recentRuns.length > 0 ? (
                recentRuns.slice(0, 5).map((run, i) => {
                  const total = (run.passed || 0) + (run.failed || 0) + (run.blocked || 0);
                  const pct = total > 0 ? Math.round((run.passed / total) * 100) : 0;
                  const isInProgress = run.status === 'In Progress';
                  const statusColor = isInProgress
                    ? '#f59e0b'
                    : pct >= 80
                    ? '#22c55e'
                    : pct >= 50
                    ? '#f59e0b'
                    : '#ef4444';
                  return (
                    <div
                      key={run._id || run.id || i}
                      style={s.runRow}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--surface-glass-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          background: `${statusColor}12`,
                          border: `1px solid ${statusColor}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {isInProgress ? (
                          <FiPlay size={14} style={{ color: statusColor }} />
                        ) : (
                          <FiCheckCircle size={14} style={{ color: statusColor }} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {run.name || `Run #${recentRuns.length - i}`}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            marginTop: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <FiClock size={10} />
                          {run.startedAt
                            ? new Date(run.startedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : '—'}
                          <span style={{ opacity: 0.4 }}>·</span>
                          {total} cases
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: statusColor,
                          }}
                        >
                          {isInProgress ? (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '3px 8px',
                                borderRadius: '5px',
                                background: `${statusColor}15`,
                                color: statusColor,
                              }}
                            >
                              Running
                            </span>
                          ) : (
                            `${pct}%`
                          )}
                        </div>
                      </div>
                      <FiChevronRight
                        size={14}
                        style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                      />
                    </div>
                  );
                })
              ) : (
                <div
                  style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '13px',
                  }}
                >
                  <FiPlay
                    size={28}
                    style={{ color: 'var(--text-muted)', marginBottom: '10px', opacity: 0.3 }}
                  />
                  <div>No test runs yet</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Suites overview ── */}
        {testSuites && testSuites.length > 0 && (
          <div style={s.chartCard}>
            <div style={s.chartHeader}>
              <h3 style={s.chartTitle}>
                <FiLayers size={15} style={{ color: '#818cf8' }} />
                Test Suites Overview
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  background: 'rgba(99,102,241,0.12)',
                  color: '#818cf8',
                  padding: '3px 8px',
                  borderRadius: '5px',
                  fontWeight: 600,
                }}
              >
                {testSuites.length} suites
              </span>
            </div>
            <div style={{ padding: '4px 0 8px' }}>
              {testSuites.slice(0, 6).map((suite, i) => {
                const suiteId = suite._id || suite.id;
                const count = suite.testCaseCount || 0;
                const maxCount = Math.max(
                  ...testSuites.map((s) => s.testCaseCount || 0),
                  1
                );
                const barPct = (count / maxCount) * 100;
                return (
                  <div
                    key={suiteId || i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '11px 20px',
                      borderBottom:
                        i < testSuites.slice(0, 6).length - 1
                          ? '1px solid var(--border-color)'
                          : 'none',
                      transition: 'background 0.15s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--surface-glass-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: '8px',
                        background: 'rgba(129,140,248,0.1)',
                        border: '1px solid rgba(129,140,248,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FiFolder size={14} style={{ color: '#818cf8' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: 'var(--text-primary)',
                          marginBottom: '6px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {suite.name}
                      </div>
                      <div style={s.progressOuter}>
                        <div
                          style={{
                            ...s.progressInner(barPct, '#818cf8'),
                            background:
                              'linear-gradient(90deg, rgba(99,102,241,0.5), rgba(129,140,248,0.3))',
                          }}
                        />
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        minWidth: '40px',
                        textAlign: 'right',
                      }}
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;