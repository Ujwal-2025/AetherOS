import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RoadmapPhase } from '../types';

interface WizardAnswers {
  goal:        string;
  targetDate:  string;
  weeklyHours: string;
}

const EMPTY_ANSWERS: WizardAnswers = { goal: '', targetDate: '', weeklyHours: '' };

interface RoadmapStore {
  hasPlan:       boolean;
  goalTitle:     string;
  goalId:        string;
  phases:        RoadmapPhase[];
  wizardAnswers: WizardAnswers;

  setRoadmap:       (goalId: string, goalTitle: string, phases: RoadmapPhase[]) => void;
  setWizardAnswers: (answers: WizardAnswers) => void;
  updatePhase:      (phaseId: string, updated: Partial<RoadmapPhase>) => void;
  clearRoadmap:     () => void;
}

export const useRoadmapStore = create<RoadmapStore>()(
  persist(
    (set) => ({
      hasPlan:       false,
      goalTitle:     '',
      goalId:        '',
      phases:        [],
      wizardAnswers: EMPTY_ANSWERS,

      setRoadmap: (goalId, goalTitle, phases) =>
        set({ hasPlan: true, goalId, goalTitle, phases }),

      setWizardAnswers: (answers) => set({ wizardAnswers: answers }),

      updatePhase: (phaseId, updated) =>
        set((s) => ({
          phases: s.phases.map((p) => (p.id === phaseId ? { ...p, ...updated } : p)),
        })),

      clearRoadmap: () =>
        set({ hasPlan: false, goalTitle: '', goalId: '', phases: [], wizardAnswers: EMPTY_ANSWERS }),
    }),
    {
      name:    'aetheros-roadmap',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
