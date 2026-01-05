import React, { useState, useEffect } from 'react';
import {
  FiSettings,
  FiSave,
  FiRefreshCw,
  FiUser,
  FiPlay,
  FiFileText,
  FiCpu,
  FiDownload,
  FiBell,
  FiMonitor,
  FiCheck,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
  FiInfo,
  FiZap,
  FiGlobe,
  FiClock,
  FiHash
} from 'react-icons/fi';
import { toast } from 'react-toastify';

function Settings({ settings, onUpdateSettings }) {
  // ============================================
  // STATE
  // ============================================

  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    if (settings) {
      setFormData(JSON.parse(JSON.stringify(settings)));
    }
  }, [settings]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleInputChange = (category, field, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSaveCategory = async (category) => {
    setIsSaving(true);
    try {
      await onUpdateSettings(category, formData[category]);
      setHasChanges(false);
      toast.success(`${category.charAt(0).toUpperCase() + category.slice(1)} settings saved`);
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetCategory = (category) => {
    if (settings && settings[category]) {
      setFormData(prev => ({
        ...prev,
        [category]: JSON.parse(JSON.stringify(settings[category]))
      }));
      setHasChanges(false);
      toast.info('Changes discarded');
    }
  };

  const testGrokConnection = async () => {
    if (!formData.grokAI?.apiKey || formData.grokAI.apiKey === '••••••••') {
      toast.warning('Please enter a valid API key first');
      return;
    }

    toast.info('Testing connection...');

    try {
      // Save settings first to test with the new key
      await onUpdateSettings('grokAI', formData.grokAI);

      // The actual test would happen through the backend
      // For now, we'll just show success if the save worked
      toast.success('API key saved. Test a report to verify connection.');
    } catch (error) {
      toast.error('Failed to save API key');
    }
  };

  // ============================================
  // TAB CONFIGURATION
  // ============================================

  const tabs = [
    { id: 'general', label: 'General', icon: FiSettings },
    { id: 'execution', label: 'Execution', icon: FiPlay },
    { id: 'reporting', label: 'Reporting', icon: FiFileText },
    { id: 'grokAI', label: 'Grok AI', icon: FiCpu },
    { id: 'export', label: 'Export', icon: FiDownload },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'display', label: 'Display', icon: FiMonitor }
  ];

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderToggle = (category, field, label, description = null) => (
    <div className="setting-item">
      <div className="setting-info">
        <label className="setting-label">{label}</label>
        {description && <p className="setting-description">{description}</p>}
      </div>
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={formData[category]?.[field] || false}
          onChange={(e) => handleInputChange(category, field, e.target.checked)}
        />
        <span className="toggle-slider"></span>
      </label>
    </div>
  );

  const renderInput = (category, field, label, type = 'text', placeholder = '', description = null) => (
    <div className="setting-item vertical">
      <label className="setting-label">{label}</label>
      {description && <p className="setting-description">{description}</p>}
      <input
        type={type}
        value={formData[category]?.[field] || ''}
        onChange={(e) => handleInputChange(category, field, e.target.value)}
        placeholder={placeholder}
        className="setting-input"
      />
    </div>
  );

  const renderSelect = (category, field, label, options, description = null) => (
    <div className="setting-item vertical">
      <label className="setting-label">{label}</label>
      {description && <p className="setting-description">{description}</p>}
      <select
        value={formData[category]?.[field] || ''}
        onChange={(e) => handleInputChange(category, field, e.target.value)}
        className="setting-select"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  const renderNumber = (category, field, label, min = 0, max = 100, description = null) => (
    <div className="setting-item vertical">
      <label className="setting-label">{label}</label>
      {description && <p className="setting-description">{description}</p>}
      <input
        type="number"
        value={formData[category]?.[field] || 0}
        onChange={(e) => handleInputChange(category, field, parseInt(e.target.value, 10))}
        min={min}
        max={max}
        className="setting-input number"
      />
    </div>
  );

  // ============================================
  // RENDER TAB CONTENT
  // ============================================

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="settings-section">
            <div className="section-header">
              <h3>
                <FiSettings size={20} />
                General Settings
              </h3>
              <p>Configure basic application settings</p>
            </div>

            <div className="settings-group">
              <h4>
                <FiGlobe size={16} />
                Organization
              </h4>
              {renderInput('general', 'appName', 'Application Name', 'text', 'QA Test Manager')}
              {renderInput('general', 'organization', 'Organization Name', 'text', 'My Organization')}
              {renderInput('general', 'projectName', 'Default Project Name', 'text', 'Default Project')}
            </div>

            <div className="settings-group">
              <h4>
                <FiHash size={16} />
                Defaults
              </h4>
              {renderSelect('general', 'defaultPriority', 'Default Priority', [
                { value: 'Critical', label: 'Critical' },
                { value: 'High', label: 'High' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Low', label: 'Low' }
              ])}
              {renderSelect('general', 'defaultStatus', 'Default Status', [
                { value: 'Not Run', label: 'Not Run' },
                { value: 'Passed', label: 'Passed' },
                { value: 'Failed', label: 'Failed' },
                { value: 'Blocked', label: 'Blocked' }
              ])}
            </div>

            <div className="settings-group">
              <h4>
                <FiClock size={16} />
                Date & Time
              </h4>
              {renderSelect('general', 'dateFormat', 'Date Format', [
                { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                { value: 'MMM DD, YYYY', label: 'MMM DD, YYYY' }
              ])}
              {renderSelect('general', 'timeZone', 'Time Zone', [
                { value: 'UTC', label: 'UTC' },
                { value: 'America/New_York', label: 'Eastern Time' },
                { value: 'America/Chicago', label: 'Central Time' },
                { value: 'America/Denver', label: 'Mountain Time' },
                { value: 'America/Los_Angeles', label: 'Pacific Time' },
                { value: 'Europe/London', label: 'London' },
                { value: 'Europe/Paris', label: 'Paris' },
                { value: 'Asia/Tokyo', label: 'Tokyo' }
              ])}
            </div>
          </div>
        );

      case 'execution':
        return (
          <div className="settings-section">
            <div className="section-header">
              <h3>
                <FiPlay size={20} />
                Execution Settings
              </h3>
              <p>Configure test execution behavior</p>
            </div>

            <div className="settings-group">
              <h4>
                <FiSave size={16} />
                Auto-Save
              </h4>
              {renderToggle('execution', 'autoSaveResults', 'Auto-Save Results',
                'Automatically save test results after each status change')}
            </div>

            <div className="settings-group">
              <h4>
                <FiPlay size={16} />
                Navigation
              </h4>
              {renderToggle('execution', 'autoAdvanceOnPass', 'Auto-Advance on Pass',
                'Automatically move to next test when marking as Passed')}
              {renderToggle('execution', 'autoAdvanceOnFail', 'Auto-Advance on Fail',
                'Automatically move to next test when marking as Failed')}
              {renderToggle('execution', 'allowPartialExecution', 'Allow Partial Execution',
                'Allow completing a test run without executing all tests')}
            </div>

            <div className="settings-group">
              <h4>
                <FiFileText size={16} />
                Comments
              </h4>
              {renderToggle('execution', 'requireCommentsOnFail', 'Require Comments on Fail',
                'Require testers to add comments when marking tests as Failed')}
              {renderToggle('execution', 'requireCommentsOnBlocked', 'Require Comments on Blocked',
                'Require testers to add comments when marking tests as Blocked')}
            </div>

            <div className="settings-group">
              <h4>
                <FiUser size={16} />
                Tester
              </h4>
              {renderInput('execution', 'defaultTester', 'Default Tester Name', 'text', 'Enter default tester name',
                'Pre-fill tester name for new test runs')}
              {renderNumber('execution', 'sessionTimeout', 'Session Timeout (minutes)', 5, 120,
                'Auto-save and warn after inactivity')}
            </div>
          </div>
        );

      case 'reporting':
        return (
          <div className="settings-section">
            <div className="section-header">
              <h3>
                <FiFileText size={20} />
                Reporting Settings
              </h3>
              <p>Configure report generation options</p>
            </div>

            <div className="settings-group">
              <h4>
                <FiCheck size={16} />
                Include in Reports
              </h4>
              {renderToggle('reporting', 'includePassedTests', 'Include Passed Tests')}
              {renderToggle('reporting', 'includeFailedTests', 'Include Failed Tests')}
              {renderToggle('reporting', 'includeBlockedTests', 'Include Blocked Tests')}
              {renderToggle('reporting', 'includeNotRunTests', 'Include Not Run Tests')}
              {renderToggle('reporting', 'includeExecutionTime', 'Include Execution Time')}
              {renderToggle('reporting', 'includeComments', 'Include Comments')}
              {renderToggle('reporting', 'includeScreenshots', 'Include Screenshots (if available)')}
            </div>

            <div className="settings-group">
              <h4>
                <FiFileText size={16} />
                Branding
              </h4>
              {renderInput('reporting', 'reportHeader', 'Report Header', 'text', 'QA Test Execution Report')}
              {renderInput('reporting', 'reportFooter', 'Report Footer', 'text', 'Confidential - Internal Use Only')}
              {renderInput('reporting', 'companyLogo', 'Company Logo URL', 'url', 'https://example.com/logo.png',
                'URL to your company logo for report headers')}
            </div>
          </div>
        );

      case 'grokAI':
        return (
          <div className="settings-section">
            <div className="section-header">
              <h3>
                <FiCpu size={20} />
                Grok AI Settings
              </h3>
              <p>Configure AI-powered analysis integration</p>
            </div>

            <div className="settings-group">
              <h4>
                <FiZap size={16} />
                Enable AI
              </h4>
              {renderToggle('grokAI', 'enabled', 'Enable Grok AI',
                'Enable AI-powered test analysis and recommendations')}
            </div>

            {formData.grokAI?.enabled && (
              <>
                <div className="settings-group">
                  <h4>
                    <FiSettings size={16} />
                    API Configuration
                  </h4>
                  
                  <div className="setting-item vertical">
                    <label className="setting-label">API Key</label>
                    <p className="setting-description">Your xAI Grok API key</p>
                    <div className="input-with-button">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={formData.grokAI?.apiKey || ''}
                        onChange={(e) => handleInputChange('grokAI', 'apiKey', e.target.value)}
                        placeholder="Enter your Grok API key"
                        className="setting-input"
                      />
                      <button
                        type="button"
                        className="btn btn-icon"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                  </div>

                  {renderInput('grokAI', 'apiEndpoint', 'API Endpoint', 'url', 
                    'https://api.x.ai/v1/chat/completions',
                    'Grok API endpoint URL')}
                  
                  {renderSelect('grokAI', 'model', 'Model', [
                    { value: 'grok-beta', label: 'Grok Beta' },
                    { value: 'grok-2', label: 'Grok 2' },
                    { value: 'grok-2-mini', label: 'Grok 2 Mini' }
                  ], 'Select the Grok model to use')}
                </div>

                <div className="settings-group">
                  <h4>
                    <FiHash size={16} />
                    Model Parameters
                  </h4>
                  {renderNumber('grokAI', 'maxTokens', 'Max Tokens', 256, 8192,
                    'Maximum tokens for AI response')}
                  
                  <div className="setting-item vertical">
                    <label className="setting-label">Temperature</label>
                    <p className="setting-description">
                      Controls randomness (0 = focused, 1 = creative)
                    </p>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.grokAI?.temperature || 0.7}
                      onChange={(e) => handleInputChange('grokAI', 'temperature', parseFloat(e.target.value))}
                      className="setting-range"
                    />
                    <span className="range-value">{formData.grokAI?.temperature || 0.7}</span>
                  </div>
                </div>

                <div className="settings-group">
                  <h4>
                    <FiFileText size={16} />
                    Analysis Options
                  </h4>
                  {renderToggle('grokAI', 'includeSummary', 'Include Executive Summary')}
                  {renderToggle('grokAI', 'includeRecommendations', 'Include Recommendations')}
                  {renderToggle('grokAI', 'includeRiskAnalysis', 'Include Risk Analysis')}
                </div>

                <div className="settings-group">
                  <button
                    className="btn btn-secondary"
                    onClick={testGrokConnection}
                  >
                    <FiZap size={16} />
                    Test Connection
                  </button>
                </div>
              </>
            )}

            <div className="info-box">
              <FiInfo size={18} />
              <div>
                <strong>About Grok AI</strong>
                <p>
                  Grok is an AI assistant developed by xAI. To use this feature, 
                  you need an API key from <a href="https://x.ai" target="_blank" rel="noopener noreferrer">x.ai</a>.
                </p>
              </div>
            </div>
          </div>
        );

      case 'export':
        return (
          <div className="settings-section">
            <div className="section-header">
              <h3>
                <FiDownload size={20} />
                Export Settings
              </h3>
              <p>Configure document export options</p>
            </div>

            <div className="settings-group">
              <h4>
                <FiFileText size={16} />
                Default Format
              </h4>
              {renderSelect('export', 'defaultFormat', 'Default Export Format', [
                { value: 'pdf', label: 'PDF Document' },
                { value: 'word', label: 'Word Document (DOCX)' }
              ])}
            </div>

            <div className="settings-group">
              <h4>
                <FiFileText size={16} />
                PDF Options
              </h4>
              {renderSelect('export', 'pdfPageSize', 'Page Size', [
                { value: 'A4', label: 'A4' },
                { value: 'Letter', label: 'Letter' },
                { value: 'Legal', label: 'Legal' }
              ])}
              {renderSelect('export', 'pdfOrientation', 'Orientation', [
                { value: 'portrait', label: 'Portrait' },
                { value: 'landscape', label: 'Landscape' }
              ])}
            </div>

            <div className="settings-group">
              <h4>
                <FiFileText size={16} />
                Word Options
              </h4>
              {renderSelect('export', 'wordTemplate', 'Template Style', [
                { value: 'professional', label: 'Professional' },
                { value: 'minimal', label: 'Minimal' },
                { value: 'detailed', label: 'Detailed' }
              ])}
            </div>

            <div className="settings-group">
              <h4>
                <FiCheck size={16} />
                Content Options
              </h4>
              {renderToggle('export', 'includeTableOfContents', 'Include Table of Contents')}
              {renderToggle('export', 'includeCharts', 'Include Charts')}
              {renderToggle('export', 'includeMetrics', 'Include Metrics Summary')}
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="settings-section">
            <div className="section-header">
              <h3>
                <FiBell size={20} />
                Notification Settings
              </h3>
              <p>Configure notification preferences</p>
            </div>

            <div className="settings-group">
              <h4>
                <FiBell size={16} />
                Message Types
              </h4>
              {renderToggle('notifications', 'showSuccessMessages', 'Show Success Messages',
                'Display notifications for successful operations')}
              {renderToggle('notifications', 'showErrorMessages', 'Show Error Messages',
                'Display notifications for errors')}
              {renderToggle('notifications', 'showWarningMessages', 'Show Warning Messages',
                'Display notifications for warnings')}
            </div>

            <div className="settings-group">
              <h4>
                <FiClock size={16} />
                Duration
              </h4>
              {renderNumber('notifications', 'autoHideDuration', 'Auto-Hide Duration (ms)', 1000, 10000,
                'How long notifications stay visible')}
            </div>
          </div>
        );

      case 'display':
        return (
          <div className="settings-section">
            <div className="section-header">
              <h3>
                <FiMonitor size={20} />
                Display Settings
              </h3>
              <p>Configure UI appearance</p>
            </div>

            <div className="settings-group">
              <h4>
                <FiMonitor size={16} />
                Theme
              </h4>
              {renderSelect('display', 'theme', 'Color Theme', [
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark (Coming Soon)' },
                { value: 'system', label: 'System Preference' }
              ])}
            </div>

            <div className="settings-group">
              <h4>
                <FiHash size={16} />
                Tables
              </h4>
              {renderNumber('display', 'itemsPerPage', 'Items Per Page', 10, 100,
                'Number of items to show in tables')}
              {renderToggle('display', 'showTestCaseIds', 'Show Test Case IDs')}
              {renderToggle('display', 'showPriority', 'Show Priority Column')}
              {renderToggle('display', 'showAssignee', 'Show Assignee Column')}
              {renderToggle('display', 'compactMode', 'Compact Mode',
                'Reduce spacing for more content')}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="settings-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <h2 className="section-title">Settings</h2>
          <p className="section-description">
            Configure application preferences and options
          </p>
        </div>
      </div>

      <div className="settings-layout">
        {/* Settings Navigation */}
        <nav className="settings-nav">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Settings Content */}
        <div className="settings-content">
          {renderTabContent()}

          {/* Save Actions */}
          <div className="settings-actions">
            <button
              className="btn btn-secondary"
              onClick={() => handleResetCategory(activeTab)}
              disabled={!hasChanges}
            >
              <FiRefreshCw size={16} />
              Reset Changes
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleSaveCategory(activeTab)}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <FiRefreshCw size={16} className="spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FiSave size={16} />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;