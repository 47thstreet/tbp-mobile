import { Platform, Linking } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, ENDPOINTS } from '../constants/api';

const TOKEN_KEY = 'tbp_auth_token';

async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function addToAppleWallet(ticketId: string): Promise<void> {
  const token = await getToken();
  const url = `${API_BASE_URL}${ENDPOINTS.wallet.applePass(ticketId)}`;

  const destination = new File(Paths.cache, `ticket-${ticketId}.pkpass`);

  const downloaded = await File.downloadFileAsync(url, destination, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!downloaded.exists) {
    throw new Error('Failed to download Apple Wallet pass');
  }

  const fileUri = downloaded.uri;
  const canOpen = await Linking.canOpenURL(fileUri);
  if (!canOpen) {
    throw new Error('Unable to open Apple Wallet. Please ensure Wallet is installed.');
  }

  await Linking.openURL(fileUri);
}

export async function addToGoogleWallet(ticketId: string): Promise<void> {
  const token = await getToken();
  const url = `${API_BASE_URL}${ENDPOINTS.wallet.googlePass(ticketId)}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error('Failed to get Google Wallet pass');
  }

  const { saveUrl } = await response.json() as { saveUrl: string };

  const canOpen = await Linking.canOpenURL(saveUrl);
  if (!canOpen) {
    throw new Error('Unable to open Google Wallet. Please install Google Wallet.');
  }

  await Linking.openURL(saveUrl);
}

export function isAppleWalletAvailable(): boolean {
  return Platform.OS === 'ios';
}

export function isGoogleWalletAvailable(): boolean {
  return Platform.OS === 'android';
}
