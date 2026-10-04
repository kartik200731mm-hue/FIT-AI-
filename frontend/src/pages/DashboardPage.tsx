import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { IWorkoutPlan, IMealSummary } from '../types';
import { MacroBar } from '../components/MacroBar';
import { HealthDisclaimer } from '../components/HealthDisclaimer';
import {
  Flame,
  Droplet,
  Dumbbell,
  Sparkles,
  ArrowRight,
  Footprints,
} from 'lucide-react';

interface Props {
  setActiveTab: (tab: string) => void;
}

export const DashboardPage: React.FC<Props> = ({ setActiveTab }) => {
  const { user, profile } = useAuth();
  const [activePlan, setActivePlan] = useState<IWorkoutPlan | null>(null);
  const [mealSummary, setMealSummary] = useState<IMealSummary | null>(null);
  const [streak, setStreak] = useState<number>(1);
  const [waterMl, setWaterMl] = useState<number>(1250);
  const [steps] = useState<number>(4820);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [planRes, mealRes, progRes] = await Promise.all([
        api.getActiveWorkoutPlan().catch(() => ({ plan: null })),
        api.getMealSummary(today).catch(() => null),
        api.getProgressSummary().catch(() => null),
      ]);

      if (planRes?.plan) setActivePlan(planRes.plan);
      if (mealRes?.summary) setMealSummary(mealRes.summary);
      if (progRes) {
        setStreak(progRes.streak || 1);
      }
    } catch (err) {
      console.error('Failed loading dashboard metrics:', err);
    }
  };

  const handleQuickAddWater = async (amount: number) => {
    const newWater = waterMl + amount;
    setWaterMl(newWater);
    try {
      await api.logActivity({
        date: today,
        steps,
        activeMinutes: 30,
        waterMl: newWater,
        workoutCompleted: false,
      });
    } catch (e) {
      console.warn('Failed saving water log:', e);
    }
  };

  const remainingKcal = mealSummary
    ? Math.max(0, (profile?.dailyCalorieTarget || 2000) - mealSummary.consumed.calories)
    : profile?.dailyCalorieTarget || 2000;

  const waterTarget = profile?.waterTargetMl || 2500;
  const waterPercent = Math.min(100, Math.round((waterMl / waterTarget) * 100));

  return (
    <div>
      {/* Top Banner Greeting */}
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
            <span className="badge badge-emerald">Active Today</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>
            Welcome back, <span style={{ color: '#10b981' }}>{user?.name?.split(' ')[0] || 'Athlete'}</span> 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Goal: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{profile?.fitnessGoal?.replace('_', ' ') || 'Wellness'}</strong> • Target: {profile?.targetWeightKg || profile?.weightKg} kg
          </p>
        </div>

        {/* Streak & Quick Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.6rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}
          >
            <Flame size={22} color="#f59e0b" />
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>
                {streak} Day{streak > 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Streak</div>
            </div>
          </div>

          <button className="btn-primary" onClick={() => setActiveTab('ai-coach')}>
            <Sparkles size={18} /> Ask Coach
          </button>
        </div>
      </div>

      <HealthDisclaimer compact />

      {/* Main Grid Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Caloric & Macronutrient Card */}
        <div className="surface-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Today's Nutrition</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Calorie budget & macronutrients</span>
            </div>
            <button className="btn-ghost" onClick={() => setActiveTab('meals')} style={{ fontSize: '0.8rem' }}>
              Log Food <ArrowRight size={14} />
            </button>
          </div>

          {/* Calorie Dial / Stat */}
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Consumed</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>
                {mealSummary?.consumed.calories || 0}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>kcal</div>
            </div>

            <div style={{ width: '1px', height: '40px', background: 'var(--border-subtle)' }} />

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Remaining</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#06b6d4' }}>
                {remainingKcal}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>kcal</div>
            </div>

            <div style={{ width: '1px', height: '40px', background: 'var(--border-subtle)' }} />

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {profile?.dailyCalorieTarget || 2000}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>kcal</div>
            </div>
          </div>

          {/* Macros */}
          <MacroBar
            label="Protein (Lean Mass)"
            current={mealSummary?.consumed.protein || 0}
            target={profile?.dailyProteinTarget || 120}
            color="linear-gradient(90deg, #10b981, #059669)"
          />
          <MacroBar
            label="Carbohydrates (Energy)"
            current={mealSummary?.consumed.carbs || 0}
            target={profile?.dailyCarbsTarget || 220}
            color="linear-gradient(90deg, #06b6d4, #0284c7)"
          />
          <MacroBar
            label="Healthy Fats (Hormones)"
            current={mealSummary?.consumed.fat || 0}
            target={profile?.dailyFatTarget || 60}
            color="linear-gradient(90deg, #f59e0b, #d97706)"
          />
        </div>

        {/* Workout of the Day Preview */}
        <div className="surface-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Training Program</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {activePlan ? activePlan.title : 'No active workout routine set'}
              </span>
            </div>
            <button className="btn-ghost" onClick={() => setActiveTab('workouts')} style={{ fontSize: '0.8rem' }}>
              Full Plan <ArrowRight size={14} />
            </button>
          </div>

          {activePlan && activePlan.days.length > 0 ? (
            <div>
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#10b981' }}>
                    {activePlan.days[0].dayName}
                  </div>
                  <span className="badge badge-emerald">{activePlan.days[0].exercises.length} Exercises</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Focus: {activePlan.days[0].focus}
                </div>
              </div>

              {/* Sample Exercises preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {activePlan.days[0].exercises.slice(0, 3).map((ex) => (
                  <div
                    key={ex.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.85rem',
                      background: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{ex.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {ex.sets} × {ex.reps}
                    </span>
                  </div>
                ))}
              </div>

              <button
                className="btn-primary"
                style={{ width: '100%', fontSize: '0.9rem' }}
                onClick={() => setActiveTab('workouts')}
              >
                <Dumbbell size={18} /> Launch Workout Session
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.75rem 1rem' }}>
              <Dumbbell size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Generate your personalized AI workout schedule based on your goal & physical limitations.
              </p>
              <button className="btn-primary" onClick={() => setActiveTab('workouts')}>
                <Sparkles size={16} /> Generate Workout Routine
              </button>
            </div>
          )}
        </div>

        {/* Daily Hydration & Activity Summary */}
        <div className="surface-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Hydration & Daily Activity</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target: {waterTarget} ml</span>
            </div>
            <Droplet size={20} color="#06b6d4" />
          </div>

          {/* Water Meter */}
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Water Logged:</span>
              <strong style={{ color: '#06b6d4' }}>{waterMl} / {waterTarget} ml ({waterPercent}%)</strong>
            </div>

            <div
              style={{
                height: '10px',
                background: 'var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
                marginBottom: '0.85rem',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${waterPercent}%`,
                  background: 'linear-gradient(90deg, #06b6d4, #38bdf8)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn-secondary"
                style={{ flex: 1, fontSize: '0.8rem', padding: '0.4rem' }}
                onClick={() => handleQuickAddWater(250)}
              >
                +250 ml (Glass)
              </button>
              <button
                className="btn-secondary"
                style={{ flex: 1, fontSize: '0.8rem', padding: '0.4rem' }}
                onClick={() => handleQuickAddWater(500)}
              >
                +500 ml (Bottle)
              </button>
            </div>
          </div>

          {/* Activity step estimation */}
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Footprints size={20} color="#10b981" />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Daily Movement</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Low-impact metabolic activity</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{steps}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '3px' }}>steps</span>
            </div>
          </div>
        </div>
      </div>

      {/* Useful Next Action Insight Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'var(--primary-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#061e14',
            }}
          >
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
              Next Actionable Step for Today
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {mealSummary && mealSummary.consumed.protein < (profile?.dailyProteinTarget || 120) * 0.7
                ? `You have ${(profile?.dailyProteinTarget || 120) - (mealSummary?.consumed.protein || 0)}g protein left to reach your muscle recovery target.`
                : 'Great pacing today! Plan your dinner or complete your scheduled rest/recovery stretches.'}
            </div>
          </div>
        </div>

        <button className="btn-primary" onClick={() => setActiveTab('meals')} style={{ fontSize: '0.85rem' }}>
          Log Next Meal <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
