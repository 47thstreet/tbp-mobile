import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import type { EventSubscription } from 'expo-modules-core';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import {
  registerPushToken,
  parseNotificationData,
  getDeepLinkTarget,
} from '../services/pushNotifications';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

/**
 * Hook that registers push notifications and handles deep linking
 * when the user taps a notification.
 *
 * Must be used inside a NavigationContainer.
 */
export function usePushNotifications(isAuthenticated: boolean): void {
  const navigation = useNavigation<Navigation>();
  const responseListener = useRef<EventSubscription>(undefined);
  const receivedListener = useRef<EventSubscription>(undefined);

  // Register push token when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    registerPushToken().catch(() => {});
  }, [isAuthenticated]);

  // Handle notification taps (deep linking)
  useEffect(() => {
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = parseNotificationData(response.notification);
        if (!data) return;

        const target = getDeepLinkTarget(data);
        if (!target) return;

        try {
          (navigation.navigate as any)(target.screen, target.params);
        } catch {
          // Navigation not ready or screen not available
        }
      });

    // Handle notifications received while app is in foreground
    receivedListener.current =
      Notifications.addNotificationReceivedListener(() => {
        // Notification is automatically displayed by the handler in notifications.ts
      });

    return () => {
      responseListener.current?.remove();
      receivedListener.current?.remove();
    };
  }, [navigation]);

  // Handle notification that launched the app (cold start)
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;

      const data = parseNotificationData(response.notification);
      if (!data) return;

      const target = getDeepLinkTarget(data);
      if (!target) return;

      // Small delay to ensure navigation is ready
      setTimeout(() => {
        try {
          (navigation.navigate as any)(target.screen, target.params);
        } catch {
          // Navigation not ready
        }
      }, 500);
    });
  }, [navigation]);
}
