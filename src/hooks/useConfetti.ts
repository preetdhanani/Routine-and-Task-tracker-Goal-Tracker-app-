'use client';

export function useConfetti() {
  const spawnConfetti = (anchorEl?: HTMLElement) => {
    const cx = anchorEl ? anchorEl.getBoundingClientRect().left + anchorEl.offsetWidth / 2 : window.innerWidth / 2;
    const cy = anchorEl ? anchorEl.getBoundingClientRect().top + anchorEl.offsetHeight / 2 : window.innerHeight / 2;

    const colors = ['#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f97316', '#c4b5fd', '#6ee7b7'];

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const dist = 36 + Math.random() * 28;
      const dot = document.createElement('div');
      dot.className = 'confetti-dot-global';
      dot.style.cssText = `
        position: fixed;
        width: ${5 + Math.random() * 4}px;
        height: ${5 + Math.random() * 4}px;
        border-radius: 50%;
        background: ${colors[i % colors.length]};
        left: ${cx}px;
        top: ${cy}px;
        pointer-events: none;
        z-index: 9999;
        --tx: ${Math.cos(angle) * dist}px;
        --ty: ${Math.sin(angle) * dist}px;
        animation: confettiFlyGlobal 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      `;
      document.body.appendChild(dot);
      setTimeout(() => dot.remove(), 750);
    }
  };

  return spawnConfetti;
}
