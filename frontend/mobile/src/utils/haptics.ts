/**
 * Platform-safe haptics wrapper.
 * All functions are no-ops on web — no import errors, no crashes.
 */
import { Platform } from 'react-native';

let Haptics: typeof import('expo-haptics') | null = null;
if (Platform.OS !== 'web') {
  Haptics = require('expo-haptics');
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const haptics = {
  light: () => {
    Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  medium: () => {
    Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  heavy: () => {
    Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },
  success: () => {
    Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  error: () => {
    Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
  warning: () => {
    Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
  rankUp: async () => {
    if (!Haptics) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await sleep(100);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await sleep(100);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await sleep(200);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  focusComplete: async () => {
    if (!Haptics) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await sleep(160);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await sleep(160);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
};
