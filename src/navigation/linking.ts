import * as Linking from 'expo-linking';
import { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList } from '../types';

const prefix = Linking.createURL('/');

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    prefix,
    'tbp://',
    'https://tbpmobile.com',
    'https://www.tbpmobile.com',
    'https://tbp.group',
  ],
  config: {
    screens: {
      EventDetail: {
        path: 'event/:eventId',
      },
      DJDetail: {
        path: 'dj/:djId',
      },
      Checkout: {
        path: 'checkout/:eventId/:ticketTypeId/:ticketTypeName/:price',
        parse: {
          price: Number,
        },
      },
      MainTabs: {
        screens: {
          MyTickets: 'tickets',
          Home: 'discover',
          Feed: 'feed',
          DJs: 'djs',
          Venues: 'venues',
          Nearby: 'nearby',
          Profile: 'profile',
          Promoter: 'promoter',
        },
      },
    },
  },
};

/**
 * Parse a deep link URL and return the navigation action.
 * Useful for handling links that arrive while the app is already open.
 */
export function parseDeepLink(url: string): { screen: string; params?: Record<string, string> } | null {
  const parsed = Linking.parse(url);
  const path = parsed.path || '';

  const eventMatch = path.match(/^event\/(.+)$/);
  if (eventMatch) {
    return { screen: 'EventDetail', params: { eventId: eventMatch[1] } };
  }

  const djMatch = path.match(/^dj\/(.+)$/);
  if (djMatch) {
    return { screen: 'DJDetail', params: { djId: djMatch[1] } };
  }

  const tabRoutes: Record<string, string> = {
    tickets: 'MyTickets',
    discover: 'Home',
    feed: 'Feed',
    djs: 'DJs',
    venues: 'Venues',
    nearby: 'Nearby',
    profile: 'Profile',
  };

  if (tabRoutes[path]) {
    return { screen: 'MainTabs', params: { screen: tabRoutes[path] } };
  }

  return null;
}
