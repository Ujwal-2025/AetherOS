import { create } from 'zustand';
import { TaskCategory } from '../types';

export interface DailyChallenge {
  date:               string;
  title:              string;
  description:        string;
  targetMinutes:      number;
  bonusXP:            number;
  category:           TaskCategory;
  isComplete:         boolean;
  focusMinutesLogged: number;
}

const CHALLENGE_POOL: Omit<DailyChallenge, 'date' | 'isComplete' | 'focusMinutesLogged'>[] = [
  { title: 'Iron Focus',       description: 'Log 90 minutes of uninterrupted Deep Work.',        targetMinutes: 90,  bonusXP: 800,  category: 'work' },
  { title: 'Sprint Gauntlet',  description: 'Complete three Sprint sessions back-to-back.',       targetMinutes: 75,  bonusXP: 600,  category: 'work' },
  { title: 'Mind & Body',      description: 'Complete a health task and log 30 min of focus.',    targetMinutes: 30,  bonusXP: 450,  category: 'health' },
  { title: 'Scholar Mode',     description: 'Spend 60 minutes on a learning task.',               targetMinutes: 60,  bonusXP: 550,  category: 'learning' },
  { title: 'System Overload',  description: 'Complete 4 tasks before 6 PM.',                     targetMinutes: 60,  bonusXP: 700,  category: 'work' },
  { title: 'Ghost Protocol',   description: 'Complete all your tasks before noon.',               targetMinutes: 45,  bonusXP: 900,  category: 'personal' },
  { title: 'Flow Architect',   description: 'Log a full 60-minute Flow State session.',           targetMinutes: 60,  bonusXP: 500,  category: 'work' },
  { title: 'Endurance Test',   description: 'Accumulate 2 hours of total focus time today.',      targetMinutes: 120, bonusXP: 1000, category: 'work' },
  { title: 'Rapid Fire',       description: 'Complete 5 tasks in a single day.',                  targetMinutes: 50,  bonusXP: 650,  category: 'personal' },
  { title: 'Deep Dive',        description: 'Complete one critical-priority task with Deep Work.', targetMinutes: 90,  bonusXP: 750,  category: 'work' },
  { title: 'Renaissance',      description: 'Complete tasks from 3 different categories.',         targetMinutes: 60,  bonusXP: 600,  category: 'personal' },
  { title: 'Power Hour',       description: 'Log exactly 60 minutes of Flow State.',              targetMinutes: 60,  bonusXP: 500,  category: 'work' },
  { title: 'The Grind',        description: 'Log 45+ minutes and complete 3 tasks.',              targetMinutes: 45,  bonusXP: 550,  category: 'work' },
  { title: 'Knowledge Seeker', description: 'Spend 90 minutes on learning or personal development.', targetMinutes: 90, bonusXP: 700, category: 'learning' },
];

function getTodayString() { return new Date().toISOString().split('T')[0]; }
function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000);
}

function getTodayChallenge(): DailyChallenge {
  const idx = getDayOfYear() % CHALLENGE_POOL.length;
  return { ...CHALLENGE_POOL[idx], date: getTodayString(), isComplete: false, focusMinutesLogged: 0 };
}

interface DailyChallengeState {
  challenge:      DailyChallenge;
  logFocusMinutes: (minutes: number) => void;
  markComplete:   () => void;
  refreshIfNewDay: () => void;
}

export const useDailyChallengeStore = create<DailyChallengeState>((set, get) => ({
  challenge: getTodayChallenge(),

  logFocusMinutes: (minutes) => {
    const { challenge } = get();
    if (challenge.isComplete) return;
    if (challenge.date !== getTodayString()) { set({ challenge: getTodayChallenge() }); return; }
    const newLogged = challenge.focusMinutesLogged + minutes;
    set({ challenge: { ...challenge, focusMinutesLogged: newLogged, isComplete: newLogged >= challenge.targetMinutes } });
  },

  markComplete: () =>
    set((s) => ({ challenge: { ...s.challenge, isComplete: true } })),

  refreshIfNewDay: () => {
    if (get().challenge.date !== getTodayString()) set({ challenge: getTodayChallenge() });
  },
}));
