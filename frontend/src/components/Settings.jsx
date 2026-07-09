import React, { useState, useEffect } from 'react';
import {
  FiSettings, FiSave, FiRefreshCw, FiPlay, FiFileText,
  FiDownload, FiMonitor, FiBell, FiCheck, FiFile,
  FiCheckCircle, FiSun, FiMoon, FiSmartphone,
} from 'react-icons/fi';
import { toast } from 'react-toastify';

/* ══════════════ theme detection ══════════════ */
const useTheme = () => {
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'dark'
  );
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return theme;
};

/* ══════════════ defaults ══════════════ */
const DEFAULT_SETTINGS = {
  general: { language: 'en', autoBackup: true, telemetry: false },
  execution: { autoSave: true, autoAdvance: false, requireCommentsOnFail: true, sessionTimeout: 30 },
  reporting: { includePassedTests: true, includeFailedTests: true, includeCharts: true, reportHeader: 'QA Report', reportFooter: 'Confidential' },
  export: { defaultFormat: 'pdf', pdfPageSize: 'A4' },
  notifications: { showSuccess: true, showErrors: true, duration: 3000 },
  display: { theme: 'dark', itemsPerPage: 20, showIds: true },
};

function Settings({ settings, onUpdateSettings }) {
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState(() => JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    setFormData(settings ? { ...DEFAULT_SETTINGS, ...JSON.parse(JSON.stringify(settings)) } : JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
    setHasChanges(false);
  }, [settings]);

  const handleInputChange = (category, field, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: { ...(prev[category] || {}), [field]: value },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateSettings?.(activeTab, formData[activeTab]);
      setHasChanges(false);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(settings ? { ...DEFAULT_SETTINGS, ...JSON.parse(JSON.stringify(settings)) } : JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
    setHasChanges(false);
  };

  const Toggle = ({ category, field, label, description }) => {
    const value = formData[category]?.[field] ?? false;
    return (
      <div className="set-row set-toggle-row" onClick={() => handleInputChange(category, field, !value)}>
        <div className="set-row-info">
          <div className="set-row-label">{label}</div>
          {description && <div className="set-row-desc">{description}</div>}
        </div>
        <button
          type="button"
          className={`set-toggle ${value ? 'set-toggle-on' : ''}`}
          onClick={(e) => { e.stopPropagation(); handleInputChange(category, field, !value); }}
          aria-pressed={value}
        >
          <span className="set-toggle-thumb" />
        </button>
      </div>
    );
  };

  const tabs = [
    { id: 'general', label: 'General', icon: FiSettings, description: 'Application preferences' },
    { id: 'execution', label: 'Execution', icon: FiPlay, description: 'Test run behavior' },
    { id: 'reporting', label: 'Reporting', icon: FiFileText, description: 'Report preferences' },
    { id: 'export', label: 'Export', icon: FiDownload, description: 'Export defaults' },
    { id: 'notifications', label: 'Notifications', icon: FiBell, description: 'Alert preferences' },
    { id: 'display', label: 'Display', icon: FiMonitor, description: 'Appearance & tables' },
  ];

  const activeTabData = tabs.find(t => t.id === activeTab);
  const ActiveIcon = activeTabData?.icon || FiSettings;

  return (
    <div className="set-page">
      {/* ── Header ── */}
      <div className="set-header">
        <div className="set-header-left">
          <div className="set-header-icon">
            <FiSettings size={19} />
          </div>
          <div>
            <h1 className="set-title">Settings</h1>
            <p className="set-subtitle">Manage your application preferences</p>
          </div>
        </div>
        {hasChanges && (
          <div className="set-changes-pill">
            <span className="set-pulse-dot" />
            Unsaved changes
          </div>
        )}
      </div>

      {/* ── Body: two columns ── */}
      <div className="set-body">
        {/* Sidebar */}
        <aside className="set-sidebar">
          <div className="set-sidebar-title">Categories</div>
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                className={`set-tab ${isActive ? 'set-tab-active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {isActive && <div className="set-tab-indicator" />}
                <div className={`set-tab-icon ${isActive ? 'set-tab-icon-active' : ''}`}>
                  <Icon size={15} />
                </div>
                <div className="set-tab-content">
                  <div className="set-tab-label">{t.label}</div>
                  <div className="set-tab-desc">{t.description}</div>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Content panel */}
        <main className="set-panel">
          <div className="set-panel-header">
            <div className="set-panel-icon">
              <ActiveIcon size={18} />
            </div>
            <div>
              <h2 className="set-panel-title">{activeTabData?.label}</h2>
              <p className="set-panel-desc">{activeTabData?.description}</p>
            </div>
          </div>

          <div className="set-panel-content">
            {activeTab === 'general' && (
              <>
                <div className="set-section">
                  <h3 className="set-section-title">Language & Region</h3>
                  <div className="set-row">
                    <div className="set-row-info">
                      <div className="set-row-label">Interface Language</div>
                      <div className="set-row-desc">Choose your preferred language</div>
                    </div>
                    <select
                      className="set-select"
                      value={formData.general?.language || 'en'}
                      onChange={e => handleInputChange('general', 'language', e.target.value)}
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                      <option value="ja">日本語</option>
                    </select>
                  </div>
                </div>

                <div className="set-section">
                  <h3 className="set-section-title">Data & Privacy</h3>
                  <Toggle category="general" field="autoBackup" label="Automatic Backup" description="Periodically back up your test data locally" />
                  <Toggle category="general" field="telemetry" label="Usage Analytics" description="Share anonymous usage data to help improve the product" />
                </div>
              </>
            )}

            {activeTab === 'execution' && (
              <>
                <div className="set-section">
                  <h3 className="set-section-title">Test Run Behavior</h3>
                  <Toggle category="execution" field="autoSave" label="Auto-Save Results" description="Save results automatically as you progress" />
                  <Toggle category="execution" field="autoAdvance" label="Auto-Advance on Pass" description="Move to the next case when the current one passes" />
                  <Toggle category="execution" field="requireCommentsOnFail" label="Require Comments on Fail" description="Force testers to add a comment for failed tests" />
                </div>
                <div className="set-section">
                  <h3 className="set-section-title">Session</h3>
                  <div className="set-row">
                    <div className="set-row-info">
                      <div className="set-row-label">Session Timeout</div>
                      <div className="set-row-desc">Auto-logout after inactivity</div>
                    </div>
                    <div className="set-input-group">
                      <input
                        type="number" min="5" max="120"
                        className="set-input set-input-narrow"
                        value={formData.execution?.sessionTimeout || 30}
                        onChange={e => handleInputChange('execution', 'sessionTimeout', parseInt(e.target.value) || 30)}
                      />
                      <span className="set-input-suffix">min</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'reporting' && (
              <>
                <div className="set-section">
                  <h3 className="set-section-title">Report Content</h3>
                  <Toggle category="reporting" field="includePassedTests" label="Include Passed Tests" description="Show passed cases in reports" />
                  <Toggle category="reporting" field="includeFailedTests" label="Include Failed Tests" description="Show failed cases in reports" />
                  <Toggle category="reporting" field="includeCharts" label="Include Charts" description="Add visual charts and graphs" />
                </div>
                <div className="set-section">
                  <h3 className="set-section-title">Branding</h3>
                  <div className="set-row set-row-column">
                    <div className="set-row-info">
                      <div className="set-row-label">Report Header</div>
                      <div className="set-row-desc">Text displayed at the top of every report</div>
                    </div>
                    <input
                      type="text" className="set-input"
                      placeholder="e.g. QA Report — Sprint 24"
                      value={formData.reporting?.reportHeader || ''}
                      onChange={e => handleInputChange('reporting', 'reportHeader', e.target.value)}
                    />
                  </div>
                  <div className="set-row set-row-column">
                    <div className="set-row-info">
                      <div className="set-row-label">Report Footer</div>
                      <div className="set-row-desc">Text displayed at the bottom of every report</div>
                    </div>
                    <input
                      type="text" className="set-input"
                      placeholder="e.g. Confidential — Internal Use Only"
                      value={formData.reporting?.reportFooter || ''}
                      onChange={e => handleInputChange('reporting', 'reportFooter', e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'export' && (
              <>
                <div className="set-section">
                  <h3 className="set-section-title">Default Format</h3>
                  <div className="set-row set-row-column">
                    <div className="set-row-info">
                      <div className="set-row-label">Preferred Export Type</div>
                      <div className="set-row-desc">Used when exporting reports</div>
                    </div>
                    <div className="set-option-grid set-option-grid-2">
                      {[
                        { id: 'pdf', name: 'PDF Document', desc: 'Best for sharing & printing', icon: FiFileText },
                        { id: 'word', name: 'Word Document', desc: 'Editable format', icon: FiFile },
                      ].map(f => {
                        const active = formData.export?.defaultFormat === f.id;
                        const Icon = f.icon;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            className={`set-option-card ${active ? 'set-option-card-active' : ''}`}
                            onClick={() => handleInputChange('export', 'defaultFormat', f.id)}
                          >
                            <div className="set-option-icon">
                              <Icon size={18} />
                            </div>
                            <div className="set-option-name">{f.name}</div>
                            <div className="set-option-desc">{f.desc}</div>
                            {active && (
                              <div className="set-option-check">
                                <FiCheck size={12} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="set-section">
                  <h3 className="set-section-title">Page Setup</h3>
                  <div className="set-row">
                    <div className="set-row-info">
                      <div className="set-row-label">PDF Page Size</div>
                      <div className="set-row-desc">Page dimensions for PDF exports</div>
                    </div>
                    <select
                      className="set-select"
                      value={formData.export?.pdfPageSize || 'A4'}
                      onChange={e => handleInputChange('export', 'pdfPageSize', e.target.value)}
                    >
                      <option value="A4">A4 (210 × 297 mm)</option>
                      <option value="Letter">Letter (8.5 × 11 in)</option>
                      <option value="Legal">Legal (8.5 × 14 in)</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'notifications' && (
              <>
                <div className="set-section">
                  <h3 className="set-section-title">Alert Preferences</h3>
                  <Toggle category="notifications" field="showSuccess" label="Success Notifications" description="Show a toast after successful actions" />
                  <Toggle category="notifications" field="showErrors" label="Error Notifications" description="Show a toast when something fails" />
                </div>
                <div className="set-section">
                  <h3 className="set-section-title">Timing</h3>
                  <div className="set-row">
                    <div className="set-row-info">
                      <div className="set-row-label">Display Duration</div>
                      <div className="set-row-desc">How long each notification stays visible</div>
                    </div>
                    <div className="set-input-group">
                      <input
                        type="number" min="1000" max="10000" step="500"
                        className="set-input set-input-narrow"
                        value={formData.notifications?.duration || 3000}
                        onChange={e => handleInputChange('notifications', 'duration', parseInt(e.target.value) || 3000)}
                      />
                      <span className="set-input-suffix">ms</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'display' && (
              <>
                <div className="set-section">
                  <h3 className="set-section-title">Appearance</h3>
                  <div className="set-row set-row-column">
                    <div className="set-row-info">
                      <div className="set-row-label">Theme</div>
                      <div className="set-row-desc">Choose your preferred color scheme</div>
                    </div>
                    <div className="set-option-grid set-option-grid-3">
                      {[
                        { id: 'light', name: 'Light', icon: FiSun, preview: '#f1f5f9' },
                        { id: 'dark', name: 'Dark', icon: FiMoon, preview: '#0f172a' },
                        { id: 'system', name: 'System', icon: FiSmartphone, preview: 'linear-gradient(135deg, #f1f5f9 50%, #0f172a 50%)' },
                      ].map(t => {
                        const active = formData.display?.theme === t.id;
                        const Icon = t.icon;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            className={`set-option-card ${active ? 'set-option-card-active' : ''}`}
                            onClick={() => handleInputChange('display', 'theme', t.id)}
                          >
                            <div className="set-theme-preview" style={{ background: t.preview }}>
                              <Icon size={16} className="set-theme-preview-icon" />
                            </div>
                            <div className="set-option-name">{t.name}</div>
                            {active && (
                              <div className="set-option-check">
                                <FiCheck size={12} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="set-section">
                  <h3 className="set-section-title">Tables & Lists</h3>
                  <Toggle category="display" field="showIds" label="Show Test Case IDs" description="Display ADO IDs alongside test cases" />
                  <div className="set-row">
                    <div className="set-row-info">
                      <div className="set-row-label">Items Per Page</div>
                      <div className="set-row-desc">Rows shown in tables and lists</div>
                    </div>
                    <select
                      className="set-select"
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
              </>
            )}
          </div>

          {/* Footer */}
          <div className="set-panel-footer">
            <div className="set-footer-status">
              {hasChanges ? (
                <>
                  <span className="set-pulse-dot" />
                  <span style={{ color: 'var(--set-warning)' }}>Unsaved changes</span>
                </>
              ) : (
                <>
                  <FiCheckCircle size={14} style={{ color: 'var(--set-success)' }} />
                  <span style={{ color: 'var(--set-success)' }}>All changes saved</span>
                </>
              )}
            </div>
            <div className="set-footer-actions">
              <button
                className="set-btn set-btn-secondary"
                onClick={handleReset}
                disabled={!hasChanges}
              >
                <FiRefreshCw size={14} />
                Reset
              </button>
              <button
                className="set-btn set-btn-primary"
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
              >
                {isSaving ? (
                  <><span className="set-spinner" /> Saving…</>
                ) : (
                  <><FiSave size={14} /> Save Changes</>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        /* ── Dark tokens ── */
        .set-page {
          --set-bg: transparent;
          --set-card: rgba(255,255,255,0.02);
          --set-card-hover: rgba(255,255,255,0.04);
          --set-card-elevated: rgba(255,255,255,0.03);
          --set-border: rgba(255,255,255,0.06);
          --set-border-hover: rgba(255,255,255,0.1);
          --set-input-bg: rgba(255,255,255,0.03);
          --set-text: #f1f5f9;
          --set-text-secondary: rgba(203,213,225,0.85);
          --set-text-muted: rgba(148,163,184,0.55);
          --set-accent: #818cf8;
          --set-accent-strong: #6366f1;
          --set-accent-bg: rgba(99,102,241,0.12);
          --set-accent-border: rgba(99,102,241,0.22);
          --set-accent-glow: rgba(99,102,241,0.08);
          --set-warning: #fbbf24;
          --set-success: #4ade80;
          --set-danger: #f87171;
          --set-hover-bg: rgba(99,102,241,0.06);
          --set-toggle-off: rgba(255,255,255,0.12);
        }

        /* ── Light overrides ── */
        [data-theme="light"] .set-page {
          --set-card: #ffffff;
          --set-card-hover: #fafbfd;
          --set-card-elevated: #ffffff;
          --set-border: #e5e7eb;
          --set-border-hover: #d1d5db;
          --set-input-bg: #ffffff;
          --set-text: #0f172a;
          --set-text-secondary: #475569;
          --set-text-muted: #94a3b8;
          --set-accent: #6366f1;
          --set-accent-strong: #4f46e5;
          --set-accent-bg: rgba(99,102,241,0.08);
          --set-accent-border: rgba(99,102,241,0.2);
          --set-accent-glow: rgba(99,102,241,0.06);
          --set-warning: #d97706;
          --set-success: #16a34a;
          --set-danger: #dc2626;
          --set-hover-bg: rgba(99,102,241,0.04);
          --set-toggle-off: #cbd5e1;
        }

        /* ── Layout: use viewport height so content is scrollable ── */
        .set-page {
          display: flex; flex-direction: column;
          height: 100%;
          min-height: 0;
          overflow: hidden;
          background: var(--set-bg);
        }

        /* ── Header ── */
        .set-header {
          padding: 24px 32px 20px;
          border-bottom: 1px solid var(--set-border);
          display: flex; align-items: flex-start; justify-content: space-between; gap: 20px;
          flex-shrink: 0;
        }
        .set-header-left { display: flex; align-items: center; gap: 12px; }
        .set-header-icon {
          width: 40px; height: 40px; border-radius: 11px;
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2));
          border: 1px solid var(--set-accent-border);
          color: var(--set-accent);
          display: flex; align-items: center; justify-content: center;
        }
        .set-title {
          margin: 0; font-size: 22px; font-weight: 700;
          color: var(--set-text); letter-spacing: -0.3px; line-height: 1.2;
        }
        .set-subtitle {
          margin: 3px 0 0; font-size: 13px; color: var(--set-text-muted);
        }
        .set-changes-pill {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 6px 12px; border-radius: 8px;
          background: rgba(251,191,36,0.1);
          border: 1px solid rgba(251,191,36,0.25);
          color: var(--set-warning);
          font-size: 12px; font-weight: 600;
        }
        .set-pulse-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: currentColor;
          animation: setPulse 1.6s ease-in-out infinite;
        }
        @keyframes setPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* ── Body (flexes to fill remaining space) ── */
        .set-body {
          flex: 1;
          display: flex; gap: 20px;
          padding: 20px 32px 24px;
          overflow: hidden;
          min-height: 0;
        }

        /* ── Sidebar ── */
        .set-sidebar {
          width: 240px; flex-shrink: 0;
          display: flex; flex-direction: column; gap: 3px;
          overflow-y: auto;
        }
        .set-sidebar-title {
          font-size: 10px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 1px;
          color: var(--set-text-muted);
          padding: 4px 12px 10px;
        }
        .set-tab {
          position: relative;
          display: flex; align-items: center; gap: 11px;
          padding: 10px 12px;
          background: transparent; border: 1px solid transparent;
          border-radius: 9px; cursor: pointer;
          font-family: inherit; text-align: left;
          transition: all 0.15s;
        }
        .set-tab:hover { background: var(--set-card-hover); }
        .set-tab-active {
          background: var(--set-accent-bg) !important;
          border-color: var(--set-accent-border) !important;
        }
        .set-tab-indicator {
          position: absolute; left: -1px; top: 22%; bottom: 22%;
          width: 3px; border-radius: 0 3px 3px 0;
          background: linear-gradient(180deg, #6366f1, #8b5cf6);
        }
        .set-tab-icon {
          width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
          background: var(--set-card);
          border: 1px solid var(--set-border);
          display: flex; align-items: center; justify-content: center;
          color: var(--set-text-secondary);
          transition: all 0.15s;
        }
        .set-tab-icon-active {
          background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
          border-color: transparent !important;
          color: #fff !important;
          box-shadow: 0 3px 10px rgba(99,102,241,0.3);
        }
        .set-tab-content { flex: 1; min-width: 0; }
        .set-tab-label {
          font-size: 13px; font-weight: 600;
          color: var(--set-text);
          line-height: 1.2;
        }
        .set-tab-desc {
          font-size: 11px; color: var(--set-text-muted);
          margin-top: 2px;
        }

        /* ── Panel ── */
        .set-panel {
          flex: 1; min-width: 0;
          display: flex; flex-direction: column;
          background: var(--set-card);
          border: 1px solid var(--set-border);
          border-radius: 14px;
          overflow: hidden;
          min-height: 0;
        }
        .set-panel-header {
          display: flex; align-items: center; gap: 12px;
          padding: 20px 24px;
          border-bottom: 1px solid var(--set-border);
          flex-shrink: 0;
        }
        .set-panel-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: var(--set-accent-bg);
          border: 1px solid var(--set-accent-border);
          color: var(--set-accent);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .set-panel-title {
          margin: 0; font-size: 16px; font-weight: 700;
          color: var(--set-text); line-height: 1.2;
        }
        .set-panel-desc {
          margin: 2px 0 0; font-size: 12px; color: var(--set-text-muted);
        }
        .set-panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
          min-height: 0;
        }
        .set-panel-content::-webkit-scrollbar { width: 6px; }
        .set-panel-content::-webkit-scrollbar-track { background: transparent; }
        .set-panel-content::-webkit-scrollbar-thumb {
          background: var(--set-border); border-radius: 3px;
        }

        /* ── Section ── */
        .set-section { margin-bottom: 28px; }
        .set-section:last-child { margin-bottom: 8px; }
        .set-section-title {
          font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.8px;
          color: var(--set-text-muted);
          margin: 0 0 12px;
        }

        /* ── Row ── */
        .set-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px;
          padding: 14px 0;
          border-bottom: 1px solid var(--set-border);
        }
        .set-row:last-child { border-bottom: none; }
        .set-row-column {
          flex-direction: column; align-items: stretch; gap: 10px;
        }
        .set-toggle-row { cursor: pointer; }
        .set-toggle-row:hover .set-row-label { color: var(--set-accent); }

        .set-row-info { flex: 1; min-width: 0; }
        .set-row-label {
          font-size: 13px; font-weight: 500;
          color: var(--set-text);
          transition: color 0.15s;
        }
        .set-row-desc {
          font-size: 12px; color: var(--set-text-muted);
          margin-top: 3px; line-height: 1.4;
        }

        /* ── Toggle ── */
        .set-toggle {
          position: relative; flex-shrink: 0;
          width: 40px; height: 22px; border-radius: 999px;
          background: var(--set-toggle-off);
          border: none; cursor: pointer;
          transition: background 0.2s;
          padding: 0;
        }
        .set-toggle-on {
          background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
          box-shadow: 0 2px 8px rgba(99,102,241,0.35);
        }
        .set-toggle-thumb {
          position: absolute; top: 2px; left: 2px;
          width: 18px; height: 18px; border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          transition: transform 0.2s cubic-bezier(0.4,0,0.2,1);
        }
        .set-toggle-on .set-toggle-thumb {
          transform: translateX(18px);
        }

        /* ── Inputs ── */
        .set-input, .set-select {
          width: 100%; padding: 9px 13px;
          border-radius: 8px;
          border: 1px solid var(--set-border);
          background: var(--set-input-bg);
          color: var(--set-text);
          font-family: inherit; font-size: 13px;
          outline: none; transition: all 0.15s;
          box-sizing: border-box;
        }
        .set-input:focus, .set-select:focus {
          border-color: var(--set-accent);
          box-shadow: 0 0 0 3px var(--set-accent-glow);
        }
        .set-select { cursor: pointer; }
        .set-input-narrow { width: 90px; }
        .set-input-group {
          display: flex; align-items: center; gap: 8px;
        }
        .set-input-suffix {
          font-size: 12px; color: var(--set-text-muted); font-weight: 500;
        }

        /* ── Option cards ── */
        .set-option-grid { display: grid; gap: 10px; }
        .set-option-grid-2 { grid-template-columns: repeat(2, 1fr); }
        .set-option-grid-3 { grid-template-columns: repeat(3, 1fr); }
        .set-option-card {
          position: relative;
          padding: 14px;
          border: 1.5px solid var(--set-border);
          background: var(--set-input-bg);
          border-radius: 10px; cursor: pointer;
          transition: all 0.15s;
          font-family: inherit; text-align: left;
          display: flex; flex-direction: column; align-items: center; gap: 6px;
        }
        .set-option-card:hover {
          border-color: var(--set-border-hover);
          background: var(--set-card-hover);
        }
        .set-option-card-active {
          border-color: var(--set-accent) !important;
          background: var(--set-accent-glow) !important;
        }
        .set-option-icon {
          width: 36px; height: 36px; border-radius: 9px;
          background: var(--set-accent-bg);
          color: var(--set-accent);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 2px;
        }
        .set-option-name {
          font-size: 13px; font-weight: 600; color: var(--set-text);
        }
        .set-option-desc {
          font-size: 11px; color: var(--set-text-muted); text-align: center;
        }
        .set-option-check {
          position: absolute; top: 8px; right: 8px;
          width: 18px; height: 18px; border-radius: 50%;
          background: var(--set-accent);
          color: #fff;
          display: flex; align-items: center; justify-content: center;
        }

        /* ── Theme preview ── */
        .set-theme-preview {
          position: relative;
          width: 100%; height: 52px; border-radius: 8px;
          border: 1px solid var(--set-border);
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }
        .set-theme-preview-icon {
          color: #fff;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));
          mix-blend-mode: difference;
        }

        /* ── Footer ── */
        .set-panel-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 24px;
          border-top: 1px solid var(--set-border);
          background: var(--set-card-elevated);
          flex-shrink: 0;
        }
        .set-footer-status {
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 500;
        }
        .set-footer-actions {
          display: flex; gap: 8px;
        }

        /* ── Buttons ── */
        .set-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 16px; border-radius: 8px;
          font-family: inherit; font-size: 13px; font-weight: 500;
          border: none; cursor: pointer;
          transition: all 0.15s;
        }
        .set-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .set-btn-secondary {
          background: var(--set-card);
          border: 1px solid var(--set-border);
          color: var(--set-text-secondary);
        }
        .set-btn-secondary:hover:not(:disabled) {
          background: var(--set-card-hover);
          border-color: var(--set-border-hover);
          color: var(--set-text);
        }
        .set-btn-primary {
          background: linear-gradient(135deg, #6366f1, #7c3aed);
          color: #fff; font-weight: 600;
          box-shadow: 0 2px 10px rgba(99,102,241,0.3);
        }
        .set-btn-primary:hover:not(:disabled) {
          box-shadow: 0 4px 16px rgba(99,102,241,0.45);
          transform: translateY(-1px);
        }

        .set-spinner {
          display: inline-block; width: 13px; height: 13px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: setSpin 0.75s linear infinite;
        }
        @keyframes setSpin { to { transform: rotate(360deg); } }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .set-body {
            flex-direction: column; gap: 12px;
            padding: 16px 20px 20px;
            overflow: auto;
          }
          .set-sidebar {
            width: 100%;
            flex-direction: row;
            overflow-x: auto; overflow-y: hidden;
            gap: 6px; padding-bottom: 4px;
          }
          .set-sidebar-title { display: none; }
          .set-tab { flex-shrink: 0; min-width: 200px; }
          .set-panel { min-height: 500px; }
        }
        @media (max-width: 640px) {
          .set-header { padding: 20px; }
          .set-option-grid-3 { grid-template-columns: repeat(2, 1fr); }
          .set-panel-footer { flex-direction: column; gap: 12px; align-items: stretch; }
          .set-footer-actions { justify-content: flex-end; }
        }
      `}</style>
    </div>
  );
}

export default Settings;
