'use client';

import React from 'react';
import { useStore } from '../store/useStore';
import styles from './GuestWelcomeSection.module.css';
import { AlertTriangle, Compass, ArrowRight, ShieldAlert } from 'lucide-react';

interface GuestWelcomeSectionProps {
  onEnter: () => void;
}

export default function GuestWelcomeSection({ onEnter }: GuestWelcomeSectionProps) {
  const { setGuestMode } = useStore();

  return (
    <div className={styles.container}>
      <div className={styles.glowOrb1} />
      <div className={styles.glowOrb2} />

      <div className={styles.cardWrapper}>
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>
            <Compass size={30} />
          </div>
          <h1 className={styles.title}>Goal Tracker</h1>
        </div>

        <div className={styles.noticeCard}>
          <div className={styles.warningIconHeader}>
            <AlertTriangle size={48} className={styles.warningIcon} />
          </div>
          
          <h2 className={styles.noticeTitle}>Guest Sandbox Mode</h2>
          
          <p className={styles.description}>
            You are entering the application as a guest. Please be aware that in production, 
            <strong> your progress is NOT saved to the cloud</strong>.
          </p>

          <div className={styles.infoBox}>
            <ShieldAlert size={20} className={styles.infoBoxIcon} />
            <p className={styles.infoBoxText}>
              All tasks, habits, and time logs will only be stored locally in this browser&apos;s cache. 
              Clearing browser cookies, resetting your cache, or switching browsers/devices will 
              cause your data to be <strong>permanently lost</strong>.
            </p>
          </div>

          <div className={styles.btnGroup}>
            <button onClick={onEnter} className={styles.btnPrimary}>
              I Understand, Continue to Sandbox
              <ArrowRight size={16} style={{ marginLeft: '8px' }} />
            </button>
            
            <button 
              onClick={() => setGuestMode(false)} 
              className={styles.btnSecondary}
            >
              Go Back to Sign In (Cloud Sync)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
