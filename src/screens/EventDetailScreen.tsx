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
import { RootStackParamList, Event } from '../types';
import { api } from '../services/api';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { GlassCard } from '../components/GlassCard';
import { LoadingScreen } from '../components/LoadingScreen';
import { ShareEventButton } from '../components/ShareEventButton';
import { AddToCalendarButton } from '../components/AddToCalendarButton';
import { scheduleEventReminder } from '../services/notifications';

type Props = NativeStackScreenProps<RootStackParamList, 'EventDetail'>;

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function EventDetailScreen({ route, navigation }: Props) {
  const { eventId } = route.params;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.events
      .detail(eventId)
      .then(setEvent)
      .catch(() => Alert.alert('Error', 'Could not load event details'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const openCheckout = (ticketTypeId: string, ticketTypeName: string, price: number) => {
    navigation.navigate('Checkout', {
      eventId,
      ticketTypeId,
      ticketTypeName,
      price,
    });
  };

  useEffect(() => {
    if (event) {
      const eventDate = new Date(`${event.date}T${event.time || '20:00'}`);
      scheduleEventReminder(event.id, event.title, eventDate, event.venue).catch(() => {});
    }
  }, [event]);

  if (loading || !event) return <LoadingScreen />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {event.coverImage ? (
        <Image source={{ uri: event.coverImage }} style={styles.hero} />
      ) : (
        <View style={[styles.hero, styles.placeholderHero]}>
          <Ionicons name="musical-notes" size={60} color={Colors.primary} />
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.title}>{event.title}</Text>

        <GlassCard style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={20} color={Colors.primary} />
            <View>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{formatFullDate(event.date)}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="time" size={20} color={Colors.primary} />
            <View>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>
                {event.time}
                {event.endTime ? ` - ${event.endTime}` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Venue</Text>
              <Text style={styles.infoValue}>{event.venue}</Text>
              {event.venueAddress && (
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL(
                      `maps:?q=${encodeURIComponent(event.venueAddress!)}`
                    )
                  }
                >
                  <Text style={styles.mapLink}>Open in Maps</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </GlassCard>

        {event.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        ) : null}

        {event.djs?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lineup</Text>
            <View style={styles.djList}>
              {event.djs.map((dj) => (
                <TouchableOpacity
                  key={dj.id}
                  style={styles.djChip}
                  onPress={() => navigation.navigate('DJDetail', { djId: dj.id })}
                >
                  {dj.photo ? (
                    <Image source={{ uri: dj.photo }} style={styles.djPhoto} />
                  ) : (
                    <View style={[styles.djPhoto, styles.djPhotoPlaceholder]}>
                      <Ionicons name="person" size={16} color={Colors.textMuted} />
                    </View>
                  )}
                  <Text style={styles.djName}>{dj.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.actionButtons}>
          <View style={{ flex: 1 }}>
            <ShareEventButton event={event} />
          </View>
          <View style={{ flex: 1 }}>
            <AddToCalendarButton event={event} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tickets</Text>
          {event.ticketTypes?.length ? (
            event.ticketTypes.map((ticket) => (
              <GlassCard key={ticket.id} style={styles.ticketCard}>
                <View style={styles.ticketRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ticketName}>{ticket.name}</Text>
                    {ticket.description && (
                      <Text style={styles.ticketDesc}>{ticket.description}</Text>
                    )}
                    <Text style={styles.ticketAvail}>
                      {ticket.available > 0
                        ? `${ticket.available} remaining`
                        : 'Sold out'}
                    </Text>
                  </View>
                  <View style={styles.ticketPriceCol}>
                    <Text style={styles.ticketPrice}>
                      {ticket.price === 0
                        ? 'Free'
                        : `$${ticket.price.toFixed(2)}`}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.buyButton,
                        ticket.available === 0 && styles.buyButtonDisabled,
                      ]}
                      disabled={ticket.available === 0}
                      onPress={() => openCheckout(ticket.id, ticket.name, ticket.price)}
                    >
                      <Text style={styles.buyButtonText}>
                        {ticket.available > 0 ? 'Get Tickets' : 'Sold Out'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </GlassCard>
            ))
          ) : (
            <Text style={styles.noTickets}>Tickets not yet available</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: Spacing.xxl,
  },
  hero: {
    width: '100%',
    height: 260,
  },
  placeholderHero: {
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: Spacing.lg,
    marginTop: -Spacing.lg,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    marginBottom: Spacing.md,
  },
  infoCard: {
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  infoLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  infoValue: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  mapLink: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  djList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  djChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingRight: Spacing.md,
    paddingLeft: 4,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  djPhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  djPhotoPlaceholder: {
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  djName: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  ticketCard: {
    marginBottom: Spacing.sm,
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketName: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  ticketDesc: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  ticketAvail: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 4,
  },
  ticketPriceCol: {
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  ticketPrice: {
    color: Colors.primary,
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  buyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  buyButtonDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
  buyButtonText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  noTickets: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
  },
});
