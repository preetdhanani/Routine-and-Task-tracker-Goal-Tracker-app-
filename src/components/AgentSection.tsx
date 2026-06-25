'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../store/useStore';
import styles from './AgentSection.module.css';
import { Send, Sparkles, Check, Cpu, X, Plus, Trash, Settings, Key, AlertCircle, ChevronDown, ChevronUp, Brain } from 'lucide-react';

interface AgentSectionProps {
  onClose: () => void;
}

export default function AgentSection({ onClose }: AgentSectionProps) {
  const {
    // Chat states & actions from Zustand
    chatThreads,
    activeThreadId,
    createNewThread,
    deleteThread,
    setActiveThreadId,
    isAiResponding,
    cancelAgentMessage,
    aiFeedback,
    clearAiFeedback,
    sendAgentMessage,
    selectedModel,
    setSelectedModel,
  } = useStore();

  const [inputText, setInputText] = useState('');
  const [isFeedbackExpanded, setIsFeedbackExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Local state for API Key
  const [apiKey, setApiKey] = useState('');
  
  const [showTokenModal, setShowTokenModal] = useState(false);

  // Stats filter thread ID state
  const [statsFilterId, setStatsFilterId] = useState<string>('total');

  // Local state to track expanded thought processes (message ID -> boolean)
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const [expandedFeedbacks, setExpandedFeedbacks] = useState<Record<string, boolean>>({});

  // Dynamic thinking phase state during loading
  const [thinkingPhase, setThinkingPhase] = useState('Routing request...');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cycle thinking phases in UI while waiting for response
  useEffect(() => {
    if (!isAiResponding) return;
    
    const phases = [
      'Routing request to dispatcher...',
      'Consulting specialized agents...',
      'Analyzing task dependency states...',
      'Evaluating consistency & streaks...',
      'Structuring output JSON rules...',
      'Generating final response...'
    ];
    let currentIndex = 0;
    
    const timeout = setTimeout(() => {
      setThinkingPhase(phases[0]);
    }, 0);
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % phases.length;
      setThinkingPhase(phases[currentIndex]);
    }, 1800);
    
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [isAiResponding]);

  const toggleThought = (msgId: string) => {
    setExpandedThoughts(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const toggleFeedback = (msgId: string) => {
    setExpandedFeedbacks(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  // Auto-dismiss global feedback banner after 6 seconds to prevent screen clutter
  useEffect(() => {
    if (aiFeedback.length > 0) {
      const timer = setTimeout(() => {
        clearAiFeedback();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [aiFeedback, clearAiFeedback]);

  useEffect(() => {
    const savedKey = localStorage.getItem('goal_tracker_gemini_key') || '';
    const envKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    Promise.resolve().then(() => {
      setApiKey(savedKey || envKey);
      
      // Direct first-time users to Settings if API key is missing
      if (!savedKey && !envKey) {
        setShowSettings(true);
      }
    });
  }, []);

  // Listen for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Clear feedback on unmount
  useEffect(() => {
    return () => {
      clearAiFeedback();
    };
  }, [clearAiFeedback]);

  // Find currently active thread, fallback to first thread
  const activeThread = chatThreads.find((t) => t.id === activeThreadId) || chatThreads[0];
  const messages = useMemo(() => activeThread?.messages || [], [activeThread]);

  // Scroll to bottom when messages list changes, AI responding state switches, or active thread switches
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiResponding, activeThreadId]);

  // Compute accumulated token usage for the active thread on render
  const tokenUsage = (() => {
    if (!activeThread?.messages) return null;
    let input = 0;
    let output = 0;
    let reasoning = 0;
    let total = 0;
    let hasUsage = false;

    activeThread.messages.forEach((msg) => {
      if (msg.tokenUsage) {
        input += msg.tokenUsage.input;
        output += msg.tokenUsage.output;
        reasoning += msg.tokenUsage.reasoning;
        total += msg.tokenUsage.total;
        hasUsage = true;
      }
    });

    return hasUsage ? { input, output, reasoning, total } : null;
  })();

  const handleSaveKey = () => {
    localStorage.setItem('goal_tracker_gemini_key', apiKey.trim());
    alert('Gemini API Key saved successfully.');
    if (apiKey.trim()) {
      setShowSettings(false); // Return to chat once configured
    }
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    // Check if key is configured
    if (!apiKey.trim()) {
      alert('Please enter a Gemini API Key first in Settings.');
      setShowSettings(true);
      return;
    }

    setInputText('');
    await sendAgentMessage(textToSend, apiKey.trim());
  };

  const handleDeleteThread = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting the thread we are deleting
    if (confirm('Are you sure you want to delete this chat thread?')) {
      deleteThread(id);
    }
  };

  // Helper to format large numbers
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  // Calculate token usage statistics
  const calculateTokenUsage = () => {
    let input = 0;
    let output = 0;
    let reasoning = 0;
    let total = 0;

    if (statsFilterId === 'total') {
      // Aggregate across all threads
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
    } else {
      // Specific thread only
      const targetThread = chatThreads.find((t) => t.id === statsFilterId);
      if (targetThread) {
        targetThread.messages.forEach((msg) => {
          if (msg.tokenUsage) {
            input += msg.tokenUsage.input;
            output += msg.tokenUsage.output;
            reasoning += msg.tokenUsage.reasoning;
            total += msg.tokenUsage.total;
          }
        });
      }
    }

    return { input, output, reasoning, total };
  };

  const currentStats = calculateTokenUsage();

  return (
    <div className={styles.modalBackdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modalBox} animate-scale-in`}>
        
        {/* Modal Header */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h2 className={styles.title}>
              <Sparkles size={20} className={styles.headerSparkle} />
              {showSettings ? 'AI Settings & Token Usage' : 'AI Assistant Q&A'}
            </h2>
            <p className={styles.subtitle}>
              {showSettings 
                ? 'Configure API keys and monitor your usage statistics.' 
                : 'Ask about your progress, sync tasks, or dictate routines in plain language.'}
            </p>
          </div>
          <div className={styles.headerActions}>
            <button onClick={onClose} className={styles.closeBtn} title="Close AI Overlay">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Action triggers feedback */}
        {aiFeedback.length > 0 && !showSettings && (
          <div className={styles.feedbackAccordion}>
            <div className={styles.feedbackHeader} onClick={() => setIsFeedbackExpanded(!isFeedbackExpanded)}>
              <Check size={14} style={{ color: 'var(--color-success)', marginRight: '8px', flexShrink: 0 }} />
              <span className={styles.feedbackTitle}>
                {aiFeedback.length} action{aiFeedback.length > 1 ? 's' : ''} applied successfully
              </span>
              <span className={styles.feedbackExpandTrigger}>
                {isFeedbackExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  clearAiFeedback();
                }} 
                className={styles.feedbackCloseBtn}
                title="Dismiss feedback"
              >
                <X size={14} />
              </button>
            </div>
            {isFeedbackExpanded && (
              <div className={styles.feedbackContent}>
                {aiFeedback.map((f, idx) => (
                  <div key={idx} className={styles.feedbackItem}>
                    • {f}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chat panel with Double Column Layout */}
        <div className={styles.chatPanel}>
          
          {/* Left Sidebar of Threads */}
          <div className={styles.threadsSidebar}>
            <div className={styles.sidebarHeader}>
              <button 
                onClick={() => {
                  setShowSettings(false);
                  createNewThread();
                }} 
                className={styles.newThreadBtn}
              >
                <Plus size={14} />
                New Chat
              </button>
            </div>
            
            <div className={styles.threadsList}>
              {chatThreads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => {
                    setShowSettings(false);
                    setActiveThreadId(thread.id);
                  }}
                  className={`${styles.threadItem} ${thread.id === activeThread.id && !showSettings ? styles.threadActive : ''}`}
                >
                  <span className={styles.threadTitle} title={thread.title}>
                    {thread.title}
                  </span>
                  <button
                    onClick={(e) => handleDeleteThread(thread.id, e)}
                    className={styles.threadDeleteBtn}
                    title="Delete chat thread"
                  >
                    <Trash size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* Sidebar Footer - Settings button */}
            <div className={styles.sidebarFooter}>
              <button
                onClick={() => setShowSettings(true)}
                className={`${styles.settingsBtn} ${showSettings ? styles.settingsBtnActive : ''}`}
              >
                <Settings size={14} />
                AI Settings & Usage
              </button>
            </div>
          </div>

          {/* Right main workspace (Chat OR Settings) */}
          <div className={styles.chatMain}>
            
            {showSettings ? (
              /* Settings & Usage Workspace */
              <div className={styles.settingsWorkspace}>
                
                {/* 1. Gemini Key Setup */}
                <div className={`${styles.settingsSection} glass-panel`}>
                  <div className={styles.sectionTitle}>
                    <Key size={16} />
                    Gemini API Setup
                  </div>
                  <p className={styles.sectionDesc}>
                    Enter your Gemini API key to activate the Q&A features and habit/task automations.
                  </p>
                  
                  {/* Status Indicator */}
                  <div className={styles.statusRow}>
                    <span className={styles.statusLabel}>Service Status:</span>
                    {apiKey.trim() ? (
                      <span className={styles.statusActive}>
                        <Check size={12} /> Gemini API Active
                      </span>
                    ) : (
                      <span className={styles.statusMissing}>
                        <AlertCircle size={12} /> Key Required
                      </span>
                    )}
                  </div>

                  <div className={styles.keyConfigInputRow}>
                    <input
                      type="password"
                      placeholder={apiKey.trim() ? "••••••••••••••••••••••••" : "AIzaSy..."}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className={styles.input}
                    />
                    <button onClick={handleSaveKey} className={styles.saveBtn}>
                      Save Key
                    </button>
                  </div>
                </div>

                {/* 2. Token Usage Statistics with Filter */}
                <div className={`${styles.settingsSection} glass-panel`}>
                  <div className={styles.sectionTitleHeader}>
                    <div className={styles.sectionTitle}>
                      <Cpu size={16} />
                      Token Usage Analytics
                    </div>
                    
                    {/* Filter Dropdown */}
                    <div className={styles.filterDropdownRow}>
                      <span className={styles.filterLabel}>Filter:</span>
                      <select 
                        value={statsFilterId} 
                        onChange={(e) => setStatsFilterId(e.target.value)}
                        className={styles.filterSelect}
                      >
                        <option value="total">Total (All Chats)</option>
                        {chatThreads.map(t => (
                          <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <p className={styles.sectionDesc}>
                    Track your request/response size and reasoning workload. Useful for developer audit and quota checks.
                  </p>

                  <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                      <span className={styles.statCardLabel}>Prompt (Input)</span>
                      <strong className={styles.statCardValue}>{formatNumber(currentStats.input)}</strong>
                      <span className={styles.statCardDesc}>Tokens sent to model</span>
                    </div>

                    <div className={styles.statCard}>
                      <span className={styles.statCardLabel}>Completion (Output)</span>
                      <strong className={styles.statCardValue}>{formatNumber(currentStats.output)}</strong>
                      <span className={styles.statCardDesc}>Tokens returned by model</span>
                    </div>

                    <div className={styles.statCard}>
                      <span className={styles.statCardLabel}>Reasoning (Thinking)</span>
                      <strong className={styles.statCardValue} style={{ color: 'var(--color-primary)' }}>{formatNumber(currentStats.reasoning)}</strong>
                      <span className={styles.statCardDesc}>Internal thoughts process</span>
                    </div>

                    <div className={styles.statCard} style={{ background: 'rgba(99, 102, 241, 0.03)', borderColor: 'rgba(99, 102, 241, 0.15)' }}>
                      <span className={styles.statCardLabel} style={{ fontWeight: 800 }}>Combined Total</span>
                      <strong className={styles.statCardValue}>{formatNumber(currentStats.total)}</strong>
                      <span className={styles.statCardDesc}>Total quota consumption</span>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* Chat Conversation Workspace */
              <>
                {/* Mobile thread selection dropdown */}
                <div className={styles.mobileThreadArea}>
                  <select
                    value={activeThread.id}
                    onChange={(e) => setActiveThreadId(e.target.value)}
                    className={styles.mobileSelect}
                  >
                    {chatThreads.map((thread) => (
                      <option key={thread.id} value={thread.id}>
                        {thread.title}
                      </option>
                    ))}
                  </select>
                  <div className={styles.mobileActionRow}>
                    <button onClick={createNewThread} className={styles.mobileBtn} title="New Chat">
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => setShowSettings(true)}
                      className={styles.mobileBtn}
                      title="Settings"
                    >
                      <Settings size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteThread(activeThread.id, e)}
                      className={styles.mobileBtn}
                      title="Delete Chat"
                      style={{ color: 'var(--color-danger)' }}
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>

                {/* Floating Token Usage Badge */}
                {tokenUsage && (
                  <button
                    onClick={() => setShowTokenModal(true)}
                    className={styles.tokenBtn}
                    title="Show accumulated token usage statistics for this chat"
                  >
                    <Cpu size={16} />
                  </button>
                )}

                {/* Messages list - Notion Styled Natural Conversation flow */}
                <div className={styles.messagesList}>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`${styles.naturalMessageRow} ${msg.sender === 'user' ? styles.naturalUserRow : styles.naturalAgentRow}`}
                    >
                      <div className={msg.sender === 'user' ? styles.avatarUser : styles.avatarAgent}>
                        {msg.sender === 'user' ? 'U' : <Sparkles size={14} />}
                      </div>
                      <div className={styles.messageContent}>
                        <div className={styles.messageHeader}>
                          <span className={styles.senderName}>
                            {msg.sender === 'user' ? 'You' : 'AI Assistant'}
                          </span>
                          {msg.model && (
                            <span className={styles.messageModelTag}>
                              {msg.model}
                            </span>
                          )}
                          <span className={styles.messageTime}>
                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </span>
                        </div>
                        {msg.thinking && (
                          <div className={styles.thoughtAccordion}>
                            <button
                              onClick={() => toggleThought(msg.id)}
                              className={styles.thoughtHeader}
                            >
                              <Brain size={12} className={styles.thoughtBrainIcon} />
                              <span className={styles.thoughtHeaderText}>Thought Process</span>
                              {expandedThoughts[msg.id] ? (
                                <ChevronUp size={12} className={styles.thoughtChevron} />
                              ) : (
                                <ChevronDown size={12} className={styles.thoughtChevron} />
                              )}
                            </button>
                            {expandedThoughts[msg.id] && (
                              <div className={styles.thoughtContent}>
                                {msg.thinking}
                              </div>
                            )}
                          </div>
                        )}
                        {msg.feedback && msg.feedback.length > 0 && (
                          <div className={styles.thoughtAccordion} style={{ borderLeftColor: 'var(--color-success)' }}>
                            <button
                              onClick={() => toggleFeedback(msg.id)}
                              className={styles.thoughtHeader}
                              style={{ color: 'var(--color-success)' }}
                            >
                              <Check size={12} className={styles.thoughtBrainIcon} style={{ color: 'var(--color-success)' }} />
                              <span className={styles.thoughtHeaderText}>Actions Applied ({msg.feedback.length})</span>
                              {expandedFeedbacks[msg.id] ? (
                                <ChevronUp size={12} className={styles.thoughtChevron} style={{ color: 'var(--color-success)' }} />
                              ) : (
                                <ChevronDown size={12} className={styles.thoughtChevron} style={{ color: 'var(--color-success)' }} />
                              )}
                            </button>
                            {expandedFeedbacks[msg.id] && (
                              <div className={styles.thoughtContent} style={{ borderColor: 'rgba(16, 185, 129, 0.2)', backgroundColor: 'rgba(16, 185, 129, 0.03)', fontStyle: 'normal' }}>
                                {msg.feedback.map((f, fIdx) => (
                                  <div key={fIdx} style={{ fontSize: '11px', color: 'var(--color-success)', marginBottom: '4px' }}>
                                    • {f}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        <div className={styles.messageText}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Shimmer/Pulse Thinking animation */}
                  {isAiResponding && (
                    <div className={`${styles.naturalMessageRow} ${styles.naturalAgentRow}`}>
                      <div className={styles.avatarAgent}>
                        <Sparkles size={14} />
                      </div>
                      <div className={styles.messageContent} style={{ width: '100%' }}>
                        <div className={styles.messageHeader}>
                          <span className={styles.senderName}>AI Assistant</span>
                          <span className={styles.messageTime}>Just now</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
                          <div className={styles.thinkingContainer}>
                            <div className={styles.thinkingSparkle}>
                              <Sparkles size={14} className={styles.rotatingSparkle} />
                            </div>
                            <span className={styles.thinkingText}>{thinkingPhase}</span>
                          </div>
                          <button
                            onClick={cancelAgentMessage}
                            className={styles.cancelRequestBtn}
                            title="Cancel AI request"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Suggestion Chips */}
                <div className={styles.chipsRow}>
                  <button onClick={() => handleSend('Add a fitness routine: 20 pushups')} className={styles.chip}>
                    + Habit: 20 Pushups
                  </button>
                  <button onClick={() => handleSend('Create task: Write database queries')} className={styles.chip}>
                    + Task: Database queries
                  </button>
                  <button onClick={() => handleSend('How much time did I track today?')} className={styles.chip}>
                    Time tracked today?
                  </button>
                  <button onClick={() => handleSend('Summary of my daily habits completion rate')} className={styles.chip}>
                    Habits completion rate?
                  </button>
                </div>

                {/* Input Bar */}
                <div className={styles.inputPanel}>
                  <input
                    type="text"
                    placeholder={apiKey.trim() ? "Ask me anything, or create a task/habit..." : "Configure Gemini key in Settings to begin chatting..."}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSend(inputText);
                    }}
                    className={styles.chatInput}
                    disabled={isAiResponding || !apiKey.trim()}
                  />
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className={styles.modelSelector}
                    disabled={isAiResponding || !apiKey.trim()}
                    title="Select AI Model"
                  >
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                    <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                    <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  </select>
                  {isAiResponding ? (
                    <button
                      onClick={cancelAgentMessage}
                      className={styles.cancelInputBtn}
                      title="Cancel AI request"
                    >
                      <X size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSend(inputText)}
                      className={styles.sendBtn}
                      disabled={!inputText.trim() || !apiKey.trim()}
                    >
                      <Send size={18} />
                    </button>
                  )}
                </div>
              </>
            )}

          </div>

        </div>

      </div>

      {/* Token Usage Modal Overlay Popup */}
      {showTokenModal && tokenUsage && (
        <div className={styles.tokenOverlay} onClick={(e) => e.target === e.currentTarget && setShowTokenModal(false)}>
          <div className={styles.tokenModalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 className={styles.modalTitle}>Chat Token Usage</h3>
              <button
                onClick={() => setShowTokenModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Accumulated usage metrics for this chat thread.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Input (Prompt) Tokens:</span>
                <strong style={{ fontFamily: 'monospace' }}>{tokenUsage.input}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Output (Response) Tokens:</span>
                <strong style={{ fontFamily: 'monospace' }}>{tokenUsage.output}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Reasoning (Thinking) Tokens:</span>
                <strong style={{ fontFamily: 'monospace', color: 'var(--color-primary)' }}>{tokenUsage.reasoning}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', paddingTop: '6px' }}>
                <span>Total Tokens:</span>
                <strong style={{ fontFamily: 'monospace' }}>{tokenUsage.total}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setShowTokenModal(false)} className={styles.saveBtn} style={{ width: 'auto', padding: '8px 16px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
