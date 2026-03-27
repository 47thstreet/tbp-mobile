import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Colors } from '../constants/theme';
import { MainTabs } from './MainTabs';
import { EventDetailScreen } from '../screens/EventDetailScreen';
import { DJDetailScreen } from '../screens/DJDetailScreen';
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
