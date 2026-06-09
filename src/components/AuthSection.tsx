'use client';

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import styles from './AuthSection.module.css';
import { Compass, Sparkles, AlertCircle, Check } from 'lucide-react';

export default function AuthSection() {
  const { setUser } = useStore();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      setOtpSent(true);
      setMessage({ type: 'success', text: 'OTP / Magic Link has been sent to your email.' });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to send OTP. Please try again.';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error) throw error;

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
        });
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Invalid code. Please try again.';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!supabase) return;

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : '',
        },
      });

      if (error) throw error;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Google login failed.';
      setMessage({ type: 'error', text: errMsg });
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
          <h1 className={styles.title}>Goal Tracker</h1>
          <p className={styles.subtitle}>
            A responsive, local-first dashboard to track your habits and log task timings.
          </p>
        </div>

        {/* Warning if Supabase is offline/unconfigured */}
        {!supabase && (
          <div className={styles.warningBanner}>
            <div className={styles.warningTitle}>Configuration Required</div>
            <p className={styles.warningText}>
              Supabase environment variables are missing. Please configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your settings to enable authentication.
            </p>
          </div>
        )}

        {supabase ? (
          <>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.input}
                    disabled={loading}
                  />
                </div>
                <button type="submit" className={styles.btnPrimary} disabled={loading}>
                  {loading ? 'Sending...' : 'Send OTP Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>6-Digit Verification Code</label>
                  <input
                    type="text"
                    required
                    placeholder="123456"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className={styles.input}
                    disabled={loading}
                  />
                </div>
                <button type="submit" className={styles.btnPrimary} disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    textAlign: 'center',
                    marginTop: '8px',
                  }}
                >
                  Back to email entry
                </button>
              </form>
            )}

            {message && (
              <div className={`${styles.messageBanner} ${message.type === 'success' ? styles.successBanner : styles.errorBanner}`}>
                {message.type === 'success' ? (
                  <Check size={16} className={styles.messageIcon} />
                ) : (
                  <AlertCircle size={16} className={styles.messageIcon} />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <div className={styles.divider}>
              <span>or</span>
            </div>

            <button onClick={handleGoogleLogin} className={styles.btnGoogle} disabled={loading}>
              <Sparkles size={18} style={{ color: '#ea4335' }} />
              Sign in with Google
            </button>
          </>
        ) : null}


      </div>
    </div>
  );
}
