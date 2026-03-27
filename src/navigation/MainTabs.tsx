import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../types';
import { Colors, FontSize } from '../constants/theme';
import { HomeScreen } from '../screens/HomeScreen';
import { SocialFeedScreen } from '../screens/SocialFeedScreen';
import { MyTicketsScreen } from '../screens/MyTicketsScreen';
import { DJsScreen } from '../screens/DJsScreen';
import { VenuesScreen } from '../screens/VenuesScreen';
import { PromoterDashboardScreen } from '../screens/PromoterDashboardScreen';
import { NearbyEventsScreen } from '../screens/NearbyEventsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const tabIcons: Record<keyof MainTabParamList, { active: string; inactive: string }> = {
  Home: { active: 'flame', inactive: 'flame-outline' },
  Nearby: { active: 'compass', inactive: 'compass-outline' },
  Feed: { active: 'images', inactive: 'images-outline' },
  MyTickets: { active: 'ticket', inactive: 'ticket-outline' },
  DJs: { active: 'headset', inactive: 'headset-outline' },
  Venues: { active: 'business', inactive: 'business-outline' },
  Promoter: { active: 'megaphone', inactive: 'megaphone-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingTop: 4,
          height: 85,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = tabIcons[route.name];
          const iconName = focused ? icons.active : icons.inactive;
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Nearby" component={NearbyEventsScreen} options={{ tabBarLabel: 'Nearby' }} />
      <Tab.Screen name="Feed" component={SocialFeedScreen} />
      <Tab.Screen
        name="MyTickets"
        component={MyTicketsScreen}
        options={{ tabBarLabel: 'Tickets' }}
      />
      <Tab.Screen name="DJs" component={DJsScreen} />
      <Tab.Screen name="Venues" component={VenuesScreen} />
      <Tab.Screen name="Promoter" component={PromoterDashboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
