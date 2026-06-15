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
import SettingsSection from './SettingsSection';
import { Sparkles } from 'lucide-react';
import { useTimer } from '../hooks/useTimer';

// Timer bar rendered at the top of the workspace when a timer is running
const TimerBar = ({
  taskTitle,
  startedAt,
  onStop,
  onDiscard,
}: {
  taskTitle: string;
  startedAt: string;
  onStop: (e: React.MouseEvent) => void;
  onDiscard: (e: React.MouseEvent) => void;
}) => {
  const { displayTime } = useTimer(new Date(startedAt).getTime());

  return (
    <div className={styles.timerBar}>
      <div className={styles.timerDot} />
      <span className={styles.timerTaskTitle}>{taskTitle}</span>
      <span className={styles.timerDisplay}>{displayTime}</span>
      <button onClick={onStop} className={styles.timerBtnStop}>
        Stop & Log
      </button>
      <button onClick={onDiscard} className={styles.timerBtnDiscard}>
        Discard
      </button>
    </div>
  );
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('tasks');
  const { setOnline, activeTimer, tasks, stopTimer, discardTimer } = useStore();

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
      case 'settings':
        return <SettingsSection />;
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
  };

  const handleDiscardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to discard this timer session?')) {
      discardTimer();
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

      {/* Workspace Area: Timer bar + main content */}
      <div className={styles.workspaceWrapper}>
        {activeTimer && activeTask && (
          <TimerBar
            taskTitle={activeTask.title}
            startedAt={activeTimer.startedAt}
            onStop={handleStopClick}
            onDiscard={handleDiscardClick}
          />
        )}
        <main className={styles.mainContent}>
          <div className={styles.tabContainer}>{renderActiveSection()}</div>
        </main>
      </div>

      {/* Floating Sparkle Button (FAB) */}
      {!isAiChatOpen && (
        <button
          onClick={() => setIsAiChatOpen(true)}
          className={styles.floatingAiFab}
          title="Open AI Q&A Assistant"
        >
          <Sparkles size={24} />
        </button>
      )}

      {/* AI Q&A Assistant Modal Overlay */}
      {isAiChatOpen && (
        <AgentSection onClose={() => setIsAiChatOpen(false)} />
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
