import { FocusMode } from '../types';

export function modeFromDuration(minutes?: number): FocusMode {
  if (!minutes || minutes <= 25) return 'sprint';
  if (minutes <= 60)             return 'flow';
  return 'deep';
}
