import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WeeklyBoss {
  weekStart:          string;
  title:              string;
  description:        string;
  targetMinutes:      number;
  targetTasks:        number;
  bonusXP:            number;
  focusMinutesLogged: number;
  tasksCompleted:     number;
  isComplete:         boolean;
}

const BOSS_POOL: Omit<WeeklyBoss, 'weekStart' | 'focusMinutesLogged' | 'tasksCompleted' | 'isComplete'>[] = [
  { title: 'THE MARATHON',    description: 'Log 5 hours of total focus time this week.',        targetMinutes: 300, targetTasks: 0,  bonusXP: 5000 },
  { title: 'RELENTLESS',      description: 'Complete 20 quests before the week ends.',          targetMinutes: 0,   targetTasks: 20, bonusXP: 4500 },
  { title: 'IRON DISCIPLINE', description: 'Log 4 hours of focus AND complete 15 quests.',      targetMinutes: 240, targetTasks: 15, bonusXP: 6000 },
  { title: 'DEEP PROTOCOL',   description: 'Accumulate 8 hours of deep focus sessions.',        targetMinutes: 480, targetTasks: 0,  bonusXP: 7000 },
  { title: 'THE GRIND',       description: 'Complete 30 tasks across all 4 categories.',        targetMinutes: 0,   targetTasks: 30, bonusXP: 5500 },
];

function getWeekStartString(): string {
  const now  = new Date();
  const day  = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon  = new Date(now);
  mon.setDate(now.getDate() + diff);
  return mon.toISOString().split('T')[0];
}

function getWeekOfYear(): number {
  const now   = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now.getTime() - start.getTime()) / 86_400_000 + start.getDay() + 1) / 7);
}

function getCurrentBoss(): WeeklyBoss {
  const pool = BOSS_POOL[getWeekOfYear() % BOSS_POOL.length];
  return { ...pool, weekStart: getWeekStartString(), focusMinutesLogged: 0, tasksCompleted: 0, isComplete: false };
}

function checkComplete(boss: WeeklyBoss): boolean {
  const minutesDone = boss.targetMinutes === 0 || boss.focusMinutesLogged >= boss.targetMinutes;
  const tasksDone   = boss.targetTasks   === 0 || boss.tasksCompleted     >= boss.targetTasks;
  return minutesDone && tasksDone;
}

interface WeeklyBossState {
  boss:              WeeklyBoss;
  logFocusMinutes:   (minutes: number) => number; // returns bonusXP if just defeated, else 0
  logTaskCompletion: () => number;                // returns bonusXP if just defeated, else 0
  refreshIfNewWeek:  () => void;
}

export const useWeeklyBossStore = create<WeeklyBossState>()(
  persist(
    (set, get) => ({
      boss: getCurrentBoss(),

      logFocusMinutes: (minutes) => {
        const { boss } = get();
        if (boss.isComplete) return 0;
        const updated  = { ...boss, focusMinutesLogged: boss.focusMinutesLogged + minutes };
        const justDone = checkComplete(updated);
        set({ boss: { ...updated, isComplete: justDone } });
        return justDone ? updated.bonusXP : 0;
      },

      logTaskCompletion: () => {
        const { boss } = get();
        if (boss.isComplete) return 0;
        const updated  = { ...boss, tasksCompleted: boss.tasksCompleted + 1 };
        const justDone = checkComplete(updated);
        set({ boss: { ...updated, isComplete: justDone } });
        return justDone ? updated.bonusXP : 0;
      },

      refreshIfNewWeek: () => {
        if (get().boss.weekStart !== getWeekStartString()) {
          set({ boss: getCurrentBoss() });
        }
      },
    }),
    {
      name:       'aetheros-weekly-boss',
      storage:    createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ boss: state.boss }),
    }
  )
);
