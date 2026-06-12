import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, Rank } from '../types';
import { getRankFromXP, getRankProgress, getXPToNextRank } from '../utils/xp';
import { getTodayString, isToday, isYesterday } from '../utils/date';

const COMBO_TIMEOUT_MS = 10 * 60 * 1000;
const COMBO_STEP       = 0.10;
const COMBO_CAP        = 2.5;

interface UserState {
  profile:       UserProfile;
  rank:          Rank;
  rankProgress:  number;
  xpToNextRank:  number;
  pendingRankUp: Rank | null;
  comboCount:          number;
  comboMultiplier:     number;
  lastCompletionTime:  number;
  streakShields:       number;
  hasOnboarded:        boolean;

  addXP:                   (amount: number) => void;
  checkAndUpdateStreak:    () => void;
  setDisplayName:          (name: string) => void;
  incrementTasksCompleted: () => void;
  addFocusMinutes:         (minutes: number) => void;
  clearRankUp:             () => void;
  incrementCombo:          () => void;
  resetCombo:              () => void;
  consumeStreakShield:     () => boolean;
  addStreakShield:         () => void;
  setOnboarded:            () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  uid:               'local',
  displayName:       'Hunter',
  totalXP:           0,
  rank:              'E',
  currentStreak:     0,
  longestStreak:     0,
  lastActiveDate:    '',
  tasksCompleted:    0,
  focusMinutesTotal: 0,
  createdAt:         Date.now(),
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile:      DEFAULT_PROFILE,
      rank:         getRankFromXP(DEFAULT_PROFILE.totalXP),
      rankProgress: getRankProgress(DEFAULT_PROFILE.totalXP),
      xpToNextRank: getXPToNextRank(DEFAULT_PROFILE.totalXP),

      pendingRankUp:      null,
      comboCount:         0,
      comboMultiplier:    1.0,
      lastCompletionTime: 0,
      streakShields:      0,
      hasOnboarded:       false,

      addXP: (amount) => {
        set((state) => {
          const oldRank  = state.rank;
          const newXP    = state.profile.totalXP + amount;
          const newRank  = getRankFromXP(newXP);
          const rankedUp = newRank !== oldRank;
          return {
            profile:      { ...state.profile, totalXP: newXP, rank: newRank },
            rank:         newRank,
            rankProgress: getRankProgress(newXP),
            xpToNextRank: getXPToNextRank(newXP),
            pendingRankUp: rankedUp ? newRank : state.pendingRankUp,
          };
        });
      },

      clearRankUp: () => set({ pendingRankUp: null }),

      checkAndUpdateStreak: () => {
        const { profile } = get();
        const today = getTodayString();
        if (isToday(profile.lastActiveDate)) return;

        const continuesStreak = isYesterday(profile.lastActiveDate);

        if (!continuesStreak && get().streakShields > 0) {
          set((state) => ({
            profile: { ...state.profile, lastActiveDate: today },
            streakShields: Math.max(0, state.streakShields - 1),
          }));
          return;
        }

        const newStreak    = continuesStreak ? profile.currentStreak + 1 : 1;
        const earnedShield = continuesStreak && newStreak % 7 === 0;
        set((state) => ({
          profile: {
            ...state.profile,
            currentStreak:  newStreak,
            longestStreak:  Math.max(newStreak, state.profile.longestStreak),
            lastActiveDate: today,
          },
          streakShields: earnedShield ? state.streakShields + 1 : state.streakShields,
        }));
      },

      incrementCombo: () => {
        const now = Date.now();
        const { lastCompletionTime, comboCount } = get();
        const expired = now - lastCompletionTime > COMBO_TIMEOUT_MS;
        if (expired) {
          set({ comboCount: 1, comboMultiplier: 1.0, lastCompletionTime: now });
        } else {
          const newCount      = comboCount + 1;
          const newMultiplier = Math.min(1.0 + (newCount - 1) * COMBO_STEP, COMBO_CAP);
          set({ comboCount: newCount, comboMultiplier: newMultiplier, lastCompletionTime: now });
        }
      },

      resetCombo: () => set({ comboCount: 0, comboMultiplier: 1.0, lastCompletionTime: 0 }),

      setDisplayName: (name) =>
        set((state) => ({ profile: { ...state.profile, displayName: name } })),

      incrementTasksCompleted: () =>
        set((state) => ({
          profile: { ...state.profile, tasksCompleted: state.profile.tasksCompleted + 1 },
        })),

      addFocusMinutes: (minutes) =>
        set((state) => ({
          profile: { ...state.profile, focusMinutesTotal: state.profile.focusMinutesTotal + minutes },
        })),

      consumeStreakShield: () => {
        const { streakShields } = get();
        if (streakShields <= 0) return false;
        set((state) => ({ streakShields: state.streakShields - 1 }));
        return true;
      },

      addStreakShield: () =>
        set((state) => ({ streakShields: state.streakShields + 1 })),

      setOnboarded: () => set({ hasOnboarded: true }),
    }),
    {
      name:    'aetheros-user',
      storage: createJSONStorage(() => AsyncStorage),
      // pendingRankUp not persisted — ceremony shouldn't replay on refresh
      // combo not persisted — intentionally resets on app restart
      partialize: (state) => ({
        profile:       state.profile,
        rank:          state.rank,
        rankProgress:  state.rankProgress,
        xpToNextRank:  state.xpToNextRank,
        streakShields: state.streakShields,
        hasOnboarded:  state.hasOnboarded,
      }),
    }
  )
);
