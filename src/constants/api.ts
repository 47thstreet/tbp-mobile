import { Platform } from 'react-native';

const KARTIS_URL = process.env.EXPO_PUBLIC_KARTIS_URL || 'http://localhost:3031';

const API_BASE = Platform.select({
  android: KARTIS_URL.replace('localhost', '10.0.2.2'),
  default: KARTIS_URL,
});

export const API_BASE_URL = API_BASE;

export const ENDPOINTS = {
  events: {
    public: '/api/cms/public-events',
    detail: (id: string) => `/api/cms/events/${id}`,
  },
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    me: '/api/auth/me',
  },
  tickets: {
    mine: '/api/tickets/mine',
    detail: (id: string) => `/api/tickets/${id}`,
  },
  qr: {
    validate: '/api/qr/validate',
  },
  djs: {
    list: '/api/djs/list',
    detail: (id: string) => `/api/djs/${id}`,
  },
  promoter: {
    stats: '/api/promoter/stats',
    link: '/api/promoter/link',
  },
  checkout: {
    createSession: '/api/checkout/create-session',
    confirmPayment: (sessionId: string) => `/api/checkout/confirm/${sessionId}`,
  },
  feed: {
    list: '/api/feed',
    like: (postId: string) => `/api/feed/${postId}/like`,
  },
  pushNotifications: {
    register: '/api/push/register',
    unregister: '/api/push/unregister',
  },
  notificationPrefs: {
    get: '/api/user/notification-prefs',
    update: '/api/user/notification-prefs',
  },
  wallet: {
    applePass: (ticketId: string) => `/api/wallet/apple-pass/${ticketId}`,
    googlePass: (ticketId: string) => `/api/wallet/google-pass/${ticketId}`,
  },
  venues: {
    list: '/api/venues',
    detail: (id: string) => `/api/venues/${id}`,
  },
  djFollow: {
    follow: (djId: string) => `/api/djs/${djId}/follow`,
    unfollow: (djId: string) => `/api/djs/${djId}/unfollow`,
    tracks: (djId: string) => `/api/djs/${djId}/tracks`,
  },
  booking: {
    request: '/api/booking/request',
  },
  analytics: {
    events: '/api/analytics/events',
  },
};
