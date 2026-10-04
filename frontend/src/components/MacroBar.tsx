import React from 'react';

interface Props {
  label: string;
  current: number;
  target: number;
  unit?: string;
  color: string;
}

export const MacroBar: React.FC<Props> = ({ label, current, target, unit = 'g', color }) => {
  const percentage = Math.min(100, Math.round((current / (target || 1)) * 100));

  return (
    <div style={{ marginBottom: '0.85rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.85rem',
          marginBottom: '0.35rem',
        }}
      >
        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
          {current} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>/ {target}{unit}</span>
        </span>
      </div>
      <div
        style={{
          height: '8px',
          background: 'var(--bg-surface-elevated)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            background: color,
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.4s ease-out',
          }}
        />
      </div>
    </div>
  );
};
