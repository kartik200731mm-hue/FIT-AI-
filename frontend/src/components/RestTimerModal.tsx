import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Bell } from 'lucide-react';

interface Props {
  initialSeconds?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const RestTimerModal: React.FC<Props> = ({ initialSeconds = 60, isOpen, onClose }) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (isOpen) {
      setSecondsLeft(initialSeconds);
      setTotalSeconds(initialSeconds);
      setIsRunning(true);
    }
  }, [isOpen, initialSeconds]);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      // Play web audio chime if supported
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.8);
      } catch (e) {
        // audio context fallback
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 100;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '380px', padding: '1.5rem', textAlign: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={18} color="#10b981" /> Set Rest Timer
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Circular / Ring timer representation */}
        <div style={{ margin: '1.5rem 0', position: 'relative' }}>
          <div
            style={{
              fontSize: '3.5rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: secondsLeft === 0 ? '#10b981' : 'var(--text-primary)',
            }}
          >
            {formatTime(secondsLeft)}
          </div>
          <div style={{ fontSize: '0.85rem', color: secondsLeft === 0 ? '#10b981' : 'var(--text-muted)', fontWeight: 600 }}>
            {secondsLeft === 0 ? 'Rest Complete! Ready for Next Set 💪' : 'Deep breath & recover'}
          </div>

          <div
            style={{
              height: '8px',
              background: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
              margin: '1.25rem 0',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: 'var(--primary-gradient)',
                transition: 'width 1s linear',
              }}
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {[30, 45, 60, 90, 120].map((sec) => (
            <button
              key={sec}
              onClick={() => {
                setTotalSeconds(sec);
                setSecondsLeft(sec);
                setIsRunning(true);
              }}
              className="btn-secondary"
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                borderColor: totalSeconds === sec ? '#10b981' : 'var(--border-subtle)',
              }}
            >
              {sec}s
            </button>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
          <button
            className="btn-primary"
            onClick={() => setIsRunning(!isRunning)}
            style={{ minWidth: '120px' }}
          >
            {isRunning ? (
              <>
                <Pause size={18} /> Pause
              </>
            ) : (
              <>
                <Play size={18} /> {secondsLeft === 0 ? 'Restart' : 'Resume'}
              </>
            )}
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              setSecondsLeft(totalSeconds);
              setIsRunning(false);
            }}
          >
            <RotateCcw size={18} /> Reset
          </button>
        </div>
      </div>
    </div>
  );
};
