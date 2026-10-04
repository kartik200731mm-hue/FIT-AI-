import React from 'react';
import { IBmiResult } from '../types';
import { Info } from 'lucide-react';

interface Props {
  bmiInfo: IBmiResult | null;
  heightCm?: number;
  weightKg?: number;
  age?: number;
}

export const BmiCard: React.FC<Props> = ({ bmiInfo, heightCm, age }) => {
  if (!bmiInfo) return null;
  const isMinor = age !== undefined && age < 18;

  return (
    <div className="surface-card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>BMI Context & Reference</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Body Mass Index relative to height & weight</p>
        </div>
        <div
          style={{
            background: `${bmiInfo.color}22`,
            border: `1px solid ${bmiInfo.color}55`,
            color: bmiInfo.color,
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            fontWeight: 800,
            fontSize: '0.85rem',
          }}
        >
          {bmiInfo.category}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: bmiInfo.color }}>
          {bmiInfo.bmi}
        </span>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>kg/m²</span>
      </div>

      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
        {bmiInfo.context}
      </p>

      {bmiInfo.healthyWeightRangeKg && (
        <div
          style={{
            background: 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            fontSize: '0.85rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: 'var(--text-secondary)' }}>Standard Healthy Weight Range (for {heightCm || 170}cm):</span>
          <strong style={{ color: 'var(--text-primary)' }}>
            {bmiInfo.healthyWeightRangeKg.min} – {bmiInfo.healthyWeightRangeKg.max} kg
          </strong>
        </div>
      )}

      {isMinor ? (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            color: '#10b981',
          }}
        >
          <strong>Youth Growth Note:</strong> Standard adult BMI classifications do not apply to individuals under 18. Balanced nourishment, energetic sports, hydration, and restful sleep take priority over weight numbers.
        </div>
      ) : (
        <div
          style={{
            marginTop: '1rem',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'flex-start',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            lineHeight: 1.4,
          }}
        >
          <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong>Important Context:</strong> BMI is a standard population screening metric and does not distinguish between muscle mass and body fat. Athletic individuals with high muscle density may have an elevated BMI while in prime cardiovascular and metabolic health.
          </span>
        </div>
      )}
    </div>
  );
};
