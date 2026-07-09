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

  const renderToggle = (category, field, label, description) => {
    const value = formData[category]?.[field] ?? false;
    return (
      <div className="qa-set-row qa-set-toggle-row" onClick={() => handleInputChange(category, field, !value)}>
        <div className="qa-set-row-info">
          <div className="qa-set-row-label">{label}</div>
          {description && <div className="qa-set-row-desc">{description}</div>}
        </div>
        <button
          type="button"
          className={`qa-set-toggle ${value ? 'qa-set-toggle-on' : ''}`}
          onClick={(e) => { e.stopPropagation(); handleInputChange(category, field, !value); }}
          aria-pressed={value}
        >
          <span className="qa-set-toggle-thumb" />
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
    <div className="qa-set-page">
      {/* ── Header ── */}
      <div className="qa-set-header">
        <div className="qa-set-header-left">
          <div className="qa-set-header-icon">
            <FiSettings size={19} />
          </div>
          <div>
            <h1 className="qa-set-title">Settings</h1>
            <p className="qa-set-subtitle">Manage your application preferences</p>
          </div>
        </div>
        {hasChanges && (
          <div className="qa-set-changes-pill">
            <span className="qa-set-pulse-dot" />
            Unsaved changes
          </div>
        )}
      </div>

      {/* ── Body: two columns ── */}
      <div className="qa-set-body">
        {/* Sidebar */}
        <aside className="qa-set-sidebar">
          <div className="qa-set-sidebar-title">Categories</div>
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                className={`qa-set-tab ${isActive ? 'qa-set-tab-active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {isActive && <div className="qa-set-tab-indicator" />}
                <div className={`qa-set-tab-icon ${isActive ? 'qa-set-tab-icon-active' : ''}`}>
                  <Icon size={15} />
                </div>
                <div className="qa-set-tab-content">
                  <div className="qa-set-tab-label">{t.label}</div>
                  <div className="qa-set-tab-desc">{t.description}</div>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Content panel */}
        <main className="qa-set-panel">
          <div className="qa-set-panel-header">
            <div className="qa-set-panel-icon">
              <ActiveIcon size={18} />
            </div>
            <div className="qa-set-panel-header-text">
              <h2 className="qa-set-panel-title">{activeTabData?.label}</h2>
              <p className="qa-set-panel-desc">{activeTabData?.description}</p>
            </div>
          </div>

          <div className="qa-set-panel-content">
            {activeTab === 'general' && (
              <>
                <div className="qa-set-section">
                  <h3 className="qa-set-section-title">Language & Region</h3>
                  <div className="qa-set-row">
                    <div className="qa-set-row-info">
                      <div className="qa-set-row-label">Interface Language</div>
                      <div className="qa-set-row-desc">Choose your preferred language</div>
                    </div>
                    <div className="qa-set-row-control">
                      <select
                        className="qa-set-select"
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
                </div>

                <div className="qa-set-section">
                  <h3 className="qa-set-section-title">Data & Privacy</h3>
                  {renderToggle('general', 'autoBackup', 'Automatic Backup', 'Periodically back up your test data locally')}
                  {renderToggle('general', 'telemetry', 'Usage Analytics', 'Share anonymous usage data to help improve the product')}
                </div>
              </>
            )}

            {activeTab === 'execution' && (
              <>
                <div className="qa-set-section">
                  <h3 className="qa-set-section-title">Test Run Behavior</h3>
                  {renderToggle('execution', 'autoSave', 'Auto-Save Results', 'Save results automatically as you progress')}
                  {renderToggle('execution', 'autoAdvance', 'Auto-Advance on Pass', 'Move to the next case when the current one passes')}
                  {renderToggle('execution', 'requireCommentsOnFail', 'Require Comments on Fail', 'Force testers to add a comment for failed tests')}
                </div>
                <div className="qa-set-section">
                  <h3 className="qa-set-section-title">Session</h3>
                  <div className="qa-set-row">
                    <div className="qa-set-row-info">
                      <div className="qa-set-row-label">Session Timeout</div>
                      <div className="qa-set-row-desc">Auto-logout after inactivity</div>
                    </div>
                    <div className="qa-set-row-control">
                      <div className="qa-set-input-group">
                        <input
                          type="number" min="5" max="120"
                          className="qa-set-input qa-set-input-narrow"
                          value={formData.execution?.sessionTimeout || 30}
                          onChange={e => handleInputChange('execution', 'sessionTimeout', parseInt(e.target.value) || 30)}
                        />
                        <span className="qa-set-input-suffix">min</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'reporting' && (
              <>
                <div className="qa-set-section">
                  <h3 className="qa-set-section-title">Report Content</h3>
                  {renderToggle('reporting', 'includePassedTests', 'Include Passed Tests', 'Show passed cases in reports')}
                  {renderToggle('reporting', 'includeFailedTests', 'Include Failed Tests', 'Show failed cases in reports')}
                  {renderToggle('reporting', 'includeCharts', 'Include Charts', 'Add visual charts and graphs')}
                </div>
                <div className="qa-set-section">
                  <h3 className="qa-set-section-title">Branding</h3>
                  <div className="qa-set-row qa-set-row-stack">
                    <div className="qa-set-row-info">
                      <div className="qa-set-row-label">Report Header</div>
                      <div className="qa-set-row-desc">Text displayed at the top of every report</div>
                    </div>
                    <input
                      type="text" className="qa-set-input"
                      placeholder="e.g. QA Report — Sprint 24"
                      value={formData.reporting?.reportHeader || ''}
                      onChange={e => handleInputChange('reporting', 'reportHeader', e.target.value)}
                    />
                  </div>
                  <div className="qa-set-row qa-set-row-stack">
                    <div className="qa-set-row-info">
                      <div className="qa-set-row-label">Report Footer</div>
                      <div className="qa-set-row-desc">Text displayed at the bottom of every report</div>
                    </div>
                    <input
                      type="text" className="qa-set-input"
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
                <div className="qa-set-section">
                  <h3 className="qa-set-section-title">Default Format</h3>
                  <div className="qa-set-row qa-set-row-stack">
                    <div className="qa-set-row-info">
                      <div className="qa-set-row-label">Preferred Export Type</div>
                      <div className="qa-set-row-desc">Used when exporting reports</div>
                    </div>
                    <div className="qa-set-option-grid qa-set-option-grid-2">
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
                            className={`qa-set-option-card ${active ? 'qa-set-option-card-active' : ''}`}
                            onClick={() => handleInputChange('export', 'defaultFormat', f.id)}
                          >
                            <div className="qa-set-option-icon">
                              <Icon size={18} />
                            </div>
                            <div className="qa-set-option-name">{f.name}</div>
                            <div className="qa-set-option-desc">{f.desc}</div>
                            {active && (
                              <div className="qa-set-option-check">
                                <FiCheck size={12} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="qa-set-section">
                  <h3 className="qa-set-section-title">Page Setup</h3>
                  <div className="qa-set-row">
                    <div className="qa-set-row-info">
                      <div className="qa-set-row-label">PDF Page Size</div>
                      <div className="qa-set-row-desc">Page dimensions for PDF exports</div>
                    </div>
                    <div className="qa-set-row-control">
                      <select
                        className="qa-set-select"
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
              </>
            )}

            {activeTab === 'notifications' && (
              <>
                <div className="qa-set-section">
                  <h3 className="qa-set-section-title">Alert Preferences</h3>
                  {renderToggle('notifications', 'showSuccess', 'Success Notifications', 'Show a toast after successful actions')}
                  {renderToggle('notifications', 'showErrors', 'Error Notifications', 'Show a toast when something fails')}
                </div>
                <div className="qa-set-section">
                  <h3 className="qa-set-section-title">Timing</h3>
                  <div className="qa-set-row">
                    <div className="qa-set-row-info">
                      <div className="qa-set-row-label">Display Duration</div>
                      <div className="qa-set-row-desc">How long each notification stays visible</div>
                    </div>
                    <div className="qa-set-row-control">
                      <div className="qa-set-input-group">
                        <input
                          type="number" min="1000" max="10000" step="500"
                          className="qa-set-input qa-set-input-narrow"
                          value={formData.notifications?.duration || 3000}
                          onChange={e => handleInputChange('notifications', 'duration', parseInt(e.target.value) || 3000)}
                        />
                        <span className="qa-set-input-suffix">ms</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'display' && (
              <>
                <div className="qa-set-section">
                  <h3 className="qa-set-section-title">Appearance</h3>
                  <div className="qa-set-row qa-set-row-stack">
                    <div className="qa-set-row-info">
                      <div className="qa-set-row-label">Theme</div>
                      <div className="qa-set-row-desc">Choose your preferred color scheme</div>
                    </div>
                    <div className="qa-set-option-grid qa-set-option-grid-3">
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
                            className={`qa-set-option-card ${active ? 'qa-set-option-card-active' : ''}`}
                            onClick={() => handleInputChange('display', 'theme', t.id)}
                          >
                            <div className="qa-set-theme-preview" style={{ background: t.preview }}>
                              <Icon size={16} className="qa-set-theme-preview-icon" />
                            </div>
                            <div className="qa-set-option-name">{t.name}</div>
                            {active && (
                              <div className="qa-set-option-check">
                                <FiCheck size={12} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="qa-set-section">
                  <h3 className="qa-set-section-title">Tables & Lists</h3>
                  {renderToggle('display', 'showIds', 'Show Test Case IDs', 'Display ADO IDs alongside test cases')}
                  <div className="qa-set-row">
                    <div className="qa-set-row-info">
                      <div className="qa-set-row-label">Items Per Page</div>
                      <div className="qa-set-row-desc">Rows shown in tables and lists</div>
                    </div>
                    <div className="qa-set-row-control">
                      <select
                        className="qa-set-select"
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
              </>
            )}
          </div>

          {/* Footer */}
          <div className="qa-set-panel-footer">
            <div className="qa-set-footer-status">
              {hasChanges ? (
                <>
                  <span className="qa-set-pulse-dot" style={{ background: 'var(--qa-warning)' }} />
                  <span style={{ color: 'var(--qa-warning)' }}>Unsaved changes</span>
                </>
              ) : (
                <>
                  <FiCheckCircle size={14} style={{ color: 'var(--qa-success)' }} />
                  <span style={{ color: 'var(--qa-success)' }}>All changes saved</span>
                </>
              )}
            </div>
            <div className="qa-set-footer-actions">
              <button
                className="qa-set-btn qa-set-btn-secondary"
                onClick={handleReset}
                disabled={!hasChanges}
              >
                <FiRefreshCw size={14} />
                Reset
              </button>
              <button
                className="qa-set-btn qa-set-btn-primary"
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
              >
                {isSaving ? (
                  <><span className="qa-set-spinner" /> Saving…</>
                ) : (
                  <><FiSave size={14} /> Save Changes</>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        /* ═══════ Theme tokens (dark default) ═══════ */
        .qa-set-page {
          --qa-bg: transparent;
          --qa-card: rgba(255,255,255,0.02);
          --qa-card-hover: rgba(255,255,255,0.04);
          --qa-card-elevated: rgba(255,255,255,0.03);
          --qa-border: rgba(255,255,255,0.06);
          --qa-border-hover: rgba(255,255,255,0.1);
          --qa-input-bg: rgba(255,255,255,0.03);
          --qa-text: #f1f5f9;
          --qa-text-secondary: rgba(203,213,225,0.85);
          --qa-text-muted: rgba(148,163,184,0.55);
          --qa-accent: #818cf8;
          --qa-accent-bg: rgba(99,102,241,0.12);
          --qa-accent-border: rgba(99,102,241,0.22);
          --qa-accent-glow: rgba(99,102,241,0.08);
          --qa-warning: #fbbf24;
          --qa-success: #4ade80;
          --qa-toggle-off: rgba(255,255,255,0.12);
        }

        [data-theme="light"] .qa-set-page {
          --qa-card: #ffffff;
          --qa-card-hover: #f8fafc;
          --qa-card-elevated: #ffffff;
          --qa-border: #e5e7eb;
          --qa-border-hover: #d1d5db;
          --qa-input-bg: #ffffff;
          --qa-text: #0f172a;
          --qa-text-secondary: #475569;
          --qa-text-muted: #94a3b8;
          --qa-accent: #6366f1;
          --qa-accent-bg: rgba(99,102,241,0.08);
          --qa-accent-border: rgba(99,102,241,0.2);
          --qa-accent-glow: rgba(99,102,241,0.06);
          --qa-warning: #d97706;
          --qa-success: #16a34a;
          --qa-toggle-off: #cbd5e1;
        }

        /* ═══════ Page layout — CRITICAL FIX ═══════ */
        .qa-set-page {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 600px;
          background: var(--qa-bg);
          box-sizing: border-box;
        }
        .qa-set-page *,
        .qa-set-page *::before,
        .qa-set-page *::after {
          box-sizing: border-box;
        }

        /* ═══════ Header ═══════ */
        .qa-set-header {
          padding: 24px 32px 20px;
          border-bottom: 1px solid var(--qa-border);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          flex-shrink: 0;
        }
        .qa-set-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .qa-set-header-icon {
          width: 40px;
          height: 40px;
          border-radius: 11px;
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2));
          border: 1px solid var(--qa-accent-border);
          color: var(--qa-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .qa-set-title {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          color: var(--qa-text);
          letter-spacing: -0.3px;
          line-height: 1.2;
        }
        .qa-set-subtitle {
          margin: 3px 0 0;
          font-size: 13px;
          color: var(--qa-text-muted);
        }
        .qa-set-changes-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 12px;
          border-radius: 8px;
          background: rgba(251,191,36,0.1);
          border: 1px solid rgba(251,191,36,0.25);
          color: var(--qa-warning);
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }
        .qa-set-pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: currentColor;
          animation: qaSetPulse 1.6s ease-in-out infinite;
        }
        @keyframes qaSetPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* ═══════ Body — Two columns FIX ═══════ */
        .qa-set-body {
          flex: 1;
          display: flex;
          gap: 20px;
          padding: 20px 32px 24px;
          min-height: 0;
          overflow: hidden;
        }

        /* ═══════ Sidebar — FORCE VISIBILITY ═══════ */
        .qa-set-sidebar {
          width: 240px;
          min-width: 240px;
          max-width: 240px;
          flex-shrink: 0;
          display: flex !important;
          flex-direction: column;
          gap: 3px;
          overflow-y: auto;
        }
        .qa-set-sidebar-title {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--qa-text-muted);
          padding: 4px 12px 10px;
        }
        .qa-set-tab {
          position: relative;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 10px 12px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 9px;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition: all 0.15s;
          width: 100%;
          outline: none;
        }
        .qa-set-tab:hover {
          background: var(--qa-card-hover);
        }
        .qa-set-tab-active {
          background: var(--qa-accent-bg) !important;
          border-color: var(--qa-accent-border) !important;
        }
        .qa-set-tab-indicator {
          position: absolute;
          left: -1px;
          top: 22%;
          bottom: 22%;
          width: 3px;
          border-radius: 0 3px 3px 0;
          background: linear-gradient(180deg, #6366f1, #8b5cf6);
        }
        .qa-set-tab-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          flex-shrink: 0;
          background: var(--qa-card);
          border: 1px solid var(--qa-border);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--qa-text-secondary);
          transition: all 0.15s;
        }
        .qa-set-tab-icon-active {
          background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
          border-color: transparent !important;
          color: #fff !important;
          box-shadow: 0 3px 10px rgba(99,102,241,0.3);
        }
        .qa-set-tab-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .qa-set-tab-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--qa-text);
          line-height: 1.2;
        }
        .qa-set-tab-desc {
          font-size: 11px;
          color: var(--qa-text-muted);
          margin-top: 2px;
        }

        /* ═══════ Panel ═══════ */
        .qa-set-panel {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          background: var(--qa-card);
          border: 1px solid var(--qa-border);
          border-radius: 14px;
          overflow: hidden;
          min-height: 0;
        }
        .qa-set-panel-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 24px;
          border-bottom: 1px solid var(--qa-border);
          flex-shrink: 0;
        }
        .qa-set-panel-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--qa-accent-bg);
          border: 1px solid var(--qa-accent-border);
          color: var(--qa-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .qa-set-panel-header-text {
          min-width: 0;
          flex: 1;
        }
        .qa-set-panel-title {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: var(--qa-text);
          line-height: 1.2;
        }
        .qa-set-panel-desc {
          margin: 2px 0 0;
          font-size: 12px;
          color: var(--qa-text-muted);
          line-height: 1.4;
        }
        .qa-set-panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
          min-height: 0;
        }
        .qa-set-panel-content::-webkit-scrollbar { width: 6px; }
        .qa-set-panel-content::-webkit-scrollbar-track { background: transparent; }
        .qa-set-panel-content::-webkit-scrollbar-thumb {
          background: var(--qa-border);
          border-radius: 3px;
        }

        /* ═══════ Section ═══════ */
        .qa-set-section {
          margin-bottom: 28px;
        }
        .qa-set-section:last-child {
          margin-bottom: 8px;
        }
        .qa-set-section-title {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--qa-text-muted);
          margin: 0 0 12px;
        }

        /* ═══════ Row — CRITICAL FIX for label/control layout ═══════ */
        .qa-set-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 14px 0;
          border-bottom: 1px solid var(--qa-border);
        }
        .qa-set-row:last-child {
          border-bottom: none;
        }
        .qa-set-row-stack {
          flex-direction: column;
          align-items: stretch;
          gap: 10px;
        }
        .qa-set-toggle-row {
          cursor: pointer;
        }
        .qa-set-toggle-row:hover .qa-set-row-label {
          color: var(--qa-accent);
        }

        .qa-set-row-info {
          flex: 1 1 auto;
          min-width: 0;
        }
        .qa-set-row-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--qa-text);
          transition: color 0.15s;
          line-height: 1.3;
        }
        .qa-set-row-desc {
          font-size: 12px;
          color: var(--qa-text-muted);
          margin-top: 4px;
          line-height: 1.4;
        }

        .qa-set-row-control {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
        }

        /* ═══════ Toggle ═══════ */
        .qa-set-toggle {
          position: relative;
          flex-shrink: 0;
          width: 40px;
          height: 22px;
          border-radius: 999px;
          background: var(--qa-toggle-off);
          border: none;
          cursor: pointer;
          transition: background 0.2s;
          padding: 0;
          outline: none;
        }
        .qa-set-toggle-on {
          background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
          box-shadow: 0 2px 8px rgba(99,102,241,0.35);
        }
        .qa-set-toggle-thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          transition: transform 0.2s cubic-bezier(0.4,0,0.2,1);
        }
        .qa-set-toggle-on .qa-set-toggle-thumb {
          transform: translateX(18px);
        }

        /* ═══════ Inputs ═══════ */
        .qa-set-input,
        .qa-set-select {
          padding: 9px 13px;
          border-radius: 8px;
          border: 1px solid var(--qa-border);
          background: var(--qa-input-bg);
          color: var(--qa-text);
          font-family: inherit;
          font-size: 13px;
          outline: none;
          transition: all 0.15s;
          box-sizing: border-box;
          min-width: 200px;
        }
        .qa-set-input:focus,
        .qa-set-select:focus {
          border-color: var(--qa-accent);
          box-shadow: 0 0 0 3px var(--qa-accent-glow);
        }
        .qa-set-select {
          cursor: pointer;
          min-width: 220px;
        }
        .qa-set-row-stack .qa-set-input,
        .qa-set-row-stack .qa-set-select {
          width: 100%;
          min-width: 0;
        }
        .qa-set-input-narrow {
          width: 90px;
          min-width: 90px;
        }
        .qa-set-input-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .qa-set-input-suffix {
          font-size: 12px;
          color: var(--qa-text-muted);
          font-weight: 500;
        }

        /* ═══════ Option cards ═══════ */
        .qa-set-option-grid {
          display: grid;
          gap: 10px;
        }
        .qa-set-option-grid-2 {
          grid-template-columns: repeat(2, 1fr);
        }
        .qa-set-option-grid-3 {
          grid-template-columns: repeat(3, 1fr);
        }
        .qa-set-option-card {
          position: relative;
          padding: 14px;
          border: 1.5px solid var(--qa-border);
          background: var(--qa-input-bg);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          outline: none;
        }
        .qa-set-option-card:hover {
          border-color: var(--qa-border-hover);
          background: var(--qa-card-hover);
        }
        .qa-set-option-card-active {
          border-color: var(--qa-accent) !important;
          background: var(--qa-accent-glow) !important;
        }
        .qa-set-option-icon {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          background: var(--qa-accent-bg);
          color: var(--qa-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2px;
        }
        .qa-set-option-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--qa-text);
        }
        .qa-set-option-desc {
          font-size: 11px;
          color: var(--qa-text-muted);
          text-align: center;
          line-height: 1.4;
        }
        .qa-set-option-check {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--qa-accent);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ═══════ Theme preview ═══════ */
        .qa-set-theme-preview {
          position: relative;
          width: 100%;
          height: 52px;
          border-radius: 8px;
          border: 1px solid var(--qa-border);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .qa-set-theme-preview-icon {
          color: #fff;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));
          mix-blend-mode: difference;
        }

        /* ═══════ Footer ═══════ */
        .qa-set-panel-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 24px;
          border-top: 1px solid var(--qa-border);
          background: var(--qa-card-elevated);
          flex-shrink: 0;
          gap: 12px;
        }
        .qa-set-footer-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 500;
        }
        .qa-set-footer-actions {
          display: flex;
          gap: 8px;
        }

        /* ═══════ Buttons ═══════ */
        .qa-set-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 16px;
          border-radius: 8px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.15s;
          outline: none;
        }
        .qa-set-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .qa-set-btn-secondary {
          background: var(--qa-card);
          border: 1px solid var(--qa-border);
          color: var(--qa-text-secondary);
        }
        .qa-set-btn-secondary:hover:not(:disabled) {
          background: var(--qa-card-hover);
          border-color: var(--qa-border-hover);
          color: var(--qa-text);
        }
        .qa-set-btn-primary {
          background: linear-gradient(135deg, #6366f1, #7c3aed);
          color: #fff;
          font-weight: 600;
          box-shadow: 0 2px 10px rgba(99,102,241,0.3);
        }
        .qa-set-btn-primary:hover:not(:disabled) {
          box-shadow: 0 4px 16px rgba(99,102,241,0.45);
          transform: translateY(-1px);
        }

        .qa-set-spinner {
          display: inline-block;
          width: 13px;
          height: 13px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: qaSetSpin 0.75s linear infinite;
        }
        @keyframes qaSetSpin {
          to { transform: rotate(360deg); }
        }

        /* ═══════ Responsive ═══════ */
        @media (max-width: 960px) {
          .qa-set-body {
            flex-direction: column;
            gap: 14px;
            padding: 16px 20px 20px;
            overflow: auto;
          }
          .qa-set-sidebar {
            width: 100%;
            min-width: 0;
            max-width: none;
            flex-direction: row;
            overflow-x: auto;
            overflow-y: hidden;
            gap: 6px;
            padding-bottom: 4px;
          }
          .qa-set-sidebar-title { display: none; }
          .qa-set-tab {
            flex-shrink: 0;
            min-width: 200px;
          }
          .qa-set-panel {
            min-height: 500px;
          }
        }
        @media (max-width: 640px) {
          .qa-set-header {
            padding: 20px;
            flex-direction: column;
            gap: 12px;
          }
          .qa-set-body {
            padding: 14px 16px 18px;
          }
          .qa-set-panel-content {
            padding: 16px 18px;
          }
          .qa-set-row {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          .qa-set-row-control {
            justify-content: stretch;
          }
          .qa-set-select,
          .qa-set-input {
            min-width: 0;
            width: 100%;
          }
          .qa-set-option-grid-3 {
            grid-template-columns: repeat(2, 1fr);
          }
          .qa-set-panel-footer {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }
          .qa-set-footer-actions {
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  );
}

export default Settings;
