import * as StoreReview from 'expo-store-review';
import * as SecureStore from 'expo-secure-store';
import { analytics } from './analytics';

const ATTENDANCE_COUNT_KEY = 'tbp_attendance_count';
const REVIEW_COOLDOWN_KEY = 'tbp_review_cooldown_until';

const ATTENDANCE_THRESHOLD = 3;
const COOLDOWN_DAYS = 90;

async function getAttendanceCount(): Promise<number> {
  try {
    const raw = await SecureStore.getItemAsync(ATTENDANCE_COUNT_KEY);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

async function setAttendanceCount(count: number): Promise<void> {
  await SecureStore.setItemAsync(ATTENDANCE_COUNT_KEY, String(count));
}

async function isInCooldown(): Promise<boolean> {
  try {
    const raw = await SecureStore.getItemAsync(REVIEW_COOLDOWN_KEY);
    if (!raw) return false;
    return Date.now() < parseInt(raw, 10);
  } catch {
    return false;
  }
}

async function setCooldown(): Promise<void> {
  const until = Date.now() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  await SecureStore.setItemAsync(REVIEW_COOLDOWN_KEY, String(until));
}

export const reviewPrompt = {
  /**
   * Record a ticket purchase / event attendance.
   * Returns true if the review prompt should be shown.
   */
  async recordAttendance(): Promise<boolean> {
    const count = await getAttendanceCount();
    const newCount = count + 1;
    await setAttendanceCount(newCount);

    if (newCount < ATTENDANCE_THRESHOLD) return false;

    if (await isInCooldown()) return false;

    const available = await StoreReview.isAvailableAsync();
    if (!available) return false;

    return true;
  },

  /**
   * Show the native store review prompt.
   * Tracks review_prompt_shown and review_prompt_completed analytics events.
   */
  async requestReview(): Promise<void> {
    analytics.trackReviewPromptShown();

    try {
      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
        analytics.trackReviewPromptCompleted();
      }
    } catch {
      // Review prompt failed silently -- OS may throttle
    }

    await setCooldown();
  },
};
