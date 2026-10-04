import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { IWeightEntry, IBmiResult } from '../types';
import { WeightChart } from '../components/WeightChart';
import { BmiCard } from '../components/BmiCard';
import { HealthDisclaimer } from '../components/HealthDisclaimer';
import {
  Scale,
  Flame,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';

export const ProgressPage: React.FC = () => {
  const { profile, refreshUser } = useAuth();
  const [weightEntries, setWeightEntries] = useState<IWeightEntry[]>([]);
  const [bmiInfo, setBmiInfo] = useState<IBmiResult | null>(null);
  const [streak, setStreak] = useState(1);
  const [latestWeight, setLatestWeight] = useState(70);
  const [initialWeight, setInitialWeight] = useState(70);
  const [totalWeightDelta, setTotalWeightDelta] = useState(0);

  // Modal
  const [isLogWeightModalOpen, setIsLogWeightModalOpen] = useState(false);
  const [inputWeight, setInputWeight] = useState<number>(70);
  const [inputDate, setInputDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [inputNotes, setInputNotes] = useState('');

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const res = await api.getProgressSummary();
      setWeightEntries(res.weightEntries || []);
      setStreak(res.streak || 1);
      setLatestWeight(res.latestWeight);
      setInitialWeight(res.initialWeight);
      setTotalWeightDelta(res.totalWeightDelta);
      setInputWeight(res.latestWeight);
      if (res.bmiInfo) setBmiInfo(res.bmiInfo);
    } catch (err) {
      console.error('Failed loading progress summary:', err);
    }
  };

  const handleSaveWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.logWeight(Number(inputWeight), inputDate, inputNotes);
      setIsLogWeightModalOpen(false);
      setInputNotes('');
      await loadProgress();
      await refreshUser();
    } catch (err) {
      console.error('Failed logging weight:', err);
    }
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-emerald">Analytics & Insights</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Body Progress & BMI Context</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Long-term consistency metrics, body weight trends, and wellness health context.
          </p>
        </div>

        <button className="btn-primary" onClick={() => setIsLogWeightModalOpen(true)}>
          <Scale size={18} /> Log Weigh-In
        </button>
      </div>

      <HealthDisclaimer compact />

      {/* Top Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="surface-card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Weight</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '0.35rem 0' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>{latestWeight}</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>kg</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Calibrated baseline: {initialWeight} kg
          </div>
        </div>

        <div className="surface-card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Goal Target Weight</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '0.35rem 0' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#06b6d4' }}>
              {profile?.targetWeightKg || '—'}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>kg</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Distance to goal:{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              {profile?.targetWeightKg ? `${Math.abs(Math.round((latestWeight - profile.targetWeightKg) * 10) / 10)} kg` : 'N/A'}
            </strong>
          </div>
        </div>

        <div className="surface-card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Change</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '0.35rem 0' }}>
            {totalWeightDelta <= 0 ? (
              <ArrowDownRight size={26} color="#10b981" />
            ) : (
              <ArrowUpRight size={26} color="#f59e0b" />
            )}
            <span style={{ fontSize: '1.85rem', fontWeight: 800, color: totalWeightDelta <= 0 ? '#10b981' : '#f59e0b' }}>
              {totalWeightDelta > 0 ? `+${totalWeightDelta}` : totalWeightDelta}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>kg</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Across {weightEntries.length} logged weigh-ins
          </div>
        </div>

        <div className="surface-card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Streak</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0.35rem 0' }}>
            <Flame size={26} color="#f59e0b" />
            <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f59e0b' }}>{streak}</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>days</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Consecutive activity logs</div>
        </div>
      </div>

      {/* Chart and BMI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Weight Trend Graph */}
        <div className="surface-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Weight Trend History</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hover over points to see notes & dates</p>
            </div>
            <span className="badge badge-emerald">Interactive Graph</span>
          </div>

          <WeightChart entries={weightEntries} targetWeight={profile?.targetWeightKg} />
        </div>

        {/* BMI Contextual Card */}
        <BmiCard bmiInfo={bmiInfo} heightCm={profile?.heightCm} weightKg={latestWeight} />
      </div>

      {/* Weigh-in History Table */}
      <div className="surface-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>Recent Weigh-In Records</h3>
        {weightEntries.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.6rem 0.8rem' }}>Date</th>
                  <th style={{ padding: '0.6rem 0.8rem' }}>Weight (kg)</th>
                  <th style={{ padding: '0.6rem 0.8rem' }}>BMI</th>
                  <th style={{ padding: '0.6rem 0.8rem' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {[...weightEntries].reverse().map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.75rem 0.8rem', fontWeight: 600 }}>{entry.date}</td>
                    <td style={{ padding: '0.75rem 0.8rem', fontWeight: 700, color: '#10b981' }}>{entry.weightKg} kg</td>
                    <td style={{ padding: '0.75rem 0.8rem', color: 'var(--text-secondary)' }}>{entry.bmi}</td>
                    <td style={{ padding: '0.75rem 0.8rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {entry.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No records logged yet. Use the Log Weigh-In button to record your first entry.
          </div>
        )}
      </div>

      {/* Log Weight Modal */}
      {isLogWeightModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsLogWeightModalOpen(false)}>
          <div className="modal-content" style={{ padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem' }}>Log Weight Entry</h3>

            <form onSubmit={handleSaveWeight}>
              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="300"
                  className="form-input"
                  value={inputWeight}
                  onChange={(e) => setInputWeight(Number(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={inputDate}
                  onChange={(e) => setInputDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Morning weigh-in before breakfast"
                  value={inputNotes}
                  onChange={(e) => setInputNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsLogWeightModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 2 }}>
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
