import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { MainTabs } from './MainTabs';
import { EventDetailScreen } from '../screens/EventDetailScreen';
import { DJDetailScreen } from '../screens/DJDetailScreen';
import { VenueDetailScreen } from '../screens/VenueDetailScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { TicketConfirmationScreen } from '../screens/TicketConfirmationScreen';
import { NearbyEventsScreen } from '../screens/NearbyEventsScreen';
import { NotificationPrefsScreen } from '../screens/NotificationPrefsScreen';
import { FullScreenTicketScreen } from '../screens/FullScreenTicketScreen';
import { OnboardingScreen, hasCompletedOnboarding } from '../screens/OnboardingScreen';
import { LoadingScreen } from '../components/LoadingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const DarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.text,
    border: Colors.border,
    notification: Colors.primary,
  },
};

function PushNotificationHandler() {
  const { isAuthenticated } = useAuth();
  usePushNotifications(isAuthenticated);
  return null;
}

export function RootNavigator() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    hasCompletedOnboarding().then((done) => setShowOnboarding(!done));
  }, []);

  if (showOnboarding === null) return <LoadingScreen />;

  if (showOnboarding) {
    return (
      <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
    );
  }

  return (
    <NavigationContainer theme={DarkTheme}>
      <PushNotificationHandler />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.text,
          headerTitleStyle: { fontWeight: '600' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EventDetail"
          component={EventDetailScreen}
          options={{ title: 'Event', headerTransparent: true, headerTitle: '' }}
        />
        <Stack.Screen
          name="DJDetail"
          component={DJDetailScreen}
          options={{ title: 'DJ', headerTransparent: true, headerTitle: '' }}
        />
        <Stack.Screen
          name="VenueDetail"
          component={VenueDetailScreen}
          options={{ title: 'Venue', headerTransparent: true, headerTitle: '' }}
        />
        <Stack.Screen
          name="Checkout"
          component={CheckoutScreen}
          options={{ title: 'Checkout', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="TicketConfirmation"
          component={TicketConfirmationScreen}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="NearbyEvents"
          component={NearbyEventsScreen}
          options={{ title: 'Nearby Events', headerTransparent: true, headerTitle: '' }}
        />
        <Stack.Screen
          name="NotificationPrefs"
          component={NotificationPrefsScreen}
          options={{ title: 'Notifications' }}
        />
        <Stack.Screen
          name="FullScreenTicket"
          component={FullScreenTicketScreen}
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
