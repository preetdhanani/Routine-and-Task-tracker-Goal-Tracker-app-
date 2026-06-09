'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import styles from './Dashboard.module.css';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import RoutinesSection from './RoutinesSection';
import TasksSection from './TasksSection';
import AnalyticsSection from './AnalyticsSection';
import AgentSection from './AgentSection';
import { Clock, Square, X, Sparkles } from 'lucide-react';

// Sub-component to handle ticking timer inside the floating widget
const FloatingTimerDisplay = ({ startedAt }: { startedAt: string }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, Math.round((Date.now() - new Date(startedAt).getTime()) / 1000));
      setSeconds(diff);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const format = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return [hrs, mins, secs].map((v) => String(v).padStart(2, '0')).join(':');
  };

  return <div className={styles.tickingTime}>{format(seconds)}</div>;
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('tasks');
  const { setOnline, activeTimer, tasks, stopTimer, discardTimer } = useStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [timerNote, setTimerNote] = useState('');

  // Listen to network status for robust local-first sync
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateOnlineStatus = () => {
      setOnline(window.navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    updateOnlineStatus();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [setOnline]);

  const renderActiveSection = () => {
    switch (activeTab) {
      case 'routines':
        return <RoutinesSection />;
      case 'tasks':
        return (
          <TasksSection 
            onStopTimer={() => {
              setTimerNote('');
              setShowStopModal(true);
            }} 
          />
        );
      case 'analytics':
        return <AnalyticsSection />;
      default:
        return (
          <TasksSection 
            onStopTimer={() => {
              setTimerNote('');
              setShowStopModal(true);
            }} 
          />
        );
    }
  };

  const handleStopClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid folding the widget back
    setTimerNote('');
    setShowStopModal(true);
  };

  const handleSaveTimerLog = () => {
    stopTimer(timerNote.trim());
    setShowStopModal(false);
    setIsExpanded(false);
  };

  const handleDiscardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to discard this timer session?')) {
      discardTimer();
      setIsExpanded(false);
    }
  };

  const activeTask = activeTimer ? tasks.find((t) => t.id === activeTimer.taskId) : null;

  const [isAiChatOpen, setIsAiChatOpen] = useState(false);

  return (
    <div className={styles.dashboardShell}>
      {/* Sidebar - Desktop & Tablet */}
      <div className={styles.sidebarWrapper}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        <div className={styles.tabContainer}>{renderActiveSection()}</div>
      </main>

      {/* Floating Sparkle Button (FAB) */}
      {!isAiChatOpen && (
        <button
          onClick={() => setIsAiChatOpen(true)}
          className={`${styles.floatingAiFab} ${activeTimer ? styles.fabWithTimer : ''}`}
          title="Open AI Q&A Assistant"
        >
          <Sparkles size={24} />
        </button>
      )}

      {/* AI Q&A Assistant Modal Overlay */}
      {isAiChatOpen && (
        <AgentSection onClose={() => setIsAiChatOpen(false)} />
      )}

      {/* Persistent Floating Timer Widget HUD */}
      {activeTimer && activeTask && (
        <div className={styles.floatingTimer}>
          {!isExpanded ? (
            <button
              onClick={() => setIsExpanded(true)}
              className={`${styles.floatingIcon} animate-pulse-glow`}
              title={`Timer running: ${activeTask.title}. Click to expand.`}
            >
              <Clock size={24} className="animate-spin" style={{ animationDuration: '6s' }} />
            </button>
          ) : (
            <div className={styles.floatingTimerExpanded}>
              <div className={styles.expandedHeader}>
                <span className={styles.taskTitle}>{activeTask.title}</span>
                <button
                  onClick={() => setIsExpanded(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>

              <FloatingTimerDisplay startedAt={activeTimer.startedAt} />

              <div className={styles.actionRow}>
                <button onClick={handleStopClick} className={styles.btnStop}>
                  <Square size={14} fill="currentColor" />
                  Stop & Log
                </button>
                <button onClick={handleDiscardClick} className={styles.btnDiscard}>
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stop Timer Description Modal Overlay */}
      {showStopModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: 'var(--radius-md)',
              width: '100%',
              maxWidth: '420px',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Save Time Log
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              What did you work on during this tracked session for <strong>{activeTask?.title}</strong>?
            </p>
            <input
              type="text"
              placeholder="e.g. Wrote database sync tests"
              value={timerNote}
              onChange={(e) => setTimerNote(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-strong)',
                fontSize: '14px',
              }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTimerLog();
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button
                onClick={() => setShowStopModal(false)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'var(--bg-sidebar)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTimerLog}
                style={{
                  padding: '10px 16px',
                  background: 'var(--grad-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                Save Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav - Mobile */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
