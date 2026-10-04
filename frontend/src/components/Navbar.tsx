import React from 'react';
import {
  LayoutDashboard,
  Dumbbell,
  UtensilsCrossed,
  TrendingUp,
  Sparkles,
  BellRing,
  Settings,
  LogOut,
  Flame,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<Props> = ({ activeTab, setActiveTab }) => {
  const { user, profile, logout } = useAuth();

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
    { id: 'meals', label: 'Diet & Meals', icon: UtensilsCrossed },
    { id: 'progress', label: 'Progress & BMI', icon: TrendingUp },
    { id: 'ai-coach', label: 'AI Coach Studio', icon: Sparkles, highlight: true },
    { id: 'reminders', label: 'Reminders & Badges', icon: BellRing },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar-desktop">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--primary-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#061e14',
                fontWeight: 900,
                fontSize: '1.2rem',
                boxShadow: '0 4px 12px var(--primary-glow)',
              }}
            >
              <Flame size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Fit <span style={{ color: '#10b981' }}>AI</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Smart Fitness Coach
              </div>
            </div>
          </div>
        </div>

        {/* User Card Mini */}
        <div
          style={{
            margin: '1rem',
            padding: '0.85rem',
            background: 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
              border: '1px solid rgba(16, 185, 129, 0.4)',
            }}
          >
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.name || 'Athlete'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {profile?.fitnessGoal ? profile.fitnessGoal.replace('_', ' ') : 'Calibrating'}
            </div>
          </div>
        </div>

        {/* Nav list */}
        <nav style={{ flex: 1, padding: '0.5rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;

            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
                style={{
                  width: '100%',
                  background: isActive ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid transparent',
                  textAlign: 'left',
                }}
              >
                <Icon size={19} color={isActive ? '#10b981' : link.highlight ? '#06b6d4' : 'var(--text-secondary)'} />
                <span style={{ flex: 1 }}>{link.label}</span>
                {link.highlight && (
                  <span className="badge badge-cyan" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={logout}
            className="btn-ghost"
            style={{ width: '100%', justifyContent: 'flex-start', color: '#f43f5e' }}
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav">
        {navLinks.slice(0, 5).map((link) => {
          const Icon = link.icon;
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id)}
              style={{
                background: 'none',
                border: 'none',
                color: isActive ? '#10b981' : 'var(--text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.7rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              <Icon size={20} />
              <span>{link.label.split(' ')[0]}</span>
            </button>
          );
        })}
        <button
          onClick={() => setActiveTab('settings')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'settings' ? '#10b981' : 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.7rem',
            fontWeight: activeTab === 'settings' ? 700 : 500,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          <Settings size={20} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
};
