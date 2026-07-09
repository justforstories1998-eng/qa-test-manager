import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FiHome, FiFileText, FiPlay, FiBarChart2, FiSettings,
  FiChevronLeft, FiChevronRight, FiAlertTriangle, FiLogOut,
  FiShield, FiMenu, FiX, FiSun, FiMoon, FiBell, FiChevronDown,
  FiAlertCircle, FiInfo, FiHelpCircle, FiTrello, FiClipboard,
  FiList, FiLayers, FiClock
} from 'react-icons/fi';
import api from '../api';
import { canAccessModule } from '../permissions';

function Navbar({ collapsed, onToggleCollapse, user, onLogout, isAdmin, isMobileOpen, onToggleMobile }) {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') !== 'light');

  const location = useLocation();
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  /* ── theme ── */
  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [isDarkMode]);

  /* ── notifications ── */
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.getBugs();
        if (res.success && res.data) {
          setNotifications(
            res.data.slice(0, 8).map(bug => ({
              id: bug._id,
              title: bug.title,
              type: bug.severity === 'Critical' ? 'critical' : bug.severity === 'High' ? 'warning' : 'info',
              time: new Date(bug.createdAt || bug.updatedAt).toLocaleDateString(),
            }))
          );
        }
      } catch { setNotifications([]); }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  /* ── click-outside ── */
  useEffect(() => {
    const handler = (e) => {
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
      if (showNotifications && notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showUserMenu, showNotifications]);

  /* ── body scroll lock on mobile ── */
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileOpen]);

  /* ── close menus on route change ── */
  useEffect(() => {
    setShowUserMenu(false);
    setShowNotifications(false);
  }, [location.pathname]);

  /* ── helpers ── */
  const getInitials = useCallback((u) => {
    if (!u) return '??';
    return `${u.firstName?.charAt(0) || ''}${u.lastName?.charAt(0) || ''}`.toUpperCase();
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  const role = user?.role || 'user';

  const navSections = [
    {
      title: 'Main',
      items: [
        { path: '/', label: 'Dashboard', icon: FiHome, module: 'dashboard' },
        { path: '/test-cases', label: 'Test Cases', icon: FiFileText, module: 'test-cases' },
        { path: '/execution', label: 'Execution', icon: FiPlay, module: 'execution' },
      ].filter(item => canAccessModule(role, item.module)),
    },
    {
      title: 'Board',
      items: [
        { path: '/board', label: 'Board', icon: FiTrello, module: 'board' },
        { path: '/work-items', label: 'Work Items', icon: FiClipboard, module: 'work-items' },
        { path: '/boards', label: 'Boards', icon: FiLayers, module: 'boards' },
        { path: '/backlogs', label: 'Backlogs', icon: FiList, module: 'backlogs' },
        { path: '/sprints', label: 'Sprints', icon: FiClock, module: 'sprints' },
      ].filter(item => canAccessModule(role, item.module)),
    },
    {
      title: 'Analysis',
      items: [
        { path: '/bugs', label: 'Bugs', icon: FiAlertTriangle, badge: notifications.length || null, badgeColor: '#ef4444', module: 'bugs' },
        { path: '/reports', label: 'Reports', icon: FiBarChart2, module: 'reports' },
      ].filter(item => canAccessModule(role, item.module)),
    },
    {
      title: 'System',
      items: [
        { path: '/settings', label: 'Settings', icon: FiSettings, module: 'settings' },
        ...(canAccessModule(role, 'admin') ? [{ path: '/admin', label: 'Admin', icon: FiShield, module: 'admin' }] : []),
      ].filter(item => canAccessModule(role, item.module)),
    },
  ].filter(section => section.items.length > 0);

  /* ── computed widths ── */
  const sidebarWidth = collapsed ? 72 : 260;

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <>
      {/* ── Mobile hamburger ── */}
      <button
        className="navbar-mobile-btn"
        onClick={onToggleMobile}
        aria-label="Toggle menu"
        style={{
          position: 'fixed', top: 14, left: 14, zIndex: 1100,
          width: 42, height: 42, borderRadius: 11, border: 'none',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: '#fff', cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(99,102,241,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}
      >
        {isMobileOpen ? <FiX size={18} /> : <FiMenu size={18} />}
      </button>

      {/* ── Overlay ── */}
      <div
        onClick={onToggleMobile}
        style={{
          position: 'fixed', inset: 0, zIndex: 1050,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          opacity: isMobileOpen ? 1 : 0,
          visibility: isMobileOpen ? 'visible' : 'hidden',
          transition: 'all 0.3s ease',
        }}
      />

      {/* ── Sidebar ── */}
      <nav
        className={`navbar-sidebar ${isMobileOpen ? 'navbar-mobile-open' : ''}`}
        style={{
          position: 'fixed', top: 0, left: 0, height: '100vh',
          width: sidebarWidth,
          background: 'var(--sidebar-bg, linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%))',
          display: 'flex', flexDirection: 'column',
          zIndex: 1060,
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
          borderRight: '1px solid var(--sidebar-border, rgba(255,255,255,0.06))',
          overflow: 'hidden',
        }}
      >
        {/* ──── Logo header ──── */}
        <div style={{
          padding: collapsed ? '20px 0' : '20px 20px',
          display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 12, minHeight: 72, flexShrink: 0,
          borderBottom: '1px solid var(--sidebar-border, rgba(255,255,255,0.06))',
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img
              src="/logo.jpg"
              alt="QALogs"
              style={{
                width: collapsed ? 38 : 'auto',
                height: 38,
                objectFit: collapsed ? 'cover' : 'contain',
                objectPosition: 'center',
                borderRadius: 10,
              }}
            />
          </div>
          <div style={{
            opacity: collapsed ? 0 : 1,
            width: collapsed ? 0 : 'auto',
            overflow: 'hidden',
            transition: 'opacity 0.25s ease, width 0.3s ease',
            whiteSpace: 'nowrap',
          }}>
            <div style={{
              fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.2,
              background: 'linear-gradient(135deg, #fff, #c7d2fe)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              QALogs
            </div>
            <div style={{
              fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 500,
              color: 'var(--sidebar-text-muted, rgba(148,163,184,0.5))',
            }}>
              Test Management
            </div>
          </div>
        </div>

        {/* ──── Quick actions ──── */}
        <div style={{
          padding: collapsed ? '12px 0' : '12px 16px',
          display: 'flex', gap: 6,
          justifyContent: 'center',
          flexShrink: 0,
          borderBottom: '1px solid var(--sidebar-border, rgba(255,255,255,0.06))',
        }}>
          {/* Notifications */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowNotifications(p => !p); setShowUserMenu(false); }}
              title="Notifications"
              style={{
                width: 34, height: 34, borderRadius: 8, border: 'none',
                background: showNotifications ? 'rgba(99,102,241,0.2)' : 'var(--sidebar-hover, rgba(255,255,255,0.04))',
                color: showNotifications ? '#818cf8' : 'var(--sidebar-text, rgba(148,163,184,0.7))',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!showNotifications) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#e2e8f0'; } }}
              onMouseLeave={e => { if (!showNotifications) { e.currentTarget.style.background = 'var(--sidebar-hover, rgba(255,255,255,0.04))'; e.currentTarget.style.color = 'var(--sidebar-text, rgba(148,163,184,0.7))'; } }}
            >
              <FiBell size={15} />
              {notifications.length > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#ef4444', border: '2px solid var(--sidebar-bg, #0f172a)',
                }} />
              )}
            </button>

            {/* Notification dropdown */}
            <div style={{
              position: 'absolute',
              [collapsed ? 'left' : 'left']: collapsed ? '100%' : 0,
              bottom: collapsed ? 'auto' : '100%',
              top: collapsed ? 0 : 'auto',
              marginLeft: collapsed ? 12 : 0,
              marginBottom: collapsed ? 0 : 8,
              width: 300, maxHeight: 400, overflowY: 'auto',
              background: 'var(--surface-elevated, #1e293b)',
              borderRadius: 12, border: '1px solid var(--sidebar-border, rgba(255,255,255,0.08))',
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              opacity: showNotifications ? 1 : 0,
              transform: showNotifications ? 'scale(1)' : 'scale(0.95)',
              visibility: showNotifications ? 'visible' : 'hidden',
              transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
              zIndex: 1200,
            }}>
              <div style={{
                padding: '12px 14px', borderBottom: '1px solid var(--sidebar-border, rgba(255,255,255,0.06))',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--sidebar-text-bright, #f1f5f9)' }}>Notifications</span>
                {notifications.length > 0 && (
                  <span style={{
                    padding: '2px 7px', borderRadius: 8, fontSize: 10, fontWeight: 700,
                    background: 'rgba(239,68,68,0.15)', color: '#f87171',
                  }}>
                    {notifications.length}
                  </span>
                )}
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '30px 14px', textAlign: 'center', color: 'var(--sidebar-text-muted, rgba(148,163,184,0.4))', fontSize: 12 }}>
                  No new notifications
                </div>
              ) : (
                notifications.map((n, i) => (
                  <div
                    key={n.id || i}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '10px 14px', cursor: 'pointer',
                      borderBottom: '1px solid var(--sidebar-border, rgba(255,255,255,0.04))',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: n.type === 'critical' ? 'rgba(239,68,68,0.12)' : n.type === 'warning' ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.12)',
                      color: n.type === 'critical' ? '#f87171' : n.type === 'warning' ? '#fbbf24' : '#818cf8',
                    }}>
                      {n.type === 'critical' ? <FiAlertCircle size={14} /> : n.type === 'warning' ? <FiAlertTriangle size={14} /> : <FiInfo size={14} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12, fontWeight: 500, color: 'var(--sidebar-text-bright, #f1f5f9)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3,
                      }}>{n.title}</div>
                      <div style={{ fontSize: 10, color: 'var(--sidebar-text-muted, rgba(148,163,184,0.4))', marginTop: 2 }}>{n.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setIsDarkMode(p => !p)}
            title={isDarkMode ? 'Light mode' : 'Dark mode'}
            style={{
              width: 34, height: 34, borderRadius: 8, border: 'none',
              background: isDarkMode ? 'rgba(99,102,241,0.15)' : 'var(--sidebar-hover, rgba(255,255,255,0.04))',
              color: isDarkMode ? '#818cf8' : 'var(--sidebar-text, rgba(148,163,184,0.7))',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; e.currentTarget.style.color = '#a5b4fc'; }}
            onMouseLeave={e => { e.currentTarget.style.background = isDarkMode ? 'rgba(99,102,241,0.15)' : 'var(--sidebar-hover, rgba(255,255,255,0.04))'; e.currentTarget.style.color = isDarkMode ? '#818cf8' : 'var(--sidebar-text, rgba(148,163,184,0.7))'; }}
          >
            {isDarkMode ? <FiSun size={15} /> : <FiMoon size={15} />}
          </button>
        </div>

        {/* ──── Navigation ──── */}
        <div className="navbar-scroll-area" style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          padding: '6px 0',
        }}>
          {navSections.map((section, sIdx) => (
            <div key={sIdx}>
              {section.items.length > 0 && (
                <div style={{
                  fontSize: 9, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase',
                  color: 'var(--sidebar-text-muted, rgba(148,163,184,0.4))',
                  padding: collapsed ? '16px 0 6px' : '16px 24px 6px',
                  textAlign: collapsed ? 'center' : 'left',
                  opacity: collapsed ? 0 : 1,
                  height: collapsed ? 8 : 'auto',
                  transition: 'opacity 0.25s ease',
                  overflow: 'hidden',
                }}>
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const isActive = location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                const isHovered = hoveredItem === item.path;

                return (
                  <div key={item.path} style={{ position: 'relative' }}>
                    <NavLink
                      to={item.path}
                      style={{
                        display: 'flex', alignItems: 'center',
                        gap: collapsed ? 0 : 12,
                        padding: collapsed ? '10px 0' : '10px 16px',
                        margin: collapsed ? '2px 8px' : '2px 10px',
                        borderRadius: 10,
                        textDecoration: 'none',
                        justifyContent: 'center',
                        color: isActive ? '#fff' : isHovered ? 'var(--sidebar-text-bright, #e2e8f0)' : 'var(--sidebar-text, rgba(148,163,184,0.7))',
                        background: isActive
                          ? 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12))'
                          : isHovered ? 'var(--sidebar-hover, rgba(255,255,255,0.04))' : 'transparent',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                      onMouseEnter={() => setHoveredItem(item.path)}
                      onMouseLeave={() => setHoveredItem(null)}
                      onClick={() => { if (window.innerWidth < 768 && onToggleMobile) onToggleMobile(); }}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <div style={{
                          position: 'absolute', left: 0, top: '18%', bottom: '18%',
                          width: 3, borderRadius: '0 3px 3px 0',
                          background: 'linear-gradient(180deg, #6366f1, #8b5cf6)',
                          boxShadow: '0 0 10px rgba(99,102,241,0.5)',
                        }} />
                      )}

                      {/* Icon */}
                      <div style={{
                        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isActive
                          ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                          : 'var(--sidebar-hover, rgba(255,255,255,0.04))',
                        boxShadow: isActive ? '0 3px 10px rgba(99,102,241,0.35)' : 'none',
                        transition: 'all 0.25s ease',
                      }}>
                        <item.icon size={17} color={isActive ? '#fff' : undefined} />
                      </div>

                      {/* Label */}
                      <span style={{
                        fontSize: 13, fontWeight: 500,
                        opacity: collapsed ? 0 : 1,
                        width: collapsed ? 0 : 'auto',
                        overflow: 'hidden',
                        transition: 'opacity 0.25s ease, width 0.3s ease',
                        whiteSpace: 'nowrap', flex: collapsed ? 'none' : 1,
                      }}>
                        {item.label}
                      </span>

                      {/* Badge */}
                      {item.badge && !collapsed && (
                        <span style={{
                          padding: '2px 7px', borderRadius: 8, fontSize: 10, fontWeight: 700,
                          background: `${item.badgeColor || '#6366f1'}20`,
                          color: item.badgeColor || '#6366f1',
                          transition: 'opacity 0.25s ease',
                        }}>
                          {item.badge}
                        </span>
                      )}
                    </NavLink>

                    {/* Tooltip (collapsed only) */}
                    {collapsed && isHovered && (
                      <div style={{
                        position: 'absolute', left: '100%', top: '50%',
                        transform: 'translateY(-50%)', marginLeft: 12,
                        padding: '7px 12px', borderRadius: 8,
                        background: 'var(--surface-elevated, #1e293b)',
                        border: '1px solid var(--sidebar-border, rgba(255,255,255,0.08))',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                        fontSize: 12, fontWeight: 500, color: '#fff',
                        whiteSpace: 'nowrap', zIndex: 1100, pointerEvents: 'none',
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        <div style={{
                          position: 'absolute', left: -4, top: '50%',
                          transform: 'translateY(-50%) rotate(45deg)',
                          width: 8, height: 8,
                          background: 'var(--surface-elevated, #1e293b)',
                          borderLeft: '1px solid var(--sidebar-border, rgba(255,255,255,0.08))',
                          borderBottom: '1px solid var(--sidebar-border, rgba(255,255,255,0.08))',
                        }} />
                        {item.label}
                        {item.badge && (
                          <span style={{
                            padding: '1px 6px', borderRadius: 6, fontSize: 9, fontWeight: 700,
                            background: `${item.badgeColor || '#6366f1'}20`,
                            color: item.badgeColor || '#6366f1',
                          }}>{item.badge}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* ──── User section ──── */}
        {user && (
          <div ref={userMenuRef} style={{
            padding: collapsed ? '12px 8px' : '12px 12px',
            borderTop: '1px solid var(--sidebar-border, rgba(255,255,255,0.06))',
            flexShrink: 0, position: 'relative',
          }}>
            {/* User menu dropdown */}
            <div style={{
              position: 'absolute',
              bottom: '100%', left: collapsed ? '100%' : 8, right: collapsed ? 'auto' : 8,
              marginBottom: collapsed ? 0 : 8,
              marginLeft: collapsed ? 8 : 0,
              width: collapsed ? 220 : 'auto',
              background: 'var(--surface-elevated, #1e293b)',
              borderRadius: 12, border: '1px solid var(--sidebar-border, rgba(255,255,255,0.08))',
              boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
              overflow: 'hidden',
              opacity: showUserMenu ? 1 : 0,
              transform: showUserMenu ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.97)',
              visibility: showUserMenu ? 'visible' : 'hidden',
              transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
              zIndex: 1200,
            }}>
              <div style={{
                padding: '14px 14px 10px',
                borderBottom: '1px solid var(--sidebar-border, rgba(255,255,255,0.06))',
              }}>
                <div style={{ fontSize: 10, color: 'var(--sidebar-text-muted, rgba(148,163,184,0.4))', fontWeight: 500, marginBottom: 2 }}>
                  {getGreeting()}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sidebar-text-bright, #f1f5f9)' }}>
                  {user.firstName} {user.lastName}
                </div>
                {user.email && (
                  <div style={{ fontSize: 11, color: 'var(--sidebar-text-muted, rgba(148,163,184,0.4))', marginTop: 2 }}>
                    {user.email}
                  </div>
                )}
              </div>
              <div style={{ padding: '4px 0' }}>
                <button
                  onClick={onLogout}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', border: 'none', background: 'transparent',
                    color: '#f87171', fontSize: 13, fontWeight: 500,
                    cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <FiLogOut size={14} /> Sign Out
                </button>
              </div>
            </div>

            {/* User card */}
            <div
              onClick={() => { setShowUserMenu(p => !p); setShowNotifications(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: collapsed ? '8px 0' : '8px 10px',
                borderRadius: 10, cursor: 'pointer',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: showUserMenu ? 'var(--sidebar-hover, rgba(255,255,255,0.04))' : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--sidebar-hover, rgba(255,255,255,0.04))'; }}
              onMouseLeave={e => { if (!showUserMenu) e.currentTarget.style.background = 'transparent'; }}
            >
              {/* Avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff', position: 'relative',
                boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
              }}>
                {getInitials(user)}
                <span style={{
                  position: 'absolute', bottom: -1, right: -1,
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#22c55e',
                  border: '2px solid var(--sidebar-bg, #0f172a)',
                }} />
              </div>

              {/* Name / role */}
              <div style={{
                opacity: collapsed ? 0 : 1,
                width: collapsed ? 0 : 'auto',
                overflow: 'hidden', flex: collapsed ? 'none' : 1,
                transition: 'opacity 0.25s ease, width 0.3s ease',
                minWidth: 0,
              }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, lineHeight: 1.3,
                  color: 'var(--sidebar-text-bright, #f1f5f9)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {user.firstName} {user.lastName}
                </div>
                <div style={{
                  fontSize: 10, color: 'var(--sidebar-text-muted, rgba(148,163,184,0.4))',
                  fontWeight: 500, whiteSpace: 'nowrap',
                }}>
                  {user.role === 'admin' ? '🛡️ Admin' : user.role ? `👤 ${user.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}` : '👤 Member'}
                </div>
              </div>

              {/* Chevron */}
              {!collapsed && (
                <FiChevronDown
                  size={13}
                  style={{
                    color: 'var(--sidebar-text-muted, rgba(148,163,184,0.4))',
                    transition: 'transform 0.2s ease',
                    transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0)',
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* ──── Collapse toggle ──── */}
        <div style={{
          padding: collapsed ? '8px' : '8px 12px',
          flexShrink: 0,
          borderTop: '1px solid var(--sidebar-border, rgba(255,255,255,0.06))',
        }}>
          <button
            onClick={onToggleCollapse}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: collapsed ? 0 : 8,
              width: '100%', height: 38,
              borderRadius: 9,
              border: '1px solid var(--sidebar-border, rgba(255,255,255,0.06))',
              background: 'var(--sidebar-hover, rgba(255,255,255,0.03))',
              color: 'var(--sidebar-text-muted, rgba(148,163,184,0.5))',
              cursor: 'pointer',
              fontSize: 11, fontWeight: 500,
              transition: 'all 0.2s ease',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
              e.currentTarget.style.color = 'var(--sidebar-text-bright, #e2e8f0)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--sidebar-hover, rgba(255,255,255,0.03))';
              e.currentTarget.style.color = 'var(--sidebar-text-muted, rgba(148,163,184,0.5))';
              e.currentTarget.style.borderColor = 'var(--sidebar-border, rgba(255,255,255,0.06))';
            }}
          >
            {collapsed ? (
              <FiChevronRight size={15} />
            ) : (
              <>
                <FiChevronLeft size={15} />
                <span style={{
                  whiteSpace: 'nowrap',
                  opacity: collapsed ? 0 : 1,
                  transition: 'opacity 0.25s ease',
                }}>Collapse</span>
              </>
            )}
          </button>
        </div>
      </nav>

      {/* ── Dynamic CSS ── */}
      <style>{`
        .navbar-mobile-btn {
          display: none !important;
        }
        @media (max-width: 768px) {
          .navbar-mobile-btn {
            display: flex !important;
          }
          .navbar-sidebar {
            transform: translateX(-100%);
            width: 272px !important;
          }
          .navbar-sidebar.navbar-mobile-open {
            transform: translateX(0) !important;
          }
        }
        .navbar-scroll-area::-webkit-scrollbar {
          width: 3px;
        }
        .navbar-scroll-area::-webkit-scrollbar-track {
          background: transparent;
        }
        .navbar-scroll-area::-webkit-scrollbar-thumb {
          background: var(--sidebar-border, rgba(255,255,255,0.08));
          border-radius: 3px;
        }
        .navbar-scroll-area::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.15);
        }
      `}</style>
    </>
  );
}

export default Navbar;