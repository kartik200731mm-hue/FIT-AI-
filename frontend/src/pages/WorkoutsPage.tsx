import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { IWorkoutPlan, IExercise } from '../types';
import { RestTimerModal } from '../components/RestTimerModal';
import { WorkoutRunnerModal } from '../components/WorkoutRunnerModal';
import { HealthDisclaimer } from '../components/HealthDisclaimer';
import {
  Dumbbell,
  Sparkles,
  Plus,
  CheckCircle2,
  Circle,
  Timer,
  Play,
} from 'lucide-react';

export const WorkoutsPage: React.FC = () => {
  const { profile } = useAuth();
  const [activePlan, setActivePlan] = useState<IWorkoutPlan | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isRunnerOpen, setIsRunnerOpen] = useState(false);
  const [aiDays, setAiDays] = useState(4);
  const [aiDifficulty, setAiDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [generatingAi, setGeneratingAi] = useState(false);

  // Rest Timer
  const [restTimerOpen, setRestTimerOpen] = useState(false);
  const [restSeconds, setRestSeconds] = useState(60);

  // New Exercise Modal
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExCategory, setNewExCategory] = useState<any>('strength');
  const [newExMuscle, setNewExMuscle] = useState('');
  const [newExSets, setNewExSets] = useState(3);
  const [newExReps, setNewExReps] = useState('10-12');
  const [newExRest, setNewExRest] = useState(60);
  const [newExInstructions, setNewExInstructions] = useState('');

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      const res = await api.getAllWorkoutPlans();
      const active = res.plans.find((p) => p.active) || (res.plans.length > 0 ? res.plans[0] : null);
      setActivePlan(active);
    } catch (err) {
      console.error('Failed loading workouts:', err);
    }
  };

  const handleToggleExercise = async (dayId: string, exerciseId: string, currentStatus?: boolean) => {
    if (!activePlan) return;
    const newStatus = !currentStatus;

    // Optimistic UI update
    const updatedPlan = { ...activePlan };
    const day = updatedPlan.days.find((d) => d.dayId === dayId);
    if (day) {
      const ex = day.exercises.find((e) => e.id === exerciseId);
      if (ex) {
        ex.completed = newStatus;
        day.completed = day.exercises.every((e) => e.completed);
        setActivePlan(updatedPlan);
      }
    }

    try {
      await api.toggleExercise(activePlan.id, dayId, exerciseId, newStatus);
    } catch (err) {
      console.error('Failed toggling exercise:', err);
      loadWorkouts();
    }
  };

  const handleGenerateAiWorkout = async () => {
    setGeneratingAi(true);
    try {
      const res = await api.generateWorkoutPlan({
        daysPerWeek: aiDays,
        difficulty: aiDifficulty,
      });

      // Save newly generated plan
      const saveRes = await api.saveWorkoutPlan(res.plan);
      setActivePlan(saveRes.plan);
      setIsAiModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed generating workout plan');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleAddCustomExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlan || !newExName.trim()) return;

    const currentDay = activePlan.days[selectedDayIndex];
    if (!currentDay) return;

    const newExercise: IExercise = {
      id: `ex_${Date.now()}`,
      name: newExName.trim(),
      category: newExCategory,
      targetMuscle: newExMuscle.trim() || 'General',
      sets: Number(newExSets),
      reps: newExReps.trim(),
      restSec: Number(newExRest),
      instructions: newExInstructions.trim(),
      completed: false,
    };

    currentDay.exercises.push(newExercise);
    try {
      const updated = await api.saveWorkoutPlan(activePlan);
      setActivePlan(updated.plan);
      setIsAddExerciseModalOpen(false);
      // Reset form
      setNewExName('');
      setNewExMuscle('');
      setNewExInstructions('');
    } catch (err) {
      console.error('Failed saving custom exercise:', err);
    }
  };

  const currentDay = activePlan?.days[selectedDayIndex] || null;

  return (
    <div>
      {/* Top Header */}
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
            <span className="badge badge-emerald">Training Hub</span>
            {activePlan?.isAiGenerated && (
              <span className="badge badge-cyan">
                <Sparkles size={12} /> AI Tailored
              </span>
            )}
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Workout Routines & Tracking</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Progressive splits designed for your goals and physical constraints.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => setRestTimerOpen(true)}>
            <Timer size={18} /> Rest Timer
          </button>
          <button className="btn-primary" onClick={() => setIsAiModalOpen(true)}>
            <Sparkles size={18} /> {activePlan ? 'Regenerate with AI' : 'Generate AI Plan'}
          </button>
        </div>
      </div>

      <HealthDisclaimer compact />

      {activePlan ? (
        <div>
          {/* Plan Meta Banner */}
          <div
            className="surface-card"
            style={{
              marginBottom: '1.25rem',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{activePlan.title}</h2>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Difficulty: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{activePlan.difficulty}</strong></span>
                <span>•</span>
                <span>Split: <strong style={{ color: 'var(--text-primary)' }}>{activePlan.daysPerWeek} Days/Week</strong></span>
                <span>•</span>
                <span>Goal: <strong style={{ color: '#10b981' }}>{activePlan.goal}</strong></span>
              </div>
            </div>

            {activePlan.notes && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '400px', lineHeight: 1.4 }}>
                💡 {activePlan.notes}
              </div>
            )}
          </div>

          {/* Days Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '0.6rem',
              overflowX: 'auto',
              paddingBottom: '0.5rem',
              marginBottom: '1.25rem',
            }}
          >
            {activePlan.days.map((day, idx) => {
              const isSelected = selectedDayIndex === idx;
              return (
                <button
                  key={day.dayId || idx}
                  onClick={() => setSelectedDayIndex(idx)}
                  className="surface-card"
                  style={{
                    padding: '0.75rem 1.1rem',
                    minWidth: '150px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface)',
                    borderColor: isSelected ? '#10b981' : 'var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: isSelected ? '#10b981' : 'var(--text-muted)', fontWeight: 700 }}>
                      Day {idx + 1}
                    </span>
                    {day.completed && <CheckCircle2 size={14} color="#10b981" />}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '2px', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {day.dayName.replace(/^Day \d+:\s*/, '')}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Day View */}
          {currentDay && (
            <div className="surface-card" style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '0.85rem',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{currentDay.dayName}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Target Focus: {currentDay.focus}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn-primary"
                    style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
                    onClick={() => setIsRunnerOpen(true)}
                  >
                    <Play size={16} /> Start Session
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                    onClick={() => setIsAddExerciseModalOpen(true)}
                  >
                    <Plus size={16} /> Add Exercise
                  </button>
                </div>
              </div>

              {/* Exercises List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {currentDay.exercises.map((ex, exIdx) => (
                  <div
                    key={ex.id || exIdx}
                    style={{
                      background: ex.completed ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-surface-elevated)',
                      border: ex.completed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Completion Toggle */}
                    <button
                      onClick={() => handleToggleExercise(currentDay.dayId, ex.id, ex.completed)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: ex.completed ? '#10b981' : 'var(--text-muted)',
                      }}
                      aria-label="Toggle completed"
                    >
                      {ex.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                    </button>

                    {/* Exercise Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '1rem',
                            textDecoration: ex.completed ? 'line-through' : 'none',
                            color: ex.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                          }}
                        >
                          {ex.name}
                        </span>
                        <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                          {ex.targetMuscle}
                        </span>
                      </div>

                      {ex.instructions && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          {ex.instructions}
                        </div>
                      )}
                    </div>

                    {/* Sets & Reps & Rest */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sets × Reps</div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                          {ex.sets} × {ex.reps}
                        </div>
                      </div>

                      <button
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                        onClick={() => {
                          setRestSeconds(ex.restSec || 60);
                          setRestTimerOpen(true);
                        }}
                      >
                        <Timer size={14} /> {ex.restSec}s Rest
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="surface-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Dumbbell size={52} color="#10b981" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>No Active Workout Plan</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
            Get started by generating an AI-customized training routine tailored to your fitness goal, schedule, and joint/injury history.
          </p>
          <button className="btn-primary" onClick={() => setIsAiModalOpen(true)}>
            <Sparkles size={18} /> Build My Workout Routine
          </button>
        </div>
      )}

      {/* Rest Timer Modal */}
      <RestTimerModal
        isOpen={restTimerOpen}
        onClose={() => setRestTimerOpen(false)}
        initialSeconds={restSeconds}
      />

      {/* AI Plan Generator Modal */}
      {isAiModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAiModalOpen(false)}>
          <div className="modal-content" style={{ padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Sparkles size={22} color="#10b981" />
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>AI Workout Split Generator</h3>
              </div>
              <button onClick={() => setIsAiModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Fit AI will synthesize an optimal routine aligned with your current goal (<strong style={{ color: '#10b981', textTransform: 'capitalize' }}>{profile?.fitnessGoal?.replace('_', ' ') || 'Fitness'}</strong>) and respect your logged physical limitations ({profile?.limitations || 'None recorded'}).
            </p>

            <div className="form-group">
              <label className="form-label">Training Days Per Week</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className="btn-secondary"
                    style={{
                      flex: 1,
                      borderColor: aiDays === num ? '#10b981' : 'var(--border-subtle)',
                      background: aiDays === num ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface-elevated)',
                    }}
                    onClick={() => setAiDays(num)}
                  >
                    {num} Days
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Experience / Intensity Level</label>
              <select
                className="form-select"
                value={aiDifficulty}
                onChange={(e) => setAiDifficulty(e.target.value as any)}
              >
                <option value="beginner">Beginner (Form focus, foundational stability)</option>
                <option value="intermediate">Intermediate (Progressive overload, compound volume)</option>
                <option value="advanced">Advanced (High density, intensity techniques)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
              <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsAiModalOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ flex: 2 }}
                disabled={generatingAi}
                onClick={handleGenerateAiWorkout}
              >
                {generatingAi ? 'Generating Optimal Split...' : 'Generate Routine'}
                {!generatingAi && <Sparkles size={18} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Exercise Modal */}
      {isAddExerciseModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddExerciseModalOpen(false)}>
          <div className="modal-content" style={{ padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem' }}>
              Add Exercise to {currentDay?.dayName}
            </h3>

            <form onSubmit={handleAddCustomExercise}>
              <div className="form-group">
                <label className="form-label">Exercise Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Incline Dumbbell Hammer Curls"
                  value={newExName}
                  onChange={(e) => setNewExName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Target Muscle</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Biceps & Forearms"
                    value={newExMuscle}
                    onChange={(e) => setNewExMuscle(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={newExCategory} onChange={(e) => setNewExCategory(e.target.value)}>
                    <option value="strength">Strength</option>
                    <option value="cardio">Cardio</option>
                    <option value="core">Core</option>
                    <option value="hiit">HIIT</option>
                    <option value="flexibility">Flexibility</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Sets</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="form-input"
                    value={newExSets}
                    onChange={(e) => setNewExSets(Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reps</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 10-12"
                    value={newExReps}
                    onChange={(e) => setNewExReps(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Rest (sec)</label>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    className="form-input"
                    value={newExRest}
                    onChange={(e) => setNewExRest(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Form Notes / Cue (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. Slow eccentric, pause 1s at peak contraction"
                  value={newExInstructions}
                  onChange={(e) => setNewExInstructions(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsAddExerciseModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 2 }}>
                  Save Exercise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Workout Runner Modal */}
      {currentDay && (
        <WorkoutRunnerModal
          day={currentDay}
          isOpen={isRunnerOpen}
          onClose={() => setIsRunnerOpen(false)}
          onCompleteWorkout={() => {
            loadWorkouts();
          }}
        />
      )}
    </div>
  );
};
