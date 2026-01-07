import React, { useState, useEffect } from 'react';
import { 
  FiSettings, FiSave, FiRefreshCw, FiPlay, FiFileText, FiCpu, 
  FiDownload, FiMonitor, FiEye, FiEyeOff, FiInfo 
} from 'react-icons/fi';
import { toast } from 'react-toastify';

function Settings({ settings, onUpdateSettings }) {
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    const defaultSettings = {
      general: { organization: '', projectName: 'Default', dateFormat: 'YYYY-MM-DD', timeZone: 'UTC' },
      execution: { autoSave: true, autoAdvance: false, requireCommentsOnFail: true, sessionTimeout: 30 },
      reporting: { includePassedTests: true, includeFailedTests: true, includeCharts: true, reportHeader: 'QA Report' },
      // Added groq_cloud as a default option potential
      grokAI: { enabled: false, provider: 'gemini', apiKey: '', model: 'grok-beta' },
      export: { defaultFormat: 'pdf', pdfPageSize: 'A4' },
      display: { theme: 'light', itemsPerPage: 20, showIds: true }
    };

    if (settings) {
      const merged = { ...defaultSettings };
      Object.keys(settings).forEach(key => {
        merged[key] = { ...defaultSettings[key], ...settings[key] };
      });
      setFormData(merged);
    } else {
      setFormData(defaultSettings);
    }
  }, [settings]);

  const handleInputChange = (category, field, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: { ...prev[category] || {}, [field]: value }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateSettings(activeTab, formData[activeTab]);
      toast.success("Settings saved!");
    } catch (error) { console.error(error); toast.error("Failed to save"); }
    finally { setIsSaving(false); }
  };

  const renderToggle = (category, field, label) => (
    <div className="setting-item">
      <div className="setting-info"><label>{label}</label></div>
      <label className="toggle-switch">
        <input type="checkbox" checked={formData[category]?.[field] || false} onChange={e => handleInputChange(category, field, e.target.checked)} />
        <span className="toggle-slider"></span>
      </label>
    </div>
  );

  const tabs = [
    { id: 'general', label: 'General', icon: FiSettings },
    { id: 'execution', label: 'Execution', icon: FiPlay },
    { id: 'reporting', label: 'Reporting', icon: FiFileText },
    { id: 'grokAI', label: 'AI Integration', icon: FiCpu },
    { id: 'export', label: 'Export', icon: FiDownload },
    { id: 'display', label: 'Display', icon: FiMonitor },
  ];

  return (
    <div className="settings-page">
      <div className="page-header"><h2 className="section-title">Settings</h2></div>
      <div className="settings-layout">
        <nav className="settings-nav">
          {tabs.map(t => (
            <button key={t.id} className={`settings-nav-item ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              <t.icon /> <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="settings-content">
          <div className="settings-section">
            <div className="section-header"><h3>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Settings</h3></div>
            
            {activeTab === 'general' && (
              <div className="settings-group">
                <div className="form-group"><label>Organization</label><input type="text" value={formData.general?.organization} onChange={e => handleInputChange('general', 'organization', e.target.value)} /></div>
                <div className="form-group"><label>Project Name</label><input type="text" value={formData.general?.projectName} onChange={e => handleInputChange('general', 'projectName', e.target.value)} /></div>
              </div>
            )}

            {activeTab === 'execution' && (
              <div className="settings-group">
                {renderToggle('execution', 'autoSave', 'Auto-Save Results')}
                {renderToggle('execution', 'autoAdvance', 'Auto-Advance on Pass')}
                <div className="form-group"><label>Session Timeout (mins)</label><input type="number" value={formData.execution?.sessionTimeout} onChange={e => handleInputChange('execution', 'sessionTimeout', e.target.value)} /></div>
              </div>
            )}

            {activeTab === 'grokAI' && (
              <div className="settings-group">
                {renderToggle('grokAI', 'enabled', 'Enable AI Analysis')}
                {formData.grokAI?.enabled && (
                  <>
                    <div className="form-group">
                      <label>AI Provider</label>
                      <select value={formData.grokAI?.provider || 'gemini'} onChange={e => handleInputChange('grokAI', 'provider', e.target.value)}>
                        <option value="gemini">Google Gemini (Free)</option>
                        <option value="groq_cloud">Groq Cloud (Free/Fast)</option>
                        <option value="openai">OpenAI (ChatGPT)</option>
                        <option value="grok">xAI (Grok)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>API Key</label>
                      <div className="input-with-button">
                        <input type={showApiKey ? "text" : "password"} value={formData.grokAI?.apiKey} onChange={e => handleInputChange('grokAI', 'apiKey', e.target.value)} placeholder="Enter API Key" />
                        <button type="button" className="btn-icon" onClick={() => setShowApiKey(!showApiKey)}>{showApiKey ? <FiEyeOff /> : <FiEye />}</button>
                      </div>
                    </div>
                    <div className="info-box">
                      <FiInfo size={16} />
                      <p style={{fontSize: '12px', margin: 0, lineHeight: 1.5}}>
                        <strong>Gemini:</strong> aistudio.google.com<br/>
                        <strong>Groq:</strong> console.groq.com (Llama 3)<br/>
                        <strong>OpenAI:</strong> platform.openai.com
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'reporting' && (
              <div className="settings-group">
                {renderToggle('reporting', 'includePassedTests', 'Include Passed')}
                {renderToggle('reporting', 'includeFailedTests', 'Include Failed')}
                <div className="form-group"><label>Report Header</label><input type="text" value={formData.reporting?.reportHeader} onChange={e => handleInputChange('reporting', 'reportHeader', e.target.value)} /></div>
              </div>
            )}

            {activeTab === 'export' && (
              <div className="settings-group">
                <div className="form-group"><label>Default Format</label><select value={formData.export?.defaultFormat} onChange={e => handleInputChange('export', 'defaultFormat', e.target.value)}><option value="pdf">PDF</option><option value="word">Word</option></select></div>
              </div>
            )}

            {activeTab === 'display' && (
              <div className="settings-group">
                <div className="form-group"><label>Theme</label><select value={formData.display?.theme} onChange={e => handleInputChange('display', 'theme', e.target.value)}><option value="light">Light</option></select></div>
                <div className="form-group"><label>Items Per Page</label><input type="number" value={formData.display?.itemsPerPage} onChange={e => handleInputChange('display', 'itemsPerPage', e.target.value)} /></div>
              </div>
            )}

            <div className="settings-actions">
              <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <FiRefreshCw className="spin" /> : <><FiSave /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Settings;