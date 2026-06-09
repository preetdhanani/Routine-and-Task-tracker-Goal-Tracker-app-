'use client';

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import styles from './OnboardingSection.module.css';
import { Compass, User, Calendar, AlertCircle } from 'lucide-react';

export default function OnboardingSection() {
  const { user, setUser } = useStore();
  const [username, setUsername] = useState(() => {
    return user?.username || (user?.email ? user.email.split('@')[0] : '');
  });
  const [birthdate, setBirthdate] = useState(() => {
    return user?.birthdate || '';
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;

    if (!username.trim()) {
      setError('Username is required.');
      return;
    }

    if (!birthdate) {
      setError('Birthdate is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.card} glass-panel`}>
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>
            <Compass size={32} />
          </div>
          <h1 className={styles.title}>Complete Your Profile</h1>
          <p className={styles.subtitle}>
            Just a few more details to personalize your experience.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <User size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Username
            </label>
            <input
              type="text"
              required
              placeholder="e.g. johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={styles.input}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <Calendar size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Birthdate
            </label>
            <input
              type="date"
              required
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className={styles.input}
              disabled={loading}
            />
          </div>

          {error && (
            <div className={styles.errorBanner}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? 'Saving Profile...' : 'Save & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
