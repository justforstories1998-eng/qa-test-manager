import React from 'react';

export default function EmptyState({ icon, title, text, action }) {
  return (
    <div className="dg-empty">
      <div className="dg-empty-icon">{icon}</div>
      <h3 className="dg-empty-title">{title}</h3>
      <p className="dg-empty-text">{text}</p>
      {action}
    </div>
  );
}
