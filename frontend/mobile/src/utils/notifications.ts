import * as Notifications from 'expo-notifications';

// Ensure notifications show up even if the app is somehow in the foreground
// (though we will cancel them explicitly when the timer is completed in foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request permission from the user to display push notifications.
 */
export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
}

/**
 * Schedule a local notification to fire when the timer ends.
 */
export async function scheduleTimerCompletion(title: string, secondsLeft: number) {
  // Always clear previously scheduled timer notifications first to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (secondsLeft <= 0) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Session Complete! 🎯',
      body: `Your ${title} focus session has finished. Great job!`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsLeft,
    },
  });
}

/**
 * Cancel any pending timer notifications.
 * Call this when the timer is paused, cancelled, or finishes while the app is in the foreground.
 */
export async function cancelTimerNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
