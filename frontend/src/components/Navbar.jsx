import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FiHome, FiFileText, FiPlay, FiBarChart2, FiSettings,
  FiChevronLeft, FiChevronRight, FiAlertTriangle, FiLogOut,
  FiShield, FiMenu, FiX, FiSun, FiMoon, FiBell, FiChevronDown,
  FiTrello, FiClipboard, FiList, FiLayers, FiClock
} from 'react-icons/fi';
import api from '../api';
import { canAccessModule } from '../permissions';
import { LiquidButton } from './ui/liquid-glass-button';

function Navbar({ collapsed, onToggleCollapse, user, onLogout, isAdmin, isMobileOpen, onToggleMobile }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') !== 'light');
  const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);

  const location = useLocation();
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [isDarkMode]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userId = user?.id || user?._id;
        if (!userId) return;
        const res = await api.getFollowedItems(userId);
        if (res.success && res.data) {
          setNotifications(res.data.slice(0, 10).map(sub => ({
            id: sub._id,
            workItemId: sub.workItem?._id,
            title: `WI-${sub.workItem?.workItemId}: ${sub.workItem?.title}`,
            status: sub.workItem?.status,
            type: sub.type,
            time: new Date(sub.updatedAt).toLocaleDateString(),
          })));
        }
      } catch { setNotifications([]); }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handler = (e) => {
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
      if (showNotifications && notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showUserMenu, showNotifications]);

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileOpen]);

  useEffect(() => {
    setShowUserMenu(false);
    setShowNotifications(false);
    const isBoardRoute = location.pathname === '/board' || boardSubItems.some(i => location.pathname.startsWith(i.path));
    setBoardDropdownOpen(isBoardRoute);
  }, [location.pathname]);

  const getInitials = useCallback((u) => {
    if (!u) return '??';
    return `${u.firstName?.charAt(0) || ''}${u.lastName?.charAt(0) || ''}`.toUpperCase();
  }, []);

  const role = user?.role || 'user';

  const boardSubItems = [
    { path: '/work-items', label: 'Work Items', icon: FiClipboard, module: 'work-items' },
    { path: '/boards', label: 'Boards', icon: FiLayers, module: 'boards' },
    { path: '/backlogs', label: 'Backlogs', icon: FiList, module: 'backlogs' },
    { path: '/sprints', label: 'Sprints', icon: FiClock, module: 'sprints' },
  ].filter(item => canAccessModule(role, item.module));

  const hasBoardAccess = canAccessModule(role, 'board') && boardSubItems.length > 0;
  const isBoardActive = location.pathname === '/board' || boardSubItems.some(i => location.pathname.startsWith(i.path));

  const navSections = [
    {
      title: 'Main',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: FiHome, module: 'dashboard' },
        { path: '/test-cases', label: 'Test Cases', icon: FiFileText, module: 'test-cases' },
        { path: '/execution', label: 'Execution', icon: FiPlay, module: 'execution' },
      ].filter(item => canAccessModule(role, item.module)),
    },
    {
      title: 'Analysis',
      items: [
        { path: '/bugs', label: 'Bugs', icon: FiAlertTriangle, badge: notifications.length || null, module: 'bugs' },
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

  return (
    <>
      {/* Mobile hamburger */}
      <button className="navbar-mobile-btn" onClick={onToggleMobile} aria-label="Toggle menu">
        {isMobileOpen ? <FiX size={18} /> : <FiMenu size={18} />}
      </button>

      {/* Overlay */}
      <div className={`sidebar-overlay ${isMobileOpen ? 'sidebar-overlay-visible' : ''}`} onClick={onToggleMobile} />

      {/* Sidebar */}
      <nav className={`sidebar ${isMobileOpen ? 'sidebar-mobile-open' : ''} ${collapsed ? 'collapsed' : ''}`} style={{ width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)' }}>
        {/* Logo */}
        <div className="sidebar-header" style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '16px 0' : undefined }}>
          <img src="/logo.jpg" alt="QALogs" style={{ width: 32, height: 32, borderRadius: 'var(--radius)', objectFit: 'cover' }} />
          {!collapsed && (
            <div className="sidebar-brand">
              <div className="sidebar-brand-name">QALogs</div>
              <div className="sidebar-brand-sub">Test Management</div>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="sidebar-actions" style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '0 0 12px' : undefined }}>
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button onClick={() => { setShowNotifications(p => !p); setShowUserMenu(false); }} title="Notifications"
              className="sidebar-link" style={{ padding: '0.375rem', width: 34, height: 34, justifyContent: 'center' }}>
              <FiBell size={15} />
              {notifications.length > 0 && <span className="header-action-badge" />}
            </button>
            {showNotifications && (
              <div className="sidebar-dropdown" style={{ left: collapsed ? 'calc(100% + 8px)' : 0, bottom: '100%', marginBottom: 8 }}>
                <div className="sidebar-dropdown-header">
                  <span className="sidebar-dropdown-title">Notifications</span>
                  {notifications.length > 0 && <span className="badge badge-danger">{notifications.length}</span>}
                </div>
                {notifications.length === 0 ? (
                  <div className="sidebar-dropdown-empty">No new notifications</div>
                ) : notifications.map((n, i) => (
                  <div key={n.id || i} className="sidebar-dropdown-item">
                    <div className="activity-avatar" style={{ width: 28, height: 28, fontSize: '0.6875rem' }}>
                      <FiBell size={12} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="sidebar-dropdown-item-title">{n.title}</div>
                      <div className="sidebar-dropdown-item-meta">
                        <span className="badge badge-neutral" style={{ fontSize: '0.625rem', padding: '1px 5px' }}>{n.status || 'Unknown'}</span>
                        {n.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setIsDarkMode(p => !p)} title={isDarkMode ? 'Light mode' : 'Dark mode'}
            className="sidebar-link" style={{ padding: '0.375rem', width: 34, height: 34, justifyContent: 'center', color: isDarkMode ? 'var(--color-primary-light)' : undefined }}>
            {isDarkMode ? <FiSun size={15} /> : <FiMoon size={15} />}
          </button>
        </div>

        {/* Navigation */}
        <div className="sidebar-nav">
          {hasBoardAccess && (
            <div>
              {!collapsed && <div className="sidebar-section-label">Board</div>}
              <div
                className={`sidebar-link ${isBoardActive ? 'active' : ''}`}
                onClick={() => { if (!collapsed) setBoardDropdownOpen(p => !p); }}
                style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
              >
                <FiTrello size={17} />
                {!collapsed && (
                  <>
                    <span style={{ flex: 1 }}>Board</span>
                    <FiChevronDown
                      size={13}
                      style={{
                        transition: 'transform 0.2s',
                        transform: boardDropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                        opacity: 0.5
                      }}
                    />
                  </>
                )}
              </div>
              <div
                className="board-sub-wrapper"
                style={{
                  maxHeight: boardDropdownOpen || collapsed ? (boardSubItems.length * 48 + 16) : 0,
                  marginTop: boardDropdownOpen || collapsed ? 'var(--space-2)' : 0,
                }}
              >
                {boardSubItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    onClick={() => { if (window.innerWidth < 768 && onToggleMobile) onToggleMobile(); }}
                    style={{
                      paddingLeft: collapsed ? undefined : 44,
                      justifyContent: collapsed ? 'center' : 'flex-start'
                    }}
                  >
                    <item.icon size={14} />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          )}

          {navSections.map((section, sIdx) => (
            <div key={sIdx}>
              {!collapsed && <div className="sidebar-section-label">{section.title}</div>}
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={() => { if (window.innerWidth < 768 && onToggleMobile) onToggleMobile(); }}
                  style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
                >
                  <item.icon size={17} />
                  {!collapsed && (
                    <>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {item.badge && <span className="sidebar-badge">{item.badge}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        {/* User section */}
        {user && (
          <div className="sidebar-footer" ref={userMenuRef}>
            {showUserMenu && (
              <div className="sidebar-dropdown" style={{ bottom: '100%', left: collapsed ? 'calc(100% + 8px)' : 0, marginBottom: 8, width: collapsed ? 220 : 'auto' }}>
                <div className="sidebar-dropdown-header" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div className="sidebar-dropdown-item-meta" style={{ marginBottom: 2 }}>Signed in as</div>
                  <div className="sidebar-dropdown-item-title">{user.firstName} {user.lastName}</div>
                  {user.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{user.email}</div>}
                </div>
              </div>
            )}
            <div className="sidebar-user" onClick={() => { setShowUserMenu(p => !p); setShowNotifications(false); }}>
              <div className="sidebar-avatar">
                {getInitials(user)}
                <span style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', background: 'var(--color-success)', border: '2px solid var(--bg-sidebar)' }} />
              </div>
              {!collapsed && (
                <div className="sidebar-user-info">
                  <div className="sidebar-user-name">{user.firstName} {user.lastName}</div>
                  <div className="sidebar-user-role">{user.role === 'admin' ? 'Admin' : user.role ? user.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Member'}</div>
                </div>
              )}
            </div>
            {/* Visible Logout Button */}
            <LiquidButton
              onClick={onLogout}
              className="sidebar-logout"
              style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
              variant="destructive"
              size="sm"
              title="Sign Out"
            >
              <FiLogOut size={17} />
              {!collapsed && <span>Sign Out</span>}
            </LiquidButton>
            {/* Online Status */}
            <div className="sidebar-online" style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
              <div className="sidebar-online-dot" />
              {!collapsed && <span className="sidebar-online-text">Online</span>}
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <div className="sidebar-collapse">
          <button onClick={onToggleCollapse} className="sidebar-link" style={{ justifyContent: 'center', padding: '0.5rem' }}>
            {collapsed ? <FiChevronRight size={15} /> : <><FiChevronLeft size={15} /><span style={{ marginLeft: 6, fontSize: '0.75rem' }}>Collapse</span></>}
          </button>
        </div>
      </nav>

      <style>{`
        .navbar-mobile-btn {
          display: none !important;
          position: fixed;
          top: 14px;
          left: 14px;
          z-index: 1100;
          width: 42px;
          height: 42px;
          border-radius: var(--radius-lg);
          border: none;
          background: var(--bg-sidebar);
          color: var(--text-primary);
          cursor: pointer;
          box-shadow: var(--neu-shadow-sm);
          align-items: center;
          justify-content: center;
        }
        .navbar-mobile-btn:active {
          box-shadow: var(--neu-shadow-inset-xs);
        }
        .sidebar-overlay {
          position: fixed;
          inset: 0;
          z-index: 1050;
          background: var(--bg-overlay);
          backdrop-filter: blur(4px);
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s;
        }
        .sidebar-overlay-visible {
          opacity: 1;
          visibility: visible;
        }
        .sidebar-dropdown {
          position: absolute;
          width: 300px;
          max-height: 400px;
          overflow-y: auto;
          background: var(--bg-sidebar);
          border-radius: var(--radius-lg);
          box-shadow: var(--neu-shadow);
          z-index: 1200;
          padding: var(--space-2);
        }
        .sidebar-dropdown-header {
          padding: 12px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .sidebar-dropdown-title {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .sidebar-dropdown-empty {
          padding: 30px 14px;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.75rem;
        }
        .sidebar-dropdown-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 14px;
          border-radius: var(--radius);
          cursor: pointer;
          transition: background var(--duration-fast) var(--ease);
        }
        .sidebar-dropdown-item:hover {
          background: var(--color-primary-faint);
        }
        .sidebar-dropdown-item-title {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sidebar-dropdown-item-meta {
          font-size: 0.6875rem;
          color: var(--text-muted);
          margin-top: 2px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        @media (max-width: 768px) {
          .navbar-mobile-btn { display: flex !important; }
          .sidebar { transform: translateX(-100%); width: 272px !important; border-radius: 0 24px 24px 0; }
          .sidebar.sidebar-mobile-open { transform: translateX(0); }
        }
        .sidebar-nav::-webkit-scrollbar { width: 3px; }
        .sidebar-nav::-webkit-scrollbar-track { background: transparent; }
        .sidebar-nav::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 3px; }
      `}</style>
    </>
  );
}

export default Navbar;
