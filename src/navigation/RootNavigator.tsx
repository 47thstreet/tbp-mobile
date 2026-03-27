import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Colors } from '../constants/theme';
import { MainTabs } from './MainTabs';
import { EventDetailScreen } from '../screens/EventDetailScreen';
import { DJDetailScreen } from '../screens/DJDetailScreen';

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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
