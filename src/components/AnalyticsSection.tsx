'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import styles from './AnalyticsSection.module.css';
import { Clock, Trash2 } from 'lucide-react';

// SVG Progress Ring Component
interface ProgressRingProps {
  percentage: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}

const ProgressRing = ({ percentage, color, size = 64, strokeWidth = 6 }: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <div className={styles.ringWrapper}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="var(--border-subtle)"
          strokeWidth={strokeWidth}
        />
        {/* Foreground fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          fontSize: '12px',
          fontWeight: 800,
          color: 'var(--text-primary)',
        }}
      >
        {percentage}%
      </div>
    </div>
  );
};

export default function AnalyticsSection() {
  const { tasks, routines, routineLogs, taskTimeLogs, deleteTimeLog } = useStore();
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d'>('7d');

  // Helper: Get local YYYY-MM-DD
  const getLocalDateString = (daysAgo = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toLocaleDateString('sv');
  };

  const todayStr = getLocalDateString(0);

  // Stable timestamps on component mount to satisfy linter purity rules
  const [nowMs] = useState(() => Date.now());
  const [todayStart] = useState(() => new Date().setHours(0, 0, 0, 0));

  // --- Filter logs based on date range selection ---
  const filteredTimeLogs = useMemo(() => {
    return taskTimeLogs.filter((log) => {
      const logTime = new Date(log.started_at).getTime();
      if (timeRange === 'today') {
        return logTime >= todayStart;
      }
      if (timeRange === '7d') {
        const sevenDaysStart = nowMs - 7 * 24 * 60 * 60 * 1000;
        return logTime >= sevenDaysStart;
      }
      // 30d
      const thirtyDaysStart = nowMs - 30 * 24 * 60 * 60 * 1000;
      return logTime >= thirtyDaysStart;
    });
  }, [taskTimeLogs, timeRange, nowMs, todayStart]);

  // --- Calculations ---

  // 1. Total Hours Tracked (Filtered)
  const totalSeconds = filteredTimeLogs.reduce((sum, log) => sum + log.duration_seconds, 0);
  const totalHoursStr = (totalSeconds / 3600).toFixed(1);

  // 2. Habit Compliance (Filtered)
  const activeRoutines = routines.filter((r) => r.is_active);
  let routinePct = 0;
  let complianceLabel = '';

  if (activeRoutines.length > 0) {
    if (timeRange === 'today') {
      const completedToday = routineLogs.filter(
        (log) => log.completed_date === todayStr && activeRoutines.some((r) => r.id === log.routine_id)
      ).length;
      routinePct = Math.round((completedToday / activeRoutines.length) * 100);
      complianceLabel = `${completedToday}/${activeRoutines.length} completed today`;
    } else {
      // Average completion rate over 7 or 30 days
      const daysCount = timeRange === '7d' ? 7 : 30;
      const totalPossibleCompletions = activeRoutines.length * daysCount;
      let completionsInRange = 0;

      for (let i = 0; i < daysCount; i++) {
        const dateStr = getLocalDateString(i);
        completionsInRange += routineLogs.filter(
          (log) => log.completed_date === dateStr && activeRoutines.some((r) => r.id === log.routine_id)
        ).length;
      }

      routinePct = Math.round((completionsInRange / totalPossibleCompletions) * 100);
      complianceLabel = `${completionsInRange}/${totalPossibleCompletions} completions`;
    }
  }

  // 3. Task Completion Rate
  const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
  const taskPct = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  // --- Segmented Task Distribution Calculations ---
  const getSegmentedData = () => {
    const taskTimeMap: Record<string, number> = {};
    filteredTimeLogs.forEach((log) => {
      taskTimeMap[log.task_id] = (taskTimeMap[log.task_id] || 0) + log.duration_seconds;
    });

    const segments = Object.entries(taskTimeMap).map(([taskId, seconds]) => {
      const task = tasks.find((t) => t.id === taskId);
      return {
        taskId,
        title: task ? task.title : 'Deleted Task',
        seconds,
      };
    });

    // Sort descending
    segments.sort((a, b) => b.seconds - a.seconds);

    // Group items after top 3 into "Others"
    if (segments.length > 3) {
      const top3 = segments.slice(0, 3);
      const othersSecs = segments.slice(3).reduce((sum, s) => sum + s.seconds, 0);
      top3.push({
        taskId: 'others',
        title: 'Others',
        seconds: othersSecs,
      });
      return top3;
    }

    return segments;
  };

  const segments = getSegmentedData();
  const segmentColors = ['var(--color-primary)', 'var(--color-success)', 'var(--color-info)', 'var(--color-warning)'];

  // Add percentage metrics to segments
  const formattedSegments = segments.map((seg, idx) => {
    const pct = totalSeconds > 0 ? Math.round((seg.seconds / totalSeconds) * 100) : 0;
    return {
      ...seg,
      pct,
      color: segmentColors[idx % segmentColors.length],
    };
  });

  // --- Bar Chart Data ---
  const getTaskChartData = () => {
    const taskHoursMap: Record<string, number> = {};
    filteredTimeLogs.forEach((log) => {
      taskHoursMap[log.task_id] = (taskHoursMap[log.task_id] || 0) + log.duration_seconds;
    });

    const chartData = Object.entries(taskHoursMap).map(([taskId, seconds]) => {
      const task = tasks.find((t) => t.id === taskId);
      return {
        title: task ? task.title : 'Deleted Task',
        hours: seconds / 3600,
        seconds,
      };
    });

    chartData.sort((a, b) => b.seconds - a.seconds);
    const maxSeconds = chartData.length > 0 ? chartData[0].seconds : 0;

    return chartData.slice(0, 4).map((item) => ({
      ...item,
      pctWidth: maxSeconds > 0 ? (item.seconds / maxSeconds) * 100 : 0,
    }));
  };

  const chartData = getTaskChartData();

  // Format seconds -> HH:MM:SS
  const formatDuration = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return [hrs, mins, secs].map((v) => String(v).padStart(2, '0')).join(':');
  };

  // Format date/time
  const formatTimestamp = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className={`${styles.container} animate-fade-in`}>
      {/* Header and Filter Pills */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>Analytics & Logs</h2>
          <p className={styles.subtitle}>Review metrics, check durations, and filter logged sessions.</p>
        </div>

        <div className={styles.filterPills}>
          <button
            onClick={() => setTimeRange('today')}
            className={`${styles.filterPill} ${timeRange === 'today' ? styles.activeFilterPill : ''}`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeRange('7d')}
            className={`${styles.filterPill} ${timeRange === '7d' ? styles.activeFilterPill : ''}`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`${styles.filterPill} ${timeRange === '30d' ? styles.activeFilterPill : ''}`}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* Stats Widgets with SVG progress rings */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} glass-panel`}>
          <div className={styles.statMeta}>
            <div className={styles.statLabel}>Tracked Time</div>
            <div className={styles.statValue}>{totalHoursStr} hrs</div>
            <div className={styles.statSubtext}>Logged time in selected range</div>
          </div>
          <div className={styles.ringWrapper}>
            <Clock size={28} style={{ color: 'var(--color-primary)' }} />
          </div>
        </div>

        <div className={`${styles.statCard} glass-panel`}>
          <div className={styles.statMeta}>
            <div className={styles.statLabel}>Habit Consistency</div>
            <div className={styles.statValue}>{routinePct}%</div>
            <div className={styles.statSubtext}>{complianceLabel}</div>
          </div>
          <ProgressRing percentage={routinePct} color="var(--color-success)" />
        </div>

        <div className={`${styles.statCard} glass-panel`}>
          <div className={styles.statMeta}>
            <div className={styles.statLabel}>Tasks Completed</div>
            <div className={styles.statValue}>{taskPct}%</div>
            <div className={styles.statSubtext}>
              {completedTasksCount}/{tasks.length} tasks finished overall
            </div>
          </div>
          <ProgressRing percentage={taskPct} color="var(--color-primary)" />
        </div>
      </div>

      {/* Segmented Task Distribution Bar Chart */}
      {formattedSegments.length > 0 && (
        <div className={`${styles.segmentedCard} glass-panel`}>
          <h3 className={styles.cardTitle}>Tracked Time Distribution</h3>
          
          {/* Combined segment bar */}
          <div className={styles.segmentedBar}>
            {formattedSegments.map((seg) => (
              <div
                key={seg.taskId}
                className={styles.barSegment}
                style={{
                  width: `${seg.pct}%`,
                  backgroundColor: seg.color,
                }}
                title={`${seg.title}: ${seg.pct}%`}
              />
            ))}
          </div>

          {/* Color coded legends */}
          <div className={styles.legendGrid}>
            {formattedSegments.map((seg) => (
              <div key={seg.taskId} className={styles.legendItem}>
                <div className={styles.legendColor} style={{ backgroundColor: seg.color }} />
                <span className={styles.legendText} title={seg.title}>
                  <strong>{seg.pct}%</strong> {seg.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.chartsSection}>
        {/* CSS Bar Chart */}
        {chartData.length > 0 ? (
          <div className={`${styles.chartCard} glass-panel`}>
            <h3 className={styles.cardTitle}>Time Spent by Task (Top 4)</h3>
            <div className={styles.chartContainer}>
              {chartData.map((item, idx) => (
                <div key={idx} className={styles.chartRow}>
                  <div className={styles.chartLabelRow}>
                    <span className={styles.taskName}>{item.title}</span>
                    <span className={styles.taskHours}>{item.hours.toFixed(2)}h</span>
                  </div>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: `${item.pctWidth}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`${styles.chartCard} glass-panel`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No task hours logged in this range.</span>
          </div>
        )}

        {/* Time Logs Table */}
        <div className={`${styles.logsCard} glass-panel`}>
          <h3 className={styles.cardTitle}>Time Logs History ({filteredTimeLogs.length})</h3>
          
          <div className={styles.logsList}>
            {filteredTimeLogs.map((log) => {
              const task = tasks.find((t) => t.id === log.task_id);
              return (
                <div key={log.id} className={styles.logItem}>
                  <div className={styles.logLeft}>
                    <div className={styles.logTaskTitle}>{task ? task.title : 'Deleted Task'}</div>
                    <div className={styles.logNote}>
                      {log.description || <em>No details provided</em>}
                    </div>
                  </div>

                  <div className={styles.logRight}>
                    <span className={styles.logDate}>{formatTimestamp(log.started_at)}</span>
                    <span className={styles.logDuration}>{formatDuration(log.duration_seconds)}</span>
                    <button
                      onClick={() => deleteTimeLog(log.id)}
                      className={styles.deleteBtn}
                      title="Delete log entry"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredTimeLogs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', width: '100%' }}>
                No time logs recorded for this period.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
