'use client';

import { useEffect, useState } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('gt-theme');
      const initial = (saved === 'light' ? 'light' : 'dark') as 'light' | 'dark';
      if (initial === 'light') {
        setTimeout(() => setTheme('light'), 0);
      }
      document.documentElement.dataset.theme = initial === 'light' ? 'light' : '';
    } catch {
      // Ignore
    }
  }, []);

  const toggleTheme = () => {
    setTheme(t => {
      const next = t === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('gt-theme', next);
      } catch {}
      document.documentElement.dataset.theme = next === 'light' ? 'light' : '';
      return next;
    });
  };

  return { theme, toggleTheme };
}
