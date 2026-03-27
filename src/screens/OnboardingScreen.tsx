import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ViewToken,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { analytics } from '../services/analytics';

const { width } = Dimensions.get('window');
const ONBOARDING_KEY = 'tbp_onboarding_done';

interface OnboardingSlide {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    icon: 'flame',
    title: 'Discover Events',
    subtitle: 'Find the hottest nightlife, parties, and live music happening near you',
    color: Colors.primary,
  },
  {
    id: '2',
    icon: 'ticket',
    title: 'Get Tickets Instantly',
    subtitle: 'Purchase tickets in seconds. Your QR code is your entry pass',
    color: Colors.success,
  },
  {
    id: '3',
    icon: 'people',
    title: 'Share the Night',
    subtitle: 'Invite friends, follow DJs, and never miss an event again',
    color: Colors.accent,
  },
];

interface Props {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const flatListRef = useRef<FlatList>(null);
  const slideEnteredAt = useRef<number>(Date.now());
  const slidesViewed = useRef(new Set<string>(['1']));

  useEffect(() => {
    analytics.trackSlideView(slides[0].id, slides[0].title);
  }, []);

  const handleComplete = async () => {
    const current = slides[activeIndex];
    const dwellMs = Date.now() - slideEnteredAt.current;
    analytics.trackSlideExit(current.id, current.title, dwellMs);
    await analytics.trackOnboardingComplete(slidesViewed.current.size, slides.length);
    await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
    onComplete();
  };

  const handleSkip = async () => {
    const current = slides[activeIndex];
    const dwellMs = Date.now() - slideEnteredAt.current;
    analytics.trackSlideExit(current.id, current.title, dwellMs);
    analytics.trackOnboardingSkip(current.id, current.title);
    await analytics.trackOnboardingComplete(slidesViewed.current.size, slides.length);
    await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
    onComplete();
  };

  const handleNext = () => {
    if (activeIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      handleComplete();
    }
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        const newIndex = viewableItems[0].index;
        const prevIndex = activeIndexRef.current;
        const prevSlide = slides[prevIndex];
        const dwellMs = Date.now() - slideEnteredAt.current;

        if (newIndex !== prevIndex) {
          analytics.trackSlideExit(prevSlide.id, prevSlide.title, dwellMs);
        }

        const newSlide = slides[newIndex];
        slidesViewed.current.add(newSlide.id);
        analytics.trackSlideView(newSlide.id, newSlide.title);
        slideEnteredAt.current = Date.now();

        activeIndexRef.current = newIndex;
        setActiveIndex(newIndex);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
              <Ionicons name={item.icon as any} size={80} color={item.color} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextText}>
            {activeIndex === slides.length - 1 ? "Let's Go" : 'Next'}
          </Text>
          <Ionicons
            name={activeIndex === slides.length - 1 ? 'checkmark' : 'arrow-forward'}
            size={20}
            color={Colors.text}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const val = await SecureStore.getItemAsync(ONBOARDING_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: Spacing.lg,
    zIndex: 10,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  skipText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 50,
    gap: Spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surfaceLight,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  nextText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
});
