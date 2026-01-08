import React, { useState, useEffect } from 'react';
import { 
  FiSettings, FiSave, FiRefreshCw, FiPlay, FiFileText, FiCpu, 
  FiDownload, FiMonitor, FiEye, FiEyeOff, FiInfo, FiImage, FiTrash2, FiBell
} from 'react-icons/fi';
import { toast } from 'react-toastify';

function Settings({ settings, onUpdateSettings }) {
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

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
  }, [settings]);

  const handleInputChange = (category, field, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: { ...prev[category] || {}, [field]: value }
    }));
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
    } catch { toast.error("Failed to save"); }
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
    { id: 'notifications', label: 'Notifications', icon: FiBell },
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
                <div className="form-group">
                  <label>App Logo</label>
                  <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                    <div style={{width: '60px', height: '60px', borderRadius: '12px', border: '1px dashed #cbd5e1', overflow: 'hidden', display:'flex', alignItems:'center', justifyContent:'center', background: '#f8fafc'}}>
                      {formData.general?.logo ? <img src={formData.general.logo} alt="Logo" style={{width:'100%', height:'100%', objectFit:'contain'}} /> : <FiImage size={24} color="#cbd5e1" />}
                    </div>
                    <div>
                      <input type="file" id="logo-upload" hidden accept="image/*" onChange={handleLogoUpload} />
                      <label htmlFor="logo-upload" className="btn btn-secondary btn-sm">Upload New</label>
                      {formData.general?.logo && <button className="btn-icon-sm danger" onClick={() => handleInputChange('general', 'logo', '')} style={{marginLeft:'10px'}}><FiTrash2/></button>}
                    </div>
                  </div>
                </div>
                <div className="form-group"><label>Organization</label><input type="text" value={formData.general?.organization || ''} onChange={e => handleInputChange('general', 'organization', e.target.value)} /></div>
                <div className="form-group"><label>Project Name</label><input type="text" value={formData.general?.projectName || ''} onChange={e => handleInputChange('general', 'projectName', e.target.value)} /></div>
                <div className="form-row">
                  <div className="form-group"><label>Date Format</label><select value={formData.general?.dateFormat} onChange={e => handleInputChange('general', 'dateFormat', e.target.value)}><option>YYYY-MM-DD</option><option>MM/DD/YYYY</option></select></div>
                  <div className="form-group"><label>Time Zone</label><select value={formData.general?.timeZone} onChange={e => handleInputChange('general', 'timeZone', e.target.value)}><option>UTC</option><option>EST</option><option>PST</option></select></div>
                </div>
              </div>
            )}

            {activeTab === 'execution' && (
              <div className="settings-group">
                {renderToggle('execution', 'autoSave', 'Auto-Save Results')}
                {renderToggle('execution', 'autoAdvance', 'Auto-Advance on Pass')}
                {renderToggle('execution', 'requireCommentsOnFail', 'Require Comments on Fail')}
                <div className="form-group"><label>Session Timeout (mins)</label><input type="number" value={formData.execution?.sessionTimeout} onChange={e => handleInputChange('execution', 'sessionTimeout', e.target.value)} /></div>
              </div>
            )}

            {activeTab === 'reporting' && (
              <div className="settings-group">
                {renderToggle('reporting', 'includePassedTests', 'Include Passed Tests')}
                {renderToggle('reporting', 'includeFailedTests', 'Include Failed Tests')}
                {renderToggle('reporting', 'includeCharts', 'Include Charts')}
                <div className="form-group"><label>Report Header</label><input type="text" value={formData.reporting?.reportHeader} onChange={e => handleInputChange('reporting', 'reportHeader', e.target.value)} /></div>
                <div className="form-group"><label>Report Footer</label><input type="text" value={formData.reporting?.reportFooter} onChange={e => handleInputChange('reporting', 'reportFooter', e.target.value)} /></div>
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
                        <option value="groq_cloud">Groq Cloud (Free)</option>
                        <option value="openai">OpenAI</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>API Key</label>
                      <div className="input-with-button">
                        <input type={showApiKey ? "text" : "password"} value={formData.grokAI?.apiKey} onChange={e => handleInputChange('grokAI', 'apiKey', e.target.value)} />
                        <button type="button" className="btn-icon" onClick={() => setShowApiKey(!showApiKey)}>{showApiKey ? <FiEyeOff /> : <FiEye />}</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'export' && (
              <div className="settings-group">
                <div className="form-group"><label>Default Format</label><select value={formData.export?.defaultFormat} onChange={e => handleInputChange('export', 'defaultFormat', e.target.value)}><option value="pdf">PDF</option><option value="word">Word</option></select></div>
                <div className="form-group"><label>Page Size</label><select value={formData.export?.pdfPageSize} onChange={e => handleInputChange('export', 'pdfPageSize', e.target.value)}><option>A4</option><option>Letter</option></select></div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="settings-group">
                {renderToggle('notifications', 'showSuccess', 'Show Success Messages')}
                {renderToggle('notifications', 'showErrors', 'Show Error Messages')}
                <div className="form-group"><label>Duration (ms)</label><input type="number" value={formData.notifications?.duration} onChange={e => handleInputChange('notifications', 'duration', e.target.value)} /></div>
              </div>
            )}

            {activeTab === 'display' && (
              <div className="settings-group">
                <div className="form-group"><label>Theme</label><select value={formData.display?.theme} onChange={e => handleInputChange('display', 'theme', e.target.value)}><option value="light">Light</option></select></div>
                {renderToggle('display', 'showIds', 'Show Test Case IDs')}
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