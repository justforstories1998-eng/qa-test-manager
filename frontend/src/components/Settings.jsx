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
      setHasChanges(false);
    } catch { toast.error("Failed to save"); }
    finally { setIsSaving(false); }
  };

  const renderToggle = (category, field, label, description) => (
    <div className="dg-setting-item">
      <div className="dg-setting-info">
        <label className="dg-input-label">{label}</label>
        {description && <span className="dg-setting-desc">{description}</span>}
      </div>
      <label className="dg-toggle">
        <input 
          type="checkbox" 
          checked={formData[category]?.[field] || false} 
          onChange={e => handleInputChange(category, field, e.target.checked)} 
        />
        <span className="dg-toggle-slider"></span>
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
    <div className="dg-page">
      <div className="dg-page-header" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <FiSettings size={20} style={{ color: 'var(--dg-accent)' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--dg-accent)' }}>Configuration</span>
          </div>
          <h2 className="dg-page-title">Settings</h2>
          <p style={{ color: '#6c7a89', margin: '4px 0 0 0' }}>Manage your application preferences and configurations</p>
        </div>
        {hasChanges && (
          <div className="dg-badge dg-badge-amber" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '13px' }}>
            <FiAlertTriangle size={14} />
            <span>Unsaved changes</span>
          </div>
        )}
      </div>

      <div className="dg-tabs" style={{ marginBottom: '24px' }}>
        {tabs.map(t => (
          <button 
            key={t.id} 
            className={`dg-tab ${activeTab === t.id ? 'active' : ''}`} 
            onClick={() => setActiveTab(t.id)}
            style={{ position: 'relative' }}
          >
            <t.icon size={16} />
            <span>{t.label}</span>
            {t.badge && (
              <span className="dg-badge dg-badge-purple" style={{ marginLeft: '6px', fontSize: '10px', padding: '1px 6px' }}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ padding: '28px', maxWidth: '800px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e7e8ed' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid #e7e8ed' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {activeTabData && <activeTabData.icon size={20} style={{ color: 'var(--dg-accent)' }} />}
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#2b2c41', fontWeight: 600 }}>{activeTabData?.label} Settings</h3>
            <p style={{ margin: 0, color: '#a3acb9', fontSize: '13px' }}>{activeTabData?.description}</p>
          </div>
        </div>

        {/* General Settings */}
        {activeTab === 'general' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#2b2c41', fontWeight: 600, fontSize: '14px' }}>
              <FiImage size={16} style={{ color: 'var(--dg-accent)' }} />
              <span>Branding</span>
            </div>

            <div className="dg-setting-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
              <div className="dg-setting-info">
                <label className="dg-input-label">App Logo</label>
                <span className="dg-setting-desc">Upload your organization's logo (Max 500KB)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '12px', border: '2px solid #e7e8ed', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#f5f5f9' }}>
                  {formData.general?.logo ? (
                    <img src={formData.general.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#a3acb9' }}>
                      <FiImage size={24} />
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input type="file" id="logo-upload" hidden accept="image/*" onChange={handleLogoUpload} />
                  <label htmlFor="logo-upload" className="dg-btn dg-btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '13px' }}>
                    <FiUpload size={14} />
                    Upload
                  </label>
                  {formData.general?.logo && (
                    <button 
                      className="dg-btn dg-btn-ghost" style={{ color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '13px' }}
                      onClick={() => handleInputChange('general', 'logo', '')}
                    >
                      <FiTrash2 size={14} />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', marginTop: '28px', color: '#2b2c41', fontWeight: 600, fontSize: '14px' }}>
              <FiGlobe size={16} style={{ color: 'var(--dg-accent)' }} />
              <span>Organization</span>
            </div>

            <div className="dg-setting-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <div className="dg-setting-info">
                <label className="dg-input-label">Organization Name</label>
                <span className="dg-setting-desc">Your company or team name</span>
              </div>
              <input 
                type="text" 
                className="dg-input"
                placeholder="Enter organization name..."
                value={formData.general?.organization || ''} 
                onChange={e => handleInputChange('general', 'organization', e.target.value)} 
                style={{ width: '100%', maxWidth: '400px' }}
              />
            </div>

            <div className="dg-setting-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <div className="dg-setting-info">
                <label className="dg-input-label">Project Name</label>
                <span className="dg-setting-desc">Current project identifier</span>
              </div>
              <input 
                type="text" 
                className="dg-input"
                placeholder="Enter project name..."
                value={formData.general?.projectName || ''} 
                onChange={e => handleInputChange('general', 'projectName', e.target.value)} 
                style={{ width: '100%', maxWidth: '400px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', marginTop: '28px', color: '#2b2c41', fontWeight: 600, fontSize: '14px' }}>
              <FiClock size={16} style={{ color: 'var(--dg-accent)' }} />
              <span>Localization</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="dg-setting-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                <div className="dg-setting-info">
                  <label className="dg-input-label">Date Format</label>
                  <span className="dg-setting-desc">How dates are displayed</span>
                </div>
                <select 
                  className="dg-select"
                  value={formData.general?.dateFormat} 
                  onChange={e => handleInputChange('general', 'dateFormat', e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                </select>
              </div>

              <div className="dg-setting-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                <div className="dg-setting-info">
                  <label className="dg-input-label">Time Zone</label>
                  <span className="dg-setting-desc">Default timezone for reports</span>
                </div>
                <select 
                  className="dg-select"
                  value={formData.general?.timeZone} 
                  onChange={e => handleInputChange('general', 'timeZone', e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">EST (Eastern)</option>
                  <option value="PST">PST (Pacific)</option>
                  <option value="CST">CST (Central)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Execution Settings */}
        {activeTab === 'execution' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#2b2c41', fontWeight: 600, fontSize: '14px' }}>
              <FiPlay size={16} style={{ color: 'var(--dg-accent)' }} />
              <span>Test Run Behavior</span>
            </div>
            
            {renderToggle('execution', 'autoSave', 'Auto-Save Results', 'Automatically save test results as you progress')}
            {renderToggle('execution', 'autoAdvance', 'Auto-Advance on Pass', 'Move to next test case when current passes')}
            {renderToggle('execution', 'requireCommentsOnFail', 'Require Comments on Fail', 'Force testers to add comments for failed tests')}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', marginTop: '28px', color: '#2b2c41', fontWeight: 600, fontSize: '14px' }}>
              <FiClock size={16} style={{ color: 'var(--dg-accent)' }} />
              <span>Session</span>
            </div>

            <div className="dg-setting-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <div className="dg-setting-info">
                <label className="dg-input-label">Session Timeout</label>
                <span className="dg-setting-desc">Auto-logout after inactivity (minutes)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="number" 
                  className="dg-input"
                  min="5"
                  max="120"
                  value={formData.execution?.sessionTimeout || 30} 
                   onChange={e => handleInputChange('execution', 'sessionTimeout', parseInt(e.target.value) || 30)} 
                  style={{ width: '120px' }}
                />
                <span style={{ color: '#a3acb9', fontSize: '13px' }}>minutes</span>
              </div>
            </div>
          </div>
        )}

        {/* Reporting Settings */}
        {activeTab === 'reporting' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#2b2c41', fontWeight: 600, fontSize: '14px' }}>
              <FiFileText size={16} style={{ color: 'var(--dg-accent)' }} />
              <span>Report Content</span>
            </div>
            
            {renderToggle('reporting', 'includePassedTests', 'Include Passed Tests', 'Show passed test cases in reports')}
            {renderToggle('reporting', 'includeFailedTests', 'Include Failed Tests', 'Show failed test cases in reports')}
            {renderToggle('reporting', 'includeCharts', 'Include Charts', 'Add visual charts and graphs')}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', marginTop: '28px', color: '#2b2c41', fontWeight: 600, fontSize: '14px' }}>
              <FiFileText size={16} style={{ color: 'var(--dg-accent)' }} />
              <span>Report Branding</span>
            </div>

            <div className="dg-setting-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <div className="dg-setting-info">
                <label className="dg-input-label">Report Header</label>
                <span className="dg-setting-desc">Text displayed at the top of reports</span>
              </div>
              <input 
                type="text" 
                className="dg-input"
                placeholder="Enter header text..."
                value={formData.reporting?.reportHeader || ''} 
                onChange={e => handleInputChange('reporting', 'reportHeader', e.target.value)} 
                style={{ width: '100%', maxWidth: '500px' }}
              />
            </div>

            <div className="dg-setting-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <div className="dg-setting-info">
                <label className="dg-input-label">Report Footer</label>
                <span className="dg-setting-desc">Text displayed at the bottom of reports</span>
              </div>
              <input 
                type="text" 
                className="dg-input"
                placeholder="Enter footer text..."
                value={formData.reporting?.reportFooter || ''} 
                onChange={e => handleInputChange('reporting', 'reportFooter', e.target.value)} 
                style={{ width: '100%', maxWidth: '500px' }}
              />
            </div>
          </div>
        )}

        {/* AI Integration Settings */}
        {activeTab === 'grokAI' && (
          <div>
            <div style={{ padding: '20px', marginBottom: '24px', border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.06)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FiZap size={22} style={{ color: 'var(--dg-accent)' }} />
                </div>
                <div>
                  <h4 style={{ margin: 0, color: '#2b2c41', fontWeight: 600 }}>AI-Powered Analysis</h4>
                  <p style={{ margin: '2px 0 0 0', color: '#a3acb9', fontSize: '13px' }}>Enable intelligent test analysis, automatic summaries, and smart recommendations</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#2b2c41', fontWeight: 600, fontSize: '14px' }}>
              <FiCpu size={16} style={{ color: 'var(--dg-accent)' }} />
              <span>Configuration</span>
            </div>
            
            {renderToggle('grokAI', 'enabled', 'Enable AI Analysis', 'Use AI to analyze test results and generate insights')}
            
            {formData.grokAI?.enabled && (
              <>
                <div className="dg-setting-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                  <div className="dg-setting-info">
                    <label className="dg-input-label">AI Provider</label>
                    <span className="dg-setting-desc">Select your preferred AI service</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', width: '100%' }}>
                    {[
                      { id: 'gemini', name: 'Google Gemini', tier: 'Free', icon: 'G', color: '#4285f4' },
                      { id: 'groq_cloud', name: 'Groq Cloud', tier: 'Free', icon: '⚡', color: '#f97316' },
                      { id: 'openai', name: 'OpenAI', tier: 'Paid', icon: '◯', color: '#10a37f' }
                    ].map(p => (
                      <div 
                        key={p.id}
                        style={{ 
                          padding: '14px', cursor: 'pointer', textAlign: 'center',
                          border: formData.grokAI?.provider === p.id ? '2px solid var(--dg-accent)' : '2px solid #e7e8ed',
                          background: formData.grokAI?.provider === p.id ? 'rgba(99,102,241,0.08)' : '#f5f5f9',
                          transition: 'all 0.2s',
                          borderRadius: '12px'
                        }}
                        onClick={() => handleInputChange('grokAI', 'provider', p.id)}
                      >
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${p.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', color: p.color, fontWeight: 700, fontSize: '16px' }}>
                          {p.icon}
                        </div>
                        <div style={{ fontWeight: 600, color: '#2b2c41', fontSize: '13px' }}>{p.name}</div>
                        <div className={`dg-badge dg-badge-${p.tier === 'Free' ? 'green' : 'amber'}`} style={{ marginTop: '4px', fontSize: '10px' }}>{p.tier}</div>
                        {formData.grokAI?.provider === p.id && (
                          <FiCheckCircle size={16} style={{ color: 'var(--dg-accent)', marginTop: '6px' }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', marginTop: '28px', color: '#2b2c41', fontWeight: 600, fontSize: '14px' }}>
                  <FiLock size={16} style={{ color: 'var(--dg-accent)' }} />
                  <span>Authentication</span>
                </div>

                <div className="dg-setting-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                  <div className="dg-setting-info">
                    <label className="dg-input-label">API Key</label>
                    <span className="dg-setting-desc">Your provider's API key (stored securely)</span>
                  </div>
                  <div style={{ width: '100%', maxWidth: '500px' }}>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showApiKey ? "text" : "password"} 
                        className="dg-input"
                        placeholder="Enter your API key..."
                        value={formData.grokAI?.apiKey || ''} 
                        onChange={e => handleInputChange('grokAI', 'apiKey', e.target.value)} 
                        style={{ width: '100%', paddingRight: '44px' }}
                      />
                      <button 
                        type="button" 
                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#a3acb9', cursor: 'pointer', padding: '4px' }}
                        onClick={() => setShowApiKey(!showApiKey)}
                        title={showApiKey ? "Hide API Key" : "Show API Key"}
                      >
                        {showApiKey ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '12px' }}>
                      {formData.grokAI?.apiKey ? (
                        <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FiCheckCircle size={14} /> API key configured
                        </span>
                      ) : (
                        <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FiAlertTriangle size={14} /> API key required
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Export Settings */}
        {activeTab === 'export' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#2b2c41', fontWeight: 600, fontSize: '14px' }}>
              <FiDownload size={16} style={{ color: 'var(--dg-accent)' }} />
              <span>Export Preferences</span>
            </div>

            <div className="dg-setting-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
              <div className="dg-setting-info">
                <label className="dg-input-label">Default Format</label>
                <span className="dg-setting-desc">Preferred export file format</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%', maxWidth: '400px' }}>
                {[
                  { id: 'pdf', name: 'PDF', desc: 'Best for sharing' },
                  { id: 'word', name: 'Word', desc: 'Editable document' }
                ].map(f => (
                  <div 
                    key={f.id}
                    style={{ 
                      padding: '16px', cursor: 'pointer', textAlign: 'center',
                      border: formData.export?.defaultFormat === f.id ? '2px solid var(--dg-accent)' : '2px solid #e7e8ed',
                      background: formData.export?.defaultFormat === f.id ? 'rgba(99,102,241,0.08)' : '#f5f5f9',
                      transition: 'all 0.2s',
                      borderRadius: '12px'
                    }}
                    onClick={() => handleInputChange('export', 'defaultFormat', f.id)}
                  >
                    <FiFileText size={20} style={{ color: 'var(--dg-accent)', marginBottom: '6px' }} />
                    <div style={{ fontWeight: 600, color: '#2b2c41', fontSize: '14px' }}>{f.name}</div>
                    <div style={{ color: '#a3acb9', fontSize: '12px', marginTop: '2px' }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="dg-setting-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px', marginTop: '20px' }}>
              <div className="dg-setting-info">
                <label className="dg-input-label">Page Size</label>
                <span className="dg-setting-desc">PDF document page size</span>
              </div>
              <select 
                className="dg-select"
                value={formData.export?.pdfPageSize || 'A4'} 
                onChange={e => handleInputChange('export', 'pdfPageSize', e.target.value)}
                style={{ width: '100%', maxWidth: '300px' }}
              >
                <option value="A4">A4 (210 × 297 mm)</option>
                <option value="Letter">Letter (8.5 × 11 in)</option>
                <option value="Legal">Legal (8.5 × 14 in)</option>
              </select>
            </div>
          </div>
        )}

        {/* Notifications Settings */}
        {activeTab === 'notifications' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#2b2c41', fontWeight: 600, fontSize: '14px' }}>
              <FiBell size={16} style={{ color: 'var(--dg-accent)' }} />
              <span>Notification Preferences</span>
            </div>
            
            {renderToggle('notifications', 'showSuccess', 'Success Notifications', 'Show success messages after actions')}
            {renderToggle('notifications', 'showErrors', 'Error Notifications', 'Show error messages when issues occur')}
            
            <div className="dg-setting-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px', marginTop: '20px' }}>
              <div className="dg-setting-info">
                <label className="dg-input-label">Notification Duration</label>
                <span className="dg-setting-desc">How long notifications stay visible</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="number" 
                  className="dg-input"
                  min="1000"
                  max="10000"
                  step="500"
                  value={formData.notifications?.duration || 3000} 
                  onChange={e => handleInputChange('notifications', 'duration', parseInt(e.target.value))} 
                  style={{ width: '120px' }}
                />
                <span style={{ color: '#a3acb9', fontSize: '13px' }}>ms</span>
              </div>
            </div>
          </div>
        )}

        {/* Display Settings */}
        {activeTab === 'display' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#2b2c41', fontWeight: 600, fontSize: '14px' }}>
              <FiMonitor size={16} style={{ color: 'var(--dg-accent)' }} />
              <span>Appearance</span>
            </div>

            <div className="dg-setting-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
              <div className="dg-setting-info">
                <label className="dg-input-label">Theme</label>
                <span className="dg-setting-desc">Choose your preferred color scheme</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', width: '100%' }}>
                {[
                  { id: 'light', name: 'Light' },
                  { id: 'dark', name: 'Dark' },
                  { id: 'system', name: 'System' }
                ].map(t => (
                  <div 
                    key={t.id}
                    style={{ 
                      padding: '14px', cursor: 'pointer', textAlign: 'center',
                      border: formData.display?.theme === t.id ? '2px solid var(--dg-accent)' : '2px solid #e7e8ed',
                      background: formData.display?.theme === t.id ? 'rgba(99,102,241,0.08)' : '#f5f5f9',
                      transition: 'all 0.2s',
                      borderRadius: '12px'
                    }}
                    onClick={() => handleInputChange('display', 'theme', t.id)}
                  >
                    <div style={{ 
                      width: '100%', height: '50px', borderRadius: '8px', marginBottom: '8px',
                      background: t.id === 'dark' ? '#0f172a' : t.id === 'light' ? '#f1f5f9' : 'linear-gradient(135deg, #f1f5f9 50%, #0f172a 50%)',
                      border: '1px solid #e7e8ed'
                    }}></div>
                    <span style={{ fontWeight: 600, color: '#2b2c41', fontSize: '13px' }}>{t.name}</span>
                    {formData.display?.theme === t.id && (
                      <FiCheck size={16} style={{ color: 'var(--dg-accent)', marginTop: '4px', display: 'block', margin: '4px auto 0' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', marginTop: '28px', color: '#2b2c41', fontWeight: 600, fontSize: '14px' }}>
              <FiSettings size={16} style={{ color: 'var(--dg-accent)' }} />
              <span>Table Settings</span>
            </div>

            {renderToggle('display', 'showIds', 'Show Test Case IDs', 'Display ADO IDs in test case lists')}

            <div className="dg-setting-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px', marginTop: '20px' }}>
              <div className="dg-setting-info">
                <label className="dg-input-label">Items Per Page</label>
                <span className="dg-setting-desc">Number of items shown in tables</span>
              </div>
              <select 
                className="dg-select"
                value={formData.display?.itemsPerPage || 20} 
                onChange={e => handleInputChange('display', 'itemsPerPage', parseInt(e.target.value))}
                style={{ width: '100%', maxWidth: '300px' }}
              >
                <option value="10">10 items</option>
                <option value="20">20 items</option>
                <option value="50">50 items</option>
                <option value="100">100 items</option>
              </select>
            </div>
          </div>
        )}

        {/* Save Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #e7e8ed' }}>
          <div>
            {hasChanges ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '13px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', animation: 'pulse 2s infinite' }}></span>
                You have unsaved changes
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e', fontSize: '13px' }}>
                <FiCheckCircle size={16} />
                All changes saved
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="dg-btn dg-btn-secondary" 
              onClick={() => setFormData(JSON.parse(JSON.stringify(settings)))}
              disabled={!hasChanges}
            >
              <FiRefreshCw size={16} />
              Reset
            </button>
            <button 
              className="dg-btn dg-btn-primary" 
              onClick={handleSave} 
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? (
                <span className="dg-spinner" style={{ width: '16px', height: '16px' }}></span>
              ) : (
                <FiSave size={16} />
              )}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;