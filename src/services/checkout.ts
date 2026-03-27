import { ENDPOINTS } from '../constants/api';
import { CheckoutSession, CheckoutResult } from '../types';
import { API_BASE_URL } from '../constants/api';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'tbp_auth_token';

async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function authRequest<T>(endpoint: string, body?: object): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function createCheckoutSession(
  eventId: string,
  ticketTypeId: string,
  quantity: number = 1
): Promise<CheckoutSession> {
  return authRequest<CheckoutSession>(ENDPOINTS.checkout.createSession, {
    eventId,
    ticketTypeId,
    quantity,
  });
}

export async function confirmPayment(sessionId: string): Promise<CheckoutResult> {
  return authRequest<CheckoutResult>(ENDPOINTS.checkout.confirmPayment(sessionId));
}
