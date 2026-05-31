import { create } from 'zustand';
import { FocusMode } from '../types';

interface FocusState {
  pendingTaskId:    string | null;
  pendingTaskTitle: string | null;
  autoStartMode:    FocusMode | null;

  setPendingTask:  (id: string, title: string, mode?: FocusMode) => void;
  clearPendingTask: () => void;
}

export const useFocusStore = create<FocusState>((set) => ({
  pendingTaskId:    null,
  pendingTaskTitle: null,
  autoStartMode:    null,

  setPendingTask: (id, title, mode = 'flow') =>
    set({ pendingTaskId: id, pendingTaskTitle: title, autoStartMode: mode }),

  clearPendingTask: () =>
    set({ pendingTaskId: null, pendingTaskTitle: null, autoStartMode: null }),
}));
