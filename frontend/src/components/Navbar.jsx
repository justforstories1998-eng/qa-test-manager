import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiFileText,
  FiPlay,
  FiBarChart2,
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
  FiAlertTriangle,
  FiLogOut,
  FiShield,
  FiMenu,
  FiX,
  FiSun,
  FiMoon,
  FiBell,
  FiChevronDown,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo
} from 'react-icons/fi';
import api from '../api';

function Navbar({ collapsed, onToggleCollapse, logo, user, onLogout, isAdmin, isMobileOpen, onToggleMobile }) {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [notifications, setNotifications] = useState([]);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.getBugs();
        if (res.success && res.data) {
          const recent = res.data.slice(0, 10).map(bug => ({
            id: bug._id,
            title: bug.title,
            type: bug.severity === 'Critical' ? 'critical' : bug.severity === 'High' ? 'warning' : 'info',
            time: new Date(bug.createdAt || bug.updatedAt).toLocaleDateString(),
            read: false,
          }));
          setNotifications(recent);
        }
      } catch (e) {
        setNotifications([]);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const navSections = [
    {
      title: 'Main',
      items: [
        { path: '/', label: 'Dashboard', icon: FiHome, badge: null },
        { path: '/test-cases', label: 'Test Cases', icon: FiFileText, badge: null },
        { path: '/execution', label: 'Execution', icon: FiPlay, badge: null },
      ]
    },
    {
      title: 'Analysis',
      items: [
        { path: '/bugs', label: 'Bugs', icon: FiAlertTriangle, badge: 5, badgeColor: '#ef4444' },
        { path: '/reports', label: 'Reports', icon: FiBarChart2, badge: null },
      ]
    },
    {
      title: 'System',
      items: [
        { path: '/settings', label: 'Settings', icon: FiSettings, badge: null },
        ...(isAdmin ? [{ path: '/admin', label: 'Admin Panel', icon: FiShield, badge: null }] : [])
      ]
    }
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showUserMenu && !e.target.closest('.navbar-user-section')) {
        setShowUserMenu(false);
      }
      if (showNotifications && !e.target.closest('.navbar-notifications')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu, showNotifications]);

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileOpen]);

  const getInitials = (u) => {
    if (!u) return '??';
    return `${u.firstName?.charAt(0) || ''}${u.lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const styles = {
    mobileMenuBtn: {
      position: 'fixed',
      top: '16px',
      left: '16px',
      zIndex: 1100,
      width: '44px',
      height: '44px',
      borderRadius: '12px',
      border: 'none',
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      color: '#fff',
      display: 'none',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      zIndex: 1050,
      opacity: isMobileOpen ? 1 : 0,
      visibility: isMobileOpen ? 'visible' : 'hidden',
      transition: 'all 0.3s ease',
    },
    sidebar: {
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
        width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
      background: isDarkMode
        ? 'linear-gradient(180deg, #0f0f23 0%, #1a1a3e 100%)'
        : 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1060,
      transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      borderRight: '1px solid rgba(255, 255, 255, 0.06)',
      overflow: 'hidden',
    },
    header: {
      padding: collapsed ? '24px 16px 20px' : '24px 24px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: collapsed ? 'center' : 'flex-start',
      gap: '14px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      minHeight: '80px',
      flexShrink: 0,
    },
    logoWrapper: {
      width: collapsed ? '42px' : 'auto',
      height: '42px',
      borderRadius: '12px',
      background: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      position: 'relative',
      overflow: 'hidden',
    },
    logoShine: {
      display: 'none',
    },
    logoImg: {
      height: '36px',
      width: 'auto',
      objectFit: 'contain',
      position: 'relative',
      zIndex: 1,
    },
    logoImgCollapsed: {
      height: '36px',
      width: '36px',
      objectFit: 'cover',
      objectPosition: 'left center',
      position: 'relative',
      zIndex: 1,
      borderRadius: '8px',
    },
    logoTextContainer: {
      display: 'flex',
      flexDirection: 'column',
      opacity: collapsed ? 0 : 1,
      transform: collapsed ? 'translateX(-10px)' : 'translateX(0)',
      transition: 'all 0.3s ease',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
    },
    logoText: {
      fontSize: '20px',
      fontWeight: '800',
      background: 'linear-gradient(135deg, #fff 0%, #c7d2fe 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      letterSpacing: '-0.5px',
      lineHeight: 1.2,
    },
    logoSubtext: {
      fontSize: '10px',
      color: 'rgba(148, 163, 184, 0.7)',
      letterSpacing: '2px',
      textTransform: 'uppercase',
      fontWeight: '500',
    },
    quickActions: {
      padding: collapsed ? '16px 12px' : '16px 20px',
      display: 'flex',
      gap: '8px',
      justifyContent: collapsed ? 'center' : 'flex-start',
      flexShrink: 0,
    },
    quickActionBtn: (isActive) => ({
      width: '36px',
      height: '36px',
      borderRadius: '10px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
      color: isActive ? '#818cf8' : 'rgba(148, 163, 184, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      position: 'relative',
    }),
    notificationDot: {
      position: 'absolute',
      top: '6px',
      right: '6px',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: '#ef4444',
      border: '2px solid #1e293b',
    },
    scrollArea: {
      flex: 1,
      overflowY: 'auto',
      overflowX: 'hidden',
      padding: '8px 0',
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgba(255,255,255,0.1) transparent',
    },
    sectionTitle: {
      fontSize: '10px',
      fontWeight: '600',
      color: 'rgba(148, 163, 184, 0.5)',
      letterSpacing: '1.5px',
      textTransform: 'uppercase',
      padding: collapsed ? '20px 0 8px' : '20px 28px 8px',
      opacity: collapsed ? 0 : 1,
      height: collapsed ? '12px' : 'auto',
      transition: 'opacity 0.3s ease',
    },
    navLink: (isActive, isHovered) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      padding: collapsed ? '12px 0' : '11px 24px',
      margin: collapsed ? '2px 12px' : '2px 12px',
      borderRadius: '12px',
      textDecoration: 'none',
      color: isActive ? '#fff' : isHovered ? '#e2e8f0' : 'rgba(148, 163, 184, 0.85)',
      background: isActive
        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)'
        : isHovered
          ? 'rgba(255, 255, 255, 0.04)'
          : 'transparent',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      justifyContent: collapsed ? 'center' : 'flex-start',
      cursor: 'pointer',
      borderLeft: isActive ? 'none' : 'none',
      overflow: 'hidden',
    }),
    activeIndicator: {
      position: 'absolute',
      left: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      width: '3px',
      height: '60%',
      borderRadius: '0 4px 4px 0',
      background: 'linear-gradient(180deg, #6366f1, #8b5cf6)',
      boxShadow: '0 0 12px rgba(99, 102, 241, 0.5)',
    },
    navIconWrapper: (isActive) => ({
      width: '38px',
      height: '38px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isActive
        ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
        : 'rgba(255, 255, 255, 0.04)',
      transition: 'all 0.25s ease',
      flexShrink: 0,
      boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.35)' : 'none',
    }),
    navLabel: {
      fontSize: '14px',
      fontWeight: '500',
      opacity: collapsed ? 0 : 1,
      transform: collapsed ? 'translateX(-10px)' : 'translateX(0)',
      transition: 'all 0.3s ease',
      whiteSpace: 'nowrap',
      flex: 1,
    },
    badge: (color) => ({
      padding: '2px 8px',
      borderRadius: '10px',
      fontSize: '11px',
      fontWeight: '700',
      background: `${color}20`,
      color: color,
      opacity: collapsed ? 0 : 1,
      transition: 'opacity 0.3s ease',
      letterSpacing: '0.5px',
    }),
    tooltip: {
      position: 'absolute',
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginLeft: '16px',
      padding: '8px 14px',
      background: '#1e293b',
      color: '#fff',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '500',
      whiteSpace: 'nowrap',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
      zIndex: 1100,
      pointerEvents: 'none',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    tooltipArrow: {
      position: 'absolute',
      left: '-5px',
      top: '50%',
      transform: 'translateY(-50%) rotate(45deg)',
      width: '10px',
      height: '10px',
      background: '#1e293b',
      borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    },
    userSection: {
      padding: collapsed ? '16px 12px' : '16px 16px',
      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
      position: 'relative',
      flexShrink: 0,
    },
    userCard: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: collapsed ? '10px 0' : '10px 12px',
      borderRadius: '14px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      justifyContent: collapsed ? 'center' : 'flex-start',
      background: showUserMenu ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
    },
    avatar: {
      width: '40px',
      height: '40px',
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: '700',
      color: '#fff',
      flexShrink: 0,
      position: 'relative',
      boxShadow: '0 2px 10px rgba(99, 102, 241, 0.3)',
    },
    onlineDot: {
      position: 'absolute',
      bottom: '-1px',
      right: '-1px',
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      background: '#22c55e',
      border: '2.5px solid #1e293b',
    },
    userInfo: {
      flex: 1,
      opacity: collapsed ? 0 : 1,
      transition: 'opacity 0.3s ease',
      overflow: 'hidden',
      minWidth: 0,
    },
    userName: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#f1f5f9',
      lineHeight: 1.3,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    userRole: {
      fontSize: '11px',
      color: 'rgba(148, 163, 184, 0.7)',
      fontWeight: '500',
      whiteSpace: 'nowrap',
    },
    userMenuDropdown: {
      position: 'absolute',
      bottom: '100%',
      left: '12px',
      right: '12px',
      marginBottom: '8px',
      background: '#1e293b',
      borderRadius: '14px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
      overflow: 'hidden',
      opacity: showUserMenu ? 1 : 0,
      transform: showUserMenu ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.97)',
      visibility: showUserMenu ? 'visible' : 'hidden',
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 1200,
    },
    userMenuHeader: {
      padding: '16px 16px 12px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    },
    userMenuGreeting: {
      fontSize: '11px',
      color: 'rgba(148, 163, 184, 0.6)',
      fontWeight: '500',
      marginBottom: '2px',
    },
    userMenuName: {
      fontSize: '15px',
      fontWeight: '700',
      color: '#f1f5f9',
    },
    userMenuEmail: {
      fontSize: '12px',
      color: 'rgba(148, 163, 184, 0.6)',
      marginTop: '4px',
    },
    userMenuItem: (isDestructive) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '11px 16px',
      color: isDestructive ? '#f87171' : 'rgba(203, 213, 225, 0.9)',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      fontSize: '13px',
      fontWeight: '500',
      background: 'transparent',
      border: 'none',
      width: '100%',
      textAlign: 'left',
    }),
    collapseBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: collapsed ? '40px' : '100%',
      height: '40px',
      margin: collapsed ? '8px auto 16px' : '8px 16px 16px',
      borderRadius: '10px',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      background: 'rgba(255, 255, 255, 0.03)',
      color: 'rgba(148, 163, 184, 0.7)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      gap: '8px',
      fontSize: '12px',
      fontWeight: '500',
      flexShrink: 0,
    },
    notificationDropdown: {
      position: 'absolute',
      bottom: '100%',
      right: '0',
      marginBottom: '8px',
      width: '320px',
      background: '#1e293b',
      borderRadius: '14px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
      overflow: 'hidden',
      opacity: showNotifications ? 1 : 0,
      transform: showNotifications ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.97)',
      visibility: showNotifications ? 'visible' : 'hidden',
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 1200,
    },
    notificationHeader: {
      padding: '14px 16px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    notificationTitle: {
      fontSize: '14px',
      fontWeight: '700',
      color: '#f1f5f9',
    },
    notificationBadge: {
      padding: '2px 8px',
      borderRadius: '10px',
      fontSize: '11px',
      fontWeight: '700',
      background: 'rgba(239, 68, 68, 0.15)',
      color: '#f87171',
    },
    notificationItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '12px 16px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
      cursor: 'pointer',
      transition: 'background 0.15s ease',
    },
    notificationIcon: (type) => ({
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      background: type === 'critical' ? 'rgba(239, 68, 68, 0.15)' : type === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)',
      color: type === 'critical' ? '#f87171' : type === 'warning' ? '#fbbf24' : '#818cf8',
    }),
    notificationText: {
      flex: 1,
      minWidth: 0,
    },
    notificationItemTitle: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#e2e8f0',
      lineHeight: 1.3,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    notificationItemTime: {
      fontSize: '11px',
      color: 'rgba(148, 163, 184, 0.6)',
      marginTop: '2px',
    },
    notificationEmpty: {
      padding: '30px 16px',
      textAlign: 'center',
      color: 'rgba(148, 163, 184, 0.5)',
      fontSize: '13px',
    },
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        style={styles.mobileMenuBtn}
        className="navbar-mobile-btn"
        onClick={onToggleMobile}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
      </button>

      {/* Overlay */}
      <div style={styles.overlay} onClick={onToggleMobile} />

      {/* Sidebar */}
      <nav
        style={styles.sidebar}
        className={`navbar-sidebar ${isMobileOpen ? 'navbar-mobile-open' : ''}`}
      >
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoWrapper}>
            <img
              src="/logo.jpg"
              alt="QALogs"
              style={collapsed ? styles.logoImgCollapsed : styles.logoImg}
            />
          </div>
          {!collapsed && (
            <div style={styles.logoTextContainer}>
              <span style={styles.logoText}>QALogs</span>
              <span style={styles.logoSubtext}>Test Management</span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={styles.quickActions}>
          {!collapsed && (
            <>
              <div style={{ position: 'relative' }} className="navbar-notifications">
                <button
                  style={styles.quickActionBtn(notifications.length > 0)}
                  onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                  title="Notifications"
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = notifications.length > 0 ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = notifications.length > 0 ? '#818cf8' : 'rgba(148, 163, 184, 0.8)'; }}
                >
                  <FiBell size={16} />
                  {notifications.length > 0 && <div style={styles.notificationDot} />}
                </button>
                <div style={styles.notificationDropdown}>
                  <div style={styles.notificationHeader}>
                    <span style={styles.notificationTitle}>Notifications</span>
                    {notifications.length > 0 && <span style={styles.notificationBadge}>{notifications.length}</span>}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={styles.notificationEmpty}>No new notifications</div>
                  ) : (
                    notifications.map((n, i) => (
                      <div
                        key={n.id || i}
                        style={styles.notificationItem}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={styles.notificationIcon(n.type)}>
                          {n.type === 'critical' ? <FiAlertCircle size={16} /> : n.type === 'warning' ? <FiAlertTriangle size={16} /> : <FiInfo size={16} />}
                        </div>
                        <div style={styles.notificationText}>
                          <div style={styles.notificationItemTitle}>{n.title}</div>
                          <div style={styles.notificationItemTime}>{n.time}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <button
                style={styles.quickActionBtn(isDarkMode)}
                onClick={() => setIsDarkMode(!isDarkMode)}
                title="Toggle theme"
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = isDarkMode ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)'; }}
              >
                {isDarkMode ? <FiSun size={16} /> : <FiMoon size={16} />}
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <div style={styles.scrollArea} className="navbar-scroll-area">
          {navSections.map((section, sIdx) => (
            <div key={sIdx}>
              {section.items.length > 0 && (
                <div style={styles.sectionTitle}>{section.title}</div>
              )}
              {section.items.map((item) => {
                const isActive = location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                const isHovered = hoveredItem === item.path;
                const itemKey = item.path;

                return (
                  <div key={itemKey} style={{ position: 'relative' }}>
                    <NavLink
                      to={item.path}
                      style={styles.navLink(isActive, isHovered)}
                      onMouseEnter={() => setHoveredItem(item.path)}
                      onMouseLeave={() => setHoveredItem(null)}
                      onClick={() => {
                        if (window.innerWidth < 768 && onToggleMobile) onToggleMobile();
                      }}
                    >
                      {isActive && <div style={styles.activeIndicator} />}
                      <div style={styles.navIconWrapper(isActive)}>
                        <item.icon size={18} color={isActive ? '#fff' : undefined} />
                      </div>
                      <span style={styles.navLabel}>{item.label}</span>
                      {item.badge && !collapsed && (
                        <span style={styles.badge(item.badgeColor || '#6366f1')}>{item.badge}</span>
                      )}
                    </NavLink>

                    {/* Tooltip for collapsed state */}
                    {collapsed && isHovered && (
                      <div style={styles.tooltip}>
                        <div style={styles.tooltipArrow} />
                        {item.label}
                        {item.badge && (
                          <span style={{ ...styles.badge(item.badgeColor || '#6366f1'), marginLeft: '8px', opacity: 1 }}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Section */}
        {user && (
          <div style={styles.userSection} className="navbar-user-section">
            {/* User Menu Dropdown */}
            <div style={styles.userMenuDropdown}>
              <div style={styles.userMenuHeader}>
                <div style={styles.userMenuGreeting}>{getGreeting()}</div>
                <div style={styles.userMenuName}>{user.firstName} {user.lastName}</div>
                {user.email && <div style={styles.userMenuEmail}>{user.email}</div>}
              </div>
              <div style={{ padding: '6px 0' }}>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '6px 0' }}>
                <button
                  style={styles.userMenuItem(true)}
                  onClick={onLogout}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <FiLogOut size={15} /> Sign Out
                </button>
              </div>
            </div>

            {/* User Card */}
            <div
              style={styles.userCard}
              onClick={() => !collapsed && setShowUserMenu(!showUserMenu)}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { if (!showUserMenu) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={styles.avatar}>
                {getInitials(user)}
                <div style={styles.onlineDot} />
              </div>
              {!collapsed && (
                <>
                  <div style={styles.userInfo}>
                    <div style={styles.userName}>{user.firstName} {user.lastName}</div>
                    <div style={styles.userRole}>
                      {user.role === 'admin' ? '🛡️ Administrator' : '👤 Team Member'}
                    </div>
                  </div>
                  <FiChevronDown
                    size={14}
                    style={{
                      color: 'rgba(148, 163, 184, 0.5)',
                      transition: 'transform 0.2s ease',
                      transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0)',
                      flexShrink: 0,
                    }}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Collapse Toggle */}
        <button
          style={styles.collapseBtn}
          onClick={onToggleCollapse}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.color = 'rgba(148, 163, 184, 0.7)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
          }}
        >
          {collapsed ? <FiChevronRight size={16} /> : (
            <>
              <FiChevronLeft size={16} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </nav>

      {/* Dynamic CSS */}
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
            width: 280px !important;
          }
          .navbar-sidebar.navbar-mobile-open {
            transform: translateX(0) !important;
          }
        }
        
        .navbar-scroll-area::-webkit-scrollbar {
          width: 4px;
        }
        .navbar-scroll-area::-webkit-scrollbar-track {
          background: transparent;
        }
        .navbar-scroll-area::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 4px;
        }
        .navbar-scroll-area::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        
        @keyframes navbarSlideIn {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

export default Navbar;
