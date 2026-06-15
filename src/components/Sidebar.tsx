'use client';

import React from 'react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import styles from './Sidebar.module.css';
import { Compass, CheckSquare, Clock, BarChart2, LogOut, RefreshCw, AlertCircle, Settings } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { user, isGuestMode, syncQueue, isSyncing, isOnline, setUser, setGuestMode, clearLocalData } = useStore();

  const getAvatarInitials = () => {
    if (isGuestMode) return 'G';
    if (user?.username) return user.username.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const getDisplayName = () => {
    if (isGuestMode) return 'Guest User';
    return user?.username || user?.email || 'User';
  };

  const getDisplaySubtitle = () => {
    if (isGuestMode) return 'Offline Sandbox';
    return '';
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setGuestMode(false);
    clearLocalData();
  };

  const getSyncStatusText = () => {
    if (!isOnline) return 'Offline Mode';
    if (isSyncing) return 'Syncing...';
    if (syncQueue.length > 0) return `${syncQueue.length} pending syncs`;
    return 'Synced to Cloud';
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.topSection}>
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>
            <Compass size={22} />
          </div>
          <span className={styles.logoText}>Goal Tracker</span>
        </div>

        <nav className={styles.nav}>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`${styles.navItem} ${activeTab === 'tasks' ? styles.activeNavItem : ''}`}
          >
            <Clock size={18} />
            Task Timer
          </button>
          <button
            onClick={() => setActiveTab('routines')}
            className={`${styles.navItem} ${activeTab === 'routines' ? styles.activeNavItem : ''}`}
          >
            <CheckSquare size={18} />
            Daily Routines
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`${styles.navItem} ${activeTab === 'analytics' ? styles.activeNavItem : ''}`}
          >
            <BarChart2 size={18} />
            Analytics
          </button>
        </nav>
      </div>

      <div className={styles.bottomSection}>
        {/* Sync Status (only if authenticated user or offline sync is possible) */}
        {user && (
          <div className={styles.syncIndicator}>
            {isSyncing ? (
              <RefreshCw size={14} className={styles.syncDotPending} />
            ) : !isOnline ? (
              <AlertCircle size={14} style={{ color: 'var(--color-danger)' }} />
            ) : (
              <div className={`${styles.syncDot} ${syncQueue.length > 0 ? styles.syncDotPending : ''}`} />
            )}
            <span>{getSyncStatusText()}</span>
          </div>
        )}

        <div className={styles.userInfo}>
          <div className={styles.userProfileWrapper}>
            {user?.avatarUrl && !isGuestMode ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img 
                src={user.avatarUrl} 
                alt="Avatar" 
                className={styles.avatarImage} 
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className={styles.avatarFallback}>
                {getAvatarInitials()}
              </div>
            )}
            <div className={styles.userDetails}>
              <span className={styles.userName} title={getDisplayName()}>
                {getDisplayName()}
              </span>
              {getDisplaySubtitle() && (
                <span className={styles.userRole}>
                  {getDisplaySubtitle()}
                </span>
              )}
            </div>
          </div>
          <div className={styles.userActions}>
            <button
              onClick={() => setActiveTab('settings')}
              className={`${styles.settingsBtn} ${activeTab === 'settings' ? styles.activeSettingsBtn : ''}`}
              title="Settings"
            >
              <Settings size={16} />
            </button>
            <button onClick={handleLogout} className={styles.logoutBtn} title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
