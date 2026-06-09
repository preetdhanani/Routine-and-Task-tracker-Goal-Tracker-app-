'use client';

import React, { useState } from 'react';
import { useStore, Routine } from '../store/useStore';
import styles from './RoutinesSection.module.css';
import { Flame, Plus, Trash2, Check, Award, CheckCircle, Trash } from 'lucide-react';

// Confetti Spawner Utility
const spawnConfetti = (x: number, y: number) => {
  for (let i = 0; i < 14; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-particle';
    const colors = ['#10b981', '#34d399', '#6366f1', '#fb7185', '#fbbf24', '#06b6d4'];
    el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Spread in a full circle
    const angle = (i / 14) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
    const velocity = 40 + Math.random() * 50;
    const tx = Math.cos(angle) * velocity + 'px';
    const ty = Math.sin(angle) * velocity + 'px';
    
    el.style.setProperty('--tx', tx);
    el.style.setProperty('--ty', ty);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 600);
  }
};

// Swipable Mobile Habit Card Sub-component
interface RoutineCardProps {
  routine: Routine;
  isCompleted: boolean;
  todayStr: string;
  currentStreak: number;
  longestStreak: number;
  onToggle: (id: string, date: string) => void;
  onDelete: (id: string) => void;
}

const RoutineCard = ({
  routine,
  isCompleted,
  todayStr,
  currentStreak,
  longestStreak,
  onToggle,
  onDelete,
}: RoutineCardProps) => {
  const [swipeX, setSwipeX] = useState(0);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [isSwiping, setIsSwiping] = useState(false);
  const [isAnimatingCheck, setIsAnimatingCheck] = useState(false);

  const getBadgeClass = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'health': return styles.badgeHealth;
      case 'fitness': return styles.badgeFitness;
      case 'mindset': return styles.badgeMindset;
      case 'learning': return styles.badgeLearning;
      default: return styles.badgeWork;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
    setIsSwiping(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const diffX = e.touches[0].clientX - touchStart.x;
    const diffY = e.touches[0].clientY - touchStart.y;

    // Detect horizontal swipe dominance
    if (Math.abs(diffX) > Math.abs(diffY)) {
      setIsSwiping(true);
      // Dampen swipe drag past limits
      let val = diffX;
      if (diffX > 140) val = 140 + (diffX - 140) * 0.2;
      if (diffX < -140) val = -140 + (diffX + 140) * 0.2;
      setSwipeX(val);

      // Prevent scroll only when swiping horizontally
      if (e.cancelable) e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isSwiping) {
      if (swipeX > 90) {
        // Swipe Right -> Complete/Toggle
        // Get target coordinates for confetti particle burst
        const x = e.changedTouches[0].clientX;
        const y = e.changedTouches[0].clientY;
        
        if (!isCompleted) {
          spawnConfetti(x, y);
          setIsAnimatingCheck(true);
          setTimeout(() => setIsAnimatingCheck(false), 400);
        }
        onToggle(routine.id, todayStr);
      } else if (swipeX < -90) {
        // Swipe Left -> Delete
        if (confirm(`Delete routine "${routine.title}"?`)) {
          onDelete(routine.id);
        }
      }
    }
    setSwipeX(0);
    setIsSwiping(false);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCompleted) {
      spawnConfetti(e.clientX, e.clientY);
      setIsAnimatingCheck(true);
      setTimeout(() => setIsAnimatingCheck(false), 450);
    }
    onToggle(routine.id, todayStr);
  };

  return (
    <div className={styles.routineWrapper}>
      {/* Background Swipe indicators */}
      {swipeX > 0 && (
        <div className={`${styles.swipeIndicator} ${styles.swipeIndicatorRight}`} style={{ opacity: Math.min(1, swipeX / 70) }}>
          <CheckCircle size={20} style={{ marginRight: '8px' }} />
          <span>{isCompleted ? 'Mark Active' : 'Mark Completed'}</span>
        </div>
      )}
      {swipeX < 0 && (
        <div className={`${styles.swipeIndicator} ${styles.swipeIndicatorLeft}`} style={{ opacity: Math.min(1, Math.abs(swipeX) / 70) }}>
          <span>Delete Habit</span>
          <Trash size={20} style={{ marginLeft: '8px' }} />
        </div>
      )}

      {/* Foreground card */}
      <div
        className={`${styles.routineItem} ${isCompleted ? styles.routineItemCompleted : ''}`}
        style={{ transform: `translateX(${swipeX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.routineMain}>
          <button
            type="button"
            onClick={handleCheckboxClick}
            className={`${styles.checkboxContainer} ${isCompleted ? styles.checkboxChecked : ''} ${isAnimatingCheck ? 'animate-checkbox-pop' : ''}`}
          >
            {isCompleted && <Check size={14} strokeWidth={3} />}
          </button>

          <div className={styles.routineDetails}>
            <span className={`${styles.routineTitle} ${isCompleted ? `${styles.routineTitleCompleted} animate-strikethrough` : ''}`}>
              {routine.title}
            </span>
            <span className={`${styles.badge} ${getBadgeClass(routine.category)}`}>
              {routine.category}
            </span>
          </div>
        </div>

        <div className={styles.routineMeta}>
          <div className={styles.streaks}>
            <div className={styles.streakItem} title="Current streak">
              <Flame size={16} />
              <span>{currentStreak}d</span>
            </div>
            <div className={styles.streakItem} title="Longest streak" style={{ color: 'var(--text-muted)' }}>
              <Award size={16} />
              <span>{longestStreak}d</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onDelete(routine.id)}
            className={styles.deleteBtn}
            title="Delete habit"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function RoutinesSection() {
  const { routines, routineLogs, addRoutine, toggleRoutine, deleteRoutine } = useStore();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Health');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Helper: Get local YYYY-MM-DD
  const getLocalDateString = (daysAgo = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toLocaleDateString('sv');
  };

  const todayStr = getLocalDateString(0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addRoutine(title.trim(), category);
    setTitle('');
    setIsFormOpen(false); // Close form inline after adding
  };

  // Streak calculations
  const calculateStreak = (routineId: string) => {
    const completedDates = new Set(
      routineLogs
        .filter((log) => log.routine_id === routineId)
        .map((log) => log.completed_date)
    );

    if (completedDates.size === 0) return { current: 0, longest: 0 };

    let current = 0;
    let daysAgo = 0;

    if (completedDates.has(getLocalDateString(0))) {
      current = 1;
      daysAgo = 1;
      while (completedDates.has(getLocalDateString(daysAgo))) {
        current++;
        daysAgo++;
      }
    } else if (completedDates.has(getLocalDateString(1))) {
      current = 1;
      daysAgo = 2;
      while (completedDates.has(getLocalDateString(daysAgo))) {
        current++;
        daysAgo++;
      }
    }

    const sortedDates = Array.from(completedDates)
      .map((d) => new Date(d).getTime())
      .sort((a, b) => a - b);

    let longest = 0;
    let tempLongest = 0;
    let lastTime = 0;

    sortedDates.forEach((time) => {
      if (lastTime === 0) {
        tempLongest = 1;
      } else {
        const diffDays = Math.round((time - lastTime) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempLongest++;
        } else if (diffDays > 1) {
          if (tempLongest > longest) longest = tempLongest;
          tempLongest = 1;
        }
      }
      lastTime = time;
    });

    if (tempLongest > longest) longest = tempLongest;

    return { current, longest };
  };

  // Heatmap scores
  const getHeatmapData = () => {
    const data = [];
    const activeRoutines = routines.filter((r) => r.is_active);

    for (let i = 29; i >= 0; i--) {
      const dateStr = getLocalDateString(i);
      const completionsForDay = routineLogs.filter((log) => log.completed_date === dateStr);
      
      const totalCount = activeRoutines.length;
      const completedCount = completionsForDay.length;

      let score = 0;
      if (totalCount > 0 && completedCount > 0) {
        const ratio = completedCount / totalCount;
        if (ratio === 1) score = 4;
        else if (ratio >= 0.66) score = 3;
        else if (ratio >= 0.33) score = 2;
        else score = 1;
      }

      data.push({
        date: dateStr,
        completed: completedCount,
        total: totalCount,
        score,
      });
    }
    return data;
  };

  const heatmapData = getHeatmapData();

  // Split routines into active and completed groups for layout reordering
  const activeRoutinesList = routines.filter(
    (r) => !routineLogs.some((log) => log.routine_id === r.id && log.completed_date === todayStr)
  );

  const completedRoutinesList = routines.filter((r) =>
    routineLogs.some((log) => log.routine_id === r.id && log.completed_date === todayStr)
  );

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <div className={styles.header}>
        <h2 className={styles.title}>Daily Routines</h2>
        <p className={styles.subtitle}>Track your small wins day by day. Swipe on items to complete/delete on mobile.</p>
      </div>

      {/* Heatmap Section */}
      {routines.length > 0 && (
        <div className={`${styles.cardHeatmap} glass-panel`}>
          <h3 className={styles.cardTitle}>Habit Consistency (Last 30 Days)</h3>
          
          <div className={styles.heatmapGrid}>
            {heatmapData.map((day) => (
              <div
                key={day.date}
                className={`${styles.heatmapCell} ${styles['cell' + day.score]}`}
                title={`${day.date}: ${day.completed}/${day.total} habits completed`}
              />
            ))}
          </div>

          <div className={styles.heatmapLegend}>
            <span>Less</span>
            <div className={`${styles.legendBox} ${styles.cell0}`} />
            <div className={`${styles.legendBox} ${styles.cell1}`} />
            <div className={`${styles.legendBox} ${styles.cell2}`} />
            <div className={`${styles.legendBox} ${styles.cell3}`} />
            <div className={`${styles.legendBox} ${styles.cell4}`} />
            <span>More</span>
          </div>
        </div>
      )}

      {/* Collapsible Form Toggle */}
      {!isFormOpen ? (
        <button onClick={() => setIsFormOpen(true)} className={styles.formToggleBtn}>
          <Plus size={16} />
          Create New Routine
        </button>
      ) : (
        <form onSubmit={handleAdd} className={styles.addBar}>
          <input
            type="text"
            required
            placeholder="What habit are you starting? (e.g. Read for 15 mins)..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.input}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={styles.select}
          >
            <option value="Health">Health</option>
            <option value="Mindset">Mindset</option>
            <option value="Fitness">Fitness</option>
            <option value="Learning">Learning</option>
            <option value="Work">Work</option>
          </select>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" className={styles.addBtn}>
              Add Habit
            </button>
            <button type="button" onClick={() => setIsFormOpen(false)} className={styles.cancelFormBtn}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Routines List Container */}
      <div className={styles.listContainer}>
        {/* Active Section */}
        {activeRoutinesList.length > 0 && (
          <>
            <div className={styles.sectionDivider}>Active Habits ({activeRoutinesList.length})</div>
            {activeRoutinesList.map((routine) => {
              const { current, longest } = calculateStreak(routine.id);
              return (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  isCompleted={false}
                  todayStr={todayStr}
                  currentStreak={current}
                  longestStreak={longest}
                  onToggle={toggleRoutine}
                  onDelete={deleteRoutine}
                />
              );
            })}
          </>
        )}

        {/* Completed Section */}
        {completedRoutinesList.length > 0 && (
          <>
            <div className={styles.sectionDivider}>Completed Today ({completedRoutinesList.length})</div>
            {completedRoutinesList.map((routine) => {
              const { current, longest } = calculateStreak(routine.id);
              return (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  isCompleted={true}
                  todayStr={todayStr}
                  currentStreak={current}
                  longestStreak={longest}
                  onToggle={toggleRoutine}
                  onDelete={deleteRoutine}
                />
              );
            })}
          </>
        )}

        {routines.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            No routines created yet. Click &quot;Create New Routine&quot; above to begin!
          </div>
        )}
      </div>
    </div>
  );
}
