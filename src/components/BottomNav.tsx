'use client';

import React from 'react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import styles from './BottomNav.module.css';
import { CheckSquare, Clock, BarChart2, LogOut, Settings } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const { setUser, setGuestMode, clearLocalData } = useStore();

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setGuestMode(false);
    clearLocalData();
  };

  return (
    <nav className={styles.bottomNav}>
      <button
        onClick={() => setActiveTab('tasks')}
        className={`${styles.navItem} ${activeTab === 'tasks' ? styles.activeNavItem : ''}`}
      >
        <Clock size={20} />
        Timer
      </button>

      <button
        onClick={() => setActiveTab('routines')}
        className={`${styles.navItem} ${activeTab === 'routines' ? styles.activeNavItem : ''}`}
      >
        <CheckSquare size={20} />
        Routines
      </button>

      <button
        onClick={() => setActiveTab('analytics')}
        className={`${styles.navItem} ${activeTab === 'analytics' ? styles.activeNavItem : ''}`}
      >
        <BarChart2 size={20} />
        Analytics
      </button>

      <button
        onClick={() => setActiveTab('settings')}
        className={`${styles.navItem} ${activeTab === 'settings' ? styles.activeNavItem : ''}`}
      >
        <Settings size={20} />
        Settings
      </button>

      <button onClick={handleLogout} className={styles.logoutBtn} title="Sign Out">
        <LogOut size={20} />
        Sign Out
      </button>
    </nav>
  );
}

