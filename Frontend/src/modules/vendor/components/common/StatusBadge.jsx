import React from 'react';
import { vendorTheme as themeColors } from '../../../../theme';

const StatusBadge = ({ status, size = 'md' }) => {
  const statusConfig = {
    REQUESTED: {
      label: 'Requested',
      color: '#F59E0B',
      bgColor: 'rgba(245, 158, 11, 0.1)',
    },
    ACCEPTED: {
      label: 'Accepted',
      color: '#3B82F6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
    },
    ASSIGNED: {
      label: 'Assigned',
      color: '#8B5CF6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
    },
    VISITED: {
      label: 'Visited',
      color: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
    },
    WORK_DONE: {
      label: 'Work Done',
      color: '#059669',
      bgColor: 'rgba(5, 150, 105, 0.1)',
    },
    WORKER_PAID: {
      label: 'Worker Paid',
      color: '#0284C7',
      bgColor: 'rgba(2, 132, 199, 0.1)',
    },
    SETTLEMENT_PENDING: {
      label: 'Settlement Pending',
      color: '#F97316',
      bgColor: 'rgba(249, 115, 22, 0.1)',
    },
    COMPLETED: {
      label: 'Completed',
      color: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
    },
    REJECTED: {
      label: 'Rejected',
      color: '#EF4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
    },
    ONLINE: {
      label: 'Online',
      color: '#2DD4BF',
      bgColor: 'rgba(45, 212, 191, 0.1)',
    },
    OFFLINE: {
      label: 'Offline',
      color: '#94A3B8',
      bgColor: 'rgba(148, 163, 184, 0.1)',
    },
  };

  const config = statusConfig[status] || {
    label: status,
    color: '#6B7280',
    bgColor: '#F3F4F6',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`font-black uppercase tracking-widest rounded-lg border border-white/5 transition-all ${sizeClasses[size]}`}
      style={{
        background: config.bgColor,
        color: config.color,
        borderColor: `${config.color}20`
      }}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;

