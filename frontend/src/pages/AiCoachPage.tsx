import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { HealthDisclaimer } from '../components/HealthDisclaimer';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Lightbulb,
} from 'lucide-react';

interface IMessage {
  id: string;
  sender: 'coach' | 'user';
  text: string;
  tips?: string[];
  source?: string;
  timestamp: string;
}

export const AiCoachPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<IMessage[]>([
    {
      id: 'welcome',
      sender: 'coach',
      text: `Hello ${user?.name?.split(' ')[0] || 'there'}! I'm Fit AI, your personalized wellness and fitness coach. I've calibrated your profile for ${profile?.fitnessGoal ? profile.fitnessGoal.replace('_', ' ') : 'balanced fitness'}. Ask me about overcoming plateaus, safe exercise modifications, meal pacing, or recovery techniques!`,
      tips: [
        'How do I break through a weight loss stall?',
        'What should I eat before morning workouts?',
        'Low-impact alternative for squats if my knees hurt',
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getAiStatus().then(setAiStatus).catch(console.warn);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendQuery = async (queryText: string) => {
    const text = queryText.trim();
    if (!text || loading) return;

    const userMsg: IMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await api.askCoach(text);
      const coachMsg: IMessage = {
        id: `c_${Date.now()}`,
        sender: 'coach',
        text: res.response,
        tips: res.actionableTips,
        source: res.source,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, coachMsg]);
    } catch (err: any) {
      const errorMsg: IMessage = {
        id: `err_${Date.now()}`,
        sender: 'coach',
        text: 'I ran into a temporary hiccup processing that question. Please try asking again or check your network connection.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 5rem)', minHeight: '600px' }}>
      {/* Top Header */}
      <div style={{ marginBottom: '1rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span className="badge badge-cyan">
                <Sparkles size={12} /> AI Coaching Studio
              </span>
              {aiStatus && (
                <span className={`badge ${aiStatus.mode === 'live_gemini' ? 'badge-emerald' : 'badge-amber'}`}>
                  {aiStatus.engineLabel}
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800 }}>Fit AI Coach Studio</h1>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Calibrated for: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{profile?.fitnessGoal?.replace('_', ' ')}</strong>
          </div>
        </div>

        <div style={{ marginTop: '0.75rem' }}>
          <HealthDisclaimer compact />
        </div>
      </div>

      {/* Chat Messages Container */}
      <div
        className="glass-panel"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        {messages.map((msg) => {
          const isCoach = msg.sender === 'coach';

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignSelf: isCoach ? 'flex-start' : 'flex-end',
                maxWidth: '85%',
              }}
            >
              {isCoach && (
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'var(--primary-gradient)',
                    color: '#061e14',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 800,
                  }}
                >
                  <Bot size={20} />
                </div>
              )}

              <div>
                <div
                  style={{
                    background: isCoach ? 'var(--bg-surface-elevated)' : 'var(--primary-gradient)',
                    color: isCoach ? 'var(--text-primary)' : '#061e14',
                    border: isCoach ? '1px solid var(--border-subtle)' : 'none',
                    borderRadius: isCoach ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                    padding: '0.85rem 1.1rem',
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>

                  {/* Actionable Tips List */}
                  {msg.tips && msg.tips.length > 0 && (
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <strong style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', color: isCoach ? '#10b981' : '#061e14' }}>
                        <Lightbulb size={14} /> Actionable Tips:
                      </strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {msg.tips.map((tip, tIdx) => (
                          <div
                            key={tIdx}
                            onClick={() => {
                              // If it's a prompt suggestion, auto ask
                              if (msg.id === 'welcome') handleSendQuery(tip);
                            }}
                            style={{
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '6px',
                              cursor: msg.id === 'welcome' ? 'pointer' : 'default',
                              color: msg.id === 'welcome' ? '#38bdf8' : isCoach ? 'var(--text-secondary)' : '#061e14',
                              textDecoration: msg.id === 'welcome' ? 'underline' : 'none',
                            }}
                          >
                            <span>•</span>
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    marginTop: '3px',
                    textAlign: isCoach ? 'left' : 'right',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    justifyContent: isCoach ? 'flex-start' : 'flex-end',
                  }}
                >
                  <span>{msg.timestamp}</span>
                  {msg.source && (
                    <span style={{ fontSize: '0.65rem', color: msg.source === 'gemini' ? '#10b981' : '#f59e0b' }}>
                      ({msg.source === 'gemini' ? 'Gemini AI' : 'Expert Engine'})
                    </span>
                  )}
                </div>
              </div>

              {!isCoach && (
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 700,
                  }}
                >
                  <User size={18} />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--primary-gradient)',
                color: '#061e14',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bot size={20} />
            </div>
            <div
              style={{
                background: 'var(--bg-surface-elevated)',
                padding: '0.75rem 1.1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Sparkles size={16} color="#10b981" />
              Fit AI is synthesizing safe coaching guidance...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendQuery(inputQuery);
        }}
        style={{
          display: 'flex',
          gap: '0.75rem',
          flexShrink: 0,
        }}
      >
        <input
          type="text"
          className="form-input"
          placeholder="Ask Fit AI about training, meal swaps, recovery, or plateaus..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          disabled={loading}
          style={{ flex: 1, padding: '0.85rem 1.1rem', fontSize: '0.95rem' }}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={loading || !inputQuery.trim()}
          style={{ padding: '0.85rem 1.5rem' }}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
