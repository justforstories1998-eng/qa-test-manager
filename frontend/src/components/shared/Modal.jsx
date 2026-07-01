import React from 'react';

export function Modal({ isOpen, onClose, title, children, footer, size }) {
  if (!isOpen) return null;
  return (
    <div className="dg-modal-overlay" onClick={onClose}>
      <div className={`dg-modal${size === 'lg' ? ' dg-modal-lg' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="dg-modal-header">
          <h3 className="dg-modal-title">{title}</h3>
          <button className="dg-modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="dg-modal-body">{children}</div>
        {footer && <div className="dg-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', danger = true }) {
  if (!isOpen) return null;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button className="dg-btn dg-btn-secondary" onClick={onClose}>Cancel</button>
          <button className={`dg-btn ${danger ? 'dg-btn-danger' : 'dg-btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
        </>
      }
    >
      <p style={{ color: '#6c7a89', margin: 0, lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}
