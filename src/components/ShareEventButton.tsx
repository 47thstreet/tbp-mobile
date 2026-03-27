import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Share, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Event } from '../types';
import { API_BASE_URL } from '../constants/api';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { analytics } from '../services/analytics';

interface Props {
  event: Event;
  compact?: boolean;
}

export function ShareEventButton({ event, compact }: Props) {
  const handleShare = async () => {
    const url = `${API_BASE_URL}/events/${event.id}`;
    const message = `Check out ${event.title} at ${event.venue} on ${event.date}`;

    try {
      const result = await Share.share(
        Platform.OS === 'ios'
          ? { message, url }
          : { message: `${message}\n${url}` }
      );
      if (result.action === Share.sharedAction) {
        analytics.trackFirstShare(event.id);
      }
    } catch {
      // User cancelled
    }
  };

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactButton} onPress={handleShare}>
        <Ionicons name="share-outline" size={22} color={Colors.primary} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.button} onPress={handleShare}>
      <Ionicons name="share-outline" size={18} color={Colors.text} />
      <Text style={styles.buttonText}>Share Event</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: Spacing.sm,
  },
  buttonText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  compactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
});
