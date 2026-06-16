import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

// --- Type Definitions ---
export interface Routine {
  id: string;
  user_id?: string;
  title: string;
  category: string;
  is_active: boolean;
  created_at: string;
  schedule?: number[]; // [0-6] where 0=Sunday, 1=Monday, etc.
}

export interface RoutineLog {
  id: string;
  routine_id: string;
  user_id?: string;
  completed_date: string; // YYYY-MM-DD
  created_at: string;
}

export interface Task {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed';
  created_at: string;
  dueDate?: string; // YYYY-MM-DD
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface Goal {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  target_date?: string; // YYYY-MM-DD
  created_at: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
}

export interface TaskTimeLog {
  id: string;
  task_id: string;
  user_id?: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  description: string;
  created_at: string;
}

export interface SyncAction {
  id: string;
  action: 'insert' | 'update' | 'delete';
  table: 'routines' | 'routine_logs' | 'tasks' | 'task_subtasks' | 'task_time_logs' | 'chat_threads' | 'chat_messages' | 'goals';
  payload: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface AgentChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  model?: string;
  thinking?: string; // Expose the agent's chain-of-thought
  tokenUsage?: {
    input: number;
    output: number;
    reasoning: number;
    total: number;
  } | null;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: AgentChatMessage[];
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  birthdate?: string;
  avatarUrl?: string;
}

interface GoalTrackerState {
  user: UserProfile | null;
  isGuestMode: boolean;
  lifestyleMode: 'steady' | 'dynamic' | null;
  setLifestyleMode: (mode: 'steady' | 'dynamic') => void;
  routines: Routine[];
  routineLogs: RoutineLog[];
  tasks: Task[];
  subtasks: Subtask[];
  taskTimeLogs: TaskTimeLog[];
  goals: Goal[];
  activeTimer: { taskId: string; startedAt: string } | null;
  syncQueue: SyncAction[];
  isSyncing: boolean;
  isOnline: boolean;

  // Actions
  setUser: (user: UserProfile | null) => void;
  setGuestMode: (enabled: boolean) => void;
  setOnline: (online: boolean) => void;
  
  // Routine Actions
  addRoutine: (title: string, category: string, schedule?: number[]) => void;
  toggleRoutine: (routineId: string, dateStr: string) => void;
  deleteRoutine: (routineId: string) => void;
  updateRoutine: (routineId: string, title: string, category?: string, schedule?: number[]) => void;
  
  // Task Actions
  addTask: (title: string, description: string, dueDate?: string, priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', subtaskTitles?: string[]) => void;
  updateTaskStatus: (taskId: string, status: 'todo' | 'in_progress' | 'completed') => void;
  updateTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'created_at' | 'user_id'>>) => void;
  deleteTask: (taskId: string) => void;
  
  // Subtask Actions
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (subtaskId: string) => void;
  deleteSubtask: (subtaskId: string) => void;
  updateSubtask: (subtaskId: string, title: string) => void;

  // Goal Actions
  addGoal: (title: string, description: string, targetDate?: string) => void;
  deleteGoal: (goalId: string) => void;
  
  // Timer Actions
  startTimer: (taskId: string) => void;
  stopTimer: (description: string) => void;
  discardTimer: () => void;
  addManualTimeLog: (taskId: string, durationSeconds: number, description: string, startedAt: string) => void;
  deleteTimeLog: (logId: string) => void;

  // Sync Logic
  processSyncQueue: () => Promise<void>;
  clearLocalData: () => void;

