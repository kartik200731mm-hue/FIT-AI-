import React, { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';

interface Props {
  compact?: boolean;
}

export const HealthDisclaimer: React.FC<Props> = ({ compact = false }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      style={{
        background: 'rgba(6, 182, 212, 0.08)',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        borderRadius: 'var(--radius-md)',
        padding: compact ? '0.6rem 0.9rem' : '0.9rem 1.25rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        marginBottom: '1.25rem',
        position: 'relative',
      }}
    >
      <ShieldAlert size={20} color="#06b6d4" style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1, fontSize: compact ? '0.8rem' : '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
        <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '2px' }}>
          Wellness & Safety Boundary:
        </strong>
        Fit AI provides general fitness and nutritional wellness guidance based on your inputs. It is not intended to diagnose, treat, or replace advice from licensed medical doctors or registered dietitians. For existing injuries, pregnancy, or medical concerns, please consult a qualified healthcare provider.
      </div>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '2px',
        }}
        aria-label="Dismiss disclaimer"
      >
        <X size={16} />
      </button>
    </div>
  );
};
