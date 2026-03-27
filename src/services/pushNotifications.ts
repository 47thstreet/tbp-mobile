import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { API_BASE_URL, ENDPOINTS } from '../constants/api';
import type { PushNotificationData, PushNotificationType } from '../types';

const PUSH_TOKEN_KEY = 'tbp_push_token';
const TOKEN_KEY = 'tbp_auth_token';

async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function apiRequest(endpoint: string, body: object): Promise<void> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
}

/**
 * Get the Expo push token for this device.
 * Returns null if permissions are not granted or unavailable.
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8B5CF6',
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  });

  return tokenData.data;
}

/**
 * Register the device push token with the Kartis backend.
 * Stores the token locally to avoid duplicate registrations.
 */
export async function registerPushToken(): Promise<string | null> {
  const pushToken = await getExpoPushToken();
  if (!pushToken) return null;

  // Check if we already registered this token
  const storedToken = await SecureStore.getItemAsync(PUSH_TOKEN_KEY).catch(() => null);
  if (storedToken === pushToken) return pushToken;

  try {
    await apiRequest(ENDPOINTS.pushNotifications.register, {
      token: pushToken,
      platform: Platform.OS,
      deviceName: Platform.OS === 'ios' ? 'iPhone' : 'Android',
    });

    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, pushToken);
    return pushToken;
  } catch {
    // Registration failed -- will retry on next app launch
    return null;
  }
}

/**
 * Unregister the device push token from the Kartis backend.
 * Called on logout.
 */
export async function unregisterPushToken(): Promise<void> {
  const pushToken = await SecureStore.getItemAsync(PUSH_TOKEN_KEY).catch(() => null);
  if (!pushToken) return;

  try {
    await apiRequest(ENDPOINTS.pushNotifications.unregister, {
      token: pushToken,
    });
  } catch {
    // Best effort
  }

  await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY).catch(() => {});
}

/**
 * Parse notification data from a received push notification.
 */
export function parseNotificationData(
  notification: Notifications.Notification,
): PushNotificationData | null {
  const data = notification.request.content.data as Record<string, unknown> | undefined;
  if (!data?.type) return null;

  return {
    type: data.type as PushNotificationType,
    eventId: data.eventId as string | undefined,
    ticketId: data.ticketId as string | undefined,
    djId: data.djId as string | undefined,
    title: notification.request.content.title ?? undefined,
    body: notification.request.content.body ?? undefined,
  };
}

/**
 * Determine the deep link navigation target for a notification.
 * Returns the screen name and params for React Navigation.
 */
export function getDeepLinkTarget(
  data: PushNotificationData,
): { screen: string; params?: Record<string, unknown> } | null {
  switch (data.type) {
    case 'event_reminder_24h':
    case 'event_reminder_2h':
    case 'new_event_followed_dj':
    case 'friend_attending':
      if (data.eventId) {
        return { screen: 'EventDetail', params: { eventId: data.eventId } };
      }
      return null;

    case 'ticket_purchased':
      if (data.ticketId) {
        return {
          screen: 'TicketConfirmation',
          params: {
            ticketId: data.ticketId,
            eventTitle: data.title ?? '',
            ticketTypeName: '',
          },
        };
      }
      // Fall back to tickets tab
      return { screen: 'MainTabs' };

    default:
      return null;
  }
}