  // Chat History Observability Actions
  chatThreads: ChatThread[];
  activeThreadId: string | null;
  createNewThread: () => void;
  deleteThread: (threadId: string) => void;
  setActiveThreadId: (threadId: string) => void;
  addMessageToActiveThread: (message: Omit<AgentChatMessage, 'timestamp'>) => void;
  updateActiveThreadTokenUsage: (usage: NonNullable<AgentChatMessage['tokenUsage']>) => void;
  isAiResponding: boolean;
  abortController: AbortController | null;
  cancelAgentMessage: () => void;
  aiFeedback: string[];
  clearAiFeedback: () => void;
  sendAgentMessage: (text: string, apiKey: string) => Promise<void>;
  fetchUserData: () => Promise<void>;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

// --- Helper: Generate Mock Data for First Load ---
const getPastDateString = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const initialMockRoutines: Routine[] = [
  { id: 'm-r1', title: 'Drink 3L Water', category: 'Health', is_active: true, created_at: new Date().toISOString(), schedule: [0, 1, 2, 3, 4, 5, 6] },
  { id: 'm-r2', title: 'Morning Meditation', category: 'Mindset', is_active: true, created_at: new Date().toISOString(), schedule: [0, 1, 2, 3, 4, 5, 6] },
  { id: 'm-r3', title: 'Read 20 Pages', category: 'Learning', is_active: true, created_at: new Date().toISOString(), schedule: [0, 1, 2, 3, 4, 5, 6] },
  { id: 'm-r4', title: '15 Mins Cardio Workout', category: 'Fitness', is_active: true, created_at: new Date().toISOString(), schedule: [0, 1, 2, 3, 4, 5, 6] },
];

const generateMockRoutineLogs = (): RoutineLog[] => {
  const logs: RoutineLog[] = [];
  const routineIds = ['m-r1', 'm-r2', 'm-r3', 'm-r4'];
  
  // Generate historical checks for the last 30 days with some random gaps
  for (let i = 0; i < 30; i++) {
    const dateStr = getPastDateString(i);
    routineIds.forEach((rid) => {
      // 70% chance of completion to make the heatmap look realistic
      if (Math.random() > 0.3) {
        logs.push({
          id: `m-log-${rid}-${dateStr}`,
          routine_id: rid,
          completed_date: dateStr,
          created_at: new Date(dateStr + 'T10:00:00Z').toISOString(),
        });
      }
    });
  }
  return logs;
};

const initialMockTasks: Task[] = [
  { id: 'm-t1', title: 'Design Glassmorphism Dashboard Layout', description: 'Create responsive grid layouts with CSS modules and clay-white card aesthetics.', status: 'in_progress', created_at: new Date().toISOString() },
  { id: 'm-t2', title: 'Implement Zustand State with Local Cache', description: 'Define stores, type definitions, and synchronization queues.', status: 'completed', created_at: new Date().toISOString() },
  { id: 'm-t3', title: 'Connect Supabase Auth & DB tables', description: 'Link Google OAuth, Email OTP magic link, and write action syncing logic.', status: 'todo', created_at: new Date().toISOString() },
];

const initialMockSubtasks: Subtask[] = [
  { id: 'm-st1', task_id: 'm-t1', title: 'Write responsive app shell components', is_completed: true, created_at: new Date().toISOString() },
  { id: 'm-st2', task_id: 'm-t1', title: 'Apply soft porcelain/clay backgrounds', is_completed: false, created_at: new Date().toISOString() },
  { id: 'm-st3', task_id: 'm-t2', title: 'Configure local storage persistence', is_completed: true, created_at: new Date().toISOString() },
];

const initialMockTimeLogs = (): TaskTimeLog[] => [
  {
    id: 'm-tl1',
    task_id: 'm-t2',
    started_at: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    ended_at: new Date(Date.now() - 3600000 * 0.5).toISOString(),
    duration_seconds: 7200, // 2 hours
    description: 'Designed local-first persistence structure and wrote sync actions.',
    created_at: new Date().toISOString()
  },
  {
    id: 'm-tl2',
    task_id: 'm-t1',
    started_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    ended_at: new Date(Date.now() - 3600000 * 4.5).toISOString(),
    duration_seconds: 1800, // 30 mins
    description: 'Experimented with light-theme CSS backdrop-filters.',
    created_at: new Date().toISOString()
  }
];

export const useStore = create<GoalTrackerState>()(
  persist(
    (set, get) => ({
      user: null,
      isGuestMode: false,
      lifestyleMode: null,
      setLifestyleMode: (mode) => set({ lifestyleMode: mode }),
      routines: initialMockRoutines,
      routineLogs: generateMockRoutineLogs(),
      tasks: initialMockTasks,
      subtasks: initialMockSubtasks,
      taskTimeLogs: initialMockTimeLogs(),
      goals: [],
      activeTimer: null,
      syncQueue: [],
      isSyncing: false,
      isOnline: typeof window !== 'undefined' ? window.navigator.onLine : true,

      // Initial Chat Thread Configuration
      chatThreads: [
        {
          id: 'welcome-thread',
          title: 'Welcome Chat',
          messages: [
            {
              id: 'welcome-msg',
              sender: 'agent',
              text: 'Hello! I am your Goal Tracker AI Assistant. Ask me questions about your history (e.g. "How much did I track today?") or ask me to schedule new habits and tasks (e.g. "Add a work routine: Read mail").',
              timestamp: new Date().toISOString()
            }
          ],
          created_at: new Date().toISOString()
        }
      ],
      activeThreadId: 'welcome-thread',
      isAiResponding: false,
      abortController: null,
      aiFeedback: [],
      selectedModel: 'gemini-3.5-flash',
      setSelectedModel: (model) => set({ selectedModel: model }),

      setUser: (user) => {
        set({ user, isGuestMode: user ? false : get().isGuestMode });
        if (user) {
          get().fetchUserData();
          get().processSyncQueue();
        }
      },
      setGuestMode: (enabled) => set({ isGuestMode: enabled, user: enabled ? null : get().user }),
      setOnline: (online) => {
        set({ isOnline: online });
        if (online && get().user) {
          get().processSyncQueue();
        }
      },

      // --- Routines Actions ---
      addRoutine: (title, category, schedule) => {
        const newRoutine: Routine = {
          id: `r-${crypto.randomUUID()}`,
          user_id: get().user?.id,
          title,
          category,
          is_active: true,
          created_at: new Date().toISOString(),
          schedule: schedule || [0, 1, 2, 3, 4, 5, 6],
        };

        set((state) => ({
          routines: [newRoutine, ...state.routines],
          syncQueue: state.user
            ? [...state.syncQueue, { id: crypto.randomUUID(), action: 'insert', table: 'routines', payload: newRoutine }]
            : state.syncQueue,
        }));

        get().processSyncQueue();
      },

      toggleRoutine: (routineId, dateStr) => {
        set((state) => {
          const exists = state.routineLogs.find(
            (log) => log.routine_id === routineId && log.completed_date === dateStr
          );

          if (exists) {
            // Remove completion
            const updatedLogs = state.routineLogs.filter((log) => log.id !== exists.id);
            return {
              routineLogs: updatedLogs,
              syncQueue: state.user
                ? [...state.syncQueue, { id: crypto.randomUUID(), action: 'delete', table: 'routine_logs', payload: { id: exists.id } }]
                : state.syncQueue,
            };
          } else {
            // Add completion
            const newLog: RoutineLog = {
              id: `rl-${crypto.randomUUID()}`,
              routine_id: routineId,
              user_id: state.user?.id,
              completed_date: dateStr,
              created_at: new Date().toISOString(),
            };
            return {
              routineLogs: [newLog, ...state.routineLogs],
              syncQueue: state.user
                ? [...state.syncQueue, { id: crypto.randomUUID(), action: 'insert', table: 'routine_logs', payload: newLog }]
                : state.syncQueue,
            };
          }
        });

        get().processSyncQueue();
      },

      deleteRoutine: (routineId) => {
        set((state) => ({
          routines: state.routines.filter((r) => r.id !== routineId),
          routineLogs: state.routineLogs.filter((log) => log.routine_id !== routineId),
          syncQueue: state.user
            ? [...state.syncQueue, { id: crypto.randomUUID(), action: 'delete', table: 'routines', payload: { id: routineId } }]
            : state.syncQueue,
        }));

        get().processSyncQueue();
      },

      updateRoutine: (routineId, title, category, schedule) => {
        set((state) => ({
          routines: state.routines.map((r) =>
            r.id === routineId
              ? {
                  ...r,
                  title,
                  category: category || r.category,
                  schedule: schedule || r.schedule || [0, 1, 2, 3, 4, 5, 6],
                }
              : r
          ),
          syncQueue: state.user
            ? [
                ...state.syncQueue,
                {
                  id: crypto.randomUUID(),
                  action: 'update',
                  table: 'routines',
                  payload: {
                    id: routineId,
                    title,
                    category: category || undefined,
                    schedule: schedule || undefined,
                  },
                } as SyncAction,
              ]
            : state.syncQueue,
        }));

        get().processSyncQueue();
      },

      // --- Task Actions ---
      addTask: (title, description, dueDate, priority, subtaskTitles) => {
        const taskId = `t-${crypto.randomUUID()}`;
        const newTask: Task = {
          id: taskId,
          user_id: get().user?.id,
          title,
          description,
          status: 'todo',
          created_at: new Date().toISOString(),
          dueDate,
          priority: priority || 'MEDIUM',
        };

        const subtasksToAdd: Subtask[] = [];
        const syncQueueToAdd: SyncAction[] = [];

        if (subtaskTitles && subtaskTitles.length > 0) {
          subtaskTitles.forEach((subTitle) => {
            const newSubtask: Subtask = {
              id: `st-${crypto.randomUUID()}`,
              task_id: taskId,
              title: subTitle,
              is_completed: false,
              created_at: new Date().toISOString(),
            };
            subtasksToAdd.push(newSubtask);
            if (get().user) {
              syncQueueToAdd.push({ id: crypto.randomUUID(), action: 'insert', table: 'task_subtasks', payload: newSubtask } as SyncAction);
            }
          });
        }

        set((state) => ({
          tasks: [...state.tasks, newTask],
          subtasks: [...state.subtasks, ...subtasksToAdd],
          syncQueue: state.user
            ? [
                ...state.syncQueue,
                { id: crypto.randomUUID(), action: 'insert', table: 'tasks', payload: newTask } as SyncAction,
                ...syncQueueToAdd
              ]
            : state.syncQueue,
        }));

        get().processSyncQueue();
      },

      updateTask: (taskId, updates) => {
        set((state) => {
          const updatedTasks = state.tasks.map((t) =>
            t.id === taskId ? { ...t, ...updates } : t
          );
          return {
            tasks: updatedTasks,
            syncQueue: state.user
              ? [
                  ...state.syncQueue,
                  {
                    id: crypto.randomUUID(),
                    action: 'update',
                    table: 'tasks',
                    payload: { id: taskId, ...updates }
                  } as SyncAction
                ]
              : state.syncQueue,
          };
        });

        get().processSyncQueue();
      },

      updateTaskStatus: (taskId, status) => {
        set((state) => {
          const tasks = state.tasks.map((t) => (t.id === taskId ? { ...t, status } : t));
          let activeTimer = state.activeTimer;
          let taskTimeLogs = state.taskTimeLogs;
          let syncQueue = state.syncQueue;

          // Smart Flow: complete task -> stop timer & save log
          if (status === 'completed' && activeTimer?.taskId === taskId) {
            const endedAt = new Date().toISOString();
            const durationSeconds = Math.round(
              (new Date(endedAt).getTime() - new Date(activeTimer.startedAt).getTime()) / 1000
            );

            if (durationSeconds > 0) {
              const newLog: TaskTimeLog = {
                id: `tl-${crypto.randomUUID()}`,
                task_id: taskId,
                user_id: state.user?.id,
                started_at: activeTimer.startedAt,
                ended_at: endedAt,
                duration_seconds: durationSeconds,
                description: 'Completed task session',
                created_at: endedAt,
              };

              taskTimeLogs = [newLog, ...taskTimeLogs];
              if (state.user) {
                syncQueue = [
                  ...syncQueue,
                  { id: crypto.randomUUID(), action: 'insert', table: 'task_time_logs', payload: newLog } as SyncAction
                ];
              }
            }
            activeTimer = null;
          }

          return {
            tasks,
            activeTimer,
            taskTimeLogs,
            syncQueue: state.user
              ? [
                  ...syncQueue,
                  { id: crypto.randomUUID(), action: 'update', table: 'tasks', payload: { id: taskId, status } } as SyncAction
                ]
              : syncQueue,
          };
        });

        get().processSyncQueue();
      },

      deleteTask: (taskId) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== taskId),
          subtasks: state.subtasks.filter((st) => st.task_id !== taskId),
          taskTimeLogs: state.taskTimeLogs.filter((tl) => tl.task_id !== taskId),
          activeTimer: state.activeTimer?.taskId === taskId ? null : state.activeTimer,
          syncQueue: state.user
            ? [...state.syncQueue, { id: crypto.randomUUID(), action: 'delete', table: 'tasks', payload: { id: taskId } }]
            : state.syncQueue,
        }));

