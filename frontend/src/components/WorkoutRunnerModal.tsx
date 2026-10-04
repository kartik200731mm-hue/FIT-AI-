import React, { useState, useEffect } from 'react';
import { IWorkoutDay } from '../types';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Timer,
  Award,
} from 'lucide-react';

interface Props {
  day: IWorkoutDay;
  isOpen: boolean;
  onClose: () => void;
  onCompleteWorkout: () => void;
}

export const WorkoutRunnerModal: React.FC<Props> = ({ day, isOpen, onClose, onCompleteWorkout }) => {
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [completedSets, setCompletedSets] = useState<Record<string, number>>({});
  const [isResting, setIsResting] = useState(false);
  const [restSeconds, setRestSeconds] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [workoutFinished, setWorkoutFinished] = useState(false);

  const exercises = day?.exercises || [];
  const activeEx = exercises[currentExIdx] || null;

  useEffect(() => {
    if (isOpen) {
      setCurrentExIdx(0);
      setCurrentSet(1);
      setCompletedSets({});
      setIsResting(false);
      setWorkoutFinished(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: any = null;
    if (timerRunning && restSeconds > 0) {
      interval = setInterval(() => {
        setRestSeconds((prev) => prev - 1);
      }, 1000);
    } else if (restSeconds === 0 && timerRunning) {
      setTimerRunning(false);
      setIsResting(false);
      // Play Audio notification
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.8);
      } catch (e) {}
    }
    return () => clearInterval(interval);
  }, [timerRunning, restSeconds]);

  if (!isOpen || !activeEx) return null;

  const handleFinishSet = () => {
    const totalSets = activeEx.sets || 3;
    const currentCompleted = completedSets[activeEx.id] || 0;
    const nextCompleted = currentCompleted + 1;
    setCompletedSets((prev) => ({ ...prev, [activeEx.id]: nextCompleted }));

    if (nextCompleted < totalSets) {
      setCurrentSet(nextCompleted + 1);
      // Trigger rest timer
      setRestSeconds(activeEx.restSec || 60);
      setIsResting(true);
      setTimerRunning(true);
    } else {
      // Exercise completed, move to next
      if (currentExIdx < exercises.length - 1) {
        setCurrentExIdx((prev) => prev + 1);
        setCurrentSet(1);
        setRestSeconds(activeEx.restSec || 60);
        setIsResting(true);
        setTimerRunning(true);
      } else {
        // Full workout completed!
        setWorkoutFinished(true);
        onCompleteWorkout();
      }
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '540px', padding: '2rem', textAlign: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-emerald">Live Session</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{day.dayName}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {!workoutFinished ? (
          <div>
            {/* Progress Bar across exercises */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem' }}>
              {exercises.map((ex, i) => {
                const isDone = (completedSets[ex.id] || 0) >= ex.sets;
                const isCurrent = i === currentExIdx;
                return (
                  <div
                    key={ex.id || i}
                    style={{
                      flex: 1,
                      height: '6px',
                      borderRadius: 'var(--radius-full)',
                      background: isDone
                        ? '#10b981'
                        : isCurrent
                        ? '#06b6d4'
                        : 'var(--bg-surface-elevated)',
                      transition: 'all 0.3s ease',
                    }}
                  />
                );
              })}
            </div>

            {/* Main Exercise Card */}
            <div
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Exercise {currentExIdx + 1} of {exercises.length} • {activeEx.targetMuscle}
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0.4rem 0' }}>{activeEx.name}</h2>
              {activeEx.instructions && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  💡 {activeEx.instructions}
                </p>
              )}

              {/* Set Tracking circles */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
                {Array.from({ length: activeEx.sets }).map((_, sIdx) => {
                  const setNum = sIdx + 1;
                  const isDone = (completedSets[activeEx.id] || 0) >= setNum;
                  const isCurrent = currentSet === setNum && !isDone;

                  return (
                    <div
                      key={sIdx}
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        background: isDone
                          ? 'var(--primary-gradient)'
                          : isCurrent
                          ? 'rgba(6, 182, 212, 0.2)'
                          : 'var(--bg-surface)',
                        color: isDone ? '#061e14' : isCurrent ? '#06b6d4' : 'var(--text-muted)',
                        border: isCurrent
                          ? '2px solid #06b6d4'
                          : isDone
                          ? 'none'
                          : '1px solid var(--border-subtle)',
                      }}
                    >
                      {isDone ? <CheckCircle2 size={18} /> : setNum}
                    </div>
                  );
                })}
              </div>

              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Target Target: <strong style={{ color: 'var(--text-primary)' }}>{activeEx.reps} reps</strong>
              </div>
            </div>

            {/* Rest Timer overlay / section */}
            {isResting && (
              <div
                style={{
                  background: 'rgba(6, 182, 212, 0.12)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#38bdf8' }}>
                  <Timer size={16} /> Inter-Set Rest Countdown
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#38bdf8', margin: '0.25rem 0' }}>
                  {formatTimer(restSeconds)}
                </div>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
                  onClick={() => setIsResting(false)}
                >
                  Skip Rest & Start Next Set
                </button>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn-secondary"
                disabled={currentExIdx === 0}
                onClick={() => {
                  if (currentExIdx > 0) {
                    setCurrentExIdx((prev) => prev - 1);
                    setCurrentSet(1);
                  }
                }}
                style={{ flex: 1 }}
              >
                <ChevronLeft size={18} /> Prev
              </button>

              <button
                className="btn-primary"
                onClick={handleFinishSet}
                style={{ flex: 2, padding: '0.85rem' }}
              >
                <CheckCircle2 size={18} /> Complete Set {currentSet}
              </button>

              <button
                className="btn-secondary"
                disabled={currentExIdx === exercises.length - 1}
                onClick={() => {
                  if (currentExIdx < exercises.length - 1) {
                    setCurrentExIdx((prev) => prev + 1);
                    setCurrentSet(1);
                  }
                }}
                style={{ flex: 1 }}
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
        ) : (
          /* Workout Complete Celebration */
          <div style={{ padding: '2rem 1rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--primary-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#061e14',
                margin: '0 auto 1.25rem',
                boxShadow: '0 8px 25px var(--primary-glow)',
              }}
            >
              <Award size={34} />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Workout Completed! 🎉
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '380px', margin: '0.5rem auto 1.5rem' }}>
              Incredible work! You conquered all {exercises.length} exercises for {day.dayName}. Your daily activity and consistency streak have been updated.
            </p>

            <button className="btn-primary" style={{ width: '100%' }} onClick={onClose}>
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
