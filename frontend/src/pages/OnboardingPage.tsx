import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { HealthDisclaimer } from '../components/HealthDisclaimer';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface Props {
  onCompleted: () => void;
}

export const OnboardingPage: React.FC<Props> = ({ onCompleted }) => {
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [age, setAge] = useState<number>(25);
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer_not_to_say'>('prefer_not_to_say');
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(72);
  const [targetWeightKg, setTargetWeightKg] = useState<number>(70);
  const [activityLevel, setActivityLevel] = useState<any>('moderately_active');
  const [fitnessGoal, setFitnessGoal] = useState<any>('weight_loss');
  const [dietaryPreference, setDietaryPreference] = useState<any>('no_restriction');
  const [limitations, setLimitations] = useState<string>('');

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.saveProfile({
        age: Number(age),
        gender,
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        targetWeightKg: Number(targetWeightKg),
        activityLevel,
        fitnessGoal,
        dietaryPreference,
        limitations: limitations.trim(),
      });
      await refreshUser();
      onCompleted();
    } catch (err: any) {
      setError(err.message || 'Failed to save profile. Please verify your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '2rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 10%, rgba(6, 182, 212, 0.1), transparent 50%), var(--bg-main)',
      }}
    >
      <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', padding: '2.25rem' }}>
        <HealthDisclaimer compact />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Profile Calibration</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Step {step} of 3: {step === 1 ? 'Body Metrics' : step === 2 ? 'Goals & Activity' : 'Diet & Constraints'}
            </p>
          </div>
          {/* Step Pill */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                style={{
                  width: '28px',
                  height: '6px',
                  borderRadius: 'var(--radius-full)',
                  background: step >= s ? '#10b981' : 'var(--border-subtle)',
                  transition: 'background 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fb7185',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
            }}
          >
            {error}
          </div>
        )}

        {/* STEP 1: Body Metrics */}
        {step === 1 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Age (years)</label>
                <input
                  type="number"
                  min="14"
                  max="100"
                  className="form-input"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gender (for metabolic formula)</label>
                <select className="form-select" value={gender} onChange={(e) => setGender(e.target.value as any)}>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other / Non-binary</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Height (cm)</label>
                <input
                  type="number"
                  min="100"
                  max="250"
                  className="form-input"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Current Weight (kg)</label>
                <input
                  type="number"
                  min="30"
                  max="300"
                  step="0.5"
                  className="form-input"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Target Goal Weight (kg)</label>
              <input
                type="number"
                min="30"
                max="300"
                step="0.5"
                className="form-input"
                value={targetWeightKg}
                onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Used to determine realistic caloric pacing and healthy milestones.
              </span>
            </div>

            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
              onClick={() => setStep(2)}
            >
              Continue to Goals <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 2: Goals & Activity */}
        {step === 2 && (
          <div>
            <div className="form-group">
              <label className="form-label">Primary Fitness Goal</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                {[
                  { id: 'weight_loss', label: 'Fat Loss & Lean Out', desc: 'Moderate deficit with muscle preservation' },
                  { id: 'muscle_gain', label: 'Muscle Building', desc: 'Lean surplus with hypertrophy focus' },
                  { id: 'maintenance', label: 'Maintenance & Tone', desc: 'Maintain weight while improving body comp' },
                  { id: 'endurance', label: 'Endurance & Stamina', desc: 'Cardiovascular capacity & athletic energy' },
                  { id: 'general_health', label: 'General Vitality', desc: 'Longevity, mobility and everyday wellness' },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setFitnessGoal(g.id)}
                    style={{
                      textAlign: 'left',
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-md)',
                      background: fitnessGoal === g.id ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface-elevated)',
                      border: fitnessGoal === g.id ? '2px solid #10b981' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: fitnessGoal === g.id ? '#10b981' : 'var(--text-primary)' }}>
                      {g.label}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{g.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Weekly Activity Level</label>
              <select className="form-select" value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)}>
                <option value="sedentary">Sedentary (desk job, minimal intentional exercise)</option>
                <option value="lightly_active">Lightly Active (1-3 light workouts/week, light walking)</option>
                <option value="moderately_active">Moderately Active (3-5 workouts/week, active daily life)</option>
                <option value="very_active">Very Active (6-7 intense training sessions/week)</option>
                <option value="extra_active">Extremely Active (athlete or physically demanding job)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>
                Back
              </button>
              <button type="button" className="btn-primary" style={{ flex: 2 }} onClick={() => setStep(3)}>
                Continue to Preferences <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Diet & Physical Constraints */}
        {step === 3 && (
          <div>
            <div className="form-group">
              <label className="form-label">Dietary Lifestyle / Preference</label>
              <select className="form-select" value={dietaryPreference} onChange={(e) => setDietaryPreference(e.target.value)}>
                <option value="no_restriction">Balanced Omnivore (No specific restrictions)</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">100% Plant-Based (Vegan)</option>
                <option value="pescatarian">Pescatarian</option>
                <option value="keto">Ketogenic (Very Low Carb, High Healthy Fats)</option>
                <option value="low_carb">Low-Carb Balanced</option>
                <option value="paleo">Paleo</option>
                <option value="halal">Halal</option>
                <option value="kosher">Kosher</option>
              </select>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">
                Physical Limitations, Joint Discomfort, or Injury Notes (Optional)
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="e.g. Mild lower back sensitivity on deadlifts, knee crunch on deep squats, no barbell overhead presses..."
                value={limitations}
                onChange={(e) => setLimitations(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Fit AI automatically tailors exercise selection to avoid high-impact aggravation of sensitive areas.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(2)}>
                Back
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ flex: 2 }}
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading ? 'Calibrating Plan...' : 'Finish & Open Dashboard'}
                {!loading && <CheckCircle2 size={18} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
