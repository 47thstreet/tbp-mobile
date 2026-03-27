import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, ENDPOINTS } from '../constants/api';
import { Event, Ticket, DJ, User, PromoterStats } from '../types';

const TOKEN_KEY = 'tbp_auth_token';

async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  events: {
    list: () => request<Event[]>(ENDPOINTS.events.public),
    detail: (id: string) => request<Event>(ENDPOINTS.events.detail(id)),
  },
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: User }>(ENDPOINTS.auth.login, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (data: { email: string; password: string; name: string }) =>
      request<{ token: string; user: User }>(ENDPOINTS.auth.register, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => request<User>(ENDPOINTS.auth.me),
  },
  tickets: {
    mine: () => request<Ticket[]>(ENDPOINTS.tickets.mine),
    detail: (id: string) => request<Ticket>(ENDPOINTS.tickets.detail(id)),
  },
  qr: {
    validate: (code: string) =>
      request<{ valid: boolean; ticket: Ticket }>(ENDPOINTS.qr.validate, {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),
  },
  djs: {
    list: () => request<DJ[]>(ENDPOINTS.djs.list),
    detail: (id: string) => request<DJ>(ENDPOINTS.djs.detail(id)),
  },
  promoter: {
    stats: () => request<PromoterStats>(ENDPOINTS.promoter.stats),
  },
};
