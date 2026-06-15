'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import styles from './SettingsSection.module.css';
import { Settings, Key, Cpu, Check, Eye, EyeOff, Sparkles, Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function SettingsSection() {
  const {
    lifestyleMode,
    setLifestyleMode,
    selectedModel,
    setSelectedModel,
    chatThreads,
  } = useStore();
  const { theme, toggleTheme } = useTheme();

  const [activeSubTab, setActiveSubTab] = useState<'habits' | 'ai' | 'usage'>('habits');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load API Key on mount using microtask deferral to prevent cascading render warnings
  useEffect(() => {
    const savedKey = localStorage.getItem('goal_tracker_gemini_key') || '';
    Promise.resolve().then(() => {
      setApiKey(savedKey);
    });
  }, []);

  const handleSaveKey = () => {
    localStorage.setItem('goal_tracker_gemini_key', apiKey.trim());
    showStatus('Gemini API Key saved successfully.', 'success');
  };

  const showStatus = (text: string, type: 'success' | 'error') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 3000);
  };

  // Aggregated Token Usage
  const tokenStats = (() => {
    let input = 0;
    let output = 0;
    let reasoning = 0;
    let total = 0;

    chatThreads.forEach((thread) => {
      thread.messages.forEach((msg) => {
        if (msg.tokenUsage) {
          input += msg.tokenUsage.input;
          output += msg.tokenUsage.output;
          reasoning += msg.tokenUsage.reasoning;
          total += msg.tokenUsage.total;
        }
      });
    });

    return { input, output, reasoning, total };
  })();

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>System Settings</h2>
        <p className={styles.subtitle}>Configure layout modes, API credentials, and monitor AI statistics.</p>
      </div>

      {statusMessage && (
        <div className={styles.statusBanner}>
          <Check size={16} />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Inner tabs selector */}
      <div className={styles.settingsTabs}>
        <button
          type="button"
          onClick={() => setActiveSubTab('habits')}
          className={`${styles.settingsTab} ${activeSubTab === 'habits' ? styles.settingsTabActive : ''}`}
        >
          <Settings size={16} />
          Habit Style
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('ai')}
          className={`${styles.settingsTab} ${activeSubTab === 'ai' ? styles.settingsTabActive : ''}`}
        >
          <Sparkles size={16} />
          AI Assistant
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('usage')}
          className={`${styles.settingsTab} ${activeSubTab === 'usage' ? styles.settingsTabActive : ''}`}
        >
          <Cpu size={16} />
          Usage Analytics
        </button>
      </div>

      {/* Tab content sections */}
      {activeSubTab === 'habits' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className={styles.settingsCard}>
            <div className={styles.cardTitle}>
              <Settings size={18} style={{ color: 'var(--color-primary)' }} />
              <span>Habit Tracker Mode</span>
            </div>
            <p className={styles.cardDesc}>
              Toggle between Steady (Consistent daily checklist) and Dynamic (Adaptive weekly scheduled focus) routine styles.
            </p>

            <div className={styles.modeGrid}>
              <div
                className={`${styles.modeOption} ${lifestyleMode === 'steady' ? styles.modeOptionActive : ''}`}
                onClick={() => {
                  setLifestyleMode('steady');
                  showStatus('Switched to Steady Routine Mode.', 'success');
                }}
              >
                <div className={styles.modeHeader}>
                  <span className={styles.modeLabel}>Steady Routine</span>
                  {lifestyleMode === 'steady' && <Check size={16} className={styles.activeCheck} />}
                </div>
                <p className={styles.modeDescription}>
                  Perfect for a fixed 9-to-5 schedule. Tracks habits daily in a single straightforward list to optimize streak counts.
                </p>
              </div>

              <div
                className={`${styles.modeOption} ${lifestyleMode === 'dynamic' ? styles.modeOptionActive : ''}`}
                onClick={() => {
                  setLifestyleMode('dynamic');
                  showStatus('Switched to Dynamic Routine Mode.', 'success');
                }}
              >
                <div className={styles.modeHeader}>
                  <span className={styles.modeLabel}>Dynamic Routine</span>
                  {lifestyleMode === 'dynamic' && <Check size={16} className={styles.activeCheck} />}
                </div>
                <p className={styles.modeDescription}>
                  Perfect for students or hybrid workers. Schedule habits on specific weekdays with flexible presets, splitting focus between daily anchors and scheduled goals.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.settingsCard}>
            <div className={styles.cardTitle}>
              {theme === 'light' ? <Sun size={18} style={{ color: 'var(--color-warning)' }} /> : <Moon size={18} style={{ color: 'var(--color-primary)' }} />}
              <span>App Appearance</span>
            </div>
            <p className={styles.cardDesc}>
              Select your visual theme preference. Dark mode is default.
            </p>
            <div className={styles.modeGrid}>
              <div
                className={`${styles.modeOption} ${theme === 'dark' ? styles.modeOptionActive : ''}`}
                onClick={() => {
                  if (theme === 'light') toggleTheme();
                }}
              >
                <div className={styles.modeHeader}>
                  <span className={styles.modeLabel}>Dark Theme</span>
                  {theme === 'dark' && <Check size={16} className={styles.activeCheck} />}
                </div>
                <p className={styles.modeDescription}>
                  Default dark aesthetic. Soft on the eyes, featuring deep violet highlights and subtle glowing panels.
                </p>
              </div>

              <div
                className={`${styles.modeOption} ${theme === 'light' ? styles.modeOptionActive : ''}`}
                onClick={() => {
                  if (theme === 'dark') toggleTheme();
                }}
              >
                <div className={styles.modeHeader}>
                  <span className={styles.modeLabel}>Light Theme</span>
                  {theme === 'light' && <Check size={16} className={styles.activeCheck} />}
                </div>
                <p className={styles.modeDescription}>
                  Clean, highly-scannable light gray canvas, offering a sharp aesthetic for brightly lit environments.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'ai' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* API Key */}
          <div className={styles.settingsCard}>
            <div className={styles.cardTitle}>
              <Key size={18} style={{ color: 'var(--color-warning)' }} />
              <span>Gemini API Setup</span>
            </div>
            <p className={styles.cardDesc}>
              Enter your Gemini API key to activate the Q&A features and habit/task automations.
            </p>

            <div className={styles.inputGroup}>
              <span className={styles.inputLabel}>Gemini API Key</span>
              <div className={styles.passwordInputWrapper}>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder={apiKey ? '••••••••••••••••••••••••' : 'AIzaSy...'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className={styles.inputField}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className={styles.saveBtn}
                  style={{ background: 'var(--bg-sidebar)', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)' }}
                  title={showApiKey ? 'Hide Key' : 'Show Key'}
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button onClick={handleSaveKey} className={styles.saveBtn}>
                  Save Key
                </button>
              </div>
            </div>
          </div>

          {/* Model selection */}
          <div className={styles.settingsCard}>
            <div className={styles.cardTitle}>
              <Sparkles size={18} style={{ color: 'var(--color-info)' }} />
              <span>AI Model Configuration</span>
            </div>
            <p className={styles.cardDesc}>
              Select which Gemini model powers your chat conversations and action dictate parser.
            </p>

            <div className={styles.inputGroup}>
              <span className={styles.inputLabel}>Selected Model</span>
              <select
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  showStatus(`Selected model updated to ${e.target.value}`, 'success');
                }}
                className={styles.selectField}
              >
                <option value="gemini-3.5-flash">Gemini 3.5 Flash (Recommended)</option>
                <option value="gemini-3.1-pro">Gemini 3.1 Pro (Complex Reasoning)</option>
                <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Fast & Cheap)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'usage' && (
        <div className={styles.settingsCard}>
          <div className={styles.cardTitle}>
            <Cpu size={18} style={{ color: 'var(--color-success)' }} />
            <span>Token Usage Analytics</span>
          </div>
          <p className={styles.cardDesc}>
            Monitor the size of your requests and reasoning counts generated during your chat sessions.
          </p>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Prompt (Input)</span>
              <strong className={styles.statValue}>{formatNumber(tokenStats.input)}</strong>
              <span className={styles.statDesc}>Tokens sent to model</span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>Completion (Output)</span>
              <strong className={styles.statValue}>{formatNumber(tokenStats.output)}</strong>
              <span className={styles.statDesc}>Tokens returned by model</span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>Reasoning (Thinking)</span>
              <strong className={styles.statValue} style={{ color: 'var(--color-primary)' }}>
                {formatNumber(tokenStats.reasoning)}
              </strong>
              <span className={styles.statDesc}>Reasoning workload</span>
            </div>

            <div className={styles.statCard} style={{ background: 'rgba(99, 102, 241, 0.03)', borderColor: 'rgba(99, 102, 241, 0.15)' }}>
              <span className={styles.statLabel} style={{ fontWeight: 800 }}>Combined Total</span>
              <strong className={styles.statValue}>{formatNumber(tokenStats.total)}</strong>
              <span className={styles.statDesc}>Combined total tokens</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