        get().processSyncQueue();
      },

      // --- Subtask Actions ---
      addSubtask: (taskId, title) => {
        const newSubtask: Subtask = {
          id: `st-${crypto.randomUUID()}`,
          task_id: taskId,
          title,
          is_completed: false,
          created_at: new Date().toISOString(),
        };

        set((state) => ({
          subtasks: [...state.subtasks, newSubtask],
          syncQueue: state.user
            ? [...state.syncQueue, { id: crypto.randomUUID(), action: 'insert', table: 'task_subtasks', payload: newSubtask }]
            : state.syncQueue,
        }));

        get().processSyncQueue();
      },

      toggleSubtask: (subtaskId) => {
        set((state) => {
          const subtask = state.subtasks.find((st) => st.id === subtaskId);
          if (!subtask) return {};
          const is_completed = !subtask.is_completed;
          const subtasks = state.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, is_completed } : st
          );

          return {
            subtasks,
            syncQueue: state.user
              ? [...state.syncQueue, { id: crypto.randomUUID(), action: 'update', table: 'task_subtasks', payload: { id: subtaskId, is_completed } }]
              : state.syncQueue,
          };
        });

        get().processSyncQueue();
      },

      deleteSubtask: (subtaskId) => {
        set((state) => ({
          subtasks: state.subtasks.filter((st) => st.id !== subtaskId),
          syncQueue: state.user
            ? [...state.syncQueue, { id: crypto.randomUUID(), action: 'delete', table: 'task_subtasks', payload: { id: subtaskId } }]
            : state.syncQueue,
        }));

        get().processSyncQueue();
      },

      updateSubtask: (subtaskId, title) => {
        set((state) => ({
          subtasks: state.subtasks.map((st) => (st.id === subtaskId ? { ...st, title } : st)),
          syncQueue: state.user
            ? [...state.syncQueue, { id: crypto.randomUUID(), action: 'update', table: 'task_subtasks', payload: { id: subtaskId, title } }]
            : state.syncQueue,
        }));

        get().processSyncQueue();
      },

      // --- Goal Actions ---
      addGoal: (title, description, targetDate) => {
        const newGoal: Goal = {
          id: `g-${crypto.randomUUID()}`,
          user_id: get().user?.id,
          title,
          description,
          target_date: targetDate,
          created_at: new Date().toISOString(),
        };

        set((state) => ({
          goals: [newGoal, ...state.goals],
          syncQueue: state.user
            ? [...state.syncQueue, { id: crypto.randomUUID(), action: 'insert', table: 'goals', payload: newGoal } as SyncAction]
            : state.syncQueue,
        }));

        get().processSyncQueue();
      },

      deleteGoal: (goalId) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== goalId),
          syncQueue: state.user
            ? [...state.syncQueue, { id: crypto.randomUUID(), action: 'delete', table: 'goals', payload: { id: goalId } } as SyncAction]
            : state.syncQueue,
        }));

        get().processSyncQueue();
      },

      // --- Timer Actions ---
      startTimer: (taskId) => {
        // Smart Flow: starting timer updates task to in_progress
        const currentTask = get().tasks.find((t) => t.id === taskId);
        
        set({
          activeTimer: {
            taskId,
            startedAt: new Date().toISOString(),
          },
        });

        if (currentTask && currentTask.status === 'todo') {
          get().updateTaskStatus(taskId, 'in_progress');
        }
      },

      stopTimer: (description) => {
        const { activeTimer, user } = get();
        if (!activeTimer) return;

        const endedAt = new Date().toISOString();
        const durationSeconds = Math.round(
          (new Date(endedAt).getTime() - new Date(activeTimer.startedAt).getTime()) / 1000
        );

        // Safeguard against sub-second logs
        if (durationSeconds <= 0) {
          set({ activeTimer: null });
          return;
        }

        const newLog: TaskTimeLog = {
          id: `tl-${crypto.randomUUID()}`,
          task_id: activeTimer.taskId,
          user_id: user?.id,
          started_at: activeTimer.startedAt,
          ended_at: endedAt,
          duration_seconds: durationSeconds,
          description,
          created_at: endedAt,
        };

        set((state) => ({
          activeTimer: null,
          taskTimeLogs: [newLog, ...state.taskTimeLogs],
          syncQueue: state.user
            ? [...state.syncQueue, { id: crypto.randomUUID(), action: 'insert', table: 'task_time_logs', payload: newLog }]
            : state.syncQueue,
        }));

        get().processSyncQueue();
      },

      discardTimer: () => {
        set({ activeTimer: null });
      },

      addManualTimeLog: (taskId, durationSeconds, description, startedAt) => {
        const endedAt = new Date(new Date(startedAt).getTime() + durationSeconds * 1000).toISOString();
        
        const newLog: TaskTimeLog = {
          id: `tl-${crypto.randomUUID()}`,
          task_id: taskId,
          user_id: get().user?.id,
          started_at: startedAt,
          ended_at: endedAt,
          duration_seconds: durationSeconds,
          description,
          created_at: endedAt,
        };

        set((state) => ({
          taskTimeLogs: [newLog, ...state.taskTimeLogs],
          syncQueue: state.user
            ? [...state.syncQueue, { id: crypto.randomUUID(), action: 'insert', table: 'task_time_logs', payload: newLog }]
            : state.syncQueue,
        }));

        get().processSyncQueue();
      },

      deleteTimeLog: (logId) => {
        set((state) => ({
          taskTimeLogs: state.taskTimeLogs.filter((tl) => tl.id !== logId),
          syncQueue: state.user
            ? [...state.syncQueue, { id: crypto.randomUUID(), action: 'delete', table: 'task_time_logs', payload: { id: logId } }]
            : state.syncQueue,
        }));

        get().processSyncQueue();
      },

      // --- Offline Sync Logic ---
      processSyncQueue: async () => {
        const { syncQueue, isSyncing, isOnline, user } = get();

        // Prevent concurrent syncs, or run only if online and authenticated
        if (isSyncing || !isOnline || !user || !supabase || syncQueue.length === 0) return;

        set({ isSyncing: true });

        const queueCopy = [...syncQueue];
        let processedCount = 0;

        for (const action of queueCopy) {
          try {
            const { table, action: op, payload } = action;
            let error = null;

            let payloadToSync = payload;
            if (table === 'tasks') {
              const { dueDate, ...rest } = payload;
              payloadToSync = {
                ...rest,
              };
              if (dueDate !== undefined) {
                payloadToSync.due_date = dueDate || null;
              }
            } else if (table === 'routines') {
              payloadToSync = payload;
            }

            if (op === 'insert') {
              const { error: err } = await supabase.from(table).insert(payloadToSync);
              error = err;
            } else if (op === 'update') {
              const { error: err } = await supabase.from(table).update(payloadToSync).eq('id', payload.id);
              error = err;
            } else if (op === 'delete') {
              const { error: err } = await supabase.from(table).delete().eq('id', payload.id);
              error = err;
            }

            if (error) {
              const isNetworkError = error.message && (
                error.message.includes('Failed to fetch') || 
                error.message.includes('NetworkError') ||
                error.message.includes('fetch')
              );
              
              if (isNetworkError) {
                console.warn(`Sync paused: network connection is currently unreachable (${error.message}). Will retry when connection stabilizes.`);
              } else {
                console.error(`Error syncing action ${action.id} to ${table}:`, error.message, error.details, error.hint || '');
              }
              // Stop processing on error to preserve order (KISS transaction safety)
              break;
            }

            processedCount++;
          } catch (err) {
            const isNetworkError = err instanceof Error && (
              err.message.includes('Failed to fetch') || 
              err.message.includes('NetworkError') ||
              err.message.includes('fetch')
            );
            
            if (isNetworkError) {
              console.warn(`Sync paused: network connection is currently unreachable (${err.message}). Will retry when connection stabilizes.`);
            } else {
              console.error('Failed to sync action due to connection exception:', err);
            }
            break;
          }
        }

        if (processedCount > 0) {
          set((state) => ({
            syncQueue: state.syncQueue.slice(processedCount),
          }));
        }

        set({ isSyncing: false });
      },

      fetchUserData: async () => {
        const { user, isOnline } = get();
        if (!user || !isOnline || !supabase) return;

        try {
          // 1. Fetch routines
          const { data: routinesData } = await supabase.from('routines').select('*').eq('user_id', user.id);
          // 2. Fetch routine logs
          const { data: routineLogsData } = await supabase.from('routine_logs').select('*').eq('user_id', user.id);
          // 3. Fetch tasks
          const { data: tasksData } = await supabase.from('tasks').select('*').eq('user_id', user.id);
          
          let subtasksData: Subtask[] = [];
          if (tasksData && tasksData.length > 0) {
            const taskIds = tasksData.map(t => t.id);
            const { data: stData } = await supabase.from('task_subtasks').select('*').in('task_id', taskIds);
            if (stData) subtasksData = stData;
          }
          
          // 4. Fetch time logs
          const { data: timeLogsData } = await supabase.from('task_time_logs').select('*').eq('user_id', user.id);

          // 5. Fetch chat threads
          const { data: threadsData } = await supabase.from('chat_threads').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

          // 6. Fetch chat messages
          const { data: messagesData } = await supabase.from('chat_messages').select('*').eq('user_id', user.id).order('created_at', { ascending: true });

          // Assemble chat threads with their messages
          const chatThreads: ChatThread[] = [];
          if (threadsData) {
            threadsData.forEach((thread: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
              const msgs = messagesData
                ? messagesData
                    .filter((m: any) => m.thread_id === thread.id) // eslint-disable-line @typescript-eslint/no-explicit-any
                    .map((m: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
                      id: m.id,
                      sender: m.sender,
                      text: m.text,
                      timestamp: m.created_at,
                      tokenUsage: m.token_usage || null
                    }))
                : [];
              chatThreads.push({
                id: thread.id,
                title: thread.title,
                messages: msgs,
                created_at: thread.created_at
              });
            });
          }

          // 7. Fetch goals
          const { data: goalsData } = await supabase.from('goals').select('*').eq('user_id', user.id);

          const mappedTasks = (tasksData || []).map((t: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
            id: t.id,
            user_id: t.user_id,
            title: t.title,
            description: t.description,
            status: t.status,
            created_at: t.created_at,
            dueDate: t.due_date || undefined,
            priority: t.priority || 'MEDIUM',
          }));

          set({
            routines: routinesData || [],
            routineLogs: routineLogsData || [],
            tasks: mappedTasks,
            subtasks: subtasksData,
            taskTimeLogs: timeLogsData || [],
            goals: goalsData || [],
            chatThreads: chatThreads.length > 0 ? chatThreads : get().chatThreads,
            activeThreadId: chatThreads.length > 0 ? chatThreads[0].id : get().activeThreadId
          });
        } catch (err) {
          console.error('Error fetching user data from Supabase:', err);
        }
      },

      clearLocalData: () => {
        set({
          lifestyleMode: null,
          routines: [],
          routineLogs: [],
          tasks: [],
          subtasks: [],
          taskTimeLogs: [],
          goals: [],
          activeTimer: null,
          syncQueue: [],
          chatThreads: [
            {
              id: 'welcome-thread',
              title: 'Welcome Chat',
              messages: [
                {
                  id: 'welcome-msg',
                  sender: 'agent',
                  text: 'Hello! I am your Goal Tracker AI Assistant. Ask me questions about your history or ask me to schedule new habits and tasks.',
                  timestamp: new Date().toISOString()
                }
              ],
              created_at: new Date().toISOString()
            }
          ],
          activeThreadId: 'welcome-thread',
          isAiResponding: false,
          aiFeedback: [],
          selectedModel: 'gemini-3.5-flash',
        });
      },

      // --- Chat Thread Persistence Actions ---
      createNewThread: () => {
        const newThread: ChatThread = {
          id: `ch-${crypto.randomUUID()}`,
          title: 'New Chat',
          messages: [
            {
              id: `welcome-${crypto.randomUUID()}`,
              sender: 'agent',
              text: 'Hello! I am your Goal Tracker AI Assistant. Ask me questions about your history or ask me to schedule new habits and tasks.',
              timestamp: new Date().toISOString()
            }
          ],
          created_at: new Date().toISOString()
        };

        set((state) => ({
          chatThreads: [newThread, ...state.chatThreads],
          activeThreadId: newThread.id,
          syncQueue: state.user
            ? [
                ...state.syncQueue,
                { id: crypto.randomUUID(), action: 'insert', table: 'chat_threads', payload: { id: newThread.id, user_id: state.user.id, title: newThread.title, created_at: newThread.created_at } } as SyncAction,
                { id: crypto.randomUUID(), action: 'insert', table: 'chat_messages', payload: { id: newThread.messages[0].id, thread_id: newThread.id, user_id: state.user.id, sender: newThread.messages[0].sender, text: newThread.messages[0].text, created_at: newThread.messages[0].timestamp, token_usage: null } } as SyncAction
              ]
            : state.syncQueue
        }));

        get().processSyncQueue();
      },

      deleteThread: (threadId) => {
        set((state) => {
          const chatThreads = state.chatThreads.filter(t => t.id !== threadId);
          let activeThreadId = state.activeThreadId;
          
          if (activeThreadId === threadId) {
            activeThreadId = chatThreads.length > 0 ? chatThreads[0].id : null;
          }

          const syncQueue = state.user
            ? [...state.syncQueue, { id: crypto.randomUUID(), action: 'delete', table: 'chat_threads', payload: { id: threadId } } as SyncAction]
            : state.syncQueue;

          if (chatThreads.length === 0) {
            const autoThread: ChatThread = {
              id: 'welcome-thread',
              title: 'Welcome Chat',
              messages: [
                {
                  id: 'welcome-msg',
                  sender: 'agent',
                  text: 'Hello! I am your Goal Tracker AI Assistant. Ask me questions about your history or ask me to schedule new habits and tasks.',
                  timestamp: new Date().toISOString()
                }
              ],
              created_at: new Date().toISOString()
            };
            return {
              chatThreads: [autoThread],
              activeThreadId: autoThread.id,
              syncQueue: state.user
                ? [
                    ...syncQueue,
                    { id: crypto.randomUUID(), action: 'insert', table: 'chat_threads', payload: { id: autoThread.id, user_id: state.user.id, title: autoThread.title, created_at: autoThread.created_at } } as SyncAction,
                    { id: crypto.randomUUID(), action: 'insert', table: 'chat_messages', payload: { id: autoThread.messages[0].id, thread_id: autoThread.id, user_id: state.user.id, sender: autoThread.messages[0].sender, text: autoThread.messages[0].text, created_at: autoThread.messages[0].timestamp, token_usage: null } } as SyncAction
                  ]
                : syncQueue
            };
          }

          return {
            chatThreads,
            activeThreadId,
            syncQueue
          };
        });

        get().processSyncQueue();
      },

      setActiveThreadId: (threadId) => set({ activeThreadId: threadId }),

      addMessageToActiveThread: (message) => {
        set((state) => {
          const activeThreadId = state.activeThreadId;
          if (!activeThreadId) return {};

          let syncQueue = state.syncQueue;
          const newMsg: AgentChatMessage = {
            ...message,
            timestamp: new Date().toISOString()
          };

          const chatThreads = state.chatThreads.map((thread) => {
            if (thread.id === activeThreadId) {
              let title = thread.title;
              if (thread.title === 'New Chat' && message.sender === 'user') {
                title = message.text.length > 22 ? message.text.slice(0, 20) + '...' : message.text;
                if (state.user) {
                  syncQueue = [
                    ...syncQueue,
                    { id: crypto.randomUUID(), action: 'update', table: 'chat_threads', payload: { id: thread.id, title } } as SyncAction
                  ];
                }
              }

              if (state.user) {
                syncQueue = [
                  ...syncQueue,
                  {
                    id: crypto.randomUUID(),
                    action: 'insert',
                    table: 'chat_messages',
                    payload: {
                      id: newMsg.id,
                      thread_id: thread.id,
                      user_id: state.user.id,
                      sender: newMsg.sender,
                      text: newMsg.text,
                      created_at: newMsg.timestamp,
                      token_usage: newMsg.tokenUsage || null
                    }
                  } as SyncAction
                ];
              }

              return {
                ...thread,
                title,
                messages: [...thread.messages, newMsg]
              };
            }
            return thread;
          });

          return { chatThreads, syncQueue };
        });

        get().processSyncQueue();
      },

      updateActiveThreadTokenUsage: (usage) => {
        set((state) => {
          const activeThreadId = state.activeThreadId;
          if (!activeThreadId) return {};

          let syncQueue = state.syncQueue;
          const chatThreads = state.chatThreads.map((thread) => {
            if (thread.id === activeThreadId) {
              const messages = [...thread.messages];
              if (messages.length > 0) {
                const lastIndex = messages.length - 1;
                const lastMsg = {
                  ...messages[lastIndex],
                  tokenUsage: usage
                };
                messages[lastIndex] = lastMsg;

                if (state.user) {
                  syncQueue = [
                    ...syncQueue,
                    {
                      id: crypto.randomUUID(),
                      action: 'update',
                      table: 'chat_messages',
                      payload: {
                        id: lastMsg.id,
                        token_usage: usage
                      }
                    } as SyncAction
                  ];
                }
              }
              return { ...thread, messages };
            }
            return thread;
          });

          return { chatThreads, syncQueue };
        });

        get().processSyncQueue();
      },

      clearAiFeedback: () => set({ aiFeedback: [] }),

      cancelAgentMessage: () => {
        const controller = get().abortController;
        if (controller) {
          controller.abort();
        }
        set({ isAiResponding: false, abortController: null });
        get().addMessageToActiveThread({
          id: `cancel-${crypto.randomUUID()}`,
          sender: 'agent',
          text: 'Request cancelled.',
        });
      },

      sendAgentMessage: async (userMessage, currentApiKey) => {
        if (!userMessage.trim()) return;

        const controller = new AbortController();
        set({ abortController: controller, isAiResponding: true, aiFeedback: [] });

        // 1. Add user message to active thread
        get().addMessageToActiveThread({
          id: `u-${crypto.randomUUID()}`,
          sender: 'user',
          text: userMessage,
        });

        try {
          const todayStr = new Date().toLocaleDateString('sv');
          const routines = get().routines;
          const routineLogs = get().routineLogs;
          const tasks = get().tasks;
          const subtasks = get().subtasks;
          const taskTimeLogs = get().taskTimeLogs;
          const goals = get().goals;

          // System prompt template is now resolved on the server-side in the /api/chat route to maintain a secure, version-controlled prompt registry.          `;

          const activeThread = get().chatThreads.find((t) => t.id === get().activeThreadId);
          const threadMessages = activeThread ? activeThread.messages : [];

          // Clean/format thread messages for Gemini contents parameter:
          const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
          
          threadMessages.forEach((m, idx) => {
            const role = m.sender === 'user' ? 'user' : 'model';
            // Skip welcome message if it's the very first message (to ensure the conversation starts with 'user')
            if (idx === 0 && role === 'model') {
              return;
            }
            
            // If the last message has the same role, combine their text to keep alternation strict
            if (contents.length > 0 && contents[contents.length - 1].role === role) {
              contents[contents.length - 1].parts[0].text += '\n\n' + m.text;
            } else {
              contents.push({
                role,
                parts: [{ text: m.text }]
              });
            }
          });

          // Fallback if contents is empty
          if (contents.length === 0) {
            contents.push({
              role: 'user',
              parts: [{ text: userMessage }]
            });
          }

          const model = get().selectedModel || 'gemini-3.5-flash';
          let responseData: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any

          // 1. Compression helpers to strip grammatical stop words and trim text
          const compressText = (text: string, maxWords = 6): string => {
            if (!text) return '';
            const stopWords = new Set(['a', 'an', 'the', 'to', 'for', 'in', 'on', 'at', 'and', 'or', 'of', 'with', 'about', 'is', 'are', 'was', 'were', 'been', 'my', 'your', 'i', 'you']);
            return text
              .toLowerCase()
              .replace(/[^\w\s-]/g, '') // remove punctuation
              .split(/\s+/)
              .filter(word => word && !stopWords.has(word))
              .slice(0, maxWords)
              .join(' ');
          };

          const compressedRoutines = routines.map(r => {
            const dates = routineLogs
              .filter(log => log.routine_id === r.id)
              .map(log => log.completed_date)
              .join(',');
            return `${r.id};${compressText(r.title, 4)};${r.category};${dates}`;
          });

          // Compress all tasks
          const compressedTasks = tasks.map(t => {
            const prio = t.priority ? t.priority[0] : 'M';
            return `${t.id};${compressText(t.title, 5)};${compressText(t.description, 8)};${t.status};${prio}`;
          });

          // Compress all subtasks
          const compressedSubtasks = subtasks
            .map(st => `${st.id};${st.task_id};${compressText(st.title, 5)};${st.is_completed}`);

          // Compress all time logs
          const compressedTimeLogs = taskTimeLogs
            .map(l => {
              const task = tasks.find(t => t.id === l.task_id);
              const taskTitle = compressText(task ? task.title : 'Task', 3);
              const note = compressText(l.description || '', 6);
              const date = l.started_at.split('T')[0];
              return `${taskTitle};${l.duration_seconds};${note};${date}`;
            });

          // Goals list compression
          const compressedGoals = goals.map(g => `${g.id};${compressText(g.title, 5)};${compressText(g.description, 8)}`);

          try {
            const response = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents,
                selectedModel: model,
                apiKey: currentApiKey,
                state: {
                  date: todayStr,
                  goals: compressedGoals,
                  routines: compressedRoutines,
                  tasks: compressedTasks,
                  subtasks: compressedSubtasks,
                  taskTimeLogs: compressedTimeLogs
                }
              }),
              signal: controller.signal
            });

            if (!response.ok) {
              const errData = await response.json();
              throw new Error(errData.error || response.statusText);
            }

            responseData = await response.json();
          } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
              throw err;
            }
            throw new Error(`Chat API failed: ${err instanceof Error ? err.message : String(err)}`);
          }

          // 2. Append Agent response text
          get().addMessageToActiveThread({
            id: `a-${crypto.randomUUID()}`,
            sender: 'agent',
            text: responseData.content?.reply || 'Request processed successfully.',
            model: responseData.modelName,
            thinking: responseData.content?.thinking || '',
          });

          // 3. Save token usage metadata
          if (responseData.usage) {
            get().updateActiveThreadTokenUsage({
              input: responseData.usage.promptTokenCount || 0,
              output: responseData.usage.candidatesTokenCount || 0,
              reasoning: responseData.usage.thoughtsTokenCount || 0,
              total: responseData.usage.totalTokenCount || 0,
            });
          }

          // 4. Execute actions
          if (responseData.content?.actions && Array.isArray(responseData.content.actions)) {
            const actionFeedbacks: string[] = [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            responseData.content.actions.forEach((act: any) => {
              if (act.type === 'CREATE_TASK' && act.payload?.title) {
                const taskId = `t-${crypto.randomUUID()}`;
                const newTask: Task = {
                  id: taskId,
                  user_id: get().user?.id,
                  title: act.payload.title,
                  description: act.payload.description || '',
                  status: 'todo',
                  created_at: new Date().toISOString(),
                  dueDate: act.payload.dueDate,
                  priority: act.payload.priority || 'MEDIUM',
                };

                const subtasksToAdd: Subtask[] = [];
                const syncQueueToAdd: SyncAction[] = [];

                if (act.payload.subtasks && Array.isArray(act.payload.subtasks)) {
                  act.payload.subtasks.forEach((subTitle: string) => {
                    const newSubtask: Subtask = {
                      id: `st-${crypto.randomUUID()}`,
                      task_id: taskId,
                      title: subTitle,
                      is_completed: false,
                      created_at: new Date().toISOString(),
                    };
                    subtasksToAdd.push(newSubtask);
                    if (get().user) {
                      syncQueueToAdd.push({ id: crypto.randomUUID(), action: 'insert', table: 'task_subtasks', payload: newSubtask } as SyncAction);
                    }
                    actionFeedbacks.push(`Subtask added: "${subTitle}"`);
                  });
                }

                let newTimeLog: TaskTimeLog | null = null;
                if (act.payload.timeLog && typeof act.payload.timeLog === 'object') {
                  const durationSeconds = act.payload.timeLog.durationSeconds || 0;
                  const logDesc = act.payload.timeLog.description || 'Logged via AI Assistant';
                  const startedAt = new Date(Date.now() - durationSeconds * 1000).toISOString();
                  const endedAt = new Date().toISOString();

                  newTimeLog = {
                    id: `tl-${crypto.randomUUID()}`,
                    task_id: taskId,
                    user_id: get().user?.id,
                    started_at: startedAt,
                    ended_at: endedAt,
                    duration_seconds: durationSeconds,
                    description: logDesc,
                    created_at: endedAt,
                  };
                  if (get().user) {
                    syncQueueToAdd.push({ id: crypto.randomUUID(), action: 'insert', table: 'task_time_logs', payload: newTimeLog } as SyncAction);
                  }
                  const hrs = Math.floor(durationSeconds / 3600);
                  const mins = Math.floor((durationSeconds % 3600) / 60);
                  const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                  actionFeedbacks.push(`Time log added: ${timeStr} ("${logDesc}")`);
                }

                set((state) => ({
                  tasks: [...state.tasks, newTask],
                  subtasks: [...state.subtasks, ...subtasksToAdd],
                  taskTimeLogs: newTimeLog ? [newTimeLog, ...state.taskTimeLogs] : state.taskTimeLogs,
                  syncQueue: state.user
                    ? [
                        ...state.syncQueue,
                        { id: crypto.randomUUID(), action: 'insert', table: 'tasks', payload: newTask } as SyncAction,
                        ...syncQueueToAdd
                      ]
                    : state.syncQueue,
                }));

                get().processSyncQueue();
              } else if (act.type === 'CREATE_ROUTINE' && act.payload?.title) {
                get().addRoutine(act.payload.title, act.payload.category || 'Health');
                actionFeedbacks.push(`Habit created: "${act.payload.title}" [${act.payload.category || 'Health'}]`);
              } else if (act.type === 'CREATE_SUBTASK' && act.payload?.taskId && act.payload?.title) {
                get().addSubtask(act.payload.taskId, act.payload.title);
                actionFeedbacks.push(`Subtask added: "${act.payload.title}"`);
              } else if (act.type === 'CREATE_TIME_LOG' && act.payload?.taskId && act.payload?.durationSeconds) {
                const durationSeconds = act.payload.durationSeconds;
                const logDesc = act.payload.description || 'Logged via AI Assistant';
                const startedAt = new Date(Date.now() - durationSeconds * 1000).toISOString();
                get().addManualTimeLog(act.payload.taskId, durationSeconds, logDesc, startedAt);

                const hrs = Math.floor(durationSeconds / 3600);
                const mins = Math.floor((durationSeconds % 3600) / 60);
                const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                actionFeedbacks.push(`Time log added: ${timeStr} ("${logDesc}")`);
              } else if (act.type === 'UPDATE_TASK' && act.payload?.taskId) {
                const { taskId, ...updates } = act.payload;
                const cleanedUpdates: Partial<Omit<Task, 'id' | 'created_at' | 'user_id'>> = {};
                if (updates.title !== undefined) cleanedUpdates.title = updates.title;
                if (updates.description !== undefined) cleanedUpdates.description = updates.description;
                if (updates.dueDate !== undefined) cleanedUpdates.dueDate = updates.dueDate;
                if (updates.priority !== undefined) cleanedUpdates.priority = updates.priority;
                if (updates.status !== undefined) cleanedUpdates.status = updates.status;

                get().updateTask(taskId, cleanedUpdates);
                const task = get().tasks.find((t) => t.id === taskId);
                actionFeedbacks.push(`Task updated: "${task ? task.title : taskId}"`);
              } else if (act.type === 'DELETE_TASK' && act.payload?.taskId) {
                const task = get().tasks.find((t) => t.id === act.payload.taskId);
                const title = task ? task.title : act.payload.taskId;
                get().deleteTask(act.payload.taskId);
                actionFeedbacks.push(`Task deleted: "${title}"`);
              } else if (act.type === 'COMPLETE_TASK' && act.payload?.taskId) {
                const task = get().tasks.find((t) => t.id === act.payload.taskId);
                const title = task ? task.title : act.payload.taskId;
                get().updateTaskStatus(act.payload.taskId, 'completed');
                actionFeedbacks.push(`Task marked completed: "${title}"`);
              } else if (act.type === 'UPDATE_ROUTINE' && act.payload?.routineId && act.payload?.title) {
                get().updateRoutine(act.payload.routineId, act.payload.title);
                actionFeedbacks.push(`Routine updated to: "${act.payload.title}"`);
              } else if (act.type === 'DELETE_ROUTINE' && act.payload?.routineId) {
                const routine = get().routines.find((r) => r.id === act.payload.routineId);
                const title = routine ? routine.title : act.payload.routineId;
                get().deleteRoutine(act.payload.routineId);
                actionFeedbacks.push(`Routine deleted: "${title}"`);
              } else if (act.type === 'COMPLETE_SUBTASK' && act.payload?.subtaskId) {
                const subtask = get().subtasks.find((st) => st.id === act.payload.subtaskId);
                if (subtask) {
                  if (!subtask.is_completed) {
                    get().toggleSubtask(act.payload.subtaskId);
                  }
                  actionFeedbacks.push(`Subtask marked completed: "${subtask.title}"`);
                } else {
                  actionFeedbacks.push(`Subtask not found: "${act.payload.subtaskId}"`);
                }
              } else if (act.type === 'CREATE_GOAL' && act.payload?.title) {
                get().addGoal(act.payload.title, act.payload.description || '', act.payload.targetDate);
                actionFeedbacks.push(`Goal created: "${act.payload.title}"`);
              }
            });
            set({ aiFeedback: actionFeedbacks });
          }

        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            console.log('Gemini request aborted by user');
            return;
          }
          console.error(err);
          const errMsg = err instanceof Error ? err.message : 'Check your API key and connection.';
          get().addMessageToActiveThread({
            id: `err-${crypto.randomUUID()}`,
            sender: 'agent',
            text: `Error calling Gemini: ${errMsg}`,
          });
        } finally {
          set({ isAiResponding: false, abortController: null });
        }
      },
    }),
    {
      name: 'goal-tracker-storage',
      partialize: (state) => ({
        user: state.user,
        isGuestMode: state.isGuestMode,
        lifestyleMode: state.lifestyleMode,
        routines: state.routines,
        routineLogs: state.routineLogs,
        tasks: state.tasks,
        subtasks: state.subtasks,
        taskTimeLogs: state.taskTimeLogs,
        goals: state.goals,
        activeTimer: state.activeTimer,
        syncQueue: state.syncQueue,
        chatThreads: state.chatThreads,
        activeThreadId: state.activeThreadId,
        selectedModel: state.selectedModel,
      }),
    }
  )
);
