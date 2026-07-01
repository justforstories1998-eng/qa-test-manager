import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiFileText, FiPlay, FiBarChart2, FiSettings, FiChevronLeft, FiChevronRight, FiAlertTriangle, FiUser, FiLogOut, FiShield, FiMenu } from 'react-icons/fi';

function Navbar({ collapsed, onToggleCollapse, logo, user, onLogout, isAdmin, isMobileOpen, onToggleMobile }) {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: FiHome },
    { path: '/test-cases', label: 'Test Cases', icon: FiFileText },
    { path: '/execution', label: 'Execution', icon: FiPlay },
    { path: '/bugs', label: 'Bugs', icon: FiAlertTriangle },
    { path: '/reports', label: 'Reports', icon: FiBarChart2 },
    { path: '/settings', label: 'Settings', icon: FiSettings },
    ...(isAdmin ? [{ path: '/admin', label: 'Admin', icon: FiShield }] : [])
  ];

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button className="mobile-menu-btn" onClick={onToggleMobile} aria-label="Toggle menu">
        <FiMenu size={20} />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && <div className="sidebar-overlay visible" onClick={onToggleMobile} />}

      <nav className={`sidebar ${collapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <img src="/logo.svg" alt="QALogs" className="custom-logo" />
          </div>
          {!collapsed && <span className="logo-text">QALogs</span>}
        </div>
        <div className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => { if (window.innerWidth < 768 && onToggleMobile) onToggleMobile(); }}
            >
              <span className="nav-icon"><item.icon size={20} /></span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </div>
        
        {user && !collapsed && (
          <div className="sidebar-user">
            <div className="user-avatar-nav">
              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
            </div>
            <div className="user-info-nav">
              <div className="user-name-nav">{user.firstName} {user.lastName}</div>
              <div className="user-role-nav">{user.role === 'admin' ? 'Administrator' : 'User'}</div>
            </div>
            <button className="logout-btn" onClick={onLogout} title="Logout">
              <FiLogOut size={18} />
            </button>
          </div>
        )}
        
        <div className="sidebar-footer">
          <button className="sidebar-toggle" onClick={onToggleCollapse}>
            {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </div>
      </nav>
    </>
  );
}
export default Navbar;
