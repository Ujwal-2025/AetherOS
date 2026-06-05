import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, TaskPriority, TaskCategory, RecurrenceType } from '../types';
import { calcTaskXP, XP_BY_PRIORITY } from '../utils/xp';
import { getTodayString } from '../utils/date';

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const NOW = Date.now();

const SEED_TASKS: Task[] = [
  {
    id: 'seed-1',
    title: 'Review system architecture documentation',
    priority: 'critical',
    status: 'pending',
    category: 'work',
    xpReward: XP_BY_PRIORITY.critical,
    recurrence: 'none',
    estimatedMinutes: 90,
    createdAt: NOW,
    tags: ['architecture'],
  },
  {
    id: 'seed-2',
    title: 'Complete morning workout',
    priority: 'high',
    status: 'pending',
    category: 'health',
    xpReward: XP_BY_PRIORITY.high,
    recurrence: 'daily',
    estimatedMinutes: 45,
    createdAt: NOW,
    tags: ['fitness'],
  },
  {
    id: 'seed-3',
    title: 'Deploy authentication service',
    priority: 'high',
    status: 'pending',
    category: 'work',
    xpReward: XP_BY_PRIORITY.high,
    recurrence: 'none',
    estimatedMinutes: 60,
    createdAt: NOW,
    tags: ['backend'],
  },
  {
    id: 'seed-4',
    title: 'Read 30 pages of technical book',
    priority: 'medium',
    status: 'pending',
    category: 'learning',
    xpReward: XP_BY_PRIORITY.medium,
    recurrence: 'daily',
    estimatedMinutes: 30,
    createdAt: NOW,
    tags: ['reading'],
  },
  {
    id: 'seed-5',
    title: 'Update API documentation',
    priority: 'low',
    status: 'pending',
    category: 'work',
    xpReward: XP_BY_PRIORITY.low,
    recurrence: 'none',
    estimatedMinutes: 25,
    createdAt: NOW,
    tags: ['docs'],
  },
];

// ─── Store ────────────────────────────────────────────────────────────────────

type AddTaskInput = Omit<Task, 'id' | 'status' | 'createdAt'>;

interface TaskState {
  tasks: Task[];

  addTask:      (data: AddTaskInput) => void;
  completeTask: (id: string, streak: number) => number;
  failTask:     (id: string) => void;
  deleteTask:   (id: string) => void;
  updateTask:   (id: string, data: Partial<Task>) => void;

  todaysTasks:         () => Task[];
  completedToday:      () => Task[];
  completionRateToday: () => number;
  xpEarnedToday:       () => number;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: SEED_TASKS,

      addTask: (data) => {
        const task: Task = { ...data, id: genId(), status: 'pending', createdAt: Date.now() };
        set((state) => ({ tasks: [...state.tasks, task] }));
      },

      completeTask: (id, streak) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return 0;
        const xp = calcTaskXP(task.priority, streak);
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, status: 'completed', completedAt: Date.now(), xpReward: xp } : t
          ),
        }));
        return xp;
      },

      failTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, status: 'failed' } : t)),
        })),

      deleteTask: (id) =>
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),

      updateTask: (id, data) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
        })),

      // ── Derived ──────────────────────────────────────────────────────────────

      todaysTasks: () => {
        const today = getTodayString();
        return get().tasks.filter((t) => {
          if (t.status === 'failed') return false;
          const createdToday = new Date(t.createdAt).toISOString().split('T')[0] === today;
          const dueToday     = t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] === today : false;
          const isDaily      = t.recurrence === 'daily';
          return createdToday || dueToday || isDaily || t.status === 'completed';
        });
      },

      completedToday: () => {
        return get().tasks.filter((t) => {
          if (t.status !== 'completed' || !t.completedAt) return false;
          return new Date(t.completedAt).toISOString().split('T')[0] === getTodayString();
        });
      },

      completionRateToday: () => {
        const today     = get().todaysTasks();
        const completed = today.filter((t) => t.status === 'completed');
        if (today.length === 0) return 0;
        return completed.length / today.length;
      },

      xpEarnedToday: () =>
        get().completedToday().reduce((sum, t) => sum + t.xpReward, 0),
    }),
    {
      name:       'aetheros-tasks',
      partialize: (state) => ({ tasks: state.tasks }),
    }
  )
);
