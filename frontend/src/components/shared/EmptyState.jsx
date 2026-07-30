import React from 'react';

export default function EmptyState({ icon, title, text, action }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      textAlign: 'center',
    }}>
      {icon && (
        <div style={{
          width: 56, height: 56, borderRadius: 'var(--radius-lg)',
          background: 'var(--color-primary-faint)', color: 'var(--color-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 'var(--space-4)',
        }}>
          {icon}
        </div>
      )}
      <h3 style={{
        fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)',
        marginBottom: 'var(--space-2)',
      }}>{title}</h3>
      <p style={{
        fontSize: '0.875rem', color: 'var(--text-tertiary)',
        maxWidth: 400, lineHeight: 1.6, marginBottom: action ? 'var(--space-5)' : 0,
      }}>{text}</p>
      {action}
    </div>
  );
}
