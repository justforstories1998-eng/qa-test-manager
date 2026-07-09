import React, { useEffect } from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';

/* ══════════════ Base Modal ══════════════ */
export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handleEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidth = { sm: 420, md: 560, lg: 720, xl: 900 }[size] || 560;

  return (
    <div className="app-modal-overlay" onClick={onClose}>
      <div
        className="app-modal-container"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="app-modal-header">
            <h2 className="app-modal-title">{title}</h2>
            <button className="app-modal-close" onClick={onClose} aria-label="Close">
              <FiX size={16} />
            </button>
          </div>
        )}

        {!title && (
          <button className="app-modal-close app-modal-close-floating" onClick={onClose} aria-label="Close">
            <FiX size={16} />
          </button>
        )}

        <div className="app-modal-body">{children}</div>

        {footer && <div className="app-modal-footer">{footer}</div>}
      </div>

      <ModalStyles />
    </div>
  );
}

/* ══════════════ Confirm Dialog ══════════════ */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
}) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={null}
      size="sm"
      footer={
        <div className="app-modal-footer-actions">
          <button className="app-modal-btn app-modal-btn-secondary" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            className={`app-modal-btn ${danger ? 'app-modal-btn-danger' : 'app-modal-btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <div className="app-confirm-body">
        <div className={`app-confirm-icon ${danger ? 'app-confirm-icon-danger' : ''}`}>
          <FiAlertTriangle size={20} />
        </div>
        <div className="app-confirm-content">
          <h3 className="app-confirm-title">{title}</h3>
          <div className="app-confirm-message">{message}</div>
        </div>
      </div>
    </Modal>
  );
}

/* ══════════════ Shared theme-aware styles ══════════════ */
function ModalStyles() {
  return (
    <style>{`
      /* ── Dark tokens (default) ── */
      .app-modal-overlay {
        --mdl-bg: rgba(255,255,255,0.02);
        --mdl-card: #1a1d2e;
        --mdl-border: rgba(255,255,255,0.08);
        --mdl-border-strong: rgba(255,255,255,0.12);
        --mdl-input-bg: rgba(255,255,255,0.03);
        --mdl-text: #f1f5f9;
        --mdl-text-secondary: rgba(203,213,225,0.85);
        --mdl-text-muted: rgba(148,163,184,0.55);
        --mdl-accent: #818cf8;
        --mdl-accent-bg: rgba(99,102,241,0.12);
        --mdl-accent-border: rgba(99,102,241,0.22);
        --mdl-accent-glow: rgba(99,102,241,0.15);
        --mdl-danger: #f87171;
        --mdl-danger-bg: rgba(248,113,113,0.1);
        --mdl-danger-border: rgba(248,113,113,0.2);
        --mdl-shadow: 0 25px 80px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03);
        --mdl-overlay-bg: rgba(5, 5, 15, 0.65);
      }

      /* ── Light overrides ── */
      [data-theme="light"] .app-modal-overlay {
        --mdl-card: #ffffff;
        --mdl-border: #e5e7eb;
        --mdl-border-strong: #cbd5e1;
        --mdl-input-bg: #ffffff;
        --mdl-text: #0f172a;
        --mdl-text-secondary: #475569;
        --mdl-text-muted: #94a3b8;
        --mdl-accent: #6366f1;
        --mdl-accent-bg: rgba(99,102,241,0.08);
        --mdl-accent-border: rgba(99,102,241,0.2);
        --mdl-accent-glow: rgba(99,102,241,0.12);
        --mdl-danger: #dc2626;
        --mdl-danger-bg: rgba(220,38,38,0.06);
        --mdl-danger-border: rgba(220,38,38,0.15);
        --mdl-shadow: 0 25px 80px -12px rgba(15,23,42,0.2), 0 0 0 1px rgba(15,23,42,0.04);
        --mdl-overlay-bg: rgba(15, 23, 42, 0.55);
      }

      /* ── Overlay ── */
      .app-modal-overlay {
        position: fixed; inset: 0; z-index: 9999;
        background: var(--mdl-overlay-bg);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
        padding: 24px;
        animation: appMdlFadeIn 0.18s ease;
      }
      @keyframes appMdlFadeIn { from { opacity: 0; } to { opacity: 1; } }

      /* ── Container ── */
      .app-modal-container {
        position: relative;
        width: 100%;
        max-height: calc(100vh - 48px);
        display: flex; flex-direction: column;
        background: var(--mdl-card);
        border: 1px solid var(--mdl-border);
        border-radius: 16px;
        box-shadow: var(--mdl-shadow);
        overflow: hidden;
        animation: appMdlSlideUp 0.24s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes appMdlSlideUp {
        from { opacity: 0; transform: translateY(12px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      /* ── Header ── */
      .app-modal-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 18px 22px;
        border-bottom: 1px solid var(--mdl-border);
        flex-shrink: 0;
      }
      .app-modal-title {
        margin: 0;
        font-size: 16px; font-weight: 700;
        color: var(--mdl-text);
        letter-spacing: -0.2px;
        line-height: 1.3;
      }
      .app-modal-close {
        display: flex; align-items: center; justify-content: center;
        width: 30px; height: 30px; border-radius: 8px;
        background: transparent; border: 1px solid transparent;
        color: var(--mdl-text-muted); cursor: pointer;
        transition: all 0.15s; flex-shrink: 0;
      }
      .app-modal-close:hover {
        background: var(--mdl-input-bg);
        border-color: var(--mdl-border);
        color: var(--mdl-text);
      }
      .app-modal-close-floating {
        position: absolute;
        top: 16px; right: 16px;
        z-index: 2;
        background: var(--mdl-input-bg);
        border-color: var(--mdl-border);
      }

      /* ── Body ── */
      .app-modal-body {
        flex: 1;
        overflow-y: auto;
        padding: 22px;
      }
      .app-modal-body::-webkit-scrollbar { width: 6px; }
      .app-modal-body::-webkit-scrollbar-track { background: transparent; }
      .app-modal-body::-webkit-scrollbar-thumb {
        background: var(--mdl-border-strong); border-radius: 3px;
      }

      /* ── Footer ── */
      .app-modal-footer {
        padding: 14px 22px;
        border-top: 1px solid var(--mdl-border);
        background: var(--mdl-input-bg);
        flex-shrink: 0;
      }
      .app-modal-footer-actions {
        display: flex; gap: 8px; justify-content: flex-end; width: 100%;
      }

      /* ── Buttons ── */
      .app-modal-btn {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 9px 16px; border-radius: 9px;
        font-size: 13px; font-weight: 500; font-family: inherit;
        border: none; cursor: pointer;
        transition: all 0.15s;
      }
      .app-modal-btn-secondary {
        background: transparent;
        border: 1px solid var(--mdl-border-strong);
        color: var(--mdl-text-secondary);
      }
      .app-modal-btn-secondary:hover {
        background: var(--mdl-input-bg);
        border-color: var(--mdl-text-muted);
        color: var(--mdl-text);
      }
      .app-modal-btn-primary {
        background: linear-gradient(135deg, #6366f1, #7c3aed);
        color: #fff; font-weight: 600;
        box-shadow: 0 2px 10px rgba(99,102,241,0.3);
      }
      .app-modal-btn-primary:hover {
        box-shadow: 0 4px 16px rgba(99,102,241,0.45);
        transform: translateY(-1px);
      }
      .app-modal-btn-danger {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: #fff; font-weight: 600;
        box-shadow: 0 2px 10px rgba(239,68,68,0.3);
      }
      .app-modal-btn-danger:hover {
        box-shadow: 0 4px 16px rgba(239,68,68,0.45);
        transform: translateY(-1px);
      }

      /* ── Confirm Dialog ── */
      .app-confirm-body {
        display: flex; gap: 14px;
        align-items: flex-start;
      }
      .app-confirm-icon {
        width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
        background: var(--mdl-accent-bg);
        border: 1px solid var(--mdl-accent-border);
        color: var(--mdl-accent);
        display: flex; align-items: center; justify-content: center;
      }
      .app-confirm-icon-danger {
        background: var(--mdl-danger-bg);
        border-color: var(--mdl-danger-border);
        color: var(--mdl-danger);
      }
      .app-confirm-content { flex: 1; min-width: 0; }
      .app-confirm-title {
        margin: 0 0 8px;
        font-size: 16px; font-weight: 700;
        color: var(--mdl-text);
        line-height: 1.3;
      }
      .app-confirm-message {
        font-size: 13px; line-height: 1.55;
        color: var(--mdl-text-secondary);
      }
      .app-confirm-message p {
        margin: 0 0 8px;
      }
      .app-confirm-message p:last-child { margin-bottom: 0; }

      /* ── Force override any global page tokens leaking in ── */
      .app-modal-container input,
      .app-modal-container textarea,
      .app-modal-container select {
        color: var(--mdl-text);
      }

      @media (max-width: 640px) {
        .app-modal-overlay { padding: 12px; }
        .app-modal-header { padding: 14px 18px; }
        .app-modal-body { padding: 18px; }
        .app-modal-footer { padding: 12px 18px; }
        .app-modal-title { font-size: 15px; }
      }
    `}</style>
  );
}
