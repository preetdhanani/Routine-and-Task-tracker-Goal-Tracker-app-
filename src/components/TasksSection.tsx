'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useStore, Task } from '../store/useStore';
import styles from './TasksSection.module.css';
import { Play, Square, Plus, Trash2, Check, ChevronDown, ChevronUp, X } from 'lucide-react';

const dailyQuotes = [
  { text: "Karmanye vadhikaraste ma phaleshu kadachana (You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions.)", author: "Lord Krishna", book: "Bhagavad Gita / Mahabharata" },
  { text: "Utsaho balavan arya nastyutsahat param balam (Enthusiasm is all-powerful. There is no force greater than enthusiasm; for the enthusiastic, nothing is impossible.)", author: "Sage Valmiki", book: "Ramayana" },
  { text: "Uddhared atmanatmanam natmanam avasadayet (Elevate yourself by your own mind, do not degrade yourself. The mind can be your greatest friend or your worst enemy.)", author: "Lord Krishna", book: "Bhagavad Gita / Mahabharata" },
  { text: "Yogasthah kuru karmani sangam tyaktva dhananjaya (Perform your duty equipoised, abandoning all attachment to success or failure.)", author: "Lord Krishna", book: "Bhagavad Gita / Mahabharata" },
  { text: "Every action you take is a vote for the type of person you wish to become.", author: "James Clear", book: "Atomic Habits" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear", book: "Atomic Habits" },
  { text: "Focus on who you wish to become, not what you want to achieve.", author: "James Clear", book: "Atomic Habits" },
  { text: "Decide the type of person you want to be. Prove it to yourself with small wins.", author: "James Clear", book: "Atomic Habits" },
  { text: "If you want to master a habit, the key is to start with repetition, not perfection.", author: "James Clear", book: "Atomic Habits" },
  { text: "Professional writers write on schedule; amateurs write when they feel inspired.", author: "James Clear", book: "Atomic Habits" },
  { text: "Be the author of your identity, not just the reader of your circumstances.", author: "James Clear", book: "Atomic Habits" },
  { text: "Deep work is the ability to focus without distraction on a cognitively demanding task.", author: "Cal Newport", book: "Deep Work" },
  { text: "To produce at your peak level you need to work for extended periods with full concentration on a single task.", author: "Cal Newport", book: "Deep Work" },
  { text: "If you don't produce, you won't thrive—no matter how skilled or talented you are.", author: "Cal Newport", book: "Deep Work" },
  { text: "Who you are, what you think, feel, and do, what you love—is the sum of what you focus on.", author: "Cal Newport", book: "Deep Work" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant", book: "The Story of Philosophy" },
  { text: "You have power over your mind - not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius", book: "Meditations" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius", book: "Meditations" },
  { text: "At dawn, when you have trouble getting out of bed, tell yourself: 'I have to go to work — as a human being.'", author: "Marcus Aurelius", book: "Meditations" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker", book: "Management Tasks" },
  { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca", book: "On the Shortness of Life" },
  { text: "The tragedy of life doesn't lie in not reaching your goal. The tragedy lies in having no goal to reach.", author: "Benjamin E. Mays", book: "Distinguished Sermons" },
  { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King", book: "On Writing" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma", book: "The 5 AM Club" },
  { text: "Your daily behavior reveals your deepest beliefs.", author: "Robin Sharma", book: "The 5 AM Club" },
  { text: "Consistency is the DNA of mastery.", author: "Robin Sharma", book: "The 5 AM Club" },
  { text: "The starting point of all achievement is desire.", author: "Napoleon Hill", book: "Think and Grow Rich" },
  { text: "Don't wish it were easier. Wish you were better.", author: "Jim Rohn", book: "The Art of Exceptional Living" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Rohn", book: "The Art of Exceptional Living" },
  { text: "Success is nothing more than a few simple disciplines, practiced every day.", author: "Jim Rohn", book: "The Art of Exceptional Living" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn", book: "The Art of Exceptional Living" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", book: "Stanford Commencement Address" },
  { text: "Success is the sum of small efforts, repeated day-in and day-out.", author: "Robert Collier", book: "The Secret of the Ages" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela", book: "Long Walk to Freedom" },
  { text: "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell", book: "Personal Notes" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche", book: "Twilight of the Idols" },
  { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin", book: "Way to Wealth" },
  { text: "Do not fear going slowly, fear only standing still.", author: "Proverb", book: "Traditional wisdom" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain", book: "Personal Essays" },
  { text: "It is our choices that show what we truly are, far more than our abilities.", author: "J.K. Rowling", book: "Harry Potter" },
  { text: "It's not that I'm so smart, it's just that I stay with problems longer.", author: "Albert Einstein", book: "Autobiographical Notes" }
];

const CardTimerDisplay = ({ startedAt }: { startedAt: string }) => {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, Math.round((Date.now() - new Date(startedAt).getTime()) / 1000));
      const hrs = Math.floor(diff / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      const secs = diff % 60;
      const formatted = [hrs, mins, secs]
        .map((v) => String(v).padStart(2, '0'))
        .join(':');
      setElapsed(formatted);
    };
    
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return <span style={{ color: 'var(--color-danger)', fontWeight: 700 }}>⏱️ {elapsed}</span>;
};

interface TasksSectionProps {
  onStopTimer?: () => void;
}

export default function TasksSection({ onStopTimer }: TasksSectionProps) {
  const {
    tasks,
    subtasks,
    taskTimeLogs,
    goals,
    activeTimer,
    addTask,
    updateTaskStatus,
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    addGoal,
    deleteGoal,
    startTimer,
    discardTimer,
    addManualTimeLog,
    deleteTimeLog,
  } = useStore();

  // Collapsible Task Creation Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');

  // Milestone state during task creation
  const [newMilestones, setNewMilestones] = useState<string[]>([]);
  const [milestoneInput, setMilestoneInput] = useState('');

  // Goals form state
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');

  // Local date tracker that updates at midnight to roll over the quote
  const [currentDateStr, setCurrentDateStr] = useState(() => {
    return new Date().toLocaleDateString('sv');
  });

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const scheduleMidnightUpdate = () => {
      const now = new Date();
      // Calculate next midnight in local timezone
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const msUntilMidnight = tomorrow.getTime() - now.getTime();
      
      timeoutId = setTimeout(() => {
        setCurrentDateStr(new Date().toLocaleDateString('sv'));
        scheduleMidnightUpdate();
      }, msUntilMidnight + 100); // add 100ms buffer to ensure rollover
    };
    
    scheduleMidnightUpdate();
    return () => clearTimeout(timeoutId);
  }, []);

  // Get date-based index for daily quote selector (stable across renders in a single day, updates at midnight)
  const dailyQuote = useMemo(() => {
    // Reference currentDateStr to trigger recalculation on day rollover
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _dateTrigger = currentDateStr;
    const today = new Date();
    const hash = (today.getFullYear() * 37) + (today.getMonth() * 7) + today.getDate();
    const index = hash % dailyQuotes.length;
    return dailyQuotes[index];
  }, [currentDateStr]);
  
  // Accordion card expansion
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_progress' | 'completed'>('all');

  // Subtask Input per Task ID
  const [subtaskInputs, setSubtaskInputs] = useState<Record<string, string>>({});

  // Manual Log Modal State
  const [selectedManualTask, setSelectedManualTask] = useState<Task | null>(null);
  const [manualDuration, setManualDuration] = useState(60); // 60 mins default
  const [manualNote, setManualNote] = useState('');
  const [manualDate, setManualDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM local format
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask(
      title.trim(),
      description.trim(),
      dueDate || undefined,
      priority,
      newMilestones.length > 0 ? newMilestones : undefined
    );
    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('MEDIUM');
    setNewMilestones([]);
    setIsFormOpen(false);
  };

  const handleAddMilestone = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!milestoneInput.trim()) return;
    if (!newMilestones.includes(milestoneInput.trim())) {
      setNewMilestones([...newMilestones, milestoneInput.trim()]);
    }
    setMilestoneInput('');
  };

  const handleRemoveMilestone = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    setNewMilestones(newMilestones.filter((_, i) => i !== index));
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    addGoal(goalTitle.trim(), goalDescription.trim(), goalTargetDate || undefined);
    setGoalTitle('');
    setGoalDescription('');
    setGoalTargetDate('');
    setIsGoalFormOpen(false);
  };

  const handleAddSubtask = (taskId: string, e: React.FormEvent) => {
    e.preventDefault();
    const subtaskTitle = subtaskInputs[taskId] || '';
    if (!subtaskTitle.trim()) return;
    addSubtask(taskId, subtaskTitle.trim());
    setSubtaskInputs({ ...subtaskInputs, [taskId]: '' });
  };

  const handleStartTimer = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent toggling accordion
    if (activeTimer) {
      discardTimer();
    }
    startTimer(taskId);
  };

  const handleOpenManualLog = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent toggling accordion
    setSelectedManualTask(task);
    setManualNote('');
    setManualDuration(60);
  };

  const handleSaveManualLog = () => {
    if (!selectedManualTask) return;
    addManualTimeLog(
      selectedManualTask.id,
      manualDuration * 60,
      manualNote.trim(),
      new Date(manualDate).toISOString()
    );
    setSelectedManualTask(null);
  };

  const handleDeleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent toggling accordion
    if (confirm('Are you sure you want to delete this task? All subtasks and timed logs will be lost.')) {
      deleteTask(taskId);
      if (expandedTaskId === taskId) {
        setExpandedTaskId(null);
      }
    }
  };

  // Helper: Get total duration logged for a task
  const getTaskTotalTime = (taskId: string) => {
    const logs = taskTimeLogs.filter((log) => log.task_id === taskId);
    const totalSeconds = logs.reduce((sum, log) => sum + log.duration_seconds, 0);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.round((totalSeconds % 3600) / 60);
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <div className={styles.header}>
        <h2 className={styles.title}>Task Manager</h2>
        <p className={styles.subtitle}>Click a card to expand details, milestones, and manual logs. Timers float globally.</p>
      </div>

      {/* Active Objectives (Goals) Section */}
      <div className={styles.goalsSection}>
        <div className={styles.goalsHeader}>
          <h3 className={styles.goalsTitle}>
            Active Objectives
          </h3>
          <button
            onClick={() => setIsGoalFormOpen(!isGoalFormOpen)}
            className={styles.addGoalBtn}
          >
            <Plus size={14} />
            {isGoalFormOpen ? 'Cancel' : 'Add Objective'}
          </button>
        </div>

        {isGoalFormOpen && (
          <form onSubmit={handleCreateGoal} className={styles.goalForm}>
            <div className={styles.inputRow}>
              <input
                type="text"
                required
                placeholder="Objective / Goal Title (e.g. Pass German B2)..."
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                className={styles.input}
                style={{ flex: '2' }}
              />
              <input
                type="date"
                placeholder="Target Date"
                value={goalTargetDate}
                onChange={(e) => setGoalTargetDate(e.target.value)}
                className={styles.input}
              />
            </div>
            <textarea
              placeholder="Objective description / milestones (optional)..."
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
              className={styles.descriptionInput}
            />
            <button type="submit" className={styles.submitBtn} style={{ alignSelf: 'flex-end' }}>
              Create Objective
            </button>
          </form>
        )}

        <div className={styles.goalsGrid}>
          {goals.map((goal) => (
            <div key={goal.id} className={styles.goalCard}>
              <div className={styles.goalCardTitle}>{goal.title}</div>
              {goal.description && (
                <div className={styles.goalCardDesc}>{goal.description}</div>
              )}
              {goal.target_date && (
                <div className={styles.goalCardDate}>
                  Target: {goal.target_date}
                </div>
              )}
              <button
                onClick={() => deleteGoal(goal.id)}
                className={styles.deleteGoalBtn}
                title="Delete Objective"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}

          {goals.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontStyle: 'italic', fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '500px', lineHeight: '1.5' }}>
                &ldquo;{dailyQuote.text}&rdquo;
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                — {dailyQuote.author}, <span style={{ textDecoration: 'underline' }}>{dailyQuote.book}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Form Toggle */}
      {!isFormOpen ? (
        <button onClick={() => setIsFormOpen(true)} className={styles.formToggleBtn}>
          <Plus size={16} />
          Create New Task
        </button>
      ) : (
        <form onSubmit={handleCreateTask} className={`${styles.taskForm} glass-panel`}>
          <h3 className={styles.sectionLabel}>New Task Details</h3>
          <div className={styles.inputRow}>
            <input
              type="text"
              required
              placeholder="What needs to be done?..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input}
              style={{ flex: '2' }}
            />
            <input
              type="date"
              placeholder="Due Date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={styles.input}
              title="Due Date"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')}
              className={styles.input}
              title="Priority"
            >
              <option value="LOW">Low Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="CRITICAL">Critical Priority</option>
            </select>
          </div>

          <div className={styles.inputRow} style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
            <span className={styles.sectionLabel} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
              Task Milestones / Subtasks
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Add milestone / checklist item..."
                value={milestoneInput}
                onChange={(e) => setMilestoneInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (milestoneInput.trim()) {
                      setNewMilestones([...newMilestones, milestoneInput.trim()]);
                      setMilestoneInput('');
                    }
                  }
                }}
                className={styles.input}
              />
              <button
                type="button"
                onClick={handleAddMilestone}
                className={styles.subtaskAddBtn}
                style={{ padding: '0 16px', height: 'auto' }}
              >
                Add
              </button>
            </div>
            
            {newMilestones.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                {newMilestones.map((ms, index) => (
                  <span
                    key={index}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--bg-sidebar)',
                      border: '1px solid var(--border-strong)',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {ms}
                    <button
                      type="button"
                      onClick={(e) => handleRemoveMilestone(index, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0,
                      }}
                      title="Remove milestone"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <textarea
            placeholder="Task description (optional)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={styles.descriptionInput}
          />
          <div className={styles.formBtnRow}>
            <button type="submit" className={styles.submitBtn}>
              Create Task
            </button>
            <button type="button" onClick={() => setIsFormOpen(false)} className={styles.cancelFormBtn}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
        {(['all', 'todo', 'in_progress', 'completed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: statusFilter === status ? 'var(--color-primary-light)' : 'transparent',
              color: statusFilter === status ? 'var(--color-primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className={styles.columnsContainer}>
        <div className={styles.taskList}>
          {filteredTasks.map((task) => {
            const isTicking = activeTimer?.taskId === task.id;
            const isExpanded = expandedTaskId === task.id;
            const taskSubtasks = subtasks.filter((st) => st.task_id === task.id);
            const completedSubtasks = taskSubtasks.filter((st) => st.is_completed).length;

            return (
              <div
                key={task.id}
                onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                className={`${styles.taskCard} glass-panel ${isTicking ? styles.taskActiveCard : ''}`}
              >
                {/* Compact Top view always visible */}
                <div className={styles.taskTop}>
                  <div className={styles.taskMeta} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                    <h4 className={styles.taskTitle}>{task.title}</h4>
                    
                    <div className={styles.taskTags}>
                      <span className={`${styles.priorityBadge} ${styles['priority' + (task.priority || 'MEDIUM')]}`}>
                        {task.priority || 'MEDIUM'}
                      </span>
                      {task.dueDate && (
                        <span className={styles.dueDateBadge}>
                          Due: {task.dueDate}
                        </span>
                      )}
                    </div>

                    {/* Compact layout summary info */}
                    {!isExpanded && (
                      <div className={styles.taskSummaryInfo} style={{ marginTop: '4px' }}>
                        {taskSubtasks.length > 0 && (
                          <span style={{ fontSize: '11px', fontWeight: 600 }}>
                            Checklist: {completedSubtasks}/{taskSubtasks.length}
                          </span>
                        )}
                        {isTicking ? (
                          <CardTimerDisplay startedAt={activeTimer.startedAt} />
                        ) : (
                          <span>Tracked: {getTaskTotalTime(task.id)}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className={styles.taskActions}>
                    <select
                      value={task.status}
                      onClick={(e) => e.stopPropagation()} // Stop accordion toggle
                      onChange={(e) => {
                        e.stopPropagation();
                        updateTaskStatus(task.id, e.target.value as 'todo' | 'in_progress' | 'completed');
                      }}
                      className={styles.statusSelect}
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>

                    {isTicking ? (
                      <button
                        className={styles.stopBtn}
                        title="Stop Timer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onStopTimer) {
                            onStopTimer();
                          }
                        }}
                      >
                        <Square size={12} fill="currentColor" style={{ animation: 'pulse 1s infinite' }} />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleStartTimer(task.id, e)}
                        className={styles.playBtn}
                        title="Start Timer"
                        disabled={task.status === 'completed'}
                      >
                        <Play size={12} fill="currentColor" />
                      </button>
                    )}

                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Accordion expanding details area */}
                <div className={`${styles.cardDetails} ${isExpanded ? styles.cardDetailsExpanded : ''}`} onClick={(e) => e.stopPropagation()}>
                  
                  {task.description && (
                    <p className={styles.taskDescription}>{task.description}</p>
                  )}

                  {/* Subtasks Checklist */}
                  <div className={styles.subtasksContainer}>
                    <div className={styles.sectionLabel}>
                      Milestones Checklist ({completedSubtasks}/{taskSubtasks.length})
                    </div>
                    <div className={styles.subtaskList}>
                      {taskSubtasks.map((st) => (
                        <div key={st.id} className={styles.subtaskItem}>
                          <div onClick={() => toggleSubtask(st.id)} className={styles.subtaskMain}>
                            <div className={`${styles.subtaskCheck} ${st.is_completed ? styles.subtaskChecked : ''}`}>
                              {st.is_completed && <Check size={10} strokeWidth={3} />}
                            </div>
                            <span className={st.is_completed ? styles.subtaskTitleCompleted : ''}>
                              {st.title}
                            </span>
                          </div>
                          <button onClick={() => deleteSubtask(st.id)} className={styles.subtaskDeleteBtn}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <form
                      onSubmit={(e) => handleAddSubtask(task.id, e)}
                      className={styles.addSubtaskForm}
                    >
                      <input
                        type="text"
                        placeholder="Add checklist subtask..."
                        value={subtaskInputs[task.id] || ''}
                        onChange={(e) =>
                          setSubtaskInputs({ ...subtaskInputs, [task.id]: e.target.value })
                        }
                        className={styles.subtaskInput}
                      />
                      <button type="submit" className={styles.subtaskAddBtn}>
                        Add
                      </button>
                    </form>
                  </div>

                  {/* Time Logs List */}
                  {taskTimeLogs.filter((log) => log.task_id === task.id).length > 0 && (
                    <div className={styles.timeLogsContainer}>
                      <div className={styles.sectionLabel}>Time Logging History</div>
                      <div className={styles.timeLogsList}>
                        {taskTimeLogs
                          .filter((log) => log.task_id === task.id)
                          .map((log) => {
                            const date = new Date(log.started_at).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            });
                            const hrs = Math.floor(log.duration_seconds / 3600);
                            const mins = Math.floor((log.duration_seconds % 3600) / 60);
                            const durationStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

                            return (
                              <div key={log.id} className={styles.timeLogItem}>
                                <div className={styles.timeLogMain}>
                                  <span className={styles.timeLogDuration}>{durationStr}</span>
                                  <span className={styles.timeLogDate}>{date}</span>
                                  {log.description && (
                                    <p className={styles.timeLogNote}>{log.description}</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => deleteTimeLog(log.id)}
                                  className={styles.timeLogDeleteBtn}
                                  title="Delete Time Log"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Footer actions for expanded card */}
                  <div className={styles.timeLogsSummary}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Total Time Logged:</span>
                      {isTicking ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={styles.timeDuration}>{getTaskTotalTime(task.id)}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>(running:</span>
                          <CardTimerDisplay startedAt={activeTimer.startedAt} />
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>)</span>
                        </div>
                      ) : (
                        <span className={styles.timeDuration}>{getTaskTotalTime(task.id)}</span>
                      )}
                      <button onClick={(e) => handleOpenManualLog(task, e)} className={styles.manualLogBtn}>
                        + Add Manual Log
                      </button>
                    </div>

                    <button onClick={(e) => handleDeleteTask(task.id, e)} className={styles.deleteTaskBtn} title="Delete Task">
                      <Trash2 size={14} style={{ marginRight: '4px' }} />
                      Delete
                    </button>
                  </div>
                </div>

              </div>
            );
          })}

          {filteredTasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              No tasks found. Create one above to begin!
            </div>
          )}
        </div>
      </div>

      {/* Manual Time Log Modal Overlay */}
      {selectedManualTask && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Log Time Manually</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Add hours/minutes worked on: <strong>{selectedManualTask.title}</strong>
            </p>
            <div className={styles.modalForm}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Minutes Worked</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={manualDuration}
                  onChange={(e) => setManualDuration(Number(e.target.value))}
                  className={styles.input}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Session Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Log Note</label>
                <input
                  type="text"
                  placeholder="What did you achieve?"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.modalBtnRow}>
                <button onClick={() => setSelectedManualTask(null)} className={styles.btnCancel}>
                  Cancel
                </button>
                <button onClick={handleSaveManualLog} className={styles.btnSave}>
                  Save Manual Log
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
