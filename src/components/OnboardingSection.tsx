'use client';

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import styles from './OnboardingSection.module.css';
import { AlertCircle, CheckSquare, Clock, Target, Check, Zap } from 'lucide-react';

export default function OnboardingSection() {
  const { user, setUser } = useStore();
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState(() => {
    return user?.username || (user?.email ? user.email.split('@')[0] : '');
  });
  const [birthdate, setBirthdate] = useState(() => {
    return user?.birthdate || '';
  });
  const [focuses, setFocuses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleFocus = (id: string) => {
    setFocuses(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleFinishOnboarding = async () => {
    if (!username.trim()) {
      setError('Username is required.');
      setStep(0);
      return;
    }

    if (!birthdate) {
      setError('Birthdate is required.');
      setStep(1);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!supabase || !user) {
        // Fallback for missing/unconfigured backend
        setUser({
          id: user?.id || 'guest',
          email: user?.email || 'guest@example.com',
          username: username.trim(),
          birthdate: birthdate,
        });
        return;
      }

      const { data, error: updateError } = await supabase.auth.updateUser({
        data: {
          username: username.trim(),
          birthdate: birthdate,
        },
      });

      if (updateError) throw updateError;

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          username: data.user.user_metadata?.username || '',
          birthdate: data.user.user_metadata?.birthdate || '',
          avatarUrl: data.user.user_metadata?.avatar_url || '',
        });
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to update profile. Please try again.';
      setError(errMsg);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const opts = [
    { id: 'habits', icon: CheckSquare, label: 'Build habits', sub: 'Track daily routines' },
    { id: 'time', icon: Clock, label: 'Log time', sub: 'Focus session tracker' },
    { id: 'goals', icon: Target, label: 'Reach goals', sub: 'Objectives & milestones' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Progress indicator */}
        <div className={styles.progressWrapper}>
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`${styles.progressBar} ${i <= step ? styles.progressBarActive : ''}`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className={`${styles.stepContent} ${styles.fadeUpAnimation}`}>
            <div>
              <h2 className={styles.title}>Welcome aboard</h2>
              <p className={styles.subtitle}>What should we call you?</p>
            </div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              className={styles.textInput}
              onKeyDown={e => {
                if (e.key === 'Enter' && username.trim()) setStep(1);
              }}
            />
            <button
              onClick={() => setStep(1)}
              disabled={!username.trim()}
              className={styles.btnPrimary}
            >
              Continue →
            </button>
          </div>
        )}

        {step === 1 && (
          <div className={`${styles.stepContent} ${styles.fadeUpAnimation}`}>
            <div>
              <h2 className={styles.title}>Happy Birthday?</h2>
              <p className={styles.subtitle}>When is your birth date?</p>
            </div>
            <input
              type="date"
              value={birthdate}
              onChange={e => setBirthdate(e.target.value)}
              autoFocus
              className={styles.dateInput}
              onKeyDown={e => {
                if (e.key === 'Enter' && birthdate) setStep(2);
              }}
            />
            {error && (
              <div className={styles.errorBanner}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setStep(0)}
                className={styles.btnPrimary}
                style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border-strong)', color: 'var(--text-secondary)' }}
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!birthdate}
                className={styles.btnPrimary}
                style={{ flex: 2 }}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={`${styles.stepContent} ${styles.fadeUpAnimation}`}>
            <div>
              <h2 className={styles.title}>What brings you here?</h2>
              <p className={styles.subtitle}>Pick everything that applies</p>
            </div>
            <div className={styles.focusesGrid}>
              {opts.map(o => {
                const Icon = o.icon;
                const active = focuses.includes(o.id);
                return (
                  <button
                    key={o.id}
                    onClick={() => toggleFocus(o.id)}
                    className={`${styles.focusOption} ${active ? styles.focusOptionActive : ''}`}
                  >
                    <div className={`${styles.focusIconBox} ${active ? styles.focusIconBoxActive : ''}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className={styles.focusLabel}>{o.label}</div>
                      <div className={styles.focusSub}>{o.sub}</div>
                    </div>
                    {active && <Check size={18} className={styles.checkIcon} />}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                className={styles.btnPrimary}
                style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border-strong)', color: 'var(--text-secondary)' }}
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={focuses.length === 0}
                className={styles.btnPrimary}
                style={{ flex: 2 }}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={`${styles.stepContent} ${styles.fadeUpAnimation}`}>
            <div className={styles.zapCircle}>
              <Zap size={32} className={styles.zapIcon} />
            </div>
            <div>
              <h2 className={styles.title}>You&apos;re all set, {username}.</h2>
              <p className={styles.subtitle}>
                Your dashboard is ready. Start building streaks, one day at a time.
              </p>
            </div>
            {error && (
              <div className={styles.errorBanner}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
              <button
                onClick={handleFinishOnboarding}
                disabled={loading}
                className={styles.btnPrimary}
              >
                {loading ? 'Finalizing Profile...' : 'Open Dashboard →'}
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className={styles.btnPrimary}
                style={{ background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--text-secondary)' }}
                disabled={loading}
              >
                ← Change Objectives
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
