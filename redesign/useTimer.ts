// src/components/redesign/useTimer.ts — Drop into your Next.js project

import { useEffect, useState } from 'react';

export function useTimer(startedAt: number | null) {
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    if (!startedAt) return;

    const tick = () => setSecs(Math.round((Date.now() - startedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const displayTime = () => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return [hours, minutes, seconds].map(v => String(v).padStart(2, '0')).join(':');
  };

  return { displayTime: displayTime(), secs };
}
