'use client';

import React, { useState } from 'react';
import { useStore, Routine } from '../store/useStore';
import styles from './RoutinesSection.module.css';
import { Flame, Plus, Trash2, Check, Award, CheckCircle, Trash, Pencil, X, ChevronDown, ChevronUp, Calendar } from 'lucide-react';

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
const DAYS = [
  { label: 'M', value: 1, name: 'Mon' },
  { label: 'T', value: 2, name: 'Tue' },
  { label: 'W', value: 3, name: 'Wed' },
  { label: 'T', value: 4, name: 'Thu' },
  { label: 'F', value: 5, name: 'Fri' },
  { label: 'S', value: 6, name: 'Sat' },
  { label: 'S', value: 0, name: 'Sun' },
];

interface RoutineCardProps {
  routine: Routine;
  isCompleted: boolean;
  todayStr: string;
  currentStreak: number;
  longestStreak: number;
  onToggle: (id: string, date: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, title: string, category: string, schedule?: number[]) => void;
}

const getInitialPreset = (schedule?: number[]) => {
  if (!schedule) return 'everyday';
  const s = [...schedule].sort().join(',');
  if (s === '0,1,2,3,4,5,6') return 'everyday';
  if (s === '1,2,3,4,5') return 'weekdays';
  if (s === '0,6') return 'weekends';
  return 'custom';
};

