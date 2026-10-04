import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { WorkoutsPage } from './pages/WorkoutsPage';
import { MealsPage } from './pages/MealsPage';
import { ProgressPage } from './pages/ProgressPage';
import { AiCoachPage } from './pages/AiCoachPage';
import { RemindersPage } from './pages/RemindersPage';
import { SettingsPage } from './pages/SettingsPage';
import { Navbar } from './components/Navbar';
import { Flame } from 'lucide-react';

export const App: React.FC = () => {
  const { user, hasProfile, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [forceOnboarding, setForceOnboarding] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-main)',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#061e14',
            animation: 'pulseGlow 2s infinite',
            boxShadow: '0 8px 24px var(--primary-glow)',
          }}
        >
          <Flame size={32} />
        </div>
        <p style={{ marginTop: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-secondary)' }}>
          Fit AI Coach loading...
        </p>
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return <AuthPage />;
  }

  // Needs initial onboarding profile calibration
  if (!hasProfile || forceOnboarding) {
    return <OnboardingPage onCompleted={() => setForceOnboarding(false)} />;
  }

  // Signed in and onboarded
  return (
    <div className="app-container">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {activeTab === 'dashboard' && <DashboardPage setActiveTab={setActiveTab} />}
        {activeTab === 'workouts' && <WorkoutsPage />}
        {activeTab === 'meals' && <MealsPage />}
        {activeTab === 'progress' && <ProgressPage />}
        {activeTab === 'ai-coach' && <AiCoachPage />}
        {activeTab === 'reminders' && <RemindersPage />}
        {activeTab === 'settings' && (
          <SettingsPage onRecalibrateProfile={() => setForceOnboarding(true)} />
        )}
      </main>
    </div>
  );
};
