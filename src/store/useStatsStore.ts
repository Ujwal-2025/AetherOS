import { create } from 'zustand';
import { DayStats } from '../types';

function getTodayString() { return new Date().toISOString().split('T')[0]; }
function last28Days(): string[] {
  const days: string[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}
const EMPTY_DAY = (date: string, streakDay = 0): DayStats =>
  ({ date, tasksCompleted: 0, xpEarned: 0, focusMinutes: 0, streakDay });

interface StatsState {
  days:             DayStats[];
  deepWorkSessions: number;
  recordActivity: (opts: {
    xpEarned:        number;
    tasksCompleted?: number;
    focusMinutes?:   number;
    streakDay:       number;
    isDeepWork?:     boolean;
  }) => void;
  getDay:         (date: string) => DayStats;
  getLast28Days:  () => DayStats[];
}

export const useStatsStore = create<StatsState>((set, get) => ({
  days:             [],
  deepWorkSessions: 0,

  recordActivity: ({ xpEarned, tasksCompleted = 0, focusMinutes = 0, streakDay, isDeepWork = false }) => {
    const today    = getTodayString();
    set((state) => {
      const existing = state.days.find((d) => d.date === today);
      const updated  = existing
        ? { ...existing, xpEarned: existing.xpEarned + xpEarned, tasksCompleted: existing.tasksCompleted + tasksCompleted, focusMinutes: existing.focusMinutes + focusMinutes, streakDay }
        : { date: today, xpEarned, tasksCompleted, focusMinutes, streakDay };
      return {
        days:             [...state.days.filter((d) => d.date !== today), updated],
        deepWorkSessions: state.deepWorkSessions + (isDeepWork ? 1 : 0),
      };
    });
  },

  getDay:        (date) => get().days.find((d) => d.date === date) ?? EMPTY_DAY(date),
  getLast28Days: () => last28Days().map((date) => get().days.find((d) => d.date === date) ?? EMPTY_DAY(date)),
}));
