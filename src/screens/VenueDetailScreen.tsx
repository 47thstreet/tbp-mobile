import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Venue } from '../types';
import { api } from '../services/api';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { GlassCard } from '../components/GlassCard';
import { LoadingScreen } from '../components/LoadingScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'VenueDetail'>;

export function VenueDetailScreen({ route, navigation }: Props) {
  const { venueId } = route.params;
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.venues
      .detail(venueId)
      .then(setVenue)
      .catch(() => Alert.alert('Error', 'Could not load venue'))
      .finally(() => setLoading(false));
  }, [venueId]);

  if (loading || !venue) return <LoadingScreen />;

  const socialButtons = [
    { key: 'instagram', icon: 'logo-instagram' as const, url: venue.socialLinks?.instagram },
    { key: 'website', icon: 'globe-outline' as const, url: venue.socialLinks?.website },
  ].filter((s) => s.url);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {venue.coverImage || venue.photo ? (
        <Image source={{ uri: venue.coverImage || venue.photo }} style={styles.hero} />
      ) : (
        <View style={[styles.hero, styles.placeholderHero]}>
          <Ionicons name="business" size={80} color={Colors.textMuted} />
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.name}>{venue.name}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{venue.address}, {venue.city}</Text>
        </View>

        {venue.capacity && (
          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.metaText}>Capacity: {venue.capacity.toLocaleString()}</Text>
          </View>
        )}

        {socialButtons.length > 0 && (
          <View style={styles.socialRow}>
            {socialButtons.map((s) => (
              <TouchableOpacity
                key={s.key}
                style={styles.socialButton}
                onPress={() => Linking.openURL(s.url!)}
              >
                <Ionicons name={s.icon} size={22} color={Colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {venue.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{venue.description}</Text>
          </View>
        )}

        {venue.amenities?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {venue.amenities.map((amenity) => (
                <View key={amenity} style={styles.amenityChip}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {venue.upcomingEvents?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            {venue.upcomingEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
              >
                <GlassCard noPadding style={styles.eventCard}>
                  {event.coverImage ? (
                    <Image source={{ uri: event.coverImage }} style={styles.eventImage} />
                  ) : (
                    <View style={[styles.eventImage, styles.eventImagePlaceholder]}>
                      <Ionicons name="musical-notes" size={24} color={Colors.primary} />
                    </View>
                  )}
                  <View style={styles.eventContent}>
                    <Text style={styles.eventName} numberOfLines={1}>{event.title}</Text>
                    <Text style={styles.eventDate}>{event.date} at {event.time}</Text>
                    {event.djs?.length ? (
                      <Text style={styles.eventDJs} numberOfLines={1}>
                        {event.djs.map((d) => d.name).join(', ')}
                      </Text>
                    ) : null}
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.noEvents}>
            <Ionicons name="calendar-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.noEventsText}>No upcoming events at this venue</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xxl },
  hero: { width: '100%', height: 280 },
  placeholderHero: {
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: Spacing.lg, marginTop: -Spacing.lg },
  name: {
    color: Colors.text,
    fontSize: FontSize.hero,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  metaText: { color: Colors.textSecondary, fontSize: FontSize.md, flex: 1 },
  socialRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  description: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 22 },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  amenityText: { color: Colors.text, fontSize: FontSize.sm },
  eventCard: { flexDirection: 'row', marginBottom: Spacing.sm, overflow: 'hidden' },
  eventImage: { width: 80, height: 80 },
  eventImagePlaceholder: {
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventContent: { flex: 1, padding: Spacing.sm, justifyContent: 'center' },
  eventName: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
  eventDate: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },
  eventDJs: { color: Colors.primaryLight, fontSize: FontSize.xs, marginTop: 2 },
  noEvents: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  noEventsText: { color: Colors.textMuted, fontSize: FontSize.md },
});
