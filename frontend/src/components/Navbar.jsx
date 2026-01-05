import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiFileText,
  FiPlay,
  FiBarChart2,
  FiSettings,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';

function Navbar({ collapsed, onToggleCollapse }) {
  const location = useLocation();

  // Navigation items configuration
  const navItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: FiHome,
      description: 'Overview & metrics'
    },
    {
      path: '/test-cases',
      label: 'Test Cases',
      icon: FiFileText,
      description: 'Manage test cases'
    },
    {
      path: '/execution',
      label: 'Execution',
      icon: FiPlay,
      description: 'Run tests'
    },
    {
      path: '/reports',
      label: 'Reports',
      icon: FiBarChart2,
      description: 'Generate reports'
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: FiSettings,
      description: 'Configuration'
    }
  ];

  // Get current page title
  const getCurrentPageTitle = () => {
    const currentItem = navItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.label : 'QA Test Manager';
  };

  return (
    <>
      {/* Sidebar Navigation */}
      <nav className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        {/* Logo Section */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">QA</div>
            {!collapsed && (
              <div className="logo-text">
                <span className="logo-title">QA Test Manager</span>
                <span className="logo-subtitle">v1.0.0</span>
              </div>
            )}
          </div>
          
          {/* Collapse Toggle */}
          <button 
            className="sidebar-toggle"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </div>

        {/* Navigation Links */}
        <div className="sidebar-nav">
          <ul className="nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path} className="nav-item">
                  <NavLink
                    to={item.path}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    title={collapsed ? item.label : ''}
                  >
                    <span className="nav-icon">
                      <Icon size={20} />
                    </span>
                    {!collapsed && (
                      <span className="nav-label">{item.label}</span>
                    )}
                    {isActive && <span className="nav-indicator"></span>}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Sidebar Footer */}
        {!collapsed && (
          <div className="sidebar-footer">
            <div className="sidebar-footer-content">
              <div className="footer-status">
                <span className="status-dot online"></span>
                <span className="status-text">System Online</span>
              </div>
              <div className="footer-info">
                © 2024 QA Team
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Top Header Bar */}
      <header className="top-header">
        <div className="header-left">
          <h1 className="page-title">{getCurrentPageTitle()}</h1>
        </div>
        
        <div className="header-right">
          {/* Quick Stats */}
          <div className="header-stats">
            <div className="header-stat" title="Total Test Cases">
              <FiFileText size={16} />
              <span className="stat-label">Tests</span>
            </div>
            <div className="header-stat" title="Active Runs">
              <FiPlay size={16} />
              <span className="stat-label">Runs</span>
            </div>
          </div>
          
          {/* Current Date/Time */}
          <div className="header-datetime">
            <CurrentDateTime />
          </div>
        </div>
      </header>
    </>
  );
}

// Current DateTime Component
function CurrentDateTime() {
  const [dateTime, setDateTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="datetime-display">
      <span className="date">{formatDate(dateTime)}</span>
      <span className="time">{formatTime(dateTime)}</span>
    </div>
  );
}

export default Navbar;