import React from 'react';

interface ActivityHeatmapProps {
  days?: { date: string; level: 0 | 1 | 2 | 3; label: string }[];
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ days }) => {
  // Generate last 28 days if none provided
  const activityDays = React.useMemo(() => {
    if (days && days.length > 0) return days;
    const list: { date: string; level: 0 | 1 | 2 | 3; label: string }[] = [];
    const now = new Date();
    for (let i = 27; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      // Generate realistic active streak distribution
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const level = (i < 5 ? 3 : (i % 3 === 0 ? 2 : (isWeekend ? 1 : 2))) as 0 | 1 | 2 | 3;
      list.push({
        date: dateStr,
        level,
        label: `${dateStr}: ${level === 3 ? 'Full nutrition & workout completed' : level === 2 ? 'Nutrition target reached' : 'Logged partial activity'}`,
      });
    }
    return list;
  }, [days]);

  const getColor = (lvl: number) => {
    switch (lvl) {
      case 3:
        return '#10b981'; // vibrant emerald
      case 2:
        return 'rgba(16, 185, 129, 0.65)';
      case 1:
        return 'rgba(16, 185, 129, 0.3)';
      default:
        return 'rgba(255, 255, 255, 0.06)';
    }
  };

  return (
    <div className="surface-card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>4-Week Consistency Grid</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Daily fitness adherence & logging frequency</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>Less</span>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.06)' }} />
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.3)' }} />
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.65)' }} />
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981' }} />
          <span>More</span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '8px',
          padding: '0.5rem 0',
        }}
      >
        {activityDays.map((item, idx) => {
          const dateObj = new Date(item.date);
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNum = dateObj.getDate();

          return (
            <div
              key={idx}
              title={item.label}
              style={{
                aspectRatio: '1',
                borderRadius: 'var(--radius-sm)',
                background: getColor(item.level),
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.borderColor = '#10b981';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1 }}>{dayName[0]}</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: '2px' }}>{dayNum}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
