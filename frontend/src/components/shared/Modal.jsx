import React, { useEffect } from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import { LiquidButton } from '../ui/liquid-glass-button';

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

  const sizeClass = { sm: '', md: '', lg: 'modal-lg', xl: 'modal-xl' }[size] || '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${sizeClass}`} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            <button className="modal-close" onClick={onClose} aria-label="Close">
              <FiX size={16} />
            </button>
          </div>
        )}
        {!title && (
          <button className="modal-close" style={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }} onClick={onClose} aria-label="Close">
            <FiX size={16} />
          </button>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  isOpen, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = true,
}) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm"
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
          <LiquidButton variant="secondary" size="sm" onClick={onClose}>{cancelLabel}</LiquidButton>
          <LiquidButton variant={danger ? 'destructive' : 'default'} size="sm" onClick={onConfirm}>{confirmLabel}</LiquidButton>
        </div>
      }
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: danger ? 'var(--color-danger-faint)' : 'var(--color-primary-faint)',
          color: danger ? 'var(--color-danger)' : 'var(--color-primary)',
        }}>
          <FiAlertTriangle size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
          <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text-secondary)' }}>{message}</div>
        </div>
      </div>
    </Modal>
  );
}
