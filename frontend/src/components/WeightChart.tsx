import React, { useState } from 'react';
import { IWeightEntry } from '../types';

interface Props {
  entries: IWeightEntry[];
  targetWeight?: number | null;
}

export const WeightChart: React.FC<Props> = ({ entries, targetWeight }) => {
  const [hoveredEntry, setHoveredEntry] = useState<IWeightEntry | null>(null);

  if (!entries || entries.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
        No weight records logged yet. Log your weight to see your progress curve.
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) => (a.date > b.date ? 1 : -1));
  const weights = sorted.map((e) => e.weightKg);
  if (targetWeight) weights.push(targetWeight);

  const minWeight = Math.floor(Math.min(...weights) - 1.5);
  const maxWeight = Math.ceil(Math.max(...weights) + 1.5);
  const range = maxWeight - minWeight || 1;

  const width = 600;
  const height = 220;
  const padding = 35;

  const getX = (index: number) => {
    if (sorted.length === 1) return width / 2;
    return padding + (index / (sorted.length - 1)) * (width - 2 * padding);
  };

  const getY = (weight: number) => {
    return height - padding - ((weight - minWeight) / range) * (height - 2 * padding);
  };

  const points = sorted.map((e, idx) => `${getX(idx)},${getY(e.weightKg)}`).join(' ');

  return (
    <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', minWidth: '320px', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.33, 0.66, 1].map((ratio) => {
          const val = Math.round((minWeight + ratio * range) * 10) / 10;
          const yPos = getY(val);
          return (
            <g key={ratio}>
              <line
                x1={padding}
                y1={yPos}
                x2={width - padding}
                y2={yPos}
                stroke="var(--border-subtle)"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={padding - 6}
                y={yPos + 4}
                fill="var(--text-muted)"
                fontSize="10"
                textAnchor="end"
                fontFamily="var(--font-body)"
              >
                {val}kg
              </text>
            </g>
          );
        })}

        {/* Target Weight Line */}
        {targetWeight && (
          <g>
            <line
              x1={padding}
              y1={getY(targetWeight)}
              x2={width - padding}
              y2={getY(targetWeight)}
              stroke="#06b6d4"
              strokeDasharray="4 4"
              strokeWidth="1.5"
            />
            <text
              x={width - padding + 6}
              y={getY(targetWeight) + 4}
              fill="#06b6d4"
              fontSize="10"
              fontWeight="600"
              textAnchor="start"
            >
              Goal: {targetWeight}kg
            </text>
          </g>
        )}

        {/* Area fill */}
        {sorted.length > 1 && (
          <polygon
            points={`${getX(0)},${height - padding} ${points} ${getX(sorted.length - 1)},${height - padding}`}
            fill="url(#weightGrad)"
          />
        )}

        {/* Trend line */}
        {sorted.length > 1 && (
          <polyline
            points={points}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data points */}
        {sorted.map((entry, idx) => {
          const cx = getX(idx);
          const cy = getY(entry.weightKg);
          const isHovered = hoveredEntry?.id === entry.id;

          return (
            <g key={entry.id || idx}>
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 7 : 4.5}
                fill="#10b981"
                stroke="#0a0e17"
                strokeWidth="2"
                style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                onMouseEnter={() => setHoveredEntry(entry)}
                onMouseLeave={() => setHoveredEntry(null)}
              />
              {/* Date labels on x-axis */}
              {(idx === 0 || idx === sorted.length - 1 || idx % Math.ceil(sorted.length / 4) === 0) && (
                <text
                  x={cx}
                  y={height - 8}
                  fill="var(--text-muted)"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="var(--font-body)"
                >
                  {entry.date.slice(5)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hoveredEntry && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '12px',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            padding: '0.4rem 0.8rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 10,
          }}
        >
          <strong style={{ color: '#10b981' }}>{hoveredEntry.weightKg} kg</strong>
          <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>({hoveredEntry.date})</span>
          {hoveredEntry.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{hoveredEntry.notes}</div>}
        </div>
      )}
    </div>
  );
};
