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
      {/* SIDEBAR HEADER: This area is now forced dark by CSS */}
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
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">
              <item.icon size={20} />
            </span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </NavLink>
        ))}
      </div>

      {/* SIDEBAR FOOTER (Toggle Button) */}
      <div className="sidebar-footer">
        <button 
          className="sidebar-toggle" 
          onClick={onToggleCollapse}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;