const RoutineCard = ({
  routine,
  isCompleted,
  todayStr,
  currentStreak,
  longestStreak,
  onToggle,
  onDelete,
  onUpdate,
}: RoutineCardProps) => {
  const [swipeX, setSwipeX] = useState(0);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [isSwiping, setIsSwiping] = useState(false);
  const [isAnimatingCheck, setIsAnimatingCheck] = useState(false);

  // Edit Mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(routine.title);
  const [editCategory, setEditCategory] = useState(routine.category);
  const [editPreset, setEditPreset] = useState<'everyday' | 'weekdays' | 'weekends' | 'custom'>(() => getInitialPreset(routine.schedule));
  const [editSchedule, setEditSchedule] = useState<number[]>(routine.schedule || [0, 1, 2, 3, 4, 5, 6]);

  const { lifestyleMode } = useStore();

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
    if (isEditing) return;
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
    setIsSwiping(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isEditing) return;
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
    if (isEditing) return;
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
      {swipeX > 0 && !isEditing && (
        <div className={`${styles.swipeIndicator} ${styles.swipeIndicatorRight}`} style={{ opacity: Math.min(1, swipeX / 70) }}>
          <CheckCircle size={20} style={{ marginRight: '8px' }} />
          <span>{isCompleted ? 'Mark Active' : 'Mark Completed'}</span>
        </div>
      )}
      {swipeX < 0 && !isEditing && (
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
        {isEditing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editTitle.trim()) {
                let finalSchedule = routine.schedule || [0, 1, 2, 3, 4, 5, 6];
                if (lifestyleMode === 'dynamic') {
                  finalSchedule = [0, 1, 2, 3, 4, 5, 6];
                  if (editPreset === 'weekdays') finalSchedule = [1, 2, 3, 4, 5];
                  else if (editPreset === 'weekends') finalSchedule = [0, 6];
                  else if (editPreset === 'custom') finalSchedule = editSchedule;
                }

                onUpdate(routine.id, editTitle.trim(), editCategory, finalSchedule);
                setIsEditing(false);
              }
            }}
            className={styles.editRoutineForm}
            style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'stretch' }}
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className={styles.editRoutineInput}
                autoFocus
              />
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className={styles.editRoutineSelect}
              >
                <option value="Health">Health</option>
                <option value="Mindset">Mindset</option>
                <option value="Fitness">Fitness</option>
                <option value="Learning">Learning</option>
                <option value="Work">Work</option>
              </select>
              <button type="submit" className={styles.saveRoutineBtn} title="Save">
                <Check size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditTitle(routine.title);
                  setEditCategory(routine.category);
                  setEditPreset(getInitialPreset(routine.schedule));
                  setEditSchedule(routine.schedule || [0, 1, 2, 3, 4, 5, 6]);
                  setIsEditing(false);
                }}
                className={styles.cancelRoutineBtn}
                title="Cancel"
              >
                <X size={14} />
              </button>
            </div>
            
            {lifestyleMode === 'dynamic' && (
              <div className={styles.daySelectorRow}>
                <span className={styles.selectorLabel}>Repeat Schedule:</span>
                <div className={styles.presetSelector}>
                  {(['everyday', 'weekdays', 'weekends', 'custom'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEditPreset(p)}
                      className={`${styles.presetBtn} ${editPreset === p ? styles.presetBtnActive : ''}`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
                
                {editPreset === 'custom' && (
                  <div className={styles.dayButtons} style={{ marginTop: '4px' }}>
                    {DAYS.map((day) => {
                      const isActive = editSchedule.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => {
                            setEditSchedule((prev) =>
                              prev.includes(day.value)
                                ? prev.filter((v) => v !== day.value)
                                : [...prev, day.value]
                            );
                          }}
                          className={`${styles.dayBtn} ${isActive ? styles.dayBtnActive : ''}`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </form>
        ) : (
          <>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span className={`${styles.badge} ${getBadgeClass(routine.category)}`}>
                    {routine.category}
                  </span>
                  {lifestyleMode === 'dynamic' && routine.schedule && routine.schedule.length < 7 && (
                    <span className={styles.scheduledDaysBadge}>
                      🗓️ {routine.schedule.map(val => DAYS.find(d => d.value === val)?.name).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.routineMeta}>
              <div className={styles.streaks}>
                <div className={styles.streakItem} title="Current streak">
                  <Flame size={16} className={currentStreak >= 5 ? 'animate-flame-pulse' : ''} />
                  <span>{currentStreak}d</span>
                </div>
                <div className={styles.streakItem} title="Longest streak" style={{ color: 'var(--text-muted)' }}>
                  <Award size={16} />
                  <span>{longestStreak}d</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className={styles.editBtn}
                title="Edit habit"
              >
                <Pencil size={14} />
              </button>

              <button
                type="button"
                onClick={() => onDelete(routine.id)}
                className={styles.deleteBtn}
                title="Delete habit"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default function RoutinesSection() {
  const { routines, routineLogs, addRoutine, toggleRoutine, deleteRoutine, updateRoutine, lifestyleMode, setLifestyleMode } = useStore();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Health');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [schedulePreset, setSchedulePreset] = useState<'everyday' | 'weekdays' | 'weekends' | 'custom'>('everyday');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [showOtherDays, setShowOtherDays] = useState(false);

  // Helper: Get local YYYY-MM-DD
  const getLocalDateString = (daysAgo = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toLocaleDateString('sv');
  };

  const todayStr = getLocalDateString(0);

  if (lifestyleMode === null) {
    return (
      <div className={styles.onboardingContainer}>
        <div className={styles.onboardingHeader}>
          <h2 className={styles.onboardingTitle}>Choose Your Routine Style</h2>
          <p className={styles.onboardingSubtitle}>
            Select how you track your habits. Don&apos;t worry, you can easily change this later in the header!
          </p>
        </div>
        <div className={styles.onboardingGrid}>
          <div
            className={styles.onboardingCard}
            onClick={() => setLifestyleMode('steady')}
          >
            <div className={styles.onboardingCardIcon}>
              <Flame size={24} />
            </div>
            <h3 className={styles.onboardingCardTitle}>Steady Routine</h3>
            <span className={styles.onboardingCardSubtitle}>Simple & Consistent</span>
            <p className={styles.onboardingCardDesc}>
              Best for fixed 9-to-5 schedules. Track habits everyday with a focus on building long streak counts.
            </p>
          </div>
          <div
            className={styles.onboardingCard}
            onClick={() => setLifestyleMode('dynamic')}
          >
            <div className={styles.onboardingCardIcon}>
              <Calendar size={24} />
            </div>
            <h3 className={styles.onboardingCardTitle}>Dynamic Routine</h3>
            <span className={styles.onboardingCardSubtitle}>Flexible & Scheduled</span>
            <p className={styles.onboardingCardDesc}>
              Best for students or hybrid workers. Schedule habits on specific days and split daily routines from weekly scheduled focus.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    let finalSchedule = [0, 1, 2, 3, 4, 5, 6];
    if (schedulePreset === 'weekdays') finalSchedule = [1, 2, 3, 4, 5];
    else if (schedulePreset === 'weekends') finalSchedule = [0, 6];
    else if (schedulePreset === 'custom') finalSchedule = selectedDays;

    addRoutine(title.trim(), category, finalSchedule);
    setTitle('');
    setSchedulePreset('everyday');
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
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

  const todayDayValue = new Date().getDay();

  const routinesScheduledForToday = routines.filter(
    (r) => !r.schedule || r.schedule.includes(todayDayValue)
  );

  const routinesScheduledForOtherDays = routines.filter(
    (r) => r.schedule && !r.schedule.includes(todayDayValue)
  );

  // Split routines into active and completed groups for layout reordering
  const activeRoutinesList = routinesScheduledForToday.filter(
    (r) => !routineLogs.some((log) => log.routine_id === r.id && log.completed_date === todayStr)
  );

  const completedRoutinesList = routinesScheduledForToday.filter((r) =>
    routineLogs.some((log) => log.routine_id === r.id && log.completed_date === todayStr)
  );

  // Helper to determine if a routine is an Anchor (Everyday, Weekdays, Weekends)
  const isAnchorRoutine = (r: Routine) => {
    if (!r.schedule) return true;
    const s = [...r.schedule].sort().join(',');
    const everyday = '0,1,2,3,4,5,6';
    const weekdays = '1,2,3,4,5';
    const weekends = '0,6';
    return s === everyday || s === weekdays || s === weekends;
  };

  // Group today's routines by type
  const activeAnchors = activeRoutinesList.filter(isAnchorRoutine);
  const completedAnchors = completedRoutinesList.filter(isAnchorRoutine);

  const activeScheduled = activeRoutinesList.filter((r) => !isAnchorRoutine(r));
  const completedScheduled = completedRoutinesList.filter((r) => !isAnchorRoutine(r));

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className={styles.title}>Daily Routines</h2>
          <p className={styles.subtitle}>Track your small wins day by day. Swipe on items to complete/delete on mobile.</p>
        </div>
        <div className={styles.modeSwitcher}>
          <button
            type="button"
            className={`${styles.modeBtn} ${lifestyleMode === 'steady' ? styles.modeBtnActive : ''}`}
            onClick={() => setLifestyleMode('steady')}
          >
            Steady Mode
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${lifestyleMode === 'dynamic' ? styles.modeBtnActive : ''}`}
            onClick={() => setLifestyleMode('dynamic')}
          >
            Dynamic Mode
          </button>
        </div>
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
        <form onSubmit={handleAdd} className={styles.addBar} style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
            <input
              type="text"
              required
              placeholder="What habit are you starting? (e.g. Read for 15 mins)..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input}
              style={{ flex: 2 }}
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={styles.select}
              style={{ flex: 1 }}
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
          </div>
          {lifestyleMode === 'dynamic' && (
            <div className={styles.daySelectorRow}>
              <span className={styles.selectorLabel}>Repeat Schedule:</span>
              <div className={styles.presetSelector}>
                {(['everyday', 'weekdays', 'weekends', 'custom'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSchedulePreset(p)}
                    className={`${styles.presetBtn} ${schedulePreset === p ? styles.presetBtnActive : ''}`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
              
              {schedulePreset === 'custom' && (
                <div className={styles.dayButtons} style={{ marginTop: '4px' }}>
                  {DAYS.map((day) => {
                    const isActive = selectedDays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => {
                          setSelectedDays(prev => 
                            prev.includes(day.value) 
                              ? prev.filter(v => v !== day.value) 
                              : [...prev, day.value]
                          );
                        }}
                        className={`${styles.dayBtn} ${isActive ? styles.dayBtnActive : ''}`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </form>
      )}

      {/* Routines List Container */}
      <div className={styles.listContainer}>
        {lifestyleMode === 'steady' ? (
          <>
            {/* Active Routines in Steady Mode */}
            {activeRoutinesList.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                      onUpdate={updateRoutine}
                    />
                  );
                })}
              </div>
            )}

            {/* Completed Routines in Steady Mode */}
            {completedRoutinesList.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                <div className={styles.sectionDivider}>Completed Habits</div>
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
                      onUpdate={updateRoutine}
                    />
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Daily Anchors Category Group */}
            {(activeAnchors.length > 0 || completedAnchors.length > 0) && (
              <div>
                <div className={styles.categoryGroupHeader}>
                  <span>⚓ Daily Anchors</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {activeAnchors.map((routine) => {
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
                        onUpdate={updateRoutine}
                      />
                    );
                  })}
                </div>

                {completedAnchors.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                    <div className={styles.sectionDivider}>Completed Daily Anchors</div>
                    {completedAnchors.map((routine) => {
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
                          onUpdate={updateRoutine}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Scheduled Focus Category Group */}
            {(activeScheduled.length > 0 || completedScheduled.length > 0) && (
              <div style={{ marginTop: '16px' }}>
                <div className={styles.categoryGroupHeader}>
                  <span>🎯 Scheduled Focus</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {activeScheduled.map((routine) => {
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
                        onUpdate={updateRoutine}
                      />
                    );
                  })}
                </div>

                {completedScheduled.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                    <div className={styles.sectionDivider}>Completed Scheduled Focus</div>
                    {completedScheduled.map((routine) => {
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
                          onUpdate={updateRoutine}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {routines.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            No routines created yet. Click &quot;Create New Routine&quot; above to begin!
          </div>
        )}

        {routinesScheduledForOtherDays.length > 0 && (
          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <button
              onClick={() => setShowOtherDays(!showOtherDays)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '8px 0',
              }}
            >
              {showOtherDays ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              Other Days&apos; Habits ({routinesScheduledForOtherDays.length})
            </button>

            {showOtherDays && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                {routinesScheduledForOtherDays.map((routine) => {
                  const { current, longest } = calculateStreak(routine.id);
                  const isCompleted = routineLogs.some((log) => log.routine_id === routine.id && log.completed_date === todayStr);
                  return (
                    <RoutineCard
                      key={routine.id}
                      routine={routine}
                      isCompleted={isCompleted}
                      todayStr={todayStr}
                      currentStreak={current}
                      longestStreak={longest}
                      onToggle={toggleRoutine}
                      onDelete={deleteRoutine}
                      onUpdate={updateRoutine}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
