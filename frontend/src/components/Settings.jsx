import React, { useState, useEffect } from 'react';
import { 
  FiSettings, FiSave, FiRefreshCw, FiPlay, FiFileText, FiCpu, 
  FiDownload, FiMonitor, FiEye, FiEyeOff, FiInfo, FiImage, FiTrash2, FiBell,
  FiCheck, FiChevronRight, FiShield, FiZap, FiGlobe, FiClock, FiLock,
  FiUpload, FiAlertTriangle, FiCheckCircle
} from 'react-icons/fi';
import { toast } from 'react-toastify';

function Settings({ settings, onUpdateSettings }) {
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(JSON.parse(JSON.stringify(settings)));
    } else {
      setFormData({
        general: { organization: '', projectName: 'Default', dateFormat: 'YYYY-MM-DD', timeZone: 'UTC', logo: '' },
        execution: { autoSave: true, autoAdvance: false, requireCommentsOnFail: true, sessionTimeout: 30 },
        reporting: { includePassedTests: true, includeFailedTests: true, includeCharts: true, reportHeader: 'QA Report', reportFooter: 'Confidential' },
        grokAI: { enabled: false, provider: 'gemini', apiKey: '', model: 'grok-beta', maxTokens: 2048 },
        export: { defaultFormat: 'pdf', pdfPageSize: 'A4', wordTemplate: 'professional' },
        notifications: { showSuccess: true, showErrors: true, duration: 3000 },
        display: { theme: 'light', itemsPerPage: 20, showIds: true }
      });
    }
    setHasChanges(false);
  }, [settings]);

  const handleInputChange = (category, field, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: { ...prev[category] || {}, [field]: value }
    }));
    setHasChanges(true);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500000) return toast.error("Image too large (Max 500kb)");
      const reader = new FileReader();
      reader.onloadend = () => handleInputChange('general', 'logo', reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateSettings(activeTab, formData[activeTab]);
      toast.success("Settings saved!");
      setHasChanges(false);
    } catch { toast.error("Failed to save"); }
    finally { setIsSaving(false); }
  };

  const renderToggle = (category, field, label, description) => (
    <div className="setting-item">
      <div className="setting-info">
        <label className="setting-label">{label}</label>
        {description && <span className="setting-description">{description}</span>}
      </div>
      <label className="toggle-switch">
        <input 
          type="checkbox" 
          checked={formData[category]?.[field] || false} 
          onChange={e => handleInputChange(category, field, e.target.checked)} 
        />
        <span className="toggle-slider">
          <span className="toggle-icon toggle-icon-off">✕</span>
          <span className="toggle-icon toggle-icon-on">✓</span>
        </span>
      </label>
    </div>
  );

  const tabs = [
    { id: 'general', label: 'General', icon: FiSettings, description: 'Basic app configuration' },
    { id: 'execution', label: 'Execution', icon: FiPlay, description: 'Test run behavior' },
    { id: 'reporting', label: 'Reporting', icon: FiFileText, description: 'Report preferences' },
    { id: 'grokAI', label: 'AI Integration', icon: FiCpu, badge: 'Pro', description: 'AI-powered features' },
    { id: 'export', label: 'Export', icon: FiDownload, description: 'Export settings' },
    { id: 'notifications', label: 'Notifications', icon: FiBell, description: 'Alert preferences' },
    { id: 'display', label: 'Display', icon: FiMonitor, description: 'Visual settings' },
  ];

  const activeTabData = tabs.find(t => t.id === activeTab);

  return (
    <div className="settings-page">
      {/* Ambient Background */}
      <div className="settings-ambient">
        <div className="ambient-orb ambient-orb-1"></div>
        <div className="ambient-orb ambient-orb-2"></div>
      </div>

      {/* Main Scrollable Container */}
      <div className="settings-scroll-container">
        <div className="settings-inner">
          {/* Page Header */}
          <div className="page-header">
            <div className="header-content">
              <div className="header-badge">
                <FiSettings className="badge-icon" />
                <span>Configuration</span>
              </div>
              <h2 className="section-title">Settings</h2>
              <p className="section-description">Manage your application preferences and configurations</p>
            </div>
            {hasChanges && (
              <div className="unsaved-indicator">
                <FiAlertTriangle />
                <span>Unsaved changes</span>
              </div>
            )}
          </div>

          <div className="settings-layout">
            {/* Settings Navigation */}
            <nav className="settings-nav">
              <div className="nav-header">
                <h3>Categories</h3>
              </div>
              <div className="nav-list">
                {tabs.map(t => (
                  <button 
                    key={t.id} 
                    className={`settings-nav-item ${activeTab === t.id ? 'active' : ''}`} 
                    onClick={() => setActiveTab(t.id)}
                  >
                    <div className="nav-item-icon">
                      <t.icon />
                    </div>
                    <div className="nav-item-content">
                      <span className="nav-item-label">{t.label}</span>
                      <span className="nav-item-description">{t.description}</span>
                    </div>
                    {t.badge && (
                      <span className="nav-item-badge">{t.badge}</span>
                    )}
                    <FiChevronRight className="nav-item-arrow" />
                  </button>
                ))}
              </div>
              
              {/* Quick Actions */}
              <div className="nav-footer">
                <div className="nav-footer-title">Quick Actions</div>
                <button className="quick-action-btn" onClick={() => window.location.reload()}>
                  <FiRefreshCw />
                  <span>Reset to Default</span>
                </button>
              </div>
            </nav>

            {/* Settings Content */}
            <div className="settings-content">
              <div className="settings-content-scroll">
                <div className="settings-section">
                  {/* Section Header */}
                  <div className="section-header">
                    <div className="section-header-icon">
                      {activeTabData && <activeTabData.icon />}
                    </div>
                    <div className="section-header-content">
                      <h3>{activeTabData?.label} Settings</h3>
                      <p>{activeTabData?.description}</p>
                    </div>
                  </div>
                  
                  {/* General Settings */}
                  {activeTab === 'general' && (
                    <div className="settings-group">
                      <div className="group-title">
                        <FiImage />
                        <span>Branding</span>
                      </div>
                      
                      <div className="setting-item setting-item-vertical">
                        <div className="setting-info">
                          <label className="setting-label">App Logo</label>
                          <span className="setting-description">Upload your organization's logo (Max 500KB)</span>
                        </div>
                        <div className="logo-upload-container">
                          <div className="logo-preview">
                            {formData.general?.logo ? (
                              <img src={formData.general.logo} alt="Logo" />
                            ) : (
                              <div className="logo-placeholder">
                                <FiImage />
                                <span>No logo</span>
                              </div>
                            )}
                          </div>
                          <div className="logo-actions">
                            <input type="file" id="logo-upload" hidden accept="image/*" onChange={handleLogoUpload} />
                            <label htmlFor="logo-upload" className="btn btn-secondary btn-sm">
                              <FiUpload />
                              <span>Upload</span>
                            </label>
                            {formData.general?.logo && (
                              <button 
                                className="btn btn-ghost btn-sm btn-danger"
                                onClick={() => handleInputChange('general', 'logo', '')}
                              >
                                <FiTrash2 />
                                <span>Remove</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="group-title">
                        <FiGlobe />
                        <span>Organization</span>
                      </div>

                      <div className="setting-item setting-item-vertical">
                        <div className="setting-info">
                          <label className="setting-label">Organization Name</label>
                          <span className="setting-description">Your company or team name</span>
                        </div>
                        <div className="setting-control">
                          <input 
                            type="text" 
                            className="setting-input"
                            placeholder="Enter organization name..."
                            value={formData.general?.organization || ''} 
                            onChange={e => handleInputChange('general', 'organization', e.target.value)} 
                          />
                        </div>
                      </div>

                      <div className="setting-item setting-item-vertical">
                        <div className="setting-info">
                          <label className="setting-label">Project Name</label>
                          <span className="setting-description">Current project identifier</span>
                        </div>
                        <div className="setting-control">
                          <input 
                            type="text" 
                            className="setting-input"
                            placeholder="Enter project name..."
                            value={formData.general?.projectName || ''} 
                            onChange={e => handleInputChange('general', 'projectName', e.target.value)} 
                          />
                        </div>
                      </div>

                      <div className="group-title">
                        <FiClock />
                        <span>Localization</span>
                      </div>

                      <div className="settings-row">
                        <div className="setting-item setting-item-vertical">
                          <div className="setting-info">
                            <label className="setting-label">Date Format</label>
                            <span className="setting-description">How dates are displayed</span>
                          </div>
                          <div className="setting-control">
                            <div className="select-wrapper">
                              <select 
                                className="setting-select"
                                value={formData.general?.dateFormat} 
                                onChange={e => handleInputChange('general', 'dateFormat', e.target.value)}
                              >
                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="setting-item setting-item-vertical">
                          <div className="setting-info">
                            <label className="setting-label">Time Zone</label>
                            <span className="setting-description">Default timezone for reports</span>
                          </div>
                          <div className="setting-control">
                            <div className="select-wrapper">
                              <select 
                                className="setting-select"
                                value={formData.general?.timeZone} 
                                onChange={e => handleInputChange('general', 'timeZone', e.target.value)}
                              >
                                <option value="UTC">UTC</option>
                                <option value="EST">EST (Eastern)</option>
                                <option value="PST">PST (Pacific)</option>
                                <option value="CST">CST (Central)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Execution Settings */}
                  {activeTab === 'execution' && (
                    <div className="settings-group">
                      <div className="group-title">
                        <FiPlay />
                        <span>Test Run Behavior</span>
                      </div>
                      
                      {renderToggle('execution', 'autoSave', 'Auto-Save Results', 'Automatically save test results as you progress')}
                      {renderToggle('execution', 'autoAdvance', 'Auto-Advance on Pass', 'Move to next test case when current passes')}
                      {renderToggle('execution', 'requireCommentsOnFail', 'Require Comments on Fail', 'Force testers to add comments for failed tests')}
                      
                      <div className="group-title">
                        <FiClock />
                        <span>Session</span>
                      </div>

                      <div className="setting-item setting-item-vertical">
                        <div className="setting-info">
                          <label className="setting-label">Session Timeout</label>
                          <span className="setting-description">Auto-logout after inactivity (minutes)</span>
                        </div>
                        <div className="setting-control">
                          <div className="input-with-suffix">
                            <input 
                              type="number" 
                              className="setting-input"
                              min="5"
                              max="120"
                              value={formData.execution?.sessionTimeout || 30} 
                              onChange={e => handleInputChange('execution', 'sessionTimeout', e.target.value)} 
                            />
                            <span className="input-suffix">minutes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reporting Settings */}
                  {activeTab === 'reporting' && (
                    <div className="settings-group">
                      <div className="group-title">
                        <FiFileText />
                        <span>Report Content</span>
                      </div>
                      
                      {renderToggle('reporting', 'includePassedTests', 'Include Passed Tests', 'Show passed test cases in reports')}
                      {renderToggle('reporting', 'includeFailedTests', 'Include Failed Tests', 'Show failed test cases in reports')}
                      {renderToggle('reporting', 'includeCharts', 'Include Charts', 'Add visual charts and graphs')}
                      
                      <div className="group-title">
                        <FiFileText />
                        <span>Report Branding</span>
                      </div>

                      <div className="setting-item setting-item-vertical">
                        <div className="setting-info">
                          <label className="setting-label">Report Header</label>
                          <span className="setting-description">Text displayed at the top of reports</span>
                        </div>
                        <div className="setting-control">
                          <input 
                            type="text" 
                            className="setting-input"
                            placeholder="Enter header text..."
                            value={formData.reporting?.reportHeader || ''} 
                            onChange={e => handleInputChange('reporting', 'reportHeader', e.target.value)} 
                          />
                        </div>
                      </div>

                      <div className="setting-item setting-item-vertical">
                        <div className="setting-info">
                          <label className="setting-label">Report Footer</label>
                          <span className="setting-description">Text displayed at the bottom of reports</span>
                        </div>
                        <div className="setting-control">
                          <input 
                            type="text" 
                            className="setting-input"
                            placeholder="Enter footer text..."
                            value={formData.reporting?.reportFooter || ''} 
                            onChange={e => handleInputChange('reporting', 'reportFooter', e.target.value)} 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Integration Settings */}
                  {activeTab === 'grokAI' && (
                    <div className="settings-group">
                      {/* AI Feature Banner */}
                      <div className="feature-banner ai-banner">
                        <div className="feature-banner-icon">
                          <FiZap />
                        </div>
                        <div className="feature-banner-content">
                          <h4>AI-Powered Analysis</h4>
                          <p>Enable intelligent test analysis, automatic summaries, and smart recommendations</p>
                        </div>
                      </div>

                      <div className="group-title">
                        <FiCpu />
                        <span>Configuration</span>
                      </div>
                      
                      {renderToggle('grokAI', 'enabled', 'Enable AI Analysis', 'Use AI to analyze test results and generate insights')}
                      
                      {formData.grokAI?.enabled && (
                        <>
                          <div className="setting-item setting-item-vertical">
                            <div className="setting-info">
                              <label className="setting-label">AI Provider</label>
                              <span className="setting-description">Select your preferred AI service</span>
                            </div>
                            <div className="setting-control">
                              <div className="provider-options">
                                <div 
                                  className={`provider-option ${formData.grokAI?.provider === 'gemini' ? 'active' : ''}`}
                                  onClick={() => handleInputChange('grokAI', 'provider', 'gemini')}
                                >
                                  <div className="provider-icon gemini">G</div>
                                  <div className="provider-info">
                                    <span className="provider-name">Google Gemini</span>
                                    <span className="provider-tier free">Free Tier</span>
                                  </div>
                                  {formData.grokAI?.provider === 'gemini' && (
                                    <FiCheckCircle className="provider-check" />
                                  )}
                                </div>
                                <div 
                                  className={`provider-option ${formData.grokAI?.provider === 'groq_cloud' ? 'active' : ''}`}
                                  onClick={() => handleInputChange('grokAI', 'provider', 'groq_cloud')}
                                >
                                  <div className="provider-icon groq">⚡</div>
                                  <div className="provider-info">
                                    <span className="provider-name">Groq Cloud</span>
                                    <span className="provider-tier free">Free Tier</span>
                                  </div>
                                  {formData.grokAI?.provider === 'groq_cloud' && (
                                    <FiCheckCircle className="provider-check" />
                                  )}
                                </div>
                                <div 
                                  className={`provider-option ${formData.grokAI?.provider === 'openai' ? 'active' : ''}`}
                                  onClick={() => handleInputChange('grokAI', 'provider', 'openai')}
                                >
                                  <div className="provider-icon openai">◯</div>
                                  <div className="provider-info">
                                    <span className="provider-name">OpenAI</span>
                                    <span className="provider-tier paid">Paid</span>
                                  </div>
                                  {formData.grokAI?.provider === 'openai' && (
                                    <FiCheckCircle className="provider-check" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="group-title">
                            <FiLock />
                            <span>Authentication</span>
                          </div>

                          <div className="setting-item setting-item-vertical">
                            <div className="setting-info">
                              <label className="setting-label">API Key</label>
                              <span className="setting-description">Your provider's API key (stored securely)</span>
                            </div>
                            <div className="setting-control">
                              <div className="api-key-input">
                                <div className="input-with-button">
                                  <input 
                                    type={showApiKey ? "text" : "password"} 
                                    className="setting-input api-key"
                                    placeholder="Enter your API key..."
                                    value={formData.grokAI?.apiKey || ''} 
                                    onChange={e => handleInputChange('grokAI', 'apiKey', e.target.value)} 
                                  />
                                  <button 
                                    type="button" 
                                    className="btn-icon visibility-toggle"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    title={showApiKey ? "Hide API Key" : "Show API Key"}
                                  >
                                    {showApiKey ? <FiEyeOff /> : <FiEye />}
                                  </button>
                                </div>
                                <div className="api-key-status">
                                  {formData.grokAI?.apiKey ? (
                                    <span className="status-valid">
                                      <FiCheckCircle /> API key configured
                                    </span>
                                  ) : (
                                    <span className="status-missing">
                                      <FiAlertTriangle /> API key required
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Export Settings */}
                  {activeTab === 'export' && (
                    <div className="settings-group">
                      <div className="group-title">
                        <FiDownload />
                        <span>Export Preferences</span>
                      </div>

                      <div className="setting-item setting-item-vertical">
                        <div className="setting-info">
                          <label className="setting-label">Default Format</label>
                          <span className="setting-description">Preferred export file format</span>
                        </div>
                        <div className="setting-control">
                          <div className="format-selector">
                            <div 
                              className={`format-option ${formData.export?.defaultFormat === 'pdf' ? 'active' : ''}`}
                              onClick={() => handleInputChange('export', 'defaultFormat', 'pdf')}
                            >
                              <FiFileText className="format-icon" />
                              <span className="format-name">PDF</span>
                              <span className="format-desc">Best for sharing</span>
                            </div>
                            <div 
                              className={`format-option ${formData.export?.defaultFormat === 'word' ? 'active' : ''}`}
                              onClick={() => handleInputChange('export', 'defaultFormat', 'word')}
                            >
                              <FiFileText className="format-icon" />
                              <span className="format-name">Word</span>
                              <span className="format-desc">Editable document</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="setting-item setting-item-vertical">
                        <div className="setting-info">
                          <label className="setting-label">Page Size</label>
                          <span className="setting-description">PDF document page size</span>
                        </div>
                        <div className="setting-control">
                          <div className="select-wrapper">
                            <select 
                              className="setting-select"
                              value={formData.export?.pdfPageSize || 'A4'} 
                              onChange={e => handleInputChange('export', 'pdfPageSize', e.target.value)}
                            >
                              <option value="A4">A4 (210 × 297 mm)</option>
                              <option value="Letter">Letter (8.5 × 11 in)</option>
                              <option value="Legal">Legal (8.5 × 14 in)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notifications Settings */}
                  {activeTab === 'notifications' && (
                    <div className="settings-group">
                      <div className="group-title">
                        <FiBell />
                        <span>Notification Preferences</span>
                      </div>
                      
                      {renderToggle('notifications', 'showSuccess', 'Success Notifications', 'Show success messages after actions')}
                      {renderToggle('notifications', 'showErrors', 'Error Notifications', 'Show error messages when issues occur')}
                      
                      <div className="setting-item setting-item-vertical">
                        <div className="setting-info">
                          <label className="setting-label">Notification Duration</label>
                          <span className="setting-description">How long notifications stay visible</span>
                        </div>
                        <div className="setting-control">
                          <div className="input-with-suffix">
                            <input 
                              type="number" 
                              className="setting-input"
                              min="1000"
                              max="10000"
                              step="500"
                              value={formData.notifications?.duration || 3000} 
                              onChange={e => handleInputChange('notifications', 'duration', parseInt(e.target.value))} 
                            />
                            <span className="input-suffix">ms</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Display Settings */}
                  {activeTab === 'display' && (
                    <div className="settings-group">
                      <div className="group-title">
                        <FiMonitor />
                        <span>Appearance</span>
                      </div>

                      <div className="setting-item setting-item-vertical">
                        <div className="setting-info">
                          <label className="setting-label">Theme</label>
                          <span className="setting-description">Choose your preferred color scheme</span>
                        </div>
                        <div className="setting-control">
                          <div className="theme-selector">
                            <div 
                              className={`theme-option ${formData.display?.theme === 'light' ? 'active' : ''}`}
                              onClick={() => handleInputChange('display', 'theme', 'light')}
                            >
                              <div className="theme-preview light">
                                <div className="preview-sidebar"></div>
                                <div className="preview-content"></div>
                              </div>
                              <span className="theme-name">Light</span>
                              {formData.display?.theme === 'light' && (
                                <FiCheck className="theme-check" />
                              )}
                            </div>
                            <div 
                              className={`theme-option ${formData.display?.theme === 'dark' ? 'active' : ''}`}
                              onClick={() => handleInputChange('display', 'theme', 'dark')}
                            >
                              <div className="theme-preview dark">
                                <div className="preview-sidebar"></div>
                                <div className="preview-content"></div>
                              </div>
                              <span className="theme-name">Dark</span>
                              {formData.display?.theme === 'dark' && (
                                <FiCheck className="theme-check" />
                              )}
                            </div>
                            <div 
                              className={`theme-option ${formData.display?.theme === 'system' ? 'active' : ''}`}
                              onClick={() => handleInputChange('display', 'theme', 'system')}
                            >
                              <div className="theme-preview system">
                                <div className="preview-sidebar"></div>
                                <div className="preview-content"></div>
                              </div>
                              <span className="theme-name">System</span>
                              {formData.display?.theme === 'system' && (
                                <FiCheck className="theme-check" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="group-title">
                        <FiSettings />
                        <span>Table Settings</span>
                      </div>

                      {renderToggle('display', 'showIds', 'Show Test Case IDs', 'Display ADO IDs in test case lists')}

                      <div className="setting-item setting-item-vertical">
                        <div className="setting-info">
                          <label className="setting-label">Items Per Page</label>
                          <span className="setting-description">Number of items shown in tables</span>
                        </div>
                        <div className="setting-control">
                          <div className="select-wrapper">
                            <select 
                              className="setting-select"
                              value={formData.display?.itemsPerPage || 20} 
                              onChange={e => handleInputChange('display', 'itemsPerPage', parseInt(e.target.value))}
                            >
                              <option value="10">10 items</option>
                              <option value="20">20 items</option>
                              <option value="50">50 items</option>
                              <option value="100">100 items</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Save Actions */}
                  <div className="settings-actions">
                    <div className="actions-info">
                      {hasChanges ? (
                        <span className="changes-indicator">
                          <span className="indicator-dot"></span>
                          You have unsaved changes
                        </span>
                      ) : (
                        <span className="saved-indicator">
                          <FiCheckCircle />
                          All changes saved
                        </span>
                      )}
                    </div>
                    <div className="actions-buttons">
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => setFormData(JSON.parse(JSON.stringify(settings)))}
                        disabled={!hasChanges}
                      >
                        <FiRefreshCw />
                        <span>Reset</span>
                      </button>
                      <button 
                        className="btn btn-primary" 
                        onClick={handleSave} 
                        disabled={isSaving || !hasChanges}
                      >
                        {isSaving ? (
                          <>
                            <span className="btn-spinner"></span>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <FiSave />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;