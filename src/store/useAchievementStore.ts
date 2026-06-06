import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Rank } from '../types';
import { Ionicons } from '@expo/vector-icons';

export type AchievementCategory = 'streak' | 'focus' | 'rank' | 'tasks' | 'special';

export interface Achievement {
  id:          string;
  title:       string;
  description: string;
  icon:        keyof typeof Ionicons.glyphMap;
  xpBonus:     number;
  category:    AchievementCategory;
  unlockedAt?: number;
}

export interface AchievementCheckInput {
  totalTasks:       number;
  currentStreak:    number;
  longestStreak:    number;
  rank:             Rank;
  focusMinutes:     number;
  todayTasks:       number;
  completionHour?:  number;
  deepWorkSessions: number;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_blood',    title: 'First Blood',    description: 'Complete your very first quest.',             icon: 'flash-outline',              xpBonus: 50,   category: 'tasks' },
  { id: 'speed_demon',    title: 'Speed Demon',    description: 'Complete 5 tasks in a single day.',           icon: 'rocket-outline',             xpBonus: 300,  category: 'tasks' },
  { id: 'century',        title: 'Century',        description: 'Complete 100 total quests.',                  icon: 'trophy-outline',             xpBonus: 500,  category: 'tasks' },
  { id: 'double_century', title: 'Unstoppable',    description: 'Complete 250 total quests.',                  icon: 'medal-outline',              xpBonus: 1000, category: 'tasks' },
  { id: 'ghost_protocol', title: 'Ghost Protocol', description: 'Complete all your tasks before 9 AM.',        icon: 'moon-outline',               xpBonus: 150,  category: 'special' },
  { id: 'streak_3',       title: 'On a Roll',      description: 'Maintain a 3-day streak.',                    icon: 'flame-outline',              xpBonus: 100,  category: 'streak' },
  { id: 'iron_will',      title: 'Iron Will',      description: 'Maintain a 7-day streak.',                    icon: 'shield-outline',             xpBonus: 200,  category: 'streak' },
  { id: 'streak_14',      title: 'Fortnight',      description: 'Maintain a 14-day streak.',                   icon: 'shield-checkmark-outline',   xpBonus: 400,  category: 'streak' },
  { id: 'unbroken',       title: 'Unbroken',       description: 'Maintain a 30-day streak.',                   icon: 'star-outline',               xpBonus: 1000, category: 'streak' },
  { id: 'legendary',      title: 'Legendary',      description: 'Maintain a 100-day streak.',                  icon: 'diamond-outline',            xpBonus: 5000, category: 'streak' },
  { id: 'first_focus',    title: 'In the Zone',    description: 'Complete your first focus session.',          icon: 'timer-outline',              xpBonus: 50,   category: 'focus' },
  { id: 'deep_diver',     title: 'Deep Diver',     description: 'Complete 3 Deep Work sessions (90 min each).', icon: 'skull-outline',            xpBonus: 500,  category: 'focus' },
  { id: 'focus_marathon', title: 'Focus Marathon', description: 'Accumulate 10 hours of total focus time.',   icon: 'hourglass-outline',          xpBonus: 600,  category: 'focus' },
  { id: 'focus_legend',   title: 'Focus Legend',   description: 'Accumulate 50 hours of total focus time.',   icon: 'infinite-outline',           xpBonus: 2000, category: 'focus' },
  { id: 'rank_d',         title: 'Awakened',       description: 'Reach D-Rank.',                               icon: 'arrow-up-circle-outline',    xpBonus: 100,  category: 'rank' },
  { id: 'rank_c',         title: 'Rising Hunter',  description: 'Reach C-Rank.',                               icon: 'trending-up-outline',        xpBonus: 200,  category: 'rank' },
  { id: 'rank_b',         title: 'Power Surge',    description: 'Reach B-Rank.',                               icon: 'flash',                      xpBonus: 350,  category: 'rank' },
  { id: 'rank_a',         title: 'Elite Hunter',   description: 'Reach A-Rank.',                               icon: 'ribbon-outline',             xpBonus: 600,  category: 'rank' },
  { id: 'rank_s',         title: 'S-Class',        description: 'Reach S-Rank.',                               icon: 'nuclear-outline',            xpBonus: 1000, category: 'rank' },
  { id: 'rank_ss',        title: 'Transcendent',   description: 'Reach SS-Rank.',                              icon: 'planet-outline',             xpBonus: 2000, category: 'rank' },
  { id: 'rank_sss',       title: 'The Monarch',    description: 'Reach SSS-Rank. There is none above you.',   icon: 'skull',                      xpBonus: 5000, category: 'rank' },
];

interface AchievementState {
  achievements:        Achievement[];
  pendingUnlockQueue:  Achievement[];
  checkAchievements:   (input: AchievementCheckInput) => void;
  dequeueUnlock:       () => void;
  getUnlocked:         () => Achievement[];
  getLocked:           () => Achievement[];
}

export const useAchievementStore = create<AchievementState>()(
  persist(
  (set, get) => ({
  achievements:       ACHIEVEMENTS,
  pendingUnlockQueue: [],

  checkAchievements: (input) => {
    const { achievements } = get();
    const now = Date.now();
    const toUnlock: Achievement[] = [];
    const RANK_ORDER: Rank[] = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
    const rankIdx = RANK_ORDER.indexOf(input.rank);

    const check = (id: string, condition: boolean) => {
      const ach = achievements.find((a) => a.id === id);
      if (!ach || ach.unlockedAt) return;
      if (condition) toUnlock.push(ach);
    };

    check('first_blood',    input.totalTasks >= 1);
    check('speed_demon',    input.todayTasks >= 5);
    check('century',        input.totalTasks >= 100);
    check('double_century', input.totalTasks >= 250);
    check('ghost_protocol', input.todayTasks >= 1 && (input.completionHour ?? 24) < 9);
    check('streak_3',   input.currentStreak >= 3);
    check('iron_will',  input.currentStreak >= 7);
    check('streak_14',  input.currentStreak >= 14);
    check('unbroken',   input.currentStreak >= 30);
    check('legendary',  input.currentStreak >= 100);
    check('first_focus',    input.focusMinutes >= 1);
    check('deep_diver',     input.deepWorkSessions >= 3);
    check('focus_marathon', input.focusMinutes >= 600);
    check('focus_legend',   input.focusMinutes >= 3000);
    check('rank_d',   rankIdx >= 1);
    check('rank_c',   rankIdx >= 2);
    check('rank_b',   rankIdx >= 3);
    check('rank_a',   rankIdx >= 4);
    check('rank_s',   rankIdx >= 5);
    check('rank_ss',  rankIdx >= 6);
    check('rank_sss', rankIdx >= 7);

    if (!toUnlock.length) return;

    const updatedAchievements = achievements.map((a) =>
      toUnlock.some((u) => u.id === a.id) ? { ...a, unlockedAt: now } : a
    );
    const newlyUnlocked = updatedAchievements.filter((a) => toUnlock.some((u) => u.id === a.id));
    set((state) => ({
      achievements:       updatedAchievements,
      pendingUnlockQueue: [...state.pendingUnlockQueue, ...newlyUnlocked],
    }));
  },

  dequeueUnlock: () => set((state) => ({ pendingUnlockQueue: state.pendingUnlockQueue.slice(1) })),
  getUnlocked: () => get().achievements.filter((a) => !!a.unlockedAt),
  getLocked:   () => get().achievements.filter((a) => !a.unlockedAt),
  }),
  {
    name:       'aetheros-achievements',
    storage:    createJSONStorage(() => AsyncStorage),
    partialize: (state) => ({ achievements: state.achievements }),
  }
));
