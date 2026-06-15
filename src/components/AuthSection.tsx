'use client';

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import styles from './AuthSection.module.css';
import { Compass, Sparkles, AlertCircle, Check } from 'lucide-react';

export default function AuthSection() {
  const { setUser, setGuestMode } = useStore();
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
      setMessage({ type: 'success', text: 'OTP code has been sent to your email.' });
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
      {/* Background ambient orbs */}
      <div className={styles.glowOrb1} />
      <div className={styles.glowOrb2} />

      <div className={styles.cardWrapper}>
        {/* Brand/Logo Section */}
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>
            <Compass size={30} />
          </div>
          <h1 className={styles.title}>Goal Tracker</h1>
          <p className={styles.subtitle}>Track habits, log time, reach your goals.</p>
        </div>

        {/* Warning if Supabase is offline/unconfigured */}
        {!supabase && (
          <div className={styles.warningBanner}>
            <div className={styles.warningTitle}>Configuration Required</div>
            <p className={styles.warningText}>
              Supabase environment variables are missing. Please configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to enable auth.
            </p>
          </div>
        )}

        {/* Card Form */}
        <div className={styles.formCard}>
          {supabase ? (
            <>
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className={styles.form}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={styles.input}
                      disabled={loading}
                    />
                  </div>
                  <button type="submit" className={styles.btnPrimary} disabled={loading}>
                    {loading ? 'Sending...' : 'Send Code'}
                  </button>

                  <div className={styles.divider}>
                    <span>or</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className={styles.btnGoogle}
                    disabled={loading}
                  >
                    <Sparkles size={18} style={{ color: '#ea4335' }} />
                    Sign in with Google
                  </button>

                  <button
                    type="button"
                    onClick={() => setGuestMode(true)}
                    className={styles.btnGuest}
                    disabled={loading}
                  >
                    Continue as Guest
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className={styles.form}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>6-Digit Code</label>
                    <input
                      type="text"
                      required
                      placeholder="123456"
                      maxLength={6}
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className={styles.otpInput}
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                  <button type="submit" className={styles.btnPrimary} disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify & Enter'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className={styles.btnBack}
                    disabled={loading}
                  >
                    ← Back
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
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setGuestMode(true)}
                className={styles.btnGuest}
              >
                Continue as Guest (Offline Mode)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
