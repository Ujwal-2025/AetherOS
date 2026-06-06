import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Goal {
  id:          string;
  title:       string;
  targetDate:  string;
  tagKey:      string;  // e.g. "goal:learn-guitar-sep-2026"
  taskCount:   number;
  createdAt:   number;
}

interface GoalState {
  goals:        Goal[];
  addGoal:      (goal: Omit<Goal, 'createdAt'>) => void;
  removeGoal:   (id: string) => void;
  updateCount:  (id: string, count: number) => void;
}

export const useGoalStore = create<GoalState>()(
  persist(
    (set) => ({
      goals: [],

      addGoal: (goal) =>
        set((state) => ({
          goals: [...state.goals, { ...goal, createdAt: Date.now() }],
        })),

      removeGoal: (id) =>
        set((state) => ({ goals: state.goals.filter((g) => g.id !== id) })),

      updateCount: (id, count) =>
        set((state) => ({
          goals: state.goals.map((g) => g.id === id ? { ...g, taskCount: count } : g),
        })),
    }),
    {
      name:    'aetheros-goals',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
