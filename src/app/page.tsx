'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import AuthSection from '../components/AuthSection';
import Dashboard from '../components/Dashboard';

// Custom hook to ensure Zustand store hydration has completed on the client
function useHasHydrated() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    // If store is already hydrated, set it immediately
    if (useStore.persist.hasHydrated()) {
      Promise.resolve().then(() => setHasHydrated(true));
      return;
    }

    // Otherwise, listen for hydration completion
    const unsub = useStore.persist.onFinishHydration(() => {
      Promise.resolve().then(() => setHasHydrated(true));
    });

    return () => unsub();
  }, []);

  return hasHydrated;
}

export default function Home() {
  const { user, isGuestMode, setUser } = useStore();
  const hasHydrated = useHasHydrated();

  // Listen for Supabase Authentication state changes
  useEffect(() => {
    if (!supabase) return;

    // 1. Fetch current session status on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
        });
      } else {
        setUser(null);
      }
    });

    // 2. Subscribe to auth changes (login, logout, token refreshes)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser]);

  if (!hasHydrated) {
    // Return a clean white loading shell during server-side hydration
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-canvas)' }} />
    );
  }

  // Display workspace if logged in or using Guest Mode, otherwise show Auth screen
  if (user || isGuestMode) {
    return <Dashboard />;
  }

  return <AuthSection />;
}
