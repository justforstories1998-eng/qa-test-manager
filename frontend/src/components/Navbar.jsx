import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiFileText, FiPlay, FiBarChart2, FiSettings, FiChevronLeft, FiChevronRight, FiAlertTriangle } from 'react-icons/fi';

function Navbar({ collapsed, onToggleCollapse, logo }) {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: FiHome },
    { path: '/test-cases', label: 'Test Cases', icon: FiFileText },
    { path: '/execution', label: 'Execution', icon: FiPlay },
    { path: '/bugs', label: 'Bugs', icon: FiAlertTriangle }, // NEW
    { path: '/reports', label: 'Reports', icon: FiBarChart2 },
    { path: '/settings', label: 'Settings', icon: FiSettings }
  ];

  return (
    <nav className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          {logo ? <img src={logo} alt="Logo" className="custom-logo" /> : <div className="default-logo-icon">QA</div>}
        </div>
        {!collapsed && <span className="logo-text">QA Manager</span>}
      </div>
      <div className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path} className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon"><item.icon size={20} /></span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </NavLink>
        ))}
      </div>
      <div className="sidebar-footer">
        <button className="sidebar-toggle" onClick={onToggleCollapse}>
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>
    </nav>
  );
}
export default Navbar;