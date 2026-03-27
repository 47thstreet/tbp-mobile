import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/api';

const ANALYTICS_ENDPOINT = `${API_BASE_URL}/api/analytics/events`;
const FIRST_FLAGS_KEY = 'tbp_analytics_firsts';

type MilestoneEvent =
  | 'app_open'
  | 'onboarding_complete'
  | 'first_event_view'
  | 'first_ticket_purchase'
  | 'first_share';

type ReviewEvent =
  | 'review_prompt_shown'
  | 'review_prompt_completed';

type OnboardingEvent =
  | 'onboarding_slide_view'
  | 'onboarding_slide_exit'
  | 'onboarding_skip';

type AnalyticsEventName = MilestoneEvent | OnboardingEvent | ReviewEvent;

interface AnalyticsPayload {
  event: AnalyticsEventName;
  properties?: Record<string, string | number | boolean>;
  timestamp: string;
  platform: string;
}

let eventQueue: AnalyticsPayload[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL_MS = 5000;
const MAX_BATCH_SIZE = 20;

async function getFirstFlags(): Promise<Record<string, boolean>> {
  try {
    const raw = await SecureStore.getItemAsync(FIRST_FLAGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function setFirstFlag(key: string): Promise<void> {
  const flags = await getFirstFlags();
  flags[key] = true;
  await SecureStore.setItemAsync(FIRST_FLAGS_KEY, JSON.stringify(flags));
}

function enqueue(payload: AnalyticsPayload): void {
  eventQueue.push(payload);

  if (eventQueue.length >= MAX_BATCH_SIZE) {
    flush();
    return;
  }

  if (!flushTimer) {
    flushTimer = setTimeout(flush, FLUSH_INTERVAL_MS);
  }
}

async function flush(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (eventQueue.length === 0) return;

  const batch = eventQueue.splice(0, MAX_BATCH_SIZE);

  try {
    await fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
    });
  } catch {
    // Re-queue on failure — drop if queue is too large to avoid memory issues
    if (eventQueue.length < 100) {
      eventQueue.unshift(...batch);
    }
  }
}

function track(event: AnalyticsEventName, properties?: Record<string, string | number | boolean>): void {
  enqueue({
    event,
    properties,
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
  });
}

/**
 * Track a milestone event only once per device lifetime.
 * Returns true if the event was tracked (first time), false if already recorded.
 */
async function trackOnce(event: MilestoneEvent, properties?: Record<string, string | number | boolean>): Promise<boolean> {
  const flags = await getFirstFlags();
  if (flags[event]) return false;

  track(event, properties);
  await setFirstFlag(event);
  return true;
}

// -- Public API --

export const analytics = {
  /** Call on app startup */
  trackAppOpen(): void {
    track('app_open');
  },

  /** Track which onboarding slide the user is viewing and for how long */
  trackSlideView(slideId: string, slideTitle: string): void {
    track('onboarding_slide_view', { slideId, slideTitle });
  },

  /** Track when user leaves a slide (captures dwell time) */
  trackSlideExit(slideId: string, slideTitle: string, dwellMs: number): void {
    track('onboarding_slide_exit', { slideId, slideTitle, dwellMs });
  },

  /** Track when user taps Skip during onboarding */
  trackOnboardingSkip(lastSlideId: string, lastSlideTitle: string): void {
    track('onboarding_skip', { lastSlideId, lastSlideTitle });
  },

  /** Track onboarding completion (only fires once) */
  async trackOnboardingComplete(slidesViewed: number, totalSlides: number): Promise<void> {
    await trackOnce('onboarding_complete', { slidesViewed, totalSlides });
  },

  /** Track first event detail view (only fires once) */
  async trackFirstEventView(eventId: string): Promise<void> {
    await trackOnce('first_event_view', { eventId });
  },

  /** Track first ticket purchase (only fires once) */
  async trackFirstTicketPurchase(eventId: string, ticketType: string, price: number): Promise<void> {
    await trackOnce('first_ticket_purchase', { eventId, ticketType, price });
  },

  /** Track first share action (only fires once) */
  async trackFirstShare(eventId: string): Promise<void> {
    await trackOnce('first_share', { eventId });
  },

  /** Track when the store review prompt is shown */
  trackReviewPromptShown(): void {
    track('review_prompt_shown');
  },

  /** Track when the store review prompt is completed */
  trackReviewPromptCompleted(): void {
    track('review_prompt_completed');
  },

  /** Force flush any queued events (call on app background) */
  flush,
};
