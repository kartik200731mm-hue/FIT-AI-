import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { HealthDisclaimer } from '../components/HealthDisclaimer';
import {
  User,
  Lock,
  Download,
  Trash2,
  Moon,
  Sun,
  AlertTriangle,
} from 'lucide-react';

interface Props {
  onRecalibrateProfile: () => void;
}

export const SettingsPage: React.FC<Props> = ({ onRecalibrateProfile }) => {
  const { user, profile, logout } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loadingPw, setLoadingPw] = useState(false);

  // Deletion modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    setLoadingPw(true);

    try {
      await api.changePassword(currentPassword, newPassword);
      setPasswordMsg({ type: 'success', text: 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setLoadingPw(false);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await api.exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fit_ai_export_${user?.id || 'data'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed exporting data. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      await api.deleteAccount();
      await logout();
    } catch (err) {
      alert('Failed deleting account.');
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span className="badge badge-emerald">Preferences & Security</span>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Account & Application Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Manage your security credentials, dietary calibration, theme, and data ownership.
        </p>
      </div>

      <HealthDisclaimer compact />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Profile Summary & Calibration */}
        <div className="surface-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Profile & Goal Parameters</h3>
            <User size={20} color="#10b981" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Account Name:</span>
              <strong>{user?.name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Email:</span>
              <strong>{user?.email}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Goal:</span>
              <strong style={{ textTransform: 'capitalize', color: '#10b981' }}>
                {profile?.fitnessGoal?.replace('_', ' ')}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Diet Style:</span>
              <strong style={{ textTransform: 'capitalize' }}>
                {profile?.dietaryPreference?.replace('_', ' ')}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Daily Calorie Target:</span>
              <strong>{profile?.dailyCalorieTarget} kcal</strong>
            </div>
          </div>

          <button className="btn-secondary" style={{ width: '100%' }} onClick={onRecalibrateProfile}>
            Recalibrate Metrics & Goals
          </button>
        </div>

        {/* Security & Password */}
        <div className="surface-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Password & Security</h3>
            <Lock size={20} color="#06b6d4" />
          </div>

          {passwordMsg && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                marginBottom: '1rem',
                background: passwordMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                color: passwordMsg.type === 'success' ? '#10b981' : '#f43f5e',
                border: `1px solid ${passwordMsg.type === 'success' ? '#10b98155' : '#f43f5e55'}`,
              }}
            >
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password (min 6 chars)</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-secondary" style={{ width: '100%' }} disabled={loadingPw}>
              {loadingPw ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Appearance Theme */}
        <div className="surface-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Visual Theme</h3>
            {theme === 'dark' ? <Moon size={20} color="#8b5cf6" /> : <Sun size={20} color="#f59e0b" />}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Toggle between the sleek Obsidian Dark interface and Crisp Light mode.
          </p>
          <button className="btn-secondary" style={{ width: '100%' }} onClick={toggleTheme}>
            {theme === 'dark' ? 'Switch to Crisp Light Mode' : 'Switch to Obsidian Dark Mode'}
          </button>
        </div>

        {/* Data Ownership & Privacy */}
        <div className="surface-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Data Portability & Export</h3>
            <Download size={20} color="#10b981" />
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Download a complete JSON export of all your workouts, logged meals, body weights, and settings.
          </p>
          <button className="btn-secondary" style={{ width: '100%' }} onClick={handleExportData}>
            <Download size={16} /> Export My Fitness Data (JSON)
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div
        className="surface-card"
        style={{
          borderColor: 'rgba(244, 63, 94, 0.4)',
          background: 'rgba(244, 63, 94, 0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f43f5e' }}>Danger Zone: Delete Account</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Permanently remove your account and all associated workouts, meal records, and history.
            </p>
          </div>
          <button
            className="btn-secondary"
            style={{ borderColor: '#f43f5e', color: '#f43f5e' }}
            onClick={() => setIsDeleteModalOpen(true)}
          >
            <Trash2 size={16} /> Delete Account
          </button>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-content" style={{ padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#f43f5e' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Permanently Delete Account?</h3>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              This action cannot be undone. All your workout routines, meal tracking logs, and body weight history will be wiped immediately from our servers.
            </p>

            <div className="form-group">
              <label className="form-label">
                Type <strong>DELETE</strong> below to confirm:
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ flex: 1, background: '#f43f5e', color: '#ffffff' }}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                onClick={handleDeleteAccount}
              >
                {deleting ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
