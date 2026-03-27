import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Event } from '../types';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { GlassCard } from './GlassCard';

interface EventCardProps {
  event: Event;
  onPress: () => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getLowestPrice(event: Event): string {
  if (!event.ticketTypes?.length) return 'Free';
  const lowest = Math.min(...event.ticketTypes.map((t) => t.price));
  if (lowest === 0) return 'Free';
  return `From $${lowest}`;
}

export function EventCard({ event, onPress }: EventCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <GlassCard noPadding>
        {event.coverImage ? (
          <Image source={{ uri: event.coverImage }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Ionicons name="musical-notes" size={40} color={Colors.primary} />
          </View>
        )}
        <View style={styles.content}>
          <View style={styles.dateRow}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateText}>{formatDate(event.date)}</Text>
            </View>
            {event.status === 'live' && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.venue} numberOfLines={1}>
              {event.venue}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.time}>{event.time}</Text>
          </View>
          <View style={styles.footer}>
            <Text style={styles.price}>{getLowestPrice(event)}</Text>
            {event.tags?.length ? (
              <View style={styles.tagsRow}>
                {event.tags.slice(0, 2).map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 180,
  },
  placeholderImage: {
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dateBadge: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  dateText: {
    color: Colors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.error,
    marginRight: 4,
  },
  liveText: {
    color: Colors.error,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  venue: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    flex: 1,
  },
  time: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  price: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
});
