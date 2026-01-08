import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiHome, FiFileText, FiPlay, FiBarChart2, FiSettings, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../api';

function Navbar({ collapsed, onToggleCollapse }) {
  const location = useLocation();
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    api.getSettings().then(res => {
      if (res.success && res.data.general?.logo) {
        setLogo(res.data.general.logo);
      }
    });
  }, []);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: FiHome },
    { path: '/test-cases', label: 'Test Cases', icon: FiFileText },
    { path: '/execution', label: 'Execution', icon: FiPlay },
    { path: '/reports', label: 'Reports', icon: FiBarChart2 },
    { path: '/settings', label: 'Settings', icon: FiSettings }
  ];

  return (
    <nav className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          {logo ? (
            <img src={logo} alt="App Logo" className="custom-logo" />
          ) : (
            <div className="default-logo-icon">QA</div>
          )}
        </div>
        {!collapsed && <span className="logo-text">QA Manager</span>}
      </div>

      <div className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path} className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon"><item.icon /></span>
            {!collapsed && <span>{item.label}</span>}
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