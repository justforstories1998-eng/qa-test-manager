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
      <button className="navbar-mobile-btn" onClick={onToggleMobile} aria-label="Toggle menu"
        style={{
          position: 'fixed', top: 14, left: 14, zIndex: 1100,
          width: 42, height: 42, borderRadius: 'var(--radius)',
          border: 'none', background: 'var(--color-primary)', color: '#fff',
          cursor: 'pointer', boxShadow: '0 4px 15px rgba(99,102,241,0.4)',
          display: 'none', alignItems: 'center', justifyContent: 'center',
        }}>
        {isMobileOpen ? <FiX size={18} /> : <FiMenu size={18} />}
      </button>

      {/* Overlay */}
      <div onClick={onToggleMobile} style={{
        position: 'fixed', inset: 0, zIndex: 1050,
        background: 'var(--bg-overlay)', backdropFilter: 'blur(4px)',
        opacity: isMobileOpen ? 1 : 0, visibility: isMobileOpen ? 'visible' : 'hidden',
        transition: 'all 0.3s',
      }} />

      {/* Sidebar */}
      <nav className={`sidebar ${isMobileOpen ? 'sidebar-mobile-open' : ''}`} style={{ width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)' }}>
        {/* Logo */}
        <div className="sidebar-header" style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '20px 0' : undefined }}>
          <img src="/logo.jpg" alt="QALogs" style={{ width: 32, height: 32, borderRadius: 'var(--radius)', objectFit: 'cover' }} />
          {!collapsed && (
            <div className="sidebar-brand">
              <div className="sidebar-brand-name">QALogs</div>
              <div className="sidebar-brand-sub">Test Management</div>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div style={{ padding: collapsed ? '8px 0' : '8px 12px', display: 'flex', gap: 6, justifyContent: 'center', borderBottom: '1px solid var(--sidebar-border)' }}>
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button onClick={() => { setShowNotifications(p => !p); setShowUserMenu(false); }} title="Notifications"
              className="sidebar-link" style={{ padding: '0.375rem', width: 34, height: 34, justifyContent: 'center' }}>
              <FiBell size={15} />
              {notifications.length > 0 && <span className="header-action-badge" />}
            </button>
            {showNotifications && (
              <div style={{
                position: 'absolute', left: collapsed ? 'calc(100% + 8px)' : 0,
                bottom: collapsed ? 'auto' : '100%', top: collapsed ? 0 : 'auto',
                marginBottom: collapsed ? 0 : 8, marginLeft: collapsed ? 0 : 0,
                width: 300, maxHeight: 400, overflowY: 'auto',
                background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-xl)',
                zIndex: 1200,
              }}>
                <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Notifications</span>
                  {notifications.length > 0 && <span className="badge badge-danger">{notifications.length}</span>}
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: '30px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>No new notifications</div>
                ) : notifications.map((n, i) => (
                  <div key={n.id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}>
                    <div className="activity-avatar" style={{ width: 28, height: 28, fontSize: '0.6875rem' }}>
                      <FiBell size={12} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
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
              <div className={`sidebar-link ${isBoardActive ? 'active' : ''}`} onClick={() => { if (!collapsed) setBoardDropdownOpen(p => !p); }}
                style={{ justifyContent: collapsed ? 'center' : 'flex-start', margin: collapsed ? '2px 8px' : undefined }}>
                <FiTrello size={17} />
                {!collapsed && (
                  <>
                    <span style={{ flex: 1 }}>Board</span>
                    <FiChevronDown size={13} style={{ transition: 'transform 0.2s', transform: boardDropdownOpen ? 'rotate(180deg)' : 'rotate(0)', opacity: 0.5 }} />
                  </>
                )}
              </div>
              <div style={{ maxHeight: boardDropdownOpen || collapsed ? (boardSubItems.length * 40 + 8) : 0, overflow: 'hidden', transition: 'max-height 0.3s' }}>
                {boardSubItems.map((item) => (
                  <NavLink key={item.path} to={item.path}
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    onClick={() => { if (window.innerWidth < 768 && onToggleMobile) onToggleMobile(); }}
                    style={{ paddingLeft: collapsed ? undefined : 56, fontSize: '0.8125rem', justifyContent: collapsed ? 'center' : 'flex-start', margin: collapsed ? '1px 8px' : '1px 10px' }}>
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
                <NavLink key={item.path} to={item.path}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={() => { if (window.innerWidth < 768 && onToggleMobile) onToggleMobile(); }}
                  style={{ justifyContent: collapsed ? 'center' : 'flex-start', margin: collapsed ? '2px 8px' : undefined }}>
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
              <div style={{
                position: 'absolute', bottom: '100%', left: collapsed ? 'calc(100% + 8px)' : 12, right: collapsed ? 'auto' : 12,
                marginBottom: 8, width: collapsed ? 220 : 'auto',
                background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-xl)',
                overflow: 'hidden', zIndex: 1200,
              }}>
                <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: 2 }}>Signed in as</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user.firstName} {user.lastName}</div>
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
              {!collapsed && <FiChevronDown size={13} style={{ color: 'var(--sidebar-text)', opacity: 0.5, transition: 'transform 0.2s', transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0)' }} />}
            </div>
            {/* Visible Logout Button */}
            <button
              onClick={onLogout}
              className="sidebar-logout"
              style={{ justifyContent: collapsed ? 'center' : 'flex-start', margin: collapsed ? '4px 8px' : '4px 0' }}
              title="Sign Out"
            >
              <FiLogOut size={17} />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </div>
        )}

        {/* Collapse toggle */}
        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--sidebar-border)' }}>
          <button onClick={onToggleCollapse} className="sidebar-link" style={{ justifyContent: 'center', padding: '0.5rem', fontSize: '0.75rem' }}>
            {collapsed ? <FiChevronRight size={15} /> : <><FiChevronLeft size={15} /><span>Collapse</span></>}
          </button>
        </div>
      </nav>

      <style>{`
        .navbar-mobile-btn { display: none !important; }
        @media (max-width: 768px) {
          .navbar-mobile-btn { display: flex !important; }
          .sidebar { transform: translateX(-100%); width: 272px !important; }
          .sidebar.sidebar-mobile-open { transform: translateX(0); }
        }
        .sidebar-nav::-webkit-scrollbar { width: 3px; }
        .sidebar-nav::-webkit-scrollbar-track { background: transparent; }
        .sidebar-nav::-webkit-scrollbar-thumb { background: var(--sidebar-border); border-radius: 3px; }
      `}</style>
    </>
  );
}

export default Navbar;
