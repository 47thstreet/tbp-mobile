import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import { Event } from '../types';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

interface Props {
  event: Event;
}

export function AddToCalendarButton({ event }: Props) {
  const handleAddToCalendar = async () => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Calendar access is needed to add events. Please enable it in Settings.'
        );
        return;
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar =
        Platform.OS === 'ios'
          ? calendars.find((c) => c.allowsModifications && c.source?.name === 'iCloud') ||
            calendars.find((c) => c.allowsModifications)
          : calendars.find((c) => c.allowsModifications && c.isPrimary) ||
            calendars.find((c) => c.allowsModifications);

      if (!defaultCalendar) {
        Alert.alert('Error', 'No writable calendar found on this device.');
        return;
      }

      const startDate = new Date(`${event.date}T${convertTo24h(event.time)}`);
      const endDate = event.endTime
        ? new Date(`${event.date}T${convertTo24h(event.endTime)}`)
        : new Date(startDate.getTime() + 3 * 60 * 60 * 1000); // Default 3h

      // If end time is before start (crosses midnight), add a day
      if (endDate < startDate) {
        endDate.setDate(endDate.getDate() + 1);
      }

      await Calendar.createEventAsync(defaultCalendar.id, {
        title: event.title,
        location: event.venueAddress || event.venue,
        notes: event.description || '',
        startDate,
        endDate,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      Alert.alert('Added', `"${event.title}" has been added to your calendar.`);
    } catch (err: any) {
      Alert.alert('Error', 'Could not add event to calendar.');
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleAddToCalendar}>
      <Ionicons name="calendar-outline" size={18} color={Colors.text} />
      <Text style={styles.buttonText}>Add to Calendar</Text>
    </TouchableOpacity>
  );
}

function convertTo24h(timeStr: string): string {
  // Handle already 24h format
  if (/^\d{1,2}:\d{2}$/.test(timeStr)) return timeStr.padStart(5, '0');

  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return '20:00'; // Default fallback

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return `${hours.toString().padStart(2, '0')}:${minutes}`;
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
});
