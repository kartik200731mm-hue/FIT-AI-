import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { IReminder, IAchievement } from '../types';
import { HealthDisclaimer } from '../components/HealthDisclaimer';
import {
  Bell,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Lock,
  Flame,
  Dumbbell,
  Utensils,
  Target,
  Droplets,
} from 'lucide-react';

export const RemindersPage: React.FC = () => {
  const [reminders, setReminders] = useState<IReminder[]>([]);
  const [achievements, setAchievements] = useState<IAchievement[]>([]);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [percentage, setPercentage] = useState(0);

  // New Reminder Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newType, setNewType] = useState<any>('workout');
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('18:00');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [remRes, achRes] = await Promise.all([
        api.getReminders(),
        api.getAchievements(),
      ]);

      setReminders(remRes.reminders || []);
      setAchievements(achRes.achievements || []);
      setUnlockedCount(achRes.unlockedCount);
      setTotalCount(achRes.totalCount);
      setPercentage(achRes.percentage);
    } catch (err) {
      console.error('Failed loading reminders and achievements:', err);
    }
  };

  const handleToggleReminder = async (id: string) => {
    try {
      const res = await api.toggleReminder(id);
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, enabled: res.reminder.enabled } : r))
      );
    } catch (err) {
      console.error('Failed toggling reminder:', err);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      await api.deleteReminder(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Failed deleting reminder:', err);
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await api.saveReminder({
        type: newType,
        title: newTitle.trim(),
        time: newTime,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        enabled: true,
      });

      setReminders((prev) => [...prev, res.reminder]);
      setIsAddModalOpen(false);
      setNewTitle('');
    } catch (err) {
      console.error('Failed creating reminder:', err);
    }
  };

  const getIconForAchievement = (icon: string) => {
    switch (icon) {
      case 'Flame':
        return <Flame size={22} color="#f59e0b" />;
      case 'Dumbbell':
        return <Dumbbell size={22} color="#10b981" />;
      case 'Utensils':
        return <Utensils size={22} color="#06b6d4" />;
      case 'Target':
        return <Target size={22} color="#8b5cf6" />;
      case 'Droplets':
        return <Droplets size={22} color="#38bdf8" />;
      default:
        return <Sparkles size={22} color="#10b981" />;
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
            <span className="badge badge-emerald">Habits & Milestones</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Reminders & Achievements</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            User-controlled custom schedule nudges and unlockable consistency badges.
          </p>
        </div>

        <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} /> New Reminder
        </button>
      </div>

      <HealthDisclaimer compact />

      {/* Reminders Section */}
      <div className="surface-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Notification & Habit Schedules</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Enable, disable, or adjust your workout and hydration nudges
            </p>
          </div>
          <Bell size={20} color="#10b981" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {reminders.map((rem) => (
            <div
              key={rem.id}
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: rem.enabled ? 1 : 0.6,
                transition: 'opacity 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: rem.enabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: rem.enabled ? '#10b981' : 'var(--text-muted)',
                  }}
                >
                  <Clock size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{rem.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Trigger Time: <strong style={{ color: 'var(--text-primary)' }}>{rem.time}</strong> • Daily
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                {/* Toggle Button */}
                <button
                  onClick={() => handleToggleReminder(rem.id)}
                  style={{
                    background: rem.enabled ? '#10b981' : 'var(--border-subtle)',
                    border: 'none',
                    borderRadius: 'var(--radius-full)',
                    width: '46px',
                    height: '24px',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '2px',
                      left: rem.enabled ? '24px' : '2px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      transition: 'left 0.2s ease',
                    }}
                  />
                </button>

                <button
                  onClick={() => handleDeleteReminder(rem.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements Section */}
      <div className="surface-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Milestone Achievements</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {unlockedCount} of {totalCount} unlocked ({percentage}%)
            </p>
          </div>

          {/* Progress Pill */}
          <div style={{ minWidth: '150px' }}>
            <div
              style={{
                height: '8px',
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${percentage}%`,
                  background: 'var(--primary-gradient)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {achievements.map((ach) => {
            const isUnlocked = !!ach.unlockedAt;

            return (
              <div
                key={ach.id}
                style={{
                  background: isUnlocked ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface-elevated)',
                  border: isUnlocked ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.1rem',
                  display: 'flex',
                  gap: '0.85rem',
                  alignItems: 'flex-start',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: isUnlocked ? 'var(--bg-surface)' : 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isUnlocked ? getIconForAchievement(ach.icon) : <Lock size={20} color="var(--text-muted)" />}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '0.95rem', color: isUnlocked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {ach.title}
                    </h3>
                    {isUnlocked && <CheckCircle2 size={16} color="#10b981" />}
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.4 }}>
                    {ach.description}
                  </p>

                  {isUnlocked && ach.unlockedAt && (
                    <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '6px', fontWeight: 600 }}>
                      Unlocked {new Date(ach.unlockedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Reminder Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" style={{ padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem' }}>Create Custom Reminder</h3>

            <form onSubmit={handleCreateReminder}>
              <div className="form-group">
                <label className="form-label">Reminder Type</label>
                <select className="form-select" value={newType} onChange={(e) => setNewType(e.target.value)}>
                  <option value="workout">Workout Session</option>
                  <option value="hydration">Hydration Check</option>
                  <option value="meal">Meal / Nutrition Logging</option>
                  <option value="weigh_in">Weekly Body Weigh-in</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Reminder Title / Message</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Evening Push Workout Routine"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Scheduled Time (24h)</label>
                <input
                  type="time"
                  className="form-input"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 2 }}>
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
