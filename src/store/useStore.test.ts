import { beforeEach, beforeAll, describe, expect, it, vi } from 'vitest';

// 1. Polyfill crypto.randomUUID for Node environments where it might not be globally attached
if (typeof global !== 'undefined' && !global.crypto) {
  // @ts-ignore
  global.crypto = {
    randomUUID: () => 'test-uuid-1234'
  };
} else if (typeof global !== 'undefined' && !global.crypto.randomUUID) {
  // @ts-ignore
  global.crypto.randomUUID = () => 'test-uuid-1234';
}

// 2. Mock localStorage for Zustand persist middleware
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: any) => {
      store[key] = String(value);
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });
Object.defineProperty(globalThis, 'window', {
  value: {
    localStorage: localStorageMock,
    navigator: { onLine: true }
  },
  writable: true
});

// 3. Mock the Supabase client
vi.mock('../lib/supabase', () => {
  return {
    supabase: {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: { subscription: { unsubscribe: vi.fn() } }
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn().mockResolvedValue({ data: null, error: null }),
        delete: vi.fn().mockResolvedValue({ data: null, error: null }),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    },
  };
});

// Declare useStore dynamically
let useStore: any;


describe('Zustand State Store (useStore)', () => {
  beforeAll(async () => {
    const storeModule = await import('./useStore');
    useStore = storeModule.useStore;
  });

  beforeEach(() => {
    // Reset Zustand store to clean mock state before each test
    useStore.setState({
      user: null,
      isGuestMode: true, // Run in Guest Mode for local state testing
      routines: [],
      routineLogs: [],
      tasks: [],
      subtasks: [],
      taskTimeLogs: [],
      goals: [],
      activeTimer: null,
      syncQueue: [],
      isSyncing: false,
      isOnline: true,
      chatThreads: [],
      activeThreadId: null
    });
    localStorageMock.clear();
  });

  // --- Task Management Tests ---
  describe('Task Operations', () => {
    it('should add a new task with correct defaults', () => {
      const { addTask } = useStore.getState();
      addTask('Write Unit Tests', 'Ensure 100% logic coverage', undefined, 'HIGH');

      const tasks = useStore.getState().tasks;
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Write Unit Tests');
      expect(tasks[0].description).toBe('Ensure 100% logic coverage');
      expect(tasks[0].status).toBe('todo');
      expect(tasks[0].priority).toBe('HIGH');
    });

    it('should update task status', () => {
      const { addTask, updateTaskStatus } = useStore.getState();
      addTask('Test Status', 'Status Desc');
      const task = useStore.getState().tasks[0];

      updateTaskStatus(task.id, 'in_progress');
      expect(useStore.getState().tasks[0].status).toBe('in_progress');
    });

    it('should delete an existing task', () => {
      const { addTask, deleteTask } = useStore.getState();
      addTask('To Delete', 'Will be removed');
      const task = useStore.getState().tasks[0];

      deleteTask(task.id);
      expect(useStore.getState().tasks).toHaveLength(0);
    });
  });

  // --- Daily Routines Tests ---
  describe('Daily Routines Operations', () => {
    it('should add a routine successfully', () => {
      const { addRoutine } = useStore.getState();
      addRoutine('Read Books', 'Learning');

      const routines = useStore.getState().routines;
      expect(routines).toHaveLength(1);
      expect(routines[0].title).toBe('Read Books');
      expect(routines[0].category).toBe('Learning');
      expect(routines[0].is_active).toBe(true);
    });

    it('should toggle routine completion log (uncompleted -> completed -> uncompleted)', () => {
      const { addRoutine, toggleRoutine } = useStore.getState();
      addRoutine('Morning Routine', 'Mindset');
      const routine = useStore.getState().routines[0];
      const todayStr = new Date().toLocaleDateString('sv');

      // 1. Toggle ON: Creates completion log
      toggleRoutine(routine.id, todayStr);
      expect(useStore.getState().routineLogs).toHaveLength(1);
      expect(useStore.getState().routineLogs[0].routine_id).toBe(routine.id);
      expect(useStore.getState().routineLogs[0].completed_date).toBe(todayStr);

      // 2. Toggle OFF: Removes completion log
      toggleRoutine(routine.id, todayStr);
      expect(useStore.getState().routineLogs).toHaveLength(0);
    });
  });

  // --- Local-First Sync Queue Tests ---
  describe('Offline Queueing (Local-First)', () => {
    it('should queue a sync action when adding a task offline', () => {
      useStore.setState({ isOnline: false, isGuestMode: false, user: { id: 'usr-123', email: 'test@email.com' } });
      const { addTask } = useStore.getState();

      addTask('Offline Task', 'Created while offline');

      const tasks = useStore.getState().tasks;
      const queue = useStore.getState().syncQueue;

      // Local state is updated immediately
      expect(tasks).toHaveLength(1);
      // Sync action is queued
      expect(queue).toHaveLength(1);
      expect(queue[0].action).toBe('insert');
      expect(queue[0].table).toBe('tasks');
      expect(queue[0].payload.title).toBe('Offline Task');
    });
  });

  // --- Timer Operations Tests ---
  describe('Card Timer Operations', () => {
    it('should start a timer for a specific task', () => {
      const { addTask, startTimer } = useStore.getState();
      addTask('Timer Task', 'Testing active timers');
      const task = useStore.getState().tasks[0];

      startTimer(task.id);

      const activeTimer = useStore.getState().activeTimer;
      expect(activeTimer).not.toBeNull();
      expect(activeTimer?.taskId).toBe(task.id);
      expect(activeTimer?.startedAt).toBeDefined();
    });

    it('should stop timer and add log calculation', () => {
      const { addTask, startTimer, stopTimer } = useStore.getState();
      addTask('Timer Task 2', 'Testing timer logging');
      const task = useStore.getState().tasks[0];

      startTimer(task.id);
      
      // Simulate that the timer started 10 minutes ago
      const tenMinsAgo = new Date(Date.now() - 600000).toISOString();
      useStore.setState({
        activeTimer: { taskId: task.id, startedAt: tenMinsAgo }
      });

      stopTimer('Finished layout review');

      const logs = useStore.getState().taskTimeLogs;
      expect(logs).toHaveLength(1);
      expect(logs[0].task_id).toBe(task.id);
      expect(logs[0].description).toBe('Finished layout review');
      // Should calculate ~600 seconds duration (allow margin of 10s for test runtime delay)
      expect(logs[0].duration_seconds).toBeGreaterThanOrEqual(590);
      expect(logs[0].duration_seconds).toBeLessThanOrEqual(610);
      
      // Clears active timer state
      expect(useStore.getState().activeTimer).toBeNull();
    });
  });
});
