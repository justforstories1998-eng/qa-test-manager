import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FiHome, 
  FiFileText, 
  FiPlay, 
  FiBarChart2, 
  FiSettings, 
  FiChevronLeft, 
  FiChevronRight 
} from 'react-icons/fi';

function Navbar({ collapsed, onToggleCollapse, logo }) {
  // Navigation Configuration
  const navItems = [
    { path: '/', label: 'Dashboard', icon: FiHome },
    { path: '/test-cases', label: 'Test Cases', icon: FiFileText },
    { path: '/execution', label: 'Execution', icon: FiPlay },
    { path: '/reports', label: 'Reports', icon: FiBarChart2 },
    { path: '/settings', label: 'Settings', icon: FiSettings }
  ];

  return (
    <nav className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* SIDEBAR HEADER */}
      <div className="sidebar-header">
        <div className="logo-container">
          {logo ? (
            <img src={logo} alt="Logo" className="custom-logo" />
          ) : (
            <div className="default-logo-icon">QA</div>
          )}
        </div>
        {!collapsed && <span className="logo-text">QA Manager</span>}
      </div>

      {/* NAVIGATION LINKS */}
      <div className="sidebar-nav">
        <div className="nav-section-label">
          {!collapsed && <span>MENU</span>}
        </div>
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon-wrapper">
              <span className="nav-icon">
                <item.icon size={20} />
              </span>
            </span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
            {!collapsed && <span className="nav-indicator"></span>}
          </NavLink>
        ))}
      </div>

      {/* SIDEBAR FOOTER (Toggle Button) */}
      <div className="sidebar-footer">
        <div className="footer-content">
          {!collapsed && (
            <div className="footer-info">
              <span className="footer-version">v2.0.1</span>
            </div>
          )}
          <button 
            className="sidebar-toggle" 
            onClick={onToggleCollapse}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;