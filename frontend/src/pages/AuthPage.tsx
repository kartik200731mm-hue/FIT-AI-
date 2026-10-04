import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Flame, Lock, Mail, User, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) throw new Error('Please enter your name');
        await register(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (type: 'beginner' | 'athlete') => {
    if (type === 'beginner') {
      setEmail('alex.beginner@fitai.demo');
      setPassword('FitAI2026!');
      setName('Alex Rivera');
    } else {
      setEmail('sam.athlete@fitai.demo');
      setPassword('FitAI2026!');
      setName('Sam Taylor');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'radial-gradient(circle at 50% 10%, rgba(16, 185, 129, 0.12), transparent 45%), var(--bg-main)',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '2.25rem',
          position: 'relative',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              margin: '0 auto 1rem',
              borderRadius: '14px',
              background: 'var(--primary-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#061e14',
              boxShadow: '0 8px 20px var(--primary-glow)',
            }}
          >
            <Flame size={30} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            Fit <span style={{ color: '#10b981' }}>AI</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {isRegister
              ? 'Start your personalized health & fitness journey today'
              : 'Welcome back! Sign in to access your coach'}
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fb7185',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="e.g. Maya Chen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isRegister ? 'Must be at least 6 characters with secure server-side hashing' : ''}
            </span>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: '0.75rem', padding: '0.85rem' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : isRegister ? 'Create My Free Account' : 'Sign In'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        {/* Mode Switcher */}
        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#10b981',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {isRegister ? 'Sign In' : 'Create Account'}
          </button>
        </div>

        {/* Quick Demo Pre-fill helpers */}
        <div
          style={{
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.8rem',
          }}
        >
          <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={14} color="#06b6d4" /> Quick fill for testing (Auto-creates account if new):
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ flex: 1, fontSize: '0.75rem', padding: '0.45rem' }}
              onClick={() => handleDemoFill('beginner')}
            >
              Demo: Beginner Alex
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{ flex: 1, fontSize: '0.75rem', padding: '0.45rem' }}
              onClick={() => handleDemoFill('athlete')}
            >
              Demo: Athlete Sam
            </button>
          </div>
        </div>

        {/* Privacy & Security Note */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            marginTop: '1.25rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          <ShieldCheck size={14} color="#10b981" />
          <span>Your data is isolated and encrypted with bcrypt & JWT tokens.</span>
        </div>
      </div>
    </div>
  );
};
