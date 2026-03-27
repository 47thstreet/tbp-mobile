import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const NOTIF_PREF_KEY = 'tbp_notifications_enabled';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') {
    await SecureStore.setItemAsync(NOTIF_PREF_KEY, 'true');
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  const granted = status === 'granted';
  await SecureStore.setItemAsync(NOTIF_PREF_KEY, granted ? 'true' : 'false');
  return granted;
}

export async function areNotificationsEnabled(): Promise<boolean> {
  try {
    const val = await SecureStore.getItemAsync(NOTIF_PREF_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

export async function scheduleEventReminder(
  eventId: string,
  eventTitle: string,
  eventDate: Date,
  venue: string
): Promise<string | null> {
  const enabled = await areNotificationsEnabled();
  if (!enabled) return null;

  // Cancel any existing reminders for this event
  await cancelEventReminders(eventId);

  const identifiers: string[] = [];

  // 24h before
  const dayBefore = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
  if (dayBefore > new Date()) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Tomorrow Night',
        body: `${eventTitle} at ${venue} is tomorrow. Get ready!`,
        data: { eventId, type: 'reminder-24h' },
      },
      trigger: { type: SchedulableTriggerInputTypes.DATE, date: dayBefore },
    });
    identifiers.push(id);
  }

  // 2h before
  const twoHoursBefore = new Date(eventDate.getTime() - 2 * 60 * 60 * 1000);
  if (twoHoursBefore > new Date()) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Starting Soon',
        body: `${eventTitle} at ${venue} starts in 2 hours!`,
        data: { eventId, type: 'reminder-2h' },
      },
      trigger: { type: SchedulableTriggerInputTypes.DATE, date: twoHoursBefore },
    });
    identifiers.push(id);
  }

  // Store reminder IDs for this event
  await SecureStore.setItemAsync(
    `tbp_reminders_${eventId}`,
    JSON.stringify(identifiers)
  );

  return identifiers[0] || null;
}

export async function cancelEventReminders(eventId: string): Promise<void> {
  try {
    const stored = await SecureStore.getItemAsync(`tbp_reminders_${eventId}`);
    if (stored) {
      const ids: string[] = JSON.parse(stored);
      for (const id of ids) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
      await SecureStore.deleteItemAsync(`tbp_reminders_${eventId}`);
    }
  } catch {
    // Ignore errors
  }
}
