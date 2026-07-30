import React from 'react';

const badgeMap = {
  'Critical': 'danger', 'High': 'warning', 'Medium': 'primary', 'Low': 'neutral',
  'Passed': 'success', 'Failed': 'danger', 'Blocked': 'warning', 'N/A': 'neutral', 'Not Run': 'neutral',
  'Active': 'info', 'In Progress': 'warning', 'Under development': 'primary', 'Resolved': 'success', 'Closed': 'neutral',
  'admin': 'warning', 'user': 'primary',
  'Open': 'info', 'Done': 'success',
};

export default function Badge({ children, variant }) {
  const color = variant || badgeMap[children] || 'neutral';
  return (
    <span className={`badge badge-${color}`}>
      <span className="badge-dot" />
      {children}
    </span>
  );
}
