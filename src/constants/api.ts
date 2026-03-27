import { Platform } from 'react-native';

const LOCAL_API = Platform.select({
  ios: 'http://localhost:3032',
  android: 'http://10.0.2.2:3032',
  default: 'http://localhost:3032',
});

export const API_BASE_URL = LOCAL_API;

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
};
