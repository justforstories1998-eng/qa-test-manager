import React from 'react';

const badgeMap = {
  'Critical': 'red', 'High': 'amber', 'Medium': 'indigo', 'Low': 'gray',
  'Passed': 'green', 'Failed': 'red', 'Blocked': 'amber', 'N/A': 'gray', 'Not Run': 'gray',
  'Active': 'cyan', 'In Progress': 'amber', 'Under development': 'purple', 'Resolved': 'green', 'Closed': 'gray',
  'admin': 'amber', 'user': 'indigo',
  'Open': 'cyan', 'Done': 'green',
};

export default function Badge({ children, variant }) {
  const color = variant || badgeMap[children] || 'gray';
  return <span className={`dg-badge dg-badge-${color}`}>{children}</span>;
}
